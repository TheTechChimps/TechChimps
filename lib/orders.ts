import { services, type Service } from "@/data/services";
import { listJson, readJson, writeJson } from "@/lib/storage";

export type OfferMode = "standard" | "custom" | "discount";

export type OrderStatus =
  | "quote_saved"
  | "offer_waiting_review"
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
  serviceAnswers?: StructuredOrderAnswer[];
  contactName: string;
  contactEmail: string;
  estimate?: number;
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

export type OrderRecord = {
  reference: string;
  status: OrderStatus;
  serviceSlug: string;
  serviceName: string;
  serviceCategory: string;
  amount: number;
  baseAmount: number;
  isSubscription: boolean;
  priceSuffix?: string;
  offerMode: OfferMode;
  offerAmount?: number;
  offerReason?: string;
  attachmentNames: string[];
  budget: string;
  timeline: string;
  deliverySpeed: string;
  completionDate: string;
  goals: string;
  serviceAnswers: StructuredOrderAnswer[];
  contactName: string;
  contactEmail: string;
  chatSessionId: string;
  stripeSessionId?: string;
  uploadBatchId?: string;
  uploadedFiles?: {
    key: string;
    name: string;
    size: number;
    type: string;
  }[];
  stripePaymentStatus?: string;
  paidAt?: string;
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
  return `TC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}

export function calculateServiceEstimate(input: Pick<OrderInput, "deliverySpeed" | "goals" | "timeline">, service: Service) {
  if (service.priceSuffix) return service.price;

  const timelineMultiplier = timelineMultipliers[input.timeline] ?? 1;
  const deliveryMultiplier = deliveryMultipliers[input.deliverySpeed || "standard"] ?? 1;
  const customComplexity = input.goals.length > 220 ? 80 : input.goals.length > 100 ? 40 : 0;

  return Math.round((service.price * timelineMultiplier * deliveryMultiplier + customComplexity) / 5) * 5;
}

export function parseOfferAmount(value?: string) {
  if (!value) return undefined;
  const amount = Number.parseFloat(value);
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  return Math.round(amount * 100) / 100;
}

export function createOrderRecord(input: OrderInput, status: OrderStatus): OrderRecord {
  const service = getServiceBySlug(input.serviceType);

  if (!service) {
    throw new Error("Unknown service type.");
  }

  const offerMode = input.offerMode ?? "standard";
  const offerAmount = parseOfferAmount(input.offerAmount);
  const baseAmount = calculateServiceEstimate(input, service);
  const amount = offerMode === "standard" ? baseAmount : offerAmount ?? baseAmount;
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

export async function createOrder(input: OrderInput, status: OrderStatus) {
  return saveOrder(createOrderRecord(input, status));
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
  return orders.filter((order) => order.status === "paid_waiting_support" || order.status === "offer_waiting_review");
}
