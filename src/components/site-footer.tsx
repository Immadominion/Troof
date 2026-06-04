import Link from "next/link";
import { TroofMark } from "@/components/troof-mark";
import { SITE } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5 text-muted-foreground">
          <TroofMark className="h-4 w-4" />
          <span className="text-sm">
            {SITE.name}, {SITE.tagline}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="artifact text-[11px] uppercase tracking-wider opacity-70">
            Powered by
          </span>
          <a href="https://tatum.io" target="_blank" rel="noreferrer" className="hover:text-foreground">
            Tatum
          </a>
          <a href="https://walrus.xyz" target="_blank" rel="noreferrer" className="hover:text-foreground">
            Walrus
          </a>
          <a href="https://sui.io" target="_blank" rel="noreferrer" className="hover:text-foreground">
            Sui
          </a>
          <span className="text-border">·</span>
          <Link href="/docs" className="hover:text-foreground">
            Docs
          </Link>
          <Link href="/docs#api" className="hover:text-foreground">
            API
          </Link>
          <Link href="/verify" className="hover:text-foreground">
            Verify a proof
          </Link>
        </div>
      </div>
    </footer>
  );
}
