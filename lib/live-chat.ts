import { readJson, writeJson } from "@/lib/storage";

export type LiveChatRole = "visitor" | "agent" | "system";

export type LiveChatMessage = {
  id: string;
  sessionId: string;
  role: LiveChatRole;
  author: string;
  body: string;
  createdAt: string;
  priority?: "normal" | "waiting" | "payment";
};

export type LiveChatSessionSummary = {
  sessionId: string;
  customerName: string;
  lastMessage: string;
  lastMessageAt: string;
  priority: NonNullable<LiveChatMessage["priority"]>;
  unreadVisitorMessages: number;
  messageCount: number;
};

const CHAT_STORE = "techchimps-live-chat";
const CHAT_KEY = "messages";

export function isVisibleLiveChatMessage(message: LiveChatMessage) {
  if (message.role === "system") return false;

  return !(
    message.role === "visitor" &&
    message.sessionId.startsWith("order-") &&
    message.body.includes("and is waiting for live support.")
  );
}

function welcomeMessage(sessionId: string): LiveChatMessage {
  return {
    id: `welcome-${sessionId}`,
    sessionId,
    role: "system",
    author: "TechChimps",
    body: "Live support is open. Send a message and TechChimps can reply here.",
    createdAt: new Date().toISOString()
  };
}

export async function getLiveChatMessages(sessionId?: string) {
  const storedMessages = (await readJson<LiveChatMessage[]>(CHAT_STORE, CHAT_KEY)) ?? [];
  const messages = storedMessages.map((message) => ({
    ...message,
    author: message.role === "system" ? "TechChimps" : message.author
  }));

  if (!sessionId) {
    return messages.length ? messages.slice(-150) : [welcomeMessage("site-visitor")];
  }

  const sessionMessages = messages.filter((message) => message.sessionId === sessionId).slice(-100);
  return sessionMessages.length ? sessionMessages : [welcomeMessage(sessionId)];
}

export async function getLiveChatSessions() {
  const messages = (await readJson<LiveChatMessage[]>(CHAT_STORE, CHAT_KEY)) ?? [];
  const sessions = new Map<string, LiveChatMessage[]>();

  for (const message of messages) {
    const current = sessions.get(message.sessionId) ?? [];
    current.push(message);
    sessions.set(message.sessionId, current);
  }

  const priorityWeight: Record<NonNullable<LiveChatMessage["priority"]>, number> = {
    payment: 0,
    waiting: 1,
    normal: 2
  };

  return Array.from(sessions.entries())
    .map(([sessionId, sessionMessages]): LiveChatSessionSummary | null => {
      const sorted = sessionMessages
        .filter(isVisibleLiveChatMessage)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      if (!sorted.length) return null;

      const lastMessage = sorted[sorted.length - 1];
      const lastAgentIndex = sorted.map((message) => message.role).lastIndexOf("agent");
      const unreadMessages = sorted
        .slice(lastAgentIndex + 1)
        .filter((message) => message.role === "visitor");
      const unreadVisitorMessages = unreadMessages.length;
      const visitor = sorted.find((message) => message.role === "visitor");
      const priority = unreadMessages.some((message) => message.priority === "payment")
        ? "payment"
        : unreadMessages.some((message) => message.priority === "waiting") || unreadVisitorMessages
          ? "waiting"
          : "normal";

      return {
        sessionId,
        customerName: visitor?.author || sessionId.replace(/^customer-|^visitor-|^order-/, "").slice(0, 28) || "Website visitor",
        lastMessage: lastMessage.body,
        lastMessageAt: lastMessage.createdAt,
        priority,
        unreadVisitorMessages,
        messageCount: sorted.length
      };
    })
    .filter((session): session is LiveChatSessionSummary => Boolean(session))
    .sort((a, b) => {
      const priorityDifference = priorityWeight[a.priority] - priorityWeight[b.priority];
      if (priorityDifference) return priorityDifference;
      return b.lastMessageAt.localeCompare(a.lastMessageAt);
    })
    .slice(0, 80);
}

export async function appendLiveChatMessage({
  sessionId = "site-visitor",
  role = "visitor",
  author,
  body,
  priority = "normal"
}: {
  sessionId?: string;
  role?: LiveChatRole;
  author?: string;
  body: string;
  priority?: LiveChatMessage["priority"];
}) {
  const messages = (await readJson<LiveChatMessage[]>(CHAT_STORE, CHAT_KEY)) ?? [];
  const message: LiveChatMessage = {
    id: crypto.randomUUID(),
    sessionId,
    role,
    author: author?.trim() || (role === "agent" ? "Studio support" : role === "system" ? "TechChimps" : "Website visitor"),
    body: body.trim(),
    createdAt: new Date().toISOString(),
    priority
  };

  await writeJson(CHAT_STORE, CHAT_KEY, [...messages, message].slice(-500));
  return message;
}

export async function deleteLiveChatSessions(sessionIds: string[]) {
  const sessionSet = new Set(sessionIds);
  if (!sessionSet.size) return 0;

  const messages = (await readJson<LiveChatMessage[]>(CHAT_STORE, CHAT_KEY)) ?? [];
  const nextMessages = messages.filter((message) => !sessionSet.has(message.sessionId));
  await writeJson(CHAT_STORE, CHAT_KEY, nextMessages);
  return messages.length - nextMessages.length;
}
