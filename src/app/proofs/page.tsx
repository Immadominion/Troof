"use client";

import Link from "next/link";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Wallet, Coins, Receipt, ArrowUpRight, Trash2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProofHistory, clearProofs, type ProofEntry } from "@/lib/proof-history";
import { shortAddress } from "@/lib/format";

const KIND = {
  wallet: { icon: Wallet, label: "Wallet" },
  token: { icon: Coins, label: "Token" },
  transaction: { icon: Receipt, label: "Transaction" },
} as const;

function when(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ProofsPage() {
  const account = useCurrentAccount();
  const proofs = useProofHistory(account?.address);

  return (
    <div className="mx-auto max-w-3xl px-5 pt-24 pb-24 sm:pt-28">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your proofs</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {account
              ? `Sealed while connected as ${shortAddress(account.address)}, kept on this device.`
              : "Every proof you seal is kept here on this device. Connect a wallet for a separate list per wallet."}
          </p>
        </div>
        {proofs.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearProofs(account?.address)}
            className="shrink-0 text-muted-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      {proofs.length === 0 ? (
        <div className="mt-12 rounded-xl border border-dashed border-border bg-card/40 px-6 py-14 text-center">
          <ShieldCheck className="mx-auto h-7 w-7 text-muted-foreground" />
          <p className="mt-4 text-sm font-medium">No sealed proofs yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Ask the terminal about a wallet, token, or transaction and seal the answer, it&apos;ll
            show up here as a proof anyone can re-check.
          </p>
          <Button asChild className="mt-6">
            <Link href="/analyze">Open the terminal</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-8 space-y-2.5">
          {proofs.map((p) => (
            <ProofRow key={p.blobId} entry={p} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ProofRow({ entry }: { entry: ProofEntry }) {
  const k = KIND[entry.kind] ?? KIND.wallet;
  const Icon = k.icon;
  return (
    <li>
      <Link
        href={entry.proofUrl}
        className="group flex items-center gap-4 rounded-xl border border-border bg-card/40 px-4 py-3 transition-colors hover:bg-card/70"
      >
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{k.label}</span>
            <span className="artifact truncate text-[11px] text-muted-foreground">{entry.subject}</span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {entry.headline || "Sealed proof"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-[11px] text-muted-foreground">
          {entry.network && <span className="hidden sm:inline">{entry.network}</span>}
          <span className="tabnum">{when(entry.ts)}</span>
          <ArrowUpRight className="h-4 w-4 opacity-50 transition-opacity group-hover:opacity-100" />
        </div>
      </Link>
    </li>
  );
}
