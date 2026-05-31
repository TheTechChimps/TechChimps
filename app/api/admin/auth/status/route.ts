import { NextResponse } from "next/server";
import { getAdminSessionForRequest } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = getAdminSessionForRequest(request);
  return NextResponse.json({
    authenticated: Boolean(user && !user.passwordChangeRequired),
    passwordChangeRequired: Boolean(user?.passwordChangeRequired),
    user
  });
}
