"use client";

import { Bell, BellRing, Download, Loader2, Smartphone, WifiOff } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";

type AdminPushStatus = {
  publicKey: string;
  ready: boolean;
  subject: string;
  subscriptionCount: number;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

function isStandalone() {
  const standaloneNavigator = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || standaloneNavigator.standalone === true;
}

export function AdminAppPanel() {
  const [status, setStatus] = useState<AdminPushStatus | null>(null);
  const [supported, setSupported] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState<"idle" | "enable" | "test" | "disable" | "install">("idle");
  const [notice, setNotice] = useState("");
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const appReady = Boolean(status?.ready && supported);
  const statusTone = subscribed ? "good" : appReady ? "active" : "warning";
  const statusLabel = subscribed ? "Phone alerts on" : appReady ? "Ready to enable" : "Needs setup";

  const loadStatus = useCallback(async () => {
    const response = await fetch("/api/admin/push", { cache: "no-store" });
    if (!response.ok) return;

    const data = (await response.json()) as AdminPushStatus;
    setStatus(data);
  }, []);

  const registerWorker = useCallback(async () => {
    const registration = await navigator.serviceWorker.register("/admin-sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    return registration;
  }, []);

  const refreshSubscription = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const registration = await registerWorker();
    const existing = await registration.pushManager.getSubscription();
    setSubscribed(Boolean(existing));
  }, [registerWorker]);

  useEffect(() => {
    let cancelled = false;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    queueMicrotask(() => {
      if (cancelled) return;
      const canPush = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      setSupported(canPush);
      setInstalled(isStandalone());
      if ("Notification" in window) setPermission(Notification.permission);
      void loadStatus();
      if (canPush) void refreshSubscription();
    });

    return () => {
      cancelled = true;
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, [loadStatus, refreshSubscription]);

  const enableNotifications = async () => {
    if (!status?.publicKey || !status.ready) {
      setNotice("Push keys are not configured yet. Add the admin VAPID keys to production, then reload this page.");
      return;
    }

    setBusy("enable");
    setNotice("");

    try {
      const nextPermission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      setPermission(nextPermission);

      if (nextPermission !== "granted") {
        setNotice("Notifications are blocked. Allow notifications in Chrome settings, then try again.");
        setBusy("idle");
        return;
      }

      const registration = await registerWorker();
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          applicationServerKey: urlBase64ToUint8Array(status.publicKey),
          userVisibleOnly: true
        }));

      const response = await fetch("/api/admin/push", {
        body: JSON.stringify({
          label: "Samsung admin app",
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Could not save this phone for alerts.");
      }

      setSubscribed(true);
      setNotice("Phone alerts are enabled. Send a test alert to confirm your Samsung receives it.");
      await loadStatus();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not enable phone alerts.");
    } finally {
      setBusy("idle");
    }
  };

  const sendTest = async () => {
    setBusy("test");
    setNotice("");

    const response = await fetch("/api/admin/push", {
      body: JSON.stringify({ action: "test" }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    if (response.ok) {
      setNotice("Test alert sent. Check your phone notification shade.");
      await loadStatus();
    } else {
      setNotice("Test alert could not be sent. Check push keys and try again.");
    }

    setBusy("idle");
  };

  const disableNotifications = async () => {
    setBusy("disable");
    setNotice("");

    try {
      const registration = await registerWorker();
      const existing = await registration.pushManager.getSubscription();

      if (existing) {
        await fetch("/api/admin/push", {
          body: JSON.stringify({ endpoint: existing.endpoint }),
          headers: {
            "Content-Type": "application/json"
          },
          method: "DELETE"
        });
        await existing.unsubscribe();
      }

      setSubscribed(false);
      setNotice("Phone alerts are off for this device.");
      await loadStatus();
    } catch {
      setNotice("Could not disable alerts from this device.");
    } finally {
      setBusy("idle");
    }
  };

  const installApp = async () => {
    if (!installPrompt) {
      setNotice("Open this page in Chrome on your Samsung, then use Add to Home screen from the browser menu.");
      return;
    }

    setBusy("install");
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstalled(choice.outcome === "accepted" || isStandalone());
    setInstallPrompt(null);
    setBusy("idle");
  };

  const featureCopy = useMemo(
    () => [
      "Payments and paid handoffs",
      "New orders and custom offers",
      "Customer live chat replies",
      "Refund and support updates"
    ],
    []
  );

  return (
    <Card className="admin-app-panel">
      <div className="admin-app-copy">
        <span className="eyebrow">
          <Smartphone size={15} /> Android admin app
        </span>
        <h2>Install TechChimps Admin on your Samsung.</h2>
        <p>Get phone alerts for payments, orders, offers, customer tickets, and inbox activity so nothing slips past you.</p>
        <div className="admin-app-status-row">
          <StatusIndicator label={statusLabel} tone={statusTone} />
          <StatusIndicator label={installed ? "Installed" : "Browser app"} tone={installed ? "good" : "active"} />
          <StatusIndicator label={`${status?.subscriptionCount ?? 0} devices`} tone={(status?.subscriptionCount ?? 0) ? "good" : "active"} />
        </div>
      </div>

      <div className="admin-app-feature-list">
        {featureCopy.map((item) => (
          <span key={item}>
            <BellRing aria-hidden size={15} />
            {item}
          </span>
        ))}
      </div>

      <div className="admin-app-actions">
        <Button disabled={busy === "install" || installed} icon={busy === "install" ? Loader2 : Download} onClick={installApp} type="button" variant="secondary">
          {installed ? "Installed" : "Install app"}
        </Button>
        <Button disabled={!supported || busy === "enable" || subscribed} icon={busy === "enable" ? Loader2 : Bell} onClick={enableNotifications} type="button">
          {subscribed ? "Alerts enabled" : "Enable alerts"}
        </Button>
        <Button disabled={!subscribed || busy === "test"} icon={busy === "test" ? Loader2 : BellRing} onClick={sendTest} type="button" variant="soft">
          Send test
        </Button>
        <Button disabled={!subscribed || busy === "disable"} icon={busy === "disable" ? Loader2 : WifiOff} onClick={disableNotifications} type="button" variant="ghost">
          Disable
        </Button>
      </div>

      <p className="helper" aria-live="polite">
        {notice ||
          (permission === "denied"
            ? "Notifications are blocked in this browser. Open Chrome site settings for TechChimps and allow notifications."
            : appReady
              ? "For Android: open this page in Chrome, install the app, then enable alerts."
              : "Push notification keys need to be configured before phone alerts can send.")}
      </p>
    </Card>
  );
}
