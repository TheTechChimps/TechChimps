import { NextResponse } from "next/server";
import { finalAcceptanceStatements, getPublicFinalSignoff, signFinalAcceptance } from "@/lib/final-signoffs";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  const signoff = await getPublicFinalSignoff(token);

  if (!signoff) {
    return NextResponse.json({ error: "This acceptance link is not available." }, { status: 404 });
  }

  return NextResponse.json({
    statements: finalAcceptanceStatements,
    signoff
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;
  const payload = (await request.json().catch(() => ({}))) as {
    agreed?: boolean;
    signatureDataUrl?: string;
    signerEmail?: string;
    signerName?: string;
  };

  if (!payload.agreed) {
    return NextResponse.json({ error: "Please confirm the final acceptance statement." }, { status: 400 });
  }

  if (!payload.signerName?.trim() || !payload.signerEmail?.trim()) {
    return NextResponse.json({ error: "Name and email are required before signing." }, { status: 400 });
  }

  try {
    const signed = await signFinalAcceptance({
      signatureDataUrl: payload.signatureDataUrl ?? "",
      signerEmail: payload.signerEmail,
      signerName: payload.signerName,
      token,
      userAgent: request.headers.get("user-agent") ?? undefined
    });

    return NextResponse.json({
      signedAt: signed.signedAt,
      status: signed.status
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Final acceptance could not be signed." }, { status: 400 });
  }
}
