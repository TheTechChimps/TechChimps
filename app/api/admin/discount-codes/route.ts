import { NextResponse } from "next/server";
import { adminUnauthorized, isAdminRequestAuthenticated } from "@/lib/admin-session";
import { listDiscountCodes, saveDiscountCode, updateDiscountCode } from "@/lib/discount-code-store";

export const dynamic = "force-dynamic";

type DiscountPayload = {
  active?: boolean;
  code?: string;
  description?: string;
  label?: string;
  percentOff?: number;
};

export async function GET(request: Request) {
  if (!isAdminRequestAuthenticated(request)) {
    return adminUnauthorized();
  }

  return NextResponse.json({
    codes: await listDiscountCodes()
  });
}

export async function POST(request: Request) {
  if (!isAdminRequestAuthenticated(request)) {
    return adminUnauthorized();
  }

  const payload = (await request.json().catch(() => null)) as DiscountPayload | null;

  if (!payload?.code?.trim()) {
    return NextResponse.json({ error: "Add a discount code." }, { status: 400 });
  }

  try {
    const discountCode = await saveDiscountCode(payload);
    return NextResponse.json({ code: discountCode });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Discount code could not be saved." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  if (!isAdminRequestAuthenticated(request)) {
    return adminUnauthorized();
  }

  const payload = (await request.json().catch(() => null)) as DiscountPayload | null;

  if (!payload?.code?.trim()) {
    return NextResponse.json({ error: "Choose a discount code to update." }, { status: 400 });
  }

  try {
    const discountCode = await updateDiscountCode(payload.code, payload);
    return NextResponse.json({ code: discountCode });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Discount code could not be updated." }, { status: 400 });
  }
}
