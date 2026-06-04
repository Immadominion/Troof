import { NextRequest, NextResponse } from "next/server";
import { sealProof } from "@/lib/seal";
import { anchorConfigured } from "@/lib/anchor";
import { NETWORKS, type Network } from "@/lib/constants";
import { isLikelySuiAddress } from "@/lib/format";
import { rateLimit, clientIp, tooMany } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST /api/seal { network, address } → builds + anchors + seals → { blobId, anchor, contentHash }
export async function POST(req: NextRequest) {
  // Sealing spends the server signer's gas + Walrus storage → strict per-IP + global daily caps.
  const rl = rateLimit(`seal:${clientIp(req)}`, 5, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);
  if (!anchorConfigured()) {
    return NextResponse.json(
      { error: "Anchor not configured yet, run scripts/deploy-anchor.mjs to publish the Move package." },
      { status: 503 },
    );
  }
  const body = await req.json().catch(() => ({}));
  const network = (body.network ?? "testnet") as Network;
  const address = String(body.address ?? "").trim();
  if (!(network in NETWORKS)) return NextResponse.json({ error: "Unknown network" }, { status: 400 });
  if (!isLikelySuiAddress(address)) return NextResponse.json({ error: "Invalid address" }, { status: 400 });

  try {
    const result = await sealProof(network, address);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Seal failed" }, { status: 500 });
  }
}
