"use client";

import { MessageCircle, Sparkles, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const helperCopy: Record<string, { title: string; body: string }> = {
  "/pricing": {
    title: "Choosing a price?",
    body: "Choose the closest option, then use the guided request if you are not sure. We can shape the final plan with you."
  },
  "/request": {
    title: "One step at a time.",
    body: "Answer what you can. The form saves the useful details, then live support can help with anything unclear."
  },
  "/services": {
    title: "Looking for the right fit?",
    body: "Services are grouped by what you need built. If yours is unusual, a custom request is the best route."
  },
  "/portal": {
    title: "Your project space.",
    body: "Create or log in with your email to see messages, orders, support, and next steps in one place."
  }
};

function getCopy(pathname: string) {
  const match = Object.entries(helperCopy).find(([path]) => pathname.startsWith(path));

  return (
    match?.[1] ?? {
      title: "Need something different?",
      body: "If you cannot see the exact service, send a custom request. Tiny fixes, unusual ideas, and full builds are all welcome."
    }
  );
}

export function HelperMonkey() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("techchimps-helper-hidden") === "true";
  });
  const copy = useMemo(() => getCopy(pathname), [pathname]);

  useEffect(() => {
    const isSmallScreen = window.matchMedia("(max-width: 720px)").matches;
    const timer = window.setTimeout(() => setOpen(!isSmallScreen), 2200);
    return () => window.clearTimeout(timer);
  }, []);

  if (hidden || pathname.startsWith("/admin") || pathname.startsWith("/checkout")) return null;

  const openSupport = () => {
    const supportButton = document.querySelector<HTMLButtonElement>(".support-widget");
    supportButton?.click();
  };

  const dismiss = () => {
    window.localStorage.setItem("techchimps-helper-hidden", "true");
    setHidden(true);
  };

  return (
    <aside aria-label="TechChimps helper monkey" className={`helper-monkey ${open ? "open" : ""}`}>
      <button aria-label="Open TechChimps helper" className="helper-monkey-avatar" onClick={() => setOpen((value) => !value)} type="button">
        <Image alt="" height={72} priority src="/images/techchimps-logo-circle-small.png" width={72} />
        <span aria-hidden />
      </button>

      {open ? (
        <div className="helper-monkey-card">
          <button aria-label="Hide helper monkey" className="helper-monkey-close" onClick={dismiss} type="button">
            <X aria-hidden size={14} />
          </button>
          <span className="eyebrow">
            <Sparkles size={14} /> Chimp guide
          </span>
          <strong>{copy.title}</strong>
          <p>{copy.body}</p>
          <div className="helper-monkey-actions">
            <Link href="/request">Start request</Link>
            <Link href="/pricing">Prices</Link>
            <button onClick={openSupport} type="button">
              <MessageCircle aria-hidden size={15} /> Chat
            </button>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
