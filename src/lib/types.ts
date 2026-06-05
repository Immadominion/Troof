import type { Network } from "./constants";

export interface CoinBalance {
  coinType: string;
  symbol: string;
  decimals: number;
  raw: string; // total balance in base units (string to avoid precision loss)
  ui: number; // human-readable amount
  usd: number | null; // valued via Tatum Exchange-Rate API when available
  objects: number; // number of coin objects (fragmentation)
}

export interface NftItem {
  objectId: string;
  type: string;
  name: string | null;
  imageUrl: string | null;
}

export interface StakeItem {
  validator: string;
  raw: string;
  ui: number;
  status: string;
}

export interface ActivityItem {
  digest: string;
  timestampMs: number | null;
  sender: string | null;
  success: boolean | null;
}

export interface RiskFlag {
  kind: string;
  detail: string;
  severity: "low" | "medium" | "high";
}

/** Every external call the report was built from, the auditable evidence trail. */
export interface ToolCall {
  surface: "tatum-rpc" | "tatum-data-api" | "tatum-mcp";
  method: string;
  ok: boolean;
  ms: number;
}

export interface AiVerdict {
  model: string;
  headline: string;
  summary: string;
  generatedAt: string;
}

/** The full evidence bundle. This object, canonicalized, is what gets sealed to Walrus
 *  and whose SHA-256 is anchored on Sui. Keep it JSON-stable and self-describing. */
export interface WalletReport {
  schema: "troof.report/v1";
  network: Network;
  wallet: string;
  suiNs: string | null;
  generatedAt: string;
  checkpoint: string | null;
  gasPrice: string | null;
  rates: { suiUsd: number | null };
  totals: { coinTypes: number; nfts: number; usd: number };
  balances: CoinBalance[];
  nfts: NftItem[];
  stakes: StakeItem[];
  activity: ActivityItem[];
  riskFlags: RiskFlag[];
  ai: AiVerdict | null; // filled in Phase 4 (AI agent)
  evidence: { toolCalls: ToolCall[]; tatumGateway: string };
}

/** A report plus its integrity hash. The hash is what we anchor on Sui. */
export interface ProofBundle {
  report: WalletReport;
  contentHash: string; // sha256(canonicalize(report))
}

// ---- Token reports + the Troof Score ----

export interface TroofScoreLineItem {
  pillar: string;
  penalty: number;
  detail: string;
  field: string; // the raw on-chain field this penalty was derived from
}

export interface TroofScore {
  grade: "A" | "B" | "C" | "D" | "F";
  score: number; // 0–100
  lineItems: TroofScoreLineItem[];
  rubricVersion: string;
  unverifiable: string[]; // signals we honestly cannot check via RPC
}

export interface TokenReport {
  schema: "troof.token/v1";
  network: Network;
  coinType: string;
  symbol: string;
  name: string;
  decimals: number;
  iconUrl: string | null;
  canonical: boolean; // === 0x2::sui::SUI
  totalSupply: string | null;
  totalSupplyUi: number | null;
  firstSeenMs: number | null;
  ageDays: number | null;
  metadataMutable: boolean | null;
  usd: number | null; // only for canonical SUI
  score: TroofScore;
  generatedAt: string;
  checkpoint: string | null;
  ai: AiVerdict | null;
  evidence: { toolCalls: ToolCall[]; tatumGateway: string };
}

export interface TokenProofBundle {
  report: TokenReport;
  contentHash: string;
}

// ---- Transaction reports ("explain a transaction") ----

export interface TxBalanceChange {
  owner: string | null; // address, "Shared", "Immutable", or null
  coinType: string;
  symbol: string;
  amount: string; // signed raw amount (base units)
  ui: number; // signed human amount
  usd: number | null; // only for canonical 0x2::sui::SUI
  canonicalSui: boolean;
}

export interface TxMoveCall {
  package: string;
  module: string;
  function: string;
}

export interface TxObjectSummary {
  created: number;
  mutated: number;
  transferred: number;
  deleted: number;
  published: number;
  wrapped: number;
}

/** A plain-English-ready summary of a Sui transaction, built from Tatum RPC. */
export interface TransactionReport {
  schema: "troof.tx/v1";
  network: Network;
  digest: string;
  status: "success" | "failure";
  error: string | null;
  sender: string | null;
  timestampMs: number | null;
  checkpoint: string | null;
  kind: string; // human label, e.g. "Move call · clob::place_order"
  gas: { computation: string; storage: string; rebate: string; netMist: string; netSui: number };
  balanceChanges: TxBalanceChange[]; // what tokens/SUI moved
  moveCalls: TxMoveCall[]; // contracts called
  objectSummary: TxObjectSummary;
  eventCount: number;
  eventTypes: string[]; // distinct event types (top few)
  riskFlags: RiskFlag[];
  ai: AiVerdict | null;
  generatedAt: string;
  evidence: { toolCalls: ToolCall[]; tatumGateway: string };
}

export interface TransactionProofBundle {
  report: TransactionReport;
  contentHash: string;
}

export interface AnchorRef {
  network: Network; // network of the analyzed wallet (stored in the Record)
  anchorNetwork: Network; // where the Record + blob live (testnet during dev)
  recordId: string;
  txDigest: string;
  packageId: string;
  anchoredBy: string;
}

export type ProofKind = "wallet" | "token" | "transaction";

/** The object sealed to Walrus. contentHash is sha256(canonicalize(report)); the same hash
 *  is anchored on-chain (anchor.recordId). Tampering with `report` breaks both checks.
 *  `kind` discriminates wallet vs token reports (older proofs without it are wallets). */
export interface SealedProof {
  schema: "troof.proof/v1";
  kind: ProofKind;
  subject: string; // wallet address, coin type, or transaction digest
  report: WalletReport | TokenReport | TransactionReport;
  contentHash: string;
  anchor: AnchorRef;
  sealedAt: string;
}
