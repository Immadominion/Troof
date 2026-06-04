// Display helpers for crypto artifacts. Full number-formatting spec lands in Phase 5.

/** 0x1234…abcd, truncate the middle of an address / id. */
export function truncateMiddle(s: string, start = 6, end = 4): string {
  if (!s) return "";
  if (s.length <= start + end + 1) return s;
  return `${s.slice(0, start)}…${s.slice(-end)}`;
}

/** Short form for a Sui address / object id (keeps the 0x). */
export function shortAddress(s: string): string {
  return truncateMiddle(s, 6, 4);
}

/** Short form for a content hash / blob id (a touch longer, it's the proof). */
export function shortHash(s: string): string {
  return truncateMiddle(s, 10, 8);
}

/** MIST (10^9) → SUI, with sensible precision. */
export function mistToSui(mist: string | number | bigint, decimals = 4): number {
  const n = typeof mist === "bigint" ? Number(mist) : Number(mist);
  return Number((n / 1e9).toFixed(decimals));
}

/** Compact USD, e.g. $12,340.50 / $1.2M. */
export function formatUsd(n: number): string {
  if (!isFinite(n)) return "$0.00";
  if (Math.abs(n) >= 1_000_000)
    return `$${(n / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })}M`;
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export function isLikelySuiAddress(s: string): boolean {
  return /^0x[0-9a-fA-F]{1,64}$/.test(s.trim());
}
