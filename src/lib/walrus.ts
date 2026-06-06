// Walrus HTTP client (publisher PUT / aggregator GET). No SDK/WASM on the critical path.
import { WALRUS, type Network } from "./constants";

export interface WalrusPutResult {
  blobId: string;
  objectId: string | null;
  endEpoch: number | null;
  alreadyCertified: boolean;
}

/** Store bytes on Walrus. Returns the content-addressed blob id (+ the on-Sui Blob object). */
export async function putBlob(
  network: Network,
  data: string | Uint8Array,
  epochs = 5,
): Promise<WalrusPutResult> {
  // The public Walrus publisher 429s / 5xxes under load; retry with backoff so a transient
  // hiccup doesn't fail the seal.
  let res!: Response;
  for (let i = 0; i < 4; i++) {
    res = await fetch(`${WALRUS[network].publisher}/v1/blobs?epochs=${epochs}`, {
      method: "PUT",
      body: data as BodyInit,
    });
    if (res.ok || (res.status !== 429 && res.status < 500)) break;
    await new Promise((r) => setTimeout(r, 800 * (i + 1)));
  }
  if (!res.ok) throw new Error(`Walrus publisher → HTTP ${res.status}`);
  const j = await res.json();
  if (j.newlyCreated) {
    const o = j.newlyCreated.blobObject;
    return {
      blobId: o.blobId,
      objectId: o.id ?? null,
      endEpoch: o.storage?.endEpoch ?? null,
      alreadyCertified: false,
    };
  }
  if (j.alreadyCertified) {
    return {
      blobId: j.alreadyCertified.blobId,
      objectId: null,
      endEpoch: j.alreadyCertified.endEpoch ?? null,
      alreadyCertified: true,
    };
  }
  throw new Error(`Unexpected Walrus response: ${JSON.stringify(j).slice(0, 200)}`);
}

export async function getBlobText(network: Network, blobId: string): Promise<string> {
  const res = await fetch(`${WALRUS[network].aggregator}/v1/blobs/${blobId}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Walrus aggregator → HTTP ${res.status}`);
  return res.text();
}
