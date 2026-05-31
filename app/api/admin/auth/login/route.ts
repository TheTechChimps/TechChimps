import { NextResponse } from "next/server";
import { createAdminSessionToken, isAdminConfigured, setAdminSessionCookie, verifyAdminCredentials } from "@/lib/admin-session";
import { getStoredAdminPassword, getTemporaryAdminPassword, verifyStoredAdminPassword } from "@/lib/admin-password";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as { email?: string; password?: string };
  const password = payload.password ?? "";

  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Admin login is not configured yet." }, { status: 503 });
  }

  const normalizedEmail = payload.email?.trim().toLowerCase();
  const fallbackUser = verifyAdminCredentials({
    email: payload.email,
    password: process.env.ADMIN_PASSWORD ?? ""
  });
  const fallbackEmailMatches = Boolean(normalizedEmail && fallbackUser?.email === normalizedEmail);
  const storedAdminPassword = await getStoredAdminPassword();
  if (fallbackUser && fallbackEmailMatches && storedAdminPassword && (await verifyStoredAdminPassword(password))) {
    const token = createAdminSessionToken(fallbackUser);
    return setAdminSessionCookie(NextResponse.json({ ok: true, user: fallbackUser }), token);
  }

  if (fallbackUser && fallbackEmailMatches && !storedAdminPassword && password === getTemporaryAdminPassword()) {
    const temporaryUser = {
      ...fallbackUser,
      passwordChangeRequired: true
    };
    const token = createAdminSessionToken(temporaryUser);
    return setAdminSessionCookie(
      NextResponse.json({
        ok: true,
        requiresPasswordChange: true,
        user: temporaryUser
      }),
      token
    );
  }

  const user = verifyAdminCredentials({
    email: payload.email,
    password
  });

  if (!user) {
    return NextResponse.json({ error: "Admin login details are incorrect." }, { status: 401 });
  }

  const token = createAdminSessionToken(user);
  return setAdminSessionCookie(NextResponse.json({ ok: true, user }), token);
}
