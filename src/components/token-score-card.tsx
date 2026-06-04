import { cn } from "@/lib/utils";
import { ShieldCheck, Minus } from "lucide-react";
import { shortAddress } from "@/lib/format";
import type { TokenReport } from "@/lib/types";

function gradeClasses(grade: string) {
  if (grade === "A") return "border-verified/40 bg-verified-muted text-verified";
  if (grade === "F") return "border-tampered/40 bg-tampered-muted text-tampered";
  return "border-border bg-muted/40 text-foreground";
}

/** The Troof Score card, a transparent, RPC-grounded trust grade for a Sui coin. */
export function TokenScoreCard({ report }: { report: TokenReport }) {
  const s = report.score;
  const penalties = s.lineItems.filter((l) => l.penalty < 0);
  const passed = s.lineItems.filter((l) => l.penalty === 0);

  return (
    <div className="rounded-xl border border-border bg-card/40 p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-medium">{report.name}</span>
            <span className="artifact text-xs text-muted-foreground">{report.symbol}</span>
            {report.canonical && (
              <span className="inline-flex items-center gap-1 rounded-full border border-verified/30 bg-verified-muted px-2 py-0.5 text-[10px] font-medium text-verified">
                <ShieldCheck className="h-3 w-3" /> canonical
              </span>
            )}
          </div>
          <div className="artifact mt-1 truncate text-[11px] text-muted-foreground">
            {shortAddress(report.coinType)}
          </div>
        </div>
        {/* Grade badge */}
        <div className={cn("shrink-0 rounded-lg border px-3 py-2 text-center", gradeClasses(s.grade))}>
          <div className="text-2xl font-semibold leading-none tabular-nums">{s.grade}</div>
          <div className="mt-1 text-[10px] uppercase tracking-wider opacity-80">
            score <span className="tabular-nums">{s.score}</span>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="mt-4 grid grid-cols-3 gap-3 border-y border-border/60 py-3 text-center">
        <Stat label="supply" value={report.totalSupplyUi != null ? report.totalSupplyUi.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "-"} />
        <Stat label="age" value={report.ageDays != null ? `${Math.round(report.ageDays)}d` : "-"} />
        <Stat label="metadata" value={report.metadataMutable == null ? "-" : report.metadataMutable ? "mutable" : "frozen"} />
      </div>

      {/* Score breakdown, every line cites the raw on-chain field */}
      <div className="mt-4 space-y-1.5">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">how this grade was computed</div>
        {[...penalties, ...passed].map((l, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className={cn("artifact w-8 shrink-0 tabular-nums", l.penalty < 0 ? "text-foreground" : "text-muted-foreground/50")}>
              {l.penalty < 0 ? l.penalty : "0"}
            </span>
            <span className="text-muted-foreground">
              <span className="text-foreground/80">{l.pillar}</span>, {l.detail}{" "}
              <span className="artifact opacity-50">[{l.field}]</span>
            </span>
          </div>
        ))}
      </div>

      {/* Honest unverifiable signals */}
      <div className="mt-4 rounded-lg border border-dashed border-border/70 p-2.5">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          <Minus className="h-3 w-3" /> not verifiable via RPC
        </div>
        <ul className="mt-1.5 space-y-0.5">
          {s.unverifiable.map((u, i) => (
            <li key={i} className="text-[11px] text-muted-foreground/80">{u}</li>
          ))}
        </ul>
      </div>

      <div className="mt-3 text-[10px] text-muted-foreground/60">rubric {s.rubricVersion}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="tabnum text-sm font-medium">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
