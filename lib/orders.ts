import { services, type Service } from "@/data/services";
import { applyStoredDiscount } from "@/lib/discount-code-store";
import { listJson, readJson, writeJson } from "@/lib/storage";

export type OfferMode = "standard" | "custom" | "discount";

export type OrderStatus =
  | "quote_saved"
  | "offer_waiting_review"
  | "offer_declined"
  | "custom_request_waiting_review"
  | "checkout_started"
  | "payment_pending"
  | "paid_waiting_support"
  | "support_connected";

export type OrderInput = {
  attachmentNames?: string[];
  serviceType: string;
  budget: string;
  timeline: string;
  deliverySpeed: string;
  completionDate: string;
  goals: string;
  creativeControl?: boolean;
  serviceAnswers?: StructuredOrderAnswer[];
  contactName: string;
  contactEmail: string;
  estimate?: number;
  discountCode?: string;
  offerMode?: OfferMode;
  offerAmount?: string;
  offerReason?: string;
  uploadBatchId?: string;
  uploadedFiles?: {
    key: string;
    name: string;
    size: number;
    type: string;
  }[];
};

export type StructuredOrderAnswer = {
  answer: string;
  id: string;
  label: string;
  prompt: string;
};

export type AutomationResult = {
  name: string;
  status: "ready" | "sent" | "skipped" | "failed" | "retried";
  detail: string;
  createdAt: string;
};

export type OrderRefund = {
  id: string;
  amount: number;
  createdAt: string;
  status: string;
};

export type OrderRecord = {
  reference: string;
  status: OrderStatus;
  serviceSlug: string;
  serviceName: string;
  serviceCategory: string;
  amount: number;
  baseAmount: number;
  discountAmount?: number;
  discountCode?: string;
  discountPercent?: number;
  originalAmount?: number;
  isSubscription: boolean;
  priceSuffix?: string;
  offerMode: OfferMode;
  offerAmount?: number;
  offerCheckoutUrl?: string;
  offerDecision?: "accepted" | "declined";
  offerDecisionAt?: string;
  offerReason?: string;
  attachmentNames: string[];
  budget: string;
  timeline: string;
  deliverySpeed: string;
  completionDate: string;
  goals: string;
  creativeControl: boolean;
  serviceAnswers: StructuredOrderAnswer[];
  contactName: string;
  contactEmail: string;
  chatSessionId: string;
  stripeSessionId?: string;
  paymentMethod?: string;
  paymentCurrency?: string;
  uploadBatchId?: string;
  uploadedFiles?: {
    key: string;
    name: string;
    size: number;
    type: string;
  }[];
  stripePaymentStatus?: string;
  paidAt?: string;
  refundedAmount?: number;
  refundStatus?: "partial" | "full";
  refunds?: OrderRefund[];
  finalSignoffStatus?: "pending" | "signed" | "void";
  finalSignoffToken?: string;
  finalSignoffSignedAt?: string;
  chatConnectedAt?: string;
  automationLog: AutomationResult[];
  createdAt: string;
  updatedAt: string;
};

const ORDER_STORE = "techchimps-orders";
const ORDER_PREFIX = "orders/";

const deliveryMultipliers: Record<string, number> = {
  standard: 1,
  priority: 1.2,
  express: 1.35,
  rush50: 1.5
};

const timelineMultipliers: Record<string, number> = {
  "one-day": 1.6,
  "two-day": 1.45,
  "three-day": 1.3,
  "this-week": 1.15,
  "this-month": 1,
  flexible: 0.95
};

function orderKey(reference: string) {
  return `${ORDER_PREFIX}${reference}`;
}

function generateReference() {
  const troopWords = ["BANANA", "CHIMP", "VINE", "PEEL", "BOUNCE", "JUNGLE", "SPARK", "SWING"];
  const word = troopWords[Math.floor(Math.random() * troopWords.length)];
  const timeCode = Date.now().toString(36).toUpperCase().slice(-4);
  const randomCode = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `TC-${word}-${timeCode}-${randomCode}`;
}

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}

export function calculateServiceEstimate(input: Pick<OrderInput, "deliverySpeed" | "goals" | "serviceAnswers" | "timeline">, service: Service) {
  if (service.slug === "custom-request") return 0;
  if (service.priceSuffix) return service.price;

  const timelineMultiplier = timelineMultipliers[input.timeline] ?? 1;
  const deliveryMultiplier = deliveryMultipliers[input.deliverySpeed || "standard"] ?? 1;
  const detailLength = input.goals.length + (input.serviceAnswers?.reduce((total, answer) => total + answer.answer.length, 0) ?? 0);
  const customComplexity = detailLength > 650 ? 90 : detailLength > 360 ? 55 : detailLength > 180 ? 25 : 0;

  return Math.round((service.price * timelineMultiplier * deliveryMultiplier + customComplexity) / 5) * 5;
}

export function parseOfferAmount(value?: string) {
  if (!value) return undefined;
  const amount = Number.parseFloat(value);
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  return Math.round(amount * 100) / 100;
}

