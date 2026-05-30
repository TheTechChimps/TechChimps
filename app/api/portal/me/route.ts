import { NextResponse } from "next/server";
import { getInboxMessages, safeCustomer } from "@/lib/accounts";
import { getCustomerSession } from "@/lib/customer-session";
import { listOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getCustomerSession(request);

  if (!session) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const [messages, orders] = await Promise.all([getInboxMessages(session.account.id), listOrders()]);
  const customerOrders = orders.filter(
    (order) => order.contactEmail.trim().toLowerCase() === session.account.email.trim().toLowerCase()
  );

  return NextResponse.json({
    inbox: messages,
    orders: customerOrders,
    user: safeCustomer(session.account)
  });
}
