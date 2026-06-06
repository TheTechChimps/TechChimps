import { BadgeCheck, Gauge, HeartHandshake, LockKeyhole, MessageCircle, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/ui/motion";

const trustItems = [
  { label: "Clear scope", icon: BadgeCheck },
  { label: "Fast builds", icon: Gauge },
  { label: "Live help", icon: MessageCircle },
  { label: "Refund promise", icon: ShieldCheck },
  { label: "Care plans", icon: HeartHandshake },
  { label: "Secure payments", icon: LockKeyhole }
];

export function TrustBar() {
  return (
    <Reveal as="section" className="trust-bar section-tight">
      <div className="container trust-row" aria-label="Trust indicators">
        {trustItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label}>
              <Icon aria-hidden size={20} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
    </Reveal>
  );
}
