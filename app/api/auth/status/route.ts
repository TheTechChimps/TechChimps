import { NextResponse } from "next/server";
import { safeCustomer } from "@/lib/accounts";
import { getCustomerSession } from "@/lib/customer-session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getCustomerSession(request);

  return NextResponse.json({
    authenticated: Boolean(session),
    user: session ? safeCustomer(session.account) : null
  });
}
