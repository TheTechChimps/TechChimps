import { Card } from "@/components/ui/card";

export type LegalSection = {
  body: string[];
  title: string;
};

export function LegalPage({
  eyebrow,
  intro,
  sections,
  title
}: {
  eyebrow: string;
  intro: string;
  sections: LegalSection[];
  title: string;
}) {
  return (
    <main>
      <section className="section legal-hero">
        <div className="container legal-shell">
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="title">{title}</h1>
          <p className="subtitle">{intro}</p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container legal-shell">
          <Card className="legal-card">
            {sections.map((section) => (
              <section key={section.title}>
                <h2>{section.title}</h2>
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}
          </Card>
        </div>
      </section>
    </main>
  );
}
