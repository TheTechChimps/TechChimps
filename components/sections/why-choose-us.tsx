import { HeartHandshake, Lightbulb, MessagesSquare, ShieldCheck, SlidersHorizontal, Wrench } from "lucide-react";
import { Card } from "@/components/ui/card";

const reasons = [
  {
    title: "No jargon",
    text: "Clear words and simple choices.",
    icon: MessagesSquare
  },
  {
    title: "Very low prices",
    text: "Start from £49 with no pressure.",
    icon: ShieldCheck
  },
  {
    title: "Custom welcome",
    text: "Odd ideas still get a fair quote.",
    icon: Wrench
  },
  {
    title: "Modern builds",
    text: "Fast, accessible, SEO-ready foundations.",
    icon: Lightbulb
  },
  {
    title: "Aftercare",
    text: "Simple support plans when you need them.",
    icon: HeartHandshake
  },
  {
    title: "Guided process",
    text: "Popups, forms, and chat keep you moving.",
    icon: SlidersHorizontal
  }
];

export function WhyChooseUs() {
  return (
    <section className="section" id="why">
      <div className="container">
        <div className="section-header">
          <span className="eyebrow">Why TechChimps</span>
          <h2 className="title">Friendly, fast, and affordable.</h2>
          <p className="subtitle">A polished studio experience without scary pricing or confusing steps.</p>
        </div>
        <div className="grid grid-3">
          {reasons.map((reason) => {
            const Icon = reason.icon;
            return (
              <Card className="reason-card" key={reason.title}>
                <Icon aria-hidden size={25} />
                <h3>{reason.title}</h3>
                <p>{reason.text}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
