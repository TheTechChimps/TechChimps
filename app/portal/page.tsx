import { CloudUpload, Download, FileText, LifeBuoy, Rocket, ShieldCheck } from "lucide-react";
import { CustomerPortal } from "@/components/portal/customer-portal";
import { Card } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { getContactEmail } from "@/lib/contact";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Client Portal",
  description:
    "Secure TechChimps customer portal for account login, private inbox messages, project requests, invoices, uploads, support, and files.",
  path: "/portal"
});

const portalFeatures = [
  { title: "Project updates", text: "Plain-English progress, next steps, and decisions.", icon: Rocket },
  { title: "Invoices", text: "Clear balances, payment status, and downloadable receipts.", icon: FileText },
  { title: "Uploads", text: "Secure project files, examples, copy, and brand assets.", icon: CloudUpload },
  { title: "Support tickets", text: "Friendly requests with priority, status, and history.", icon: LifeBuoy },
  { title: "Maintenance", text: "Care plan checks, requests, and monthly summaries.", icon: ShieldCheck },
  { title: "Downloads", text: "Launch files, guides, exports, and handoff documents.", icon: Download }
];

export default function PortalPage() {
  const contactEmail = getContactEmail();

  return (
    <main>
      <CustomerPortal contactEmail={contactEmail} />

      <section className="section">
        <div className="container grid grid-3">
          {portalFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card className="portal-feature" key={feature.title}>
                <Icon aria-hidden size={25} />
                <h2>{feature.title}</h2>
                <p>{feature.text}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="section-tight">
        <div className="container portal-status">
          <StatusIndicator label="Secure customer login" tone="good" />
          <StatusIndicator label="Live support available" tone="active" />
          <StatusIndicator label="Orders linked by email" tone="good" />
        </div>
      </section>
    </main>
  );
}
