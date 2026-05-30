import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";
import { listJson, readJson, writeJson } from "@/lib/storage";
import type { OrderRecord } from "@/lib/orders";

export const CUSTOMER_SESSION_COOKIE = "techchimps_customer_session";

export type CustomerAccount = {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  passwordSalt?: string;
  passwordIterations?: number;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
};

export type PublicCustomerAccount = {
  id: string;
  email: string;
  name: string;
  hasPassword: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
};

export type CustomerSession = {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

export type CustomerInboxMessage = {
  id: string;
  userId: string;
  author: "TechChimps" | "Studio support" | "System";
  subject: string;
  body: string;
  projectReference?: string;
  readAt?: string;
  createdAt: string;
};

const ACCOUNT_STORE = "techchimps-accounts";
const USER_PREFIX = "users/";
const SESSION_PREFIX = "sessions/";
const INBOX_PREFIX = "inbox/";
const SESSION_DAYS = 180;
const PASSWORD_ITERATIONS = 150000;

function now() {
  return new Date().toISOString();
}

function userKey(email: string) {
  return `${USER_PREFIX}${hashToken(normalizeEmail(email))}`;
}

function sessionKey(token: string) {
  return `${SESSION_PREFIX}${hashToken(token)}`;
}

function inboxKey(userId: string) {
  return `${INBOX_PREFIX}${userId}`;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function publicCustomer(account: CustomerAccount): PublicCustomerAccount {
  return {
    id: account.id,
    email: account.email,
    name: account.name,
    hasPassword: Boolean(account.passwordHash && account.passwordSalt),
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
    lastLoginAt: account.lastLoginAt
  };
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string) {
  return password.length >= 8;
}

export function safeCustomer(account: CustomerAccount) {
  return publicCustomer(account);
}

export async function getCustomerByEmail(email: string) {
  if (!isValidEmail(email)) return null;
  return readJson<CustomerAccount>(ACCOUNT_STORE, userKey(email));
}

export async function getCustomerById(userId: string) {
  const accounts = await listJson<CustomerAccount>(ACCOUNT_STORE, USER_PREFIX);
  return accounts.find((account) => account.id === userId) ?? null;
}

export async function listCustomers() {
  const customers = await listJson<CustomerAccount>(ACCOUNT_STORE, USER_PREFIX);
  return customers
    .map(publicCustomer)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveCustomer(account: CustomerAccount) {
  await writeJson(ACCOUNT_STORE, userKey(account.email), account);
  return account;
}

export async function deleteCustomerAccount(email: string) {
  const account = await getCustomerByEmail(email);
  if (account) {
    await writeJson<CustomerInboxMessage[] | null>(ACCOUNT_STORE, inboxKey(account.id), null);
  }

  await writeJson<CustomerAccount | null>(ACCOUNT_STORE, userKey(email), null);
  return account;
}

export async function ensureCustomerAccount({
  email,
  name
}: {
  email: string;
  name?: string;
}) {
  const normalizedEmail = normalizeEmail(email);
  const existing = await getCustomerByEmail(normalizedEmail);
  const nextName = name?.trim() || existing?.name || normalizedEmail.split("@")[0] || "Customer";

  if (existing) {
    const updated = {
      ...existing,
      name: existing.name || nextName,
      updatedAt: now()
    };
    await saveCustomer(updated);
    return updated;
  }

  const createdAt = now();
  const account: CustomerAccount = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    name: nextName,
    createdAt,
    updatedAt: createdAt
  };

  await saveCustomer(account);
  await addInboxMessage({
    userId: account.id,
    author: "TechChimps",
    subject: "Your TechChimps account is ready",
    body:
      "We created this secure customer space automatically from your email. Set a password with the same email to see project updates, payments, and studio messages."
  });

  return account;
}

export async function ensureCustomerForOrder(order: OrderRecord) {
  const account = await ensureCustomerAccount({
    email: order.contactEmail,
    name: order.contactName
  });
  const inbox = await getInboxMessages(account.id);
  const hasOrderLinkMessage = inbox.some(
    (message) => message.projectReference === order.reference && message.subject === `${order.serviceName} added to your portal`
  );

  if (!hasOrderLinkMessage) {
    await addInboxMessage({
      userId: account.id,
      author: "System",
      subject: `${order.serviceName} added to your portal`,
      body: `Your ${order.serviceName} request is now linked to your portal. Reference: ${order.reference}.`,
      projectReference: order.reference
    });
  }

  return account;
}

export async function registerOrClaimCustomer({
  email,
  name,
  password
}: {
  email: string;
  name: string;
  password: string;
}) {
  if (!isValidEmail(email)) {
    throw new Error("Use a valid email address.");
  }

  if (!validatePassword(password)) {
    throw new Error("Password must be at least 8 characters.");
  }

  const normalizedEmail = normalizeEmail(email);
  const existing = await getCustomerByEmail(normalizedEmail);

  if (existing?.passwordHash) {
    throw new Error("This account already has a password. Log in instead.");
  }

  const salt = randomBytes(16).toString("hex");
  const createdAt = existing?.createdAt ?? now();
  const account: CustomerAccount = {
    id: existing?.id ?? crypto.randomUUID(),
    email: normalizedEmail,
    name: name.trim() || existing?.name || normalizedEmail.split("@")[0] || "Customer",
    passwordHash: hashPassword(password, salt),
    passwordSalt: salt,
    passwordIterations: PASSWORD_ITERATIONS,
    createdAt,
    updatedAt: now()
  };

  await saveCustomer(account);

  if (!existing) {
    await addInboxMessage({
      userId: account.id,
      author: "TechChimps",
      subject: "Welcome to your TechChimps portal",
      body: "Your account is live. Orders placed with this email will appear here automatically."
    });
  }

  return account;
}

export async function loginCustomer(email: string, password: string) {
  const account = await getCustomerByEmail(email);

  if (!account || !account.passwordHash || !account.passwordSalt) {
    return null;
  }

  if (!verifyPassword(password, account.passwordSalt, account.passwordHash, account.passwordIterations)) {
    return null;
  }

  const updated = {
    ...account,
    lastLoginAt: now(),
    updatedAt: now()
  };

  await saveCustomer(updated);
  return updated;
}

export async function createCustomerSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const createdAt = new Date();
  const expiresAt = new Date(createdAt);
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  const session: CustomerSession = {
    id: crypto.randomUUID(),
    userId,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  await writeJson(ACCOUNT_STORE, sessionKey(token), session);
  return { token, session };
}

export async function getCustomerFromSessionToken(token?: string | null) {
  if (!token) return null;

  const session = await readJson<CustomerSession>(ACCOUNT_STORE, sessionKey(token));
  if (!session || new Date(session.expiresAt).getTime() < Date.now()) return null;

  const account = await getCustomerById(session.userId);
  return account ? { account, session } : null;
}

export async function clearCustomerSession(token?: string | null) {
  if (!token) return;
  await writeJson<CustomerSession | null>(ACCOUNT_STORE, sessionKey(token), null);
}

export async function getInboxMessages(userId: string) {
  const messages = (await readJson<CustomerInboxMessage[]>(ACCOUNT_STORE, inboxKey(userId))) ?? [];
  return messages.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addInboxMessage({
  userId,
  author = "Studio support",
  subject,
  body,
  projectReference
}: {
  userId: string;
  author?: CustomerInboxMessage["author"];
  subject: string;
  body: string;
  projectReference?: string;
}) {
  const messages = (await readJson<CustomerInboxMessage[]>(ACCOUNT_STORE, inboxKey(userId))) ?? [];
  const message: CustomerInboxMessage = {
    id: crypto.randomUUID(),
    userId,
    author,
    subject: subject.trim(),
    body: body.trim(),
    projectReference,
    createdAt: now()
  };

  await writeJson(ACCOUNT_STORE, inboxKey(userId), [message, ...messages].slice(0, 200));
  return message;
}

export async function markInboxMessageRead(userId: string, messageId?: string) {
  const messages = await getInboxMessages(userId);
  const readAt = now();
  const updated = messages.map((message) =>
    !messageId || message.id === messageId
      ? {
          ...message,
          readAt: message.readAt ?? readAt
        }
      : message
  );

  await writeJson(ACCOUNT_STORE, inboxKey(userId), updated);
  return updated;
}

function hashPassword(password: string, salt: string) {
  return pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, 64, "sha256").toString("hex");
}

function verifyPassword(password: string, salt: string, storedHash: string, iterations = PASSWORD_ITERATIONS) {
  const candidate = pbkdf2Sync(password, salt, iterations, 64, "sha256");
  const stored = Buffer.from(storedHash, "hex");

  if (candidate.length !== stored.length) return false;
  return timingSafeEqual(candidate, stored);
}
