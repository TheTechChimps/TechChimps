import { NextResponse } from "next/server";
import {
  CUSTOMER_SESSION_COOKIE,
  clearCustomerSession,
  createCustomerSession,
  getCustomerFromSessionToken
} from "@/lib/accounts";

export function getCustomerSessionToken(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = cookieHeader.split(";").map((value) => value.trim());
  const match = cookies.find((value) => value.startsWith(`${CUSTOMER_SESSION_COOKIE}=`));
  return match ? decodeURIComponent(match.slice(CUSTOMER_SESSION_COOKIE.length + 1)) : null;
}

export async function getCustomerSession(request: Request) {
  return getCustomerFromSessionToken(getCustomerSessionToken(request));
}

export async function attachCustomerSession(response: NextResponse, userId: string) {
  const { token, session } = await createCustomerSession(userId);

  response.cookies.set(CUSTOMER_SESSION_COOKIE, token, {
    expires: new Date(session.expiresAt),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });

  return response;
}

export async function clearCustomerSessionCookie(request: Request, response: NextResponse) {
  await clearCustomerSession(getCustomerSessionToken(request));

  response.cookies.set(CUSTOMER_SESSION_COOKIE, "", {
    expires: new Date(0),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });

  return response;
}
