import { NextRequest, NextResponse } from "next/server";
import { NETWORKS, type Network } from "@/lib/constants";
import { rateLimit, clientIp, tooMany } from "@/lib/ratelimit";

export const runtime = "nodejs";

// Read-only Sui RPC methods this app actually needs. Everything else is rejected so /api/rpc
// can't be abused as a free, general-purpose Tatum proxy on our key.
const ALLOWED = new Set([
  "sui_getObject", "sui_multiGetObjects", "sui_getTransactionBlock", "sui_getChainIdentifier",
  "sui_getLatestCheckpointSequenceNumber", "suix_getReferenceGasPrice", "suix_getAllBalances",
  "suix_getCoinMetadata", "suix_getTotalSupply", "suix_getOwnedObjects", "suix_getStakes",
  "suix_queryTransactionBlocks", "suix_queryEvents", "suix_resolveNameServiceNames",
  "sui_getNormalizedMoveModulesByPackage", "suix_getCommitteeInfo", "sui_getProtocolConfig",
]);

// Server-side Sui RPC proxy (key injected server-side). Used by the client proof verifier.
export async function POST(req: NextRequest) {
  const rl = rateLimit(`rpc:${clientIp(req)}`, 40, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  const network = (req.nextUrl.searchParams.get("network") ?? "testnet") as Network;
  if (!(network in NETWORKS)) return NextResponse.json({ error: "Unknown network" }, { status: 400 });

  const body = await req.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const calls = Array.isArray(parsed) ? parsed : [parsed];
  if (calls.length > 5) return NextResponse.json({ error: "Too many calls" }, { status: 400 });
  for (const c of calls) {
    const method = (c as { method?: string })?.method;
    if (!method || !ALLOWED.has(method)) {
      return NextResponse.json({ error: `Method not allowed: ${method ?? "(none)"}` }, { status: 403 });
    }
  }

  const res = await fetch(NETWORKS[network].tatumRpc, {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": process.env.TATUM_API_KEY ?? "" },
    body,
    cache: "no-store",
  });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { "content-type": "application/json" } });
}
