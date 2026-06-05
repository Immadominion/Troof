// Shared seal orchestration: build report → (embed AI verdict) → anchor hash on Sui → store on Walrus.
// Works for both wallet reports and token (Troof Score) reports. Used by /api/seal and the agent tools.
import { buildReport } from "./report";
import { buildTokenReport } from "./token";
import { buildTxReport } from "./tx";
import { anchorOnChain, ANCHOR_NETWORK } from "./anchor";
import { putBlob } from "./walrus";
import { hashCanonical } from "./canonical";
import { WALRUS, type Network } from "./constants";
import { dailyCap } from "./ratelimit";
import type {
  SealedProof,
  AiVerdict,
  ProofKind,
  WalletReport,
  TokenReport,
  TransactionReport,
} from "./types";

export interface SealResult {
  blobId: string;
  anchor: SealedProof["anchor"];
  contentHash: string;
  aggregator: string;
  proofUrl: string;
}

async function sealBundle(
  kind: ProofKind,
  subject: string,
  walletNetwork: Network,
  report: WalletReport | TokenReport | TransactionReport,
): Promise<SealResult> {
  // Global gas/storage ceiling — applied here so EVERY seal path (API route AND the AI agent's
  // seal tool) shares one cap and a single signer can't be drained in a day.
  if (!dailyCap("seal:global", 300)) {
    throw new Error("Daily seal limit reached. Try again later.");
  }
  const contentHash = await hashCanonical(report);
  const anchor = await anchorOnChain(contentHash, subject, walletNetwork);

  const sealed: SealedProof = {
    schema: "troof.proof/v1",
    kind,
    subject,
    report,
    contentHash,
    anchor: {
      network: anchor.network,
      anchorNetwork: ANCHOR_NETWORK,
      recordId: anchor.recordId,
      txDigest: anchor.txDigest,
      packageId: anchor.packageId,
      anchoredBy: anchor.anchoredBy,
    },
    sealedAt: new Date().toISOString(),
  };

  const epochs = ANCHOR_NETWORK === "mainnet" ? 5 : 10;
  const put = await putBlob(ANCHOR_NETWORK, JSON.stringify(sealed), epochs);
  return {
    blobId: put.blobId,
    anchor: sealed.anchor,
    contentHash,
    aggregator: WALRUS[ANCHOR_NETWORK].aggregator,
    proofUrl: `/p/${put.blobId}`,
  };
}

/** Seal a wallet report (embeds the AI verdict before hashing → "verifiable AI"). */
export async function sealProof(
  network: Network,
  address: string,
  ai: AiVerdict | null = null,
): Promise<SealResult> {
  const { report } = await buildReport(network, address);
  report.ai = ai;
  return sealBundle("wallet", address, network, report);
}

/** Seal a token report + its Troof Score. */
export async function sealToken(
  network: Network,
  coinType: string,
  ai: AiVerdict | null = null,
): Promise<SealResult> {
  const { report } = await buildTokenReport(network, coinType);
  report.ai = ai;
  return sealBundle("token", coinType, network, report);
}

/** Seal a transaction explanation (embeds the AI verdict before hashing). */
export async function sealTransaction(
  network: Network,
  digest: string,
  ai: AiVerdict | null = null,
): Promise<SealResult> {
  const { report } = await buildTxReport(network, digest);
  report.ai = ai;
  return sealBundle("transaction", digest, network, report);
}
