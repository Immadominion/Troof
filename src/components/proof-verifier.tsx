"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ExternalLink, TriangleAlert, Zap, RotateCcw, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VerdictBadge, type Verdict } from "@/components/verdict-badge";
import { ReportView } from "@/components/report-view";
import { TokenScoreCard } from "@/components/token-score-card";
import { hashCanonical } from "@/lib/canonical";
import { walrusBlobUrl, DEFAULT_NETWORK, NETWORKS } from "@/lib/constants";
import { shortAddress, shortHash } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SealedProof, WalletReport, TokenReport } from "@/lib/types";

interface Loaded {
  sealed: SealedProof;
  onChainHash: string | null;
}

async function loadProof(blobId: string): Promise<Loaded> {
  // Re-fetch from a PUBLIC Walrus aggregator — no server of ours in this path.
  const res = await fetch(walrusBlobUrl(DEFAULT_NETWORK, blobId), { cache: "no-store" });
  if (!res.ok) throw new Error(`Blob not found on the public aggregator (HTTP ${res.status}).`);
  let sealed: SealedProof;
  try {
    sealed = JSON.parse(await res.text());
  } catch {
    throw new Error("This blob isn't a Troof proof.");
  }
  if (sealed.schema !== "troof.proof/v1") throw new Error("Unrecognized proof format.");

  // Read the anchored hash from the on-chain Record (via the Tatum RPC proxy).
  let onChainHash: string | null = null;
  try {
    const r = await fetch(`/api/rpc?network=${sealed.anchor.anchorNetwork}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "sui_getObject",
        params: [sealed.anchor.recordId, { showContent: true }],
      }),
    });
    const j = await r.json();
    const fields = j?.result?.data?.content?.fields;
    onChainHash = fields?.content_hash ?? null;
  } catch {
    /* leave null → shows as unverifiable */
  }
  return { sealed, onChainHash };
}

function tamperReport(report: SealedProof["report"]): SealedProof["report"] {
  if ("totals" in report) return { ...report, totals: { ...report.totals, usd: report.totals.usd + 1 } };
  return { ...report, score: { ...report.score, score: report.score.score + 1 } };
}

export function ProofVerifier({ blobId }: { blobId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["proof", blobId],
    queryFn: () => loadProof(blobId),
    retry: 0,
    staleTime: Infinity,
  });

  const [tampered, setTampered] = useState(false);
  const [recomputed, setRecomputed] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    const report = tampered ? tamperReport(data.sealed.report) : data.sealed.report;
    hashCanonical(report).then(setRecomputed);
  }, [data, tampered]);

  const status: Verdict = useMemo(() => {
    if (!data || recomputed == null) return "pending";
    const okSelf = recomputed === data.sealed.contentHash;
    const okChain = data.onChainHash != null && recomputed === data.onChainHash;
    return okSelf && okChain ? "verified" : "tampered";
  }, [data, recomputed]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-16">
        <div className="flex items-center gap-3">
          <VerdictBadge status="pending" />
          <span className="text-muted-foreground">Re-fetching from a public Walrus aggregator…</span>
        </div>
        <Skeleton className="mt-8 h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <TriangleAlert className="mx-auto h-7 w-7 text-muted-foreground" />
        <h1 className="mt-5 text-xl font-semibold tracking-tight">Couldn&apos;t load this proof</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Unknown error."}
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/verify">Verify another</Link>
        </Button>
      </div>
    );
  }

  const { sealed, onChainHash } = data;
  const anchorNet = NETWORKS[sealed.anchor.anchorNetwork];

  return (
    <div>
      {/* Verdict banner */}
      <div
        className={cn(
          "border-b",
          status === "verified" && "border-verified/20 bg-verified-muted",
          status === "tampered" && "border-tampered/20 bg-tampered-muted",
          status === "pending" && "border-border",
        )}
      >
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <VerdictBadge status={status} size="lg" showSub={false} />
            <p className="mt-3 max-w-lg text-sm text-muted-foreground">
              {status === "verified" &&
                "Re-fetched from a public Walrus aggregator and re-hashed in your browser — it matches the hash anchored on Sui. This report is exactly as sealed."}
              {status === "tampered" &&
                "The re-computed hash does NOT match the hash anchored on Sui. These bytes are not the sealed report."}
            </p>
          </div>
          {/* Tamper demo */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTampered((t) => !t)}
            className="shrink-0"
          >
            {tampered ? <RotateCcw className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
            {tampered ? "Restore original" : "Simulate tampering"}
          </Button>
        </div>
      </div>

      {/* Hash comparison + anchor */}
      <div className="mx-auto max-w-4xl px-5 pt-8">
        <div className="rounded-xl border border-border bg-card/40 p-6">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Lock className="h-4 w-4" /> Integrity check
          </div>
          <dl className="mt-4 space-y-2.5 text-xs">
            <HashRow label="re-hashed in browser" value={recomputed} />
            <HashRow label="anchored on sui" value={onChainHash} />
            <HashRow label="sealed in blob" value={sealed.contentHash} />
          </dl>
          <div className="mt-5 grid gap-2 border-t border-border/60 pt-4 text-xs sm:grid-cols-3">
            <Anchor label="on-chain record" href={`${anchorNet.explorerObject}${sealed.anchor.recordId}`} value={shortAddress(sealed.anchor.recordId)} />
            <Anchor label="anchor tx" href={`${anchorNet.explorerTx}${sealed.anchor.txDigest}`} value={shortHash(sealed.anchor.txDigest)} />
            <Anchor label="raw blob" href={walrusBlobUrl(DEFAULT_NETWORK, blobId)} value={shortHash(blobId)} />
          </div>
        </div>
      </div>

      {/* The report itself — wallet report or token Troof Score */}
      {sealed.kind === "token" ? (
        <div className="mx-auto max-w-3xl px-5 py-10">
          <TokenScoreCard report={sealed.report as TokenReport} />
        </div>
      ) : (
        <ReportView
          bundle={{ report: sealed.report as WalletReport, contentHash: sealed.contentHash }}
          hideSeal
        />
      )}
    </div>
  );
}

function HashRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="artifact text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="artifact truncate text-foreground/80">{value ?? "—"}</dd>
    </div>
  );
}

function Anchor({ label, href, value }: { label: string; href: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <a href={href} target="_blank" rel="noreferrer" className="artifact inline-flex items-center gap-1 text-foreground/80 hover:text-foreground">
        {value} <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
