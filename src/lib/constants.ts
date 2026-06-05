// Central config for Troof. Network endpoints, Walrus gateways, and site metadata.
// All Tatum RPC traffic is proxied server-side (see /api/rpc) so the key never ships to the client.

export const SITE = {
  name: "Troof",
  domain: "troof.site",
  url: "https://troof.site",
  tagline: "Verifiable AI for Sui.",
  description:
    "Troof is a verifiable AI explorer for Sui. Ask about any wallet, token, or transaction in plain words, read it live, and prove the answer.",
  twitter: "@troof",
  repo: "https://github.com/troof/troof",
} as const;

export const NETWORKS = {
  mainnet: {
    label: "Mainnet",
    // Proxied server-side; the client calls /api/rpc, not this URL directly.
    tatumRpc: "https://sui-mainnet.gateway.tatum.io",
    explorerTx: "https://suiscan.xyz/mainnet/tx/",
    explorerObject: "https://suiscan.xyz/mainnet/object/",
    explorerAccount: "https://suiscan.xyz/mainnet/account/",
  },
  testnet: {
    label: "Testnet",
    tatumRpc: "https://sui-testnet.gateway.tatum.io",
    explorerTx: "https://suiscan.xyz/testnet/tx/",
    explorerObject: "https://suiscan.xyz/testnet/object/",
    explorerAccount: "https://suiscan.xyz/testnet/account/",
  },
} as const;

export type Network = keyof typeof NETWORKS;

// Walrus public HTTP gateways. Testnet endpoints are smoke-tested (scripts/smoke-test.mjs).
// Mainnet endpoints are validated before the production demo (Phase 3/6).
export const WALRUS = {
  testnet: {
    publisher: "https://publisher.walrus-testnet.walrus.space",
    aggregator: "https://aggregator.walrus-testnet.walrus.space",
    epochMs: 24 * 60 * 60 * 1000, // ~1 day
  },
  mainnet: {
    publisher: "https://publisher.walrus-mainnet.walrus.space",
    aggregator: "https://aggregator.walrus-mainnet.walrus.space",
    epochMs: 14 * 24 * 60 * 60 * 1000, // ~2 weeks
  },
} as const;

// Default network for the running app (dev on testnet; flip to mainnet for the final demo).
export const DEFAULT_NETWORK: Network =
  (process.env.NEXT_PUBLIC_DEFAULT_NETWORK as Network) || "testnet";

export const walrusBlobUrl = (net: Network, blobId: string) =>
  `${WALRUS[net].aggregator}/v1/blobs/${blobId}`;
