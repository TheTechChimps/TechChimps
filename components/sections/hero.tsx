import { ArrowRight, CreditCard, MessageCircle, PoundSterling, ShieldCheck } from "lucide-react";
import { HeroStudio } from "@/components/sections/hero-studio";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";

const proof = [
  { label: "From \u00a349", icon: PoundSterling },
  { label: "Guided brief", icon: ShieldCheck },
  { label: "Secure checkout", icon: CreditCard },
  { label: "Live support", icon: MessageCircle }
];

export function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-bg" />
      <div className="hero-pattern" aria-hidden />
      <div className="container hero-inner">
        <Reveal className="hero-copy">
          <span className="eyebrow">Friendly tech services for websites, apps, bots and automation</span>
          <h1 className="headline">TechChimps</h1>
          <p className="subtitle">
            Tell us what you want built. We give you a clear price, a fast plan, and a finished product ready to launch.
          </p>
          <div className="button-row">
            <ButtonLink href="/request" icon={ArrowRight} iconPosition="right" size="lg">
              Build my idea
            </ButtonLink>
            <ButtonLink href="/pricing" size="lg" variant="secondary">
              See prices
            </ButtonLink>
          </div>
          <div className="hero-proof" aria-label="Trust highlights">
            {proof.map((item) => {
              const Icon = item.icon;
              return (
                <span key={item.label}>
                  <Icon aria-hidden size={18} />
                  {item.label}
                </span>
              );
            })}
          </div>
        </Reveal>

        <HeroStudio />
      </div>
      <div className="hero-next-hint" aria-hidden>
        <span>Choose service</span>
        <span>Answer smart questions</span>
        <span>Pay or make an offer</span>
        <span>Chat with the team</span>
      </div>
    </section>
  );
}
