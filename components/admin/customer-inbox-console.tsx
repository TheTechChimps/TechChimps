"use client";

import { Inbox, Loader2, Send } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import type { PublicCustomerAccount } from "@/lib/accounts";

type AdminCustomer = PublicCustomerAccount & {
  orderCount: number;
  unreadCount: number;
};

export function CustomerInboxConsole() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    body: "",
    email: "",
    name: "",
    projectReference: "",
    subject: "Quick TechChimps update"
  });

  const loadCustomers = useCallback(async () => {
    const response = await fetch("/api/admin/customers", { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json()) as { customers: AdminCustomer[] };
      setCustomers(data.customers);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void loadCustomers();
    }, 0);

    return () => window.clearTimeout(initial);
  }, [loadCustomers]);

  const update = (key: keyof typeof form, value: string) => {
    setNotice("");
    setForm((current) => ({ ...current, [key]: value }));
  };

  const selectCustomer = (customer: AdminCustomer) => {
    setForm((current) => ({
      ...current,
      email: customer.email,
      name: customer.name
    }));
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setNotice("");

    const response = await fetch("/api/admin/inbox", {
      body: JSON.stringify(form),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    if (response.ok) {
      setNotice("Message sent to the customer portal.");
      setForm((current) => ({ ...current, body: "", projectReference: "" }));
      await loadCustomers();
    } else {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setNotice(payload.error ?? "Message could not be sent.");
    }

    setSending(false);
  };

  return (
    <Card className="customer-inbox-console">
      <div className="chat-console-header">
        <div>
          <span className="eyebrow">
            <Inbox size={15} /> Customer portal inbox
          </span>
          <h2>Leave private messages in customer accounts.</h2>
        </div>
        <StatusIndicator label={`${customers.length} customer accounts`} tone="active" />
      </div>

      <div className="customer-console-grid">
        <div className="customer-list">
          {customers.length ? (
            customers.slice(0, 8).map((customer) => (
              <button key={customer.id} onClick={() => selectCustomer(customer)} type="button">
                <span>
                  <strong>{customer.name}</strong>
                  <small>{customer.email}</small>
                </span>
                <span>
                  {customer.orderCount} orders
                  {customer.unreadCount ? ` / ${customer.unreadCount} unread` : ""}
                </span>
              </button>
            ))
          ) : (
            <p className="helper">No customer accounts yet. Sending a message to an email creates one automatically.</p>
          )}
        </div>

        <form className="customer-message-form" onSubmit={sendMessage}>
          <div className="form-grid">
            <label className="field">
              <span className="label">Customer email</span>
              <input
                className="input"
                onChange={(event) => update("email", event.target.value)}
                placeholder="client@example.co.uk"
                type="email"
                value={form.email}
              />
            </label>
            <label className="field">
              <span className="label">Customer name</span>
              <input
                className="input"
                onChange={(event) => update("name", event.target.value)}
                placeholder="Optional"
                value={form.name}
              />
            </label>
          </div>

          <label className="field">
            <span className="label">Subject</span>
            <input className="input" onChange={(event) => update("subject", event.target.value)} value={form.subject} />
          </label>

          <label className="field">
            <span className="label">Project reference</span>
            <input
              className="input"
              onChange={(event) => update("projectReference", event.target.value)}
              placeholder="Optional TC- reference"
              value={form.projectReference}
            />
          </label>

          <label className="field">
            <span className="label">Message</span>
            <textarea
              className="textarea chat-textarea"
              onChange={(event) => update("body", event.target.value)}
              placeholder="Write a clear update the customer will see in their portal..."
              value={form.body}
            />
          </label>

          {notice ? <p className="helper">{notice}</p> : null}

          <Button disabled={sending || !form.email || !form.subject || !form.body} icon={sending ? Loader2 : Send} type="submit">
            {sending ? "Sending message" : "Send to customer portal"}
          </Button>
        </form>
      </div>
    </Card>
  );
}
