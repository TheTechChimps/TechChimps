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
            "TechChimps provides websites, apps, bots, automation, desktop tools, care plans, support, and custom software services.",
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
