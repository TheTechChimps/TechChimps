"use client";

import { KeyRound, Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function AdminPasswordChangeForm({ email }: { email: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Both password fields need to match.");
      return;
    }

    setSubmitting(true);
    const response = await fetch("/api/admin/auth/change-password", {
      body: JSON.stringify({ password }),
      headers: { "Content-Type": "application/json" },
      method: "POST"
    });

    if (response.ok) {
      window.location.href = "/admin";
      return;
    }

    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    setError(payload.error ?? "Password could not be changed.");
    setSubmitting(false);
  };

  return (
    <Card className="login-panel admin-login-panel">
      <KeyRound aria-hidden size={30} />
      <div>
        <h2>Choose your real admin password</h2>
        <p>
          You are signed in as {email}. Set a stronger password now, then the temporary password will stop opening the
          dashboard.
        </p>
      </div>
      <form className="portal-auth-form" onSubmit={submit}>
        <label className="field">
          <span className="label">New password</span>
          <input
            autoComplete="new-password"
            className="input"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            type="password"
            value={password}
          />
        </label>
        <label className="field">
          <span className="label">Confirm password</span>
          <input
            autoComplete="new-password"
            className="input"
            minLength={8}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repeat your new password"
            type="password"
            value={confirmPassword}
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <Button disabled={submitting || !password || !confirmPassword} icon={submitting ? Loader2 : KeyRound} type="submit">
          {submitting ? "Saving password" : "Save and open admin"}
        </Button>
      </form>
    </Card>
  );
}
