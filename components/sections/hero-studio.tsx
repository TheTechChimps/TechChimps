"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Gauge, MessageCircle, Rocket, Sparkles } from "lucide-react";
import Image from "next/image";

const timeline = [
  { label: "Idea shared", value: "Plain English", icon: MessageCircle },
  { label: "Price shown", value: "No guessing", icon: Sparkles },
  { label: "Build starts", value: "Preview live", icon: Gauge },
  { label: "Launch ready", value: "Chat open", icon: Rocket }
];

const metricCards = [
  { label: "Starter build", value: "1 day" },
  { label: "From", value: "£49" },
  { label: "Support", value: "Live chat" }
];

export function HeroStudio() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      aria-label="Animated studio preview"
      className="hero-studio"
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96, y: 24 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 18, delay: 0.12 }}
    >
      <div className="studio-topline">
        <span>
          <CheckCircle2 aria-hidden size={16} />
          Guided build path
        </span>
        <span>Lowest prices</span>
      </div>

      <div className="studio-stage">
        <motion.div
          className="studio-mascot"
          animate={prefersReducedMotion ? undefined : { y: [0, -8, 0], rotate: [0, -1.2, 0.8, 0] }}
          transition={{ duration: 5.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image
            alt="TechChimps glossy square monkey and banana logo"
            height={560}
            priority
            src="/images/techchimps-logo-square.png"
            width={560}
          />
        </motion.div>

        <div aria-hidden className="studio-path">
          {timeline.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                className="studio-node"
                key={item.label}
                initial={prefersReducedMotion ? false : { opacity: 0, x: 16 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.28 + index * 0.12 }}
              >
                <Icon aria-hidden size={18} />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.value}</small>
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="studio-metrics">
        {metricCards.map((metric, index) => (
          <motion.div
            key={metric.label}
            whileHover={prefersReducedMotion ? undefined : { y: -4 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <small>{metric.label}</small>
            <strong>{metric.value}</strong>
            <span aria-hidden style={{ width: `${58 + index * 14}%` }} />
          </motion.div>
        ))}
      </div>

      <motion.div
        aria-hidden
        className="studio-sparkline"
        animate={prefersReducedMotion ? undefined : { backgroundPositionX: ["0%", "100%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  );
}
