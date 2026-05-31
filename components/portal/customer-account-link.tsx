"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function CustomerAccountLink({
  className,
  loggedInLabel = "Account",
  loggedOutLabel = "Login / sign up",
  onNavigate
}: {
  className?: string;
  loggedInLabel?: string;
  loggedOutLabel?: string;
  onNavigate?: () => void;
}) {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const refresh = () => {
      fetch("/api/portal/me", { cache: "no-store" })
        .then((response) => {
          if (mounted) setAuthenticated(response.ok);
        })
        .catch(() => {
          if (mounted) setAuthenticated(false);
        });
    };

    refresh();
    window.addEventListener("techchimps-auth-changed", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      mounted = false;
      window.removeEventListener("techchimps-auth-changed", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return (
    <Link className={className} href="/portal" onClick={onNavigate}>
      {authenticated ? loggedInLabel : loggedOutLabel}
    </Link>
  );
}
