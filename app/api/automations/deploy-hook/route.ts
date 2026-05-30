import { NextResponse } from "next/server";
import { isAutomationRequestAuthorized, recordAutomationEvent } from "@/lib/automation-webhooks";
import { runSelfHealingSweep } from "@/lib/automation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAutomationRequestAuthorized(request)) {
    return NextResponse.json({ error: "Automation webhook is not authorized." }, { status: 401 });
  }

  const result = await runSelfHealingSweep();
  const record = await recordAutomationEvent({
    detail: `Self-healing sweep checked ${result.checked} orders and recovered ${result.healed.length}.`,
    event: "self_healing.sweep",
    reference: "PLATFORM",
    status: "received",
    type: "deploy-hook"
  });

  return NextResponse.json({
    ok: true,
    checked: result.checked,
    healed: result.healed,
    recordId: record.id
  });
}
