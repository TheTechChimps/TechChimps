import { NextResponse } from "next/server";
import { adminUnauthorized, isAdminRequestAuthenticated } from "@/lib/admin-session";
import { listBuildPrompts } from "@/lib/build-prompts";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminRequestAuthenticated(request)) return adminUnauthorized();

  const prompts = await listBuildPrompts();
  return NextResponse.json({ prompts: prompts.slice(0, 100) });
}
