import Link from "next/link";
import { ArrowRight, Search, Gauge, ShieldCheck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerdictBadge } from "@/components/verdict-badge";
import { ProofShowcase } from "@/components/landing/proof-showcase";
import { BrowserMock } from "@/components/landing/browser-mock";
import { OrbitCluster } from "@/components/landing/orbit-cluster";
import { WatchDemo } from "@/components/landing/watch-demo";
import { TroofMark } from "@/components/troof-mark";
import { WALRUS } from "@/lib/constants";

// A real sealed proof (testnet); the showcase + proof links route to it,
// where the hash is re-checked in-browser against its on-chain anchor.
const SAMPLE_BLOB = "7CCNsFeVc4rA_babdC_f0cBjl7-dg5uk1A2_PbaDNS0";
const PROOF_URL = `/p/${SAMPLE_BLOB}`;
const AGG_HOST = new URL(WALRUS.testnet.aggregator).host;

// Generous container that fills large screens without over-stretching prose.
const WRAP = "mx-auto w-full max-w-[1400px] 2xl:max-w-[1560px] px-6 lg:px-10";

const FAQ = [
  {
    q: "What is Troof?",
    a: "A verifiable AI explorer for Sui. You ask a question in plain words and the AI reads the chain live through Tatum, then answers. The difference is that any answer can be sealed and re-checked later by anyone, so you never have to take our word for it.",
  },
  {
    q: "What can I ask it?",
    a: "Anything on Sui, in plain language. Point it at a wallet, a token, a transaction, or an address and ask what you want to know. The answer is grounded in the live on-chain data it actually read.",
  },
  {
    q: "What is the Troof Score?",
    a: "An A to F trust grade for a token, built only from live on-chain signals like identity, age, metadata, and supply. It flags tokens that impersonate the real SUI symbol on sight, and USD value counts only canonical SUI so a fake cannot inflate its own number.",
  },
  {
    q: "What do seal and verify mean?",
    a: "Seal is one click: it writes the answer and its evidence to Walrus and anchors the SHA-256 on Sui. Verify is the other side: anyone opens the proof, their browser re-fetches and re-hashes it, then compares against the hash on Sui. Match shows Verified, mismatch shows Tampered.",
  },
  {
    q: "Is it free?",
    a: "Yes to start. You get a set of free analyses with no signup, then connect a Sui wallet to keep going. There is also a pay-per-call API for your own code. Verifying a proof is always free and open to everyone.",
  },
  {
    q: "Can an answer be faked or changed later?",
    a: "No. Verify runs in your own browser against a public Walrus aggregator and the hash on Sui. No server of ours is in that path, so we cannot quietly edit a sealed report. Change one byte and it shows Tampered.",
  },
];
const FAQ_ACCENT = new Set([0, 3, 4]); // checkerboard accent cards

