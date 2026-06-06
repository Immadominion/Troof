// Server-only Tatum client. The API key lives in process.env.TATUM_API_KEY and never
// reaches the browser (no NEXT_PUBLIC_ prefix; only imported by server routes/builders).
import { NETWORKS, type Network } from "./constants";

const KEY = process.env.TATUM_API_KEY ?? "";
const DATA_BASE = "https://api.tatum.io/v3";

if (!KEY && process.env.NODE_ENV !== "production") {
  // surfaced once at boot in dev to catch a missing key early
  console.warn("[tatum] TATUM_API_KEY is not set, RPC calls will fail.");
}

// ---- Free-tier rate limiting (3 RPS) ----
// Space out request starts so concurrent fan-out never exceeds the limit, and retry on 429.
const MIN_GAP_MS = 360;
let _lastStart = 0;
async function gate(): Promise<void> {
  const now = Date.now();
  const wait = Math.max(0, _lastStart + MIN_GAP_MS - now);
  _lastStart = now + wait;
  if (wait) await new Promise((r) => setTimeout(r, wait));
}
async function fetchLimited(url: string, init: RequestInit, tries = 4): Promise<Response> {
  let res!: Response;
  for (let i = 0; i < tries; i++) {
    await gate();
    res = await fetch(url, init);
    if (res.status !== 429) return res;
    await new Promise((r) => setTimeout(r, 500 * (i + 1)));
  }
  return res;
}

/** Low-level JSON-RPC call against Tatum's Sui gateway for a network. */
export async function rpc<T = unknown>(
  network: Network,
  method: string,
  params: unknown[] = [],
): Promise<T> {
  const res = await fetchLimited(NETWORKS[network].tatumRpc, {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": KEY },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Tatum RPC ${method} → HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(`Tatum RPC ${method} → ${JSON.stringify(json.error)}`);
  return json.result as T;
}

// ---- Typed RPC wrappers (each maps to a visible report field) ----

export const getChainIdentifier = (n: Network) => rpc<string>(n, "sui_getChainIdentifier");
export const getReferenceGasPrice = (n: Network) => rpc<string>(n, "suix_getReferenceGasPrice");
export const getLatestCheckpoint = (n: Network) =>
  rpc<string>(n, "sui_getLatestCheckpointSequenceNumber");

export interface RawBalance {
  coinType: string;
  totalBalance: string;
  coinObjectCount: number;
}
export const getAllBalances = (n: Network, owner: string) =>
  rpc<RawBalance[]>(n, "suix_getAllBalances", [owner]);

export interface CoinMeta {
  decimals: number;
  symbol: string;
  name: string;
  description?: string;
  iconUrl?: string | null;
  id?: string; // the CoinMetadata object id
}
export const getCoinMetadata = (n: Network, coinType: string) =>
  rpc<CoinMeta | null>(n, "suix_getCoinMetadata", [coinType]);

export const getTotalSupply = (n: Network, coinType: string) =>
  rpc<{ value: string }>(n, "suix_getTotalSupply", [coinType]);

export interface SuiObjectResp {
  data?: {
    objectId: string;
    owner?: unknown; // "Immutable" | { AddressOwner } | { Shared } | ...
    previousTransaction?: string;
    type?: string;
    content?: { fields?: Record<string, unknown> };
  };
}
export const getObject = (
  n: Network,
  id: string,
  options: Record<string, boolean> = { showOwner: true, showPreviousTransaction: true, showType: true },
) => rpc<SuiObjectResp>(n, "sui_getObject", [id, options]);

export const getTransactionBlock = (n: Network, digest: string) =>
  rpc<{ timestampMs?: string }>(n, "sui_getTransactionBlock", [digest, { showInput: true }]);

// Full transaction detail — what the "explain a transaction" report is built from.
export interface RawTxBlock {
  digest?: string;
  timestampMs?: string;
  checkpoint?: string;
  transaction?: {
    data?: {
      sender?: string;
      gasData?: { price?: string; budget?: string; owner?: string };
      transaction?: { kind?: string; transactions?: unknown[]; inputs?: unknown[] };
    };
  };
  effects?: {
    status?: { status?: string; error?: string };
    gasUsed?: {
      computationCost?: string;
      storageCost?: string;
      storageRebate?: string;
      nonRefundableStorageFee?: string;
    };
  };
  events?: Array<{ type?: string; sender?: string; parsedJson?: unknown }>;
  balanceChanges?: Array<{ owner?: unknown; coinType?: string; amount?: string }>;
  objectChanges?: Array<{ type?: string; objectType?: string; objectId?: string }>;
}
export const getTransactionFull = (n: Network, digest: string) =>
  rpc<RawTxBlock>(n, "sui_getTransactionBlock", [
    digest,
    {
      showInput: true,
      showEffects: true,
      showEvents: true,
      showBalanceChanges: true,
      showObjectChanges: true,
    },
  ]);

export const resolveNameServiceNames = (n: Network, owner: string) =>
  rpc<{ data: string[] }>(n, "suix_resolveNameServiceNames", [owner]);

export interface OwnedObjectsPage {
  data: Array<{
    data?: {
      objectId: string;
      type?: string;
      display?: { data?: Record<string, string> | null };
    };
  }>;
}
export const getOwnedObjects = (n: Network, owner: string, limit = 50) =>
  rpc<OwnedObjectsPage>(n, "suix_getOwnedObjects", [
    owner,
    { filter: null, options: { showType: true, showDisplay: true } },
    null,
    limit,
  ]);

export interface StakesEntry {
  validatorAddress: string;
  stakes: Array<{ principal: string; status: string }>;
}
export const getStakes = (n: Network, owner: string) =>
  rpc<StakesEntry[]>(n, "suix_getStakes", [owner]);

export interface TxBlocksPage {
  data: Array<{
    digest: string;
    timestampMs?: string;
    transaction?: { data?: { sender?: string } };
    effects?: { status?: { status?: string } };
  }>;
}
export const queryTransactionBlocks = (n: Network, owner: string, limit = 8) =>
  rpc<TxBlocksPage>(n, "suix_queryTransactionBlocks", [
    {
      filter: { FromAddress: owner },
      options: { showInput: true, showEffects: true },
    },
    null,
    limit,
    true, // descending, most recent first
  ]);

// ---- Events (the on-chain index for "Your proofs" history) ----

export interface SuiEventItem {
  id: { txDigest: string; eventSeq: string };
  type: string;
  sender: string;
  timestampMs?: string;
  parsedJson?: Record<string, unknown>;
}
export interface SuiEventPage {
  data: SuiEventItem[];
  nextCursor: unknown;
  hasNextPage: boolean;
}
/** Query Move events by exact type (newest first). Filtering by a struct field isn't supported
 *  server-side on Sui, so callers post-filter (e.g. by `sealed_for`). Goes through the 3 RPS gate. */
export const queryEvents = (n: Network, eventType: string, cursor: unknown = null, limit = 50) =>
  rpc<SuiEventPage>(n, "suix_queryEvents", [{ MoveEventType: eventType }, cursor, limit, true]);

// ---- Tatum Data API (chain-agnostic; works for Sui valuation) ----

/** Exchange-Rate Data API → USD price for a symbol. Returns null if unsupported. */
export async function getUsdRate(symbol: string): Promise<number | null> {
  try {
    const res = await fetchLimited(
      `${DATA_BASE}/tatum/rate/${encodeURIComponent(symbol)}?basePair=USD`,
      { headers: { "x-api-key": KEY }, cache: "no-store" },
    );
    if (!res.ok) return null;
    const j = await res.json();
    const v = Number(j?.value);
    return Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}
