"use client";

import { CheckCircle2, Loader2, MessageCircleWarning } from "lucide-react";
import { useEffect, useState } from "react";
import { LiveSupportWidget } from "@/components/sections/live-support-widget";
import { Card } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { liveSupportEtaMessage, liveSupportHandoffMessage } from "@/lib/support-copy";

type ConnectState = {
  chatSessionId?: string;
  error?: string;
  reference?: string;
  status: "connecting" | "connected" | "waiting" | "error";
};

export function CheckoutSuccessClient({
  orderReference,
  stripeSessionId
}: {
  orderReference?: string;
  stripeSessionId?: string;
}) {
  const [state, setState] = useState<ConnectState>({ status: "connecting", reference: orderReference });

  useEffect(() => {
    let cancelled = false;

    async function connectChat() {
      const response = await fetch("/api/orders/connect-chat", {
        body: JSON.stringify({ orderReference, stripeSessionId }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      const data = (await response.json()) as {
        chatSessionId?: string;
        error?: string;
        reference?: string;
        status?: string;
      };

      if (cancelled) return;

      if (response.ok && data.chatSessionId) {
        setState({
          chatSessionId: data.chatSessionId,
          reference: data.reference ?? orderReference,
          status: "connected"
        });
        return;
      }

      setState({
        error: data.error ?? "Payment is still being confirmed.",
        reference: data.reference ?? orderReference,
        status: response.status === 409 ? "waiting" : "error"
      });
    }

    void connectChat();

    return () => {
      cancelled = true;
    };
  }, [orderReference, stripeSessionId]);

  return (
    <main>
      <section className="section checkout-success">
        <div className="container split">
          <div>
            <span className="eyebrow">Payment handoff</span>
            <h1 className="title">Payment received. You are in live support.</h1>
            <p className="subtitle">
              {liveSupportHandoffMessage} {liveSupportEtaMessage} You can ask questions, send extra details, and get a
              clear next step without needing to work anything out alone.
            </p>
          </div>
          <Card className="checkout-status-card">
            {state.status === "connecting" ? <Loader2 aria-hidden size={30} /> : null}
            {state.status === "connected" ? <CheckCircle2 aria-hidden size={30} /> : null}
            {state.status === "waiting" || state.status === "error" ? <MessageCircleWarning aria-hidden size={30} /> : null}
            <StatusIndicator
              label={
                state.status === "connected"
                  ? "Support thread ready"
                  : state.status === "connecting"
                    ? "Connecting chat"
                    : "Confirmation pending"
              }
              tone={state.status === "connected" ? "good" : "warning"}
            />
            <h2>{state.reference ?? "Order reference pending"}</h2>
            <p>
              {state.status === "connected"
                ? `${liveSupportHandoffMessage} ${liveSupportEtaMessage} Please never be scared to reach out for help or tell us if you are unhappy with something.`
                : state.error ?? "Stripe is confirming the payment event. This page will keep the handoff clear."}
            </p>
          </Card>
        </div>
      </section>

      {state.chatSessionId ? <LiveSupportWidget defaultOpen sessionId={state.chatSessionId} /> : null}
    </main>
  );
}
