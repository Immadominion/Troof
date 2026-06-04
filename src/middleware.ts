import { NextRequest, NextResponse } from "next/server";
import { paymentMiddleware } from "x402-next";

// x402 payment gate for the public Troof API (/api/v1/*).
// Enabled only when X402_PAY_TO is set, otherwise the endpoints stay open (dev/demo).
// Free testnet facilitator (x402.org) is the default; settlement in USDC.
const payTo = process.env.X402_PAY_TO as `0x${string}` | undefined;
const network = (process.env.X402_NETWORK as "base" | "base-sepolia") || "base-sepolia";

export const middleware = payTo
  ? paymentMiddleware(payTo, {
      "/api/v1/token/score": {
        price: "$0.01",
        network,
        config: { description: "Troof Score (A–F trust grade) for a Sui coin." },
      },
      "/api/v1/wallet": {
        price: "$0.02",
        network,
        config: { description: "Integrity-checked Sui wallet report." },
      },
      "/api/v1/seal": {
        price: "$0.05",
        network,
        config: { description: "Seal a verifiable Troof proof to Walrus + Sui." },
      },
    })
  : (_req: NextRequest) => NextResponse.next();

export const config = {
  // Only the paid endpoints. /api/v1/verify stays free and is intentionally excluded.
  matcher: ["/api/v1/token/score", "/api/v1/wallet", "/api/v1/seal"],
};
