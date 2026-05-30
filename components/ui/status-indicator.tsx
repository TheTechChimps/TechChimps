import { cn } from "@/lib/utils";

export function StatusIndicator({
  label,
  tone = "good"
}: {
  label: string;
  tone?: "good" | "active" | "warning";
}) {
  return <span className={cn("status", `status-${tone}`)}>{label}</span>;
}
