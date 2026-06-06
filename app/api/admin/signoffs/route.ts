import { NextResponse } from "next/server";
import { adminUnauthorized, isAdminRequestAuthenticated } from "@/lib/admin-session";
import { finalSignoffDashboard, sendFinalSignoffToCustomer } from "@/lib/final-signoffs";

export const dynamic = "force-dynamic";

function requestOrigin(request: Request) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl;
  return new URL(request.url).origin;
}

export async function GET(request: Request) {
  if (!isAdminRequestAuthenticated(request)) return adminUnauthorized();

  return NextResponse.json(await finalSignoffDashboard(requestOrigin(request)));
}

export async function POST(request: Request) {
  if (!isAdminRequestAuthenticated(request)) return adminUnauthorized();

  const payload = (await request.json().catch(() => ({}))) as {
    customMessage?: string;
    forceNew?: boolean;
    reference?: string;
  };

  if (!payload.reference?.trim()) {
    return NextResponse.json({ error: "Choose an order reference first." }, { status: 400 });
  }

  try {
    const result = await sendFinalSignoffToCustomer({
      customMessage: payload.customMessage,
      forceNew: payload.forceNew,
      origin: requestOrigin(request),
      reference: payload.reference.trim()
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create final acceptance." }, { status: 400 });
  }
}
