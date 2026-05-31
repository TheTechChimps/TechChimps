"use client";

import { CalendarCheck, CreditCard, Loader2, PoundSterling, ReceiptText, RotateCcw } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import type { OrderRecord } from "@/lib/orders";

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-GB", {
    currency: "GBP",
    style: "currency"
  }).format(amount);
}

function formatDate(value?: string) {
  if (!value) return "To confirm";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function formatDateTime(value?: string) {
  if (!value) return "Recorded after checkout";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function getRemainingAmount(order: OrderRecord) {
  return Math.max(0, order.amount - (order.refundedAmount ?? 0));
}

export function PaymentHub() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [selectedReference, setSelectedReference] = useState("");
  const [partialAmount, setPartialAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<"full" | "partial" | "">("");
  const [notice, setNotice] = useState("");

  const loadOrders = useCallback(async () => {
    const response = await fetch("/api/admin/payments", { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json()) as { orders: OrderRecord[] };
      const paidOrders = data.orders.filter((order) => Boolean(order.paidAt || order.stripePaymentStatus === "paid"));
      setOrders(paidOrders);
      setSelectedReference((current) =>
        paidOrders.some((order) => order.reference === current) ? current : paidOrders[0]?.reference ?? ""
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void loadOrders();
    }, 0);

    return () => {
      window.clearTimeout(initial);
    };
  }, [loadOrders]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.reference === selectedReference),
    [orders, selectedReference]
  );
  const remainingAmount = selectedOrder ? getRemainingAmount(selectedOrder) : 0;
  const totalPaid = orders.reduce((total, order) => total + order.amount, 0);
  const totalRefunded = orders.reduce((total, order) => total + (order.refundedAmount ?? 0), 0);

  const submitRefund = async (mode: "full" | "partial") => {
    if (!selectedOrder) return;

    const amount = mode === "full" ? remainingAmount : Number(partialAmount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > remainingAmount) {
      setNotice(`Enter an amount between £0.01 and ${formatMoney(remainingAmount)}.`);
      return;
    }

    const confirmed = window.confirm(
      `Refund ${formatMoney(amount)} to ${selectedOrder.contactName || "this customer"} for ${selectedOrder.reference}? This sends a real Stripe refund to the original payment method.`
    );
    if (!confirmed) return;

    setSubmitting(mode);
    setNotice("");
    const response = await fetch("/api/admin/refunds", {
      body: JSON.stringify({
        amount: mode === "partial" ? amount : undefined,
        confirmReference: selectedOrder.reference,
        mode,
        reference: selectedOrder.reference,
        requestId: crypto.randomUUID()
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      refund?: { amount: number; remainingAmount: number };
    };

    if (response.ok && data.refund) {
      setNotice(
        `${formatMoney(data.refund.amount)} refund issued. ${formatMoney(data.refund.remainingAmount)} remains refundable. The customer has been notified.`
      );
      setPartialAmount("");
      await loadOrders();
    } else {
      setNotice(data.error ?? "The refund could not be issued. Please try again.");
    }
    setSubmitting("");
  };

  const submitPartialRefund = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitRefund("partial");
  };

  return (
    <Card className="payment-hub">
      <div className="payment-hub-header">
        <div>
          <span className="eyebrow">
            <ReceiptText aria-hidden size={15} /> Payment hub
          </span>
          <h2>Payments, dates, and refunds in one place.</h2>
        </div>
        <StatusIndicator label={`${orders.length} paid orders`} tone={orders.length ? "active" : "good"} />
      </div>

      <div className="payment-hub-metrics">
        <div>
          <span>Recorded payments</span>
          <strong>{orders.length}</strong>
        </div>
        <div>
          <span>Total paid</span>
          <strong>{formatMoney(totalPaid)}</strong>
        </div>
        <div>
          <span>Refunded</span>
          <strong>{formatMoney(totalRefunded)}</strong>
        </div>
      </div>

      {loading ? (
        <p className="helper">Loading Stripe payment records...</p>
      ) : selectedOrder ? (
        <div className="payment-hub-grid">
          <div className="payment-ledger" aria-label="Paid customer orders">
            {orders.map((order) => (
              <button
                aria-pressed={order.reference === selectedReference}
                className={order.reference === selectedReference ? "active" : ""}
                key={order.reference}
                onClick={() => {
                  setSelectedReference(order.reference);
                  setPartialAmount("");
                  setNotice("");
                }}
                type="button"
              >
                <span>
                  <strong>{order.contactName || "Customer"}</strong>
                  <small>{order.serviceName}</small>
                  <small>{order.reference}</small>
                </span>
                <b>{formatMoney(order.amount)}</b>
              </button>
            ))}
          </div>

          <div className="payment-detail">
            <div className="payment-detail-top">
              <div>
                <span className="eyebrow">Selected payment</span>
                <h3>{selectedOrder.contactName || "Customer"}</h3>
                <p>{selectedOrder.serviceName}</p>
              </div>
              <StatusIndicator
                label={selectedOrder.refundStatus === "full" ? "Refunded" : selectedOrder.refundStatus === "partial" ? "Part refunded" : "Paid"}
                tone={selectedOrder.refundStatus ? "warning" : "good"}
              />
            </div>

            <dl className="payment-facts">
              <div>
                <dt><PoundSterling aria-hidden size={15} /> Paid</dt>
                <dd>{formatMoney(selectedOrder.amount)}</dd>
              </div>
              <div>
                <dt><CreditCard aria-hidden size={15} /> Method</dt>
                <dd>{selectedOrder.paymentMethod || "Stripe Checkout"}</dd>
              </div>
              <div>
                <dt><CalendarCheck aria-hidden size={15} /> Paid on</dt>
                <dd>{formatDateTime(selectedOrder.paidAt)}</dd>
              </div>
              <div>
                <dt><CalendarCheck aria-hidden size={15} /> Estimated completion</dt>
                <dd>{formatDate(selectedOrder.completionDate)}</dd>
              </div>
            </dl>

            <div className="refund-balance">
              <span>Refundable balance</span>
              <strong>{formatMoney(remainingAmount)}</strong>
              {selectedOrder.refundedAmount ? <small>{formatMoney(selectedOrder.refundedAmount)} already returned</small> : null}
            </div>

            {remainingAmount > 0 ? (
              <div className="refund-actions">
                <Button
                  disabled={Boolean(submitting)}
                  icon={submitting === "full" ? Loader2 : RotateCcw}
                  onClick={() => void submitRefund("full")}
                  type="button"
                >
                  {submitting === "full" ? "Refunding" : "Full refund"}
                </Button>
                <form onSubmit={submitPartialRefund}>
                  <label className="field">
                    <span className="label">Partial amount</span>
                    <span className="refund-amount-input">
                      <PoundSterling aria-hidden size={16} />
                      <input
                        aria-label="Partial refund amount in pounds"
                        className="input"
                        inputMode="decimal"
                        max={remainingAmount}
                        min="0.01"
                        onChange={(event) => setPartialAmount(event.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        type="number"
                        value={partialAmount}
                      />
                    </span>
                  </label>
                  <Button
                    disabled={Boolean(submitting) || !partialAmount}
                    icon={submitting === "partial" ? Loader2 : PoundSterling}
                    type="submit"
                    variant="secondary"
                  >
                    {submitting === "partial" ? "Refunding" : "Partial refund"}
                  </Button>
                </form>
              </div>
            ) : (
              <p className="helper">This payment has already been refunded in full.</p>
            )}
          </div>
        </div>
      ) : (
        <p className="helper">Paid customer orders will appear here automatically after Stripe confirms checkout.</p>
      )}

      {notice ? <p aria-live="polite" className="support-notice">{notice}</p> : null}
    </Card>
  );
}
