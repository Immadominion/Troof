import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  CircleSlash,
  ExternalLink,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { shortAddress, shortHash, formatUsd } from "@/lib/format";
import { NETWORKS } from "@/lib/constants";
import type { TransactionReport } from "@/lib/types";

function fmtAmount(ui: number): string {
  const abs = Math.abs(ui);
  const digits = abs >= 1 ? 4 : 6;
  const s = abs.toLocaleString(undefined, { maximumFractionDigits: digits });
  return `${ui < 0 ? "−" : "+"}${s}`;
}

/** Plain-English view of a Sui transaction, grounded in Tatum RPC. Pure Mono:
 *  +/− and status use neutral tones — saturated green/red stay sacred to verdicts. */
export function TransactionCard({ report: r }: { report: TransactionReport }) {
  const net = NETWORKS[r.network] ?? NETWORKS.mainnet;
  const ts = r.timestampMs ? new Date(r.timestampMs).toLocaleString() : null;
  const moved = r.balanceChanges.filter((b) => b.ui !== 0);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-medium">Transaction</span>
            <span className="text-xs text-muted-foreground">{r.kind}</span>
          </div>
          <a
            href={`${net.explorerTx}${r.digest}`}
            target="_blank"
            rel="noreferrer"
            className="artifact mt-1 inline-flex items-center gap-1 truncate text-[11px] text-muted-foreground hover:text-foreground"
          >
            {shortHash(r.digest)} <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium",
            r.status === "success"
              ? "border-border bg-muted/40 text-foreground/80"
              : "border-foreground/20 bg-muted/40 text-foreground",
          )}
        >
          {r.status === "success" ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <CircleSlash className="h-3.5 w-3.5" />
          )}
          {r.status}
        </span>
      </div>

      {/* What moved */}
      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">what moved</div>
        {moved.length === 0 ? (
          <p className="mt-1.5 text-xs text-muted-foreground">No token balance changes.</p>
        ) : (
          <ul className="mt-1.5 space-y-1.5">
            {moved.slice(0, 6).map((b, i) => (
              <li key={i} className="flex items-center justify-between gap-3 text-sm">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  {b.ui < 0 ? (
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDownLeft className="h-3.5 w-3.5" />
                  )}
                  <span className="artifact text-foreground/80">{b.owner ? shortAddress(b.owner) : "—"}</span>
                </span>
                <span className="text-right">
                  <span className="tabnum font-medium text-foreground">
                    {fmtAmount(b.ui)} {b.symbol}
                  </span>
                  {b.usd != null && (
                    <span className="ml-1.5 text-xs text-muted-foreground">({formatUsd(b.usd)})</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-3 border-y border-border/60 py-3 text-center">
        <Stat label="gas" value={`${r.gas.netSui.toLocaleString(undefined, { maximumFractionDigits: 5 })} SUI`} />
        <Stat label="events" value={String(r.eventCount)} />
        <Stat
          label="objects"
          value={`${r.objectSummary.created}c · ${r.objectSummary.mutated}m`}
        />
      </div>

      {/* Contracts called */}
      {r.moveCalls.length > 0 && (
        <div className="mt-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">contracts called</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {r.moveCalls.slice(0, 6).map((m, i) => (
              <a
                key={i}
                href={`${net.explorerObject}${m.package}`}
                target="_blank"
                rel="noreferrer"
                className="artifact rounded-md border border-border bg-muted/40 px-2 py-1 text-[11px] text-foreground/80 hover:text-foreground"
                title={`${m.package}::${m.module}::${m.function}`}
              >
                {m.module}::{m.function}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Risk flags (honest, neutral — not the sacred red) */}
      {r.riskFlags.length > 0 && (
        <div className="mt-4 rounded-lg border border-dashed border-border/70 p-2.5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            <TriangleAlert className="h-3 w-3" /> flags
          </div>
          <ul className="mt-1.5 space-y-0.5">
            {r.riskFlags.map((f, i) => (
              <li key={i} className="text-[11px] text-foreground/80">{f.detail}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground/70">
        {r.sender && (
          <span className="inline-flex items-center gap-1">
            from{" "}
            <a
              href={`${net.explorerAccount}${r.sender}`}
              target="_blank"
              rel="noreferrer"
              className="artifact hover:text-foreground"
            >
              {shortAddress(r.sender)}
            </a>
          </span>
        )}
        {ts && <span>· {ts}</span>}
        <span>· {net.label}</span>
      </div>
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
