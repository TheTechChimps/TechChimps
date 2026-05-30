import { NextResponse } from "next/server";
import { getIntegrationReadiness, runSelfHealingSweep } from "@/lib/automation";
import { getWaitingOrders } from "@/lib/orders";
import { getStorageMode } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    integrations: getIntegrationReadiness(),
    storageMode: getStorageMode(),
    waitingOrders: await getWaitingOrders()
  });
}

export async function POST() {
  const sweep = await runSelfHealingSweep();

  return NextResponse.json({
    integrations: getIntegrationReadiness(),
    storageMode: getStorageMode(),
    sweep,
    waitingOrders: await getWaitingOrders()
  });
}
