"use client";

import { CalendarClock, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";

type MaintenanceStatus = {
  history: unknown[];
  latest?: {
    backup: {
      counts: Record<string, number>;
      generatedAt: string;
      storageMode: string;
    };
    finishedAt: string;
    selfHealing: {
      checked: number;
      healed: string[];
    };
    source: "admin" | "cron";
  } | null;
};

export function DailyMaintenancePanel() {
  const [data, setData] = useState<MaintenanceStatus | null>(null);
  const [status, setStatus] = useState<"loading" | "idle" | "running" | "done" | "error">("loading");

  const load = async () => {
    setStatus("loading");
    const response = await fetch("/api/admin/maintenance", { cache: "no-store" });
    if (response.ok) {
      setData((await response.json()) as MaintenanceStatus);
      setStatus("idle");
    } else {
      setStatus("error");
    }
  };

  useEffect(() => {
    let active = true;

    async function loadInitial() {
      const response = await fetch("/api/admin/maintenance", { cache: "no-store" });
      if (!active) return;

      if (response.ok) {
        setData((await response.json()) as MaintenanceStatus);
        setStatus("idle");
      } else {
        setStatus("error");
      }
    }

    void loadInitial();

    return () => {
      active = false;
    };
  }, []);

  const runNow = async () => {
    setStatus("running");
    const response = await fetch("/api/admin/maintenance", { method: "POST" });
    if (response.ok) {
      await load();
      setStatus("done");
    } else {
      setStatus("error");
    }
  };

  const latest = data?.latest;
  const healed = latest?.selfHealing.healed.length ?? 0;

  return (
    <Card className="qa-cleanup-panel">
      <div className="chat-console-header">
        <div>
          <span className="eyebrow">
            <CalendarClock size={15} /> Daily self-healing
          </span>
          <h2>Maintenance cron</h2>
        </div>
        <StatusIndicator label={latest ? "Ready" : "Waiting"} tone={latest ? "good" : "active"} />
      </div>
      <p className="helper">
        Runs once daily on Vercel Hobby. It repairs missed payment handoffs and keeps only the latest and previous backup snapshots.
      </p>
      <div className="cleanup-count-grid">
        <span>
          <strong>{latest?.selfHealing.checked ?? 0}</strong>
          orders checked
        </span>
        <span>
          <strong>{healed}</strong>
          handoffs healed
        </span>
        <span>
          <strong>{latest?.backup.counts.orders ?? 0}</strong>
          backed up orders
        </span>
        <span>
          <strong>{data?.history.length ?? 0}</strong>
          recent runs
        </span>
      </div>
      {latest ? (
        <p className="helper">
          Last run:{" "}
          {new Date(latest.finishedAt).toLocaleString("en-GB", {
            dateStyle: "medium",
            timeStyle: "short"
          })}{" "}
          by {latest.source}.
        </p>
      ) : null}
      <div className="portal-actions">
        <Button disabled={status === "loading" || status === "running"} icon={status === "loading" ? Loader2 : RefreshCw} onClick={load} type="button" variant="secondary">
          {status === "loading" ? "Checking" : "Refresh"}
        </Button>
        <Button disabled={status === "running"} icon={status === "running" ? Loader2 : CalendarClock} onClick={runNow} type="button">
          {status === "running" ? "Running" : "Run now"}
        </Button>
      </div>
      {status === "done" ? <p className="support-notice">Maintenance completed.</p> : null}
      {status === "error" ? <p className="form-error">Maintenance status could not be loaded.</p> : null}
    </Card>
  );
}
