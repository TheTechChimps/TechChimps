import { getInboxMessages, listCustomers } from "@/lib/accounts";
import type { AutomationEventRecord, CrmProjectRecord } from "@/lib/automation-webhooks";
import { listBuildPrompts } from "@/lib/build-prompts";
import { listFinalSignoffs } from "@/lib/final-signoffs";
import { getLiveChatMessages } from "@/lib/live-chat";
import { listOrders } from "@/lib/orders";
import { getStorageMode, listJson } from "@/lib/storage";

export async function createBackupSnapshot() {
  const [customers, orders, prompts, liveChatMessages, automationEvents, crmProjects, finalSignoffs] = await Promise.all([
    listCustomers(),
    listOrders(),
    listBuildPrompts(),
    getLiveChatMessages(),
    listJson<AutomationEventRecord>("techchimps-automation", "events/"),
    listJson<CrmProjectRecord>("techchimps-automation", "crm/"),
    listFinalSignoffs()
  ]);
  const inbox = await Promise.all(
    customers.map(async (customer) => ({
      customerEmail: customer.email,
      customerId: customer.id,
      messages: await getInboxMessages(customer.id)
    }))
  );

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    storageMode: getStorageMode(),
    counts: {
      automationEvents: automationEvents.length,
      crmProjects: crmProjects.length,
      customers: customers.length,
      inboxThreads: inbox.length,
      finalSignoffs: finalSignoffs.length,
      liveChatMessages: liveChatMessages.length,
      orders: orders.length,
      prompts: prompts.length
    },
    data: {
      automationEvents,
      crmProjects,
      customers,
      finalSignoffs,
      inbox,
      liveChatMessages,
      orders,
      prompts
    }
  };
}
