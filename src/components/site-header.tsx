import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TroofWordmark } from "@/components/troof-mark";

const NAV = [
  { href: "/analyze", label: "Analyze" },
  { href: "/verify", label: "Verify" },
  { href: "/#how", label: "How it works" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-5">
        <Link href="/" className="shrink-0 text-foreground transition-opacity hover:opacity-80">
          <TroofWordmark />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild size="sm" className="font-medium">
            <Link href="/analyze">Analyze a wallet</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
