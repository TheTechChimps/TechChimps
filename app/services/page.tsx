import { FinalCta } from "@/components/sections/final-cta";
import { LiveSupportWidget } from "@/components/sections/live-support-widget";
import { ServicesOverview } from "@/components/sections/services-overview";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Affordable Tech Services UK",
  description:
    "Choose a clear TechChimps service, from quick launch pages to websites, apps, creative design, audio, video editing, custom beats, Python programs, bots, automation, desktop tools, document help, and care plans.",
  path: "/services",
  keywords: [
    "affordable web design UK",
    "custom software development",
    "Discord bot development",
    "logo design UK",
    "video editing services UK",
    "mixing and mastering UK",
    "Python automation services",
    "document formatting help"
  ]
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
