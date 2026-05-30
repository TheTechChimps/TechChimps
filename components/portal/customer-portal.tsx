"use client";

import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  FileText,
  Inbox,
  KeyRound,
  LifeBuoy,
  Loader2,
  LogOut,
  Mail,
  MessageCircle,
  ReceiptText,
  Rocket,
  Send,
  ShieldCheck,
  UserRound
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { formatPrice } from "@/lib/utils";
import type { CustomerInboxMessage, PublicCustomerAccount } from "@/lib/accounts";
import type { OrderRecord } from "@/lib/orders";

type PortalData = {
  inbox: CustomerInboxMessage[];
  orders: OrderRecord[];
  user: PublicCustomerAccount;
};

type AuthMode = "login" | "register";
type PortalTab = "overview" | "inbox" | "orders" | "support" | "account";

export function CustomerPortal({ contactEmail = "techchimps@proton.me" }: { contactEmail?: string }) {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [activeTab, setActiveTab] = useState<PortalTab>("overview");
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [supportBody, setSupportBody] = useState("");
  const [supportStatus, setSupportStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [form, setForm] = useState({
    email: "",
    name: "",
    password: ""
  });

  const loadPortal = useCallback(async () => {
    const response = await fetch("/api/portal/me", { cache: "no-store" });

    if (response.ok) {
      setData((await response.json()) as PortalData);
    } else {
      setData(null);
      setActiveTab("overview");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void loadPortal();
    }, 0);

    return () => window.clearTimeout(initial);
  }, [loadPortal]);

  const unreadCount = useMemo(() => data?.inbox.filter((message) => !message.readAt).length ?? 0, [data]);

  const update = (key: keyof typeof form, value: string) => {
    setError("");
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const response = await fetch(authMode === "login" ? "/api/auth/login" : "/api/auth/register", {
      body: JSON.stringify(form),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    if (response.ok) {
      await loadPortal();
      setForm((current) => ({ ...current, password: "" }));
      setActiveTab("overview");
    } else {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Account action failed. Please try again.");
    }

    setSubmitting(false);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setData(null);
    setAuthMode("login");
  };

  const sendSupportMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!data || !supportBody.trim()) return;

    setSupportStatus("sending");
    const response = await fetch("/api/live-chat", {
      body: JSON.stringify({
        author: data.user.name || data.user.email,
        body: supportBody,
        role: "visitor",
        sessionId: `customer-${data.user.id}`
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    if (response.ok) {
      setSupportBody("");
      setSupportStatus("sent");
    } else {
      setSupportStatus("error");
    }
  };

  const markRead = async (messageId?: string) => {
    const response = await fetch("/api/portal/messages/read", {
      body: JSON.stringify({ messageId }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    if (response.ok) {
      await loadPortal();
    }
  };

  const portalTabs: { icon: React.ElementType; label: string; value: PortalTab }[] = [
    { icon: Rocket, label: "Overview", value: "overview" },
    { icon: Inbox, label: `Inbox${unreadCount ? ` (${unreadCount})` : ""}`, value: "inbox" },
    { icon: FileText, label: `Orders (${data?.orders.length ?? 0})`, value: "orders" },
    { icon: LifeBuoy, label: "Support", value: "support" },
    { icon: UserRound, label: "Account", value: "account" }
  ];

  const renderInbox = () => (
    <Card className="portal-inbox-card">
      <div className="portal-card-top">
        <span className="eyebrow">
          <Mail size={15} /> Personal inbox
        </span>
        <button className="text-button" disabled={!data?.inbox.length} onClick={() => markRead()} type="button">
          Mark all read
        </button>
      </div>

      <div className="portal-inbox-list" aria-live="polite">
        {data?.inbox.length ? (
          data.inbox.map((message) => (
            <article className={message.readAt ? "inbox-message" : "inbox-message unread"} key={message.id}>
              <div>
                <strong>{message.subject}</strong>
                <span>{message.author}</span>
              </div>
              <p>{message.body}</p>
              <footer>
                <time dateTime={message.createdAt}>
                  {new Date(message.createdAt).toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short"
                  })}
                </time>
                {message.projectReference ? <span>{message.projectReference}</span> : null}
                {!message.readAt ? (
                  <button className="text-button" onClick={() => markRead(message.id)} type="button">
                    Mark read
                  </button>
                ) : null}
              </footer>
            </article>
          ))
        ) : (
          <div className="portal-empty-actions">
            <p className="helper">No messages yet. Studio updates will appear here automatically.</p>
            <button className="text-button" onClick={() => setActiveTab("support")} type="button">
              Ask support a question
            </button>
          </div>
        )}
      </div>
    </Card>
  );

  const renderOrders = () => (
    <Card className="portal-orders-card">
      <div className="portal-card-top">
        <span className="eyebrow">
          <MessageCircle size={15} /> Linked requests
        </span>
        <Link className="text-button" href="/request">
          Start another
        </Link>
      </div>
      <div className="portal-order-list">
        {data?.orders.length ? (
          data.orders.map((order) => (
            <article className="portal-order" key={order.reference}>
              <div>
                <strong>{order.serviceName}</strong>
                <StatusIndicator
                  label={order.status.replaceAll("_", " ")}
                  tone={order.status.includes("paid") ? "good" : order.status.includes("waiting") ? "warning" : "active"}
                />
              </div>
              <p>{order.goals}</p>
              <footer>
                <span>{order.reference}</span>
                <span>{formatPrice(order.amount, order.priceSuffix)}</span>
                {order.completionDate ? <span>Target {new Date(order.completionDate).toLocaleDateString("en-GB")}</span> : null}
                {order.stripeSessionId ? (
                  <a
                    className="portal-receipt-link"
                    href={`/api/portal/receipts?reference=${encodeURIComponent(order.reference)}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <ReceiptText aria-hidden size={14} />
                    Receipt
                  </a>
                ) : null}
              </footer>
            </article>
          ))
        ) : (
          <div className="portal-empty-actions">
            <p className="helper">Orders and offers made with this email will appear here.</p>
            <Link className="text-button" href="/request">
              Start your first request
            </Link>
          </div>
        )}
      </div>
    </Card>
  );

  if (loading) {
    return (
      <section className="section portal-hero">
        <div className="container">
          <Card className="portal-loading">
            <Loader2 aria-hidden size={24} />
            <span>Opening your portal...</span>
          </Card>
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="section portal-hero">
        <div className="container split portal-auth-layout">
          <div>
            <span className="eyebrow">Customer login</span>
            <h1 className="title">Your personal TechChimps space.</h1>
            <p className="subtitle">
              Accounts are created automatically when you order, pay, or make an offer. Use the same email to claim your
              portal, read studio messages, and track requests.
            </p>
            <div className="portal-trust-list">
              <span>
                <ShieldCheck aria-hidden size={18} /> Secure session cookie
              </span>
              <span>
                <Inbox aria-hidden size={18} /> Personal inbox
              </span>
              <span>
                <CheckCircle2 aria-hidden size={18} /> Orders linked by email
              </span>
            </div>
          </div>

          <Card className="login-panel">
            <KeyRound aria-hidden size={28} />
            <div>
              <h2>{authMode === "login" ? "Log in" : "Create or claim account"}</h2>
              <p>
                {authMode === "login"
                  ? "Use the password you created for this email."
                  : "If you already ordered with this email, this claims the account automatically."}
              </p>
            </div>

            <form className="portal-auth-form" onSubmit={submitAuth}>
              {authMode === "register" ? (
                <label className="field">
                  <span className="label">Name</span>
                  <input
                    autoComplete="name"
                    className="input"
                    name="name"
                    onChange={(event) => update("name", event.target.value)}
                    placeholder="Your name"
                    value={form.name}
                  />
                </label>
              ) : null}

              <label className="field">
                <span className="label">Email</span>
                <input
                  autoComplete="email"
                  className="input"
                  name="email"
                  onChange={(event) => update("email", event.target.value)}
                  placeholder="client@example.co.uk"
                  required
                  type="email"
                  value={form.email}
                />
              </label>

              <label className="field">
                <span className="label">Password</span>
                <input
                  autoComplete={authMode === "login" ? "current-password" : "new-password"}
                  className="input"
                  minLength={8}
                  name="password"
                  onChange={(event) => update("password", event.target.value)}
                  placeholder="At least 8 characters"
                  required
                  type="password"
                  value={form.password}
                />
              </label>

              {error ? <p className="form-error">{error}</p> : null}

              <Button disabled={submitting} icon={submitting ? Loader2 : authMode === "login" ? KeyRound : Send} type="submit">
                {submitting ? "Checking account" : authMode === "login" ? "Log in" : "Create account"}
              </Button>
            </form>

            <button className="text-button" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")} type="button">
              {authMode === "login" ? "Create or claim an account" : "Already have a password? Log in"}
            </button>
            <p className="helper">Your account stays signed in for 180 days on this device unless you log out.</p>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="section portal-hero">
        <div className="container portal-dashboard-head">
          <div>
            <span className="eyebrow">Customer portal</span>
            <h1 className="title">Welcome back, {data.user.name}.</h1>
            <p className="subtitle">Everything for your project lives here: messages, orders, support, and next steps.</p>
          </div>
          <div className="portal-actions">
            <StatusIndicator label={unreadCount ? `${unreadCount} unread` : "Inbox clear"} tone={unreadCount ? "warning" : "good"} />
            <Link className="button button-secondary button-sm" href="/request">
              New request
            </Link>
            <Button icon={LogOut} onClick={logout} type="button" variant="secondary">
              Log out
            </Button>
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container grid grid-3">
          <Card className="stat-card">
            <StatusIndicator label="Account" tone="good" />
            <strong>{data.user.hasPassword ? "Secure" : "Claimable"}</strong>
          </Card>
          <Card className="stat-card">
            <StatusIndicator label="Orders" tone="active" />
            <strong>{data.orders.length}</strong>
          </Card>
          <Card className="stat-card">
            <StatusIndicator label="Inbox" tone={unreadCount ? "warning" : "good"} />
            <strong>{unreadCount}</strong>
          </Card>
        </div>
      </section>

      <section className="section-tight">
        <div className="container portal-nav-row">
          <Link href="/request">
            <CreditCard aria-hidden size={18} />
            Start or pay for a request
            <ArrowRight aria-hidden size={16} />
          </Link>
          <button onClick={() => setActiveTab("support")} type="button">
            <LifeBuoy aria-hidden size={18} />
            Ask support
          </button>
          <a href={`mailto:${contactEmail}`}>
            <Mail aria-hidden size={18} />
            Email {contactEmail}
          </a>
        </div>
      </section>

      <section className="section-tight">
        <div className="container portal-tab-shell">
          <div aria-label="Customer portal sections" className="tabs-list portal-tabs-list" role="tablist">
            {portalTabs.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  aria-selected={activeTab === item.value}
                  className={activeTab === item.value ? "tabs-trigger is-active" : "tabs-trigger"}
                  key={item.value}
                  onClick={() => setActiveTab(item.value)}
                  role="tab"
                  type="button"
                >
                  <Icon aria-hidden size={16} />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="portal-tab-panel" role="tabpanel">
            {activeTab === "overview" ? (
              <div className="grid grid-2 portal-overview-grid">
                <Card className="portal-summary-card">
                  <span className="eyebrow">
                    <Rocket size={15} /> Next best step
                  </span>
                  <h2>{data.orders.length ? "Check your latest project message." : "Start your first request."}</h2>
                  <p>
                    {data.orders.length
                      ? "Use the inbox and support tab to keep decisions, updates, and questions in one place."
                      : "Tell us what you want built and your account will automatically keep the quote, chat, and updates."}
                  </p>
                  <div className="portal-actions">
                    <Link className="button button-primary button-sm" href="/request">
                      New request
                    </Link>
                    <button className="button button-secondary button-sm" onClick={() => setActiveTab("inbox")} type="button">
                      Open inbox
                    </button>
                  </div>
                </Card>
                {renderOrders()}
              </div>
            ) : null}

            {activeTab === "inbox" ? renderInbox() : null}
            {activeTab === "orders" ? renderOrders() : null}

            {activeTab === "support" ? (
              <Card className="support-thread-card">
                <div className="portal-card-top">
                  <span className="eyebrow">
                    <LifeBuoy size={15} /> Account support
                  </span>
                  <StatusIndicator label="Replies appear in live support" tone="active" />
                </div>
                <p className="helper">
                  Send a quick message from your account. It lands in the TechChimps live support inbox with your customer name attached.
                </p>
                <form className="customer-message-form" onSubmit={sendSupportMessage}>
                  <label className="field">
                    <span className="label">Message</span>
                    <textarea
                      aria-label="Customer support message"
                      className="textarea chat-textarea"
                      onChange={(event) => {
                        setSupportStatus("idle");
                        setSupportBody(event.target.value);
                      }}
                      placeholder="Ask for an update, send extra details, or request a change..."
                      required
                      value={supportBody}
                    />
                  </label>
                  {supportStatus === "sent" ? <p className="support-notice">Sent. We can reply from live support.</p> : null}
                  {supportStatus === "error" ? <p className="form-error">Message could not be sent. Try again or email us.</p> : null}
                  <Button disabled={supportStatus === "sending" || !supportBody.trim()} icon={supportStatus === "sending" ? Loader2 : Send} type="submit">
                    {supportStatus === "sending" ? "Sending" : "Send support message"}
                  </Button>
                </form>
              </Card>
            ) : null}

            {activeTab === "account" ? (
              <Card className="portal-summary-card">
                <span className="eyebrow">
                  <UserRound size={15} /> Account details
                </span>
                <h2>{data.user.email}</h2>
                <p>Your orders and messages are matched by this email. Stay signed in is enabled for 180 days on this device.</p>
                <div className="portal-trust-list">
                  <span>
                    <ShieldCheck aria-hidden size={18} /> {data.user.hasPassword ? "Password protected" : "Claimable account"}
                  </span>
                  <span>
                    <Inbox aria-hidden size={18} /> {data.inbox.length} messages
                  </span>
                  <span>
                    <CheckCircle2 aria-hidden size={18} /> {data.orders.length} linked requests
                  </span>
                </div>
                <div className="portal-actions">
                  <Button icon={LogOut} onClick={logout} type="button" variant="secondary">
                    Log out
                  </Button>
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
