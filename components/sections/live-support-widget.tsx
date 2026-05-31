"use client";

import { LifeBuoy, Loader2, Send } from "lucide-react";
import Image from "next/image";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatusIndicator } from "@/components/ui/status-indicator";
import type { LiveChatMessage } from "@/lib/live-chat";
import { liveSupportEtaMessage, liveSupportHandoffMessage } from "@/lib/support-copy";

export function LiveSupportWidget({
  defaultOpen = false,
  sessionId
}: {
  defaultOpen?: boolean;
  sessionId?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [activeSessionId, setActiveSessionId] = useState(() => {
    if (sessionId) return sessionId;
    if (typeof window === "undefined") return "";

    const stored = window.localStorage.getItem("techchimps-live-chat-session");
    if (stored) return stored;

    const next = `visitor-${crypto.randomUUID()}`;
    window.localStorage.setItem("techchimps-live-chat-session", next);
    return next;
  });
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("");
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(async () => {
    if (!activeSessionId) return;
    const response = await fetch(`/api/live-chat?sessionId=${encodeURIComponent(activeSessionId)}`, { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { messages: LiveChatMessage[] };
    setMessages(data.messages);
  }, [activeSessionId]);

  useEffect(() => {
    const update = window.setTimeout(() => {
      if (sessionId) {
        setActiveSessionId(sessionId);
        return;
      }

      const stored = window.localStorage.getItem("techchimps-live-chat-session");
      if (stored) {
        setActiveSessionId(stored);
        return;
      }

      const next = `visitor-${crypto.randomUUID()}`;
      window.localStorage.setItem("techchimps-live-chat-session", next);
      setActiveSessionId(next);
    }, 0);

    return () => window.clearTimeout(update);
  }, [sessionId]);

  useEffect(() => {
    if (!open || !activeSessionId) return;

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
  }, [activeSessionId, loadMessages, open]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!body.trim()) return;

    setSending(true);
    const response = await fetch("/api/live-chat", {
      body: JSON.stringify({
        author: author || "Website visitor",
        body,
        role: "visitor",
        sessionId: activeSessionId
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    if (response.ok) {
      setBody("");
      await loadMessages();
    }
    setSending(false);
  };

  return (
    <>
      <button aria-label="Open friendly support prompt" className="support-widget" onClick={() => setOpen(true)} type="button">
        <Image alt="" height={40} src="/images/techchimps-logo-square-small.png" width={40} />
        <span>
          Need help?
          <small>Live TechChimps chat</small>
        </span>
        <LifeBuoy aria-hidden size={19} />
      </button>
      <Modal bodyClassName="live-chat-modal-body" className="live-chat-modal" onClose={() => setOpen(false)} open={open} title="Live support">
        <div className="support-modal live-chat">
          <div className="chat-status-row">
            <StatusIndicator label="Live chat connected" tone="good" />
            <span>
              {liveSupportHandoffMessage} {liveSupportEtaMessage}
            </span>
          </div>
          <div aria-live="polite" className="chat-thread">
            {messages.map((message) => (
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
            ))}
          </div>
          <form className="chat-form" onSubmit={sendMessage}>
            <label className="field">
              <span className="label">Name</span>
              <input
                aria-label="Chat name"
                className="input"
                onChange={(event) => setAuthor(event.target.value)}
                placeholder="Your name"
                value={author}
              />
            </label>
            <label className="field">
              <span className="label">Message</span>
              <textarea
                aria-label="Chat message"
                className="textarea chat-textarea"
                onChange={(event) => setBody(event.target.value)}
                placeholder="Hi, I need help choosing the right option..."
                value={body}
              />
            </label>
            <Button disabled={sending || !body.trim()} icon={sending ? Loader2 : Send} type="submit">
              {sending ? "Sending" : "Send live message"}
            </Button>
          </form>
          <p className="helper">
            Messages go straight into the TechChimps support inbox. Ask anything, send extra details, or tell us if something is not right.
          </p>
        </div>
      </Modal>
    </>
  );
}
