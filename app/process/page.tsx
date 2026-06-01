import { FinalCta } from "@/components/sections/final-cta";
import { LiveSupportWidget } from "@/components/sections/live-support-widget";
import { Process } from "@/components/sections/process";
import { WhyChooseUs } from "@/components/sections/why-choose-us";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "How TechChimps Works",
  description: "See the simple TechChimps process: share the idea, get a clear plan, follow updates, and launch with support.",
  path: "/process",
  keywords: ["beginner-friendly websites", "custom software development", "automation services UK"]
});

export default function ProcessPage() {
  return (
    <main>
      <h1 className="visually-hidden">How TechChimps works</h1>
      <Process />
      <WhyChooseUs />
      <FinalCta />
      <LiveSupportWidget />
    </main>
  );
}
