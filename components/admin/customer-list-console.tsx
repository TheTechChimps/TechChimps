"use client";

import {
  ChevronDown,
  Clipboard,
  CreditCard,
  Inbox,
  Loader2,
  Mail,
  MessageSquareReply,
  PoundSterling,
  ReceiptText,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  UserRoundCheck
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageText } from "@/components/ui/message-text";
import { StatusIndicator } from "@/components/ui/status-indicator";
import type { CustomerInboxMessage, PublicCustomerAccount } from "@/lib/accounts";
import type { BuildPromptRecord } from "@/lib/build-prompts";
import type { LiveChatSessionSummary } from "@/lib/live-chat";
import type { OrderRecord } from "@/lib/orders";

type CustomerDossier = {
  chats: LiveChatSessionSummary[];
  customer: PublicCustomerAccount;
  inbox: CustomerInboxMessage[];
  orders: OrderRecord[];
  prompts: BuildPromptRecord[];
};

type MessageDraft = {
  body: string;
  projectReference: string;
  subject: string;
};

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-GB", {
    currency: "GBP",
    style: "currency"
  }).format(amount);
}

function formatDate(value?: string) {
  if (!value) return "Not set";

  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function formatDateTime(value?: string) {
  if (!value) return "Not recorded";

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

function isPaid(order: OrderRecord) {
  return Boolean(order.paidAt || order.stripePaymentStatus === "paid" || order.status === "paid_waiting_support" || order.status === "support_connected");
}

function humanStatus(value: string) {
  return value.replaceAll("_", " ");
}

function draftDefaults(): MessageDraft {
  return {
    body: "",
    projectReference: "",
    subject: "Quick TechChimps update"
  };
}

function customerSearchText(dossier: CustomerDossier) {
  return [
    dossier.customer.name,
    dossier.customer.email,
    ...dossier.orders.flatMap((order) => [order.reference, order.serviceName, order.status]),
    ...dossier.prompts.flatMap((prompt) => [prompt.orderReference, prompt.serviceName, prompt.title])
  ]
    .join(" ")
    .toLowerCase();
}

export function CustomerListConsole() {
  const [customers, setCustomers] = useState<CustomerDossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [copyState, setCopyState] = useState("");
  const [drafts, setDrafts] = useState<Record<string, MessageDraft>>({});
  const [sendingEmail, setSendingEmail] = useState("");
  const [partialAmounts, setPartialAmounts] = useState<Record<string, string>>({});
  const [refundingReference, setRefundingReference] = useState("");
  const [notice, setNotice] = useState("");

  const loadCustomers = useCallback(async () => {
    const response = await fetch("/api/admin/customer-dossiers", { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json()) as { customers: CustomerDossier[] };
      setCustomers(data.customers);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void loadCustomers();
    }, 0);

    return () => window.clearTimeout(initial);
  }, [loadCustomers]);

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return customers;

    return customers.filter((dossier) => customerSearchText(dossier).includes(normalizedQuery));
  }, [customers, query]);

  const updateDraft = (email: string, key: keyof MessageDraft, value: string) => {
    setNotice("");
    setDrafts((current) => ({
      ...current,
      [email]: {
        ...(current[email] ?? draftDefaults()),
        [key]: value
      }
    }));
  };

  const sendPortalMessage = async (event: FormEvent<HTMLFormElement>, dossier: CustomerDossier) => {
    event.preventDefault();
    const draft = drafts[dossier.customer.email] ?? draftDefaults();
    if (!draft.subject.trim() || !draft.body.trim()) return;

    setSendingEmail(dossier.customer.email);
    setNotice("");
    const response = await fetch("/api/admin/inbox", {
      body: JSON.stringify({
        body: draft.body,
        email: dossier.customer.email,
        name: dossier.customer.name,
        projectReference: draft.projectReference,
        subject: draft.subject
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };

    if (response.ok) {
      setNotice(`Message sent to ${dossier.customer.name}.`);
      setDrafts((current) => ({
        ...current,
        [dossier.customer.email]: {
          ...draftDefaults(),
          projectReference: draft.projectReference
        }
      }));
      await loadCustomers();
    } else {
      setNotice(data.error ?? "Message could not be sent.");
    }

    setSendingEmail("");
  };

  const copyPrompt = async (prompt: BuildPromptRecord) => {
    try {
      await navigator.clipboard.writeText(prompt.prompt);
      setCopyState(`${prompt.orderReference} prompt copied.`);
    } catch {
      setCopyState("Copy failed. Open the prompt inbox and select the text manually.");
    }
  };

  const submitRefund = async (order: OrderRecord, mode: "full" | "partial") => {
    const remainingAmount = getRemainingAmount(order);
    const amount = mode === "full" ? remainingAmount : Number(partialAmounts[order.reference]);

    if (!Number.isFinite(amount) || amount <= 0 || amount > remainingAmount) {
      setNotice(`Enter an amount between GBP 0.01 and ${formatMoney(remainingAmount)}.`);
      return;
    }

    const confirmed = window.confirm(
      `Refund ${formatMoney(amount)} to ${order.contactName || "this customer"} for ${order.reference}? This sends a real Stripe refund.`
    );
    if (!confirmed) return;

    setRefundingReference(order.reference);
    setNotice("");
    const response = await fetch("/api/admin/refunds", {
      body: JSON.stringify({
        amount: mode === "partial" ? amount : undefined,
        confirmReference: order.reference,
        mode,
        reference: order.reference,
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
      setNotice(`${formatMoney(data.refund.amount)} refunded. ${formatMoney(data.refund.remainingAmount)} remains refundable.`);
      setPartialAmounts((current) => ({ ...current, [order.reference]: "" }));
      await loadCustomers();
    } else {
      setNotice(data.error ?? "The refund could not be issued.");
    }

    setRefundingReference("");
  };

  const totals = useMemo(() => {
    const orders = customers.flatMap((dossier) => dossier.orders);
    return {
      paid: orders.filter(isPaid).length,
      prompts: customers.reduce((total, dossier) => total + dossier.prompts.length, 0),
      unread: customers.reduce((total, dossier) => total + dossier.inbox.filter((message) => !message.readAt).length, 0)
    };
  }, [customers]);

  return (
    <Card className="customer-dossier-console">
      <div className="chat-console-header">
        <div>
          <span className="eyebrow">
            <UserRoundCheck size={15} /> Customer list
          </span>
          <h2>Customer details, payments, messages, chats, and prompts.</h2>
        </div>
        <StatusIndicator label={`${customers.length} customers`} tone={customers.length ? "active" : "good"} />
      </div>

      <div className="customer-dossier-toolbar">
        <label className="search-field">
          <span className="label">Find customer</span>
          <span>
            <Search aria-hidden size={16} />
            <input
              className="input"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, email, service, reference..."
              value={query}
            />
          </span>
        </label>

        <div className="customer-dossier-stats" aria-label="Customer list summary">
          <span>{totals.unread} unread</span>
          <span>{totals.paid} paid</span>
          <span>{totals.prompts} prompts</span>
        </div>
      </div>

      {notice ? <p className="support-notice">{notice}</p> : null}
      {copyState ? <p className="helper">{copyState}</p> : null}

      {loading ? (
        <div className="portal-loading">
          <Loader2 aria-hidden size={22} />
          <span>Loading customer list...</span>
        </div>
      ) : filteredCustomers.length ? (
        <div className="customer-dossier-list">
          {filteredCustomers.map((dossier) => {
            const paidOrders = dossier.orders.filter(isPaid);
            const unreadCount = dossier.inbox.filter((message) => !message.readAt).length;
            const draft = drafts[dossier.customer.email] ?? draftDefaults();

            return (
              <details className="customer-dossier" key={dossier.customer.email}>
                <summary>
                  <span className="customer-dossier-name">
                    <strong>{dossier.customer.name}</strong>
                    <small>{dossier.customer.email}</small>
                  </span>
                  <span className="customer-dossier-badges">
                    <span>{dossier.orders.length} orders</span>
                    <span>{paidOrders.length} paid</span>
                    <span>{dossier.prompts.length} prompts</span>
                    {unreadCount ? <span>{unreadCount} unread</span> : null}
                  </span>
                  <ChevronDown aria-hidden size={18} />
                </summary>

                <div className="customer-dossier-body">
                  <section className="customer-dossier-panel">
                    <h3>
                      <Inbox aria-hidden size={16} /> Portal inbox
                    </h3>
                    {dossier.inbox.length ? (
                      <div className="customer-mini-list">
                        {dossier.inbox.slice(0, 4).map((message) => (
                          <article className={message.readAt ? "" : "is-unread"} key={message.id}>
                            <strong>{message.subject}</strong>
                            <MessageText body={message.body} />
                            <small>
                              {message.projectReference ? `${message.projectReference} - ` : ""}
                              {formatDateTime(message.createdAt)}
                            </small>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="helper">No portal messages yet.</p>
                    )}

                    <form className="customer-dossier-message" onSubmit={(event) => void sendPortalMessage(event, dossier)}>
                      <label className="field">
                        <span className="label">Subject</span>
                        <input
                          className="input"
                          onChange={(event) => updateDraft(dossier.customer.email, "subject", event.target.value)}
                          value={draft.subject}
                        />
                      </label>
                      <label className="field">
                        <span className="label">Reference</span>
                        <input
                          className="input"
                          onChange={(event) => updateDraft(dossier.customer.email, "projectReference", event.target.value)}
                          placeholder="Optional TC- reference"
                          value={draft.projectReference}
                        />
                      </label>
                      <label className="field">
                        <span className="label">Message</span>
                        <textarea
                          className="textarea chat-textarea"
                          onChange={(event) => updateDraft(dossier.customer.email, "body", event.target.value)}
                          placeholder="Write a short customer update..."
                          value={draft.body}
                        />
                      </label>
                      <Button
                        disabled={sendingEmail === dossier.customer.email || !draft.subject.trim() || !draft.body.trim()}
                        icon={sendingEmail === dossier.customer.email ? Loader2 : Send}
                        type="submit"
                      >
                        {sendingEmail === dossier.customer.email ? "Sending" : "Send update"}
                      </Button>
                    </form>
                  </section>

                  <section className="customer-dossier-panel">
                    <h3>
                      <ReceiptText aria-hidden size={16} /> Orders and payments
                    </h3>
                    {dossier.orders.length ? (
                      <div className="customer-mini-list">
                        {dossier.orders.map((order) => {
                          const remainingAmount = getRemainingAmount(order);
                          const canRefund = Boolean(order.stripeSessionId && isPaid(order) && remainingAmount > 0);

                          return (
                            <details className="customer-order-accordion" key={order.reference}>
                              <summary>
                                <span className="customer-order-title">
                                  <strong>{order.serviceName}</strong>
                                  <small>{order.reference}</small>
                                </span>
                                <span className="customer-order-money">{formatMoney(order.amount)}</span>
                                <StatusIndicator label={humanStatus(order.status)} tone={isPaid(order) ? "good" : "active"} />
                                <ChevronDown aria-hidden size={17} />
                              </summary>

                              <div className="customer-order-body">
                                <dl className="customer-payment-facts">
                                  <div>
                                    <dt>Reference</dt>
                                    <dd>{order.reference}</dd>
                                  </div>
                                  <div>
                                    <dt>Amount</dt>
                                    <dd>{formatMoney(order.amount)}</dd>
                                  </div>
                                  <div>
                                    <dt>Paid</dt>
                                    <dd>{formatDateTime(order.paidAt)}</dd>
                                  </div>
                                  <div>
                                    <dt>ETA</dt>
                                    <dd>{formatDate(order.completionDate)}</dd>
                                  </div>
                                  <div>
                                    <dt>Refundable</dt>
                                    <dd>{formatMoney(remainingAmount)}</dd>
                                  </div>
                                  <div>
                                    <dt>Method</dt>
                                    <dd>{order.paymentMethod || "Stripe Checkout"}</dd>
                                  </div>
                                </dl>
                                {canRefund ? (
                                  <div className="customer-refund-row">
                                    <Button
                                      disabled={refundingReference === order.reference}
                                      icon={refundingReference === order.reference ? Loader2 : RotateCcw}
                                      onClick={() => void submitRefund(order, "full")}
                                      type="button"
                                    >
                                      Full refund
                                    </Button>
                                    <form
                                      onSubmit={(event) => {
                                        event.preventDefault();
                                        void submitRefund(order, "partial");
                                      }}
                                    >
                                      <span className="refund-amount-input">
                                        <PoundSterling aria-hidden size={15} />
                                        <input
                                          aria-label={`Partial refund for ${order.reference}`}
                                          className="input"
                                          inputMode="decimal"
                                          max={remainingAmount}
                                          min="0.01"
                                          onChange={(event) =>
                                            setPartialAmounts((current) => ({
                                              ...current,
                                              [order.reference]: event.target.value
                                            }))
                                          }
                                          placeholder="0.00"
                                          step="0.01"
                                          type="number"
                                          value={partialAmounts[order.reference] ?? ""}
                                        />
                                      </span>
                                      <Button
                                        disabled={refundingReference === order.reference || !partialAmounts[order.reference]}
                                        icon={CreditCard}
                                        type="submit"
                                        variant="secondary"
                                      >
                                        Partial
                                      </Button>
                                    </form>
                                  </div>
                                ) : null}
                              </div>
                            </details>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="helper">No orders linked yet.</p>
                    )}
                  </section>

                  <section className="customer-dossier-panel">
                    <h3>
                      <MessageSquareReply aria-hidden size={16} /> Chats
                    </h3>
                    {dossier.chats.length ? (
                      <div className="customer-mini-list">
                        {dossier.chats.map((chat) => (
                          <article key={chat.sessionId}>
                            <strong>{chat.customerName}</strong>
                            <p>{chat.lastMessage}</p>
                            <small>
                              {chat.unreadVisitorMessages ? `${chat.unreadVisitorMessages} unread - ` : ""}
                              {formatDateTime(chat.lastMessageAt)}
                            </small>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="helper">No live chat history found for this customer yet.</p>
                    )}
                    <a className="portal-inline-action" href="#support">
                      <MessageSquareReply aria-hidden size={14} />
                      Open live support
                    </a>
                  </section>

                  <section className="customer-dossier-panel">
                    <h3>
                      <Sparkles aria-hidden size={16} /> Build prompts
                    </h3>
                    {dossier.prompts.length ? (
                      <div className="customer-mini-list">
                        {dossier.prompts.map((prompt) => (
                          <article key={prompt.id}>
                            <strong>{prompt.serviceName}</strong>
                            <p>{prompt.title}</p>
                            <small>
                              {prompt.orderReference} - {formatDate(prompt.createdAt)}
                            </small>
                            <button className="portal-inline-action" onClick={() => void copyPrompt(prompt)} type="button">
                              <Clipboard aria-hidden size={14} />
                              Copy prompt
                            </button>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="helper">No prompts generated for this customer yet.</p>
                    )}
                  </section>

                  <section className="customer-dossier-panel customer-account-compact">
                    <h3>
                      <Mail aria-hidden size={16} /> Account
                    </h3>
                    <dl className="customer-payment-facts">
                      <div>
                        <dt>Email</dt>
                        <dd>{dossier.customer.email}</dd>
                      </div>
                      <div>
                        <dt>Password</dt>
                        <dd>{dossier.customer.hasPassword ? "Set" : "Not claimed"}</dd>
                      </div>
                      <div>
                        <dt>Last login</dt>
                        <dd>{formatDateTime(dossier.customer.lastLoginAt)}</dd>
                      </div>
                      <div>
                        <dt>Created</dt>
                        <dd>{formatDate(dossier.customer.createdAt)}</dd>
                      </div>
                    </dl>
                  </section>
                </div>
              </details>
            );
          })}
        </div>
      ) : (
        <p className="helper">No customers match that search.</p>
      )}
    </Card>
  );
}
