import { NextResponse } from "next/server";
import { adminUnauthorized, isAdminRequestAuthenticated } from "@/lib/admin-session";
import { getQaCleanupCandidates, runQaCleanup, summarizeQaCleanup } from "@/lib/qa-cleanup";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminRequestAuthenticated(request)) return adminUnauthorized();

  const candidates = await getQaCleanupCandidates();
  return NextResponse.json({
    candidates: {
      customers: candidates.customers.map((customer) => customer.email),
      liveChatSessionIds: candidates.liveChatSessionIds,
      references: candidates.references
    },
    counts: summarizeQaCleanup(candidates)
  });
}

export async function POST(request: Request) {
  if (!isAdminRequestAuthenticated(request)) return adminUnauthorized();

  const payload = (await request.json().catch(() => null)) as { confirm?: string } | null;
  if (payload?.confirm !== "DELETE_QA_DATA") {
    return NextResponse.json({ error: "Confirmation phrase is required." }, { status: 400 });
  }

  const deleted = await runQaCleanup();
  return NextResponse.json({ deleted, ok: true });
}
