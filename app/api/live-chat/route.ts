import { NextResponse } from "next/server";
import { adminUnauthorized, isAdminRequestAuthenticated } from "@/lib/admin-session";
import {
  appendLiveChatMessage,
  getLiveChatMessages,
  getLiveChatSessions,
  isVisibleLiveChatMessage,
  type LiveChatRole
} from "@/lib/live-chat";

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

  const message = await appendLiveChatMessage({
    sessionId: payload.sessionId ?? "site-visitor",
    role: payload.role === "agent" ? "agent" : "visitor",
    author: payload.author?.trim() || (payload.role === "agent" ? "Studio support" : "Website visitor"),
    body: payload.body.trim()
  });

  return NextResponse.json({ message });
}
