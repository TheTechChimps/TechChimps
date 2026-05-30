import { ArrowRight, MessageCircle } from "lucide-react";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { getContactEmail } from "@/lib/contact";

export function FinalCta() {
  const contactEmail = getContactEmail();

  return (
    <section className="section final-cta">
      <div className="container final-cta-inner">
        <div>
          <span className="eyebrow">Ready when you are</span>
          <h2 className="title">Start small. Build the dream.</h2>
          <p className="subtitle">
            Choose a service, pay securely or make an offer, then jump straight into live chat with us.
          </p>
          <div className="button-row">
            <ButtonLink href="/request" icon={ArrowRight} iconPosition="right" size="lg">
              Start now
            </ButtonLink>
            <ButtonLink href={`mailto:${contactEmail}`} icon={MessageCircle} size="lg" variant="secondary">
              Ask first
            </ButtonLink>
          </div>
        </div>
        <Image
          alt="TechChimps banana monkey logo"
          height={220}
          loading="lazy"
          src="/images/techchimps-logo-square.png"
          width={220}
        />
      </div>
    </section>
  );
}
