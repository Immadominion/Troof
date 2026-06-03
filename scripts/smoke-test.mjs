// Phase 0 integration smoke test — proves the 3 risky integrations before building UI.
// Run: node --env-file=.env.local scripts/smoke-test.mjs
import { createHash } from 'node:crypto'

const KEY = process.env.TATUM_API_KEY
const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`)
const bad = (m) => console.log(`  \x1b[31m✗\x1b[0m ${m}`)
const head = (m) => console.log(`\n\x1b[1m${m}\x1b[0m`)

let failures = 0

async function rpc(url, method, params = []) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': KEY },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`)
  const j = await r.json()
  if (j.error) throw new Error(`RPC error: ${JSON.stringify(j.error)}`)
  return j.result
}

// ---- 1. Tatum Sui RPC (x-api-key) ----
head('1. Tatum Sui RPC  (x-api-key header)')
if (!KEY) { bad('TATUM_API_KEY not loaded — run with: node --env-file=.env.local'); process.exit(1) }
for (const [net, url] of [
  ['mainnet', 'https://sui-mainnet.gateway.tatum.io'],
  ['testnet', 'https://sui-testnet.gateway.tatum.io'],
]) {
  try {
    const chainId = await rpc(url, 'sui_getChainIdentifier')
    const gas = await rpc(url, 'suix_getReferenceGasPrice')
    ok(`${net}: chainId=${chainId}  refGasPrice=${gas}`)
  } catch (e) { failures++; bad(`${net}: ${e.message}`) }
}

// A real wallet read (the kind the report builder will do). Mysten/Sui Foundation address.
try {
  const addr = '0x0000000000000000000000000000000000000000000000000000000000000005' // system state object as a safe probe
  const obj = await rpc('https://sui-mainnet.gateway.tatum.io', 'sui_getObject', [addr, { showType: true }])
  ok(`mainnet sui_getObject ok (type: ${obj?.data?.type ?? 'n/a'})`)
} catch (e) { failures++; bad(`mainnet sui_getObject: ${e.message}`) }

// ---- 2. Walrus round-trip (publisher PUT -> aggregator GET) ----
head('2. Walrus round-trip  (testnet publisher PUT → public aggregator GET)')
const PUBLISHER = 'https://publisher.walrus-testnet.walrus.space'
const AGGREGATOR = 'https://aggregator.walrus-testnet.walrus.space'
try {
  const payload = `Troof smoke test :: ${new Date().toISOString()} :: ${Math.random()}`
  const put = await fetch(`${PUBLISHER}/v1/blobs?epochs=5`, { method: 'PUT', body: payload })
  if (!put.ok) throw new Error(`publisher HTTP ${put.status}`)
  const res = await put.json()
  const blobId = res?.newlyCreated?.blobObject?.blobId ?? res?.alreadyCertified?.blobId
  const objId = res?.newlyCreated?.blobObject?.id
  if (!blobId) throw new Error(`no blobId in response: ${JSON.stringify(res).slice(0, 200)}`)
  ok(`PUT ok  blobId=${blobId}`)
  if (objId) ok(`Sui Blob object id=${objId}`)
  const get = await fetch(`${AGGREGATOR}/v1/blobs/${blobId}`)
  if (!get.ok) throw new Error(`aggregator HTTP ${get.status}`)
  const back = await get.text()
  if (back === payload) ok(`GET ok — bytes round-trip exactly (${back.length} bytes)`)
  else { failures++; bad(`GET mismatch: sent ${payload.length}b got ${back.length}b`) }
} catch (e) { failures++; bad(`walrus: ${e.message}`) }

// ---- 3. Canonical JSON + SHA-256 (the tamper-check primitive) ----
head('3. Canonical JSON + SHA-256  (deterministic integrity hash)')
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object')
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`
  return JSON.stringify(value)
}
const sha256 = (s) => createHash('sha256').update(s, 'utf8').digest('hex')
try {
  const a = { wallet: '0xabc', balances: [{ coin: 'SUI', amt: 10 }], gen: 1 }
  const b = { gen: 1, balances: [{ amt: 10, coin: 'SUI' }], wallet: '0xabc' } // keys reordered
  const ha = sha256(canonical(a))
  const hb = sha256(canonical(b))
  if (ha === hb) ok(`key-order-independent hash stable: ${ha.slice(0, 16)}…`)
  else { failures++; bad('canonical hash not order-independent') }
  // Web Crypto path used in the browser must match Node's createHash:
  const enc = new TextEncoder().encode(canonical(a))
  const digest = await crypto.subtle.digest('SHA-256', enc)
  const hWeb = [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, '0')).join('')
  if (hWeb === ha) ok(`Node createHash === browser crypto.subtle.digest  ✓ (verifier will match)`)
  else { failures++; bad(`Node hash ${ha.slice(0,16)} != WebCrypto ${hWeb.slice(0,16)}`) }
} catch (e) { failures++; bad(`hash: ${e.message}`) }

head(failures === 0 ? '\x1b[32mALL INTEGRATIONS GREEN ✓\x1b[0m' : `\x1b[31m${failures} CHECK(S) FAILED\x1b[0m`)
process.exit(failures === 0 ? 0 : 1)
