import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getCustomerSession } from "@/lib/customer-session";
import { getOrder } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

function sameEmail(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function getInvoiceUrl(invoice: Stripe.Checkout.Session["invoice"]) {
  if (invoice && typeof invoice !== "string" && "hosted_invoice_url" in invoice) {
    return invoice.hosted_invoice_url;
  }

  return null;
}

function getReceiptUrl(paymentIntent: Stripe.Checkout.Session["payment_intent"]) {
  if (!paymentIntent || typeof paymentIntent === "string") return null;
  const latestCharge = paymentIntent.latest_charge;

  if (latestCharge && typeof latestCharge !== "string" && "receipt_url" in latestCharge) {
    return latestCharge.receipt_url;
  }

  return null;
}

export async function GET(request: Request) {
  const session = await getCustomerSession(request);

  if (!session) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference")?.trim();

  if (!reference) {
    return NextResponse.json({ error: "Order reference is required." }, { status: 400 });
  }

  const order = await getOrder(reference);

  if (!order || !sameEmail(order.contactEmail, session.account.email)) {
    return NextResponse.json({ error: "Receipt was not found for this account." }, { status: 404 });
  }

  if (!order.stripeSessionId) {
    return NextResponse.json({ error: "No Stripe checkout is linked to this order yet." }, { status: 404 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const checkoutSession = await stripe.checkout.sessions.retrieve(order.stripeSessionId, {
    expand: ["invoice", "payment_intent.latest_charge"]
  });
  const url = getInvoiceUrl(checkoutSession.invoice) || getReceiptUrl(checkoutSession.payment_intent);

  if (!url) {
    return NextResponse.json(
      { error: "Stripe has not generated a receipt for this order yet. It appears after payment is confirmed." },
      { status: 404 }
    );
  }

  return NextResponse.redirect(url);
}
