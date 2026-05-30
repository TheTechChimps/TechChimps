import { adminUnauthorized, isAdminRequestAuthenticated } from "@/lib/admin-session";
import { createBackupSnapshot } from "@/lib/backups";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminRequestAuthenticated(request)) return adminUnauthorized();

  const snapshot = await createBackupSnapshot();
  const timestamp = snapshot.generatedAt.replace(/[:.]/g, "-");

  return new Response(JSON.stringify(snapshot, null, 2), {
    headers: {
      "Content-Disposition": `attachment; filename="techchimps-backup-${timestamp}.json"`,
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}
