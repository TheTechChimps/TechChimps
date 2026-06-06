"use client";

/* eslint-disable @next/next/no-img-element -- Customer signatures are private data URLs captured for receipt viewing, not static optimized assets. */

import { CheckCircle2, Clipboard, FileSignature, Loader2, MessageSquareReply, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import type { FinalSignoffRecord } from "@/lib/final-signoffs";
import type { OrderRecord } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";

type SignoffOrderRow = {
  latestSignoff: FinalSignoffRecord | null;
  order: OrderRecord;
  signoffUrl: string;
};

type SignoffPayload = {
  orders: SignoffOrderRow[];
  signoffs: FinalSignoffRecord[];
  statements: string[];
};

function formatDate(value?: string) {
  if (!value) return "Not set";
  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function signoffLabel(signoff?: FinalSignoffRecord | null) {
  if (!signoff) return "Not sent";
  if (signoff.status === "signed") return "Signed";
  if (signoff.status === "void") return "Void";
  return "Waiting";
}

function signoffTone(signoff?: FinalSignoffRecord | null) {
  if (signoff?.status === "signed") return "good";
  if (signoff?.status === "pending") return "warning";
  return "active";
}

export function SignoffManager() {
  const [data, setData] = useState<SignoffPayload>({ orders: [], signoffs: [], statements: [] });
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [selectedReference, setSelectedReference] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState("");
  const [notice, setNotice] = useState("");

  const loadSignoffs = useCallback(async () => {
    const response = await fetch("/api/admin/signoffs", { cache: "no-store" });
    if (response.ok) {
      const payload = (await response.json()) as SignoffPayload;
      setData(payload);
      setSelectedReference((current) =>
        current && payload.orders.some((row) => row.order.reference === current)
          ? current
          : payload.orders.find((row) => row.latestSignoff?.status !== "signed")?.order.reference ?? payload.orders[0]?.order.reference ?? ""
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void loadSignoffs();
    }, 0);
    return () => window.clearTimeout(initial);
  }, [loadSignoffs]);

  const metrics = useMemo(
    () => ({
      signed: data.signoffs.filter((signoff) => signoff.status === "signed").length,
      waiting: data.signoffs.filter((signoff) => signoff.status === "pending").length,
      ready: data.orders.filter((row) => !row.latestSignoff || row.latestSignoff.status !== "signed").length
    }),
    [data]
  );
  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return data.orders;
    return data.orders.filter(({ order }) =>
      `${order.contactName} ${order.contactEmail} ${order.reference} ${order.serviceName}`.toLowerCase().includes(normalized)
    );
  }, [data.orders, query]);

  const selectedRow = data.orders.find((row) => row.order.reference === selectedReference) ?? null;

  const createSignoff = async (event?: FormEvent<HTMLFormElement>, forceNew = false, referenceOverride?: string) => {
    event?.preventDefault();
    const reference = referenceOverride || selectedReference;
    if (!reference) return;

    setSubmitting(reference);
    setNotice("");
    const response = await fetch("/api/admin/signoffs", {
      body: JSON.stringify({
        customMessage: message,
        forceNew,
        reference
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string; url?: string };

    if (response.ok) {
      setNotice("Final acceptance link sent to live chat and the customer portal inbox.");
      if (payload.url) {
        try {
          await navigator.clipboard.writeText(payload.url);
          setNotice("Final acceptance link sent and copied for outside sharing.");
        } catch {
          setNotice("Final acceptance link sent. Copy it from the order row below.");
        }
      }
      setMessage("");
      await loadSignoffs();
    } else {
      setNotice(payload.error ?? "Could not generate final acceptance.");
    }

    setSubmitting("");
  };

  const copyLink = async (url: string) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Sign-off link copied. You can send it by WhatsApp, email, Discord, or any outside chat.");
    } catch {
      setNotice("Copy failed. Open the link and copy it from the browser bar.");
    }
  };

  return (
    <Card className="signoff-manager">
      <div className="chat-console-header">
        <div>
          <span className="eyebrow">
            <FileSignature size={15} /> Final acceptance
          </span>
          <h2>Send customer sign-off links before closing work.</h2>
        </div>
        <StatusIndicator label={`${metrics.waiting} waiting`} tone={metrics.waiting ? "warning" : "good"} />
      </div>

      <div className="payment-hub-metrics">
        <div>
          <span>Ready to send</span>
          <strong>{metrics.ready}</strong>
        </div>
        <div>
          <span>Waiting</span>
          <strong>{metrics.waiting}</strong>
        </div>
        <div>
          <span>Signed</span>
          <strong>{metrics.signed}</strong>
        </div>
      </div>

      <form className="signoff-generate-panel" onSubmit={(event) => void createSignoff(event)}>
        <label className="field">
          <span className="label">Choose order</span>
          <select className="input" onChange={(event) => setSelectedReference(event.target.value)} value={selectedReference}>
            {data.orders.map((row) => (
              <option key={row.order.reference} value={row.order.reference}>
                {row.order.contactName || "Customer"} - {row.order.serviceName} - {row.order.reference}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="label">Optional friendly note</span>
          <textarea
            className="textarea"
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Example: Thanks for working with us. Please sign this once you are happy with the final delivery."
            value={message}
          />
        </label>
        <div className="signoff-generate-actions">
          <Button disabled={!selectedReference || Boolean(submitting)} icon={submitting ? Loader2 : MessageSquareReply} type="submit">
            {submitting ? "Sending" : "Send to customer"}
          </Button>
          <Button
            disabled={!selectedReference || Boolean(submitting)}
            icon={RefreshCw}
            onClick={() => void createSignoff(undefined, true)}
            type="button"
            variant="secondary"
          >
            New version
          </Button>
        </div>
        {selectedRow?.signoffUrl ? (
          <button className="text-button" onClick={() => void copyLink(selectedRow.signoffUrl)} type="button">
            <Clipboard aria-hidden size={15} />
            Copy current outside link
          </button>
        ) : null}
      </form>

      <div className="customer-dossier-toolbar">
        <label className="search-field">
          <span className="label">Find order</span>
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
          <span>Loading final acceptance records...</span>
        </div>
      ) : rows.length ? (
        <div className="signoff-order-list">
          {rows.map(({ latestSignoff, order, signoffUrl }) => (
            <details className="payment-accordion-item signoff-order" key={order.reference}>
              <summary>
                <span className="payment-summary-main">
                  <strong>{order.contactName || "Customer"}</strong>
                  <small>{order.serviceName}</small>
                </span>
                <span className="payment-summary-meta">
                  <b>{formatPrice(order.amount, order.priceSuffix)}</b>
                  <small>{order.reference}</small>
                </span>
                <StatusIndicator label={signoffLabel(latestSignoff)} tone={signoffTone(latestSignoff)} />
              </summary>
              <div className="payment-accordion-body">
                <dl className="payment-facts">
                  <div>
                    <dt>Customer</dt>
                    <dd>{order.contactEmail}</dd>
                  </div>
                  <div>
                    <dt>Created</dt>
                    <dd>{formatDate(latestSignoff?.createdAt)}</dd>
                  </div>
                  <div>
                    <dt>Sent</dt>
                    <dd>{formatDate(latestSignoff?.linkSentAt)}</dd>
                  </div>
                  <div>
                    <dt>Signed</dt>
                    <dd>{formatDate(latestSignoff?.signedAt || order.finalSignoffSignedAt)}</dd>
                  </div>
                </dl>
                {latestSignoff?.status === "signed" ? (
                  <div className="signed-receipt-panel">
                    <div className="signed-receipt-heading">
                      <span>
                        <ShieldCheck aria-hidden size={18} />
                        Signed completion receipt
                      </span>
                      <StatusIndicator label={formatDate(latestSignoff.signedAt || order.finalSignoffSignedAt)} tone="good" />
                    </div>
                    <dl className="payment-facts">
                      <div>
                        <dt>Signed by</dt>
                        <dd>{latestSignoff.signerName || order.contactName}</dd>
                      </div>
                      <div>
                        <dt>Signer email</dt>
                        <dd>{latestSignoff.signerEmail || order.contactEmail}</dd>
                      </div>
                      <div>
                        <dt>Order value</dt>
                        <dd>{formatPrice(order.amount, order.priceSuffix)}</dd>
                      </div>
                      <div>
                        <dt>Reference</dt>
                        <dd>{order.reference}</dd>
                      </div>
                    </dl>
                    {latestSignoff.signatureDataUrl ? (
                      <div className="signature-receipt">
                        <span>Captured signature</span>
                        <img alt={`Digital signature from ${latestSignoff.signerName || order.contactName}`} src={latestSignoff.signatureDataUrl} />
                      </div>
                    ) : null}
                    {data.statements.length ? (
                      <details className="receipt-statement-drawer">
                        <summary>
                          <CheckCircle2 aria-hidden size={16} />
                          View accepted terms
                        </summary>
                        <div className="acceptance-statement-list">
                          {data.statements.map((statement) => (
                            <span key={statement}>
                              <CheckCircle2 aria-hidden size={14} />
                              {statement}
                            </span>
                          ))}
                        </div>
                      </details>
                    ) : null}
                  </div>
                ) : null}
                {signoffUrl ? (
                  <div className="signoff-link-row">
                    <a className="message-link" href={signoffUrl} rel="noreferrer" target="_blank">
                      Open sign-off link
                    </a>
                    <button className="text-button" onClick={() => void copyLink(signoffUrl)} type="button">
                      <Clipboard aria-hidden size={15} />
                      Copy link
                    </button>
                  </div>
                ) : (
                  <Button
                    disabled={Boolean(submitting)}
                    icon={FileSignature}
                    onClick={() => {
                      setSelectedReference(order.reference);
                      void createSignoff(undefined, false, order.reference);
                    }}
                    type="button"
                    variant="secondary"
                  >
                    Generate sign-off
                  </Button>
                )}
              </div>
            </details>
          ))}
        </div>
      ) : (
        <p className="helper">Paid orders will appear here when they are ready for final acceptance.</p>
      )}
    </Card>
  );
}
