import { NextResponse } from "next/server";
import {
  createStudioAlert,
  isAutomationRequestAuthorized,
  parseAutomationPayload,
  type AutomationWebhookPayload
} from "@/lib/automation-webhooks";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAutomationRequestAuthorized(request)) {
    return NextResponse.json({ error: "Automation webhook is not authorized." }, { status: 401 });
  }

  try {
    const payload = (await request.json().catch(() => null)) as AutomationWebhookPayload | null;
    const { event, order, reference } = parseAutomationPayload(payload);
    const record = await createStudioAlert(event, { ...order, reference });

    return NextResponse.json({ ok: true, recordId: record.id, reference });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Studio alert could not be processed." },
      { status: 400 }
    );
  }
}
