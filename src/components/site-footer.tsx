import Link from "next/link";
import { TroofWordmark } from "@/components/troof-mark";
import { SITE } from "@/lib/constants";

const COLS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Ask Troof", href: "/analyze" },
      { label: "Verify a proof", href: "/verify" },
      { label: "Troof Score", href: "/docs#score" },
    ],
  },
  {
    title: "Builders",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "Pay-per-call API", href: "/docs#api" },
      { label: "How it works", href: "/docs#how" },
    ],
  },
  {
    title: "Powered by",
    links: [
      { label: "Tatum", href: "https://tatum.io", external: true },
      { label: "Walrus", href: "https://walrus.xyz", external: true },
      { label: "Sui", href: "https://sui.io", external: true },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          {/* brand */}
          <div>
            <TroofWordmark />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Verifiable AI explorer for Sui. Read the chain live, then prove the
              answer.
            </p>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <div className="text-xs font-medium uppercase tracking-wider text-foreground/70">
                {col.title}
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.external ? (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link
                        href={l.href}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border/70 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono">
            {SITE.name}. Read Sui live, prove the answer.
          </span>
          <span className="font-mono">Live proofs are on Sui testnet.</span>
        </div>
      </div>
    </footer>
  );
}
