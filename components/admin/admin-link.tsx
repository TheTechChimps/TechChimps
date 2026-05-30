"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function AdminLink({ className, label = "Admin dashboard", onNavigate }: { className?: string; label?: string; onNavigate?: () => void }) {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    fetch("/api/admin/auth/status", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { authenticated?: boolean }) => {
        if (mounted) setAuthenticated(Boolean(data.authenticated));
      })
      .catch(() => {
        if (mounted) setAuthenticated(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!authenticated) return null;

  return (
    <Link className={className} href="/admin" onClick={onNavigate}>
      {label}
    </Link>
  );
}
