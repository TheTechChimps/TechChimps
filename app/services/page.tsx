import { FinalCta } from "@/components/sections/final-cta";
import { LiveSupportWidget } from "@/components/sections/live-support-widget";
import { ServicesOverview } from "@/components/sections/services-overview";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Services",
  description: "Choose a clear TechChimps tech service, from quick launch pages to websites, apps, bots, automation, desktop tools, and care plans.",
  path: "/services",
  keywords: ["affordable web design UK", "custom software development", "Discord bot development"]
});

export default function ServicesPage() {
  return (
    <main>
      <ServicesOverview />
      <FinalCta />
      <LiveSupportWidget />
    </main>
  );
}
