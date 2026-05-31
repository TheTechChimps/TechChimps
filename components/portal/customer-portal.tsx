"use client";

import {
  CheckCircle2,
  FileText,
  Inbox,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  MessageCircle,
  ReceiptText,
  Send,
  ShieldCheck,
  UserRound
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState, type ElementType } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageText } from "@/components/ui/message-text";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { formatPrice } from "@/lib/utils";
import type { CustomerInboxMessage, PublicCustomerAccount } from "@/lib/accounts";
import type { LiveChatMessage } from "@/lib/live-chat";
import type { OrderRecord } from "@/lib/orders";

type PortalChatThread = {
  kind: "order" | "support";
  label: string;
  lastMessage: string;
  lastMessageAt: string;
  messages: LiveChatMessage[];
  orderReference: string;
  sessionId: string;
  status: string;
};

type PortalData = {
  chatThreads: PortalChatThread[];
  inbox: CustomerInboxMessage[];
  orders: OrderRecord[];
  user: PublicCustomerAccount;
};

type AuthMode = "login" | "register";
type PortalTab = "chats" | "orders" | "inbox" | "account";

export function CustomerPortal({ contactEmail = "techchimps@proton.me" }: { contactEmail?: string }) {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [activeTab, setActiveTab] = useState<PortalTab>("chats");
  const [data, setData] = useState<PortalData | null>(null);
  const [activeChatSessionId, setActiveChatSessionId] = useState("");
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
    try {
      const response = await fetch("/api/portal/me", { cache: "no-store" });

      if (response.ok) {
        const nextData = (await response.json()) as PortalData;
        setData(nextData);
        setActiveChatSessionId((current) =>
          nextData.chatThreads.some((thread) => thread.sessionId === current)
            ? current
            : nextData.chatThreads[0]?.sessionId ?? ""
        );
      } else {
        setData(null);
        setActiveChatSessionId("");
        setActiveTab("chats");
      }
    } catch {
      setData(null);
      setActiveChatSessionId("");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void loadPortal();
    }, 0);

    return () => window.clearTimeout(initial);
  }, [loadPortal]);

  useEffect(() => {
    if (!data) return;

    const interval = window.setInterval(() => {
      void loadPortal();
    }, 3500);

    return () => window.clearInterval(interval);
  }, [data, loadPortal]);

  const unreadCount = useMemo(() => data?.inbox.filter((message) => !message.readAt).length ?? 0, [data]);
  const activeChatThread = useMemo(
    () => data?.chatThreads.find((thread) => thread.sessionId === activeChatSessionId) ?? data?.chatThreads[0],
    [activeChatSessionId, data]
  );

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
      setActiveTab("chats");
      window.dispatchEvent(new Event("techchimps-auth-changed"));
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
    setActiveChatSessionId("");
    window.dispatchEvent(new Event("techchimps-auth-changed"));
  };

  const sendChatMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!data || !supportBody.trim()) return;

    const sessionId = activeChatThread?.sessionId ?? `customer-${data.user.id}`;
    setSupportStatus("sending");

    const response = await fetch("/api/live-chat", {
      body: JSON.stringify({
        author: data.user.name || data.user.email,
        body: supportBody,
        role: "visitor",
        sessionId
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    if (response.ok) {
      setSupportBody("");
      setSupportStatus("sent");
      setActiveChatSessionId(sessionId);
      await loadPortal();
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

  const openOrderChat = (sessionId: string) => {
    setActiveChatSessionId(sessionId);
    setSupportStatus("idle");
    setActiveTab("chats");
  };

  const portalTabs: { icon: ElementType; label: string; value: PortalTab }[] = [
    { icon: MessageCircle, label: "Chats", value: "chats" },
    { icon: FileText, label: `Orders (${data?.orders.length ?? 0})`, value: "orders" },
    { icon: Inbox, label: `Inbox${unreadCount ? ` (${unreadCount})` : ""}`, value: "inbox" },
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
              <MessageText body={message.body} />
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
            <button className="text-button" onClick={() => setActiveTab("chats")} type="button">
              Open chat
            </button>
          </div>
        )}
      </div>
    </Card>
  );

  const renderChats = () => (
    <Card className="portal-chat-card">
      <div className="portal-card-top">
        <div>
          <span className="eyebrow">
            <MessageCircle size={15} /> Chats
          </span>
          <h2>Talk to the team</h2>
        </div>
        <StatusIndicator label={`${data?.chatThreads.length ?? 0} active`} tone="active" />
      </div>

      <div className="portal-chat-layout">
        <div className="portal-chat-list" aria-label="Your chat threads">
          {data?.chatThreads.map((thread) => (
            <button
              aria-pressed={activeChatThread?.sessionId === thread.sessionId}
              className={activeChatThread?.sessionId === thread.sessionId ? "active" : ""}
              key={thread.sessionId}
              onClick={() => openOrderChat(thread.sessionId)}
              type="button"
            >
              <span>
                <strong>{thread.label}</strong>
                <small>{thread.kind === "order" ? thread.orderReference : "Support"}</small>
              </span>
              <small>{thread.lastMessage}</small>
            </button>
          ))}
        </div>

        <div className="portal-chat-panel">
          <div className="portal-card-top">
            <div>
              <strong>{activeChatThread?.label ?? "General support"}</strong>
              {activeChatThread?.lastMessageAt ? (
                <span>
                  Last update{" "}
                  {new Date(activeChatThread.lastMessageAt).toLocaleString("en-GB", {
                    dateStyle: "short",
                    timeStyle: "short"
                  })}
                </span>
              ) : null}
            </div>
            <StatusIndicator label={activeChatThread?.kind === "order" ? "Order chat" : "Support"} tone="good" />
          </div>

          <div aria-live="polite" className="chat-thread portal-chat-thread">
            {activeChatThread?.messages.length ? (
              activeChatThread.messages.map((message) => (
                <div className={`chat-bubble chat-bubble-${message.role}`} key={message.id}>
                  <strong>{message.author}</strong>
                  <MessageText body={message.body} />
                  <time dateTime={message.createdAt}>
                    {new Date(message.createdAt).toLocaleString("en-GB", {
                      dateStyle: "short",
                      timeStyle: "short"
                    })}
                  </time>
                </div>
              ))
            ) : (
              <div className="portal-chat-empty">
                <MessageCircle aria-hidden size={22} />
                <p className="helper">No messages yet. Send one below and it goes straight into the TechChimps team inbox.</p>
              </div>
            )}
          </div>

          <form className="customer-message-form" onSubmit={sendChatMessage}>
            <label className="field">
              <span className="label">Message</span>
              <textarea
                aria-label="Customer chat message"
                className="textarea chat-textarea"
                onChange={(event) => {
                  setSupportStatus("idle");
                  setSupportBody(event.target.value);
                }}
                placeholder="Reply here, ask a question, or add extra details..."
                required
                value={supportBody}
              />
            </label>
            {supportStatus === "sent" ? (
              <p className="support-notice">Sent. Your message is now visible to the team in live support.</p>
            ) : null}
            {supportStatus === "error" ? <p className="form-error">Message could not be sent. Try again or email us.</p> : null}
            <Button disabled={supportStatus === "sending" || !supportBody.trim()} icon={supportStatus === "sending" ? Loader2 : Send} type="submit">
              {supportStatus === "sending" ? "Sending" : "Send message"}
            </Button>
          </form>
        </div>
      </div>
    </Card>
  );

  const renderOrders = () => (
    <Card className="portal-orders-card">
      <div className="portal-card-top">
        <span className="eyebrow">
          <FileText size={15} /> Your requests
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
                <button className="portal-inline-action" onClick={() => openOrderChat(order.chatSessionId)} type="button">
                  <MessageCircle aria-hidden size={14} />
                  Chat
                </button>
                {order.stripeSessionId ? (
                  <a
                    className="portal-inline-action"
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
            <span>Opening your account...</span>
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
            <span className="eyebrow">Customer account</span>
            <h1 className="title">Login / sign up.</h1>
            <p className="subtitle">
              Use the same email you ordered with. Your chats, offers, orders, and team updates will link automatically.
            </p>
            <div className="portal-trust-list">
              <span>
                <ShieldCheck aria-hidden size={18} /> Stays signed in
              </span>
              <span>
                <MessageCircle aria-hidden size={18} /> Previous chats
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
                  placeholder="you@example.co.uk"
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
            <span className="eyebrow">Account</span>
            <h1 className="title">Hi, {data.user.name}.</h1>
            <p className="subtitle">Your chats, orders, and updates are all here.</p>
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
        <div className="container portal-nav-row">
          <button onClick={() => setActiveTab("chats")} type="button">
            <MessageCircle aria-hidden size={18} />
            Open chats
          </button>
          <Link href="/request">
            <FileText aria-hidden size={18} />
            New request
          </Link>
          <a href={`mailto:${contactEmail}`}>
            <Mail aria-hidden size={18} />
            Email {contactEmail}
          </a>
        </div>
      </section>

      <section className="section-tight">
        <div className="container portal-tab-shell">
          <div aria-label="Account sections" className="tabs-list portal-tabs-list" role="tablist">
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
            {activeTab === "chats" ? renderChats() : null}
            {activeTab === "orders" ? renderOrders() : null}
            {activeTab === "inbox" ? renderInbox() : null}

            {activeTab === "account" ? (
              <Card className="portal-account-card">
                <span className="eyebrow">
                  <UserRound size={15} /> Account details
                </span>
                <h2>{data.user.email}</h2>
                <p>Your orders and messages are matched by this email. This device stays signed in for 180 days.</p>
                <div className="portal-trust-list">
                  <span>
                    <ShieldCheck aria-hidden size={18} /> {data.user.hasPassword ? "Password protected" : "Claimable account"}
                  </span>
                  <span>
                    <MessageCircle aria-hidden size={18} /> {data.chatThreads.length} chat threads
                  </span>
                  <span>
                    <FileText aria-hidden size={18} /> {data.orders.length} linked requests
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
