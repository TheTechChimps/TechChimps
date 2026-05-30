import { NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export async function POST() {
  return clearAdminSessionCookie(NextResponse.json({ ok: true }));
}
