import { NextResponse } from "next/server";
import { runDailyMaintenance } from "@/lib/maintenance";

export const dynamic = "force-dynamic";

function isCronAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`);
}

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Cron authorization required." }, { status: 401 });
  }

  const result = await runDailyMaintenance("cron");
  return NextResponse.json({ ok: true, result });
}
