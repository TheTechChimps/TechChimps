import { NextResponse } from "next/server";
import {
  isAutomationRequestAuthorized,
  parseAutomationPayload,
  syncCrmProject,
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
    const record = await syncCrmProject(event, { ...order, reference });

    return NextResponse.json({ ok: true, latestEvent: record.latestEvent, reference });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "CRM sync could not be processed." },
      { status: 400 }
    );
  }
}
