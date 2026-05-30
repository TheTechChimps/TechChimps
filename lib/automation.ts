import type Stripe from "stripe";
import { addInboxMessage, ensureCustomerForOrder } from "@/lib/accounts";
import { appendLiveChatMessage } from "@/lib/live-chat";
import {
  addAutomationResult,
  findOrderByStripeSessionId,
  getOrder,
  listOrders,
  saveOrder,
  updateOrder,
  type OrderRecord
} from "@/lib/orders";
import { getStorageMode } from "@/lib/storage";
import { getStripe } from "@/lib/stripe";
import { formatPrice } from "@/lib/utils";

type IntegrationStatus = {
  name: string;
  ready: boolean;
  detail: string;
};

function now() {
  return new Date().toISOString();
}

function webhookPayload(order: OrderRecord, event: string) {
  return {
    event,
    order: {
      reference: order.reference,
      status: order.status,
      serviceName: order.serviceName,
      amount: order.amount,
      isSubscription: order.isSubscription,
      contactName: order.contactName,
      contactEmail: order.contactEmail,
      deliverySpeed: order.deliverySpeed,
      completionDate: order.completionDate,
      offerMode: order.offerMode,
      offerAmount: order.offerAmount,
      goals: order.goals,
      chatSessionId: order.chatSessionId,
      stripeSessionId: order.stripeSessionId
    }
  };
}

