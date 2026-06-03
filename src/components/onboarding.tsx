"use client";

import { ScanSearch, Gauge, Lock, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    icon: ScanSearch,
    title: "Ask about any Sui wallet or token",
    body: "Paste a 0x address or a coin type. An AI agent reads it live through Tatum's Sui RPC and MCP server.",
  },
  {
    icon: Gauge,
    title: "Get a graded, honest answer",
    body: "Wallets get an integrity-checked report. Tokens get a Troof Score (A–F) — and anything faking the SUI symbol is flagged, never trusted.",
  },
  {
    icon: Lock,
    title: "Seal it in one click",
    body: "The full answer is written to Walrus (decentralized storage) and its SHA-256 is anchored on Sui.",
  },
  {
    icon: ShieldCheck,
    title: "Anyone can re-check it",
    body: "Open the proof link anywhere — it re-fetches from a public network and re-hashes in your browser. Green = Verified, red = Tampered. No Troof server in the loop.",
    accent: true,
  },
];

export function Onboarding({
  open,
  onOpenChange,
  onTry,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onTry: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl tracking-tight">How Troof works</DialogTitle>
          <DialogDescription>
            The verifiable terminal for Sui — an explorer whose answers you can re-check.
          </DialogDescription>
        </DialogHeader>

        <ol className="mt-2 space-y-4">
          {STEPS.map((s, i) => (
            <li key={i} className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card/60">
                <s.icon className={s.accent ? "h-4 w-4 text-verified" : "h-4 w-4 text-muted-foreground"} />
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="artifact text-[11px] text-muted-foreground/60">{i + 1}</span>
                  <span className="text-sm font-medium">{s.title}</span>
                </div>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <DialogFooter className="mt-2 gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Skip
          </Button>
          <Button onClick={onTry}>Try it — spot a fake SUI →</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
