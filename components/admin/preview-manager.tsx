"use client";

import { Clipboard, Eye, ImageUp, Loader2, Search, Send, ShieldCheck } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import type { PreviewRecord } from "@/lib/previews";
import type { OrderRecord } from "@/lib/orders";

type PreviewOrderRow = {
  latestPreview: PreviewRecord | null;
  order: OrderRecord;
  previewUrl: string;
};

type PreviewPayload = {
  orders: PreviewOrderRow[];
  previews: Array<PreviewRecord & { url: string }>;
};

function formatDate(value?: string) {
  if (!value) return "Not set";
  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function previewStatusTone(status?: PreviewRecord["status"]) {
  if (status === "approved") return "good";
  if (status === "changes_requested") return "warning";
  return "active";
}

function previewStatusLabel(status?: PreviewRecord["status"]) {
  return status ? status.replaceAll("_", " ") : "Not sent";
}

export function PreviewManager() {
  const [data, setData] = useState<PreviewPayload>({ orders: [], previews: [] });
  const [selectedReference, setSelectedReference] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");

  const loadPreviews = useCallback(async () => {
    const response = await fetch("/api/admin/previews", { cache: "no-store" });
    if (response.ok) {
      const payload = (await response.json()) as PreviewPayload;
      setData(payload);
      setSelectedReference((current) => current || payload.orders[0]?.order.reference || "");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void loadPreviews();
    }, 0);
    return () => window.clearTimeout(initial);
  }, [loadPreviews]);

  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return data.orders;

    return data.orders.filter(({ latestPreview, order }) =>
      `${order.contactName} ${order.contactEmail} ${order.reference} ${order.serviceName} ${latestPreview?.title ?? ""}`
        .toLowerCase()
        .includes(normalized)
    );
  }, [data.orders, query]);

  const selectedRow = data.orders.find((row) => row.order.reference === selectedReference) ?? null;
  const waitingResponses = data.previews.filter((preview) => preview.status === "changes_requested").length;
  const approvedCount = data.previews.filter((preview) => preview.status === "approved").length;
  const activeCount = data.previews.filter((preview) => preview.status === "sent" || preview.status === "viewed").length;

  const sendPreview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedReference || (!file && !externalUrl.trim())) {
      setNotice("Add a preview file or hosted preview URL first.");
      return;
    }

    setSubmitting(true);
    setNotice("");
    const formData = new FormData();
    formData.set("reference", selectedReference);
    formData.set("title", title);
    formData.set("note", note);
    formData.set("externalUrl", externalUrl);
    if (file) formData.set("file", file);

    const response = await fetch("/api/admin/previews", {
      body: formData,
      method: "POST"
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string; url?: string };

    if (response.ok) {
      setNotice("Watermarked preview sent to live chat and the customer portal inbox.");
      if (payload.url) {
        try {
          await navigator.clipboard.writeText(payload.url);
          setNotice("Watermarked preview sent and copied for outside sharing.");
        } catch {
          setNotice("Watermarked preview sent. Copy it from the order row below.");
        }
      }
      setTitle("");
      setNote("");
      setExternalUrl("");
      setFile(null);
      await loadPreviews();
    } else {
      setNotice(payload.error ?? "Preview could not be created.");
    }

    setSubmitting(false);
  };

  const copyLink = async (url: string) => {
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      setNotice("Preview link copied. You can send it by WhatsApp, email, Discord, or any outside chat.");
    } catch {
      setNotice("Copy failed. Open the preview link and copy it from the browser bar.");
    }
  };

  return (
    <Card className="preview-manager">
      <div className="chat-console-header">
        <div>
          <span className="eyebrow">
            <Eye size={15} /> Watermarked previews
          </span>
          <h2>Send Fiverr-style preview links before clean delivery.</h2>
        </div>
        <StatusIndicator label={`${activeCount} active`} tone={waitingResponses ? "warning" : "active"} />
      </div>

      <div className="payment-hub-metrics">
        <div>
          <span>Active previews</span>
          <strong>{activeCount}</strong>
        </div>
        <div>
          <span>Changes requested</span>
          <strong>{waitingResponses}</strong>
        </div>
        <div>
          <span>Approved</span>
          <strong>{approvedCount}</strong>
        </div>
      </div>

      <form className="preview-generate-panel" onSubmit={sendPreview}>
        <label className="field">
          <span className="label">Choose customer order</span>
          <select className="input" onChange={(event) => setSelectedReference(event.target.value)} value={selectedReference}>
            {data.orders.map((row) => (
              <option key={row.order.reference} value={row.order.reference}>
                {row.order.contactName || "Customer"} - {row.order.serviceName} - {row.order.reference}
              </option>
            ))}
          </select>
        </label>

        <div className="form-grid">
          <label className="field">
            <span className="label">Preview title</span>
            <input
              className="input"
              onChange={(event) => setTitle(event.target.value)}
              placeholder={selectedRow ? `${selectedRow.order.serviceName} preview` : "Preview title"}
              value={title}
            />
          </label>
          <label className="field">
            <span className="label">Hosted preview URL <small>Optional</small></span>
            <input
              className="input"
              onChange={(event) => setExternalUrl(event.target.value)}
              placeholder="https://..."
              value={externalUrl}
            />
          </label>
        </div>

        <label className="field">
          <span className="label">Preview note <small>Optional</small></span>
          <textarea
            className="textarea chat-textarea"
            onChange={(event) => setNote(event.target.value)}
            placeholder="Explain what they are looking at, what is still rough, or what feedback you need."
            value={note}
          />
        </label>

        <label className="preview-upload-box">
          <ImageUp aria-hidden size={20} />
          <span>
            Upload preview file
            <small>{file ? file.name : "Images, short videos, audio, PDFs. Up to 8MB."}</small>
          </span>
          <input
            accept="image/*,video/*,audio/*,.pdf"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            type="file"
          />
        </label>

        <p className="helper">
          Uploaded files stay behind the preview token. The page adds a visible watermark and keeps clean source files back until approval.
        </p>

        <div className="signoff-generate-actions">
          <Button disabled={!selectedReference || submitting || (!file && !externalUrl.trim())} icon={submitting ? Loader2 : Send} type="submit">
            {submitting ? "Sending preview" : "Send watermarked preview"}
          </Button>
          {selectedRow?.previewUrl ? (
            <button className="text-button" onClick={() => void copyLink(selectedRow.previewUrl)} type="button">
              <Clipboard aria-hidden size={15} />
              Copy latest preview link
            </button>
          ) : null}
        </div>
      </form>

      <div className="customer-dossier-toolbar">
        <label className="search-field">
          <span className="label">Find preview</span>
          <span>
            <Search aria-hidden size={16} />
            <input
              className="input"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, email, reference..."
              value={query}
            />
          </span>
        </label>
      </div>

      {notice ? <p className="support-notice">{notice}</p> : null}

      {loading ? (
        <div className="portal-loading">
          <Loader2 aria-hidden size={22} />
          <span>Loading preview records...</span>
        </div>
      ) : rows.length ? (
        <div className="preview-order-list">
          {rows.map(({ latestPreview, order, previewUrl }) => (
            <details className="payment-accordion-item preview-order" key={order.reference}>
              <summary>
                <span className="payment-summary-main">
                  <strong>{order.contactName || "Customer"}</strong>
                  <small>{order.serviceName}</small>
                </span>
                <span className="payment-summary-meta">
                  <b>{order.reference}</b>
                  <small>{latestPreview?.title ?? "No preview sent"}</small>
                </span>
                <StatusIndicator label={previewStatusLabel(latestPreview?.status)} tone={previewStatusTone(latestPreview?.status)} />
              </summary>
              <div className="payment-accordion-body">
                <dl className="payment-facts">
                  <div>
                    <dt>Customer</dt>
                    <dd>{order.contactEmail}</dd>
                  </div>
                  <div>
                    <dt>Created</dt>
                    <dd>{formatDate(latestPreview?.createdAt)}</dd>
                  </div>
                  <div>
                    <dt>Viewed</dt>
                    <dd>{formatDate(latestPreview?.lastViewedAt)}</dd>
                  </div>
                  <div>
                    <dt>Views</dt>
                    <dd>{latestPreview?.viewCount ?? 0}</dd>
                  </div>
                </dl>

                {latestPreview?.responseMessage ? (
                  <p className="support-notice">
                    <ShieldCheck aria-hidden size={16} />
                    Customer note: {latestPreview.responseMessage}
                  </p>
                ) : null}

                {previewUrl ? (
                  <div className="signoff-link-row">
                    <a className="message-link" href={previewUrl} rel="noreferrer" target="_blank">
                      Open preview link
                    </a>
                    <button className="text-button" onClick={() => void copyLink(previewUrl)} type="button">
                      <Clipboard aria-hidden size={15} />
                      Copy link
                    </button>
                  </div>
                ) : (
                  <p className="helper">Send a preview from the panel above when this customer is ready to review.</p>
                )}
              </div>
            </details>
          ))}
        </div>
      ) : (
        <p className="helper">Orders will appear here when customers submit requests or checkout.</p>
      )}
    </Card>
  );
}
