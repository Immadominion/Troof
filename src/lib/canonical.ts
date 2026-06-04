// The tamper-check primitive. Deterministic JSON canonicalization + SHA-256.
// Uses Web Crypto (`crypto.subtle`), which exists identically in Node 20+ AND the browser -
// so a proof sealed on the server verifies byte-for-byte in the visitor's browser.
// Proven equal in scripts/smoke-test.mjs.

/** Stable stringify: object keys sorted, no incidental whitespace. */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`)
    .join(",")}}`;
}

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Hash the canonical form of any JSON-serializable value. */
export async function hashCanonical(value: unknown): Promise<string> {
  return sha256Hex(canonicalize(value));
}
