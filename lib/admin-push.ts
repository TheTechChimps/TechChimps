import { createHash, randomUUID } from "crypto";
import webPush, { type PushSubscription } from "web-push";
import type { OrderRecord } from "@/lib/orders";
import { listJson, writeJson } from "@/lib/storage";
import { formatPrice } from "@/lib/utils";

export type StoredAdminPushSubscription = {
  id: string;
  endpoint: string;
  subscription: PushSubscription;
  label?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
  lastSentAt?: string;
};

export type AdminPushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  kind?: "chat" | "order" | "payment" | "offer" | "system";
};

const ADMIN_PUSH_STORE = "techchimps-admin-push";
const SUBSCRIPTION_PREFIX = "subscriptions/";

function now() {
  return new Date().toISOString();
}

function endpointKey(endpoint: string) {
  return `${SUBSCRIPTION_PREFIX}${createHash("sha256").update(endpoint).digest("hex")}`;
}

function getPushConfig() {
  const publicKey = process.env.NEXT_PUBLIC_ADMIN_VAPID_PUBLIC_KEY || process.env.ADMIN_VAPID_PUBLIC_KEY || "";
  const privateKey = process.env.ADMIN_VAPID_PRIVATE_KEY || "";
  const subject = process.env.ADMIN_VAPID_SUBJECT || `mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || "techchimps@proton.me"}`;

  return {
    privateKey,
    publicKey,
    ready: Boolean(publicKey && privateKey),
    subject
  };
}

function configureWebPush() {
  const config = getPushConfig();
  if (!config.ready) return config;

  webPush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  return config;
}

function summary(subscription: StoredAdminPushSubscription) {
  return {
    id: subscription.id,
    createdAt: subscription.createdAt,
    label: subscription.label,
    lastSentAt: subscription.lastSentAt,
    updatedAt: subscription.updatedAt,
    userAgent: subscription.userAgent
  };
}

export function getAdminPushStatus() {
  const config = getPushConfig();

  return {
    publicKey: config.publicKey,
    ready: config.ready,
    subject: config.subject
  };
}

export async function listAdminPushSubscriptions() {
  return listJson<StoredAdminPushSubscription>(ADMIN_PUSH_STORE, SUBSCRIPTION_PREFIX);
}

export async function saveAdminPushSubscription({
  label,
  subscription,
  userAgent
}: {
  label?: string;
  subscription: PushSubscription;
  userAgent?: string;
}) {
  if (!subscription.endpoint || !subscription.keys?.auth || !subscription.keys?.p256dh) {
    throw new Error("Invalid push subscription.");
  }

  const key = endpointKey(subscription.endpoint);
  const existing = (await listAdminPushSubscriptions()).find((item) => item.endpoint === subscription.endpoint);
  const record: StoredAdminPushSubscription = {
    id: existing?.id ?? randomUUID(),
    endpoint: subscription.endpoint,
    subscription,
    label: label?.trim() || existing?.label || "Admin phone",
    userAgent: userAgent?.trim() || existing?.userAgent,
    createdAt: existing?.createdAt ?? now(),
    updatedAt: now(),
    lastSentAt: existing?.lastSentAt
  };

  await writeJson(ADMIN_PUSH_STORE, key, record);
  return summary(record);
}

export async function deleteAdminPushSubscription(endpoint: string) {
  if (!endpoint) return false;
  await writeJson<StoredAdminPushSubscription | null>(ADMIN_PUSH_STORE, endpointKey(endpoint), null);
  return true;
}

async function markSubscriptionSent(record: StoredAdminPushSubscription) {
  await writeJson(ADMIN_PUSH_STORE, endpointKey(record.endpoint), {
    ...record,
    lastSentAt: now(),
    updatedAt: now()
  });
}

async function removeExpiredSubscription(record: StoredAdminPushSubscription) {
  await writeJson<StoredAdminPushSubscription | null>(ADMIN_PUSH_STORE, endpointKey(record.endpoint), null);
}

export async function sendAdminPushNotification(payload: AdminPushPayload) {
  const config = configureWebPush();
  const subscriptions = await listAdminPushSubscriptions();

  if (!config.ready) {
    return { failed: 0, ready: false, sent: 0, subscriptions: subscriptions.length };
  }

  const body = JSON.stringify({
    badge: "/images/techchimps-logo-square-favicon.png",
    body: payload.body,
    icon: "/images/techchimps-logo-square-small.png",
    kind: payload.kind ?? "system",
    tag: payload.tag ?? "techchimps-admin",
    timestamp: Date.now(),
    title: payload.title,
    url: payload.url ?? "/admin"
  });

  let sent = 0;
  let failed = 0;

  await Promise.all(
    subscriptions.map(async (record) => {
      try {
        await webPush.sendNotification(record.subscription, body);
        sent += 1;
        await markSubscriptionSent(record);
      } catch (error) {
        failed += 1;
        const statusCode = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 0;
        if (statusCode === 404 || statusCode === 410) {
          await removeExpiredSubscription(record);
        }
      }
    })
  );

  return { failed, ready: true, sent, subscriptions: subscriptions.length };
}

export function orderPushCopy(order: OrderRecord, event: string): AdminPushPayload {
  const customer = order.contactName || "A customer";
  const price = formatPrice(order.amount, order.priceSuffix);

  if (event.includes("payment")) {
    return {
      title: `Payment received: ${order.serviceName}`,
      body: `${customer} paid ${price}. Open the admin app and join their support chat.`,
      kind: "payment",
      tag: `payment-${order.reference}`,
      url: "/admin#support"
    };
  }

  if (event.includes("offer") && event.includes("waiting")) {
    return {
      title: `Offer waiting: ${order.serviceName}`,
      body: `${customer} sent an offer for ${price}. Accept, decline, or reply in live support.`,
      kind: "offer",
      tag: `offer-${order.reference}`,
      url: "/admin#support"
    };
  }

  if (event.includes("custom_request")) {
    return {
      title: `Custom request: ${order.serviceName}`,
      body: `${customer} needs a custom quote. Open live support to review the brief.`,
      kind: "order",
      tag: `custom-${order.reference}`,
      url: "/admin#support"
    };
  }

  if (event.includes("refund")) {
    return {
      title: `Refund updated: ${order.serviceName}`,
      body: `${customer}'s refund status changed. Check the payment hub for details.`,
      kind: "payment",
      tag: `refund-${order.reference}`,
      url: "/admin#payments"
    };
  }

  if (event.includes("quote")) {
    return {
      title: `New request: ${order.serviceName}`,
      body: `${customer} saved a new request. Review the customer record when ready.`,
      kind: "order",
      tag: `quote-${order.reference}`,
      url: "/admin#customers"
    };
  }

  return {
    title: `TechChimps update: ${order.serviceName}`,
    body: `${customer} has an update on ${order.reference}.`,
    kind: "order",
    tag: `order-${order.reference}`,
    url: "/admin"
  };
}

export async function sendOrderPushNotification(order: OrderRecord, event: string) {
  try {
    return await sendAdminPushNotification(orderPushCopy(order, event));
  } catch {
    return { failed: 1, ready: false, sent: 0, subscriptions: 0 };
  }
}

export async function sendChatPushNotification({
  author,
  body,
  sessionId
}: {
  author: string;
  body: string;
  sessionId: string;
}) {
  try {
    return await sendAdminPushNotification({
      body: `${author}: ${body.slice(0, 120)}`,
      kind: "chat",
      tag: `chat-${sessionId}`,
      title: "New customer live chat",
      url: "/admin#support"
    });
  } catch {
    return { failed: 1, ready: false, sent: 0, subscriptions: 0 };
  }
}
