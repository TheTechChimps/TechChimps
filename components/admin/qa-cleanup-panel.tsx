"use client";

import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";

type CleanupPayload = {
  candidates: {
    customers: string[];
    liveChatSessionIds: string[];
    references: string[];
  };
  counts: Record<string, number>;
};

export function QaCleanupPanel() {
  const [data, setData] = useState<CleanupPayload | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "cleaning" | "done" | "error">("loading");
  const total = data ? Object.values(data.counts).reduce((sum, count) => sum + count, 0) : 0;

  const load = async () => {
    setStatus("loading");
    const response = await fetch("/api/admin/cleanup/qa", { cache: "no-store" });
    if (response.ok) {
      setData((await response.json()) as CleanupPayload);
      setStatus("idle");
    } else {
      setStatus("error");
    }
  };

  useEffect(() => {
    let active = true;

    async function loadInitial() {
      const response = await fetch("/api/admin/cleanup/qa", { cache: "no-store" });
      if (!active) return;

      if (response.ok) {
        setData((await response.json()) as CleanupPayload);
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

  const clean = async () => {
    setStatus("cleaning");
    const response = await fetch("/api/admin/cleanup/qa", {
      body: JSON.stringify({ confirm: "DELETE_QA_DATA" }),
      headers: { "Content-Type": "application/json" },
      method: "POST"
    });

    if (response.ok) {
      await load();
      setStatus("done");
    } else {
      setStatus("error");
    }
  };

  return (
    <Card className="qa-cleanup-panel">
      <div className="chat-console-header">
        <div>
          <span className="eyebrow">
            <Sparkles size={15} /> Launch hygiene
          </span>
          <h2>QA data cleanup</h2>
        </div>
        <StatusIndicator label={total ? `${total} found` : "Clean"} tone={total ? "warning" : "good"} />
      </div>
      <p className="helper">
        Removes only records clearly marked as QA, smoke-test, or internal launch-test data. Real customer records are left alone.
      </p>
      <div className="cleanup-count-grid">
        {data
          ? Object.entries(data.counts).map(([label, count]) => (
              <span key={label}>
                <strong>{count}</strong>
                {label.replace(/([A-Z])/g, " $1").toLowerCase()}
              </span>
            ))
          : null}
      </div>
      <div className="portal-actions">
        <Button disabled={status === "loading" || status === "cleaning"} icon={status === "loading" ? Loader2 : Sparkles} onClick={load} type="button" variant="secondary">
          {status === "loading" ? "Checking" : "Refresh"}
        </Button>
        <Button disabled={!total || status === "cleaning"} icon={status === "cleaning" ? Loader2 : Trash2} onClick={clean} type="button">
          {status === "cleaning" ? "Cleaning" : "Clean QA data"}
        </Button>
      </div>
      {status === "done" ? <p className="support-notice">QA cleanup complete.</p> : null}
      {status === "error" ? <p className="form-error">Cleanup status could not be loaded.</p> : null}
    </Card>
  );
}
