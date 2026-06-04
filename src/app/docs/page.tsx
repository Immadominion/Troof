import type { Metadata } from "next";
import Link from "next/link";
import { ScanSearch, Gauge, ShieldCheck, Code2, BookOpen, LinkIcon, Boxes } from "lucide-react";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Docs",
  description: "How Troof works, the Troof Score, and the x402 API.",
};

const REPO = "https://github.com/Immadominion/Troof";

export default function DocsPage() {
  return (
    <div>
      <section
        className="troof-aurora relative isolate overflow-hidden border-b border-border/60"
        style={{ "--aurora-strength": "0.35" } as React.CSSProperties}
      >
        <header className="mx-auto max-w-3xl px-5 pb-10 pt-16">
        <h1 className="text-3xl font-semibold tracking-tight">Docs</h1>
        <p className="mt-2 text-muted-foreground">
          {SITE.name}, the verifiable AI terminal for Sui. An explorer whose answers you can re-check.
        </p>
        <nav className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {[
            ["overview", "Overview"],
            ["how", "How it works"],
            ["architecture", "Architecture"],
            ["score", "Troof Score"],
            ["api", "API (x402)"],
            ["link", "Link to Troof"],
            ["whitepaper", "Whitepaper"],
          ].map(([id, label]) => (
            <a key={id} href={`#${id}`} className="hover:text-foreground">
              {label}
            </a>
          ))}
        </nav>
        </header>
      </section>

      <div className="mx-auto max-w-3xl px-5 pb-16 pt-12">
      <Section id="overview" icon={BookOpen} title="What is Troof">
        <p>
          Troof lets you ask an AI about any Sui <strong>wallet</strong> or <strong>token</strong>, and
          then <strong>seal that answer into a proof</strong> anyone can independently re-fetch and
          re-hash. Other explorers generate an explanation and throw it away; Troof turns it into an
          artifact: the AI&apos;s verdict, the on-chain data behind it, and the integrity hash are
          stored on Walrus and anchored on Sui, with no Troof server in the verification path.
        </p>
      </Section>

      <Section id="how" icon={ScanSearch} title="How it works">
        <Steps
          items={[
            ["Ask", "Paste a 0x address or coin type. The agent reads it live via Tatum's Sui RPC + MCP."],
            ["Grade", "Wallets get an integrity-checked report; tokens get a Troof Score (A–F). Impersonators of canonical SUI are flagged, never trusted by symbol."],
            ["Seal", "One click writes the evidence bundle to Walrus and anchors its SHA-256 on Sui."],
            ["Verify", "Open the proof anywhere, it re-fetches from a public Walrus aggregator, re-hashes in your browser, and checks the on-chain record. Green = Verified, red = Tampered."],
          ]}
        />
      </Section>

      <Section id="architecture" icon={Boxes} title="Architecture">
        <p>How a question becomes a verifiable proof across Tatum, Walrus, and Sui.</p>
        <div className="mt-4 space-y-6">
          {[
            ["system-architecture", "System overview"],
            ["seal-flow", "Sealing a proof"],
            ["verify-flow", "Verifying a proof"],
            ["troof-score", "The Troof Score"],
            ["agent-mcp", "Agent + Tatum MCP"],
          ].map(([f, cap]) => (
            <figure key={f}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/docs/${f}.svg`} alt={cap} className="w-full rounded-lg border border-border bg-card/30" />
              <figcaption className="mt-2 text-center text-xs text-muted-foreground">{cap}</figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Section id="score" icon={Gauge} title="The Troof Score">
        <p>A transparent A–F trust grade for a Sui coin, computed from on-chain signals, each penalty cites the raw field it came from:</p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li><strong>Identity / canonicity</strong> (−40), faking the SUI symbol from a non-canonical type is a hard fail.</li>
          <li><strong>Age</strong> (−15), newer coins are riskier.</li>
          <li><strong>Metadata mutability</strong> (−10), frozen metadata is safer.</li>
          <li><strong>Supply transparency</strong> (−10), readable on-chain.</li>
        </ul>
        <p className="mt-3 text-muted-foreground">
          Signals we can&apos;t verify via RPC (holders, liquidity, mint-authority) are shown as honest
          &quot;not verifiable&quot; lines, never faked. The whole score is itself sealable (rubric is versioned).
        </p>
      </Section>

      <Section id="api" icon={Code2} title="The Troof API (x402)">
        <p>The same analysis, available as pay-per-call HTTP APIs via the <a className="underline" href="https://x402.org" target="_blank" rel="noreferrer">x402</a> protocol (USDC micropayments). <code className="artifact">verify</code> is free.</p>
        <div className="mt-3 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              <Row m="GET" p="/api/v1/token/score?coinType=&network=" price="$0.01" />
              <Row m="GET" p="/api/v1/wallet?address=&network=" price="$0.02" />
              <Row m="POST" p="/api/v1/seal" price="$0.05" />
              <Row m="GET" p="/api/v1/verify/:blobId" price="free" />
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-muted-foreground">
          Unpaid requests get <code className="artifact">402 Payment Required</code> with x402 instructions; pay and retry
          with the <code className="artifact">X-PAYMENT</code> header. Full design in{" "}
          <a className="underline" href={`${REPO}/blob/main/docs/x402.md`} target="_blank" rel="noreferrer">docs/x402.md</a>.
        </p>
      </Section>

      <Section id="link" icon={LinkIcon} title="Link to Troof">
        <p>Every sealed proof has a permanent, shareable URL anyone can open and verify:</p>
        <pre className="artifact mt-2 overflow-x-auto rounded-lg border border-border bg-card/40 p-3 text-xs">
{`https://troof.site/p/<blobId>     # human-verifiable proof page
GET /api/v1/verify/<blobId>       # machine-readable verdict (free)`}
        </pre>
        <p className="mt-3 text-muted-foreground">
          Drop a proof link in a chat, a listing, or a report, the reader verifies it themselves, no Troof account needed.
        </p>
      </Section>

      <Section id="whitepaper" icon={ShieldCheck} title="Whitepaper (in brief)">
        <p>
          AI is becoming how people read blockchains, but you can&apos;t prove what an AI actually saw or
          said. Troof fixes that. It saves the AI&apos;s answer and the on-chain data behind it to Walrus,
          and writes a fingerprint of it (a SHA-256 hash) to Sui. To check a proof, your browser
          re-downloads it from a public network and re-computes the fingerprint. Match means real;
          one changed byte means tampered.
        </p>
        <p className="mt-3">
          <strong>Tatum</strong> reads the chain, <strong>Walrus</strong> stores the proof,{" "}
          <strong>Sui</strong> anchors it. Nothing in the check trusts our servers, which is what makes
          a Troof answer different from every other AI explorer.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Full source + architecture diagrams:{" "}
          <a className="underline" href={REPO} target="_blank" rel="noreferrer">github.com/Immadominion/Troof</a>.
        </p>
      </Section>

      <div className="mt-12 border-t border-border pt-6">
        <Link href="/analyze" className="text-sm font-medium hover:underline">
          → Try Troof
        </Link>
      </div>
      </div>
    </div>
  );
}

function Section({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-12 scroll-mt-20">
      <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
        <Icon className="h-5 w-5 text-muted-foreground" /> {title}
      </h2>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}

function Steps({ items }: { items: [string, string][] }) {
  return (
    <ol className="space-y-3">
      {items.map(([t, b], i) => (
        <li key={i} className="flex gap-3">
          <span className="artifact mt-0.5 text-xs text-muted-foreground/60">{i + 1}</span>
          <span>
            <strong>{t}.</strong> <span className="text-muted-foreground">{b}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function Row({ m, p, price }: { m: string; p: string; price: string }) {
  return (
    <tr>
      <td className="w-14 px-3 py-2 align-top">
        <span className="artifact text-[11px] text-muted-foreground">{m}</span>
      </td>
      <td className="artifact px-3 py-2 text-xs text-foreground/90">{p}</td>
      <td className="w-16 px-3 py-2 text-right">
        <span className={price === "free" ? "text-verified text-xs" : "artifact text-xs text-muted-foreground"}>{price}</span>
      </td>
    </tr>
  );
}
