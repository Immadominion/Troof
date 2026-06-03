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

function suiClient(network: Network) {
  return new SuiClient({
    transport: new SuiHTTPTransport({
      url: NETWORKS[network].tatumRpc,
      rpc: { headers: { "x-api-key": KEY } },
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
