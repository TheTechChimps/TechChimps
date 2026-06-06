"use client";

import { CheckCircle2, Eraser, FileSignature, Loader2, ShieldCheck } from "lucide-react";
import { FormEvent, PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { formatPrice } from "@/lib/utils";

type PublicFinalSignoff = {
  token: string;
  status: "pending" | "signed" | "void";
  customMessage?: string;
  signedAt?: string;
  signerName?: string;
  order: {
    amount: number;
    completionDate: string;
    customerName: string;
    priceSuffix?: string;
    reference: string;
    serviceName: string;
  };
};

type SignoffPayload = {
  signoff: PublicFinalSignoff;
  statements: string[];
};

function formatDate(value?: string) {
  if (!value) return "To confirm";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export function FinalSignoffClient({ token }: { token: string }) {
  const [data, setData] = useState<SignoffPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [signedAt, setSignedAt] = useState("");
  const [signatureStarted, setSignatureStarted] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({
    signerEmail: "",
    signerName: ""
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const prepareCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));

    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(ratio, ratio);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 3;
    context.strokeStyle = "#f8fff7";
  }, []);

  const loadSignoff = useCallback(async () => {
    const response = await fetch(`/api/signoff/${encodeURIComponent(token)}`, { cache: "no-store" });
    if (response.ok) {
      const payload = (await response.json()) as SignoffPayload;
      setData(payload);
      setForm({
        signerEmail: "",
        signerName: payload.signoff.order.customerName || ""
      });
      setSignedAt(payload.signoff.signedAt ?? "");
    } else {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "This final acceptance link is not available.");
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void loadSignoff();
    }, 0);

    return () => window.clearTimeout(initial);
  }, [loadSignoff]);

  useEffect(() => {
    prepareCanvas();
    window.addEventListener("resize", prepareCanvas);
    return () => window.removeEventListener("resize", prepareCanvas);
  }, [prepareCanvas]);

  useEffect(() => {
    if (!data || signedAt) return;
    const frame = window.requestAnimationFrame(prepareCanvas);
    return () => window.cancelAnimationFrame(frame);
  }, [data, prepareCanvas, signedAt]);

  const pointFromEvent = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  const startDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    drawingRef.current = true;
    lastPointRef.current = pointFromEvent(event);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const draw = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const lastPoint = lastPointRef.current;
    const nextPoint = pointFromEvent(event);
    if (!context || !lastPoint) return;

    context.beginPath();
    context.moveTo(lastPoint.x, lastPoint.y);
    context.lineTo(nextPoint.x, nextPoint.y);
    context.stroke();
    lastPointRef.current = nextPoint;
    setSignatureStarted(true);
  };

  const stopDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false;
    lastPointRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureStarted(false);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!signatureStarted) {
      setError("Please draw your signature before submitting.");
      return;
    }

    setSubmitting(true);
    const response = await fetch(`/api/signoff/${encodeURIComponent(token)}`, {
      body: JSON.stringify({
        agreed,
        signatureDataUrl: canvasRef.current?.toDataURL("image/png"),
        signerEmail: form.signerEmail,
        signerName: form.signerName
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string; signedAt?: string; status?: string };

    if (response.ok) {
      setSignedAt(payload.signedAt ?? new Date().toISOString());
      setData((current) => current ? { ...current, signoff: { ...current.signoff, status: "signed", signedAt: payload.signedAt } } : current);
    } else {
      setError(payload.error ?? "Could not sign final acceptance.");
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <section className="section signoff-page">
        <div className="container signoff-shell">
          <Card className="portal-loading">
            <Loader2 aria-hidden size={24} />
            <span>Opening final acceptance...</span>
          </Card>
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="section signoff-page">
        <div className="container signoff-shell">
          <Card className="signoff-card">
            <ShieldCheck aria-hidden size={30} />
            <h1>Final acceptance unavailable</h1>
            <p className="helper">{error || "This link may have expired or been replaced."}</p>
          </Card>
        </div>
      </section>
    );
  }

  const signoff = data.signoff;
  const isSigned = signoff.status === "signed" || Boolean(signedAt);

  return (
    <main>
      <section className="section signoff-page">
        <div className="container signoff-shell">
          <div className="signoff-intro">
            <span className="eyebrow">
              <FileSignature size={15} /> Final delivery acceptance
            </span>
            <h1 className="title">Review and sign when you are happy.</h1>
            <p className="subtitle">
              This confirms the finished work has been received and accepted. If anything feels wrong, message TechChimps before signing.
            </p>
          </div>

          <Card className="signoff-card">
            <div className="signoff-summary">
              <div>
                <span>Order</span>
                <strong>{signoff.order.serviceName}</strong>
                <small>{signoff.order.reference}</small>
              </div>
              <div>
                <span>Customer</span>
                <strong>{signoff.order.customerName}</strong>
                <small>Sign with the order email</small>
              </div>
              <div>
                <span>Value</span>
                <strong>{formatPrice(signoff.order.amount, signoff.order.priceSuffix)}</strong>
                <small>Target {formatDate(signoff.order.completionDate)}</small>
              </div>
            </div>

            {signoff.customMessage ? <p className="support-notice">{signoff.customMessage}</p> : null}

            <div className="signoff-terms">
              {data.statements.map((statement) => (
                <span key={statement}>
                  <CheckCircle2 aria-hidden size={16} />
                  {statement}
                </span>
              ))}
            </div>

            {isSigned ? (
              <div className="signoff-complete">
                <CheckCircle2 aria-hidden size={34} />
                <h2>Signed and saved.</h2>
                <p>
                  Thank you. TechChimps has been notified in the project chat and this order is marked as accepted.
                </p>
                <StatusIndicator label={`Signed ${formatDate(signedAt || signoff.signedAt)}`} tone="good" />
              </div>
            ) : (
              <form className="signoff-form" onSubmit={submit}>
                <div className="form-grid">
                  <label className="field">
                    <span className="label">Your name</span>
                    <input
                      className="input"
                      onChange={(event) => setForm((current) => ({ ...current, signerName: event.target.value }))}
                      required
                      value={form.signerName}
                    />
                  </label>
                  <label className="field">
                    <span className="label">Order email</span>
                    <input
                      autoComplete="email"
                      className="input"
                      onChange={(event) => setForm((current) => ({ ...current, signerEmail: event.target.value }))}
                      placeholder="Use the email from your order"
                      required
                      type="email"
                      value={form.signerEmail}
                    />
                  </label>
                </div>

                <label className="field">
                  <span className="label">Digital signature</span>
                  <span className="signature-pad">
                    <canvas
                      aria-label="Draw your signature"
                      onPointerCancel={stopDrawing}
                      onPointerDown={startDrawing}
                      onPointerLeave={(event) => {
                        if (drawingRef.current) stopDrawing(event);
                      }}
                      onPointerMove={draw}
                      onPointerUp={stopDrawing}
                      ref={canvasRef}
                    />
                  </span>
                </label>

                <div className="signoff-form-actions">
                  <button className="text-button" onClick={clearSignature} type="button">
                    <Eraser aria-hidden size={15} />
                    Clear signature
                  </button>
                  <label className="checkbox-row">
                    <input checked={agreed} onChange={(event) => setAgreed(event.target.checked)} required type="checkbox" />
                    <span>I have read and agree to the final acceptance statements above.</span>
                  </label>
                </div>

                {error ? <p className="form-error">{error}</p> : null}

                <Button disabled={submitting || !agreed || !signatureStarted} icon={submitting ? Loader2 : FileSignature} type="submit">
                  {submitting ? "Saving signature" : "Sign final acceptance"}
                </Button>
              </form>
            )}
          </Card>
        </div>
      </section>
    </main>
  );
}
