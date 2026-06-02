"use client";

import { Archive, CheckCircle2, Loader2, MessageSquareReply, Search, Send, Volume2, VolumeX, XCircle } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageText } from "@/components/ui/message-text";
import { StatusIndicator } from "@/components/ui/status-indicator";
import type { LiveChatMessage, LiveChatSessionSummary } from "@/lib/live-chat";
import { playGentleChimpChime, primeNotificationSound } from "@/lib/notification-sound";
import type { OrderRecord } from "@/lib/orders";

type ConversationFilter = "all" | "custom" | "general" | "offers" | "paid" | "previous" | "waiting";

type ConversationRow = {
  category: ConversationFilter;
  customerName: string;
  lastMessage: string;
  lastMessageAt: string;
  endedAt?: string;
  isEnded: boolean;
  messageCount: number;
  order?: OrderRecord;
  priority: LiveChatSessionSummary["priority"];
  reference: string;
  serviceName: string;
  sessionId: string;
  unreadVisitorMessages: number;
};

function humanStatus(value: string) {
  return value.replaceAll("_", " ");
}

function categoryFor(order: OrderRecord | undefined, session: LiveChatSessionSummary | undefined): ConversationFilter {
  if (session?.status === "ended") return "previous";
  if (order?.status === "custom_request_waiting_review") return "custom";
  if (order?.status === "offer_waiting_review") return "offers";
  if (order?.status === "paid_waiting_support" || session?.priority === "payment") return "paid";
  if (session?.unreadVisitorMessages || session?.priority === "waiting") return "waiting";
  return "general";
}

function categoryLabel(category: ConversationFilter) {
  return {
    all: "All",
    custom: "Custom",
    general: "General",
    offers: "Offers",
    paid: "Paid",
    previous: "Previous",
    waiting: "Waiting"
  }[category];
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "TC";
}

