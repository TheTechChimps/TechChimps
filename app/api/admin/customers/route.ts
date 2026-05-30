import { NextResponse } from "next/server";
import { getInboxMessages, listCustomers } from "@/lib/accounts";
import { adminUnauthorized, isAdminRequestAuthenticated } from "@/lib/admin-session";
import { listOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminRequestAuthenticated(request)) return adminUnauthorized();

  const [customers, orders] = await Promise.all([listCustomers(), listOrders()]);
  const enriched = await Promise.all(
    customers.map(async (customer) => {
      const inbox = await getInboxMessages(customer.id);
      const customerOrders = orders.filter((order) => order.contactEmail.trim().toLowerCase() === customer.email);

      return {
        ...customer,
        orderCount: customerOrders.length,
        unreadCount: inbox.filter((message) => !message.readAt).length
      };
    })
  );

  return NextResponse.json({ customers: enriched });
}
