import { NextResponse } from "next/server";
import { addInboxMessage, ensureCustomerAccount, isValidEmail } from "@/lib/accounts";
import { adminUnauthorized, isAdminRequestAuthenticated } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAdminRequestAuthenticated(request)) return adminUnauthorized();

  const payload = (await request.json().catch(() => null)) as {
    body?: string;
    email?: string;
    name?: string;
    projectReference?: string;
    subject?: string;
  } | null;

  if (!payload?.email || !isValidEmail(payload.email)) {
    return NextResponse.json({ error: "A valid customer email is required." }, { status: 400 });
  }

  if (!payload.subject?.trim() || !payload.body?.trim()) {
    return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });
  }

  const customer = await ensureCustomerAccount({
    email: payload.email,
    name: payload.name
  });

  const message = await addInboxMessage({
    userId: customer.id,
    author: "Studio support",
    subject: payload.subject,
    body: payload.body,
    projectReference: payload.projectReference
  });

  return NextResponse.json({ customer, message });
}
