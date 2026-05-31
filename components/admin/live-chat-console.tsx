"use client";

import { Loader2, MessageSquareReply, Send, Volume2, VolumeX } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import type { LiveChatMessage, LiveChatSessionSummary } from "@/lib/live-chat";
import { playGentleChimpChime, primeNotificationSound } from "@/lib/notification-sound";
import type { OrderRecord } from "@/lib/orders";

export function LiveChatConsole() {
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [sessions, setSessions] = useState<LiveChatSessionSummary[]>([]);
  const [waitingOrders, setWaitingOrders] = useState<OrderRecord[]>([]);
  const [activeSession, setActiveSession] = useState("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const activeChatRef = useRef<HTMLDivElement>(null);
  const loadedOnceRef = useRef(false);
  const lastVisitorSignalRef = useRef("");

  const loadMessages = useCallback(async () => {
    const [chatResponse, orderResponse] = await Promise.all([
      fetch("/api/live-chat", { cache: "no-store" }),
      fetch("/api/orders?waiting=true", { cache: "no-store" })
    ]);
    if (chatResponse.ok) {
      const data = (await chatResponse.json()) as { messages: LiveChatMessage[]; sessions: LiveChatSessionSummary[] };
      const latestVisitorMessage = [...data.messages].reverse().find((message) => message.role === "visitor");
      const latestWaitingSignal = data.sessions
        .filter((session) => session.unreadVisitorMessages || session.priority !== "normal")
        .map((session) => `${session.sessionId}:${session.lastMessageAt}:${session.messageCount}`)
        .sort()
        .join("|");
      const alertSignal = latestVisitorMessage
        ? `${latestVisitorMessage.id}:${latestWaitingSignal}`
        : latestWaitingSignal;

      if (soundEnabled && loadedOnceRef.current && alertSignal && alertSignal !== lastVisitorSignalRef.current) {
        void playGentleChimpChime();
      }

      if (alertSignal) lastVisitorSignalRef.current = alertSignal;
      loadedOnceRef.current = true;
      setMessages(data.messages);
      setSessions(data.sessions);
      setActiveSession((current) => current || data.sessions[0]?.sessionId || "");
    }
    if (orderResponse.ok) {
      const data = (await orderResponse.json()) as { orders: OrderRecord[] };
      setWaitingOrders(data.orders);
    }
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

  const activeMessages = useMemo(
    () => (activeSession ? messages.filter((message) => message.sessionId === activeSession) : []),
    [activeSession, messages]
  );
  const activeWaitingOrder = waitingOrders.find((order) => order.chatSessionId === activeSession);
  const activeSessionSummary =
    sessions.find((session) => session.sessionId === activeSession) ??
    (activeWaitingOrder
      ? {
          customerName: activeWaitingOrder.contactName || "Customer",
          lastMessage: `${activeWaitingOrder.serviceName} - ${activeWaitingOrder.reference}`,
          lastMessageAt: activeWaitingOrder.updatedAt,
          messageCount: activeMessages.length,
          priority: "waiting" as const,
          sessionId: activeWaitingOrder.chatSessionId,
          unreadVisitorMessages: 1
        }
      : null);
  const waitingChatCount = useMemo(() => {
    const waitingSessionIds = new Set<string>();
    waitingOrders.forEach((order) => waitingSessionIds.add(order.chatSessionId));
    sessions
      .filter((session) => session.unreadVisitorMessages || session.priority !== "normal")
      .forEach((session) => waitingSessionIds.add(session.sessionId));
    return waitingSessionIds.size;
  }, [sessions, waitingOrders]);

  const joinPaymentChat = (order: OrderRecord) => {
    void primeNotificationSound();
    setActiveSession(order.chatSessionId);
    window.requestAnimationFrame(() => {
      activeChatRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const sendReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reply.trim() || !activeSession) return;

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
    <Card className="live-chat-console">
      <div className="chat-console-header">
        <div>
          <span className="eyebrow">
            <MessageSquareReply size={15} /> Live support inbox
          </span>
          <h2>Reply to website visitors in real time.</h2>
        </div>
        <StatusIndicator
          label={
            waitingChatCount
              ? `${waitingChatCount} waiting`
              : `${sessions.length} open chats`
          }
          tone={waitingChatCount ? "warning" : "active"}
        />
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

      {waitingOrders.length ? (
        <div className="waiting-orders" aria-live="polite">
          {waitingOrders.slice(0, 3).map((order) => (
            <div className={order.chatSessionId === activeSession ? "active" : ""} key={order.reference}>
              <strong>{order.contactName || "Customer"} is waiting</strong>
              <span>
                {order.serviceName} - {order.reference}
              </span>
              <button onClick={() => joinPaymentChat(order)} type="button">
                {order.chatSessionId === activeSession ? "Chat open" : "Join payment chat"}
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="support-session-grid">
        <div className="support-session-list" aria-label="Live support queue">
          {sessions.length ? (
            sessions.map((session) => (
              <button
                className={session.sessionId === activeSession ? "active" : ""}
                key={session.sessionId}
                onClick={() => {
                  void primeNotificationSound();
                  setActiveSession(session.sessionId);
                }}
                type="button"
              >
                <span>
                  <strong>{session.customerName}</strong>
                  <small>{session.lastMessage}</small>
                </span>
                <StatusIndicator
                  label={session.priority === "payment" ? "Paid" : session.unreadVisitorMessages ? "Waiting" : "Open"}
                  tone={session.priority === "payment" || session.unreadVisitorMessages ? "warning" : "active"}
                />
              </button>
            ))
          ) : (
            <p className="helper">No active chats yet. New visitors and paid customers will appear here automatically.</p>
          )}
        </div>

        <div className="support-active-chat" ref={activeChatRef}>
          <div className="portal-card-top">
            <span className="eyebrow">
              {activeSessionSummary ? activeSessionSummary.customerName : "No chat selected"}
            </span>
            {activeSessionSummary ? (
              <StatusIndicator
                label={activeSessionSummary.priority === "payment" ? "Payment handoff" : "Live queue"}
                tone={activeSessionSummary.priority === "payment" ? "warning" : "active"}
              />
            ) : null}
          </div>

      <div aria-live="polite" className="chat-thread admin-chat-thread">
        {activeMessages.length ? (
          activeMessages.map((message) => (
            <div className={`chat-bubble chat-bubble-${message.role}`} key={message.id}>
              <strong>{message.author}</strong>
              <p>{message.body}</p>
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
              : "Select a chat from the queue to join it."}
          </p>
        )}
      </div>

      <form className="chat-form" onSubmit={sendReply}>
        <label className="field">
          <span className="label">Admin reply</span>
          <textarea
            aria-label="Admin live chat reply"
            className="textarea chat-textarea"
            onChange={(event) => setReply(event.target.value)}
            placeholder="Type your reply to the visitor..."
            value={reply}
          />
        </label>
        <Button disabled={sending || !reply.trim() || !activeSession} icon={sending ? Loader2 : Send} type="submit">
          {sending ? "Sending reply" : "Send reply"}
        </Button>
      </form>
        </div>
      </div>
    </Card>
  );
}
