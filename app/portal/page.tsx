import { CustomerPortal } from "@/components/portal/customer-portal";
import { getContactEmail } from "@/lib/contact";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Login / Sign up",
  description:
    "Log in or sign up for your TechChimps account to view live chats, previous conversations, orders, receipts, and studio messages.",
  path: "/portal"
});

export default function PortalPage() {
  const contactEmail = getContactEmail();

  return (
    <main>
      <CustomerPortal contactEmail={contactEmail} />
    </main>
  );
}
