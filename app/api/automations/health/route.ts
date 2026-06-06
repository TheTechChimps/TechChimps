import { NextResponse } from "next/server";
import { adminUnauthorized, isAdminRequestAuthenticated } from "@/lib/admin-session";
import { getIntegrationReadiness, runSelfHealingSweep } from "@/lib/automation";
import { isAutomationRequestAuthorized } from "@/lib/automation-webhooks";
import { getWaitingOrders } from "@/lib/orders";
import { getStorageMode } from "@/lib/storage";

export const dynamic = "force-dynamic";

function isCronRequestAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`);
}

function isHealthRequestAuthorized(request: Request) {
  return isAdminRequestAuthenticated(request) || isAutomationRequestAuthorized(request) || isCronRequestAuthorized(request);
}

export async function GET(request: Request) {
  if (!isHealthRequestAuthorized(request)) return adminUnauthorized();

  return NextResponse.json({
    integrations: getIntegrationReadiness(),
    storageMode: getStorageMode(),
    waitingOrders: await getWaitingOrders()
  });
}

export async function POST(request: Request) {
  if (!isHealthRequestAuthorized(request)) return adminUnauthorized();

  const sweep = await runSelfHealingSweep();

  return NextResponse.json({
    integrations: getIntegrationReadiness(),
    storageMode: getStorageMode(),
    sweep,
    waitingOrders: await getWaitingOrders()
  });
}
