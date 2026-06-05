"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import { useCurrentAccount, useSignAndExecuteTransaction, ConnectModal } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import {
  ArrowUp, Wrench, ShieldCheck, Loader2, Wallet, Coins, ShieldAlert,
  HelpCircle, Zap, Sparkles, ThumbsUp, ThumbsDown, Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { TokenScoreCard } from "@/components/token-score-card";
import { TransactionCard } from "@/components/transaction-card";
import { FeedbackDialog, sendFeedback } from "@/components/feedback-dialog";
import { useTypingPlaceholder } from "@/lib/use-typing-placeholder";
import { startTour } from "@/lib/tour";
import { useProofHistory, addProof, safeProofHref } from "@/lib/proof-history";
import { cn } from "@/lib/utils";
import type { TokenReport, TransactionReport } from "@/lib/types";

const FAKE_SUI = "0xb0436f8d8f4700b4aec5f94b45cfaa9029b0e37ab5d09544de420850878e4ad5::sui::SUI";
const DEMO_WALLET = "0xffd4f043057226453aeba59732d41c6093516f54823ebc3a16d17f8a77d2f0ad";
const DEMO_TX = "DZfCuQKR6pxYnPJuyjYQfrqDwFttX8knA45rw6RMLpBP";
const FREE_ANALYSES = Number(process.env.NEXT_PUBLIC_FREE_ANALYSES ?? 5);
const TREASURY = process.env.NEXT_PUBLIC_TROOF_TREASURY;
const PRICE_SUI = Number(process.env.NEXT_PUBLIC_PRICE_SUI ?? "0.1");
const PRICE_MIST = Math.round(PRICE_SUI * 1e9);
const CREDITS_PER_PURCHASE = 20;

const PLACEHOLDERS = [
  "Paste a Sui wallet address…",
  "Paste a transaction digest to explain it…",
  "Paste a token to grade it…",
  "Paste a proof link to verify…",
  "Ask: is this token a fake SUI?",
];

const TILES = [
  { icon: Receipt, label: "Explain a transaction", prompt: `Explain transaction ${DEMO_TX} on mainnet.` },
  { icon: Wallet, label: "Explain a wallet", prompt: `Analyze ${DEMO_WALLET} on mainnet.` },
  { icon: ShieldAlert, label: "Spot a fake SUI", prompt: `Analyze the token ${FAKE_SUI} on mainnet and seal its Troof Score.` },
  { icon: Coins, label: "Score the real SUI", prompt: "Analyze the token 0x2::sui::SUI on mainnet." },
];

type AnyPart = { type: string; toolName?: string; state?: string; output?: unknown; text?: string };
const toolName = (p: AnyPart) => (p.type === "dynamic-tool" ? p.toolName ?? "tool" : p.type.replace("tool-", ""));
function proofUrlFrom(p: AnyPart): string | null {
  const n = toolName(p);
  if (
    (n === "seal_wallet_proof" || n === "seal_token_proof" || n === "seal_transaction_proof") &&
    p.state === "output-available"
  ) {
    return (p.output as { proofUrl?: string })?.proofUrl ?? null;
  }
  return null;
}
// One box does both: a proof link / blob id routes to verify; everything else goes to the agent.
function detectProof(text: string): string | null {
  const s = text.trim();
  const m = s.match(/\/p\/([A-Za-z0-9_-]{20,})/);
  if (m) return m[1];
  // A bare Walrus blob id routes to verify, but require a base64url marker (- or _) so a
  // base58 transaction digest falls through to the agent (which explains it) instead.
  if (!s.startsWith("0x") && /[-_]/.test(s) && /^[A-Za-z0-9_-]{30,}$/.test(s)) return s;
  return null;
}

