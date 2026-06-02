"use client";

import { BadgePercent, ChevronDown, Loader2, Plus, Power } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { normalizeDiscountCode, type DiscountCode } from "@/lib/discount-codes";

type DiscountCodeResponse = {
  code?: DiscountCode;
  codes?: DiscountCode[];
  error?: string;
};

const initialForm = {
  code: "",
  description: "",
  label: "",
  percentOff: "10"
};

export function DiscountCodeManager() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const loadCodes = useCallback(async () => {
    const response = await fetch("/api/admin/discount-codes", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as DiscountCodeResponse;

    if (response.ok) {
      setCodes(data.codes ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCodes();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadCodes]);

  const updateForm = (key: keyof typeof form, value: string) => {
    setNotice("");
    setForm((current) => ({ ...current, [key]: value }));
  };

  const createCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setNotice("");

    const response = await fetch("/api/admin/discount-codes", {
      body: JSON.stringify({
        active: true,
        code: normalizeDiscountCode(form.code),
        description: form.description,
        label: form.label,
        percentOff: Number(form.percentOff)
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });
    const data = (await response.json().catch(() => ({}))) as DiscountCodeResponse;

    if (response.ok) {
      setForm(initialForm);
      setNotice(`${data.code?.code ?? "Discount code"} saved.`);
      await loadCodes();
    } else {
      setNotice(data.error ?? "Discount code could not be saved.");
    }

    setSaving(false);
  };

  const toggleCode = async (discountCode: DiscountCode) => {
    setNotice("");
    const response = await fetch("/api/admin/discount-codes", {
      body: JSON.stringify({
        active: !discountCode.active,
        code: discountCode.code
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "PATCH"
    });
    const data = (await response.json().catch(() => ({}))) as DiscountCodeResponse;

    if (response.ok) {
      setNotice(`${discountCode.code} ${discountCode.active ? "deactivated" : "activated"}.`);
      await loadCodes();
    } else {
      setNotice(data.error ?? "Discount code could not be updated.");
    }
  };

  return (
    <Card className="discount-code-manager">
      <div className="chat-console-header">
        <div>
          <span className="eyebrow">
            <BadgePercent size={15} /> Discount codes
          </span>
          <h2>Create and manage checkout discounts.</h2>
        </div>
        <StatusIndicator label={`${codes.filter((code) => code.active).length} active`} tone="active" />
      </div>

      <p className="helper">Codes apply to one-time services only. Monthly care plans are excluded automatically.</p>
      {notice ? <p className="support-notice">{notice}</p> : null}

      <form className="discount-code-form" onSubmit={createCode}>
        <label className="field">
          <span className="label">Code</span>
          <input
            className="input"
            onChange={(event) => updateForm("code", normalizeDiscountCode(event.target.value))}
            placeholder="Example: VIP25"
            required
            value={form.code}
          />
        </label>
        <label className="field">
          <span className="label">Percent off</span>
          <input
            className="input"
            max="99"
            min="1"
            onChange={(event) => updateForm("percentOff", event.target.value)}
            required
            type="number"
            value={form.percentOff}
          />
        </label>
        <label className="field">
          <span className="label">Label</span>
          <input
            className="input"
            onChange={(event) => updateForm("label", event.target.value)}
            placeholder="Friendly name"
            value={form.label}
          />
        </label>
        <label className="field">
          <span className="label">Description</span>
          <input
            className="input"
            onChange={(event) => updateForm("description", event.target.value)}
            placeholder="Who this code is for"
            value={form.description}
          />
        </label>
        <Button disabled={saving} icon={saving ? Loader2 : Plus} type="submit">
          {saving ? "Saving" : "Create code"}
        </Button>
      </form>

      <div className="discount-code-list" aria-label="Current discount codes">
        {loading ? (
          <p className="helper">Loading discount codes...</p>
        ) : codes.length ? (
          codes.map((discountCode) => (
            <details className="discount-code-row" key={discountCode.code}>
              <summary>
                <span>
                  <strong>{discountCode.code}</strong>
                  <small>{discountCode.label}</small>
                </span>
                <span>
                  <b>{discountCode.percentOff}%</b>
                  <StatusIndicator label={discountCode.active ? "Active" : "Off"} tone={discountCode.active ? "good" : "warning"} />
                </span>
                <ChevronDown aria-hidden size={18} />
              </summary>
              <div className="discount-code-row-body">
                <p>{discountCode.description}</p>
                <div>
                  <span>Scope: one-time services only</span>
                  <span>Updated: {new Date(discountCode.updatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>
                </div>
                <button className="text-button" onClick={() => void toggleCode(discountCode)} type="button">
                  <Power aria-hidden size={15} />
                  {discountCode.active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </details>
          ))
        ) : (
          <p className="helper">No discount codes yet.</p>
        )}
      </div>
    </Card>
  );
}
