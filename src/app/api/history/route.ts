import { NextRequest, NextResponse } from "next/server";
import { queryEvents } from "@/lib/tatum";
import { ANCHOR_NETWORK } from "@/lib/anchor";
import { rateLimit, clientIp, tooMany } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PACKAGE = process.env.TROOF_ANCHOR_PACKAGE;

// Normalize a Sui address for exact-match comparison (zero-pad to 32 bytes, lowercase).
function norm(a: string): string {
  const hex = a.replace(/^0x/i, "").toLowerCase();
  return hex.length > 0 && hex.length <= 64 && /^[0-9a-f]+$/.test(hex)
    ? "0x" + hex.padStart(64, "0")
    : "";
}

type Row = { blobId: string; proofUrl: string; kind: string; subject: string; ts: number };

// GET /api/history?address=0x… → a wallet's sealed proofs, reconstructed from Sui `Sealed`
// events. The heavy data lives on Walrus (/p/<blobId>); this is the on-chain index — no database.
export async function GET(req: NextRequest) {
  const rl = rateLimit(`history:${clientIp(req)}`, 30, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);
  if (!PACKAGE) return NextResponse.json({ proofs: [] });

  const want = norm(req.nextUrl.searchParams.get("address") ?? "");
  if (!want) return NextResponse.json({ proofs: [] });

  const eventType = `${PACKAGE}::anchor::Sealed`;
  const proofs: Row[] = [];
  const seen = new Set<string>();
  let cursor: unknown = null;
  try {
    // Sui can't filter events by struct field, so scan recent events (bounded) and keep the
    // ones sealed for this wallet. Fine at hackathon volume; cache makes repeat loads instant.
    for (let i = 0; i < 4; i++) {
      const page = await queryEvents(ANCHOR_NETWORK, eventType, cursor, 50);
      for (const e of page.data) {
        const p = e.parsedJson as
          | { blob_id?: string; kind?: string; subject?: string; sealed_for?: string }
          | undefined;
        if (!p?.blob_id || seen.has(p.blob_id)) continue;
        if (norm(p.sealed_for ?? "") !== want) continue;
        seen.add(p.blob_id);
        proofs.push({
          blobId: p.blob_id,
          proofUrl: `/p/${p.blob_id}`,
          kind: p.kind === "token" || p.kind === "transaction" ? p.kind : "wallet",
          subject: p.subject ?? "",
          ts: e.timestampMs ? Number(e.timestampMs) : 0,
        });
      }
      if (!page.hasNextPage) break;
      cursor = page.nextCursor;
    }
  } catch {
    /* chain hiccup → return whatever we gathered */
  }
  return NextResponse.json({ proofs });
}
