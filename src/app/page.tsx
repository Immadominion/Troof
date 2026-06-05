import Link from "next/link";
import { Search, Gauge, ShieldCheck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerdictBadge } from "@/components/verdict-badge";
import { ProofShowcase } from "@/components/landing/proof-showcase";
import { BrowserMock } from "@/components/landing/browser-mock";
import { OrbitCluster } from "@/components/landing/orbit-cluster";
import { WatchDemo } from "@/components/landing/watch-demo";
import { TroofMark } from "@/components/troof-mark";
import { WALRUS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { GsapScroll } from "@/components/landing/gsap-scroll";

// A real sealed proof (testnet); the showcase + proof links route to it,
// where the hash is re-checked in-browser against its on-chain anchor.
const SAMPLE_BLOB = "7CCNsFeVc4rA_babdC_f0cBjl7-dg5uk1A2_PbaDNS0";
const PROOF_URL = `/p/${SAMPLE_BLOB}`;
const AGG_HOST = new URL(WALRUS.testnet.aggregator).host;

// Generous container that fills large screens without over-stretching prose.
const WRAP = "mx-auto w-full max-w-[1400px] 2xl:max-w-[1560px] px-6 lg:px-10";

// On big screens every section claims a full viewport and centers its content,
// so the page reads as a deck of full-bleed screens (the reference's rhythm).
const FULL = "2xl:flex 2xl:min-h-screen 2xl:flex-col 2xl:justify-center";

// Primary CTA sizing — scales up with the screen. Shared by the hero and the
// final CTA so the two big "Ask Troof" buttons always match.
const CTA_SIZE =
  "h-11 gap-2 px-5 text-[0.95rem] xl:h-12 xl:px-6 xl:text-base 2xl:h-14 2xl:px-9 2xl:text-lg";

// Section heading + lead, tuned to grow on big screens.
const H2 =
  "font-display text-3xl font-semibold tracking-tight sm:text-4xl 2xl:text-6xl";
const LEAD = "text-muted-foreground 2xl:text-lg";

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
    <GsapScroll>
      {/* ───────────────────── Hero ───────────────────── */}
      <section className="troof-blobs troof-blobs--drift relative isolate overflow-hidden">
        {/* soft ellipse glow behind the product visual */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ellipse.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute -z-10 hidden w-[400px] opacity-50 lg:block dark:opacity-30"
          style={{ right: '0%', top: '20%' }}
        />

        <div className={`${WRAP} relative grid items-center gap-12 pb-20 pt-28 sm:pt-32 lg:min-h-screen lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-20 lg:pt-24 2xl:gap-20`}>
          {/* copy */}
          <div className="relative">
            <Star className="absolute -left-3 top-0 w-5 sm:-left-7" />
            <span data-hero="badge" className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-xs font-medium tracking-wide text-muted-foreground backdrop-blur-sm 2xl:text-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
              </span>
              <span className="font-mono">Verifiable AI explorer for Sui</span>
            </span>

            <h1 data-hero="title" className="mt-6 text-balance font-display text-6xl font-semibold leading-[0.95] tracking-tight text-foreground sm:text-7xl 2xl:text-8xl">
              Ask Sui.
              <br />
              Prove it.
              <Star className="ml-3 inline-block w-7 align-top 2xl:w-9" />
            </h1>

            <p data-hero="lead" className="mt-6 max-w-md text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg 2xl:max-w-lg 2xl:text-xl">
              Ask anything on Sui in plain words: a wallet, a token, a
              transaction, an address. Read it live, then prove the answer.
            </p>

            <div data-hero="cta" className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 2xl:mt-10">
              <Button
                asChild
                size="lg"
                className={cn(
                  CTA_SIZE,
                  "font-medium shadow-[0_10px_30px_-10px_var(--brand-glow)] transition-shadow hover:shadow-[0_12px_38px_-10px_var(--brand-glow)]",
                )}
              >
                <Link href="/analyze">
                  Ask Troof <ArrowLong className="ml-1 w-6 2xl:w-7" />
                </Link>
              </Button>
              <WatchDemo />
            </div>

            <div data-hero="trust" className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-xs text-muted-foreground 2xl:text-sm">
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
            {/* Exact container bounding the mockup so the background ellipses align perfectly */}
            <div data-hero="visual" className="relative w-full max-w-[480px] xl:max-w-[540px] mx-auto lg:ml-auto lg:mr-0">
              {/* Concentric ellipses behind the browser mock to match reference style */}
              <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none select-none">
                <svg
                  viewBox="0 0 100 100"
                  className="w-[140%] h-[140%] max-w-none opacity-40 dark:opacity-20 stroke-border fill-none"
                  style={{ transform: "rotate(-12deg) scaleY(0.7)" }}
                >
                  <ellipse cx="50" cy="50" rx="46" ry="46" strokeWidth="0.15" />
                  <ellipse cx="50" cy="50" rx="38" ry="38" strokeWidth="0.15" />
                  <ellipse cx="50" cy="50" rx="30" ry="30" strokeWidth="0.15" />
                  <ellipse cx="50" cy="50" rx="22" ry="22" strokeWidth="0.15" strokeDasharray="1 1" />
                  <ellipse cx="50" cy="50" rx="14" ry="14" strokeWidth="0.15" />
                </svg>
              </div>
              <BrowserMock url="troof.site/analyze" glow>
                <HeroAnswer />
              </BrowserMock>
            </div>
          </div>

          {/* z-curve annotation ribbon — absolutely positioned so it doesn't
              affect the grid centering. Floats in the bottom-left of the hero. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/z-curve.svg"
            alt=""
            aria-hidden
            className="pointer-events-none absolute hidden w-[22rem] rotate-[-8deg] lg:block xl:w-[26rem] 2xl:w-[32rem]"
            style={{ bottom: '-20px', left: '25%' }}
          />
        </div>
      </section>

      {/* ───────────────────── What you can do ───────────────────── */}
      <section className={FULL}>
        <div className={`${WRAP} py-20 sm:py-28`}>
          <div data-reveal>
            <Eyebrow>What you can do</Eyebrow>
            <div className="flex items-center gap-3">
              <h2 className={H2}>One explorer, three moves.</h2>
              <Star className="w-5 2xl:w-6" />
            </div>
          </div>

          <div data-reveal-group className="mt-12 grid gap-5 md:grid-cols-3 2xl:mt-16 2xl:gap-7">
            <Cando icon={Search} title="Ask anything">
              Type a question about any wallet, token, transaction, or object and
              read it live on Sui.
            </Cando>

            {/* promoted card breaks the 3-identical pattern */}
            <div className="rounded-2xl border border-brand-ring bg-brand-soft p-6 sm:p-7 2xl:p-9">
              <div className="flex items-center justify-between">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-brand-foreground 2xl:h-11 2xl:w-11">
                  <Gauge className="h-[18px] w-[18px] 2xl:h-5 2xl:w-5" />
                </span>
                <div className="flex items-center gap-1">
                  {(["A", "B", "C", "D", "F"] as const).map((g) => (
                    <span
                      key={g}
                      className={`flex h-6 w-6 items-center justify-center rounded-md border text-[11px] font-semibold tabular-nums 2xl:h-7 2xl:w-7 2xl:text-xs ${g === "A"
                        ? "border-verified/40 bg-verified-muted text-verified"
                        : "border-border bg-card text-muted-foreground"
                        }`}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
              <h3 className="mt-4 text-lg font-medium tracking-tight 2xl:text-xl">Grade a token</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground 2xl:text-base">
                Every coin gets a Troof Score, an A to F trust grade that flags
                fake SUI on sight.
              </p>
            </div>

            <Cando icon={ShieldCheck} title="Seal and verify">
              Turn any answer into a sealed proof anyone can re-check in their own
              browser.
            </Cando>
          </div>
        </div>
      </section>

      {/* ───────────────────── How it works ───────────────────── */}
      <section className={cn("border-t border-border/70 bg-secondary/40", FULL)}>
        <div className={`${WRAP} py-20 sm:py-28`}>
          <div data-reveal>
            <Eyebrow>How it works</Eyebrow>
            <h2 className={cn(H2, "max-w-2xl")}>Ask, read, seal, verify.</h2>
            <p className={cn("mt-3 max-w-xl", LEAD)}>
              An answer on a screen is just pixels. Troof turns it into something
              anyone can independently re-check.
            </p>
          </div>

          <div className="relative mt-12 2xl:mt-16">
            <div
              data-connector
              aria-hidden
              className="absolute inset-x-[12%] top-[2.35rem] hidden border-t border-dashed border-brand-ring md:block 2xl:top-[2.85rem]"
            />
            <div data-reveal-group className="relative grid gap-5 md:grid-cols-4 2xl:gap-7">
              <Step n="01" title="Ask" body="Type any question about Sui in plain language." />
              <Step n="02" title="Read" body="Troof reads the chain live through Tatum, then answers." />
              <Step n="03" title="Seal" body="Lock the answer to Walrus and anchor it on Sui." />
              <Step n="04" title="Verify" body="Anyone re-checks it in their own browser. Green or red." />
            </div>
          </div>

          <div data-reveal className="mt-8 flex flex-wrap items-center gap-3 text-sm text-muted-foreground 2xl:mt-10">
            <VerdictBadge status="verified" size="sm" showSub={false} />
            <span>if untouched</span>
            <span className="text-border">·</span>
            <span className="font-mono text-xs">no Troof server in the verify path</span>
          </div>
        </div>
      </section>

      {/* ───────────────────── Proof + Score showcase ───────────────────── */}
      <section className={FULL}>
        <div className={`${WRAP} py-20 sm:py-28`}>
          <div data-reveal>
            <Eyebrow>See it for yourself</Eyebrow>
            <h2 className={cn(H2, "max-w-2xl")}>This is a real proof. Open it yourself.</h2>
            <p className={cn("mt-3 max-w-xl", LEAD)}>
              Change one byte and the verdict flips. That is the whole idea.
            </p>
          </div>
          <div data-reveal className="mt-10 2xl:mt-14">
            <ProofShowcase blobId={SAMPLE_BLOB} proofUrl={PROOF_URL} aggregatorHost={AGG_HOST} />
          </div>
        </div>
      </section>

      {/* ───────────────────── Why you can trust it ───────────────────── */}
      <section
        className={cn("troof-blobs relative isolate overflow-hidden border-t border-border/70", FULL)}
        style={{ "--blob-strength": "0.5" } as React.CSSProperties}
      >
        <div className={`${WRAP} grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-2`}>
          <div className="relative">
            <Star className="absolute -left-2 -top-3 w-5 2xl:w-6" />
            <div data-reveal-group>
              <Eyebrow>Why you can trust it</Eyebrow>
              <h2 className={cn(H2, "text-balance leading-tight")}>
                Most explorers hand you raw data and ask you to trust the screen.
              </h2>
              <div className="mt-6 max-w-md rounded-2xl rounded-bl-sm border border-brand-ring bg-brand-soft px-4 py-3 text-sm leading-relaxed text-foreground/90 2xl:max-w-lg 2xl:px-5 2xl:py-4 2xl:text-base">
                We are not in the verify path. Anyone re-fetches the evidence and
                re-hashes it themselves.
              </div>
            </div>
          </div>

          <OrbitCluster
            className="order-first lg:order-none 2xl:max-w-lg"
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
      <section className={cn("border-t border-border/70 bg-secondary/40", FULL)}>
        <div className={`${WRAP} py-20 sm:py-28`}>
          <div data-reveal>
            <Eyebrow>FAQ</Eyebrow>
            <div className="flex items-center gap-3">
              <h2 className={H2}>Questions, answered.</h2>
              <Star className="w-5 2xl:w-6" />
            </div>
          </div>

          <div data-reveal-group className="mt-10 grid gap-4 md:grid-cols-2 2xl:mt-14 2xl:gap-6">
            {FAQ.map((item, i) => (
              <FaqCard key={item.q} q={item.q} a={item.a} accent={FAQ_ACCENT.has(i)} />
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────── Final CTA (dark banner) ───────────────────── */}
      <section className={FULL}>
        <div className={`${WRAP} py-16 sm:py-24`}>
          <div
            data-reveal
            className="dark troof-aurora relative isolate overflow-hidden rounded-[2rem] bg-background px-6 py-20 text-center text-foreground sm:px-12 sm:py-28 2xl:py-40"
            style={{
              "--aurora-strength": "0.7",
              "--aurora-1": "oklch(0.60 0.085 256)",
              "--aurora-2": "oklch(0.50 0.07 258)",
              "--aurora-3": "oklch(0.42 0.05 255)",
              "--aurora-haze": "oklch(0.34 0.03 258)",
            } as React.CSSProperties}
          >
            <Star className="absolute left-[12%] top-12 w-6 2xl:w-8" />
            <Star className="absolute right-[16%] top-20 w-4 opacity-70 2xl:w-6" />
            <Star className="absolute bottom-14 left-[24%] w-3.5 opacity-60 2xl:w-5" />

            <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-6xl 2xl:text-7xl">
              Ask Sui anything.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground 2xl:mt-6 2xl:max-w-lg 2xl:text-lg">
              Get a live answer you can prove and share. It is free to try.
            </p>
            <div className="mt-9 2xl:mt-12">
              <Button
                asChild
                size="lg"
                className={cn(CTA_SIZE, "font-medium shadow-[0_10px_36px_-10px_var(--brand-glow)]")}
              >
                <Link href="/analyze">
                  Ask Troof <ArrowLong className="ml-1 w-6 2xl:w-7" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </GsapScroll>
  );
}

/* ───────────────────── pieces ───────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-brand 2xl:text-sm">
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
      <div data-hero="q" className="flex items-center gap-2">
        <span className="artifact rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          you
        </span>
        <span className="text-foreground/90">Is this token the real SUI?</span>
      </div>
      <div data-hero="a-card" className="rounded-xl border border-border bg-card p-3.5">
        <div className="flex items-center gap-1.5">
          <TroofMark className="h-3.5 w-3.5 text-brand" />
          <span className="artifact text-[11px] text-muted-foreground">troof</span>
        </div>
        <p className="mt-2 leading-relaxed text-foreground/90">
          No. It impersonates the SUI symbol. The canonical coin is
        </p>
        <div data-hero="a-chip" className="artifact mt-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-[12px] text-foreground/80">
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
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm shadow-foreground/[0.03] transition-shadow hover:shadow-md hover:shadow-foreground/[0.05] sm:p-7 2xl:p-9">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-foreground 2xl:h-11 2xl:w-11">
        <Icon className="h-[18px] w-[18px] 2xl:h-5 2xl:w-5" />
      </span>
      <h3 className="mt-4 text-lg font-medium tracking-tight 2xl:text-xl">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground 2xl:text-base">{children}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm shadow-foreground/[0.03] sm:p-7 2xl:p-9">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft font-mono text-xs font-semibold text-brand 2xl:h-11 2xl:w-11 2xl:text-sm">
        {n}
      </span>
      <h3 className="mt-4 text-lg font-medium tracking-tight 2xl:text-xl">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground 2xl:text-base">{body}</p>
    </div>
  );
}

function FaqCard({ q, a, accent }: { q: string; a: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-6 sm:p-7 2xl:p-9 ${accent
        ? "border-transparent bg-brand text-brand-foreground"
        : "border-border bg-card shadow-sm shadow-foreground/[0.03]"
        }`}
    >
      <h3 className="flex items-start gap-2 text-base font-semibold tracking-tight 2xl:text-lg">
        {accent && <Check className="mt-0.5 h-4 w-4 shrink-0 opacity-80 2xl:h-5 2xl:w-5" />}
        {q}
      </h3>
      <p
        className={`mt-2 text-sm leading-relaxed 2xl:text-base ${accent ? "text-brand-foreground/85" : "text-muted-foreground"
          }`}
      >
        {a}
      </p>
    </div>
  );
}
