import { NextResponse } from "next/server";
import { connectOfferToLiveChat, runOrderAutomation } from "@/lib/automation";
import { addInboxMessage, ensureCustomerForOrder } from "@/lib/accounts";
import { saveBuildPromptForOrder } from "@/lib/build-prompts";
import { createOrder, parseOfferAmount, type OrderInput } from "@/lib/orders";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as OrderInput | null;

  if (!payload || !payload.contactEmail || !payload.serviceType || !payload.contactName) {
    return NextResponse.json({ error: "Missing required quote details." }, { status: 400 });
  }

  const isOffer = payload.offerMode && payload.offerMode !== "standard";

  if (isOffer && !parseOfferAmount(payload.offerAmount)) {
    return NextResponse.json({ error: "A custom offer amount is required." }, { status: 400 });
  }

  const order = await createOrder(payload, isOffer ? "offer_waiting_review" : "quote_saved");
  await saveBuildPromptForOrder(order);
  const customer = await ensureCustomerForOrder(order);

  if (isOffer) {
    await addInboxMessage({
      userId: customer.id,
      author: "Studio support",
      subject: "Your custom offer is waiting for review",
      body: `We received your ${order.serviceName} offer. We will review it and reply here or through live support.`,
      projectReference: order.reference
    });
    await connectOfferToLiveChat(order);
  } else {
    await addInboxMessage({
      userId: customer.id,
      author: "Studio support",
      subject: "Your request has been saved",
      body: `Your ${order.serviceName} request is saved. You can claim this portal with ${order.contactEmail} to keep everything in one place.`,
      projectReference: order.reference
    });
    await runOrderAutomation(order, "quote.saved");
  }

  return NextResponse.json({
    chatSessionId: order.chatSessionId,
    reference: order.reference,
    status: order.status
  });
}
