import { NextResponse } from "next/server";
import {
  deleteAdminPushSubscription,
  getAdminPushStatus,
  listAdminPushSubscriptions,
  saveAdminPushSubscription,
  sendAdminPushNotification
} from "@/lib/admin-push";
import { adminUnauthorized, isAdminRequestAuthenticated } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminRequestAuthenticated(request)) return adminUnauthorized();

  const status = getAdminPushStatus();
  const subscriptions = await listAdminPushSubscriptions();

  return NextResponse.json({
    ...status,
    subscriptionCount: subscriptions.length,
    subscriptions: subscriptions.map((subscription) => ({
      id: subscription.id,
      createdAt: subscription.createdAt,
      label: subscription.label,
      lastSentAt: subscription.lastSentAt,
      updatedAt: subscription.updatedAt,
      userAgent: subscription.userAgent
    }))
  });
}

export async function POST(request: Request) {
  if (!isAdminRequestAuthenticated(request)) return adminUnauthorized();

  const payload = (await request.json().catch(() => null)) as {
    action?: "test";
    label?: string;
    subscription?: {
      endpoint?: string;
      expirationTime?: number | null;
      keys?: {
        auth?: string;
        p256dh?: string;
      };
    };
    userAgent?: string;
  } | null;

  if (payload?.action === "test") {
    const result = await sendAdminPushNotification({
      body: "Your TechChimps admin app is connected. Payments, orders, offers, tickets, and customer chats can now alert this phone.",
      kind: "system",
      tag: "admin-test",
      title: "TechChimps admin alerts are on",
      url: "/admin"
    });

    return NextResponse.json({ result });
  }

  if (!payload?.subscription?.endpoint || !payload.subscription.keys?.auth || !payload.subscription.keys?.p256dh) {
    return NextResponse.json({ error: "A valid push subscription is required." }, { status: 400 });
  }

  const subscription = await saveAdminPushSubscription({
    label: payload.label,
    subscription: {
      endpoint: payload.subscription.endpoint,
      expirationTime: payload.subscription.expirationTime ?? null,
      keys: {
        auth: payload.subscription.keys.auth,
        p256dh: payload.subscription.keys.p256dh
      }
    },
    userAgent: payload.userAgent
  });

  return NextResponse.json({ subscription });
}

export async function DELETE(request: Request) {
  if (!isAdminRequestAuthenticated(request)) return adminUnauthorized();

  const payload = (await request.json().catch(() => null)) as { endpoint?: string } | null;
  if (!payload?.endpoint) {
    return NextResponse.json({ error: "Endpoint is required." }, { status: 400 });
  }

  await deleteAdminPushSubscription(payload.endpoint);
  return NextResponse.json({ ok: true });
}
