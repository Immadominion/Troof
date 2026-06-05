"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TroofWordmark } from "@/components/troof-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { WalletButton } from "@/components/wallet-button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/analyze", label: "Terminal" },
  { href: "/docs", label: "Docs" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/70 backdrop-blur-xl">
      <div className="relative mx-auto flex h-16 w-full max-w-[1400px] items-center px-6 lg:px-10 2xl:max-w-[1560px]">
        {/* left: brand */}
        <Link href="/" className="shrink-0 text-foreground transition-opacity hover:opacity-80">
          <TroofWordmark />
        </Link>

        {/* center: nav (truly centered, independent of side widths) */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* right: controls */}
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <span id="tour-connect">
            <WalletButton />
          </span>
        </div>
      </div>
    </header>
  );
}
