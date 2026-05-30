import { NextResponse } from "next/server";
import { getWaitingOrders, listOrders } from "@/lib/orders";
import { adminUnauthorized, isAdminRequestAuthenticated } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminRequestAuthenticated(request)) return adminUnauthorized();

  const { searchParams } = new URL(request.url);
  const waitingOnly = searchParams.get("waiting") === "true";
  const orders = waitingOnly ? await getWaitingOrders() : await listOrders();

  return NextResponse.json({
    orders: orders.slice(0, 100)
  });
}
