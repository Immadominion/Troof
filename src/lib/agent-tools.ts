// Local AI-SDK tools backed by Troof's own Tatum-powered engine. These ground the agent's
// verdict in integrity-checked data and perform the seal. They also serve as the deploy
// fallback when the Tatum stdio MCP can't run (e.g. serverless).
import { tool } from "ai";
import { z } from "zod";
import { buildReport } from "./report";
import { buildTokenReport } from "./token";
import { buildTxReport } from "./tx";
import { sealProof, sealToken, sealTransaction } from "./seal";
import type { Network } from "./constants";

const networkSchema = z.enum(["mainnet", "testnet"]);

export const analyzeWalletTool = tool({
  description:
    "Fetch an integrity-checked snapshot of a Sui wallet built from Tatum RPC + Exchange-Rate: SUI balance valued in USD (canonical 0x2::sui::SUI only), top coins, NFT count, staking, recent activity, and risk flags (incl. tokens that impersonate the SUI symbol). Call this FIRST to ground your verdict in real data.",
  inputSchema: z.object({
    network: networkSchema.describe("Sui network the wallet is on"),
    address: z.string().describe("0x… Sui wallet address"),
  }),
  execute: async ({ network, address }) => {
    const { report } = await buildReport(network as Network, address);
    return {
      wallet: report.wallet,
      suiNs: report.suiNs,
      totalUsd: report.totals.usd,
      coinTypes: report.totals.coinTypes,
      nftCount: report.totals.nfts,
      topBalances: report.balances.slice(0, 6).map((b) => ({
        symbol: b.symbol,
        amount: b.ui,
        usd: b.usd,
        canonicalSui: b.coinType === "0x2::sui::SUI",
      })),
      stakeCount: report.stakes.length,
      activityCount: report.activity.length,
      riskFlags: report.riskFlags,
      checkpoint: report.checkpoint,
    };
  },
});

export const sealProofTool = tool({
  description:
    "Seal a verifiable proof of your analysis: rebuilds the report, embeds your verdict, anchors its SHA-256 on Sui, and stores it on Walrus. Returns a shareable proof URL. Call this ONLY after analyze_wallet and after writing a clear verdict.",
  inputSchema: z.object({
    network: networkSchema,
    address: z.string(),
    headline: z.string().describe("one-line verdict, e.g. 'Active wallet ~$82 in SUI; 4 impersonator tokens flagged'"),
    summary: z.string().describe("2–4 sentence plain-English analysis a human can read"),
  }),
  execute: async ({ network, address, headline, summary }) => {
    const r = await sealProof(network as Network, address, {
      model: "Troof agent (Claude)",
      headline,
      summary,
      generatedAt: new Date().toISOString(),
    });
    return {
      proofUrl: r.proofUrl,
      blobId: r.blobId,
      contentHash: r.contentHash,
      recordId: r.anchor.recordId,
      txDigest: r.anchor.txDigest,
      kind: "wallet",
      subject: address,
      network,
      headline,
    };
  },
});

export const analyzeTokenTool = tool({
  description:
    "Analyze a Sui coin/token: fetch its metadata, total supply, age, and metadata-mutability via Tatum RPC, and compute its Troof Score (an A–F trust grade). It flags tokens that impersonate the canonical SUI symbol. Call this when the user gives a coin type (0x…::module::SYMBOL) or asks whether a token is real / safe / a scam / an impersonator.",
  inputSchema: z.object({
    network: networkSchema,
    coinType: z.string().describe("Sui coin type, e.g. 0x2::sui::SUI or 0x…::coin::COIN"),
  }),
  execute: async ({ network, coinType }) => {
    const { report } = await buildTokenReport(network as Network, coinType);
    // Return the full report (minus noisy evidence) so the chat can render the Troof Score card.
    return { ...report, evidence: undefined };
  },
});

export const sealTokenTool = tool({
  description:
    "Seal a verifiable proof of a token's Troof Score: anchors the score's hash on Sui and stores the full scoring bundle on Walrus. Call after analyze_token, with a one-line headline and short summary. Returns a proof URL.",
  inputSchema: z.object({
    network: networkSchema,
    coinType: z.string(),
    headline: z.string().describe("one-line verdict, e.g. 'Impersonator of SUI, Troof Score F'"),
    summary: z.string().describe("2–4 sentence plain-English summary"),
  }),
  execute: async ({ network, coinType, headline, summary }) => {
    const r = await sealToken(network as Network, coinType, {
      model: "Troof agent (Claude)",
      headline,
      summary,
      generatedAt: new Date().toISOString(),
    });
    return {
      proofUrl: r.proofUrl,
      blobId: r.blobId,
      contentHash: r.contentHash,
      recordId: r.anchor.recordId,
      kind: "token",
      subject: coinType,
      network,
      headline,
    };
  },
});

export const analyzeTransactionTool = tool({
  description:
    "Explain a Sui transaction in plain English. Fetches its full detail via Tatum RPC (status, sender, gas spent, token/SUI movements, the contracts/functions it called, objects changed, and events) and returns a structured summary. Call this when the user gives a transaction digest (a base58 string, NOT a 0x address) or asks what a transaction / tx did.",
  inputSchema: z.object({
    network: networkSchema,
    digest: z.string().describe("Sui transaction digest (base58, e.g. 'DZfCuQKR…')"),
  }),
  execute: async ({ network, digest }) => {
    const { report } = await buildTxReport(network as Network, digest);
    // Drop the noisy evidence trail from the chat payload (kept in the sealed bundle).
    return { ...report, evidence: undefined };
  },
});

export const sealTransactionTool = tool({
  description:
    "Seal a verifiable proof of a transaction explanation: anchors its hash on Sui and stores the bundle on Walrus. Call after analyze_transaction, with a one-line headline + short summary. Returns a proof URL.",
  inputSchema: z.object({
    network: networkSchema,
    digest: z.string(),
    headline: z.string().describe("one-line summary, e.g. 'DeepBook order placed; 0.0016 SUI gas'"),
    summary: z.string().describe("2–4 sentence plain-English explanation of what the transaction did"),
  }),
  execute: async ({ network, digest, headline, summary }) => {
    const r = await sealTransaction(network as Network, digest, {
      model: "Troof agent (Claude)",
      headline,
      summary,
      generatedAt: new Date().toISOString(),
    });
    return {
      proofUrl: r.proofUrl,
      blobId: r.blobId,
      contentHash: r.contentHash,
      recordId: r.anchor.recordId,
      kind: "transaction",
      subject: digest,
      network,
      headline,
    };
  },
});

export const localAgentTools = {
  analyze_wallet: analyzeWalletTool,
  seal_wallet_proof: sealProofTool,
  analyze_token: analyzeTokenTool,
  seal_token_proof: sealTokenTool,
  analyze_transaction: analyzeTransactionTool,
  seal_transaction_proof: sealTransactionTool,
};
