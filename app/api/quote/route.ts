import { NextResponse } from "next/server";
import { connectCustomRequestToLiveChat, connectOfferToLiveChat, runOrderAutomation } from "@/lib/automation";
import { addInboxMessage, ensureCustomerForOrder } from "@/lib/accounts";
import { saveBuildPromptForOrder } from "@/lib/build-prompts";
import { createOrder, findActiveCustomerTicket, parseOfferAmount, type OrderInput } from "@/lib/orders";
import { liveSupportEtaMessage, liveSupportHandoffMessage } from "@/lib/support-copy";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as OrderInput | null;

  if (!payload || !payload.contactEmail || !payload.serviceType || !payload.contactName) {
    return NextResponse.json({ error: "Missing required quote details." }, { status: 400 });
  }

  const isOffer = payload.offerMode && payload.offerMode !== "standard";
  const isCustomRequest = payload.serviceType === "custom-request";

  if (isOffer && !isCustomRequest && !parseOfferAmount(payload.offerAmount)) {
    return NextResponse.json({ error: "A custom offer amount is required." }, { status: 400 });
  }

  if (isCustomRequest || isOffer) {
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
  }

  const order = await createOrder(
    payload,
    isCustomRequest ? "custom_request_waiting_review" : isOffer ? "offer_waiting_review" : "quote_saved"
  );
  await saveBuildPromptForOrder(order);
  const customer = await ensureCustomerForOrder(order);

  if (isCustomRequest) {
    await addInboxMessage({
      userId: customer.id,
      author: "Studio support",
      subject: "Your custom request is in live support",
      body: `We received your idea. ${liveSupportHandoffMessage} ${liveSupportEtaMessage}`,
      projectReference: order.reference
    });
    await connectCustomRequestToLiveChat(order);
  } else if (isOffer) {
    await addInboxMessage({
      userId: customer.id,
      author: "Studio support",
      subject: "Your custom offer is in live support",
      body: `We received your ${order.serviceName} offer. ${liveSupportHandoffMessage} ${liveSupportEtaMessage}`,
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
