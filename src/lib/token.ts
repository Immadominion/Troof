import { NETWORKS, type Network } from "./constants";
import { hashCanonical } from "./canonical";
import * as tatum from "./tatum";
import { computeTroofScore } from "./score";
import type { TokenReport, TokenProofBundle, ToolCall } from "./types";

const SUI_TYPE = "0x2::sui::SUI";

function toUi(raw: string, decimals: number): number {
  try {
    const big = BigInt(raw);
    const base = BigInt(10) ** BigInt(decimals);
    return Number(big / base) + Number(big % base) / Number(base);
  } catch {
    return 0;
  }
}

/** Build a token report + Troof Score from Tatum RPC signals (+ Exchange-Rate for canonical SUI). */
export async function buildTokenReport(
  network: Network,
  coinType: string,
): Promise<TokenProofBundle> {
  const toolCalls: ToolCall[] = [];
  async function track<T>(
    surface: ToolCall["surface"],
    method: string,
    fn: () => Promise<T>,
  ): Promise<T | null> {
    const t0 = performance.now();
    try {
      const r = await fn();
      toolCalls.push({ surface, method, ok: true, ms: Math.round(performance.now() - t0) });
      return r;
    } catch {
      toolCalls.push({ surface, method, ok: false, ms: Math.round(performance.now() - t0) });
      return null;
    }
  }

  const canonical = coinType === SUI_TYPE;

  const [meta, supply, checkpoint, suiUsd] = await Promise.all([
    track("tatum-rpc", "suix_getCoinMetadata", () => tatum.getCoinMetadata(network, coinType)),
    track("tatum-rpc", "suix_getTotalSupply", () => tatum.getTotalSupply(network, coinType)),
    track("tatum-rpc", "sui_getLatestCheckpointSequenceNumber", () => tatum.getLatestCheckpoint(network)),
    canonical
      ? track("tatum-data-api", "getExchangeRate(SUI)", () => tatum.getUsdRate("SUI"))
      : Promise.resolve(null),
  ]);

  const decimals = meta?.decimals ?? 9;
  const symbol = meta?.symbol ?? coinType.split("::").pop() ?? coinType;
  const name = meta?.name ?? symbol;
  const iconUrl = meta?.iconUrl ?? null;
  const totalSupply = supply?.value ?? null;
  const totalSupplyUi = totalSupply != null ? toUi(totalSupply, decimals) : null;

  // CoinMetadata object → mutability (owner === "Immutable" means frozen) + age (first tx).
  let metadataMutable: boolean | null = null;
  let firstSeenMs: number | null = null;
  if (meta?.id) {
    const obj = await track("tatum-rpc", "sui_getObject", () => tatum.getObject(network, meta.id!));
    const owner = obj?.data?.owner;
    if (owner !== undefined) metadataMutable = owner !== "Immutable";
    const prevTx = obj?.data?.previousTransaction;
    if (prevTx) {
      const tx = await track("tatum-rpc", "sui_getTransactionBlock", () =>
        tatum.getTransactionBlock(network, prevTx),
      );
      if (tx?.timestampMs) firstSeenMs = Number(tx.timestampMs);
    }
  }
  const ageDays = firstSeenMs != null ? (Date.now() - firstSeenMs) / 86_400_000 : null;

  const score = computeTroofScore({ coinType, symbol, canonical, ageDays, metadataMutable, totalSupply });

  const report: TokenReport = {
    schema: "troof.token/v1",
    network,
    coinType,
    symbol,
    name,
    decimals,
    iconUrl,
    canonical,
    totalSupply,
    totalSupplyUi,
    firstSeenMs,
    ageDays,
    metadataMutable,
    usd: canonical && suiUsd != null ? suiUsd : null,
    score,
    generatedAt: new Date().toISOString(),
    checkpoint: checkpoint ?? null,
    ai: null,
    evidence: { toolCalls, tatumGateway: NETWORKS[network].tatumRpc },
  };

  const contentHash = await hashCanonical(report);
  return { report, contentHash };
}