async function postJson(url: string | undefined, order: OrderRecord, event: string, name: string) {
  if (!url) {
    await addAutomationResult(order.reference, {
      name,
      status: "skipped",
      detail: "No webhook URL configured."
    });
    return;
  }

  try {
    const response = await fetch(url, {
      body: JSON.stringify(webhookPayload(order, event)),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    await addAutomationResult(order.reference, {
      name,
      status: response.ok ? "sent" : "failed",
      detail: response.ok ? "Webhook accepted." : `Webhook returned ${response.status}.`
    });
  } catch (error) {
    await addAutomationResult(order.reference, {
      name,
      status: "failed",
      detail: error instanceof Error ? error.message : "Webhook request failed."
    });
  }
}

export function getIntegrationReadiness(): IntegrationStatus[] {
  const storageMode = getStorageMode();
  const hasNetlifyRuntime = process.env.NETLIFY === "true";
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || process.env.EMAIL_FROM || "";
  const hasRealContactEmail = Boolean(contactEmail && !contactEmail.endsWith(".example"));

  return [
    {
      name: "Stripe Checkout",
      ready: Boolean(process.env.STRIPE_SECRET_KEY),
      detail: process.env.STRIPE_SECRET_KEY ? "Ready to create hosted checkout sessions." : "Add STRIPE_SECRET_KEY."
    },
    {
      name: "Stripe Webhooks",
      ready: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      detail: process.env.STRIPE_WEBHOOK_SECRET ? "Ready to verify payment events." : "Add STRIPE_WEBHOOK_SECRET."
    },
    {
      name: "Production Storage",
      ready:
        storageMode === "vercel-blob" ||
        storageMode === "netlify-blobs" ||
        (hasNetlifyRuntime && Boolean(process.env.NETLIFY_SITE_ID)),
      detail:
        storageMode === "vercel-blob"
          ? "Orders, accounts, uploads, and chat can persist securely."
          : storageMode === "netlify-blobs"
            ? "Orders and chat can persist securely."
            : hasNetlifyRuntime && process.env.NETLIFY_SITE_ID
              ? "Production storage is available for deployed data."
              : process.env.NETLIFY_SITE_ID
                ? "Production storage is linked, but local persistence needs storage credentials."
                : "Using local memory. Add production storage credentials."
    },
    {
      name: "Deploy Hook",
      ready: Boolean(process.env.VERCEL_DEPLOY_HOOK_URL || process.env.NETLIFY_BUILD_HOOK_URL),
      detail: process.env.VERCEL_DEPLOY_HOOK_URL?.includes("/api/automations/deploy-hook")
        ? "Secure self-healing hook is ready. Replace with a Git-linked Vercel deploy hook when available."
        : process.env.VERCEL_DEPLOY_HOOK_URL
          ? "Ready to trigger Vercel deployment automation."
        : process.env.NETLIFY_BUILD_HOOK_URL
          ? "Deployment automation is configured."
          : "Add a deployment hook URL for deployment automation."
    },
    {
      name: "Studio Alerts",
      ready: Boolean(process.env.STUDIO_NOTIFICATION_WEBHOOK_URL),
      detail: process.env.STUDIO_NOTIFICATION_WEBHOOK_URL
        ? "Ready to notify your private inbox or automation tool."
        : "Add STUDIO_NOTIFICATION_WEBHOOK_URL."
    },
    {
      name: "Studio Sync",
      ready: Boolean(process.env.CRM_API_URL),
      detail: process.env.CRM_API_URL ? "Ready to sync paid orders and offers." : "Add a studio sync URL."
    },
    {
      name: "Contact Email",
      ready: hasRealContactEmail,
      detail: hasRealContactEmail
        ? `Click-to-email links are live for ${contactEmail}.`
        : "Set NEXT_PUBLIC_CONTACT_EMAIL or EMAIL_FROM to a real TechChimps address."
    },
    {
      name: "Email Automation",
      ready: Boolean(process.env.EMAIL_AUTOMATION_WEBHOOK_URL),
      detail: process.env.EMAIL_AUTOMATION_WEBHOOK_URL
        ? "Ready to trigger portal inbox messages. Regular email stays as click-to-send."
        : "Add EMAIL_AUTOMATION_WEBHOOK_URL."
    },
    {
      name: "Daily Maintenance Cron",
      ready: Boolean(process.env.CRON_SECRET),
      detail: process.env.CRON_SECRET
        ? "Daily self-healing and rotating backup snapshots are configured."
        : "Add CRON_SECRET so Vercel Cron can run daily maintenance."
    }
  ];
}

export async function notifyStudio(order: OrderRecord, event: string) {
  await postJson(process.env.STUDIO_NOTIFICATION_WEBHOOK_URL, order, event, "Studio alert");
}

export async function triggerPlatformDeploy(order: OrderRecord) {
  const url = process.env.VERCEL_DEPLOY_HOOK_URL || process.env.NETLIFY_BUILD_HOOK_URL;
  const name = process.env.VERCEL_DEPLOY_HOOK_URL ? "Vercel deploy hook" : "Deploy hook";

  if (!url) {
    await addAutomationResult(order.reference, {
      name,
      status: "skipped",
      detail: "No build hook configured."
    });
    return;
  }

  try {
    const response = await fetch(url, { method: "POST" });
    await addAutomationResult(order.reference, {
      name,
      status: response.ok ? "sent" : "failed",
      detail: response.ok ? "Build hook triggered." : `Build hook returned ${response.status}.`
    });
  } catch (error) {
    await addAutomationResult(order.reference, {
      name,
      status: "failed",
      detail: error instanceof Error ? error.message : "Build hook request failed."
    });
  }
}

export async function runOrderAutomation(order: OrderRecord, event: string) {
  await Promise.all([
    notifyStudio(order, event),
    postJson(process.env.CRM_API_URL, order, event, "CRM sync"),
    postJson(process.env.QUOTE_WEBHOOK_URL, order, event, "Quote webhook"),
    postJson(process.env.EMAIL_AUTOMATION_WEBHOOK_URL, order, event, "Email automation"),
    triggerPlatformDeploy(order)
  ]);
}

export async function connectOfferToLiveChat(order: OrderRecord) {
  await appendLiveChatMessage({
    sessionId: order.chatSessionId,
    role: "system",
    priority: "waiting",
    body: `Custom offer ${order.reference} is waiting for review. ${order.contactName || "A visitor"} offered ${
      order.offerAmount ? formatPrice(order.offerAmount) : "a custom amount"
    } for ${order.serviceName}.`
  });

  await appendLiveChatMessage({
    sessionId: order.chatSessionId,
    role: "visitor",
    author: order.contactName || "Website visitor",
    priority: "waiting",
    body: order.offerReason || order.goals || "I would like to discuss a custom or discounted offer."
  });

  await runOrderAutomation(order, "offer.waiting_review");
}

export async function connectPaidOrderToLiveChat(order: OrderRecord, stripeSession?: Stripe.Checkout.Session) {
  if (order.chatConnectedAt) return order;

  const paidOrder = await updateOrder(order.reference, (current) => ({
    ...current,
    status: "paid_waiting_support",
    stripePaymentStatus: stripeSession?.payment_status ?? current.stripePaymentStatus ?? "paid",
    paidAt: current.paidAt ?? now(),
    chatConnectedAt: now()
  }));

  const connectedOrder = paidOrder ?? order;

  await appendLiveChatMessage({
    sessionId: connectedOrder.chatSessionId,
    role: "system",
    priority: "payment",
    body: `Payment confirmed for ${connectedOrder.reference}. A live support thread is now open and the studio has been notified.`
  });

  await appendLiveChatMessage({
    sessionId: connectedOrder.chatSessionId,
    role: "visitor",
    author: connectedOrder.contactName || "Paid customer",
    priority: "waiting",
    body: `${connectedOrder.contactName || "A customer"} paid ${formatPrice(
      connectedOrder.amount,
      connectedOrder.priceSuffix
    )} for ${connectedOrder.serviceName} and is waiting for live support.${
      connectedOrder.completionDate ? ` Preferred completion date: ${connectedOrder.completionDate}.` : ""
    }`
  });

  const customer = await ensureCustomerForOrder(connectedOrder);
  await addInboxMessage({
    userId: customer.id,
    author: "Studio support",
    subject: "Payment confirmed",
    body: `Payment is confirmed for ${connectedOrder.serviceName}. Your support thread is open and we are ready to guide the next step.`,
    projectReference: connectedOrder.reference
  });

  await runOrderAutomation(connectedOrder, "payment.confirmed_waiting_support");
  return connectedOrder;
}

export async function hydrateOrderFromStripeSession(session: Stripe.Checkout.Session) {
  const reference = session.metadata?.orderReference;
  if (reference) {
    const order = await getOrder(reference);
    if (order) return order;
  }

  const existing = await findOrderByStripeSessionId(session.id);
  if (existing) return existing;

  return null;
}

export async function markStripeSessionPaid(session: Stripe.Checkout.Session) {
  const order = await hydrateOrderFromStripeSession(session);
  if (!order) return null;

  if (order.status === "paid_waiting_support" || order.status === "support_connected" || order.chatConnectedAt) {
    return order;
  }

  const updated = {
    ...order,
    status: "payment_pending" as const,
    stripeSessionId: session.id,
    stripePaymentStatus: session.payment_status ?? order.stripePaymentStatus,
    updatedAt: now()
  };

  await saveOrder(updated);

  if (session.status === "complete" || session.payment_status === "paid" || session.payment_status === "no_payment_required") {
    return connectPaidOrderToLiveChat(updated, session);
  }

  return updated;
}

export async function runSelfHealingSweep() {
  const stripe = getStripe();
  const orders = await listOrders();
  const healed: string[] = [];

  for (const order of orders) {
    if (order.status === "checkout_started" && order.stripeSessionId && stripe) {
      const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
      const updated = await markStripeSessionPaid(session);
      if (updated?.status === "paid_waiting_support") healed.push(order.reference);
    }

    if (order.status === "paid_waiting_support" && !order.chatConnectedAt) {
      await connectPaidOrderToLiveChat(order);
      healed.push(order.reference);
    }
  }

  return {
    checked: orders.length,
    healed
  };
}
