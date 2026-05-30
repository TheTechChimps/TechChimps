import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card", className)} {...props} />;
}

export function QuietCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card card-quiet", className)} {...props} />;
}
