import { NextRequest, NextResponse } from "next/server";
import { buildTokenReport } from "@/lib/token";
import { NETWORKS, type Network } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET /api/v1/token/score?coinType=0x…::mod::SYM&network=mainnet  (x402-paid)
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const network = (sp.get("network") ?? "mainnet") as Network;
  const coinType = (sp.get("coinType") ?? "").trim();
  if (!(network in NETWORKS)) return NextResponse.json({ error: "Unknown network" }, { status: 400 });
  if (!/^0x[0-9a-fA-F]+::[^:]+::.+/.test(coinType))
    return NextResponse.json({ error: "Invalid coinType (expected 0x…::module::SYMBOL)" }, { status: 400 });
  try {
    const { report } = await buildTokenReport(network, coinType);
    return NextResponse.json(report);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "failed" }, { status: 500 });
  }
}
