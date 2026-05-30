"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, X } from "lucide-react";
import { useEffect, useState } from "react";

const tourSteps = [
  {
    title: "Choose what you need",
    text: "Website, app, bot, tool, or care."
  },
  {
    title: "Choose speed",
    text: "Add a completion date or priority delivery if it is urgent."
  },
  {
    title: "Pay or make an offer",
    text: "Checkout is secure, and custom offers go to review."
  },
  {
    title: "Chat opens next",
    text: "After payment, live support can guide the build."
  }
];

export function GuidedTour() {
  const prefersReducedMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = window.localStorage.getItem("techchimps-guided-tour-dismissed");
    if (dismissed === "true") return;
    if (window.matchMedia("(max-width: 560px)").matches) return;

    const timer = window.setTimeout(() => setVisible(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  const close = () => {
    window.localStorage.setItem("techchimps-guided-tour-dismissed", "true");
    setVisible(false);
  };

  const next = () => {
    if (step === tourSteps.length - 1) {
      close();
      return;
    }
    setStep((current) => current + 1);
  };

  const current = tourSteps[step];

  return (
    <AnimatePresence>
      {visible ? (
        <motion.aside
          aria-label="Guided help"
          className="guided-tour"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
        >
          <div className="guided-tour-top">
            <span>
              <CheckCircle2 aria-hidden size={16} />
              Step {step + 1} of {tourSteps.length}
            </span>
            <button aria-label="Close guided help" className="icon-button guided-tour-close" onClick={close} type="button">
              <X aria-hidden size={16} />
            </button>
          </div>
          <h2>{current.title}</h2>
          <p>{current.text}</p>
          <div className="tour-progress" aria-hidden>
            {tourSteps.map((item, index) => (
              <span className={index <= step ? "active" : undefined} key={item.title} />
            ))}
          </div>
          <div className="guided-tour-actions">
            <a href="/request" onClick={close}>
              Open request
            </a>
            <button onClick={next} type="button">
              {step === tourSteps.length - 1 ? "Done" : "Next"}
              <ArrowRight aria-hidden size={15} />
            </button>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
