import Link from "next/link";
import { ArrowRight, ScanSearch, Database, Link2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerdictBadge } from "@/components/verdict-badge";
import { shortHash } from "@/lib/format";

// A real sealed proof (testnet) — re-hydrates + verifies against its on-chain anchor.
const SAMPLE_BLOB = "7CCNsFeVc4rA_babdC_f0cBjl7-dg5uk1A2_PbaDNS0";

export default function Home() {
  return (
    <div>
      {/* ───────────────────── Hero ───────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="mx-auto max-w-6xl px-5 pb-20 pt-20 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="artifact inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-[11px] uppercase tracking-wider text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
              </span>
              Verifiable AI · Sui · Walrus
            </span>

            <h1 className="mt-7 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              AI you can <span className="text-verified">re-check</span> yourself.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
              Ask an AI to analyze any Sui wallet. Its verdict — and every
              on-chain call behind it — is sealed on Walrus and anchored on Sui.
              Anyone can re-fetch it from a public network and prove it was never
              altered.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="font-medium">
                <Link href="/analyze">
                  Analyze a wallet <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-medium">
                <Link href={`/p/${SAMPLE_BLOB}`}>See a live proof</Link>
              </Button>
            </div>
          </div>

          {/* Proof artifact preview */}
          <div className="mx-auto mt-16 max-w-2xl">
            <div className="rounded-xl border border-border bg-card/60 p-1 shadow-2xl shadow-black/40">
              <div className="rounded-lg border border-border/60 bg-background/60 p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="artifact text-[11px] uppercase tracking-wider text-muted-foreground">
                    troof proof
                  </span>
                  <VerdictBadge status="verified" size="sm" />
                </div>
                <dl className="mt-4 space-y-2.5 text-sm">
                  <Row label="wallet" value="0x9a8f…c21d" />
                  <Row label="walrus blob" value={shortHash(SAMPLE_BLOB)} accent />
                  <Row label="sha-256" value="c343680a6e6c…48b9f2" />
                  <Row label="sui anchor" value="0xa9ce92…3171f" />
                </dl>
                <div className="mt-4 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  Re-fetched from a public Walrus aggregator · hash matches the
                  on-chain anchor.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────── How it works ───────────────────── */}
      <section id="how" className="border-t border-border/80 bg-card/20">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Trust, then verify — in three steps
            </h2>
            <p className="mt-3 text-muted-foreground">
              A screenshot of a wallet, or an AI&apos;s take on it, is just
              pixels. Troof turns the analysis into something anyone can
              independently re-check.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <Step
              n="01"
              icon={ScanSearch}
              title="Analyze"
              body="An AI agent reads the wallet live through Tatum's Sui RPC and Data APIs — balances, NFTs, staking, activity, and counterparty risk — then writes a verdict."
            />
            <Step
              n="02"
              icon={Database}
              title="Seal"
              body="The full evidence bundle — every call, raw response, and the AI's reasoning — is sealed into a content-addressed Walrus blob, with its SHA-256 anchored on Sui."
            />
            <Step
              n="03"
              icon={Link2}
              title="Verify"
              body="Open the proof on any machine. It re-hydrates from a public Walrus aggregator and re-checks the hash against the chain — green if untouched, red if a single byte changed."
            />
          </div>
        </div>
      </section>

      {/* ───────────────────── Why decentralized ───────────────────── */}
      <section className="border-t border-border/80">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-[1.1fr_1fr] md:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              The proof outlives the server.
            </h2>
            <p className="mt-4 text-muted-foreground">
              A report on a company&apos;s database can be quietly edited or
              deleted. A Troof proof is a content-addressed blob on Walrus with
              its hash anchored on Sui — there&apos;s no server of ours in the
              verification path, and no way to change the bytes without changing
              the address.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <VerdictBadge status="verified" />
              <span className="text-muted-foreground">→</span>
              <VerdictBadge status="tampered" />
              <span className="ml-1 text-sm text-muted-foreground">
                one byte is all it takes
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/40 p-6">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-brand" />
              Built on the tools that win this stack
            </div>
            <ul className="mt-5 space-y-4 text-sm">
              <TechRow
                name="Tatum"
                body="Sui RPC gateway (8 methods) + Exchange-Rate Data API + the real Tatum MCP server (13 tools) as the AI's brain."
              />
              <TechRow
                name="Walrus"
                body="Decentralized blob storage — the durable, content-addressed record the whole product is built on."
              />
              <TechRow
                name="Sui"
                body="The integrity anchor: the proof's hash lives on-chain, verifiable without trusting us."
              />
            </ul>
          </div>
        </div>
      </section>

      {/* ───────────────────── CTA ───────────────────── */}
      <section className="border-t border-border/80 bg-card/20">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Analyze a wallet. Get a proof.
          </h2>
          <div className="mt-7">
            <Button asChild size="lg" className="font-medium">
              <Link href="/analyze">
                Start analyzing <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="artifact text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className={`artifact text-[13px] ${accent ? "text-brand" : "text-foreground/90"}`}>
        {value}
      </dd>
    </div>
  );
}

function Step({
  n,
  icon: Icon,
  title,
  body,
}: {
  n: string;
  icon: React.ElementType;
  title: string;
  body: string;
}) {
  return (
    <div className="group relative rounded-xl border border-border bg-card/40 p-6 transition-colors hover:bg-card/70">
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5 text-foreground" />
        <span className="artifact text-xs text-muted-foreground/70">{n}</span>
      </div>
      <h3 className="mt-4 text-lg font-medium tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function TechRow({ name, body }: { name: string; body: string }) {
  return (
    <li className="flex gap-3">
      <span className="artifact mt-0.5 w-16 shrink-0 text-[13px] text-foreground">
        {name}
      </span>
      <span className="text-muted-foreground">{body}</span>
    </li>
  );
}
