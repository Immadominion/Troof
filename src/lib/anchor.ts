// Server-only Sui anchor. Signs the troof_anchor::anchor::anchor Move call with the
// server keypair and submits it through Tatum's RPC gateway, creating an immutable on-chain
// Record of the proof's content hash. (Classic @mysten/sui v1 client API.)
import { SuiClient, SuiHTTPTransport } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { NETWORKS, type Network } from "./constants";

const KEY = process.env.TATUM_API_KEY ?? "";
const SIGNER = process.env.TROOF_SIGNER_KEY;
const PACKAGE = process.env.TROOF_ANCHOR_PACKAGE;
// Where the anchor package is published / proofs are sealed (testnet during dev).
export const ANCHOR_NETWORK = (process.env.TROOF_ANCHOR_NETWORK ?? "testnet") as Network;

export function anchorConfigured(): boolean {
  return Boolean(SIGNER && PACKAGE);
}

// The Sui SDK client makes several un-gated RPC calls per anchor (execute + effects polling)
// straight through Tatum's gateway, which can 429 on the free tier right after a report build.
// Retry 429s with backoff so a transient rate-limit doesn't fail the whole seal.
const retryingFetch: typeof fetch = async (input, init) => {
  let res!: Response;
  for (let i = 0; i < 5; i++) {
    res = await fetch(input, init);
    if (res.status !== 429) return res;
    await new Promise((r) => setTimeout(r, 600 * (i + 1)));
  }
  return res;
};

function suiClient(network: Network) {
  return new SuiClient({
    transport: new SuiHTTPTransport({
      url: NETWORKS[network].tatumRpc,
      rpc: { headers: { "x-api-key": KEY } },
      fetch: retryingFetch,
    }),
  });
}

export interface AnchorResult {
  recordId: string;
  txDigest: string;
  packageId: string;
  anchoredBy: string;
  network: Network; // the network of the analyzed wallet (stored in the Record)
}

/** Anchor a proof's content hash on-chain. Submitted on ANCHOR_NETWORK; `walletNetwork`
 *  is recorded. The blob is located via its (content-addressed) URL, so the on-chain
 *  Record stores the hash as the root of trust rather than a circular blob id. */
export async function anchorOnChain(
  contentHash: string,
  wallet: string,
  walletNetwork: Network,
): Promise<AnchorResult> {
  if (!SIGNER || !PACKAGE) throw new Error("Anchor not configured (TROOF_SIGNER_KEY / TROOF_ANCHOR_PACKAGE)");
  const kp = Ed25519Keypair.fromSecretKey(SIGNER);
  const client = suiClient(ANCHOR_NETWORK);

  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE}::anchor::anchor`,
    arguments: [
      tx.pure.string("sealed-in-blob"),
      tx.pure.string(contentHash),
      tx.pure.string(wallet),
      tx.pure.string(walletNetwork),
    ],
  });

  const res = await client.signAndExecuteTransaction({
    signer: kp,
    transaction: tx,
    options: { showObjectChanges: true, showEffects: true },
  });
  if (res.effects?.status?.status !== "success") {
    throw new Error(`Anchor tx failed: ${JSON.stringify(res.effects?.status)}`);
  }
  const created = res.objectChanges?.find(
    (c) => c.type === "created" && "objectType" in c && c.objectType.endsWith("::anchor::Record"),
  );
  const recordId = created && "objectId" in created ? created.objectId : "";

  return {
    recordId,
    txDigest: res.digest,
    packageId: PACKAGE,
    anchoredBy: kp.getPublicKey().toSuiAddress(),
    network: walletNetwork,
  };
}

const ZERO_ADDR = "0x0000000000000000000000000000000000000000000000000000000000000000";

/** Emit a per-viewer discovery event (anchor::mark_sealed) AFTER the blob is on Walrus, so a
 *  user's proof history can be reconstructed from Sui events + Walrus, no DB. Best-effort:
 *  callers should not let a failure here fail the seal. `sealedFor` = connected wallet or null. */
export async function markSealed(
  blobId: string,
  contentHash: string,
  kind: string,
  subject: string,
  sealedFor: string | null,
): Promise<void> {
  if (!SIGNER || !PACKAGE) return;
  const owner = sealedFor && /^0x[0-9a-fA-F]{1,64}$/.test(sealedFor) ? sealedFor : ZERO_ADDR;
  const kp = Ed25519Keypair.fromSecretKey(SIGNER);
  const client = suiClient(ANCHOR_NETWORK);

  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE}::anchor::mark_sealed`,
    arguments: [
      tx.pure.string(blobId),
      tx.pure.string(contentHash),
      tx.pure.string(kind),
      tx.pure.string(subject),
      tx.pure.address(owner),
    ],
  });

  const res = await client.signAndExecuteTransaction({
    signer: kp,
    transaction: tx,
    options: { showEffects: true },
  });
  if (res.effects?.status?.status !== "success") {
    throw new Error(`mark_sealed failed: ${JSON.stringify(res.effects?.status)}`);
  }
}
