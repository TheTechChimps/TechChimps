"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api")) return;

    const body = JSON.stringify({
      path: pathname,
      referrer: document.referrer
    });

    if ("sendBeacon" in navigator && navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }))) {
      return;
    }

    void fetch("/api/analytics", {
      body,
      headers: {
        "Content-Type": "application/json"
      },
      keepalive: true,
      method: "POST"
    });
  }, [pathname]);

  return null;
}
