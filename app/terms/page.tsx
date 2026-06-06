import { LegalPage } from "@/components/legal/legal-page";
import { getContactEmail } from "@/lib/contact";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Terms of Service",
  description: "Simple TechChimps service terms for quotes, payments, delivery, customer content, support, and revisions.",
  path: "/terms"
});

export default function TermsPage() {
  const email = getContactEmail();

  return (
    <LegalPage
      eyebrow="Terms"
      intro="Clear terms help keep small builds simple, fair, and friendly for everyone."
      title="Terms of service"
      sections={[
        {
          title: "Services",
          body: [
            "TechChimps provides websites, apps, bots, automation, creative design, audio, video editing, beat production, Python tools, document support, desktop tools, care plans, support, and custom software services.",
            "Every order is based on the information you provide in the request form, chat, uploads, or agreed written messages."
          ]
        },
        {
          title: "Quotes and payments",
          body: [
            "Prices shown on the website are starter prices or clear service prices. Custom, discounted, or unusual requests may need review before payment.",
            "Paid work starts after checkout or written approval. Stripe handles card payment securely and may issue receipts or invoices."
          ]
        },
        {
          title: "Customer responsibilities",
          body: [
            "You are responsible for providing accurate content, access, files, brand assets, and instructions needed to complete the project.",
            "You must have the right to use any images, logos, copy, accounts, or materials you send us."
          ]
        },
        {
          title: "Delivery and revisions",
          body: [
            "Timelines are practical estimates. Rush or priority delivery can speed up scheduling, but complex requests, late content, or third-party delays can affect completion.",
            "Reasonable fixes and small changes are handled fairly. Bigger changes or new features may need a fresh quote."
          ]
        },
        {
          title: "Final acceptance",
          body: [
            "When a project is ready to close, TechChimps may send a final acceptance link by live chat, customer portal, email, WhatsApp, or another agreed contact method.",
            "By signing final acceptance, you confirm you have received the agreed work, reviewed the outcome, are happy for the order to be marked complete, and understand that future changes or extra scope may need a new quote.",
            "Final acceptance limits discretionary refunds for accepted completed work, dissatisfaction raised after sign-off, or change of mind after delivery. It does not remove statutory rights that cannot legally be excluded."
          ]
        },
        {
          title: "Refund promise before sign-off",
          body: [
            "If you are unhappy with the final result, contact us before signing final acceptance. We will try to fix reasonable issues, clarify the work, or discuss a fair refund where appropriate.",
            "We keep this process practical and human because small digital projects should feel safe, clear, and fair."
          ]
        },
        {
          title: "Support and contact",
          body: [
            "Live support and portal messages are provided to keep projects clear and calm.",
            `For anything urgent, unclear, or unhappy, contact ${email} so we can help early.`
          ]
        }
      ]}
    />
  );
}
