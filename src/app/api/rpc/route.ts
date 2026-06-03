import { NextRequest, NextResponse } from "next/server";
import { NETWORKS, type Network } from "@/lib/constants";

export const runtime = "nodejs";

// Server-side Sui RPC proxy. Lets a client SuiClient / dapp-kit (Phase 3) talk to Tatum
// without ever seeing the API key. POST the raw JSON-RPC body; we inject x-api-key.
export async function POST(req: NextRequest) {
  const network = (req.nextUrl.searchParams.get("network") ?? "testnet") as Network;
  if (!(network in NETWORKS)) {
    return NextResponse.json({ error: "Unknown network" }, { status: 400 });
  }
  const body = await req.text();
  const res = await fetch(NETWORKS[network].tatumRpc, {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": process.env.TATUM_API_KEY ?? "" },
    body,
    cache: "no-store",
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}
