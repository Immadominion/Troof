"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Copy,
  Check,
  ExternalLink,
  ShieldQuestion,
  Database,
  Coins,
  Image as ImageIcon,
  Activity as ActivityIcon,
  Lock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { NETWORKS } from "@/lib/constants";
import { formatUsd, shortAddress, shortHash } from "@/lib/format";
import type { ProofBundle } from "@/lib/types";

function Copyable({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1200);
      }}
      className={cn("group inline-flex items-center gap-1.5 text-left hover:text-foreground", className)}
      title="Copy"
    >
      {children}
      {done ? (
        <Check className="h-3 w-3 text-verified" />
      ) : (
        <Copy className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
      )}
    </button>
  );
}

function resolveImg(url: string): string {
  if (url.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${url.slice(7)}`;
  return url;
}

export function ReportView({ bundle, hideSeal }: { bundle: ProofBundle; hideSeal?: boolean }) {
  const { report, contentHash } = bundle;
  const net = NETWORKS[report.network];
  const okCalls = report.evidence.toolCalls.filter((t) => t.ok).length;
  const router = useRouter();
  const [sealing, setSealing] = useState(false);

  async function seal() {
    setSealing(true);
    const t = toast.loading("Sealing on Walrus + anchoring on Sui…");
    try {
      const res = await fetch("/api/seal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ network: report.network, address: report.wallet }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? `Seal failed (HTTP ${res.status})`);
      toast.success("Sealed. Opening your proof…", { id: t });
      router.push(`/p/${j.blobId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Seal failed", { id: t });
      setSealing(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      {/* Header */}
      <div className="flex flex-col gap-5 rounded-xl border border-border bg-card/40 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-border px-2 py-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
              {net.label}
            </span>
            {report.suiNs && <span className="text-sm font-medium">{report.suiNs}</span>}
          </div>
          <Copyable value={report.wallet} className="artifact mt-2 text-sm text-foreground/90">
            {shortAddress(report.wallet)}
          </Copyable>
          <p className="mt-3 text-xs text-muted-foreground">
            snapshotted at checkpoint{" "}
            <span className="artifact text-foreground/80">{report.checkpoint ?? "—"}</span> · gas{" "}
            <span className="artifact text-foreground/80">{report.gasPrice ?? "—"}</span>
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="tabnum text-3xl font-semibold tracking-tight">
            {formatUsd(report.totals.usd)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            <span className="tabnum">{report.totals.coinTypes}</span> coins ·{" "}
            <span className="tabnum">{report.totals.nfts}</span> NFTs
          </div>
        </div>
      </div>

      {/* Seal CTA */}
      {!hideSeal && (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-xl border border-border bg-card/40 p-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            This report is live data. Seal it to get a permanent, verifiable proof.
          </div>
          <Button onClick={seal} disabled={sealing}>
            {sealing && <Loader2 className="h-4 w-4 animate-spin" />}
            {sealing ? "Sealing…" : "Seal this proof on Walrus"}
          </Button>
        </div>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {/* Balances */}
        <Section icon={Coins} title="Balances" count={report.balances.length}>
          {report.balances.length === 0 ? (
            <Empty>No coins held.</Empty>
          ) : (
            <ul className="divide-y divide-border/60">
              {report.balances.map((b) => (
                <li key={b.coinType} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{b.symbol}</div>
                    <div className="artifact truncate text-[11px] text-muted-foreground">
                      {shortAddress(b.coinType)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="tabnum text-sm">
                      {b.ui.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </div>
                    <div className="tabnum text-[11px] text-muted-foreground">
                      {b.usd != null ? formatUsd(b.usd) : "—"}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* NFTs */}
        <Section icon={ImageIcon} title="NFTs" count={report.nfts.length}>
          {report.nfts.length === 0 ? (
            <Empty>No NFTs with media found.</Empty>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {report.nfts.map((n) => (
                <a
                  key={n.objectId}
                  href={`${net.explorerObject}${n.objectId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted/40"
                  title={n.name ?? n.objectId}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveImg(n.imageUrl!)}
                    alt={n.name ?? "NFT"}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => ((e.currentTarget.style.opacity = "0"))}
                  />
                </a>
              ))}
            </div>
          )}
        </Section>

        {/* Activity */}
        <Section icon={ActivityIcon} title="Recent activity" count={report.activity.length}>
          {report.activity.length === 0 ? (
            <Empty>No recent transactions.</Empty>
          ) : (
            <ul className="divide-y divide-border/60">
              {report.activity.map((a) => (
                <li key={a.digest} className="flex items-center justify-between gap-3 py-2.5">
                  <a
                    href={`${net.explorerTx}${a.digest}`}
                    target="_blank"
                    rel="noreferrer"
                    className="artifact inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {shortHash(a.digest)} <ExternalLink className="h-3 w-3" />
                  </a>
                  <span className="text-[11px] text-muted-foreground">
                    {a.timestampMs ? new Date(a.timestampMs).toLocaleDateString() : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Staking / Risk */}
        <Section icon={ShieldQuestion} title="Staking & flags" count={report.stakes.length + report.riskFlags.length}>
          {report.stakes.length === 0 && report.riskFlags.length === 0 ? (
            <Empty>No stakes or flags.</Empty>
          ) : (
            <div className="space-y-3">
              {report.stakes.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="artifact text-xs text-muted-foreground">{shortAddress(s.validator)}</span>
                  <span className="tabnum">{s.ui.toLocaleString(undefined, { maximumFractionDigits: 2 })} SUI</span>
                </div>
              ))}
              {report.riskFlags.map((f, i) => (
                <div key={i} className="rounded-lg border border-border bg-muted/30 p-2.5 text-xs">
                  <span className="font-medium text-foreground">{f.kind}</span>{" "}
                  <span className="text-muted-foreground">— {f.detail}</span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Evidence — the Tatum depth, on display */}
      <div className="mt-4 rounded-xl border border-border bg-card/40 p-6">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Database className="h-4 w-4" /> How this was built
          <span className="ml-auto text-xs text-muted-foreground">
            <span className="tabnum text-verified">{okCalls}</span>/{report.evidence.toolCalls.length} calls ok
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Every datapoint above came from these calls through{" "}
          <span className="artifact">{new URL(report.evidence.tatumGateway).host}</span>.
        </p>
        <div className="mt-4 grid gap-1.5 sm:grid-cols-2">
          {report.evidence.toolCalls.map((t, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <Check className={cn("h-3 w-3", t.ok ? "text-verified" : "text-muted-foreground/40")} />
              <span className="artifact truncate text-muted-foreground">{t.method}</span>
              <span className="ml-auto tabnum text-muted-foreground/60">{t.ms}ms</span>
            </div>
          ))}
        </div>
        <Separator className="my-4" />
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">content hash (sha-256)</span>
          <Copyable value={contentHash} className="artifact text-xs text-foreground/80">
            {contentHash}
          </Copyable>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: React.ElementType;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-5">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4 text-muted-foreground" /> {title}
        <span className="ml-auto tabnum text-xs text-muted-foreground">{count}</span>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-4 text-center text-xs text-muted-foreground">{children}</p>;
}
