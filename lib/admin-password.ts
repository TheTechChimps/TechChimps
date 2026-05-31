import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { readJson, writeJson } from "@/lib/storage";

type StoredAdminPassword = {
  createdAt: string;
  hash: string;
  salt: string;
  updatedAt: string;
};

const ADMIN_AUTH_STORE = "techchimps-admin-auth";
const ADMIN_PASSWORD_KEY = "password";
const SCRYPT_KEY_LENGTH = 64;

function hashPassword(password: string, salt = randomBytes(16).toString("base64url")) {
  const hash = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("base64url");
  return { hash, salt };
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function getTemporaryAdminPassword() {
  return process.env.ADMIN_TEMPORARY_PASSWORD || "Password";
}

export function isValidNewAdminPassword(password: string) {
  const trimmed = password.trim();
  return trimmed.length >= 8 && trimmed !== getTemporaryAdminPassword();
}

export async function getStoredAdminPassword() {
  return readJson<StoredAdminPassword>(ADMIN_AUTH_STORE, ADMIN_PASSWORD_KEY);
}

export async function hasStoredAdminPassword() {
  return Boolean(await getStoredAdminPassword());
}

export async function verifyStoredAdminPassword(password: string) {
  const stored = await getStoredAdminPassword();
  if (!stored) return false;

  const candidate = hashPassword(password, stored.salt);
  return safeEqual(candidate.hash, stored.hash);
}

export async function setStoredAdminPassword(password: string) {
  if (!isValidNewAdminPassword(password)) {
    throw new Error("Choose a stronger password that is at least 8 characters and not the temporary password.");
  }

  const now = new Date().toISOString();
  const existing = await getStoredAdminPassword();
  const hashed = hashPassword(password);
  const record: StoredAdminPassword = {
    createdAt: existing?.createdAt ?? now,
    hash: hashed.hash,
    salt: hashed.salt,
    updatedAt: now
  };

  await writeJson(ADMIN_AUTH_STORE, ADMIN_PASSWORD_KEY, record);
  return record;
}
