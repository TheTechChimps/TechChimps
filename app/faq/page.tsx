import { Faq } from "@/components/sections/faq";
import { FinalCta } from "@/components/sections/final-cta";
import { LiveSupportWidget } from "@/components/sections/live-support-widget";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "FAQ",
  description: "Plain-English answers about TechChimps pricing, timelines, payments, care plans, and custom software requests.",
  path: "/faq",
  keywords: ["beginner-friendly websites", "affordable web design UK", "custom software development"]
});

export default function FaqPage() {
  return (
    <main>
      <Faq />
      <FinalCta />
      <LiveSupportWidget />
    </main>
  );
}