export default function AnalyzePage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"fast" | "thinking">("fast");
  const placeholder = useTypingPlaceholder(PLACEHOLDERS);
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/agent" }),
  });
  const busy = status === "submitted" || status === "streaming";

  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const recentProofs = useProofHistory(account?.address);

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [uses, setUses] = useState(0);
  const [credits, setCredits] = useState(0);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setUses(Number(localStorage.getItem("troof_uses") ?? 0));
    setCredits(Number(localStorage.getItem("troof_credits") ?? 0));
    if (!localStorage.getItem("troof_onboarded")) {
      localStorage.setItem("troof_onboarded", "1");
      setTimeout(() => startTour(), 700); // let the page mount before highlighting
    }
  }, []);
  useEffect(() => {
    if (account) setGateOpen(false);
  }, [account]);
  // Save every sealed proof to the local "Your proofs" history (idempotent by blobId).
  useEffect(() => {
    for (const m of messages) {
      if (m.role !== "assistant") continue;
      for (const p of m.parts as AnyPart[]) {
        const n = toolName(p);
        if (
          (n === "seal_wallet_proof" || n === "seal_token_proof" || n === "seal_transaction_proof") &&
          p.state === "output-available" && p.output
        ) {
          const o = p.output as {
            blobId?: string; proofUrl?: string; kind?: string;
            subject?: string; headline?: string; network?: string;
          };
          if (o.blobId && o.proofUrl) {
            addProof(
              {
                blobId: o.blobId,
                proofUrl: o.proofUrl,
                kind: o.kind === "token" || o.kind === "transaction" ? o.kind : "wallet",
                subject: o.subject ?? "",
                headline: o.headline,
                network: o.network,
                ts: Date.now(),
              },
              account?.address,
            );
          }
        }
      }
    }
  }, [messages, account?.address]);

  function gateState(): "ok" | "connect" | "pay" {
    if (account) {
      if (!TREASURY) return "ok";
      return credits > 0 ? "ok" : "pay";
    }
    return uses < FREE_ANALYSES ? "ok" : "connect";
  }

  function submit(text: string) {
    if (!text.trim() || busy) return;
    const proof = detectProof(text);
    if (proof) {
      setInput("");
      router.push(`/p/${proof}`); // verify is free, no gate
      return;
    }
    if (gateState() !== "ok") {
      setGateOpen(true);
      return;
    }
    if (!account) {
      const n = uses + 1;
      setUses(n);
      localStorage.setItem("troof_uses", String(n));
    } else if (TREASURY) {
      const c = credits - 1;
      setCredits(c);
      localStorage.setItem("troof_credits", String(c));
    }
    sendMessage({ text }, { body: { mode } });
    setInput("");
  }
  function continuePreview() {
    setUses(0);
    localStorage.setItem("troof_uses", "0");
    setGateOpen(false);
  }
  async function buyCredits() {
    if (!account || !TREASURY) return;
    setPaying(true);
    try {
      const tx = new Transaction();
      const [coin] = tx.splitCoins(tx.gas, [PRICE_MIST]);
      tx.transferObjects([coin], TREASURY);
      await signAndExecute({ transaction: tx });
      const c = credits + CREDITS_PER_PURCHASE;
      setCredits(c);
      localStorage.setItem("troof_credits", String(c));
      setGateOpen(false);
      toast.success(`Unlocked ${CREDITS_PER_PURCHASE} analyses.`);
    } catch {
      toast.error("Payment cancelled or failed.");
    } finally {
      setPaying(false);
    }
  }
  async function rate(rating: "up" | "down") {
    await sendFeedback({ rating, mode });
    toast.success("Thanks for the signal.");
  }

  const usage =
    account && !TREASURY ? "wallet connected"
      : account && TREASURY ? `${credits} credits`
        : `${Math.max(0, FREE_ANALYSES - uses)} free left`;

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 pt-20 sm:pt-24">
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      <PremiumGate
        open={gateOpen} onOpenChange={setGateOpen} connected={!!account} canPay={!!TREASURY}
        priceSui={PRICE_SUI} paying={paying} onBuy={buyCredits} onContinue={continuePreview}
        onFeedback={() => { setGateOpen(false); setFeedbackOpen(true); }}
      />

      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">The AI explorer for Sui</h1>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Paste any wallet, token, or transaction. The agent reads it live through Tatum and explains
            it in plain English, and you can seal any answer into a proof anyone can re-check.
          </p>
          <div id="tour-tiles" className="mt-8 grid w-full gap-2 sm:grid-cols-2">
            {TILES.map((t) => (
              <button key={t.label} onClick={() => submit(t.prompt)}
                className="flex items-center gap-3 rounded-lg border border-border bg-card/40 px-4 py-3 text-left text-sm transition-colors hover:bg-card/70">
                <t.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                {t.label}
              </button>
            ))}
            <button onClick={() => setInput("troof.site/p/")}
              className="flex items-center gap-3 rounded-lg border border-border bg-card/40 px-4 py-3 text-left text-sm transition-colors hover:bg-card/70">
              <ShieldCheck className="h-4 w-4 shrink-0 text-verified" />
              Verify a proof
            </button>
          </div>
          <button onClick={startTour} className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <HelpCircle className="h-3.5 w-3.5" /> How it works
          </button>

          {recentProofs.length > 0 && (
            <div className="mt-10 w-full max-w-md text-left">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Your recent proofs</span>
                <Link href="/proofs" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                  View all →
                </Link>
              </div>
              <ul className="space-y-1.5">
                {recentProofs.slice(0, 3).map((p) => (
                  <li key={p.blobId}>
                    <Link href={safeProofHref(p.proofUrl)} className="flex items-center gap-2 rounded-lg border border-border bg-card/40 px-3 py-2 text-left text-xs transition-colors hover:bg-card/70">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate text-foreground/80">{p.headline || p.subject}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 space-y-6 py-8">
          {messages.map((m) => (
            <div key={m.id} className={cn(m.role === "user" && "flex justify-end")}>
              <div className={cn("max-w-[90%] space-y-3 text-sm leading-relaxed",
                m.role === "user" && "rounded-2xl rounded-br-sm bg-secondary px-4 py-2.5 text-secondary-foreground")}>
                {(m.parts as AnyPart[]).map((part, i) => {
                  if (part.type === "text") {
                    return m.role === "user" ? (
                      <p key={i} className="whitespace-pre-wrap">{part.text}</p>
                    ) : (
                      <Streamdown key={i} className="md text-foreground/90">{part.text ?? ""}</Streamdown>
                    );
                  }
                  const n = toolName(part);
                  const proofUrl = proofUrlFrom(part);
                  if (proofUrl) {
                    return (
                      <Link key={i} href={proofUrl} className="inline-flex items-center gap-2 rounded-lg border border-verified/30 bg-verified-muted px-4 py-2.5 text-sm font-medium text-verified">
                        <ShieldCheck className="h-4 w-4" /> View the sealed proof →
                      </Link>
                    );
                  }
                  if (n === "analyze_token" && part.state === "output-available" && part.output) {
                    return <TokenScoreCard key={i} report={part.output as TokenReport} />;
                  }
                  if (n === "analyze_transaction" && part.state === "output-available" && part.output) {
                    return <TransactionCard key={i} report={part.output as TransactionReport} />;
                  }
                  if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Wrench className="h-3 w-3" /> <span className="artifact">{n}</span>
                        {part.state !== "output-available" && <Loader2 className="h-3 w-3 animate-spin" />}
                      </div>
                    );
                  }
                  return null;
                })}
                {m.role === "assistant" && !busy && (
                  <div className="flex items-center gap-1 pt-1 opacity-50 transition-opacity hover:opacity-100">
                    <button onClick={() => rate("up")} aria-label="Helpful" className="rounded p-1 hover:bg-muted"><ThumbsUp className="h-3 w-3" /></button>
                    <button onClick={() => rate("down")} aria-label="Not helpful" className="rounded p-1 hover:bg-muted"><ThumbsDown className="h-3 w-3" /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {busy && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> thinking…</div>}
          {error && <div className="rounded-lg border border-border bg-card/40 p-3 text-xs text-muted-foreground">{error.message || "Something went wrong."}</div>}
        </div>
      )}

      <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pb-3 pt-3">
        <form onSubmit={(e) => { e.preventDefault(); submit(input); }}>
          <div id="tour-composer" className="flex items-center gap-2 rounded-xl border border-border bg-card/60 p-2 backdrop-blur">
            <button id="tour-mode" type="button" onClick={() => setMode((x) => (x === "fast" ? "thinking" : "fast"))}
              title="Fast = Haiku · Thinking = Sonnet (deeper reasoning)"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
              {mode === "fast" ? <Zap className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5 text-brand" />}
              {mode === "fast" ? "Fast" : "Thinking"}
            </button>
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholder}
              className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0" disabled={busy} />
            <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={busy || !input.trim()}>
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </form>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px] text-muted-foreground">
          <span>Troof can make mistakes, double-check responses.</span>
          <span className="opacity-30">·</span>
          <span className="artifact opacity-80">Powered by Tatum</span>
          <span className="opacity-30">·</span>
          <button onClick={() => setFeedbackOpen(true)} className="hover:text-foreground">Feedback</button>
          <span className="opacity-30">·</span>
          <span className="tabnum">{usage}</span>
        </div>
      </div>
    </div>
  );
}

function PremiumGate({
  open, onOpenChange, connected, canPay, priceSui, paying, onBuy, onContinue, onFeedback,
}: {
  open: boolean; onOpenChange: (o: boolean) => void;
  connected: boolean; canPay: boolean; priceSui: number; paying: boolean;
  onBuy: () => void; onContinue: () => void; onFeedback: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{connected ? "Out of analyses" : "You've used your free analyses"}</DialogTitle>
          <DialogDescription>
            {connected
              ? `Top up to keep analyzing and sealing proofs.${canPay ? "" : " (Charging isn't enabled on this deployment.)"}`
              : "Connect a Sui wallet to keep using Troof. The free verify endpoint stays open to everyone."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          {!connected ? (
            <>
              <Button variant="ghost" onClick={onContinue}>Continue (preview)</Button>
              <ConnectModal trigger={<Button>Connect wallet</Button>} />
            </>
          ) : canPay ? (
            <>
              <Button variant="ghost" onClick={onFeedback}>Feedback</Button>
              <Button onClick={onBuy} disabled={paying}>
                {paying ? "Confirm in wallet…" : `Unlock 20 analyses · ${priceSui} SUI`}
              </Button>
            </>
          ) : (
            <Button onClick={onContinue}>Continue (preview)</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
