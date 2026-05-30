import { runSelfHealingSweep } from "@/lib/automation";
import { createBackupSnapshot } from "@/lib/backups";
import { readJson, writeJson } from "@/lib/storage";

export type DailyMaintenanceRecord = {
  id: string;
  backup: {
    counts: Awaited<ReturnType<typeof createBackupSnapshot>>["counts"];
    generatedAt: string;
    storageMode: string;
  };
  finishedAt: string;
  selfHealing: Awaited<ReturnType<typeof runSelfHealingSweep>>;
  source: "admin" | "cron";
  startedAt: string;
  status: "ok";
};

const MAINTENANCE_STORE = "techchimps-maintenance";
const BACKUP_STORE = "techchimps-backup-snapshots";

export async function getDailyMaintenanceStatus() {
  const [latest, history] = await Promise.all([
    readJson<DailyMaintenanceRecord>(MAINTENANCE_STORE, "latest"),
    readJson<DailyMaintenanceRecord[]>(MAINTENANCE_STORE, "history")
  ]);

  return {
    history: history ?? [],
    latest
  };
}

export async function runDailyMaintenance(source: DailyMaintenanceRecord["source"]) {
  const startedAt = new Date().toISOString();
  const selfHealing = await runSelfHealingSweep();
  const snapshot = await createBackupSnapshot();
  const previousSnapshot = await readJson<unknown>(BACKUP_STORE, "latest");

  if (previousSnapshot) {
    await writeJson(BACKUP_STORE, "previous", previousSnapshot);
  }

  await writeJson(BACKUP_STORE, "latest", snapshot);

  const record: DailyMaintenanceRecord = {
    id: crypto.randomUUID(),
    backup: {
      counts: snapshot.counts,
      generatedAt: snapshot.generatedAt,
      storageMode: snapshot.storageMode
    },
    finishedAt: new Date().toISOString(),
    selfHealing,
    source,
    startedAt,
    status: "ok"
  };
  const history = ((await readJson<DailyMaintenanceRecord[]>(MAINTENANCE_STORE, "history")) ?? []).filter(
    (item) => item.id !== record.id
  );

  await Promise.all([
    writeJson(MAINTENANCE_STORE, "latest", record),
    writeJson(MAINTENANCE_STORE, "history", [record, ...history].slice(0, 14))
  ]);

  return record;
}
