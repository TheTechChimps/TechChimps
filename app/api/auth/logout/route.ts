import { NextResponse } from "next/server";
import { clearCustomerSessionCookie } from "@/lib/customer-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const response = NextResponse.json({ ok: true });
  return clearCustomerSessionCookie(request, response);
}
