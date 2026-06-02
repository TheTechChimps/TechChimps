export type QuotePayload = {
  attachmentNames?: string[];
  serviceType: string;
  budget: string;
  timeline: string;
  deliverySpeed: string;
  completionDate: string;
  goals: string;
  creativeControl?: boolean;
  serviceAnswers?: {
    answer: string;
    id: string;
    label: string;
    prompt: string;
  }[];
  contactName: string;
  contactEmail: string;
  estimate: number;
  discountCode?: string;
  offerMode: "standard" | "custom" | "discount";
  offerAmount: string;
  offerReason: string;
  uploadBatchId?: string;
  uploadedFiles?: {
    key: string;
    name: string;
    size: number;
    type: string;
  }[];
};

export type ApiResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

export type QuoteResponse = {
  chatSessionId: string;
  duplicateOpenTicket?: boolean;
  message?: string;
  reference: string;
  status: string;
};

export type CheckoutResponse = {
  chatSessionId: string;
  duplicateOpenTicket?: boolean;
  message?: string;
  reference: string;
  sessionId?: string;
  setupRequired?: boolean;
  url?: string;
};

export type DiscountValidationResponse = {
  discount: {
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
};

export async function uploadProjectFiles(batchId: string, files: File[]): Promise<ApiResult<NonNullable<QuotePayload["uploadedFiles"]>>> {
  if (!files.length) {
    return { ok: true, data: [] };
  }

  const formData = new FormData();
  formData.append("batchId", batchId);
  files.forEach((file) => formData.append("files", file));

  const response = await fetch("/api/uploads", {
    body: formData,
    method: "POST"
  });

  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    files?: NonNullable<QuotePayload["uploadedFiles"]>;
  };

  if (!response.ok) {
    return {
      ok: false,
      error: data.error ?? "Files could not be uploaded."
    };
  }

  return {
    ok: true,
    data: data.files ?? []
  };
}

export async function submitQuoteRequest(payload: QuotePayload): Promise<ApiResult<QuoteResponse>> {
  const response = await fetch("/api/quote", {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  if (!response.ok) {
    return {
      ok: false,
      error: "The request could not be saved. Please try again."
    };
  }

  return {
    ok: true,
    data: (await response.json()) as QuoteResponse
  };
}

export async function createCheckoutSession(payload: QuotePayload): Promise<ApiResult<CheckoutResponse>> {
  const response = await fetch("/api/checkout", {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  const data = (await response.json()) as CheckoutResponse & { error?: string };

  if (!response.ok) {
    return {
      ok: false,
      data,
      error: data.error ?? "Checkout could not start."
    };
  }

  return {
    ok: true,
    data
  };
}

export async function validateDiscountCode({
  amount,
  code,
  serviceType
}: {
  amount: number;
  code: string;
  serviceType: string;
}): Promise<ApiResult<DiscountValidationResponse["discount"]>> {
  const response = await fetch("/api/discount-codes/validate", {
    body: JSON.stringify({ amount, code, serviceType }),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  const data = (await response.json().catch(() => ({}))) as DiscountValidationResponse & { error?: string };

  if (!response.ok) {
    return {
      ok: false,
      error: data.error ?? "Discount code could not be checked."
    };
  }

  return {
    ok: true,
    data: data.discount
  };
}
