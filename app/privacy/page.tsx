import { LegalPage } from "@/components/legal/legal-page";
import { getContactEmail } from "@/lib/contact";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Privacy Policy",
  description: "How TechChimps handles customer details, orders, uploads, live support, payments, and account data.",
  path: "/privacy"
});

export default function PrivacyPage() {
  const email = getContactEmail();

  return (
    <LegalPage
      eyebrow="Privacy"
      intro="We keep data collection practical: enough to quote, build, support, and improve your TechChimps project."
      title="Privacy policy"
      sections={[
        {
          title: "What we collect",
          body: [
            "We collect the details you provide through request forms, checkout, uploads, live chat, customer accounts, and support messages.",
            "This can include your name, email, project brief, selected service, budget, timeline, uploaded files, chat messages, payment reference, and project notes."
          ]
        },
        {
          title: "How we use it",
          body: [
            "We use your information to create quotes, process orders, open live support, prepare project prompts, send updates, and deliver the work you requested.",
            "We also use stored order and support records to keep the business organised, prevent lost messages, and provide maintenance or aftercare."
          ]
        },
        {
          title: "Payments",
          body: [
            "Payments are handled by Stripe. We do not store card numbers on this website.",
            "We store the Stripe checkout reference, payment status, order value, and receipt link where available so your portal can show the correct order history."
          ]
        },
        {
          title: "Sharing and suppliers",
          body: [
            "We only share data with services needed to run the business, such as hosting, storage, payment, email, analytics, automation, or support tools.",
            "We do not sell customer data."
          ]
        },
        {
          title: "Your choices",
          body: [
            `You can ask for a copy, correction, or deletion of your personal data by emailing ${email}.`,
            "Some order, payment, invoice, and business records may need to be kept where law, tax, dispute handling, or fraud prevention requires it."
          ]
        }
      ]}
    />
  );
}
