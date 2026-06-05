import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A light browser-window frame that wraps a product visual (the web equivalent of
 * Oracle's phone mockups). Traffic-light dots are intentionally MONO, not red/yellow/green,
 * so they never compete with the sacred verdict colors.
 */
export function BrowserMock({
  url = "troof.site",
  glow = false,
  className,
  children,
}: {
  url?: string;
  glow?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative", className)}>
      {glow && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-brand/10 blur-3xl"
        />
      )}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-foreground/[0.06]">
        {/* chrome */}
        <div className="flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-center">
            <div className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1">
              <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
              <span className="artifact truncate text-[11px] text-muted-foreground">{url}</span>
            </div>
          </div>
          <div className="w-[42px]" aria-hidden />
        </div>
        {/* body */}
        <div className="bg-background p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}
