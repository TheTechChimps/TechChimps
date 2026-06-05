import { NextResponse } from "next/server";
import { addInboxMessage, ensureCustomerForOrder } from "@/lib/accounts";
import { saveBuildPromptForOrder } from "@/lib/build-prompts";
import { createHostedCheckoutSession } from "@/lib/checkout";
import { createOrder, findActiveCustomerTicket, saveOrder, type OrderInput } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as OrderInput | null;

  if (
    !payload ||
    !payload.contactEmail ||
    !payload.serviceType ||
    (!payload.goals?.trim() && !payload.creativeControl) ||
    !payload.contactName
  ) {
    return NextResponse.json({ error: "Missing required order details." }, { status: 400 });
  }

  if (!isValidEmail(payload.contactEmail)) {
    return NextResponse.json({ error: "A valid email is required before checkout." }, { status: 400 });
  }

  if (payload.offerMode && payload.offerMode !== "standard") {
    return NextResponse.json({ error: "Custom and discounted offers need review before payment." }, { status: 400 });
  }

  const normalizedPayload: OrderInput = {
    ...payload,
    goals: payload.goals ?? ""
  };

  const activeTicket = await findActiveCustomerTicket(payload.contactEmail);
  if (activeTicket) {
    return NextResponse.json({
      chatSessionId: activeTicket.chatSessionId,
      duplicateOpenTicket: true,
      message:
        "You already have an open TechChimps ticket, so we opened that live chat instead of creating a duplicate.",
      reference: activeTicket.reference,
      status: activeTicket.status
    });
  }

  const stripe = getStripe();
  const order = await createOrder({ ...normalizedPayload, offerMode: "standard" }, "checkout_started");
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

  const session = await createHostedCheckoutSession(stripe, order);

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
