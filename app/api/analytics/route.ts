import { NextResponse } from "next/server";
import { recordPageView } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as {
    path?: string;
    referrer?: string;
  };

  await recordPageView({
    path: payload.path ?? "/",
    referrer: payload.referrer,
    userAgent: request.headers.get("user-agent") ?? undefined
  });

  return NextResponse.json({ ok: true });
}
