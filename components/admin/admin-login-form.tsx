"use client";

import { KeyRound, Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function AdminLoginForm({ adminEmail = "techchimps@proton.me", configured }: { adminEmail?: string; configured: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const response = await fetch("/api/admin/auth/login", {
      body: JSON.stringify({ email, password }),
      headers: { "Content-Type": "application/json" },
      method: "POST"
    });

    if (response.ok) {
      window.location.href = "/admin";
      return;
    }

    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    setError(payload.error ?? "Admin login failed.");
    setSubmitting(false);
  };

  return (
    <Card className="login-panel admin-login-panel">
      <KeyRound aria-hidden size={30} />
      <div>
        <h2>Admin login</h2>
        <p>{configured ? "Use your studio admin email and private password." : "Set ADMIN_PASSWORD before opening the dashboard."}</p>
      </div>
      <form className="portal-auth-form" onSubmit={submit}>
        <label className="field">
          <span className="label">Admin email</span>
          <input
            autoComplete="email"
            className="input"
            disabled={!configured}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={adminEmail}
            type="email"
            value={email}
          />
        </label>
        <label className="field">
          <span className="label">Password</span>
          <input
            autoComplete="current-password"
            className="input"
            disabled={!configured}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Private admin password"
            type="password"
            value={password}
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <Button disabled={!configured || submitting || !password} icon={submitting ? Loader2 : KeyRound} type="submit">
          {submitting ? "Opening dashboard" : "Open admin"}
        </Button>
      </form>
    </Card>
  );
}
