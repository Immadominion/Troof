import { NETWORKS, type Network } from "./constants";
import { hashCanonical } from "./canonical";
import * as tatum from "./tatum";
import type {
  WalletReport,
  ProofBundle,
  ToolCall,
  CoinBalance,
  NftItem,
  StakeItem,
  ActivityItem,
  RiskFlag,
} from "./types";

const SUI_TYPE = "0x2::sui::SUI";

function symbolFromType(coinType: string): string {
  const parts = coinType.split("::");
  return (parts[parts.length - 1] || coinType).toUpperCase();
}

function toUi(raw: string, decimals: number): number {
  try {
    const big = BigInt(raw);
    const base = BigInt(10) ** BigInt(decimals);
    const whole = Number(big / base);
    const frac = Number(big % base) / Number(base);
    return whole + frac;
  } catch {
    return 0;
  }
}

/** Build the full evidence bundle for a wallet. Each external call is timed and recorded
 *  in `evidence.toolCalls`. Individual failures degrade gracefully (partial report). */
export async function buildReport(
  network: Network,
  wallet: string,
): Promise<ProofBundle> {
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

  // Fire the independent reads concurrently.
  const [gasPrice, checkpoint, nsRes, rawBalances, owned, stakesRaw, txPage, suiUsd] =
    await Promise.all([
      track("tatum-rpc", "suix_getReferenceGasPrice", () => tatum.getReferenceGasPrice(network)),
      track("tatum-rpc", "sui_getLatestCheckpointSequenceNumber", () =>
        tatum.getLatestCheckpoint(network),
      ),
      track("tatum-rpc", "suix_resolveNameServiceNames", () =>
        tatum.resolveNameServiceNames(network, wallet),
      ),
      track("tatum-rpc", "suix_getAllBalances", () => tatum.getAllBalances(network, wallet)),
      track("tatum-rpc", "suix_getOwnedObjects", () => tatum.getOwnedObjects(network, wallet)),
      track("tatum-rpc", "suix_getStakes", () => tatum.getStakes(network, wallet)),
      track("tatum-rpc", "suix_queryTransactionBlocks", () =>
        tatum.queryTransactionBlocks(network, wallet),
      ),
      track("tatum-data-api", "getExchangeRate(SUI)", () => tatum.getUsdRate("SUI")),
    ]);

  // ---- Balances (+ metadata for decimals/symbol, capped to keep RPS sane) ----
  // Pin canonical SUI first (scam coins have absurd supplies and would otherwise bury it),
  // then the rest by raw balance.
  const all = rawBalances ?? [];
  const suiBal = all.find((b) => b.coinType === SUI_TYPE);
  const rest = all
    .filter((b) => b.coinType !== SUI_TYPE)
    .sort((a, b) => {
      try {
        return BigInt(b.totalBalance) > BigInt(a.totalBalance) ? 1 : -1;
      } catch {
        return 0;
      }
    });
  const top = [...(suiBal ? [suiBal] : []), ...rest].slice(0, 12);

  const balances: CoinBalance[] = [];
  for (const b of top) {
    const isSui = b.coinType === SUI_TYPE;
    const meta = isSui
      ? { decimals: 9, symbol: "SUI", name: "Sui" }
      : (await track("tatum-rpc", "suix_getCoinMetadata", () =>
          tatum.getCoinMetadata(network, b.coinType),
        )) ?? null;
    const decimals = meta?.decimals ?? 9;
    const symbol = meta?.symbol ?? symbolFromType(b.coinType);
    const ui = toUi(b.totalBalance, decimals);

    // Value ONLY canonical SUI (0x2::sui::SUI). Scam tokens spoof popular symbols, so
    // pricing by symbol would let an impersonator inflate the total. A verifiable product
    // never trusts a symbol, only the canonical coin type. (USD via Tatum Exchange-Rate API.)
    const usd = isSui && suiUsd != null ? Number((ui * suiUsd).toFixed(2)) : null;

    balances.push({
      coinType: b.coinType,
      symbol,
      decimals,
      raw: b.totalBalance,
      ui,
      usd,
      objects: b.coinObjectCount,
    });
  }

  // ---- NFTs (owned objects that expose a display image) ----
  const nfts: NftItem[] = [];
  for (const o of owned?.data ?? []) {
    const d = o.data;
    const disp = d?.display?.data ?? null;
    const imageUrl =
      disp?.image_url ?? disp?.image ?? disp?.img_url ?? disp?.image_uri ?? null;
    if (d && imageUrl) {
      nfts.push({
        objectId: d.objectId,
        type: d.type ?? "",
        name: disp?.name ?? null,
        imageUrl,
      });
    }
    if (nfts.length >= 12) break;
  }

  // ---- Stakes ----
  const stakes: StakeItem[] = [];
  for (const entry of stakesRaw ?? []) {
    for (const s of entry.stakes ?? []) {
      stakes.push({
        validator: entry.validatorAddress,
        raw: s.principal,
        ui: toUi(s.principal, 9),
        status: s.status,
      });
    }
  }

  // ---- Activity ----
  const activity: ActivityItem[] = (txPage?.data ?? []).map((t) => ({
    digest: t.digest,
    timestampMs: t.timestampMs ? Number(t.timestampMs) : null,
    sender: t.transaction?.data?.sender ?? null,
    success: t.effects?.status?.status ? t.effects.status.status === "success" : null,
  }));

  // ---- Lightweight risk heuristics (derived from RPC data; Tatum's malicious-address
  //      Data API is EVM/BTC-only and does not support Sui, see README) ----
  const riskFlags: RiskFlag[] = [];
  // Impersonator detection, a coin claiming the "SUI" symbol from a non-canonical type.
  // Reliable scam signal derived purely from RPC data (no Tatum malicious-address API needed).
  const impersonators = balances.filter(
    (b) => b.symbol.toUpperCase() === "SUI" && b.coinType !== SUI_TYPE,
  );
  if (impersonators.length > 0) {
    riskFlags.push({
      kind: "impersonator-token",
      detail: `${impersonators.length} token(s) spoof the "SUI" symbol from a non-canonical type, excluded from USD.`,
      severity: "high",
    });
  }
  const dust = balances.filter((b) => b.usd != null && b.usd < 0.01 && b.ui > 0);
  if (dust.length >= 3) {
    riskFlags.push({
      kind: "dust-coins",
      detail: `${dust.length} near-zero-value coin types, possible airdrop spam.`,
      severity: "low",
    });
  }
  if ((rawBalances?.length ?? 0) === 0 && activity.length === 0) {
    riskFlags.push({
      kind: "empty-wallet",
      detail: "No balances and no recent activity found for this address.",
      severity: "medium",
    });
  }

  const totalsUsd = Number(
    balances.reduce((s, b) => s + (b.usd ?? 0), 0).toFixed(2),
  );

  const report: WalletReport = {
    schema: "troof.report/v1",
    network,
    wallet,
    suiNs: nsRes?.data?.[0] ?? null,
    generatedAt: new Date().toISOString(),
    checkpoint: checkpoint ?? null,
    gasPrice: gasPrice ?? null,
    rates: { suiUsd: suiUsd ?? null },
    totals: { coinTypes: rawBalances?.length ?? 0, nfts: nfts.length, usd: totalsUsd },
    balances,
    nfts,
    stakes,
    activity,
    riskFlags,
    ai: null,
    evidence: { toolCalls, tatumGateway: NETWORKS[network].tatumRpc },
  };

  const contentHash = await hashCanonical(report);
  return { report, contentHash };
}
