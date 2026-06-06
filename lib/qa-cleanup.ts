import { deleteCustomerAccount, listCustomers, type PublicCustomerAccount } from "@/lib/accounts";
import type { AutomationEventRecord, CrmProjectRecord } from "@/lib/automation-webhooks";
import { deleteBuildPrompt, listBuildPrompts, type BuildPromptRecord } from "@/lib/build-prompts";
import { deleteFinalSignoff, listFinalSignoffs, type FinalSignoffRecord } from "@/lib/final-signoffs";
import { deleteLiveChatSessions, getLiveChatMessages } from "@/lib/live-chat";
import { deleteOrder, listOrders, type OrderRecord } from "@/lib/orders";
import { listJson, writeJson } from "@/lib/storage";

type QaCleanupCandidate = {
  automationEvents: AutomationEventRecord[];
  crmProjects: CrmProjectRecord[];
  customers: PublicCustomerAccount[];
  finalSignoffs: FinalSignoffRecord[];
  liveChatSessionIds: string[];
  orders: OrderRecord[];
  prompts: BuildPromptRecord[];
  references: string[];
};

const AUTOMATION_STORE = "techchimps-automation";

function isQaEmail(email?: string) {
  if (!email) return false;
  const [localPart, domain] = email.trim().toLowerCase().split("@");
  return domain === "techchimps.com" && /^(qa|test|smoke|launch-qa|production-qa)[.\-+_]/.test(localPart);
}

function includesQaMarker(value?: string) {
  if (!value) return false;
  return /\b(QA|smoke test|launch test|production smoke test|please ignore this order|ignore this launch readiness test)\b/i.test(value);
}

function isQaOrder(order: OrderRecord) {
  return (
    isQaEmail(order.contactEmail) ||
    /^QA\b/i.test(order.contactName) ||
    includesQaMarker(order.goals) ||
    includesQaMarker(order.offerReason)
  );
}

function isQaCustomer(customer: PublicCustomerAccount) {
  return isQaEmail(customer.email) || /^QA\b/i.test(customer.name);
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

export async function getQaCleanupCandidates(): Promise<QaCleanupCandidate> {
  const [orders, customers, prompts, liveChatMessages, automationEvents, crmProjects, finalSignoffs] = await Promise.all([
    listOrders(),
    listCustomers(),
    listBuildPrompts(),
    getLiveChatMessages(),
    listJson<AutomationEventRecord>(AUTOMATION_STORE, "events/"),
    listJson<CrmProjectRecord>(AUTOMATION_STORE, "crm/"),
    listFinalSignoffs()
  ]);

  const qaOrders = orders.filter(isQaOrder);
  const qaCustomers = customers.filter(isQaCustomer);
  const references = new Set(qaOrders.map((order) => order.reference));
  const customerIds = new Set(qaCustomers.map((customer) => customer.id));

  const qaPrompts = prompts.filter((prompt) => references.has(prompt.orderReference) || isQaEmail(prompt.customerEmail));
  qaPrompts.forEach((prompt) => references.add(prompt.orderReference));

  const qaAutomationEvents = automationEvents.filter(
    (event) =>
      references.has(event.reference) ||
      isQaEmail(event.order?.contactEmail) ||
      includesQaMarker(event.detail) ||
      includesQaMarker(event.order?.goals)
  );
  qaAutomationEvents.forEach((event) => references.add(event.reference));

  const qaCrmProjects = crmProjects.filter(
    (project) => references.has(project.reference) || isQaEmail(project.contactEmail) || includesQaMarker(project.latestEvent)
  );
  qaCrmProjects.forEach((project) => references.add(project.reference));

  const qaFinalSignoffs = finalSignoffs.filter(
    (signoff) =>
      references.has(signoff.orderReference) ||
      isQaEmail(signoff.customerEmail) ||
      /^QA\b/i.test(signoff.customerName) ||
      includesQaMarker(signoff.customMessage)
  );
  qaFinalSignoffs.forEach((signoff) => references.add(signoff.orderReference));

  const qaSessionIds = new Set<string>();
  for (const reference of references) {
    qaSessionIds.add(`order-${reference.toLowerCase()}`);
  }
  for (const customerId of customerIds) {
    qaSessionIds.add(`customer-${customerId}`);
  }
  for (const message of liveChatMessages) {
    if (
      qaSessionIds.has(message.sessionId) ||
      (message.sessionId.startsWith("order-tc-") && includesQaMarker(message.body)) ||
      (message.sessionId.startsWith("customer-") && includesQaMarker(message.body))
    ) {
      qaSessionIds.add(message.sessionId);
    }
  }

  return {
    automationEvents: qaAutomationEvents,
    crmProjects: qaCrmProjects,
    customers: qaCustomers,
    finalSignoffs: qaFinalSignoffs,
    liveChatSessionIds: uniqueSorted(Array.from(qaSessionIds)),
    orders: qaOrders,
    prompts: qaPrompts,
    references: uniqueSorted(Array.from(references))
  };
}

export function summarizeQaCleanup(candidates: QaCleanupCandidate) {
  return {
    automationEvents: candidates.automationEvents.length,
    crmProjects: candidates.crmProjects.length,
    customers: candidates.customers.length,
    finalSignoffs: candidates.finalSignoffs.length,
    liveChatSessions: candidates.liveChatSessionIds.length,
    orders: candidates.orders.length,
    prompts: candidates.prompts.length,
    references: candidates.references.length
  };
}

export async function runQaCleanup() {
  const candidates = await getQaCleanupCandidates();

  await Promise.all([
    ...candidates.orders.map((order) => deleteOrder(order.reference)),
    ...candidates.prompts.map((prompt) => deleteBuildPrompt(prompt.orderReference)),
    ...candidates.customers.map((customer) => deleteCustomerAccount(customer.email)),
    ...candidates.finalSignoffs.map((signoff) => deleteFinalSignoff(signoff)),
    ...candidates.automationEvents.map((event) =>
      writeJson<AutomationEventRecord | null>(AUTOMATION_STORE, `events/${event.id}`, null)
    ),
    ...candidates.crmProjects.map((project) => writeJson<CrmProjectRecord | null>(AUTOMATION_STORE, `crm/${project.reference}`, null))
  ]);
  const liveChatMessagesDeleted = await deleteLiveChatSessions(candidates.liveChatSessionIds);

  return {
    ...summarizeQaCleanup(candidates),
    liveChatMessagesDeleted
  };
}
