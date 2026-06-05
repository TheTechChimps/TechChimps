import { FinalCta } from "@/components/sections/final-cta";
import { LiveSupportWidget } from "@/components/sections/live-support-widget";
import { Pricing } from "@/components/sections/pricing";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Simple Pricing From GBP 19",
  description:
    "Simple TechChimps prices from GBP 19, with clear service options for websites, apps, creative design, audio, video, beats, Python tools, secure checkout, and custom offers.",
  path: "/pricing",
  keywords: [
    "affordable web design UK",
    "business websites",
    "automation services UK",
    "logo design UK",
    "video editing services UK",
    "mixing and mastering UK",
    "Python automation services"
  ]
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
