import { CheckCircle2, ClipboardList, Rocket, Sparkles } from "lucide-react";
import { Reveal } from "@/components/ui/motion";

const steps = [
  {
    title: "Tell us the idea",
    text: "Write it normally. No tech words needed.",
    icon: ClipboardList
  },
  {
    title: "Get a clear plan",
    text: "See the best service, price, and timeline.",
    icon: Sparkles
  },
  {
    title: "Build with updates",
    text: "Follow previews, notes, and live chat.",
    icon: CheckCircle2
  },
  {
    title: "Launch and care",
    text: "Launch fast, then add care if you need it.",
    icon: Rocket
  }
];

export function Process() {
  return (
    <section className="section process-band" id="process">
      <div className="container">
        <Reveal className="section-header center">
          <span className="eyebrow">How it works</span>
          <h2 className="title">Four easy steps.</h2>
          <p className="subtitle">Clear prices, quick updates, and help at every point.</p>
        </Reveal>
        <div className="process-steps">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Reveal className="process-step" delay={index * 0.06} key={step.title}>
                <span>{index + 1}</span>
                <Icon aria-hidden size={25} />
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
