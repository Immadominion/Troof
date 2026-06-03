<div align="center">

# Troof

### The verifiable AI terminal for Sui.

Ask an AI about any Sui wallet or token — then **seal its answer into a proof a stranger can re-fetch and re-hash** to `Verified` or `Tampered`.

*Powered by [Tatum](https://tatum.io) · [Walrus](https://walrus.xyz) · [Sui](https://sui.io). Built for the Tatum × Walrus on Sui hackathon.*

</div>

---

> Every AI explorer tells you *what happened*. Troof is the only one that lets a stranger **prove the AI didn't lie** — because the answer, the on-chain data behind it, and the verdict are sealed on Walrus and anchored on Sui, with **no Troof server in the verification path.**

## Demo

| | |
|---|---|
| **60-sec overview** | `▶ docs/videos/overview.mp4` *(coming)* |
| **Spot a fake SUI → seal → tamper flip** | `▶ docs/videos/troof-score.mp4` *(coming)* |
| **Verify a proof on another machine** | `▶ docs/videos/verify.mp4` *(coming)* |

**Live:** https://troof.site · **Sample proof:** `/p/<blobId>` (re-hydrates from a public Walrus aggregator and verifies against its on-chain anchor)

## What it does

1. **Ask.** Paste a Sui **wallet** or **token** into the chat. An AI agent reads it live through **Tatum** (Sui RPC + the Tatum MCP server).
2. **Grade.** Wallets get an integrity-checked report (USD valued for *canonical* `0x2::sui::SUI` only — impersonator tokens are flagged, never trusted by symbol). Tokens get a **Troof Score** (A–F) computed from on-chain signals, each line citing the raw field it came from.
3. **Seal.** One click writes the full evidence bundle to **Walrus** and anchors its **SHA-256 on Sui**.
4. **Verify.** Open the proof link anywhere — it re-fetches from a **public Walrus aggregator**, re-hashes **in your browser**, and compares to the on-chain record: `Verified` (green) or, if a single byte changed, `Tampered` (red).

## How we used Walrus

The proof *is* a Walrus blob — remove Walrus and the product is just a forgeable screenshot.
- The sealed evidence bundle (report + AI verdict + Troof Score) is stored via the Walrus **HTTP publisher** (`PUT /v1/blobs`).
- Verification re-fetches it from a **public aggregator** (`GET /v1/blobs/{id}`) — content-addressed, censorship-resistant, and reconstructed from storage-node slivers with no server of ours involved.
- The blob id being content-derived means the share URL itself can't point at swapped bytes.

## How we used Tatum

Tatum is the sole node provider and the data engine.
- **Sui RPC gateway** — 11 methods (`suix_getAllBalances`, `getOwnedObjects`, `getStakes`, `queryTransactionBlocks`, `getCoinMetadata`, `getTotalSupply`, `getObject`, `getTransactionBlock`, `resolveNameServiceNames`, `getReferenceGasPrice`, `getObject` for anchor read-back), all proxied server-side so the key never reaches the client.
- **Exchange-Rate Data API** — USD valuation of canonical SUI.
- **Tatum MCP server** (13 tools) — the AI agent's tools run through the real Tatum MCP over stdio (gateway RPC, exchange rates, etc.).
- The on-chain anchor transaction is itself submitted through the Tatum gateway.

*Honest note:* Tatum's high-level wallet/portfolio Data API and Malicious-Address API don't cover Sui — so Sui data comes from RPC, and our **canonical-coin-type impersonator detection** is the Sui-native substitute for address screening.

## Architecture

Diagrams are specced in [`docs/diagrams/`](docs/diagrams) (one JSON brief per image).

```
Browser (Next.js chat)
  └─ /api/agent ── Claude (AI SDK) ── Tatum MCP (13 tools) + local tools
       ├─ analyze ── /lib/report · /lib/token ── Tatum Sui RPC + Exchange-Rate
       ├─ score   ── /lib/score (Troof Score, rubric_v1)
       └─ seal    ── /lib/seal ── Walrus PUT  +  Sui anchor (Move) via Tatum RPC
  └─ /p/[blobId] ── public Walrus aggregator GET → in-browser SHA-256 → on-chain Record → Verified/Tampered
```

On-chain anchor: a small Move package [`move/troof_anchor`](move/troof_anchor) (`anchor(blob_id, content_hash, subject, network)`).

## Tech stack

Next.js 16 · React 19 · TypeScript · Tailwind v4 + shadcn/ui · AI SDK v6 (Anthropic) · `@modelcontextprotocol/sdk` · `@mysten/sui` · Walrus HTTP API · Sui Move.

## Run locally

```bash
pnpm install
cp .env.example .env.local   # fill in TATUM_API_KEY + ANTHROPIC_API_KEY
node --env-file=.env.local scripts/deploy-anchor.mjs   # publish the anchor package (testnet) + fund the signer
pnpm dev
```

Integration smoke test: `node --env-file=.env.local scripts/smoke-test.mjs`

## Roadmap

- **Troof API (x402)** — the same analyze / score / verify endpoints exposed as pay-per-call HTTP APIs via the [x402](https://x402.org) payment protocol, so other apps can embed verifiable Sui analysis. See [`docs/x402.md`](docs/x402.md).
- More entity types (transactions, packages), holder/liquidity signals via an indexer, mainnet anchoring.

## License

MIT
