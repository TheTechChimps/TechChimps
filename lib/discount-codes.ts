export type DiscountCode = {
  code: string;
  description: string;
  label: string;
  percentOff: number;
};

export type DiscountApplication = {
  amount: number;
  code?: string;
  description?: string;
  discountAmount: number;
  label?: string;
  originalAmount: number;
  percentOff: number;
};

const MIN_CHECKOUT_AMOUNT_GBP = 1;

export const discountCodes: DiscountCode[] = [
  {
    code: "TECHCHIMPS99",
    description: "99% off approved TechChimps customer checkout links.",
    label: "TechChimps 99% discount",
    percentOff: 99
  }
];

export function normalizeDiscountCode(value?: string) {
  return (value ?? "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

export function getDiscountCode(value?: string) {
  const normalized = normalizeDiscountCode(value);
  return discountCodes.find((discountCode) => discountCode.code === normalized);
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function applyDiscount(amount: number, value?: string): DiscountApplication {
  const originalAmount = Number.isFinite(amount) && amount > 0 ? roundMoney(amount) : 0;
  const discountCode = getDiscountCode(value);

  if (!discountCode || originalAmount <= 0) {
    return {
      amount: originalAmount,
      discountAmount: 0,
      originalAmount,
      percentOff: 0
    };
  }

  const discountedAmount = Math.max(MIN_CHECKOUT_AMOUNT_GBP, roundMoney(originalAmount * (1 - discountCode.percentOff / 100)));

  return {
    amount: discountedAmount,
    code: discountCode.code,
    description: discountCode.description,
    discountAmount: roundMoney(originalAmount - discountedAmount),
    label: discountCode.label,
    originalAmount,
    percentOff: discountCode.percentOff
  };
}
