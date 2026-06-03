import { NextResponse } from "next/server";
import { getBlobText } from "@/lib/walrus";
import { hashCanonical } from "@/lib/canonical";
import { getObject } from "@/lib/tatum";
import { DEFAULT_NETWORK } from "@/lib/constants";
import type { SealedProof } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/verify/:blobId  (FREE) — re-fetch from a public Walrus aggregator,
// re-hash, and compare against the on-chain anchored hash. Server-side mirror of /p.
export async function GET(_req: Request, { params }: { params: Promise<{ blobId: string }> }) {
  const { blobId } = await params;
  if (!/^[A-Za-z0-9_-]{10,}$/.test(blobId))
    return NextResponse.json({ error: "Invalid blobId" }, { status: 400 });

  try {
    const sealed = JSON.parse(await getBlobText(DEFAULT_NETWORK, blobId)) as SealedProof;
    if (sealed.schema !== "troof.proof/v1")
      return NextResponse.json({ error: "Not a Troof proof" }, { status: 422 });

    const recomputed = await hashCanonical(sealed.report);
    const anchorNet = sealed.anchor.anchorNetwork ?? DEFAULT_NETWORK;
    const obj = await getObject(anchorNet, sealed.anchor.recordId, { showContent: true });
    const fields = obj?.data?.content?.fields as { content_hash?: string } | undefined;
    const onChainHash = fields?.content_hash ?? null;

    const verified =
      onChainHash != null && recomputed === onChainHash && recomputed === sealed.contentHash;

    return NextResponse.json({
      blobId,
      kind: sealed.kind ?? "wallet",
      subject: sealed.subject,
      verdict: verified ? "verified" : "tampered",
      recomputedHash: recomputed,
      onChainHash,
      anchor: { recordId: sealed.anchor.recordId, txDigest: sealed.anchor.txDigest, network: anchorNet },
      sealedAt: sealed.sealedAt,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "verify failed" }, { status: 500 });
  }
}
