import { NextResponse } from "next/server";
import { getInboxMessages, listCustomers, normalizeEmail, type CustomerInboxMessage, type PublicCustomerAccount } from "@/lib/accounts";
import { adminUnauthorized, isAdminRequestAuthenticated } from "@/lib/admin-session";
import { listBuildPrompts, type BuildPromptRecord } from "@/lib/build-prompts";
import { getLiveChatSessions, type LiveChatSessionSummary } from "@/lib/live-chat";
import { listOrders, type OrderRecord } from "@/lib/orders";

export const dynamic = "force-dynamic";

type CustomerDossier = {
  chats: LiveChatSessionSummary[];
  customer: PublicCustomerAccount;
  inbox: CustomerInboxMessage[];
  orders: OrderRecord[];
  prompts: BuildPromptRecord[];
};

function fallbackCustomer(email: string, name?: string): PublicCustomerAccount {
  const now = new Date().toISOString();

  return {
    createdAt: now,
    email,
    hasPassword: false,
    id: `pending-${email}`,
    name: name?.trim() || email.split("@")[0] || "Customer",
    updatedAt: now
  };
}

function uniqueByEmail(customers: PublicCustomerAccount[], orders: OrderRecord[], prompts: BuildPromptRecord[]) {
  const byEmail = new Map<string, PublicCustomerAccount>();

  for (const customer of customers) {
    byEmail.set(normalizeEmail(customer.email), customer);
  }

  for (const order of orders) {
    const email = normalizeEmail(order.contactEmail);
    if (email && !byEmail.has(email)) {
      byEmail.set(email, fallbackCustomer(email, order.contactName));
    }
  }

  for (const prompt of prompts) {
    const email = normalizeEmail(prompt.customerEmail);
    if (email && !byEmail.has(email)) {
      byEmail.set(email, fallbackCustomer(email, prompt.customerName));
    }
  }

  return Array.from(byEmail.values());
}

export async function GET(request: Request) {
  if (!isAdminRequestAuthenticated(request)) return adminUnauthorized();

  const [customers, orders, prompts, sessions] = await Promise.all([
    listCustomers(),
    listOrders(),
    listBuildPrompts(),
    getLiveChatSessions()
  ]);
  const allCustomers = uniqueByEmail(customers, orders, prompts);

  const dossiers = await Promise.all(
    allCustomers.map(async (customer): Promise<CustomerDossier> => {
      const email = normalizeEmail(customer.email);
      const customerOrders = orders.filter((order) => normalizeEmail(order.contactEmail) === email);
      const customerPrompts = prompts.filter((prompt) => normalizeEmail(prompt.customerEmail) === email);
      const chatSessionIds = new Set([
        `customer-${customer.id}`,
        ...customerOrders.map((order) => order.chatSessionId)
      ]);
      const customerChats = sessions.filter((session) => chatSessionIds.has(session.sessionId));
      const inbox = customer.id.startsWith("pending-") ? [] : await getInboxMessages(customer.id);

      return {
        chats: customerChats,
        customer,
        inbox,
        orders: customerOrders,
        prompts: customerPrompts
      };
    })
  );

  return NextResponse.json({
    customers: dossiers.sort((a, b) => {
      const aLatest = [a.customer.updatedAt, a.orders[0]?.updatedAt, a.inbox[0]?.createdAt, a.prompts[0]?.updatedAt]
        .filter(Boolean)
        .sort()
        .at(-1);
      const bLatest = [b.customer.updatedAt, b.orders[0]?.updatedAt, b.inbox[0]?.createdAt, b.prompts[0]?.updatedAt]
        .filter(Boolean)
        .sort()
        .at(-1);

      return (bLatest ?? "").localeCompare(aLatest ?? "");
    })
  });
}
