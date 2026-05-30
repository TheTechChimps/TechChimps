import { NextResponse } from "next/server";
import { registerOrClaimCustomer, safeCustomer } from "@/lib/accounts";
import { attachCustomerSession } from "@/lib/customer-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as {
    email?: string;
    name?: string;
    password?: string;
  } | null;

  try {
    const account = await registerOrClaimCustomer({
      email: payload?.email ?? "",
      name: payload?.name ?? "",
      password: payload?.password ?? ""
    });

    const response = NextResponse.json({ user: safeCustomer(account) });
    return attachCustomerSession(response, account.id);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Account could not be created." },
      { status: 400 }
    );
  }
}
