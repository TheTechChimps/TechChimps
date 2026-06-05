import { ArrowUpRight, Clock3 } from "lucide-react";
import { publicServices, serviceCategories } from "@/data/services";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { formatPrice } from "@/lib/utils";

export function Pricing() {
  const startingPrice = Math.min(...publicServices.map((service) => service.price));

  return (
    <section className="section pricing-band" id="pricing">
      <div className="container">
        <div className="section-header center">
          <span className="eyebrow">Lowest prices on the market</span>
          <h1 className="title">Simple prices from {formatPrice(startingPrice)}.</h1>
          <p className="subtitle">Choose a service, choose delivery speed, then pay or make an offer.</p>
        </div>
        <Tabs
          items={serviceCategories.map((category) => ({
            label: category,
            value: category,
            content: (
              <div className="grid grid-3 pricing-grid">
                {publicServices
                  .filter((service) => service.category === category)
                  .map((service) => {
                    const Icon = service.icon;
                    return (
                      <Card className="pricing-card" key={service.slug}>
                        <div className="pricing-card-top">
                          <Icon aria-hidden size={26} />
                          <span>
                            <Clock3 aria-hidden size={15} />
                            {service.timeline}
                          </span>
                        </div>
                        <h3>{service.name}</h3>
                        <p>{service.summary}</p>
                        <strong className="price">
                          {formatPrice(service.price, service.priceSuffix)}
                        </strong>
                        <ul>
                          {service.includes.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                        <ButtonLink href={`/services/${service.slug}`} icon={ArrowUpRight} iconPosition="right" variant="soft">
                          See details
                        </ButtonLink>
                      </Card>
                    );
                  })}
              </div>
            )
          }))}
        />
      </div>
    </section>
  );
}
