// "Your proofs" history — the sealed-proof-as-history feature.
//
// Every sealed proof is already a permanent, content-addressed Walrus blob with a public
// /p/<blobId> URL, so a user's history is literally their list of proofs. We keep that list
// in localStorage (no backend, no PII), namespaced per connected wallet, so each wallet sees
// its own list and a disconnected visitor still gets one on this device. The proof URLs are the
// source of truth — each row re-verifies live against Walrus + Sui when opened.
import { useEffect, useState } from "react";

export interface ProofEntry {
  blobId: string;
  proofUrl: string;
  kind: "wallet" | "token" | "transaction";
  subject: string; // wallet address, coin type, or tx digest
  headline?: string;
  network?: string;
  ts: number; // saved-at (ms)
}

const PREFIX = "troof_proofs:v1:";
const MAX = 60;
const EVENT = "troof:proofs";

const keyFor = (address?: string | null) =>
  PREFIX + (address ? address.toLowerCase() : "anon");

function read(k: string): ProofEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(k);
    if (!raw) return [];
    const arr: unknown = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as ProofEntry[]) : [];
  } catch {
    return [];
  }
}

function write(k: string, list: ProofEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(k, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* quota / private mode — history is best-effort */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function loadProofs(address?: string | null): ProofEntry[] {
  return read(keyFor(address));
}

/** Idempotent: a proof already saved (same blobId) is a no-op, so re-scanning is safe. */
export function addProof(entry: ProofEntry, address?: string | null): void {
  // Persisted proof URLs are untrusted on read-back: only accept a same-origin path
  // (/p/<blobId>). Reject javascript:/data:/vbscript: and protocol-relative (//evil).
  if (!isSafeHref(entry.proofUrl)) return;
  const k = keyFor(address);
  const list = read(k);
  if (list.some((e) => e.blobId === entry.blobId)) return;
  write(k, [entry, ...list]);
}

export function clearProofs(address?: string | null): void {
  write(keyFor(address), []);
}

function isSafeHref(url: string | undefined | null): url is string {
  return !!url && url.startsWith("/") && !url.startsWith("//");
}

/** Render-time guard: a non same-origin path (e.g. a tampered localStorage entry) → "#". */
export function safeProofHref(url: string | undefined | null): string {
  return isSafeHref(url) ? url : "#";
}

/** SSR-safe hook: starts empty (so server + first client render match → no hydration
 *  mismatch), then populates after mount and stays in sync across tabs and seals. */
export function useProofHistory(address?: string | null): ProofEntry[] {
  const [proofs, setProofs] = useState<ProofEntry[]>([]);
  useEffect(() => {
    const refresh = () => setProofs(loadProofs(address));
    refresh();
    window.addEventListener(EVENT, refresh);
    window.addEventListener("storage", refresh); // cross-tab
    return () => {
      window.removeEventListener(EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [address]);
  return proofs;
}
