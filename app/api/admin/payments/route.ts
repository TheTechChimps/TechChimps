import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { adminUnauthorized, isAdminRequestAuthenticated } from "@/lib/admin-session";
import { listOrders, type OrderRecord } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

function formatPaymentMethod(session: Stripe.Checkout.Session, order: OrderRecord) {
  const paymentIntent = typeof session.payment_intent === "string" ? null : session.payment_intent;
  const latestCharge =
    paymentIntent && typeof paymentIntent.latest_charge !== "string"
      ? paymentIntent.latest_charge
      : null;
  const card = latestCharge?.payment_method_details?.card;

  if (card) {
    return `${card.brand} card ending ${card.last4}`;
  }

  return session.payment_method_types?.join(", ") || order.paymentMethod || "Stripe Checkout";
}

export async function GET(request: Request) {
  if (!isAdminRequestAuthenticated(request)) return adminUnauthorized();

  const stripe = getStripe();
  const orders = (await listOrders())
    .filter((order) => Boolean(order.paidAt || order.stripePaymentStatus === "paid"))
    .slice(0, 100);

  if (!stripe) {
    return NextResponse.json({ orders });
  }

  const enrichedOrders = await Promise.all(
    orders.map(async (order) => {
      if (!order.stripeSessionId) return order;

      try {
        const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId, {
          expand: ["payment_intent.latest_charge"]
        });

        return {
          ...order,
          paymentCurrency: session.currency ?? order.paymentCurrency ?? "gbp",
          paymentMethod: formatPaymentMethod(session, order)
        };
      } catch {
        return order;
      }
    })
  );

  return NextResponse.json({ orders: enrichedOrders });
}
