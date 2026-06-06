import { LegalPage } from "@/components/legal/legal-page";
import { getContactEmail } from "@/lib/contact";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Refunds and Cancellations",
  description: "Friendly TechChimps refund and cancellation guidance for digital services, orders, and care plans.",
  path: "/refunds"
});

export default function RefundsPage() {
  const email = getContactEmail();

  return (
    <LegalPage
      eyebrow="Refunds"
      intro="Digital service work moves quickly, so we keep refund decisions clear, human, and based on the stage of the project."
      title="Refunds and cancellations"
      sections={[
        {
          title: "Our result promise",
          body: [
            "If you are not happy with the final result, tell us before final acceptance. We will listen, fix reasonable issues, explain options clearly, or discuss a fair refund where appropriate.",
            "We want customers to feel safe starting a project, while also keeping completed and accepted digital work fair for both sides."
          ]
        },
        {
          title: "Before work starts",
          body: [
            "If you paid by mistake or change your mind before meaningful work has started, contact us as soon as possible.",
            "Where possible, we can cancel the order or agree a fair refund."
          ]
        },
        {
          title: "After work starts",
          body: [
            "Once planning, design, coding, configuration, automation, or setup work has started, refunds are reviewed based on work already completed.",
            "If something is wrong, tell us early. We would rather fix it, clarify it, or adjust the direction than leave you stuck."
          ]
        },
        {
          title: "Completed work",
          body: [
            "Completed digital work, delivered files, launched pages, configured servers, bots, apps, or automation work are normally not refundable.",
            "Before final close-off, we may ask you to sign a final acceptance confirming you received the work and are happy with the outcome.",
            "After final acceptance is signed, discretionary refunds for dissatisfaction, change of mind, or accepted completed work are not normally available. This does not affect legal rights that cannot be excluded, such as genuine faults, work not matching the agreed description, or services not provided with reasonable care and skill."
          ]
        },
        {
          title: "Monthly care plans",
          body: [
            "Monthly care or priority support plans can be cancelled for future billing periods.",
            "Past months already provided are not normally refundable unless we agree otherwise."
          ]
        },
        {
          title: "How to request help",
          body: [
            `Email ${email} or use your customer portal with your order reference and a simple explanation of what happened.`,
            "We aim to keep the conversation friendly, practical, and focused on the quickest fair outcome."
          ]
        }
      ]}
    />
  );
}
