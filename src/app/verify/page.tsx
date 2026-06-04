"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTypingPlaceholder } from "@/lib/use-typing-placeholder";

const VERIFY_PLACEHOLDERS = ["troof.site/p/…", "a Walrus blob id…", "paste a proof to re-check it"];

/** Extract a blob id from a raw id or a full /p/{blobId} proof URL. */
function parseBlobId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  const urlMatch = s.match(/\/p\/([A-Za-z0-9_-]+)/);
  if (urlMatch) return urlMatch[1];
  if (/^[A-Za-z0-9_-]{20,}$/.test(s)) return s;
  return null;
}

export default function VerifyPage() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const placeholder = useTypingPlaceholder(VERIFY_PLACEHOLDERS);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const blobId = parseBlobId(value);
    if (!blobId) {
      toast.error("Paste a Troof proof link or a Walrus blob id.");
      return;
    }
    router.push(`/p/${blobId}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-20">
      <div className="text-center">
        <ShieldCheck className="mx-auto h-7 w-7 text-muted-foreground" />
        <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
          Verify a proof
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          Paste any Troof proof link or Walrus blob id. We re-fetch it from a
          public Walrus aggregator and re-check the hash against Sui, no trust
          in us required.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-10">
        <div className="rounded-xl border border-border bg-card/40 p-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="artifact h-12 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
              autoFocus
              spellCheck={false}
            />
            <Button type="submit" size="lg" className="h-12 shrink-0 font-medium">
              Verify <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
