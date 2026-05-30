import { NextResponse } from "next/server";
import { adminUnauthorized, isAdminRequestAuthenticated } from "@/lib/admin-session";
import { getDailyMaintenanceStatus, runDailyMaintenance } from "@/lib/maintenance";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminRequestAuthenticated(request)) return adminUnauthorized();

  return NextResponse.json(await getDailyMaintenanceStatus());
}

export async function POST(request: Request) {
  if (!isAdminRequestAuthenticated(request)) return adminUnauthorized();

  const result = await runDailyMaintenance("admin");
  return NextResponse.json({ ok: true, result });
}
