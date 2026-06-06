import { NextRequest, NextResponse } from "next/server";
import { sealProof, sealToken, sealTransaction } from "@/lib/seal";
import { anchorConfigured } from "@/lib/anchor";
import { NETWORKS, type Network } from "@/lib/constants";
import { isLikelySuiAddress } from "@/lib/format";
import { rateLimit, clientIp, tooMany } from "@/lib/ratelimit";
import type { AiVerdict } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST /api/seal { kind, network, subject, headline?, summary? } → { blobId, proofUrl, anchor, ... }
//   kind: "wallet" | "token" | "transaction";  subject: address | coinType | tx digest
//
// This is the dedicated seal endpoint the chat client calls AFTER the answer renders, so the
// slow anchor-on-Sui + Walrus write gets its own fresh request budget instead of being killed
// mid-stream inside the long agent response. headline/summary embed the AI verdict (verifiable AI).
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
  if (!(network in NETWORKS)) return NextResponse.json({ error: "Unknown network" }, { status: 400 });

  const kind = body.kind === "token" || body.kind === "transaction" ? body.kind : "wallet";
  // `address` kept for backward-compat with the deterministic /analyze/[network]/[address] seal button.
  const subject = String(body.subject ?? body.address ?? body.coinType ?? body.digest ?? "").trim();

  // Embed the AI's verdict in the sealed bundle ("verifiable AI") when provided.
  const ai: AiVerdict | null =
    body.headline || body.summary
      ? {
          model: "Troof agent (Claude)",
          headline: String(body.headline ?? ""),
          summary: String(body.summary ?? ""),
          generatedAt: new Date().toISOString(),
        }
      : null;

  // The connected wallet that gets this proof in its on-chain history (or null if anonymous).
  const sealedFor = typeof body.sealedFor === "string" ? body.sealedFor : null;

  try {
    if (kind === "token") {
      if (!/^0x[0-9a-fA-F]+::[^:]+::.+/.test(subject))
        return NextResponse.json({ error: "Invalid coinType" }, { status: 400 });
      return NextResponse.json(await sealToken(network, subject, ai, sealedFor));
    }
    if (kind === "transaction") {
      if (!/^[A-Za-z0-9]{32,50}$/.test(subject))
        return NextResponse.json({ error: "Invalid transaction digest" }, { status: 400 });
      return NextResponse.json(await sealTransaction(network, subject, ai, sealedFor));
    }
    if (!isLikelySuiAddress(subject)) return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    return NextResponse.json(await sealProof(network, subject, ai, sealedFor));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Seal failed" }, { status: 500 });
  }
}
