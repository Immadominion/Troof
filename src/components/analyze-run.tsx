"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportView } from "@/components/report-view";
import { shortAddress } from "@/lib/format";
import type { Network } from "@/lib/constants";
import type { ProofBundle } from "@/lib/types";

async function fetchReport(network: Network, address: string): Promise<ProofBundle> {
  const res = await fetch(`/api/report?network=${network}&address=${address}`);
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error ?? `Report failed (HTTP ${res.status})`);
  }
  return res.json();
}

export function AnalyzeRun({ network, address }: { network: Network; address: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["report", network, address],
    queryFn: () => fetchReport(network, address),
    staleTime: 5 * 60_000,
    retry: 0,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-16">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>
            Reading <span className="artifact text-foreground/80">{shortAddress(address)}</span> live
            through Tatum…
          </span>
        </div>
        <div className="mt-8 space-y-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-56 rounded-xl" />
            <Skeleton className="h-56 rounded-xl" />
          </div>
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <TriangleAlert className="mx-auto h-7 w-7 text-muted-foreground" />
        <h1 className="mt-5 text-xl font-semibold tracking-tight">Couldn&apos;t build the report</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Something went wrong."}
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/analyze">Try another wallet</Link>
        </Button>
      </div>
    );
  }

  return <ReportView bundle={data} />;
}
