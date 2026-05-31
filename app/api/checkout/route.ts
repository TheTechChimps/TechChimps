import { NextResponse } from "next/server";
import { addInboxMessage, ensureCustomerForOrder } from "@/lib/accounts";
import { saveBuildPromptForOrder } from "@/lib/build-prompts";
import { createOrder, saveOrder, type OrderInput } from "@/lib/orders";
import { getSiteUrl, getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as OrderInput | null;

  if (!payload || !payload.contactEmail || !payload.serviceType || !payload.goals || !payload.contactName) {
    return NextResponse.json({ error: "Missing required order details." }, { status: 400 });
  }

  if (!isValidEmail(payload.contactEmail)) {
    return NextResponse.json({ error: "A valid email is required before checkout." }, { status: 400 });
  }

  if (payload.offerMode && payload.offerMode !== "standard") {
    return NextResponse.json({ error: "Custom and discounted offers need review before payment." }, { status: 400 });
  }

  const stripe = getStripe();
  const order = await createOrder({ ...payload, offerMode: "standard" }, "checkout_started");
  await saveBuildPromptForOrder(order);
  const customer = await ensureCustomerForOrder(order);
  await addInboxMessage({
    userId: customer.id,
    author: "Studio support",
    subject: "Checkout started",
    body: `Your ${order.serviceName} checkout has started. After payment, this portal will show the order and support messages automatically.`,
    projectReference: order.reference
  });

  if (!stripe) {
    return NextResponse.json(
      {
        error: "Stripe is not configured yet.",
        reference: order.reference,
        chatSessionId: order.chatSessionId,
        setupRequired: true
      },
      { status: 503 }
    );
  }

  const siteUrl = getSiteUrl();
  const mode = order.isSubscription ? "subscription" : "payment";
  const session = await stripe.checkout.sessions.create({
    allow_promotion_codes: true,
    cancel_url: `${siteUrl}/request?checkout=cancelled&order=${order.reference}`,
    client_reference_id: order.reference,
    customer_email: order.contactEmail,
    invoice_creation: mode === "payment" ? { enabled: true } : undefined,
    line_items: [
      {
        price_data: {
          currency: "gbp",
          product_data: {
            description: order.goals.slice(0, 240),
            name: order.serviceName
          },
          recurring: order.isSubscription ? { interval: "month" } : undefined,
          unit_amount: Math.round(order.amount * 100)
        },
        quantity: 1
      }
    ],
    metadata: {
      chatSessionId: order.chatSessionId,
      deliverySpeed: order.deliverySpeed,
      discountAmount: order.discountAmount ? String(order.discountAmount) : "",
      discountCode: order.discountCode ?? "",
      discountPercent: order.discountPercent ? String(order.discountPercent) : "",
      orderReference: order.reference,
      serviceSlug: order.serviceSlug,
      source: "techchimps-site"
    },
    mode,
    phone_number_collection: {
      enabled: true
    },
    success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order=${order.reference}`
  });

  const saved = {
    ...order,
    stripeSessionId: session.id,
    updatedAt: new Date().toISOString()
  };

  await saveOrder(saved);

  return NextResponse.json({
    chatSessionId: saved.chatSessionId,
    reference: saved.reference,
    sessionId: session.id,
    url: session.url
  });
}
