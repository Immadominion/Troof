"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Streamdown } from "streamdown";
import { ArrowUp, Wrench, ShieldCheck, Loader2, Wallet, Coins, ShieldAlert, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TokenScoreCard } from "@/components/token-score-card";
import { Onboarding } from "@/components/onboarding";
import { cn } from "@/lib/utils";
import type { TokenReport } from "@/lib/types";

const FAKE_SUI = "0xb0436f8d8f4700b4aec5f94b45cfaa9029b0e37ab5d09544de420850878e4ad5::sui::SUI";
const DEMO_WALLET = "0xffd4f043057226453aeba59732d41c6093516f54823ebc3a16d17f8a77d2f0ad";

const TILES = [
  { icon: ShieldAlert, label: "Spot a fake SUI", prompt: `Analyze the token ${FAKE_SUI} on mainnet and seal its Troof Score.` },
  { icon: Coins, label: "Score the real SUI", prompt: "Analyze the token 0x2::sui::SUI on mainnet and seal its Troof Score." },
  { icon: Wallet, label: "Explain a wallet", prompt: `Analyze ${DEMO_WALLET} on mainnet and seal a proof.` },
];

type AnyPart = { type: string; toolName?: string; state?: string; output?: unknown; text?: string };

function toolName(p: AnyPart) {
  return p.type === "dynamic-tool" ? p.toolName ?? "tool" : p.type.replace("tool-", "");
}
function proofUrlFrom(p: AnyPart): string | null {
  const name = toolName(p);
  if ((name === "seal_wallet_proof" || name === "seal_token_proof") && p.state === "output-available") {
    return (p.output as { proofUrl?: string })?.proofUrl ?? null;
  }
  return null;
}

export default function AnalyzePage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/agent" }),
  });
  const busy = status === "submitted" || status === "streaming";

  const [help, setHelp] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("troof_onboarded")) setHelp(true);
  }, []);
  function closeHelp(o: boolean) {
    setHelp(o);
    if (!o && typeof window !== "undefined") localStorage.setItem("troof_onboarded", "1");
  }

  function submit(text: string) {
    if (!text.trim() || busy) return;
    sendMessage({ text });
    setInput("");
  }

  function tryDemo() {
    closeHelp(false);
    submit(TILES[0].prompt);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-3xl flex-col px-5">
      <Onboarding open={help} onOpenChange={closeHelp} onTry={tryDemo} />
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            The verifiable terminal for Sui
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Paste any wallet or token. The agent reads it live through Tatum, grades it, and seals a
            proof anyone can re-check.
          </p>
          <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
            {TILES.map((t) => (
              <button
                key={t.label}
                onClick={() => submit(t.prompt)}
                className="flex items-center gap-3 rounded-lg border border-border bg-card/40 px-4 py-3 text-left text-sm transition-colors hover:bg-card/70"
              >
                <t.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                {t.label}
              </button>
            ))}
            <Link
              href="/verify"
              className="flex items-center gap-3 rounded-lg border border-border bg-card/40 px-4 py-3 text-left text-sm transition-colors hover:bg-card/70"
            >
              <ShieldCheck className="h-4 w-4 shrink-0 text-verified" />
              Verify a proof
            </Link>
          </div>
          <button
            onClick={() => setHelp(true)}
            className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <HelpCircle className="h-3.5 w-3.5" /> How it works
          </button>
        </div>
      ) : (
        <div className="flex-1 space-y-6 py-8">
          {messages.map((m) => (
            <div key={m.id} className={cn(m.role === "user" && "flex justify-end")}>
              <div
                className={cn(
                  "max-w-[90%] space-y-3 text-sm leading-relaxed",
                  m.role === "user" &&
                    "rounded-2xl rounded-br-sm bg-secondary px-4 py-2.5 text-secondary-foreground",
                )}
              >
                {(m.parts as AnyPart[]).map((part, i) => {
                  if (part.type === "text") {
                    return m.role === "user" ? (
                      <p key={i} className="whitespace-pre-wrap">{part.text}</p>
                    ) : (
                      <Streamdown key={i} className="md text-foreground/90">
                        {part.text ?? ""}
                      </Streamdown>
                    );
                  }
                  const name = toolName(part);
                  const proofUrl = proofUrlFrom(part);
                  if (proofUrl) {
                    return (
                      <Link
                        key={i}
                        href={proofUrl}
                        className="inline-flex items-center gap-2 rounded-lg border border-verified/30 bg-verified-muted px-4 py-2.5 text-sm font-medium text-verified"
                      >
                        <ShieldCheck className="h-4 w-4" /> View the sealed proof →
                      </Link>
                    );
                  }
                  if (name === "analyze_token" && part.state === "output-available" && part.output) {
                    return <TokenScoreCard key={i} report={part.output as TokenReport} />;
                  }
                  if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Wrench className="h-3 w-3" />
                        <span className="artifact">{name}</span>
                        {part.state !== "output-available" && <Loader2 className="h-3 w-3 animate-spin" />}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> thinking…
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-border bg-card/40 p-3 text-xs text-muted-foreground">
              {error.message || "Something went wrong."}
            </div>
          )}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pb-5 pt-3"
      >
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card/60 p-2 backdrop-blur">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste a Sui wallet or token… or ask a question"
            className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0"
            disabled={busy}
          />
          <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={busy || !input.trim()}>
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
