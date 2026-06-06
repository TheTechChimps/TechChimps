import { NextResponse } from "next/server";
import { adminUnauthorized, isAdminRequestAuthenticated } from "@/lib/admin-session";
import { createAndSendPreview, previewDashboard } from "@/lib/previews";

export const dynamic = "force-dynamic";

function requestOrigin(request: Request) {
  return process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
}

export async function GET(request: Request) {
  if (!isAdminRequestAuthenticated(request)) return adminUnauthorized();

  return NextResponse.json(await previewDashboard(requestOrigin(request)));
}

export async function POST(request: Request) {
  if (!isAdminRequestAuthenticated(request)) return adminUnauthorized();

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Preview form data is required." }, { status: 400 });
  }

  const reference = String(formData.get("reference") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const externalUrl = String(formData.get("externalUrl") ?? "").trim();
  const fileValue = formData.get("file");
  const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : undefined;

  if (!reference) {
    return NextResponse.json({ error: "Choose an order first." }, { status: 400 });
  }

  try {
    const result = await createAndSendPreview({
      externalUrl,
      file,
      note,
      origin: requestOrigin(request),
      reference,
      title
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Preview could not be created." }, { status: 400 });
  }
}
