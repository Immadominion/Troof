import { NextRequest, NextResponse } from "next/server";
import { sealProof, sealToken } from "@/lib/seal";
import { anchorConfigured } from "@/lib/anchor";
import { NETWORKS, type Network } from "@/lib/constants";
import { isLikelySuiAddress } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST /api/v1/seal { kind: "wallet"|"token", network, address?, coinType? }  (x402-paid)
export async function POST(req: NextRequest) {
  if (!anchorConfigured())
    return NextResponse.json({ error: "Anchor not configured on this deployment" }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  const network = (body.network ?? "mainnet") as Network;
  const kind = body.kind === "token" ? "token" : "wallet";
  if (!(network in NETWORKS)) return NextResponse.json({ error: "Unknown network" }, { status: 400 });

  try {
    if (kind === "token") {
      const coinType = String(body.coinType ?? "").trim();
      if (!/^0x[0-9a-fA-F]+::[^:]+::.+/.test(coinType))
        return NextResponse.json({ error: "Invalid coinType" }, { status: 400 });
      return NextResponse.json(await sealToken(network, coinType));
    }
    const address = String(body.address ?? "").trim();
    if (!isLikelySuiAddress(address)) return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    return NextResponse.json(await sealProof(network, address));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Seal failed" }, { status: 500 });
  }
}
