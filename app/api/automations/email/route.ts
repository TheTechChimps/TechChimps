import { NextResponse } from "next/server";
import {
  isAutomationRequestAuthorized,
  parseAutomationPayload,
  queueCustomerEmail,
  type AutomationWebhookPayload
} from "@/lib/automation-webhooks";
import { getOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAutomationRequestAuthorized(request)) {
    return NextResponse.json({ error: "Automation webhook is not authorized." }, { status: 401 });
  }

  try {
    const payload = (await request.json().catch(() => null)) as AutomationWebhookPayload | null;
    const { event, reference } = parseAutomationPayload(payload);
    const order = await getOrder(reference);

    if (!order) {
      return NextResponse.json({ error: "Order could not be found for email automation." }, { status: 404 });
    }

    const record = await queueCustomerEmail(event, order);
    return NextResponse.json({ ok: true, recordId: record.id, reference });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Email automation could not be processed." },
      { status: 400 }
    );
  }
}
