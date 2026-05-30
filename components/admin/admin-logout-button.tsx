"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminLogoutButton() {
  const logout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  return (
    <Button icon={LogOut} onClick={logout} type="button" variant="secondary">
      Log out
    </Button>
  );
}
