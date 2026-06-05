"use client";

import { MessageCircle } from "lucide-react";

export function ContactLiveChatButton() {
  return (
    <button
      className="button button-secondary button-lg"
      onClick={() => window.dispatchEvent(new Event("techchimps:open-live-chat"))}
      type="button"
    >
      <MessageCircle aria-hidden size={18} /> Live chat
    </button>
  );
}
