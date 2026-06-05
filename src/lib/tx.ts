// Build a plain-English-ready transaction report from Tatum Sui RPC.
// This powers "explain a transaction": paste a digest, get what actually happened
// (status, who, gas, what moved, which contracts) without wading through raw JSON.
import { NETWORKS, type Network } from "./constants";
import { hashCanonical } from "./canonical";
import * as tatum from "./tatum";
import type {
  TransactionReport,
  TransactionProofBundle,
  TxBalanceChange,
  TxMoveCall,
  TxObjectSummary,
  ToolCall,
  RiskFlag,
} from "./types";

const SUI_TYPE = "0x2::sui::SUI";

/** Signed base-units → signed human amount. */
function toUi(raw: string, decimals: number): number {
  try {
    const neg = raw.trim().startsWith("-");
    const big = BigInt(neg ? raw.trim().slice(1) : raw.trim());
    const base = BigInt(10) ** BigInt(decimals);
    const v = Number(big / base) + Number(big % base) / Number(base);
    return neg ? -v : v;
  } catch {
    return 0;
  }
}

/** Normalize a Sui owner union ({AddressOwner}|{ObjectOwner}|{Shared}|"Immutable") to a string. */
function ownerToString(owner: unknown): string | null {
  if (owner == null) return null;
  if (typeof owner === "string") return owner; // "Immutable"
  if (typeof owner === "object") {
    const o = owner as Record<string, unknown>;
    if (typeof o.AddressOwner === "string") return o.AddressOwner;
    if (typeof o.ObjectOwner === "string") return o.ObjectOwner;
    if (o.Shared) return "Shared";
  }
  return null;
}

export async function buildTxReport(
  network: Network,
  digest: string,
): Promise<TransactionProofBundle> {
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

  const tx = await track("tatum-rpc", "sui_getTransactionBlock", () =>
    tatum.getTransactionFull(network, digest),
  );
  if (!tx) throw new Error(`Transaction ${digest} not found on ${network}.`);

  const eff = tx.effects ?? {};
  const status: "success" | "failure" = eff.status?.status === "failure" ? "failure" : "success";
  const error = eff.status?.error ?? null;
  const sender = tx.transaction?.data?.sender ?? null;
  const timestampMs = tx.timestampMs != null ? Number(tx.timestampMs) : null;
  const checkpoint = tx.checkpoint ?? null;

  // Gas: net cost = computation + storage − rebate (what the payer actually spent).
  const g = eff.gasUsed ?? {};
  const computation = g.computationCost ?? "0";
  const storage = g.storageCost ?? "0";
  const rebate = g.storageRebate ?? "0";
  let netMist = "0";
  try {
    netMist = (BigInt(computation) + BigInt(storage) - BigInt(rebate)).toString();
  } catch {
    /* leave 0 */
  }
  const netSui = toUi(netMist, 9);

  // Commands → which contracts were called + a human kind label.
  const cmds = (tx.transaction?.data?.transaction?.transactions ?? []) as Array<Record<string, unknown>>;
  const moveCalls: TxMoveCall[] = [];
  const cmdKinds = new Set<string>();
  for (const c of cmds) {
    if (!c || typeof c !== "object") continue;
    const key = Object.keys(c)[0];
    if (!key) continue;
    cmdKinds.add(key);
    if (key === "MoveCall") {
      const mc = (c.MoveCall ?? {}) as Record<string, string>;
      moveCalls.push({
        package: mc.package ?? "",
        module: mc.module ?? "",
        function: mc.function ?? "",
      });
    }
  }

  // Object changes summary.
  const objectSummary: TxObjectSummary = {
    created: 0,
    mutated: 0,
    transferred: 0,
    deleted: 0,
    published: 0,
    wrapped: 0,
  };
  for (const o of tx.objectChanges ?? []) {
    const t = o?.type;
    if (t && t in objectSummary) objectSummary[t as keyof TxObjectSummary]++;
  }

  // Human kind label.
  let kind = "Programmable transaction";
  if (objectSummary.published > 0) {
    kind = "Publish package";
  } else if (moveCalls.length === 1) {
    kind = `Move call · ${moveCalls[0].module}::${moveCalls[0].function}`;
  } else if (moveCalls.length > 1) {
    kind = `Move calls (${moveCalls.length})`;
  } else if (cmdKinds.has("TransferObjects") || cmdKinds.has("SplitCoins") || cmdKinds.has("MergeCoins")) {
    kind = "Transfer";
  }

  // Balance changes → resolve symbol/decimals (cap metadata lookups for the free tier).
  const rawChanges = tx.balanceChanges ?? [];
  const distinctTypes = [...new Set(rawChanges.map((b) => b.coinType).filter(Boolean))] as string[];
  const metaMap = new Map<string, { decimals: number; symbol: string }>();
  metaMap.set(SUI_TYPE, { decimals: 9, symbol: "SUI" });
  const toFetch = distinctTypes.filter((t) => t !== SUI_TYPE).slice(0, 4);
  await Promise.all(
    toFetch.map((t) =>
      track("tatum-rpc", "suix_getCoinMetadata", () => tatum.getCoinMetadata(network, t)).then((m) => {
        metaMap.set(t, {
          decimals: m?.decimals ?? 9,
          symbol: m?.symbol ?? t.split("::").pop() ?? t,
        });
      }),
    ),
  );
  const suiUsd = rawChanges.some((b) => b.coinType === SUI_TYPE)
    ? await track("tatum-data-api", "getExchangeRate(SUI)", () => tatum.getUsdRate("SUI"))
    : null;

  const balanceChanges: TxBalanceChange[] = rawChanges.map((b) => {
    const ct = b.coinType ?? "";
    const meta = metaMap.get(ct) ?? { decimals: 9, symbol: ct.split("::").pop() ?? ct };
    const ui = toUi(b.amount ?? "0", meta.decimals);
    const canonicalSui = ct === SUI_TYPE;
    return {
      owner: ownerToString(b.owner),
      coinType: ct,
      symbol: meta.symbol,
      amount: b.amount ?? "0",
      ui,
      usd: canonicalSui && suiUsd != null ? ui * suiUsd : null,
      canonicalSui,
    };
  });

  // Risk flags — honest, RPC-grounded.
  const riskFlags: RiskFlag[] = [];
  if (status === "failure") {
    riskFlags.push({
      kind: "failed",
      detail: error ? `Transaction failed on-chain: ${error}` : "Transaction failed on-chain.",
      severity: "medium",
    });
  }
  for (const b of balanceChanges) {
    if (!b.canonicalSui && b.symbol.toUpperCase() === "SUI") {
      riskFlags.push({
        kind: "impersonator",
        detail: `Moves a coin using the "SUI" symbol that is NOT canonical 0x2::sui::SUI (${b.coinType}).`,
        severity: "high",
      });
    }
  }

  const eventTypes = [
    ...new Set((tx.events ?? []).map((e) => e?.type).filter(Boolean)),
  ].slice(0, 6) as string[];

  const report: TransactionReport = {
    schema: "troof.tx/v1",
    network,
    digest,
    status,
    error,
    sender,
    timestampMs,
    checkpoint,
    kind,
    gas: { computation, storage, rebate, netMist, netSui },
    balanceChanges,
    moveCalls,
    objectSummary,
    eventCount: (tx.events ?? []).length,
    eventTypes,
    riskFlags,
    ai: null,
    generatedAt: new Date().toISOString(),
    evidence: { toolCalls, tatumGateway: NETWORKS[network].tatumRpc },
  };

  const contentHash = await hashCanonical(report);
  return { report, contentHash };
}
