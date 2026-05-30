"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export type TabItem = {
  label: string;
  value: string;
  content: React.ReactNode;
};

export function Tabs({ items, defaultValue }: { items: TabItem[]; defaultValue?: string }) {
  const id = useId();
  const [active, setActive] = useState(defaultValue ?? items[0]?.value);
  const activeItem = items.find((item) => item.value === active) ?? items[0];

  return (
    <div className="tabs">
      <div aria-label="Service category tabs" className="tabs-list" role="tablist">
        {items.map((item) => (
          <button
            aria-controls={`${id}-${item.value}`}
            aria-selected={active === item.value}
            className={cn("tabs-trigger", active === item.value && "is-active")}
            id={`${id}-${item.value}-tab`}
            key={item.value}
            onClick={() => setActive(item.value)}
            role="tab"
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      <div
        aria-labelledby={`${id}-${activeItem.value}-tab`}
        className="tabs-panel"
        id={`${id}-${activeItem.value}`}
        role="tabpanel"
      >
        {activeItem.content}
      </div>
    </div>
  );
}
