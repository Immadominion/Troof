"use client";

import { useState } from "react";
import { ScanSearch, Gauge, Lock, ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: ScanSearch,
    title: "Ask about any Sui wallet or token",
    body: "Paste a 0x address or a coin type into the chat. An AI agent reads it live through Tatum's Sui RPC and MCP server, no setup.",
  },
  {
    icon: Gauge,
    title: "Get a graded, honest answer",
    body: "Wallets get an integrity-checked report. Tokens get a Troof Score (A–F), and anything faking the SUI symbol is flagged, never trusted by name.",
  },
  {
    icon: Lock,
    title: "Seal it in one click",
    body: "The full answer is written to Walrus (decentralized storage) and its SHA-256 is anchored on Sui. Now it's a permanent artifact, not a chat message.",
  },
  {
    icon: ShieldCheck,
    title: "Anyone can re-check it",
    body: "Open the proof link on any machine, it re-fetches from a public network and re-hashes in your browser. Green = Verified, red = Tampered. No Troof server in the loop.",
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
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  const Icon = s.icon;
  const last = step === STEPS.length - 1;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setStep(0);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">How Troof works</DialogTitle>
          <DialogDescription className="sr-only">A four-step walkthrough.</DialogDescription>
        </DialogHeader>

        {/* Step icon + counter */}
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card/60",
              s.accent && "border-verified/30 bg-verified-muted",
            )}
          >
            <Icon className={cn("h-5 w-5", s.accent ? "text-verified" : "text-foreground")} />
          </div>
          <span className="artifact text-xs text-muted-foreground">
            step {step + 1} / {STEPS.length}
          </span>
        </div>

        {/* Step content */}
        <div className="mt-4 min-h-[7.5rem]">
          <h2 className="text-lg font-semibold tracking-tight">{s.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
        </div>

        {/* Progress dots */}
        <div className="mt-2 flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={`Go to step ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step ? "w-6 bg-foreground" : "w-1.5 bg-border hover:bg-muted-foreground",
              )}
            />
          ))}
        </div>

        {/* Nav */}
        <div className="mt-5 flex items-center justify-between">
          {step > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setStep((x) => x - 1)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Skip
            </Button>
          )}
          {last ? (
            <Button size="sm" onClick={onTry}>
              Try it, spot a fake SUI <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm" onClick={() => setStep((x) => x + 1)}>
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
