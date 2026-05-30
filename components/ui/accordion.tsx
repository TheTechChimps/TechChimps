"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function Accordion({
  items
}: {
  items: {
    question: string;
    answer: string;
  }[];
}) {
  const [open, setOpen] = useState(0);

  return (
    <div className="accordion">
      {items.map((item, index) => {
        const isOpen = open === index;

        return (
          <div className="accordion-item" key={item.question}>
            <button
              aria-expanded={isOpen}
              className="accordion-trigger"
              onClick={() => setOpen(isOpen ? -1 : index)}
              type="button"
            >
              <span>{item.question}</span>
              <ChevronDown aria-hidden className={isOpen ? "rotate" : ""} size={20} />
            </button>
            <div className="accordion-panel" hidden={!isOpen}>
              <p>{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
