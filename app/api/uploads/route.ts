import { NextResponse } from "next/server";
import { saveUploadedFiles } from "@/lib/uploads";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return NextResponse.json({ error: "Upload form data is required." }, { status: 400 });
  }

  const batchId = String(formData.get("batchId") ?? "");
  const files = formData.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);

  if (!files.length) {
    return NextResponse.json({ files: [] });
  }

  try {
    return NextResponse.json({ files: await saveUploadedFiles(batchId, files) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Files could not be uploaded." }, { status: 400 });
  }
}
