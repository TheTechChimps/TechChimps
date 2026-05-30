import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { markStripeSessionPaid } from "@/lib/automation";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  let event: Stripe.Event;

  try {
    if (webhookSecret) {
      if (!signature) {
        return NextResponse.json({ error: "Missing Stripe webhook signature." }, { status: 400 });
      }

      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch {
    return NextResponse.json({ error: "Invalid Stripe webhook signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    await markStripeSessionPaid(event.data.object as Stripe.Checkout.Session);
  }

  return NextResponse.json({ received: true });
}
