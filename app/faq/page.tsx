import { Faq } from "@/components/sections/faq";
import { FinalCta } from "@/components/sections/final-cta";
import { LiveSupportWidget } from "@/components/sections/live-support-widget";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "FAQ for Tech, Creative and Media Services",
  description: "Plain-English answers about TechChimps pricing, timelines, payments, care plans, creative work, audio, video, and custom software requests.",
  path: "/faq",
  keywords: ["beginner-friendly websites", "affordable web design UK", "custom software development", "video editing services UK", "mixing and mastering UK"]
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
