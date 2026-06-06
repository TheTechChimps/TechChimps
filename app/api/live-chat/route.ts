import { NextResponse } from "next/server";
import { sendChatPushNotification } from "@/lib/admin-push";
import { adminUnauthorized, isAdminRequestAuthenticated } from "@/lib/admin-session";
import {
  appendLiveChatMessage,
  deleteAllLiveChatMessages,
  endLiveChatSession,
  getLiveChatMessages,
  getLiveChatSessionMeta,
  getLiveChatSessions,
  isVisibleLiveChatMessage,
  type LiveChatRole
} from "@/lib/live-chat";
import { archiveOrderChatSession, archiveWaitingOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId") ?? undefined;
  const isAdmin = isAdminRequestAuthenticated(request);

  if (!sessionId && !isAdmin) {
    return adminUnauthorized();
  }

  return NextResponse.json({
    messages: (await getLiveChatMessages(sessionId)).filter(isVisibleLiveChatMessage),
    session: sessionId ? await getLiveChatSessionMeta(sessionId) : undefined,
    sessions: isAdmin ? await getLiveChatSessions() : []
  });
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as {
    author?: string;
    body?: string;
    role?: LiveChatRole;
    sessionId?: string;
  } | null;

  if (!payload?.body?.trim()) {
    return NextResponse.json({ error: "Message body is required." }, { status: 400 });
  }

  if (payload.role === "agent" && !isAdminRequestAuthenticated(request)) {
    return adminUnauthorized();
  }

  const sessionId = payload.sessionId ?? "site-visitor";
  const session = await getLiveChatSessionMeta(sessionId);

  if (session.status === "ended") {
    return NextResponse.json({ error: "This chat has ended. Start a new chat if you need more help.", session }, { status: 409 });
  }

  const message = await appendLiveChatMessage({
    sessionId,
    role: payload.role === "agent" ? "agent" : "visitor",
    author: payload.author?.trim() || (payload.role === "agent" ? "Studio support" : "Website visitor"),
    body: payload.body.trim()
  });

  if (message.role === "visitor") {
    await sendChatPushNotification({
      author: message.author,
      body: message.body,
      sessionId: message.sessionId
    });
  }

  return NextResponse.json({ message });
}

export async function PATCH(request: Request) {
  const payload = (await request.json().catch(() => null)) as {
    action?: "end";
    author?: string;
    role?: LiveChatRole;
    sessionId?: string;
  } | null;

  if (payload?.action !== "end" || !payload.sessionId?.trim()) {
    return NextResponse.json({ error: "A chat session is required." }, { status: 400 });
  }

  if (payload.role === "agent" && !isAdminRequestAuthenticated(request)) {
    return adminUnauthorized();
  }

  const role = payload.role === "agent" ? "agent" : "visitor";
  const session = await endLiveChatSession({
    endedBy: payload.author?.trim() || (role === "agent" ? "Studio support" : "Customer"),
    endedByRole: role,
    sessionId: payload.sessionId.trim()
  });

  await archiveOrderChatSession(payload.sessionId.trim());

  return NextResponse.json({
    messages: (await getLiveChatMessages(payload.sessionId.trim())).filter(isVisibleLiveChatMessage),
    session
  });
}

export async function DELETE(request: Request) {
  if (!isAdminRequestAuthenticated(request)) {
    return adminUnauthorized();
  }

  const { searchParams } = new URL(request.url);
  const archiveTickets = searchParams.get("archiveTickets") === "true";
  const deletedMessages = await deleteAllLiveChatMessages();
  const archivedTickets = archiveTickets ? await archiveWaitingOrders() : 0;

  return NextResponse.json({
    archivedTickets,
    deletedMessages,
    ok: true
  });
}
