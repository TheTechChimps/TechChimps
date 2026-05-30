import { NextResponse } from "next/server";
import { markInboxMessageRead } from "@/lib/accounts";
import { getCustomerSession } from "@/lib/customer-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getCustomerSession(request);

  if (!session) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as { messageId?: string };
  const inbox = await markInboxMessageRead(session.account.id, payload.messageId);

  return NextResponse.json({ inbox });
}
