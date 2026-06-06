"use client";

/* eslint-disable @next/next/no-img-element -- Preview assets are token-protected and may be private Blob files, so Next image optimization is not suitable here. */

import { CheckCircle2, Eye, Loader2, MessageSquareText, ShieldCheck, XCircle } from "lucide-react";
import type { CSSProperties, MouseEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";

type PublicPreview = {
  asset: {
    externalUrl?: string;
    kind: "audio" | "document" | "image" | "link" | "video";
    mimeType: string;
    name: string;
    size?: number;
    src: string;
  };
  customerName: string;
  note?: string;
  orderReference: string;
  serviceName: string;
  status: "sent" | "viewed" | "approved" | "changes_requested" | "archived";
  title: string;
  token: string;
  viewCount: number;
};

type PreviewPayload = {
  preview: PublicPreview;
};

function statusLabel(status: PublicPreview["status"]) {
  return {
    approved: "Approved",
    archived: "Archived",
    changes_requested: "Changes requested",
    sent: "Sent",
    viewed: "Viewed"
  }[status];
}

function statusTone(status: PublicPreview["status"]) {
  if (status === "approved") return "good";
  if (status === "changes_requested") return "warning";
  return "active";
}

function PreviewMedia({ preview }: { preview: PublicPreview }) {
  const watermark = `${preview.customerName || "TechChimps customer"} • ${preview.orderReference} • Preview only`;
  const commonProps = {
    draggable: false,
    onContextMenu: (event: MouseEvent) => event.preventDefault()
  };

  return (
    <div
      aria-label="Watermarked preview area"
      className={`preview-media preview-media-${preview.asset.kind}`}
      onContextMenu={(event) => event.preventDefault()}
      style={{ "--preview-watermark": `"${watermark}"` } as CSSProperties}
    >
      <div className="preview-watermark-grid" aria-hidden />
      {preview.asset.kind === "image" ? (
        <img {...commonProps} alt={`${preview.title} preview`} src={preview.asset.src} />
      ) : null}
      {preview.asset.kind === "video" ? (
        <video {...commonProps} controls controlsList="nodownload noremoteplayback" disablePictureInPicture playsInline src={preview.asset.src} />
      ) : null}
      {preview.asset.kind === "audio" ? (
        <div className="preview-audio-card">
          <Eye aria-hidden size={34} />
          <strong>{preview.asset.name}</strong>
          <audio controls controlsList="nodownload" src={preview.asset.src} />
        </div>
      ) : null}
      {preview.asset.kind === "document" ? (
        <iframe src={preview.asset.src} title={`${preview.title} preview`} />
      ) : null}
      {preview.asset.kind === "link" ? (
        <div className="preview-link-card">
          <ShieldCheck aria-hidden size={34} />
          <strong>Hosted preview link</strong>
          <p>This preview opens in its original host, with the TechChimps preview record and watermark notice kept here.</p>
          <a className="button button-secondary" href={preview.asset.src} rel="noreferrer" target="_blank">
            Open hosted preview
          </a>
        </div>
      ) : null}
    </div>
  );
}

export function WatermarkedPreviewClient({ token }: { token: string }) {
  const [data, setData] = useState<PreviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadPreview = useCallback(async () => {
    const response = await fetch(`/api/preview/${encodeURIComponent(token)}`, { cache: "no-store" });
    if (response.ok) {
      setData((await response.json()) as PreviewPayload);
    } else {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "This preview link is not available.");
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void loadPreview();
    }, 0);
    return () => window.clearTimeout(initial);
  }, [loadPreview]);

  const respond = async (action: "approved" | "changes_requested") => {
    setSubmitting(action);
    setError("");
    const response = await fetch(`/api/preview/${encodeURIComponent(token)}`, {
      body: JSON.stringify({
        action,
        message
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string; status?: PublicPreview["status"] };

    if (response.ok) {
      setData((current) =>
        current && payload.status
          ? {
              ...current,
              preview: {
                ...current.preview,
                status: payload.status
              }
            }
          : current
      );
      setMessage("");
    } else {
      setError(payload.error ?? "Preview response could not be saved.");
    }

    setSubmitting("");
  };

  if (loading) {
    return (
      <section className="section preview-page">
        <div className="container preview-shell">
          <Card className="portal-loading">
            <Loader2 aria-hidden size={24} />
            <span>Opening watermarked preview...</span>
          </Card>
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="section preview-page">
        <div className="container preview-shell">
          <Card className="preview-card">
            <XCircle aria-hidden size={32} />
            <h1>Preview unavailable</h1>
            <p className="helper">{error || "This preview may have expired or been replaced."}</p>
          </Card>
        </div>
      </section>
    );
  }

  const preview = data.preview;
  const responded = preview.status === "approved" || preview.status === "changes_requested";

  return (
    <main>
      <section className="section preview-page">
        <div className="container preview-shell">
          <div className="preview-intro">
            <span className="eyebrow">
              <Eye size={15} /> Watermarked customer preview
            </span>
            <h1 className="title">{preview.title}</h1>
            <p className="subtitle">
              Review the preview safely here. The clean final files are delivered after approval, final checks, and any remaining balance.
            </p>
          </div>

          <Card className="preview-card">
            <div className="preview-summary">
              <div>
                <span>Project</span>
                <strong>{preview.serviceName}</strong>
                <small>{preview.orderReference}</small>
              </div>
              <div>
                <span>Preview status</span>
                <strong>{statusLabel(preview.status)}</strong>
                <small>{preview.viewCount} views recorded</small>
              </div>
              <StatusIndicator label={statusLabel(preview.status)} tone={statusTone(preview.status)} />
            </div>

            {preview.note ? <p className="support-notice">{preview.note}</p> : null}

            <PreviewMedia preview={preview} />

            <div className="preview-protection-note">
              <ShieldCheck aria-hidden size={18} />
              <span>
                This is a protected preview with visible watermarking. Screenshots and recordings cannot be fully prevented online, so the clean
                source files are kept back until delivery is approved.
              </span>
            </div>

            {responded ? (
              <div className="preview-response-complete">
                <CheckCircle2 aria-hidden size={32} />
                <h2>{preview.status === "approved" ? "Preview approved." : "Changes requested."}</h2>
                <p>TechChimps has been notified in the project chat.</p>
              </div>
            ) : (
              <form className="preview-response-form">
                <label className="field">
                  <span className="label">Message to the team <small>Optional</small></span>
                  <textarea
                    className="textarea chat-textarea"
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Tell us what feels right, what needs changing, or anything you want clarified."
                    value={message}
                  />
                </label>
                {error ? <p className="form-error">{error}</p> : null}
                <div className="preview-response-actions">
                  <Button
                    disabled={Boolean(submitting)}
                    icon={submitting === "approved" ? Loader2 : CheckCircle2}
                    onClick={() => void respond("approved")}
                    type="button"
                  >
                    {submitting === "approved" ? "Approving" : "Approve preview"}
                  </Button>
                  <Button
                    disabled={Boolean(submitting)}
                    icon={submitting === "changes_requested" ? Loader2 : MessageSquareText}
                    onClick={() => void respond("changes_requested")}
                    type="button"
                    variant="secondary"
                  >
                    {submitting === "changes_requested" ? "Sending" : "Request changes"}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </section>
    </main>
  );
}
