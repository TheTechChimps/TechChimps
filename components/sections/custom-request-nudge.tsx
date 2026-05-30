"use client";

import { MessageCircle, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function CustomRequestNudge() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = window.localStorage.getItem("techchimps-custom-request-nudge");
    if (dismissed) return;

    const timer = window.setTimeout(() => setVisible(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  const close = () => {
    window.localStorage.setItem("techchimps-custom-request-nudge", "dismissed");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside aria-label="Custom request help" className="custom-request-nudge">
      <button aria-label="Dismiss custom request message" className="nudge-close" onClick={close} type="button">
        <X aria-hidden size={15} />
      </button>
      <div className="nudge-icon">
        <MessageCircle aria-hidden size={18} />
      </div>
      <div>
        <strong>Need something different?</strong>
        <p>If you cannot see the exact service, send a custom request. From tiny fixes to full builds, we will help shape it.</p>
        <Link href="/request" onClick={close}>
          Start custom request
        </Link>
      </div>
    </aside>
  );
}
