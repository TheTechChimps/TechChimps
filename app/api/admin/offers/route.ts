import { NextResponse } from "next/server";
import { addInboxMessage, ensureCustomerForOrder } from "@/lib/accounts";
import { adminUnauthorized, isAdminRequestAuthenticated } from "@/lib/admin-session";
import { runOrderAutomation } from "@/lib/automation";
import { createHostedCheckoutSession } from "@/lib/checkout";
import { appendLiveChatMessage } from "@/lib/live-chat";
import { getOrder, saveOrder } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAdminRequestAuthenticated(request)) return adminUnauthorized();

  const payload = (await request.json().catch(() => null)) as {
    action?: "accept" | "decline";
    reference?: string;
  } | null;

  if (!payload?.reference || (payload.action !== "accept" && payload.action !== "decline")) {
    return NextResponse.json({ error: "Choose an offer and an action." }, { status: 400 });
  }

  const order = await getOrder(payload.reference);
  if (!order) {
    return NextResponse.json({ error: "Offer could not be found." }, { status: 404 });
  }

  if (order.offerMode === "standard" || order.status !== "offer_waiting_review") {
    return NextResponse.json({ error: "This offer has already been reviewed or is not awaiting a decision." }, { status: 409 });
  }

  const decidedAt = new Date().toISOString();
  const customer = await ensureCustomerForOrder(order);

  if (payload.action === "decline") {
    const declinedOrder = {
      ...order,
      offerDecision: "declined" as const,
      offerDecisionAt: decidedAt,
      status: "offer_declined" as const,
      updatedAt: decidedAt
    };

    await saveOrder(declinedOrder);
    await Promise.all([
      appendLiveChatMessage({
        sessionId: order.chatSessionId,
        role: "agent",
        body:
          "Thanks for sending your offer. We cannot accept that amount as it stands, but reply here and we can work out the simplest option together."
      }),
      addInboxMessage({
        userId: customer.id,
        author: "Studio support",
        subject: "Your TechChimps offer needs a quick chat",
        body:
          "Thanks for sending your offer. We cannot accept that amount as it stands, but reply in live support and we can work out the simplest option together.",
        projectReference: order.reference
      })
    ]);
    await runOrderAutomation(declinedOrder, "offer.declined");

    return NextResponse.json({ ok: true, order: declinedOrder });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 503 });
  }

  try {
    const session = await createHostedCheckoutSession(stripe, order, {
      source: "techchimps-approved-offer"
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout link. Please try again." }, { status: 502 });
    }

    const acceptedOrder = {
      ...order,
      offerCheckoutUrl: session.url,
      offerDecision: "accepted" as const,
      offerDecisionAt: decidedAt,
      status: "payment_pending" as const,
      stripeSessionId: session.id,
      updatedAt: decidedAt
    };
    const amount = formatPrice(acceptedOrder.amount, acceptedOrder.priceSuffix);

    await saveOrder(acceptedOrder);
    await Promise.all([
      appendLiveChatMessage({
        sessionId: acceptedOrder.chatSessionId,
        role: "agent",
        body: `Good news, your ${amount} offer has been accepted. Pay securely here to get started: ${session.url}`
      }),
      addInboxMessage({
        userId: customer.id,
        author: "Studio support",
        subject: "Your offer was accepted",
        body: `Good news, your ${amount} offer has been accepted. Use this secure Stripe Checkout link to get started: ${session.url}`,
        projectReference: acceptedOrder.reference
      })
    ]);
    await runOrderAutomation(acceptedOrder, "offer.accepted_payment_link_sent");

    return NextResponse.json({
      ok: true,
      order: acceptedOrder,
      url: session.url
    });
  } catch {
    return NextResponse.json({ error: "Stripe could not create the payment link. Please try again." }, { status: 502 });
  }
}