export async function createOrderRecord(input: OrderInput, status: OrderStatus): Promise<OrderRecord> {
  const service = getServiceBySlug(input.serviceType);

  if (!service) {
    throw new Error("Unknown service type.");
  }

  const offerMode = input.offerMode ?? "standard";
  const offerAmount = parseOfferAmount(input.offerAmount);
  const baseAmount = calculateServiceEstimate(input, service);
  const undiscountedAmount = offerMode === "standard" ? baseAmount : offerAmount ?? baseAmount;
  const discount =
    offerMode === "standard"
      ? await applyStoredDiscount(undiscountedAmount, input.discountCode, {
          isSubscription: Boolean(service.priceSuffix),
          priceSuffix: service.priceSuffix,
          serviceCategory: service.category
        })
      : await applyStoredDiscount(undiscountedAmount);
  const amount = discount.amount;
  const reference = generateReference();
  const now = new Date().toISOString();

  return {
    reference,
    status,
    serviceSlug: service.slug,
    serviceName: service.name,
    serviceCategory: service.category,
    amount,
    baseAmount,
    discountAmount: discount.discountAmount || undefined,
    discountCode: discount.code,
    discountPercent: discount.percentOff || undefined,
    originalAmount: discount.discountAmount ? discount.originalAmount : undefined,
    isSubscription: Boolean(service.priceSuffix),
    priceSuffix: service.priceSuffix,
    offerMode,
    offerAmount,
    offerReason: input.offerReason?.trim(),
    attachmentNames: input.attachmentNames?.map((name) => name.trim()).filter(Boolean).slice(0, 10) ?? [],
    budget: input.budget,
    timeline: input.timeline,
    deliverySpeed: input.deliverySpeed || "standard",
    completionDate: input.completionDate,
    goals: input.goals.trim(),
    creativeControl: Boolean(input.creativeControl),
    serviceAnswers:
      input.serviceAnswers
        ?.map((item) => ({
          answer: item.answer.trim(),
          id: item.id.trim(),
          label: item.label.trim(),
          prompt: item.prompt.trim()
        }))
        .filter((item) => item.answer && item.id && item.label)
        .slice(0, 20) ?? [],
    contactName: input.contactName.trim(),
    contactEmail: input.contactEmail.trim(),
    chatSessionId: `order-${reference.toLowerCase()}`,
    uploadBatchId: input.uploadBatchId,
    uploadedFiles: input.uploadedFiles?.slice(0, 10),
    automationLog: [],
    createdAt: now,
    updatedAt: now
  };
}

export async function saveOrder(order: OrderRecord) {
  await writeJson(ORDER_STORE, orderKey(order.reference), order);
  return order;
}

export async function deleteOrder(reference: string) {
  await writeJson<OrderRecord | null>(ORDER_STORE, orderKey(reference), null);
}

export async function createOrder(input: OrderInput, status: OrderStatus) {
  return saveOrder(await createOrderRecord(input, status));
}

export async function getOrder(reference: string) {
  return readJson<OrderRecord>(ORDER_STORE, orderKey(reference));
}

export async function listOrders() {
  const orders = await listJson<OrderRecord>(ORDER_STORE, ORDER_PREFIX);
  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function findOrderByStripeSessionId(stripeSessionId: string) {
  const orders = await listOrders();
  return orders.find((order) => order.stripeSessionId === stripeSessionId) ?? null;
}

export async function updateOrder(reference: string, updater: (order: OrderRecord) => OrderRecord) {
  const order = await getOrder(reference);
  if (!order) return null;

  const updated = {
    ...updater(order),
    updatedAt: new Date().toISOString()
  };

  await saveOrder(updated);
  return updated;
}

export async function addAutomationResult(reference: string, result: Omit<AutomationResult, "createdAt">) {
  return updateOrder(reference, (order) => ({
    ...order,
    automationLog: [
      ...order.automationLog,
      {
        ...result,
        createdAt: new Date().toISOString()
      }
    ].slice(-30)
  }));
}

export async function getWaitingOrders() {
  const orders = await listOrders();
  return orders.filter(
    (order) =>
      order.status === "paid_waiting_support" ||
      order.status === "offer_waiting_review" ||
      order.status === "custom_request_waiting_review"
  );
}

export async function findActiveCustomerTicket(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;

  const orders = await getWaitingOrders();
  return (
    orders.find((order) => order.contactEmail.trim().toLowerCase() === normalizedEmail) ?? null
  );
}

export async function archiveOrderChatSession(sessionId: string) {
  const orders = await listOrders();
  const order = orders.find((item) => item.chatSessionId === sessionId);

  if (!order) return null;

  const waitingStatuses: OrderStatus[] = [
    "paid_waiting_support",
    "offer_waiting_review",
    "custom_request_waiting_review"
  ];

  if (!waitingStatuses.includes(order.status)) return order;

  const now = new Date().toISOString();

  return updateOrder(order.reference, (current) => ({
    ...current,
    chatConnectedAt: current.chatConnectedAt ?? now,
    status: "support_connected"
  }));
}

export async function archiveWaitingOrders() {
  const waitingOrders = await getWaitingOrders();
  const now = new Date().toISOString();

  await Promise.all(
    waitingOrders.map((order) =>
      updateOrder(order.reference, (current) => ({
        ...current,
        chatConnectedAt: current.chatConnectedAt ?? now,
        status: "support_connected"
      }))
    )
  );

  return waitingOrders.length;
}
