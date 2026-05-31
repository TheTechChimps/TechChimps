import { NextResponse } from "next/server";
import { getInboxMessages, safeCustomer } from "@/lib/accounts";
import { getCustomerSession } from "@/lib/customer-session";
import { getLiveChatMessages, isVisibleLiveChatMessage } from "@/lib/live-chat";
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
  const supportSessionId = `customer-${session.account.id}`;
  const chatThreads = await Promise.all(
    [
      {
        kind: "support" as const,
        label: "General support",
        orderReference: "",
        sessionId: supportSessionId,
        status: "Open"
      },
      ...customerOrders.map((order) => ({
        kind: "order" as const,
        label: `${order.serviceName} - ${order.reference}`,
        orderReference: order.reference,
        sessionId: order.chatSessionId,
        status: order.status.replaceAll("_", " ")
      }))
    ].map(async (thread) => {
      const threadMessages = (await getLiveChatMessages(thread.sessionId)).filter(isVisibleLiveChatMessage);
      const lastMessage = threadMessages.at(-1);

      return {
        ...thread,
        lastMessage: lastMessage?.body ?? "No messages yet. Start the conversation here.",
        lastMessageAt: lastMessage?.createdAt ?? "",
        messages: threadMessages
      };
    })
  );

  return NextResponse.json({
    chatThreads,
    inbox: messages,
    orders: customerOrders,
    user: safeCustomer(session.account)
  });
}
