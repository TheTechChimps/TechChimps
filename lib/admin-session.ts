import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "techchimps_admin_session";

const SESSION_SECONDS = 60 * 60 * 24 * 7;

export type AdminRole = "owner" | "support" | "viewer";

export type AdminSessionUser = {
  email: string;
  name: string;
  passwordChangeRequired?: boolean;
  role: AdminRole;
};

type AdminUserConfig = AdminSessionUser & {
  password: string;
};

type AdminPayload = {
  email: string;
  exp: number;
  iat: number;
  name: string;
  passwordChangeRequired?: boolean;
  role: AdminRole | "admin";
};

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD ?? "";
}

function getSigningSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || process.env.STRIPE_WEBHOOK_SECRET || "";
}

function base64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function sign(value: string) {
  const secret = getSigningSecret();
  if (!secret) return "";
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function readCookie(cookieHeader: string, name: string) {
  const cookies = cookieHeader.split(";").map((value) => value.trim());
  const match = cookies.find((value) => value.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : "";
}

export function isAdminConfigured() {
  return Boolean(getConfiguredAdminUsers().length && getSigningSecret());
}

function normalizeAdminRole(role?: string): AdminRole {
  return role === "support" || role === "viewer" || role === "owner" ? role : "owner";
}

function parseAdminUsersJson() {
  const raw = process.env.ADMIN_USERS_JSON;
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Partial<AdminUserConfig>[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((user): AdminUserConfig | null => {
        const email = user.email?.trim().toLowerCase();
        const password = user.password?.trim();
        if (!email || !password) return null;

        return {
          email,
          name: user.name?.trim() || email.split("@")[0] || "Admin",
          password,
          role: normalizeAdminRole(user.role)
        };
      })
      .filter((user): user is AdminUserConfig => Boolean(user));
  } catch {
    return [];
  }
}

function getConfiguredAdminUsers() {
  const jsonUsers = parseAdminUsersJson();
  if (jsonUsers.length) return jsonUsers;

  const password = getAdminPassword();
  if (!password) return [];

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() || "admin@techchimps.com";
  return [
    {
      email,
      name: process.env.ADMIN_NAME?.trim() || "TechChimps Admin",
      password,
      role: "owner" as const
    }
  ];
}

export function adminLoginRequiresEmail() {
  return parseAdminUsersJson().length > 1;
}

export function getConfiguredAdminSummary() {
  return getConfiguredAdminUsers().map(({ email, name, role }) => ({ email, name, role }));
}

export function createAdminSessionToken(user?: AdminSessionUser) {
  if (!isAdminConfigured()) return "";
  const fallbackUser = getConfiguredAdminUsers()[0];
  const sessionUser = user ?? fallbackUser;
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = base64Url(
    JSON.stringify({
      email: sessionUser.email,
      exp: issuedAt + SESSION_SECONDS,
      iat: issuedAt,
      name: sessionUser.name,
      passwordChangeRequired: sessionUser.passwordChangeRequired,
      role: sessionUser.role
    } satisfies AdminPayload)
  );
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminCredentials({
  email,
  password
}: {
  email?: string;
  password: string;
}): AdminSessionUser | null {
  if (!password) return null;

  const normalizedEmail = email?.trim().toLowerCase();
  const users = getConfiguredAdminUsers();
  const candidate =
    normalizedEmail && users.some((user) => user.email === normalizedEmail)
      ? users.find((user) => user.email === normalizedEmail)
      : users.length === 1
        ? users[0]
        : null;

  if (!candidate || !candidate.password) return null;
  if (!safeEqual(password, candidate.password)) return null;

  return {
    email: candidate.email,
    name: candidate.name,
    role: candidate.role
  };
}

export function verifyAdminPassword(password: string) {
  return Boolean(verifyAdminCredentials({ password }));
}

export function getAdminSessionFromToken(token?: string | null): AdminSessionUser | null {
  if (!token || !isAdminConfigured()) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminPayload;
    if (parsed.exp <= Math.floor(Date.now() / 1000)) return null;

    return {
      email: parsed.email || "admin@techchimps.com",
      name: parsed.name || "TechChimps Admin",
      passwordChangeRequired: Boolean(parsed.passwordChangeRequired),
      role: parsed.role === "admin" ? "owner" : normalizeAdminRole(parsed.role)
    };
  } catch {
    return null;
  }
}

export function verifyAdminSessionToken(token?: string | null) {
  const user = getAdminSessionFromToken(token);
  return Boolean(user && !user.passwordChangeRequired);
}

export function getAdminSessionForRequest(request: Request) {
  return getAdminSessionFromToken(readCookie(request.headers.get("cookie") ?? "", ADMIN_SESSION_COOKIE));
}

export function isAdminRequestAuthenticated(request: Request) {
  const user = getAdminSessionForRequest(request);
  return Boolean(user && !user.passwordChangeRequired);
}

export function isAdminCookieAuthenticated(cookieValue?: string) {
  return verifyAdminSessionToken(cookieValue);
}

export function setAdminSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    maxAge: SESSION_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
  return response;
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    expires: new Date(0),
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
  return response;
}

export function adminUnauthorized() {
  return NextResponse.json({ error: "Admin login required." }, { status: 401 });
}