export default function Home() {
  return (
    <div>
      {/* ───────────────────── Hero ───────────────────── */}
      <section className="troof-blobs troof-blobs--drift relative isolate overflow-hidden">
        {/* soft ellipse glow behind the product visual */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ellipse.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-24 -z-10 hidden w-[820px] opacity-50 lg:block dark:opacity-30"
        />
        <div className={`${WRAP} grid items-center gap-12 pb-20 pt-20 sm:pt-24 lg:min-h-[88vh] lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pb-28`}>
          {/* copy */}
          <div className="relative">
            <Star className="absolute -left-3 top-0 w-5 sm:-left-7" />
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-xs font-medium tracking-wide text-muted-foreground backdrop-blur-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
              </span>
              <span className="font-mono">Verifiable AI explorer for Sui</span>
            </span>

            <h1 className="mt-6 text-balance font-display text-6xl font-semibold leading-[0.95] tracking-tight text-foreground sm:text-7xl 2xl:text-8xl">
              Ask Sui.
              <br />
              Prove it.
              <Star className="ml-3 inline-block w-7 align-top" />
            </h1>

            <p className="mt-6 max-w-md text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Ask anything on Sui in plain words: a wallet, a token, a
              transaction, an address. Read it live, then prove the answer.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Button
                asChild
                size="lg"
                className="font-medium shadow-[0_10px_30px_-10px_var(--brand-glow)] transition-shadow hover:shadow-[0_12px_38px_-10px_var(--brand-glow)]"
              >
                <Link href="/analyze">
                  Ask Troof <ArrowLong className="ml-1 w-6" />
                </Link>
              </Button>
              <WatchDemo />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-xs text-muted-foreground">
              <span>Sealed to Walrus</span>
              <span className="text-border">/</span>
              <span>Anchored on Sui</span>
              <span className="text-border">/</span>
              <Link href={PROOF_URL} className="underline-offset-4 hover:text-foreground hover:underline">
                See a live proof
              </Link>
            </div>
          </div>

          {/* product visual */}
          <div className="relative">
            {/* z-curve hero annotation */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/z-curve.svg"
              alt=""
              aria-hidden
              className="pointer-events-none absolute -left-10 -top-16 z-10 hidden w-44 rotate-[-4deg] lg:block"
            />
            <BrowserMock url="troof.site/analyze" glow>
              <HeroAnswer />
            </BrowserMock>
          </div>
        </div>
      </section>

      {/* ───────────────────── What you can do ───────────────────── */}
      <section className={`${WRAP} py-20 sm:py-28`}>
        <Eyebrow>What you can do</Eyebrow>
        <div className="flex items-center gap-3">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl 2xl:text-5xl">
            One explorer, three moves.
          </h2>
          <Star className="w-5" />
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <Cando icon={Search} title="Ask anything">
            Type a question about any wallet, token, transaction, or object and
            read it live on Sui.
          </Cando>

          {/* promoted card breaks the 3-identical pattern */}
          <div className="rounded-2xl border border-brand-ring bg-brand-soft p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-brand-foreground">
                <Gauge className="h-[18px] w-[18px]" />
              </span>
              <div className="flex items-center gap-1">
                {(["A", "B", "C", "D", "F"] as const).map((g) => (
                  <span
                    key={g}
                    className={`flex h-6 w-6 items-center justify-center rounded-md border text-[11px] font-semibold tabular-nums ${
                      g === "A"
                        ? "border-verified/40 bg-verified-muted text-verified"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
            <h3 className="mt-4 text-lg font-medium tracking-tight">Grade a token</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Every coin gets a Troof Score, an A to F trust grade that flags
              fake SUI on sight.
            </p>
          </div>

          <Cando icon={ShieldCheck} title="Seal and verify">
            Turn any answer into a sealed proof anyone can re-check in their own
            browser.
          </Cando>
        </div>
      </section>

      {/* ───────────────────── How it works ───────────────────── */}
      <section className="border-t border-border/70 bg-secondary/40">
        <div className={`${WRAP} py-20 sm:py-28`}>
          <Eyebrow>How it works</Eyebrow>
          <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl 2xl:text-5xl">
            Ask, read, seal, verify.
          </h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            An answer on a screen is just pixels. Troof turns it into something
            anyone can independently re-check.
          </p>

          <div className="relative mt-12">
            <div
              aria-hidden
              className="absolute inset-x-[12%] top-[2.35rem] hidden border-t border-dashed border-brand-ring md:block"
            />
            <div className="relative grid gap-5 md:grid-cols-4">
              <Step n="01" title="Ask" body="Type any question about Sui in plain language." />
              <Step n="02" title="Read" body="Troof reads the chain live through Tatum, then answers." />
              <Step n="03" title="Seal" body="Lock the answer to Walrus and anchor it on Sui." />
              <Step n="04" title="Verify" body="Anyone re-checks it in their own browser. Green or red." />
            </div>
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
      <section className={`${WRAP} py-20 sm:py-28`}>
        <Eyebrow>See it for yourself</Eyebrow>
        <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl 2xl:text-5xl">
          This is a real proof. Open it yourself.
        </h2>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Change one byte and the verdict flips. That is the whole idea.
        </p>
        <div className="mt-10">
          <ProofShowcase blobId={SAMPLE_BLOB} proofUrl={PROOF_URL} aggregatorHost={AGG_HOST} />
        </div>
      </section>

      {/* ───────────────────── Why you can trust it ───────────────────── */}
      <section className="troof-blobs relative isolate overflow-hidden border-t border-border/70" style={{ "--blob-strength": "0.5" } as React.CSSProperties}>
        <div className={`${WRAP} grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-2`}>
          <div className="relative">
            <Star className="absolute -left-2 -top-3 w-5" />
            <Eyebrow>Why you can trust it</Eyebrow>
            <h2 className="text-balance font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl 2xl:text-5xl">
              Most explorers hand you raw data and ask you to trust the screen.
            </h2>
            <div className="mt-6 max-w-md rounded-2xl rounded-bl-sm border border-brand-ring bg-brand-soft px-4 py-3 text-sm leading-relaxed text-foreground/90">
              We are not in the verify path. Anyone re-fetches the evidence and
              re-hashes it themselves.
            </div>
          </div>

          <OrbitCluster
            className="order-first lg:order-none"
            center={
              <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-lg shadow-foreground/5">
                <TroofMark className="h-6 w-6 text-brand" />
                <span className="artifact mt-1 text-[9px] uppercase tracking-wider text-muted-foreground">
                  troof
                </span>
              </div>
            }
            chips={[
              { label: "Tatum", angle: 145, ring: 0 },
              { label: "Walrus", angle: 35, ring: 0 },
              { label: "Sui", angle: 310, ring: 0 },
              { label: "Re-checked in your browser", angle: 235, ring: 0 },
            ]}
          />
        </div>
      </section>

      {/* ───────────────────── FAQ ───────────────────── */}
      <section className="border-t border-border/70 bg-secondary/40">
        <div className={`${WRAP} py-20 sm:py-28`}>
          <Eyebrow>FAQ</Eyebrow>
          <div className="flex items-center gap-3">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl 2xl:text-5xl">
              Questions, answered.
            </h2>
            <Star className="w-5" />
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {FAQ.map((item, i) => (
              <FaqCard key={item.q} q={item.q} a={item.a} accent={FAQ_ACCENT.has(i)} />
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────── Final CTA (dark banner) ───────────────────── */}
      <section className={`${WRAP} py-16 sm:py-24`}>
        <div
          className="dark troof-aurora relative isolate overflow-hidden rounded-[2rem] bg-background px-6 py-20 text-center text-foreground sm:px-12 sm:py-28"
          style={{
            "--aurora-strength": "0.7",
            "--aurora-1": "oklch(0.60 0.085 256)",
            "--aurora-2": "oklch(0.50 0.07 258)",
            "--aurora-3": "oklch(0.42 0.05 255)",
            "--aurora-haze": "oklch(0.34 0.03 258)",
          } as React.CSSProperties}
        >
          <Star className="absolute left-[12%] top-12 w-6" />
          <Star className="absolute right-[16%] top-20 w-4 opacity-70" />
          <Star className="absolute bottom-14 left-[24%] w-3.5 opacity-60" />

          <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-6xl">
            Ask Sui anything.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Get a live answer you can prove and share. It is free to try.
          </p>
          <div className="mt-9">
            <Button
              asChild
              size="lg"
              className="font-medium shadow-[0_10px_36px_-10px_var(--brand-glow)]"
            >
              <Link href="/analyze">
                Ask Troof <ArrowLong className="ml-1 w-6" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ───────────────────── pieces ───────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-brand">
      {children}
    </div>
  );
}

/** The imported 4-point star asset. Decorative. */
function Star({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/star.png"
      alt=""
      aria-hidden
      className={`pointer-events-none select-none dark:invert ${className ?? ""}`}
    />
  );
}

/** The imported long forward-arrow, recolored to currentColor so it works on any button. */
function ArrowLong({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 25 8" fill="none" aria-hidden className={`inline-block h-2 ${className ?? ""}`}>
      <path
        d="M24.3536 4.03556C24.5488 3.8403 24.5488 3.52372 24.3536 3.32845L21.1716 0.146473C20.9763 -0.0487893 20.6597 -0.0487893 20.4645 0.146473C20.2692 0.341735 20.2692 0.658318 20.4645 0.85358L23.2929 3.68201L20.4645 6.51043C20.2692 6.7057 20.2692 7.02228 20.4645 7.21754C20.6597 7.4128 20.9763 7.4128 21.1716 7.21754L24.3536 4.03556ZM0 4.18201H24V3.18201H0V4.18201Z"
        fill="currentColor"
      />
    </svg>
  );
}

function HeroAnswer() {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="artifact rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          you
        </span>
        <span className="text-foreground/90">Is this token the real SUI?</span>
      </div>
      <div className="rounded-xl border border-border bg-card p-3.5">
        <div className="flex items-center gap-1.5">
          <TroofMark className="h-3.5 w-3.5 text-brand" />
          <span className="artifact text-[11px] text-muted-foreground">troof</span>
        </div>
        <p className="mt-2 leading-relaxed text-foreground/90">
          No. It impersonates the SUI symbol. The canonical coin is
        </p>
        <div className="artifact mt-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-[12px] text-foreground/80">
          0x2::sui::SUI
        </div>
        <p className="mt-2.5 font-mono text-[11px] text-muted-foreground">
          sealed to Walrus · anchored on Sui
        </p>
      </div>
    </div>
  );
}

function Cando({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm shadow-foreground/[0.03] transition-shadow hover:shadow-md hover:shadow-foreground/[0.05] sm:p-7">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-foreground">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <h3 className="mt-4 text-lg font-medium tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm shadow-foreground/[0.03] sm:p-7">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft font-mono text-xs font-semibold text-brand">
        {n}
      </span>
      <h3 className="mt-4 text-lg font-medium tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function FaqCard({ q, a, accent }: { q: string; a: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-6 sm:p-7 ${
        accent
          ? "border-transparent bg-brand text-brand-foreground"
          : "border-border bg-card shadow-sm shadow-foreground/[0.03]"
      }`}
    >
      <h3 className="flex items-start gap-2 text-base font-semibold tracking-tight">
        {accent && <Check className="mt-0.5 h-4 w-4 shrink-0 opacity-80" />}
        {q}
      </h3>
      <p
        className={`mt-2 text-sm leading-relaxed ${
          accent ? "text-brand-foreground/85" : "text-muted-foreground"
        }`}
      >
        {a}
      </p>
    </div>
  );
}
