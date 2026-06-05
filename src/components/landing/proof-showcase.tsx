"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, RotateCcw } from "lucide-react";
import { VerdictBadge } from "@/components/verdict-badge";
import { shortHash } from "@/lib/format";

/**
 * Landing showcase: a real sealed proof you can open, plus the Troof Score scale.
 * The tamper toggle is the ONE expressive animation and the ONLY place red appears
 * sitewide. It is honestly labelled "Simulate tampering" (same as the live proof page);
 * the genuine in-browser verification lives at /p/[blobId].
 */
export function ProofShowcase({
  blobId,
  proofUrl,
  aggregatorHost,
}: {
  blobId: string;
  proofUrl: string;
  aggregatorHost: string;
}) {
  const [tampered, setTampered] = useState(false);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr] lg:items-stretch">
      {/* ── A real, openable proof ── */}
      <div className="rounded-2xl border border-border bg-card p-1.5 shadow-xl shadow-foreground/[0.06]">
        <div className="rounded-xl border border-border/60 bg-background p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="artifact text-[11px] uppercase tracking-wider text-muted-foreground">
              troof proof
            </span>
            <VerdictBadge status={tampered ? "tampered" : "verified"} size="sm" />
          </div>

          <dl className="mt-4 space-y-2.5 text-sm">
            <Row label="kind" value="Sui wallet report" />
            <Row label="walrus blob" value={shortHash(blobId)} accent />
            <Row label="source" value={aggregatorHost} />
            <Row label="anchor" value="Sui · SHA-256" />
          </dl>

          <div
            className={`mt-4 border-t border-border/60 pt-3 text-xs transition-colors duration-150 ${
              tampered ? "text-tampered" : "text-muted-foreground"
            }`}
          >
            {tampered
              ? "One byte changed. The hash no longer matches the on-chain anchor."
              : "Re-fetched from a public Walrus aggregator. Hash matches the on-chain anchor."}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTampered((t) => !t)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card/60 px-3 text-xs font-medium text-foreground transition-colors hover:border-foreground/20 hover:bg-card"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {tampered ? "Restore the byte" : "Simulate tampering"}
            </button>
            <Link
              href={proofUrl}
              className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Open the live proof
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── The Troof Score scale ── */}
      <div className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-xl shadow-foreground/[0.06]">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium">Troof Score</span>
          <span className="artifact text-[11px] uppercase tracking-wider text-muted-foreground">
            tokens
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          An A to F trust grade for any Sui token, built from live on-chain signals.
          Tokens faking the SUI symbol get flagged on sight.
        </p>

        <div className="mt-4 flex items-center gap-1.5">
          {(["A", "B", "C", "D", "F"] as const).map((g) => (
            <span
              key={g}
              className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm font-semibold tabular-nums ${
                g === "A"
                  ? "border-verified/40 bg-verified-muted text-verified"
                  : "border-border bg-muted/30 text-muted-foreground"
              }`}
            >
              {g}
            </span>
          ))}
        </div>

        <ul className="mt-5 space-y-2.5 border-t border-border/60 pt-4 text-xs text-muted-foreground">
          <Signal head="Identity" body="Is this the real coin, or a SUI impersonator?" />
          <Signal head="History" body="How long has it existed on-chain?" />
          <Signal head="Supply" body="Fixed and frozen, or quietly mutable?" />
        </ul>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="artifact text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className={`artifact text-[13px] ${accent ? "text-foreground" : "text-foreground/80"}`}>
        {value}
      </dd>
    </div>
  );
}

function Signal({ head, body }: { head: string; body: string }) {
  return (
    <li className="flex gap-2.5">
      <span className="artifact w-16 shrink-0 text-[11px] uppercase tracking-wider text-foreground/70">
        {head}
      </span>
      <span>{body}</span>
    </li>
  );
}
