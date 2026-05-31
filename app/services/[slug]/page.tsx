import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, Clock3, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { publicServices } from "@/data/services";
import { createMetadata } from "@/lib/seo";
import { formatPrice } from "@/lib/utils";

export function generateStaticParams() {
  return publicServices.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = publicServices.find((item) => item.slug === slug);

  if (!service) {
    return createMetadata({ title: "Service not found" });
  }

  return createMetadata({
    title: service.name,
    description: `${service.name} from ${formatPrice(service.price, service.priceSuffix)}. ${service.summary}`,
    path: `/services/${service.slug}`,
    keywords: [service.name, service.category]
  });
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = publicServices.find((item) => item.slug === slug);

  if (!service) notFound();

  const Icon = service.icon;

  return (
    <main>
      <section className="section service-detail-hero">
        <div className="container split">
          <div>
            <span className="eyebrow">{service.category}</span>
            <h1 className="title">{service.name}</h1>
            <p className="subtitle">{service.summary}</p>
            <div className="service-detail-meta">
              <StatusIndicator label={`From ${formatPrice(service.price, service.priceSuffix)}`} tone="good" />
              <StatusIndicator label={service.timeline} tone="active" />
            </div>
            <div className="button-row">
              <ButtonLink href="/request" icon={ArrowRight} iconPosition="right" size="lg">
                Request this service
              </ButtonLink>
              <ButtonLink href="/pricing" size="lg" variant="secondary">
                Compare pricing
              </ButtonLink>
            </div>
          </div>
          <Card className="service-explainer">
            <Icon aria-hidden size={34} />
            <h2>Plain-English explanation</h2>
            <p>{service.beginnerExplanation}</p>
            <span>
              <Clock3 aria-hidden size={17} /> Realistic timeline: {service.timeline}
            </span>
          </Card>
        </div>
      </section>

      <section className="section">
        <div className="container grid grid-3">
          <Card>
            <Sparkles aria-hidden size={24} />
            <h2>What is included</h2>
            <ul className="check-list">
              {service.includes.map((item) => (
                <li key={item}>
                  <CheckCircle2 aria-hidden size={17} />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <Sparkles aria-hidden size={24} />
            <h2>How this helps</h2>
            <ul className="check-list">
              {service.outcomes.map((item) => (
                <li key={item}>
                  <CheckCircle2 aria-hidden size={17} />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <Sparkles aria-hidden size={24} />
            <h2>Next step</h2>
            <p>
              Start with this service if it matches your goal. If the request is unusual, use the custom request builder
              and the estimate can flex around your exact needs.
            </p>
          </Card>
        </div>
      </section>
    </main>
  );
}
