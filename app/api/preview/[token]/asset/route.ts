import { NextResponse } from "next/server";
import { readPreviewAsset } from "@/lib/previews";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  const asset = await readPreviewAsset(token);

  if (!asset) {
    return NextResponse.json({ error: "Preview asset is not available." }, { status: 404 });
  }

  return new NextResponse(asset.body, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `inline; filename="${asset.name.replaceAll('"', "")}"`,
      "Content-Type": asset.mimeType
    }
  });
}
