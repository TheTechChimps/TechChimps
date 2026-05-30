import { addInboxMessage, ensureCustomerForOrder } from "@/lib/accounts";
import { createOrderEmail, sendTransactionalEmail } from "@/lib/email";
import { appendLiveChatMessage } from "@/lib/live-chat";
import type { OrderRecord } from "@/lib/orders";
import { readJson, writeJson } from "@/lib/storage";
import { formatPrice } from "@/lib/utils";

export type AutomationWebhookPayload = {
  event?: string;
  order?: Partial<OrderRecord> & {
    reference?: string;
  };
};

export type AutomationEventRecord = {
  id: string;
  type: "studio-alert" | "crm-sync" | "email-automation" | "deploy-hook";
  event: string;
  reference: string;
  status: "received" | "synced" | "queued" | "sent" | "failed";
  detail: string;
  createdAt: string;
  order?: AutomationWebhookPayload["order"];
};

export type CrmProjectRecord = {
  reference: string;
  amount?: number;
  chatSessionId?: string;
  contactEmail?: string;
  contactName?: string;
  events: string[];
  latestEvent: string;
  serviceName?: string;
  status?: string;
  syncedAt: string;
};

const AUTOMATION_STORE = "techchimps-automation";
const EVENT_PREFIX = "events/";
const CRM_PREFIX = "crm/";

function now() {
  return new Date().toISOString();
}

function eventKey(id: string) {
  return `${EVENT_PREFIX}${id}`;
}

function crmKey(reference: string) {
  return `${CRM_PREFIX}${reference}`;
}

export function isAutomationRequestAuthorized(request: Request) {
  const configuredToken = process.env.AUTOMATION_WEBHOOK_TOKEN;
  if (!configuredToken) return false;

  const { searchParams } = new URL(request.url);
  const suppliedToken = searchParams.get("token") || request.headers.get("x-techchimps-automation-token");
  return suppliedToken === configuredToken;
}

export function parseAutomationPayload(payload: AutomationWebhookPayload | null) {
  const event = payload?.event?.trim() || "automation.event";
  const order = payload?.order;
  const reference = order?.reference?.trim();

  if (!order || !reference) {
    throw new Error("Automation payload must include an order reference.");
  }

  return { event, order, reference };
}

export async function recordAutomationEvent(input: {
  detail: string;
  event: string;
  order?: AutomationWebhookPayload["order"];
  reference: string;
  status: AutomationEventRecord["status"];
  type: AutomationEventRecord["type"];
}) {
  const record: AutomationEventRecord = {
    id: crypto.randomUUID(),
    createdAt: now(),
    ...input
  };

  await writeJson(AUTOMATION_STORE, eventKey(record.id), record);
  return record;
}

export async function syncCrmProject(event: string, order: AutomationWebhookPayload["order"] & { reference: string }) {
  const existing = await readJson<CrmProjectRecord>(AUTOMATION_STORE, crmKey(order.reference));
  const events = Array.from(new Set([...(existing?.events ?? []), event]));
  const record: CrmProjectRecord = {
    reference: order.reference,
    amount: order.amount,
    chatSessionId: order.chatSessionId,
    contactEmail: order.contactEmail,
    contactName: order.contactName,
    events,
    latestEvent: event,
    serviceName: order.serviceName,
    status: order.status,
    syncedAt: now()
  };

  await writeJson(AUTOMATION_STORE, crmKey(order.reference), record);
  await recordAutomationEvent({
    detail: "Order synced into the TechChimps CRM automation store.",
    event,
    order,
    reference: order.reference,
    status: "synced",
    type: "crm-sync"
  });

  return record;
}

export async function createStudioAlert(event: string, order: AutomationWebhookPayload["order"] & { reference: string }) {
  const paymentEvent = event.includes("payment") || order.status?.includes("paid");
  const price = typeof order.amount === "number" ? formatPrice(order.amount, order.priceSuffix) : "a custom amount";
  const serviceName = order.serviceName || "a TechChimps service";
  const contactName = order.contactName || "A customer";
  const detail = `${contactName} needs attention for ${serviceName} (${order.reference}). ${paymentEvent ? `Payment/order value: ${price}.` : "Review the request and reply if needed."}`;

  if (order.chatSessionId) {
    await appendLiveChatMessage({
      body: `Studio alert: ${detail}`,
      priority: paymentEvent ? "payment" : "waiting",
      role: "system",
      sessionId: order.chatSessionId
    });
  }

  return recordAutomationEvent({
    detail,
    event,
    order,
    reference: order.reference,
    status: "received",
    type: "studio-alert"
  });
}

export async function queueCustomerEmail(event: string, order: OrderRecord) {
  const customer = await ensureCustomerForOrder(order);
  const outboundEmail = createOrderEmail(event, order);
  const subject = event.includes("payment")
    ? `Payment confirmed for ${order.serviceName}`
    : event.includes("offer")
      ? `Your ${order.serviceName} offer is being reviewed`
      : `Your ${order.serviceName} request is moving`;
  const body = event.includes("payment")
    ? "Your payment is confirmed and your live support thread is open. Send any extra details there whenever you are ready."
    : event.includes("offer")
      ? "Your custom or discounted offer is in the TechChimps queue. We will review it and reply with a friendly next step."
      : "Your request has been received by TechChimps. We will keep updates clear and easy to follow.";

  await addInboxMessage({
    author: "Studio support",
    body,
    projectReference: order.reference,
    subject,
    userId: customer.id
  });

  const emailResult = await sendTransactionalEmail({
    ...outboundEmail,
    idempotencyKey: `${event}-${order.reference}`,
    to: customer.email
  }).catch((error): Awaited<ReturnType<typeof sendTransactionalEmail>> => ({
    detail: error instanceof Error ? error.message : "Outbound email request failed.",
    provider: "resend",
    status: "failed"
  }));

  return recordAutomationEvent({
    detail: `Customer portal message queued for ${customer.email}. ${emailResult.detail}`,
    event,
    order,
    reference: order.reference,
    status: emailResult.status === "sent" ? "sent" : emailResult.status === "failed" ? "failed" : "queued",
    type: "email-automation"
  });
}
