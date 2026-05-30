import { NextResponse } from "next/server";
import { connectPaidOrderToLiveChat, markStripeSessionPaid } from "@/lib/automation";
import { findOrderByStripeSessionId, getOrder } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as {
    orderReference?: string;
    stripeSessionId?: string;
  } | null;

  if (!payload) {
    return NextResponse.json({ error: "Order or Stripe session details are required." }, { status: 400 });
  }

  let order = payload.orderReference ? await getOrder(payload.orderReference) : null;
  if (!order && payload.stripeSessionId) order = await findOrderByStripeSessionId(payload.stripeSessionId);

  const stripe = getStripe();

  if (payload.stripeSessionId && stripe) {
    const session = await stripe.checkout.sessions.retrieve(payload.stripeSessionId);
    const paidOrder = await markStripeSessionPaid(session);
    if (paidOrder) order = paidOrder;
  }

  if (!order) {
    return NextResponse.json({ error: "Order could not be found yet." }, { status: 404 });
  }

  if (!stripe && order.status !== "paid_waiting_support" && order.status !== "support_connected") {
    return NextResponse.json(
      {
        error: "Payment could not be verified because Stripe is not configured.",
        reference: order.reference
      },
      { status: 503 }
    );
  }

  const paymentConfirmed = Boolean(order.paidAt) || order.status === "paid_waiting_support" || order.status === "support_connected";

  if (!paymentConfirmed) {
    return NextResponse.json(
      {
        error: "Payment has not been confirmed yet.",
        reference: order.reference,
        status: order.status
      },
      { status: 409 }
    );
  }

  const connectedOrder =
    order.status === "paid_waiting_support" || order.status === "support_connected" ? order : await connectPaidOrderToLiveChat(order);

  return NextResponse.json({
    chatSessionId: connectedOrder.chatSessionId,
    reference: connectedOrder.reference,
    status: connectedOrder.status
  });
}
