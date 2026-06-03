import { NextRequest, NextResponse } from "next/server";
import { buildReport } from "@/lib/report";
import { NETWORKS, type Network } from "@/lib/constants";
import { isLikelySuiAddress } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET /api/v1/wallet?address=0x…&network=mainnet  (x402-paid)
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const network = (sp.get("network") ?? "mainnet") as Network;
  const address = (sp.get("address") ?? "").trim();
  if (!(network in NETWORKS)) return NextResponse.json({ error: "Unknown network" }, { status: 400 });
  if (!isLikelySuiAddress(address)) return NextResponse.json({ error: "Invalid Sui address" }, { status: 400 });
  try {
    const bundle = await buildReport(network, address);
    return NextResponse.json(bundle);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "failed" }, { status: 500 });
  }
}
