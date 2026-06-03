// Troof Score — a transparent, RPC-grounded trust grade for a Sui coin.
// Start at 100, subtract named penalties (each citing the raw on-chain field it came from),
// map to A–F. Signals that need an indexer/oracle are surfaced as "unverifiable", never faked.
import type { TroofScore, TroofScoreLineItem } from "./types";

export const RUBRIC_VERSION = "troof_score_v1";
const SUI_TYPE = "0x2::sui::SUI";

// Symbols whose canonical coin type we are CERTAIN of — used to catch impersonators.
const CANONICAL: Record<string, string> = { SUI: SUI_TYPE };

export interface ScoreSignals {
  coinType: string;
  symbol: string;
  canonical: boolean;
  ageDays: number | null;
  metadataMutable: boolean | null;
  totalSupply: string | null;
}

export function computeTroofScore(s: ScoreSignals): TroofScore {
  const items: TroofScoreLineItem[] = [];
  let score = 100;
  const sub = (penalty: number, pillar: string, detail: string, field: string) => {
    items.push({ pillar, penalty, detail, field });
    score += penalty;
  };

  // 1) Identity / canonicity — max −40. Impersonating a canonical symbol is a critical fail.
  const sym = (s.symbol ?? "").toUpperCase();
  let impersonator = false;
  if (s.canonical) {
    sub(0, "Identity", "Canonical 0x2::sui::SUI — the real SUI.", "coinType");
  } else if (CANONICAL[sym] && CANONICAL[sym] !== s.coinType) {
    impersonator = true;
    sub(-40, "Identity", `Claims the "${s.symbol}" symbol but is not canonical ${CANONICAL[sym]} — impersonator (critical).`, "coinType");
  } else {
    sub(0, "Identity", "Does not impersonate a known canonical symbol.", "symbol");
  }

  // 2) Age / provenance — max −15
  if (s.ageDays == null) sub(-5, "Age", "First-seen time could not be resolved.", "previousTransaction");
  else if (s.ageDays < 1) sub(-15, "Age", `Created less than 24h ago (${s.ageDays.toFixed(1)}d).`, "previousTransaction");
  else if (s.ageDays < 7) sub(-10, "Age", `Created less than 7 days ago (${s.ageDays.toFixed(1)}d).`, "previousTransaction");
  else if (s.ageDays < 30) sub(-5, "Age", `Created within the last 30 days (~${Math.round(s.ageDays)}d).`, "previousTransaction");
  else sub(0, "Age", `Established (~${Math.round(s.ageDays)}d old).`, "previousTransaction");

  // 3) Metadata mutability — max −10
  if (s.metadataMutable == null) sub(-5, "Metadata", "Metadata mutability could not be determined.", "owner");
  else if (s.metadataMutable) sub(-10, "Metadata", "CoinMetadata is mutable — name/icon can be changed after launch.", "owner");
  else sub(0, "Metadata", "CoinMetadata is frozen (immutable).", "owner");

  // 4) Supply transparency — max −10
  if (s.totalSupply == null) sub(-10, "Supply", "Total supply not retrievable on-chain.", "totalSupply");
  else sub(0, "Supply", "Total supply is readable on-chain.", "totalSupply");

  // Impersonating canonical SUI is a definitive scam → hard-cap to a failing grade.
  if (impersonator) score = Math.min(score, 25);

  score = Math.max(0, Math.min(100, score));
  const grade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F";

  return {
    grade,
    score,
    lineItems: items,
    rubricVersion: RUBRIC_VERSION,
    unverifiable: [
      "Holder distribution (needs an indexer)",
      "Liquidity / market depth (needs a DEX or oracle)",
      "Mint-authority renouncement (needs a TreasuryCap trace)",
    ],
  };
}
