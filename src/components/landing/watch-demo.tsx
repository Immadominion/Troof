"use client";

import Link from "next/link";
import { Play, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Set this when the demo video is recorded (e.g. a YouTube/Loom embed URL).
const DEMO_VIDEO = "";

export function WatchDemo({ className }: { className?: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "group inline-flex items-center gap-2.5 text-sm font-medium text-foreground transition-colors hover:text-foreground/70 2xl:gap-3 2xl:text-base",
            className,
          )}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-sm shadow-foreground/[0.05] transition-colors group-hover:border-foreground/25 2xl:h-14 2xl:w-14">
            <Play className="h-4 w-4 translate-x-px fill-current 2xl:h-5 2xl:w-5" />
          </span>
          Watch demo
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl overflow-hidden p-0">
        <DialogTitle className="sr-only">Troof demo</DialogTitle>
        <div className="relative aspect-video w-full bg-background">
          {DEMO_VIDEO ? (
            <iframe
              src={DEMO_VIDEO}
              title="Troof demo"
              className="absolute inset-0 h-full w-full"
              allow="accelerated-encoder; clipboard-write; encrypted-media; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-brand-ring bg-brand-soft text-brand">
                <Play className="h-5 w-5 translate-x-px fill-current" />
              </span>
              <div>
                <p className="text-base font-medium">The walkthrough is being recorded.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  In the meantime, the live demo is one click away. Ask anything and
                  seal a proof yourself.
                </p>
              </div>
              <Link
                href="/analyze"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground"
              >
                Try it live <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
