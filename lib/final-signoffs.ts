import { randomBytes, randomUUID } from "crypto";
import { addInboxMessage, ensureCustomerForOrder } from "@/lib/accounts";
import { appendLiveChatMessage } from "@/lib/live-chat";
import { getOrder, listOrders, saveOrder, type OrderRecord } from "@/lib/orders";
import { listJson, readJson, writeJson } from "@/lib/storage";

export type FinalSignoffStatus = "pending" | "signed" | "void";

export type FinalSignoffRecord = {
  id: string;
  token: string;
  orderReference: string;
  orderServiceName: string;
  customerName: string;
  customerEmail: string;
  customMessage?: string;
  status: FinalSignoffStatus;
  linkSentAt?: string;
  signedAt?: string;
  signerName?: string;
  signerEmail?: string;
  signatureDataUrl?: string;
  signedUserAgent?: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicFinalSignoff = {
  token: string;
  status: FinalSignoffStatus;
  customMessage?: string;
  signedAt?: string;
  signerName?: string;
  order: {
    amount: number;
    completionDate: string;
    customerName: string;
    priceSuffix?: string;
    reference: string;
    serviceName: string;
  };
};

const SIGNOFF_STORE = "techchimps-final-signoffs";
const SIGNOFF_PREFIX = "signoffs/";
const TOKEN_PREFIX = "tokens/";

export const finalAcceptanceStatements = [
  "I confirm I am the customer, or I am authorised to approve this order on the customer's behalf.",
  "I confirm TechChimps has delivered the agreed service, product, files, access, or digital work for this order.",
  "I have reviewed the final result and I am happy for this order to be marked as accepted and complete.",
  "I understand that future changes, new features, extra edits, or new scope may need a new quote.",
  "I understand that after final acceptance, discretionary refunds for dissatisfaction, change of mind, or accepted completed work are not available, except where rights cannot legally be excluded."
];

function now() {
  return new Date().toISOString();
}

function token() {
  return randomBytes(24).toString("base64url");
}

function signoffKey(id: string) {
  return `${SIGNOFF_PREFIX}${id}`;
}

function tokenKey(value: string) {
  return `${TOKEN_PREFIX}${value}`;
}

function toPublicSignoff(signoff: FinalSignoffRecord, order: OrderRecord): PublicFinalSignoff {
  return {
    token: signoff.token,
    status: signoff.status,
    customMessage: signoff.customMessage,
    signedAt: signoff.signedAt,
    signerName: signoff.signerName,
    order: {
      amount: order.amount,
      completionDate: order.completionDate,
      customerName: order.contactName || signoff.customerName,
      priceSuffix: order.priceSuffix,
      reference: order.reference,
      serviceName: order.serviceName
    }
  };
}

export function finalSignoffUrl(signoff: FinalSignoffRecord, origin?: string) {
  const baseUrl = origin || process.env.NEXT_PUBLIC_SITE_URL || "https://techchimps.com";
  return new URL(`/signoff/${signoff.token}`, baseUrl).toString();
}

export async function listFinalSignoffs() {
  const signoffs = await listJson<FinalSignoffRecord>(SIGNOFF_STORE, SIGNOFF_PREFIX);
  return signoffs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getFinalSignoffByToken(value: string) {
  const id = await readJson<string>(SIGNOFF_STORE, tokenKey(value));
  return id ? readJson<FinalSignoffRecord>(SIGNOFF_STORE, signoffKey(id)) : null;
}

export async function listFinalSignoffsForOrder(reference: string) {
  const signoffs = await listFinalSignoffs();
  return signoffs.filter((signoff) => signoff.orderReference === reference);
}

export async function latestFinalSignoffForOrder(reference: string) {
  return (await listFinalSignoffsForOrder(reference))[0] ?? null;
}

async function saveFinalSignoff(signoff: FinalSignoffRecord) {
  await writeJson(SIGNOFF_STORE, signoffKey(signoff.id), signoff);
  await writeJson(SIGNOFF_STORE, tokenKey(signoff.token), signoff.id);
  return signoff;
}

export async function deleteFinalSignoff(signoff: Pick<FinalSignoffRecord, "id" | "token">) {
  await Promise.all([
    writeJson<FinalSignoffRecord | null>(SIGNOFF_STORE, signoffKey(signoff.id), null),
    writeJson<string | null>(SIGNOFF_STORE, tokenKey(signoff.token), null)
  ]);
}

export async function deleteFinalSignoffsForOrder(reference: string) {
  const signoffs = await listFinalSignoffsForOrder(reference);
  await Promise.all(signoffs.map((signoff) => deleteFinalSignoff(signoff)));
  return signoffs.length;
}

export async function createFinalSignoff({
  customMessage,
  forceNew = false,
  order
}: {
  customMessage?: string;
  forceNew?: boolean;
  order: OrderRecord;
}) {
  const latest = await latestFinalSignoffForOrder(order.reference);
  if (!forceNew && latest?.status === "pending") return latest;

  const createdAt = now();
  const signoff: FinalSignoffRecord = {
    id: randomUUID(),
    token: token(),
    orderReference: order.reference,
    orderServiceName: order.serviceName,
    customerName: order.contactName,
    customerEmail: order.contactEmail,
    customMessage: customMessage?.trim() || undefined,
    status: "pending",
    createdAt,
    updatedAt: createdAt
  };

  await saveOrder({
    ...order,
    finalSignoffStatus: "pending",
    finalSignoffToken: signoff.token,
    updatedAt: createdAt
  });

  return saveFinalSignoff(signoff);
}

export async function sendFinalSignoffToCustomer({
  customMessage,
  forceNew,
  origin,
  reference
}: {
  customMessage?: string;
  forceNew?: boolean;
  origin?: string;
  reference: string;
}) {
  const order = await getOrder(reference);
  if (!order) throw new Error("Order not found.");

  const signoff = await createFinalSignoff({ customMessage, forceNew, order });
  const url = finalSignoffUrl(signoff, origin);
  const sentAt = now();
  const updated = await saveFinalSignoff({
    ...signoff,
    linkSentAt: sentAt,
    updatedAt: sentAt
  });
  const message =
    `Final acceptance is ready for ${order.serviceName}. Please review and sign here when you are happy with the finished work: ${url}`;
  const account = await ensureCustomerForOrder(order);

  await Promise.all([
    appendLiveChatMessage({
      author: "TechChimps",
      body: message,
      role: "agent",
      sessionId: order.chatSessionId
    }),
    addInboxMessage({
      userId: account.id,
      author: "TechChimps",
      subject: "Final acceptance ready to sign",
      body: message,
      projectReference: order.reference
    })
  ]);

  return { signoff: updated, url };
}

export async function getPublicFinalSignoff(value: string) {
  const signoff = await getFinalSignoffByToken(value);
  if (!signoff || signoff.status === "void") return null;

  const order = await getOrder(signoff.orderReference);
  if (!order) return null;

  return toPublicSignoff(signoff, order);
}

export async function signFinalAcceptance({
  signatureDataUrl,
  signerEmail,
  signerName,
  token: value,
  userAgent
}: {
  signatureDataUrl: string;
  signerEmail: string;
  signerName: string;
  token: string;
  userAgent?: string;
}) {
  const signoff = await getFinalSignoffByToken(value);
  if (!signoff || signoff.status === "void") throw new Error("This acceptance link is not available.");
  if (signoff.status === "signed") return signoff;

  const normalizedSignerEmail = signerEmail.trim().toLowerCase();
  if (normalizedSignerEmail !== signoff.customerEmail.trim().toLowerCase()) {
    throw new Error("Use the same email address used for this order.");
  }

  if (!signatureDataUrl.startsWith("data:image/png;base64,") || signatureDataUrl.length > 350_000) {
    throw new Error("Please add a clear digital signature.");
  }

  const signedAt = now();
  const signed: FinalSignoffRecord = {
    ...signoff,
    signedAt,
    signerEmail: normalizedSignerEmail,
    signerName: signerName.trim(),
    signedUserAgent: userAgent?.slice(0, 240),
    signatureDataUrl,
    status: "signed",
    updatedAt: signedAt
  };
  const order = await getOrder(signoff.orderReference);

  await saveFinalSignoff(signed);

  if (order) {
    await saveOrder({
      ...order,
      finalSignoffSignedAt: signedAt,
      finalSignoffStatus: "signed",
      finalSignoffToken: signed.token,
      updatedAt: signedAt
    });

    await appendLiveChatMessage({
      author: signerName.trim() || signoff.customerName || "Customer",
      body: `Final acceptance signed for ${order.serviceName}. The customer confirmed they received the work and are happy with the final result.`,
      priority: "waiting",
      role: "visitor",
      sessionId: order.chatSessionId
    });
  }

  return signed;
}

export async function finalSignoffDashboard(origin?: string) {
  const [orders, signoffs] = await Promise.all([listOrders(), listFinalSignoffs()]);
  const signoffMap = new Map<string, FinalSignoffRecord[]>();

  for (const signoff of signoffs) {
    signoffMap.set(signoff.orderReference, [...(signoffMap.get(signoff.orderReference) ?? []), signoff]);
  }

  return {
    orders: orders
      .filter((order) => order.paidAt || order.stripePaymentStatus === "paid" || order.status === "support_connected" || order.status === "paid_waiting_support")
      .map((order) => {
        const latest = signoffMap.get(order.reference)?.[0] ?? null;
        return {
          latestSignoff: latest,
          signoffUrl: latest ? finalSignoffUrl(latest, origin) : "",
          order
        };
      }),
    signoffs
  };
}
