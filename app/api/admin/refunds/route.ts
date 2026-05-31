import { NextResponse } from "next/server";
import { addInboxMessage, ensureCustomerForOrder } from "@/lib/accounts";
import { adminUnauthorized, isAdminRequestAuthenticated } from "@/lib/admin-session";
import { runOrderAutomation } from "@/lib/automation";
import { appendLiveChatMessage } from "@/lib/live-chat";
import { getOrder, saveOrder } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

const requestIdPattern = /^[a-zA-Z0-9-]{8,80}$/;

export async function POST(request: Request) {
  if (!isAdminRequestAuthenticated(request)) return adminUnauthorized();

  const payload = (await request.json().catch(() => null)) as {
    amount?: number;
    confirmReference?: string;
    mode?: "full" | "partial";
    reference?: string;
    requestId?: string;
  } | null;

  if (
    !payload?.reference ||
    payload.confirmReference !== payload.reference ||
    (payload.mode !== "full" && payload.mode !== "partial") ||
    !payload.requestId ||
    !requestIdPattern.test(payload.requestId)
  ) {
    return NextResponse.json({ error: "Confirm the order reference and choose a refund type." }, { status: 400 });
  }

  const order = await getOrder(payload.reference);
  if (!order) {
    return NextResponse.json({ error: "Order could not be found." }, { status: 404 });
  }

  if (!order.stripeSessionId || (!order.paidAt && order.stripePaymentStatus !== "paid")) {
    return NextResponse.json({ error: "Only confirmed Stripe payments can be refunded." }, { status: 409 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 503 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "This payment needs to be refunded from the Stripe Dashboard because it is not linked to a PaymentIntent." },
        { status: 409 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const paidCents = paymentIntent.amount_received || paymentIntent.amount;
    let refundedCents = 0;

    for await (const refund of stripe.refunds.list({ payment_intent: paymentIntentId, limit: 100 })) {
      if (refund.status !== "failed" && refund.status !== "canceled") {
        refundedCents += refund.amount;
      }
    }

    const refundableCents = Math.max(0, paidCents - refundedCents);
    if (!refundableCents) {
      return NextResponse.json({ error: "This payment has already been refunded in full." }, { status: 409 });
    }

    const requestedCents =
      payload.mode === "full"
        ? refundableCents
        : Math.round(Number(payload.amount) * 100);

    if (!Number.isFinite(requestedCents) || requestedCents < 1 || requestedCents > refundableCents) {
      return NextResponse.json(
        { error: `Enter an amount between £0.01 and £${(refundableCents / 100).toFixed(2)}.` },
        { status: 400 }
      );
    }

    const refund = await stripe.refunds.create(
      {
        amount: requestedCents,
        metadata: {
          orderReference: order.reference,
          source: "techchimps-admin"
        },
        payment_intent: paymentIntentId,
        reason: "requested_by_customer"
      },
      {
        idempotencyKey: `techchimps-refund-${order.reference}-${payload.requestId}`
      }
    );
    const nextRefundedAmount = (refundedCents + refund.amount) / 100;
    const fullyRefunded = nextRefundedAmount >= paidCents / 100;
    const refundedAt = new Date().toISOString();
    const updatedOrder = {
      ...order,
      refundedAmount: nextRefundedAmount,
      refundStatus: fullyRefunded ? ("full" as const) : ("partial" as const),
      refunds: [
        ...(order.refunds ?? []),
        {
          amount: refund.amount / 100,
          createdAt: refundedAt,
          id: refund.id,
          status: refund.status ?? "pending"
        }
      ].slice(-20),
      updatedAt: refundedAt
    };
    const customer = await ensureCustomerForOrder(updatedOrder);
    const refundedPrice = formatPrice(refund.amount / 100);
    const refundMessage = `${refundedPrice} has been refunded to your original payment method. Stripe and your bank will handle the return from here.`;

    await saveOrder(updatedOrder);
    await Promise.all([
      appendLiveChatMessage({
        sessionId: updatedOrder.chatSessionId,
        role: "agent",
        body: refundMessage
      }),
      addInboxMessage({
        userId: customer.id,
        author: "Studio support",
        subject: fullyRefunded ? "Your refund has been issued" : "Your partial refund has been issued",
        body: refundMessage,
        projectReference: updatedOrder.reference
      })
    ]);
    await runOrderAutomation(updatedOrder, fullyRefunded ? "refund.full_issued" : "refund.partial_issued");

    return NextResponse.json({
      ok: true,
      order: updatedOrder,
      refund: {
        amount: refund.amount / 100,
        id: refund.id,
        remainingAmount: Math.max(0, (paidCents - refundedCents - refund.amount) / 100),
        status: refund.status
      }
    });
  } catch {
    return NextResponse.json({ error: "Stripe could not issue this refund. Check the payment in Stripe and try again." }, { status: 502 });
  }
}
