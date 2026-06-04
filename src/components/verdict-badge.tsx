import { cn } from "@/lib/utils";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";

export type Verdict = "verified" | "tampered" | "pending";

const CONFIG = {
  verified: {
    label: "Verified",
    sub: "untampered",
    icon: ShieldCheck,
    cls: "border-verified/30 bg-verified-muted text-verified",
    dot: "bg-verified",
  },
  tampered: {
    label: "Tampered",
    sub: "hash mismatch",
    icon: ShieldAlert,
    cls: "border-tampered/40 bg-tampered-muted text-tampered",
    dot: "bg-tampered",
  },
  pending: {
    label: "Verifying",
    sub: "re-fetching",
    icon: Loader2,
    cls: "border-border bg-muted/50 text-muted-foreground",
    dot: "bg-muted-foreground",
  },
} as const;

/** The sacred verdict badge, the only saturated color in the product. */
export function VerdictBadge({
  status,
  size = "md",
  showSub = true,
  className,
}: {
  status: Verdict;
  size?: "sm" | "md" | "lg";
  showSub?: boolean;
  className?: string;
}) {
  const c = CONFIG[status];
  const Icon = c.icon;
  const sizes = {
    sm: "gap-1.5 px-2.5 py-1 text-xs",
    md: "gap-2 px-3 py-1.5 text-sm",
    lg: "gap-2.5 px-4 py-2 text-base",
  };
  const iconSize = { sm: "h-3.5 w-3.5", md: "h-4 w-4", lg: "h-5 w-5" };

  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center rounded-full border font-medium tabular-nums",
        sizes[size],
        c.cls,
        className,
      )}
    >
      <Icon className={cn(iconSize[size], status === "pending" && "animate-spin")} />
      <span className="tracking-tight">{c.label}</span>
      {showSub && (
        <span className="opacity-60 font-mono text-[0.85em]">· {c.sub}</span>
      )}
    </span>
  );
}
