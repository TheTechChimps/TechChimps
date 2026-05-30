import { NextResponse } from "next/server";
import { loginCustomer, safeCustomer } from "@/lib/accounts";
import { attachCustomerSession } from "@/lib/customer-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;

  const account = await loginCustomer(payload?.email ?? "", payload?.password ?? "");

  if (!account) {
    return NextResponse.json(
      { error: "Login failed. If this is your first time, choose Create account to claim your portal." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ user: safeCustomer(account) });
  return attachCustomerSession(response, account.id);
}
