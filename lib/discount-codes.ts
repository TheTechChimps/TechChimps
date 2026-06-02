export type DiscountScope = "one_time_services";

export type DiscountCode = {
  active: boolean;
  appliesTo: DiscountScope;
  code: string;
  createdAt: string;
  description: string;
  label: string;
  percentOff: number;
  updatedAt: string;
};

export type DiscountEligibility = {
  isSubscription?: boolean;
  priceSuffix?: string;
  serviceCategory?: string;
};

export type DiscountApplication = {
  amount: number;
  code?: string;
  description?: string;
  discountAmount: number;
  ineligibleReason?: string;
  label?: string;
  originalAmount: number;
  percentOff: number;
  valid: boolean;
};

const MIN_CHECKOUT_AMOUNT_GBP = 1;

export const defaultDiscountCodes: DiscountCode[] = [
  {
    active: true,
    appliesTo: "one_time_services",
    code: "TECHCHIMPS99",
    createdAt: "2026-06-02T00:00:00.000Z",
    description: "99% off approved TechChimps customer checkout links.",
    label: "TechChimps 99% discount",
    percentOff: 99,
    updatedAt: "2026-06-02T00:00:00.000Z"
  }
];

export function normalizeDiscountCode(value?: string) {
  return (value ?? "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function isDiscountEligible(eligibility: DiscountEligibility = {}) {
  return !eligibility.isSubscription && !eligibility.priceSuffix && eligibility.serviceCategory !== "Care";
}

export function emptyDiscountApplication(amount: number, ineligibleReason?: string): DiscountApplication {
  const originalAmount = Number.isFinite(amount) && amount > 0 ? roundMoney(amount) : 0;

  return {
    amount: originalAmount,
    discountAmount: 0,
    ineligibleReason,
    originalAmount,
    percentOff: 0,
    valid: false
  };
}

export function applyDiscountCode(
  amount: number,
  discountCode?: DiscountCode | null,
  eligibility: DiscountEligibility = {}
): DiscountApplication {
  const originalAmount = Number.isFinite(amount) && amount > 0 ? roundMoney(amount) : 0;

  if (!isDiscountEligible(eligibility)) {
    return emptyDiscountApplication(originalAmount, "Discount codes do not apply to monthly care plans.");
  }

  if (!discountCode || !discountCode.active || originalAmount <= 0) {
    return emptyDiscountApplication(originalAmount);
  }

  const percentOff = Math.min(99, Math.max(1, Math.round(discountCode.percentOff)));
  const discountedAmount = Math.max(MIN_CHECKOUT_AMOUNT_GBP, roundMoney(originalAmount * (1 - percentOff / 100)));

  return {
    amount: discountedAmount,
    code: discountCode.code,
    description: discountCode.description,
    discountAmount: roundMoney(originalAmount - discountedAmount),
    label: discountCode.label,
    originalAmount,
    percentOff,
    valid: true
  };
}

export function getDefaultDiscountCode(value?: string) {
  const normalized = normalizeDiscountCode(value);
  return defaultDiscountCodes.find((discountCode) => discountCode.code === normalized) ?? null;
}

export function applyDiscount(amount: number, value?: string, eligibility: DiscountEligibility = {}) {
  return applyDiscountCode(amount, getDefaultDiscountCode(value), eligibility);
}
