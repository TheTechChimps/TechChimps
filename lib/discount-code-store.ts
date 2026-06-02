import {
  applyDiscountCode,
  defaultDiscountCodes,
  normalizeDiscountCode,
  type DiscountApplication,
  type DiscountCode,
  type DiscountEligibility
} from "@/lib/discount-codes";
import { listJson, writeJson } from "@/lib/storage";

const DISCOUNT_STORE = "techchimps-discounts";
const DISCOUNT_PREFIX = "codes/";

type DiscountCodeInput = {
  active?: boolean;
  code?: string;
  description?: string;
  label?: string;
  percentOff?: number;
};

function discountKey(code: string) {
  return `${DISCOUNT_PREFIX}${normalizeDiscountCode(code)}`;
}

function cleanPercent(value: unknown) {
  const percent = Number(value);
  if (!Number.isFinite(percent)) return 0;
  return Math.min(99, Math.max(1, Math.round(percent)));
}

function cleanCodeInput(input: DiscountCodeInput, existing?: DiscountCode): DiscountCode {
  const now = new Date().toISOString();
  const code = normalizeDiscountCode(input.code ?? existing?.code);
  const percentOff = cleanPercent(input.percentOff ?? existing?.percentOff ?? 10);

  if (!code) {
    throw new Error("Discount code is required.");
  }

  return {
    active: input.active ?? existing?.active ?? true,
    appliesTo: "one_time_services",
    code,
    createdAt: existing?.createdAt ?? now,
    description: (input.description ?? existing?.description ?? "A TechChimps customer discount.").trim(),
    label: (input.label ?? existing?.label ?? `${code} discount`).trim(),
    percentOff,
    updatedAt: now
  };
}

function mergeDefaultAndStored(storedCodes: DiscountCode[]) {
  const byCode = new Map(defaultDiscountCodes.map((discountCode) => [discountCode.code, discountCode]));

  for (const discountCode of storedCodes) {
    byCode.set(discountCode.code, {
      ...discountCode,
      appliesTo: "one_time_services",
      code: normalizeDiscountCode(discountCode.code),
      percentOff: cleanPercent(discountCode.percentOff)
    });
  }

  return Array.from(byCode.values()).sort((a, b) => a.code.localeCompare(b.code));
}

export async function listDiscountCodes() {
  const storedCodes = await listJson<DiscountCode>(DISCOUNT_STORE, DISCOUNT_PREFIX);
  return mergeDefaultAndStored(storedCodes);
}

export async function getDiscountCode(value?: string) {
  const normalized = normalizeDiscountCode(value);
  if (!normalized) return null;

  const codes = await listDiscountCodes();
  return codes.find((discountCode) => discountCode.code === normalized) ?? null;
}

export async function saveDiscountCode(input: DiscountCodeInput) {
  const existing = input.code ? await getDiscountCode(input.code) : undefined;
  const discountCode = cleanCodeInput(input, existing ?? undefined);
  await writeJson(DISCOUNT_STORE, discountKey(discountCode.code), discountCode);
  return discountCode;
}

export async function updateDiscountCode(code: string, input: DiscountCodeInput) {
  const existing = await getDiscountCode(code);

  if (!existing) {
    throw new Error("Discount code was not found.");
  }

  const discountCode = cleanCodeInput({ ...input, code: existing.code }, existing);
  await writeJson(DISCOUNT_STORE, discountKey(discountCode.code), discountCode);
  return discountCode;
}

export async function applyStoredDiscount(
  amount: number,
  value?: string,
  eligibility: DiscountEligibility = {}
): Promise<DiscountApplication> {
  const discountCode = await getDiscountCode(value);
  return applyDiscountCode(amount, discountCode, eligibility);
}
