import { publicServices, serviceCategories, type ServiceCategory } from "@/data/services";
import { Card } from "@/components/ui/card";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";

const categorySummaries: Record<ServiceCategory, string> = {
  "Quick Launch": "Fast, simple offers people can buy today.",
  Websites: "Launch a clear online home.",
  "Web Apps": "Build a useful browser tool.",
  "Windows Apps": "Speed up PC tasks.",
  Discord: "Automate your community.",
  Care: "Keep everything healthy.",
  "Custom Request": "Shape something different with us."
};

export function ServicesOverview() {
  return (
    <section className="section" id="services">
      <div className="container">
        <Reveal className="section-header">
          <span className="eyebrow">Choose a tech service</span>
          <h2 className="title">Choose one thing. We make it simple.</h2>
          <p className="subtitle">Every option is individual, clear, and beginner friendly.</p>
        </Reveal>
        <Stagger className="grid grid-3">
          {serviceCategories.map((category) => {
            const categoryServices = publicServices.filter((service) => service.category === category);
            const Icon = categoryServices[0]?.icon;

            return (
              <StaggerItem key={category}>
                <Card className="service-overview-card">
                  {Icon ? <Icon aria-hidden size={28} /> : null}
                  <h3>{category}</h3>
                  <p>{categorySummaries[category]}</p>
                  <ul>
                    {categoryServices.slice(0, 3).map((service) => (
                      <li key={service.slug}>{service.name}</li>
                    ))}
                  </ul>
                </Card>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
