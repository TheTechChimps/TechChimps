import { NextResponse } from "next/server";
import { getServiceBySlug } from "@/lib/orders";
import { applyStoredDiscount } from "@/lib/discount-code-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as {
    amount?: number;
    code?: string;
    serviceType?: string;
  } | null;

  const service = payload?.serviceType ? getServiceBySlug(payload.serviceType) : undefined;
  const amount = Number(payload?.amount ?? 0);
  const application = await applyStoredDiscount(amount, payload?.code, {
    isSubscription: Boolean(service?.priceSuffix),
    priceSuffix: service?.priceSuffix,
    serviceCategory: service?.category
  });

  return NextResponse.json({
    discount: application
  });
}
