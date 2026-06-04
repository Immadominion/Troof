"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import {
  ArrowUp, Wrench, ShieldCheck, Loader2, Wallet, Coins, ShieldAlert,
  HelpCircle, Zap, Sparkles, ThumbsUp, ThumbsDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { TokenScoreCard } from "@/components/token-score-card";
import { Onboarding } from "@/components/onboarding";
import { FeedbackDialog, sendFeedback } from "@/components/feedback-dialog";
import { cn } from "@/lib/utils";
import type { TokenReport } from "@/lib/types";

const FAKE_SUI = "0xb0436f8d8f4700b4aec5f94b45cfaa9029b0e37ab5d09544de420850878e4ad5::sui::SUI";
const DEMO_WALLET = "0xffd4f043057226453aeba59732d41c6093516f54823ebc3a16d17f8a77d2f0ad";
const FREE_ANALYSES = Number(process.env.NEXT_PUBLIC_FREE_ANALYSES ?? 5);

const TILES = [
  { icon: ShieldAlert, label: "Spot a fake SUI", prompt: `Analyze the token ${FAKE_SUI} on mainnet and seal its Troof Score.` },
  { icon: Coins, label: "Score the real SUI", prompt: "Analyze the token 0x2::sui::SUI on mainnet and seal its Troof Score." },
  { icon: Wallet, label: "Explain a wallet", prompt: `Analyze ${DEMO_WALLET} on mainnet and seal a proof.` },
];

type AnyPart = { type: string; toolName?: string; state?: string; output?: unknown; text?: string };
const toolName = (p: AnyPart) => (p.type === "dynamic-tool" ? p.toolName ?? "tool" : p.type.replace("tool-", ""));
function proofUrlFrom(p: AnyPart): string | null {
  const n = toolName(p);
  if ((n === "seal_wallet_proof" || n === "seal_token_proof") && p.state === "output-available") {
    return (p.output as { proofUrl?: string })?.proofUrl ?? null;
  }
  return null;
}

export default function AnalyzePage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"fast" | "thinking">("fast");
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/agent" }),
  });
  const busy = status === "submitted" || status === "streaming";

  const [help, setHelp] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [uses, setUses] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("troof_onboarded")) setHelp(true);
    setUses(Number(localStorage.getItem("troof_uses") ?? 0));
  }, []);
  function closeHelp(o: boolean) {
    setHelp(o);
    if (!o && typeof window !== "undefined") localStorage.setItem("troof_onboarded", "1");
  }

  function submit(text: string) {
    if (!text.trim() || busy) return;
    if (uses >= FREE_ANALYSES) {
      setGateOpen(true);
      return;
    }
    const next = uses + 1;
    setUses(next);
    if (typeof window !== "undefined") localStorage.setItem("troof_uses", String(next));
    sendMessage({ text }, { body: { mode } });
    setInput("");
  }
  function tryDemo() {
    closeHelp(false);
    submit(TILES[0].prompt);
  }
  function continuePreview() {
    setUses(0);
    if (typeof window !== "undefined") localStorage.setItem("troof_uses", "0");
    setGateOpen(false);
  }
  async function rate(rating: "up" | "down") {
    await sendFeedback({ rating, mode });
    toast.success("Thanks for the signal.");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-3xl flex-col px-5">
      <Onboarding open={help} onOpenChange={closeHelp} onTry={tryDemo} />
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      <PremiumGate open={gateOpen} onOpenChange={setGateOpen} onContinue={continuePreview} onFeedback={() => { setGateOpen(false); setFeedbackOpen(true); }} />

      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">The verifiable terminal for Sui</h1>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Paste any wallet or token. The agent reads it live through Tatum, grades it, and seals a
            proof anyone can re-check.
          </p>
          <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
            {TILES.map((t) => (
              <button key={t.label} onClick={() => submit(t.prompt)}
                className="flex items-center gap-3 rounded-lg border border-border bg-card/40 px-4 py-3 text-left text-sm transition-colors hover:bg-card/70">
                <t.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                {t.label}
              </button>
            ))}
            <Link href="/verify" className="flex items-center gap-3 rounded-lg border border-border bg-card/40 px-4 py-3 text-left text-sm transition-colors hover:bg-card/70">
              <ShieldCheck className="h-4 w-4 shrink-0 text-verified" />
              Verify a proof
            </Link>
          </div>
          <button onClick={() => setHelp(true)} className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <HelpCircle className="h-3.5 w-3.5" /> How it works
          </button>
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

      {/* Composer */}
      <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pb-3 pt-3">
        <form onSubmit={(e) => { e.preventDefault(); submit(input); }}>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card/60 p-2 backdrop-blur">
            <button
              type="button"
              onClick={() => setMode((x) => (x === "fast" ? "thinking" : "fast"))}
              title="Fast = Haiku · Thinking = Sonnet (deeper reasoning)"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {mode === "fast" ? <Zap className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5 text-brand" />}
              {mode === "fast" ? "Fast" : "Thinking"}
            </button>
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste a Sui wallet or token… or ask a question"
              className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0" disabled={busy} />
            <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={busy || !input.trim()}>
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </form>
        {/* Disclaimer · powered-by · feedback */}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px] text-muted-foreground">
          <span>Troof can make mistakes — double-check responses.</span>
          <span className="opacity-30">·</span>
          <span className="artifact opacity-80">Powered by Tatum</span>
          <span className="opacity-30">·</span>
          <button onClick={() => setFeedbackOpen(true)} className="hover:text-foreground">Feedback</button>
          {FREE_ANALYSES > 0 && (
            <>
              <span className="opacity-30">·</span>
              <span className="tabnum">{Math.max(0, FREE_ANALYSES - uses)} free left</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PremiumGate({
  open, onOpenChange, onContinue, onFeedback,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; onContinue: () => void; onFeedback: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>You&apos;ve used your free analyses</DialogTitle>
          <DialogDescription>
            Troof Premium — unlimited analyses + sealed proofs — unlocks by connecting a Sui wallet
            (pay-per-use, coming next). For now you can keep exploring in preview.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={onFeedback}>Tell us you want this</Button>
          <Button onClick={onContinue}>Continue (preview)</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