export function LiveChatConsole() {
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [sessions, setSessions] = useState<LiveChatSessionSummary[]>([]);
  const [waitingOrders, setWaitingOrders] = useState<OrderRecord[]>([]);
  const [activeSession, setActiveSession] = useState("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [reviewingReference, setReviewingReference] = useState("");
  const [reviewNotice, setReviewNotice] = useState("");
  const [endingSession, setEndingSession] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ConversationFilter>("all");
  const activeChatRef = useRef<HTMLDivElement>(null);
  const loadedOnceRef = useRef(false);
  const lastVisitorSignalRef = useRef("");

  const loadMessages = useCallback(async () => {
    const [chatResponse, orderResponse] = await Promise.all([
      fetch("/api/live-chat", { cache: "no-store" }),
      fetch("/api/orders?waiting=true", { cache: "no-store" })
    ]);
    let nextSessions: LiveChatSessionSummary[] = [];
    let nextOrders: OrderRecord[] = [];

    if (chatResponse.ok) {
      const data = (await chatResponse.json()) as { messages: LiveChatMessage[]; sessions: LiveChatSessionSummary[] };
      const latestVisitorMessage = [...data.messages].reverse().find((message) => message.role === "visitor");
      const latestWaitingSignal = data.sessions
        .filter((session) => session.unreadVisitorMessages || session.priority !== "normal")
        .map((session) => `${session.sessionId}:${session.lastMessageAt}:${session.messageCount}`)
        .sort()
        .join("|");
      const alertSignal = latestVisitorMessage ? `${latestVisitorMessage.id}:${latestWaitingSignal}` : latestWaitingSignal;

      if (soundEnabled && loadedOnceRef.current && alertSignal && alertSignal !== lastVisitorSignalRef.current) {
        void playGentleChimpChime();
      }

      if (alertSignal) lastVisitorSignalRef.current = alertSignal;
      loadedOnceRef.current = true;
      nextSessions = data.sessions;
      setMessages(data.messages);
      setSessions(data.sessions);
    }

    if (orderResponse.ok) {
      const data = (await orderResponse.json()) as { orders: OrderRecord[] };
      nextOrders = data.orders;
      setWaitingOrders(data.orders);
    }

    setActiveSession((current) => current || nextSessions.find((session) => session.status !== "ended")?.sessionId || nextOrders[0]?.chatSessionId || "");
  }, [soundEnabled]);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void loadMessages();
    }, 0);
    const interval = window.setInterval(() => {
      void loadMessages();
    }, 2500);

    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [loadMessages]);

  const conversationRows = useMemo(() => {
    const orderMap = new Map(waitingOrders.map((order) => [order.chatSessionId, order]));
    const rows = sessions.map((session): ConversationRow => {
      const order = orderMap.get(session.sessionId);
      const category = categoryFor(order, session);

      return {
        category,
        customerName: order?.contactName || session.customerName,
        endedAt: session.endedAt,
        isEnded: session.status === "ended",
        lastMessage: session.lastMessage,
        lastMessageAt: session.lastMessageAt,
        messageCount: session.messageCount,
        order,
        priority: session.priority,
        reference: order?.reference || session.sessionId.replace(/^order-/, "").toUpperCase(),
        serviceName: order?.serviceName || (category === "general" ? "General support" : categoryLabel(category)),
        sessionId: session.sessionId,
        unreadVisitorMessages: session.unreadVisitorMessages
      };
    });

    for (const order of waitingOrders) {
      if (rows.some((row) => row.sessionId === order.chatSessionId)) continue;
      rows.push({
        category: categoryFor(order, undefined),
        customerName: order.contactName || "Customer",
        isEnded: false,
        lastMessage: order.goals || order.offerReason || "Waiting for support.",
        lastMessageAt: order.updatedAt,
        messageCount: 0,
        order,
        priority: "waiting",
        reference: order.reference,
        serviceName: order.serviceName,
        sessionId: order.chatSessionId,
        unreadVisitorMessages: 1
      });
    }

    return rows.sort((a, b) => {
      if (a.isEnded !== b.isEnded) return a.isEnded ? 1 : -1;
      const priorityScore = (row: ConversationRow) =>
        row.priority === "payment" ? 0 : row.unreadVisitorMessages || row.priority === "waiting" ? 1 : 2;
      const priorityDiff = priorityScore(a) - priorityScore(b);
      if (priorityDiff) return priorityDiff;
      return b.lastMessageAt.localeCompare(a.lastMessageAt);
    });
  }, [sessions, waitingOrders]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return conversationRows.filter((row) => {
      const matchesFilter =
        filter === "previous"
          ? row.isEnded
          : !row.isEnded && (filter === "all" || row.category === filter || (filter === "waiting" && row.unreadVisitorMessages > 0));
      const searchable = `${row.customerName} ${row.serviceName} ${row.reference} ${row.lastMessage}`.toLowerCase();
      return matchesFilter && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [conversationRows, filter, query]);

  const activeMessages = useMemo(
    () => (activeSession ? messages.filter((message) => message.sessionId === activeSession) : []),
    [activeSession, messages]
  );
  const activeRow = conversationRows.find((row) => row.sessionId === activeSession) ?? null;
  const activeWaitingOrder = activeRow?.order ?? waitingOrders.find((order) => order.chatSessionId === activeSession);
  const activeChatEnded = Boolean(activeRow?.isEnded);
  const waitingChatCount = conversationRows.filter((row) => !row.isEnded && (row.unreadVisitorMessages || row.priority !== "normal")).length;
  const filters: ConversationFilter[] = ["all", "waiting", "custom", "offers", "paid", "general", "previous"];

  const openConversation = (sessionId: string) => {
    void primeNotificationSound();
    setActiveSession(sessionId);
    window.requestAnimationFrame(() => {
      activeChatRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const reviewOffer = async (order: OrderRecord, action: "accept" | "decline") => {
    const confirmed = window.confirm(
      action === "accept"
        ? `Accept ${order.contactName || "this customer"}'s offer and send a secure payment link for ${order.amount}?`
        : `Decline ${order.contactName || "this customer"}'s offer and send a friendly reply?`
    );
    if (!confirmed) return;

    setReviewingReference(order.reference);
    setReviewNotice("");
    const response = await fetch("/api/admin/offers", {
      body: JSON.stringify({
        action,
        reference: order.reference
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };

    if (response.ok) {
      setReviewNotice(
        action === "accept"
          ? "Offer accepted. The secure Stripe payment link is now in the customer's live chat and account inbox."
          : "Offer declined. The customer has received a friendly live chat reply."
      );
      await loadMessages();
    } else {
      setReviewNotice(data.error ?? "The offer could not be updated. Please try again.");
    }
    setReviewingReference("");
  };

  const endConversation = async () => {
    if (!activeSession || activeChatEnded) return;

    const confirmed = window.confirm("End this live chat and move it into previous chats for both admin and customer?");
    if (!confirmed) return;

    setEndingSession(activeSession);
    setReviewNotice("");
    const response = await fetch("/api/live-chat", {
      body: JSON.stringify({
        action: "end",
        author: "Studio support",
        role: "agent",
        sessionId: activeSession
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "PATCH"
    });

    if (response.ok) {
      setReviewNotice("Chat ended and saved as previous history for the customer and admin.");
      setFilter("previous");
      await loadMessages();
    } else {
      setReviewNotice("Chat could not be ended. Please try again.");
    }

    setEndingSession("");
  };

  const sendReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reply.trim() || !activeSession || activeChatEnded) return;

    void primeNotificationSound();
    setSending(true);
    const response = await fetch("/api/live-chat", {
      body: JSON.stringify({
        author: "Studio support",
        body: reply,
        role: "agent",
        sessionId: activeSession
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    if (response.ok) {
      setReply("");
      await loadMessages();
    }
    setSending(false);
  };

  return (
    <Card className="live-chat-console imessage-console">
      <div className="chat-console-header">
        <div>
          <span className="eyebrow">
            <MessageSquareReply size={15} /> Live messages
          </span>
          <h2>One clean inbox for customer chats.</h2>
        </div>
        <StatusIndicator label={waitingChatCount ? `${waitingChatCount} need reply` : `${conversationRows.length} conversations`} tone={waitingChatCount ? "warning" : "active"} />
        <button
          aria-label={soundEnabled ? "Turn admin chat sound off" : "Turn admin chat sound on"}
          className="icon-button"
          onClick={() => {
            setSoundEnabled((current) => !current);
            void primeNotificationSound();
          }}
          type="button"
        >
          {soundEnabled ? <Volume2 aria-hidden size={17} /> : <VolumeX aria-hidden size={17} />}
        </button>
      </div>

      {reviewNotice ? <p className="support-notice">{reviewNotice}</p> : null}

      <div className="support-session-grid imessage-grid">
        <aside className="support-conversation-sidebar" aria-label="Conversation list">
          <label className="search-field support-search">
            <span className="label">Find a chat</span>
            <span>
              <Search aria-hidden size={16} />
              <input
                className="input"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, service, reference..."
                value={query}
              />
            </span>
          </label>

          <div className="support-filter-bar" aria-label="Conversation filters">
            {filters.map((item) => (
              <button className={filter === item ? "active" : ""} key={item} onClick={() => setFilter(item)} type="button">
                {categoryLabel(item)}
              </button>
            ))}
          </div>

          <div className="support-session-list imessage-list">
            {filteredRows.length ? (
              filteredRows.map((row) => (
                <button
                  className={row.sessionId === activeSession ? "active support-conversation" : "support-conversation"}
                  key={row.sessionId}
                  onClick={() => openConversation(row.sessionId)}
                  type="button"
                >
                  <span className="conversation-avatar">{initials(row.customerName)}</span>
                  <span className="conversation-main">
                    <strong>{row.customerName}</strong>
                    <small>{row.serviceName}</small>
                    <small>{row.lastMessage}</small>
                  </span>
                  <span className="conversation-meta">
                    <small>{row.reference}</small>
                    <StatusIndicator
                      label={row.isEnded ? "Previous" : row.priority === "payment" ? "Paid" : row.unreadVisitorMessages ? "Reply" : categoryLabel(row.category)}
                      tone={row.isEnded ? "good" : row.priority === "payment" || row.unreadVisitorMessages ? "warning" : "active"}
                    />
                  </span>
                </button>
              ))
            ) : (
              <p className="helper">No matching chats. New visitors and customers appear here automatically.</p>
            )}
          </div>
        </aside>

        <div className="support-active-chat imessage-active" ref={activeChatRef}>
          <div className="portal-card-top imessage-chat-head">
            <div>
              <span className="eyebrow">{activeRow ? categoryLabel(activeRow.category) : "No chat selected"}</span>
              <h3>{activeRow?.customerName ?? "Choose a conversation"}</h3>
              {activeRow ? (
                <p>
                  {activeRow.serviceName} {activeRow.reference ? `- ${activeRow.reference}` : ""}
                </p>
              ) : null}
            </div>
            {activeRow ? (
              <div className="chat-head-actions">
                <StatusIndicator
                  label={
                    activeChatEnded
                      ? "Previous"
                      : activeRow.priority === "payment"
                        ? "Payment handoff"
                        : activeRow.unreadVisitorMessages
                          ? "Needs reply"
                          : "Open"
                  }
                  tone={activeChatEnded ? "good" : activeRow.priority === "payment" || activeRow.unreadVisitorMessages ? "warning" : "active"}
                />
                {!activeChatEnded ? (
                  <button
                    className="text-button end-chat-button"
                    disabled={endingSession === activeSession}
                    onClick={() => void endConversation()}
                    type="button"
                  >
                    <Archive aria-hidden size={15} />
                    {endingSession === activeSession ? "Ending" : "End chat"}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          {activeWaitingOrder && !activeChatEnded ? (
            <div className="active-ticket-card">
              <div>
                <strong>{activeWaitingOrder.serviceName}</strong>
                <span>{humanStatus(activeWaitingOrder.status)}</span>
              </div>
              {activeWaitingOrder.offerMode !== "standard" && activeWaitingOrder.status === "offer_waiting_review" ? (
                <div className="waiting-order-actions">
                  <span className="waiting-offer-amount">Offer: GBP {activeWaitingOrder.amount.toFixed(2)}</span>
                  <button
                    className="offer-accept"
                    disabled={reviewingReference === activeWaitingOrder.reference}
                    onClick={() => void reviewOffer(activeWaitingOrder, "accept")}
                    type="button"
                  >
                    <CheckCircle2 aria-hidden size={15} />
                    Accept
                  </button>
                  <button
                    className="offer-decline"
                    disabled={reviewingReference === activeWaitingOrder.reference}
                    onClick={() => void reviewOffer(activeWaitingOrder, "decline")}
                    type="button"
                  >
                    <XCircle aria-hidden size={15} />
                    Decline
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          <div aria-live="polite" className="chat-thread admin-chat-thread imessage-thread">
            {activeMessages.length ? (
              activeMessages.map((message) => (
                <div className={`chat-bubble chat-bubble-${message.role}`} key={message.id}>
                  <strong>{message.author}</strong>
                  <MessageText body={message.body} />
                  <time dateTime={message.createdAt}>
                    {new Date(message.createdAt).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </time>
                </div>
              ))
            ) : (
              <p className="helper">
                {activeWaitingOrder
                  ? `${activeWaitingOrder.contactName || "Customer"} is waiting. Send a reply below to join this live support thread.`
                  : "Select a chat from the list to join it."}
              </p>
            )}
          </div>

          {activeChatEnded ? (
            <p className="chat-ended-notice">
              This conversation is closed and stored as previous chat history. It is read-only now.
            </p>
          ) : null}

          <form className="chat-form imessage-compose" onSubmit={sendReply}>
            <label className="field">
              <span className="label">Reply</span>
              <textarea
                aria-label="Admin live chat reply"
                className="textarea chat-textarea"
                disabled={activeChatEnded}
                onChange={(event) => setReply(event.target.value)}
                placeholder={activeChatEnded ? "This previous chat is read-only." : "Type your reply..."}
                value={reply}
              />
            </label>
            <Button disabled={sending || !reply.trim() || !activeSession || activeChatEnded} icon={sending ? Loader2 : Send} type="submit">
              {sending ? "Sending" : "Send"}
            </Button>
          </form>
        </div>
      </div>
    </Card>
  );
}
