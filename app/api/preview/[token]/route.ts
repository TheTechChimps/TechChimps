import { NextResponse } from "next/server";
import { getPublicPreview, respondToPreview } from "@/lib/previews";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  const preview = await getPublicPreview(token);

  if (!preview) {
    return NextResponse.json({ error: "This preview link is not available." }, { status: 404 });
  }

  return NextResponse.json({ preview });
}

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;
  const payload = (await request.json().catch(() => ({}))) as {
    action?: "approved" | "changes_requested";
    message?: string;
  };

  if (payload.action !== "approved" && payload.action !== "changes_requested") {
    return NextResponse.json({ error: "Choose approve or request changes." }, { status: 400 });
  }

  try {
    const preview = await respondToPreview({
      action: payload.action,
      message: payload.message,
      token
    });

    return NextResponse.json({
      respondedAt: preview.responseAt,
      status: preview.status
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Preview response could not be saved." }, { status: 400 });
  }
}
