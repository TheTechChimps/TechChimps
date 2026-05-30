import type { OrderRecord } from "@/lib/orders";
import { getSiteUrl } from "@/lib/stripe";
import { formatPrice } from "@/lib/utils";

export type EmailSendResult = {
  detail: string;
  id?: string;
  provider: "resend";
  status: "sent" | "skipped" | "failed";
};

type SendEmailInput = {
  html: string;
  idempotencyKey?: string;
  subject: string;
  text: string;
  to: string;
};

function getResendApiKey() {
  return process.env.RESEND_API_KEY ?? "";
}

function getSenderEmail() {
  return process.env.EMAIL_FROM || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "techchimps@proton.me";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

export function getOutboundEmailReadiness() {
  const apiKey = getResendApiKey();
  const from = getSenderEmail();

  return {
    provider: "resend" as const,
    ready: Boolean(apiKey && from),
    detail: apiKey
      ? `Ready to send transactional email from ${from}.`
      : "Add RESEND_API_KEY after verifying a sending address or domain."
  };
}

export async function sendTransactionalEmail(input: SendEmailInput): Promise<EmailSendResult> {
  const apiKey = getResendApiKey();
  const from = getSenderEmail();

  if (!apiKey) {
    return {
      detail: "No RESEND_API_KEY configured, so the portal message was queued without external email.",
      provider: "resend",
      status: "skipped"
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from,
      html: input.html,
      subject: input.subject,
      text: input.text,
      to: input.to
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(input.idempotencyKey ? { "Idempotency-Key": input.idempotencyKey } : {})
    },
    method: "POST"
  });

  const payload = (await response.json().catch(() => null)) as { id?: string; message?: string; name?: string } | null;

  if (!response.ok) {
    return {
      detail: payload?.message || payload?.name || `Resend returned ${response.status}.`,
      provider: "resend",
      status: "failed"
    };
  }

  return {
    detail: "Outbound customer email sent.",
    id: payload?.id,
    provider: "resend",
    status: "sent"
  };
}

export function createOrderEmail(event: string, order: OrderRecord) {
  const siteUrl = getSiteUrl();
  const portalUrl = `${siteUrl}/portal`;
  const serviceName = order.serviceName;
  const price = formatPrice(order.amount, order.priceSuffix);
  const subject = event.includes("payment")
    ? `Payment confirmed for ${serviceName}`
    : event.includes("offer")
      ? `Your ${serviceName} offer is being reviewed`
      : `We received your ${serviceName} request`;
  const lead = event.includes("payment")
    ? "Your payment is confirmed and your live support thread is open."
    : event.includes("offer")
      ? "Your custom or discounted offer is in our review queue."
      : "Your request has arrived safely in the TechChimps studio.";
  const nextStep = event.includes("payment")
    ? "You can send extra details, questions, or changes in live support now."
    : "We will keep the next steps simple and reply through your portal.";
  const text = [
    `Hi ${order.contactName || "there"},`,
    "",
    lead,
    "",
    `Project: ${serviceName}`,
    `Reference: ${order.reference}`,
    `Price/estimate: ${price}`,
    "",
    nextStep,
    `Open your portal: ${portalUrl}`,
    "",
    "Never be scared to reach out for help or tell us if something does not feel right. We would rather fix it early and keep the process calm.",
    "",
    "TechChimps"
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#030c0a;color:#f6fff9;font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#030c0a;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#0d211c;border:1px solid #285a4d;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 8px;">
                <div style="color:#ffd84f;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;">TechChimps</div>
                <h1 style="margin:10px 0 12px;font-size:28px;line-height:1.1;color:#ffffff;">${escapeHtml(subject)}</h1>
                <p style="margin:0;color:#bdd3cb;font-size:16px;line-height:1.55;">${escapeHtml(lead)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#071a15;border:1px solid #285a4d;border-radius:12px;">
                  <tr><td style="padding:16px;color:#bdd3cb;">Project</td><td style="padding:16px;color:#ffffff;font-weight:700;">${escapeHtml(serviceName)}</td></tr>
                  <tr><td style="padding:16px;color:#bdd3cb;">Reference</td><td style="padding:16px;color:#ffffff;font-weight:700;">${escapeHtml(order.reference)}</td></tr>
                  <tr><td style="padding:16px;color:#bdd3cb;">Price</td><td style="padding:16px;color:#ffffff;font-weight:700;">${escapeHtml(price)}</td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;">
                <p style="color:#bdd3cb;font-size:15px;line-height:1.55;">${escapeHtml(nextStep)}</p>
                <a href="${portalUrl}" style="display:inline-block;background:#2ee6be;color:#03140f;text-decoration:none;font-weight:800;border-radius:999px;padding:12px 18px;">Open your portal</a>
                <p style="margin:22px 0 0;color:#bdd3cb;font-size:14px;line-height:1.55;">Never be scared to reach out for help or tell us if something does not feel right. We would rather fix it early and keep the process calm.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { html, subject, text };
}
