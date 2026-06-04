import { NextRequest, NextResponse } from "next/server";
import { buildReport } from "@/lib/report";
import { NETWORKS, type Network } from "@/lib/constants";
import { isLikelySuiAddress } from "@/lib/format";
import { rateLimit, clientIp, tooMany } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/report?network=testnet&address=0x… → { report, contentHash }
export async function GET(req: NextRequest) {
  const rl = rateLimit(`report:${clientIp(req)}`, 20, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const sp = req.nextUrl.searchParams;
  const network = (sp.get("network") ?? "testnet") as Network;
  const address = (sp.get("address") ?? "").trim();

  if (!(network in NETWORKS)) {
    return NextResponse.json({ error: "Unknown network" }, { status: 400 });
  }
  if (!isLikelySuiAddress(address)) {
    return NextResponse.json({ error: "Invalid Sui address" }, { status: 400 });
  }

  try {
    const bundle = await buildReport(network, address);
    return NextResponse.json(bundle);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Report build failed" },
      { status: 500 },
    );
  }
}
