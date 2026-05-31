import { NextResponse } from "next/server";
import { createAdminSessionToken, getAdminSessionForRequest, setAdminSessionCookie, verifyAdminCredentials } from "@/lib/admin-session";
import { isValidNewAdminPassword, setStoredAdminPassword, verifyStoredAdminPassword } from "@/lib/admin-password";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = getAdminSessionForRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as {
    currentPassword?: string;
    password?: string;
  };
  const nextPassword = payload.password?.trim() ?? "";

  if (!isValidNewAdminPassword(nextPassword)) {
    return NextResponse.json(
      { error: "Choose a stronger password that is at least 8 characters and not the temporary password." },
      { status: 400 }
    );
  }

  if (!user.passwordChangeRequired) {
    const currentPassword = payload.currentPassword ?? "";
    const currentPasswordMatchesStored = await verifyStoredAdminPassword(currentPassword);
    const currentPasswordMatchesEnv = Boolean(
      verifyAdminCredentials({
        email: user.email,
        password: currentPassword
      })
    );

    if (!currentPasswordMatchesStored && !currentPasswordMatchesEnv) {
      return NextResponse.json({ error: "Current admin password is incorrect." }, { status: 401 });
    }
  }

  await setStoredAdminPassword(nextPassword);
  const sessionUser = {
    email: user.email,
    name: user.name,
    role: user.role
  };
  const token = createAdminSessionToken(sessionUser);
  return setAdminSessionCookie(NextResponse.json({ ok: true, user: sessionUser }), token);
}
