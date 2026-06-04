import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerdictBadge } from "@/components/verdict-badge";
import { ProofShowcase } from "@/components/landing/proof-showcase";
import { WALRUS } from "@/lib/constants";

// A real sealed proof (testnet); the showcase + secondary CTA route to it,
// where the hash is re-checked in-browser against its on-chain anchor.
const SAMPLE_BLOB = "7CCNsFeVc4rA_babdC_f0cBjl7-dg5uk1A2_PbaDNS0";
const PROOF_URL = `/p/${SAMPLE_BLOB}`;
const AGG_HOST = new URL(WALRUS.testnet.aggregator).host;

export default function Home() {
  return (
    <div>
      {/* ───────────────────── Hero (aurora) ───────────────────── */}
      <section className="troof-aurora troof-aurora--breathe relative isolate overflow-hidden">
        <div className="mx-auto flex min-h-[86svh] max-w-3xl flex-col items-center justify-center px-6 pb-20 pt-28 text-center sm:px-8 lg:max-w-4xl lg:pb-28 lg:pt-36">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-xs font-medium tracking-wide text-muted-foreground backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
            </span>
            <span className="font-mono">Verifiable AI terminal for Sui</span>
          </span>

          <h1 className="mt-7 text-balance text-[2.75rem] font-semibold leading-[1.03] tracking-tight text-foreground sm:text-6xl lg:text-7xl lg:leading-[0.98] lg:tracking-[-0.03em]">
            Ask anything on Sui.
            <span className="block text-muted-foreground">
              Get an answer you can prove.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Paste any Sui wallet or token. The AI reads it live and gives you a
            straight, graded answer, then seals it to Walrus and anchors it on
            Sui, so anyone can re-check it in their own browser. Lana, plus you
            can prove it.
          </p>

          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="font-medium shadow-[0_8px_30px_-12px_oklch(1_0_0/0.25)] transition-shadow hover:shadow-[0_0_0_1px_oklch(1_0_0/0.2),0_10px_36px_-12px_oklch(1_0_0/0.35)]"
            >
              <Link href="/analyze">
                Open the terminal <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-card/40 font-medium backdrop-blur-sm"
            >
              <Link href={PROOF_URL}>See a live proof</Link>
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-xs text-muted-foreground/80">
            <span>Sealed to Walrus</span>
            <span className="text-border">/</span>
            <span>SHA-256 anchored on Sui</span>
            <span className="text-border">/</span>
            <span>Re-checked in your browser</span>
            <span className="text-border">/</span>
            <span>No server in the verify path</span>
          </div>
        </div>
      </section>

      {/* ───────────────────── What you can do ───────────────────── */}
      <section className="border-t border-border/80">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Three things, paste and go.
            </h2>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
            <Cando label="Read a wallet">
              An integrity-checked report. USD value counts only canonical SUI,
              so fake-SUI tokens cannot inflate the number.
            </Cando>
            <Cando
              label="Grade a token"
              chip={
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-verified/40 bg-verified-muted text-xs font-semibold text-verified">
                  A
                </span>
              }
            >
              A Troof Score, an A to F trust grade from live on-chain signals.
              Tokens faking the SUI symbol get flagged on sight.
            </Cando>
            <Cando label="Seal the answer">
              Turn any answer into a proof anyone can verify, anywhere. One
              click.
            </Cando>
          </div>
        </div>
      </section>

      {/* ───────────────────── How it works ───────────────────── */}
      <section className="border-t border-border/80 bg-card/20">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Paste, read, seal, verify.
            </h2>
            <p className="mt-3 text-muted-foreground">
              An answer on a screen is just pixels. Troof turns it into something
              anyone can independently re-check.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-4">
            <Step
              n="01"
              title="Paste"
              body="Drop in a Sui wallet, a token, or a proof link."
            />
            <Step
              n="02"
              title="Read"
              body="The AI reads it live through Tatum, Sui RPC plus the Tatum MCP server."
            />
            <Step
              n="03"
              title="Seal"
              body="One click seals the answer and its evidence to Walrus and anchors the SHA-256 on Sui."
            />
            <Step
              n="04"
              title="Verify"
              body="Anyone opens the link. Their browser re-fetches, re-hashes, and shows the verdict."
            />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <VerdictBadge status="verified" size="sm" showSub={false} />
            <span>if untouched</span>
            <span className="text-border">·</span>
            <span className="font-mono text-xs">no Troof server in the verify path</span>
          </div>
        </div>
      </section>

      {/* ───────────────────── Proof + Score showcase ───────────────────── */}
      <section className="border-t border-border/80">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              This is a real proof. Open it yourself.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Change one byte and the verdict flips. That is the whole idea.
            </p>
          </div>

          <div className="mt-10">
            <ProofShowcase
              blobId={SAMPLE_BLOB}
              proofUrl={PROOF_URL}
              aggregatorHost={AGG_HOST}
            />
          </div>
        </div>
      </section>

      {/* ───────────────────── Why it is different ───────────────────── */}
      <section className="border-t border-border/80 bg-card/20">
        <div className="mx-auto max-w-3xl px-5 py-24 text-center sm:py-28">
          <h2 className="text-balance text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
            Lana and Orb show you the chain.
            <span className="block text-muted-foreground">
              Troof lets you prove the answer.
            </span>
          </h2>
          <p className="mt-5 font-mono text-sm text-muted-foreground/70">
            an AI explorer for Sui, plus the one thing none of them have
          </p>
        </div>
      </section>

      {/* ───────────────────── Final CTA (aurora reprise) ───────────────────── */}
      <section
        className="troof-aurora relative isolate overflow-hidden border-t border-border/80"
        style={{ "--aurora-strength": "0.5" } as React.CSSProperties}
      >
        <div className="mx-auto max-w-6xl px-5 py-24 text-center sm:py-28">
          <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-4xl">
            Stop trusting the answer. Verify it.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Read a wallet, grade a token, seal the proof. It is free to try.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="font-medium">
              <Link href="/analyze">
                Open the terminal <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Cando({
  label,
  chip,
  children,
}: {
  label: string;
  chip?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card/40 p-6 transition-colors hover:bg-card/70">
      <div className="flex items-center justify-between gap-3">
        <span className="artifact text-xs uppercase tracking-wider text-foreground">
          {label}
        </span>
        {chip}
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="relative rounded-xl border border-border bg-card/40 p-6 transition-colors hover:bg-card/70">
      <span className="artifact text-xs text-muted-foreground/70">{n}</span>
      <h3 className="mt-3 text-lg font-medium tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
