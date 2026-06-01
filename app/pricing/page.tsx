import { FinalCta } from "@/components/sections/final-cta";
import { LiveSupportWidget } from "@/components/sections/live-support-widget";
import { Pricing } from "@/components/sections/pricing";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Simple Pricing From GBP 49",
  description: "Simple TechChimps prices from GBP 49, with clear service options, delivery speeds, secure checkout, and custom offers.",
  path: "/pricing",
  keywords: ["affordable web design UK", "business websites", "automation services UK"]
});

export default function PricingPage() {
  return (
    <main>
      <Pricing />
      <FinalCta />
      <LiveSupportWidget />
    </main>
  );
}
