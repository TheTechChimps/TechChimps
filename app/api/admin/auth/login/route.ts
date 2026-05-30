import { NextResponse } from "next/server";
import { createAdminSessionToken, isAdminConfigured, setAdminSessionCookie, verifyAdminCredentials } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as { email?: string; password?: string };

  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Admin login is not configured yet." }, { status: 503 });
  }

  const user = verifyAdminCredentials({
    email: payload.email,
    password: payload.password ?? ""
  });

  if (!user) {
    return NextResponse.json({ error: "Admin login details are incorrect." }, { status: 401 });
  }

  const token = createAdminSessionToken(user);
  return setAdminSessionCookie(NextResponse.json({ ok: true, user }), token);
}
