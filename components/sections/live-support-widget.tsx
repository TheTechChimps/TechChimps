"use client";

import { Archive, LifeBuoy, Loader2, Maximize2, Minimize2, Send, Volume2, VolumeX, X } from "lucide-react";
import Image from "next/image";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { MessageText } from "@/components/ui/message-text";
import { StatusIndicator } from "@/components/ui/status-indicator";
import type { LiveChatMessage, LiveChatSessionMeta } from "@/lib/live-chat";
import { playGentleChimpChime, primeNotificationSound } from "@/lib/notification-sound";
import { liveSupportEtaMessage, liveSupportHandoffMessage } from "@/lib/support-copy";

function customerFacingAuthor(author: string) {
  return author === "Studio support" ? "TechChimps" : author;
}

export function LiveSupportWidget({
  defaultOpen = false,
  sessionId
}: {
  defaultOpen?: boolean;
  sessionId?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [minimized, setMinimized] = useState(false);
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
  const [sessionMeta, setSessionMeta] = useState<LiveChatSessionMeta | null>(null);
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("");
  const [sending, setSending] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const loadedOnceRef = useRef(false);
  const latestAgentMessageIdRef = useRef("");

  useEffect(() => {
    if (!defaultOpen) return;
    const openTimer = window.setTimeout(() => {
      setOpen(true);
      setMinimized(false);
    }, 0);

    return () => window.clearTimeout(openTimer);
  }, [defaultOpen, sessionId]);

  const loadMessages = useCallback(async () => {
    if (!activeSessionId) return;
    const response = await fetch(`/api/live-chat?sessionId=${encodeURIComponent(activeSessionId)}`, { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { messages: LiveChatMessage[]; session?: LiveChatSessionMeta };
    const latestAgentMessage = [...data.messages].reverse().find((message) => message.role === "agent");

    if (
      soundEnabled &&
      loadedOnceRef.current &&
      latestAgentMessage &&
      latestAgentMessage.id !== latestAgentMessageIdRef.current
    ) {
      void playGentleChimpChime();
    }

    if (latestAgentMessage) latestAgentMessageIdRef.current = latestAgentMessage.id;
    loadedOnceRef.current = true;
    setMessages(data.messages);
    setSessionMeta(data.session ?? null);
  }, [activeSessionId, soundEnabled]);

  useEffect(() => {
    const update = window.setTimeout(() => {
      if (sessionId) {
        window.localStorage.setItem("techchimps-live-chat-session", sessionId);
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

  useEffect(() => {
    loadedOnceRef.current = false;
    latestAgentMessageIdRef.current = "";
  }, [activeSessionId]);

  const openChat = () => {
    setOpen(true);
    setMinimized(false);
    void primeNotificationSound();
  };

  const closeChat = () => {
    setOpen(false);
    setMinimized(false);
  };

  const chatEnded = sessionMeta?.status === "ended";

  const startNewChat = () => {
    const next = `visitor-${crypto.randomUUID()}`;
    window.localStorage.setItem("techchimps-live-chat-session", next);
    setActiveSessionId(next);
    setMessages([]);
    setSessionMeta(null);
    setBody("");
    setOpen(true);
    setMinimized(false);
  };

  const endChat = async () => {
    if (!activeSessionId || chatEnded) return;

    const confirmed = window.confirm("End this live chat and save it as previous chat history?");
    if (!confirmed) return;

    const response = await fetch("/api/live-chat", {
      body: JSON.stringify({
        action: "end",
        author: author || "Website visitor",
        role: "visitor",
        sessionId: activeSessionId
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "PATCH"
    });

    if (response.ok) {
      const data = (await response.json()) as { messages: LiveChatMessage[]; session?: LiveChatSessionMeta };
      setMessages(data.messages);
      setSessionMeta(data.session ?? null);
    }
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!body.trim() || chatEnded) return;

    void primeNotificationSound();
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
      {!open ? (
        <button aria-label="Open friendly support prompt" className="support-widget" onClick={openChat} type="button">
          <Image alt="TechChimps live support logo" height={40} src="/images/techchimps-logo-square-small.png" width={40} />
          <span>
            Need help?
            <small>Live TechChimps chat</small>
          </span>
          <LifeBuoy aria-hidden size={19} />
        </button>
      ) : null}

      {open && minimized ? (
        <div className="support-mini-panel" role="status">
          <button aria-label="Reopen live chat" className="support-mini-main" onClick={() => setMinimized(false)} type="button">
            <Image alt="TechChimps live support logo" height={36} src="/images/techchimps-logo-square-small.png" width={36} />
            <span>
              Live chat
              <small>{messages[messages.length - 1]?.body ?? "We are here if you need us."}</small>
            </span>
            <Maximize2 aria-hidden size={17} />
          </button>
          <button aria-label="Close live chat" className="support-mini-close" onClick={closeChat} type="button">
            <X aria-hidden size={16} />
          </button>
        </div>
      ) : null}

      <Modal bodyClassName="live-chat-modal-body" className="live-chat-modal" onClose={closeChat} open={open && !minimized} title="Live support">
        <div className="support-modal live-chat">
          <div className="live-chat-controls" aria-label="Live chat controls">
            <button
              aria-label={soundEnabled ? "Turn chat sound off" : "Turn chat sound on"}
              className="icon-button"
              onClick={() => {
                setSoundEnabled((current) => !current);
                void primeNotificationSound();
              }}
              type="button"
            >
              {soundEnabled ? <Volume2 aria-hidden size={17} /> : <VolumeX aria-hidden size={17} />}
            </button>
            <button aria-label="Minimise live chat" className="icon-button" onClick={() => setMinimized(true)} type="button">
              <Minimize2 aria-hidden size={17} />
            </button>
            {!chatEnded ? (
              <button aria-label="End live chat" className="icon-button" onClick={() => void endChat()} type="button">
                <Archive aria-hidden size={17} />
              </button>
            ) : null}
          </div>
          <div className="chat-status-row">
            <StatusIndicator label={chatEnded ? "Previous chat" : "Live chat connected"} tone="good" />
            <span>
              {chatEnded
                ? "This chat is closed and saved. You can start a new chat if you need anything else."
                : `${liveSupportHandoffMessage} ${liveSupportEtaMessage}`}
            </span>
          </div>
          <div aria-live="polite" className="chat-thread">
            {messages.map((message) => (
              <div className={`chat-bubble chat-bubble-${message.role}`} key={message.id}>
                <strong>{customerFacingAuthor(message.author)}</strong>
                <MessageText body={message.body} />
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
                disabled={chatEnded}
                onChange={(event) => setBody(event.target.value)}
                placeholder={chatEnded ? "This previous chat is read-only." : "Hi, I need help choosing the right option..."}
                value={body}
              />
            </label>
            {chatEnded ? (
              <Button icon={LifeBuoy} onClick={startNewChat} type="button" variant="secondary">
                Start new chat
              </Button>
            ) : (
              <Button disabled={sending || !body.trim()} icon={sending ? Loader2 : Send} type="submit">
                {sending ? "Sending" : "Send live message"}
              </Button>
            )}
          </form>
          <p className="helper">
            Messages go straight into the TechChimps support inbox. Ask anything, send extra details, or tell us if something is not right.
          </p>
        </div>
      </Modal>
    </>
  );
}
