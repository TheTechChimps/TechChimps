"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const splashKey = "techchimps-splash-played";

export function SplashScreen() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forceSplash = params.get("splash") === "1" || params.get("qa")?.includes("splash");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const alreadyPlayed = window.sessionStorage.getItem(splashKey) === "true";

    if (reducedMotion || (alreadyPlayed && !forceSplash)) {
      return;
    }

    if (!forceSplash) {
      window.sessionStorage.setItem(splashKey, "true");
    }
    const show = window.setTimeout(() => setVisible(true), 0);
    const timer = window.setTimeout(() => setVisible(false), 2600);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(timer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div aria-label="TechChimps loading animation" className="splash-screen" role="status">
      <div className="splash-cinema">
        <span className="splash-orbit splash-orbit-one" />
        <span className="splash-orbit splash-orbit-two" />
        <div className="splash-logo">
          <Image alt="TechChimps glossy monkey and banana logo" height={116} priority src="/images/techchimps-logo-square.png" width={116} />
        </div>
        <div className="splash-copy">
          <span>TechChimps</span>
          <strong>Powered by bananas</strong>
        </div>
      </div>
    </div>
  );
}
