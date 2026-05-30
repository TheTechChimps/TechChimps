import { Hero } from "@/components/sections/hero";
import { LiveSupportWidget } from "@/components/sections/live-support-widget";
import { Process } from "@/components/sections/process";
import { TrustBar } from "@/components/sections/trust-bar";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <TrustBar />
      <Process />
      <LiveSupportWidget />
    </main>
  );
}
