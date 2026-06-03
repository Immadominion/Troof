// Deploy the troof_anchor Move package to Sui testnet and provision the server signer.
// - generates TROOF_SIGNER_KEY (a throwaway testnet keypair) into .env.local if absent
// - funds it from the testnet faucet
// - publishes move/troof_anchor and writes TROOF_ANCHOR_PACKAGE into .env.local
//
// Run: node --env-file=.env.local scripts/deploy-anchor.mjs
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { getFaucetHost, requestSuiFromFaucetV2 } from "@mysten/sui/faucet";

const ENV = "/Users/mac/Documents/codes/tatum/.env.local";
const PKG = "/Users/mac/Documents/codes/tatum/move/troof_anchor";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function upsertEnv(key, value) {
  let txt = existsSync(ENV) ? readFileSync(ENV, "utf8") : "";
  if (new RegExp(`^${key}=`, "m").test(txt)) {
    txt = txt.replace(new RegExp(`^${key}=.*$`, "m"), `${key}=${value}`);
  } else {
    txt = txt.replace(/\s*$/, "") + `\n${key}=${value}\n`;
  }
  writeFileSync(ENV, txt);
}

const client = new SuiClient({ url: getFullnodeUrl("testnet") });

// 1. Signer keypair
let secret = process.env.TROOF_SIGNER_KEY;
let kp;
if (secret) {
  kp = Ed25519Keypair.fromSecretKey(secret);
  console.log("• reusing TROOF_SIGNER_KEY");
} else {
  kp = Ed25519Keypair.generate();
  secret = kp.getSecretKey(); // bech32 suiprivkey…
  upsertEnv("TROOF_SIGNER_KEY", secret);
  console.log("• generated new TROOF_SIGNER_KEY → .env.local");
}
const addr = kp.getPublicKey().toSuiAddress();
console.log("• signer address:", addr);

// 2. Fund from faucet if needed
async function balance() {
  const b = await client.getBalance({ owner: addr });
  return BigInt(b.totalBalance);
}
if ((await balance()) < 100_000_000n) {
  console.log("• requesting testnet faucet…");
  try {
    await requestSuiFromFaucetV2({ host: getFaucetHost("testnet"), recipient: addr });
  } catch (e) {
    console.log("  faucet error:", e.message);
  }
  for (let i = 0; i < 20; i++) {
    await sleep(2000);
    if ((await balance()) >= 100_000_000n) break;
    process.stdout.write(".");
  }
  console.log("");
}
console.log("• balance:", (Number(await balance()) / 1e9).toFixed(3), "SUI");
if ((await balance()) < 50_000_000n) {
  console.error("✗ insufficient balance to publish. Fund", addr, "on testnet and re-run.");
  process.exit(1);
}

// 3. Skip if already published
if (process.env.TROOF_ANCHOR_PACKAGE) {
  console.log("• already published:", process.env.TROOF_ANCHOR_PACKAGE, "(delete from .env.local to redeploy)");
  process.exit(0);
}

// 4. Compile to base64 + publish
console.log("• compiling package…");
const out = execFileSync(
  "sui",
  ["move", "build", "--dump-bytecode-as-base64", "--path", PKG],
  { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024 },
);
const { modules, dependencies } = JSON.parse(out);

const tx = new Transaction();
const [upgradeCap] = tx.publish({ modules, dependencies });
tx.transferObjects([upgradeCap], addr);
tx.setGasBudget(200_000_000);

console.log("• publishing…");
const res = await client.signAndExecuteTransaction({
  signer: kp,
  transaction: tx,
  options: { showObjectChanges: true, showEffects: true },
});
if (res.effects?.status?.status !== "success") {
  console.error("✗ publish failed:", JSON.stringify(res.effects?.status));
  process.exit(1);
}
const published = res.objectChanges?.find((c) => c.type === "published");
const packageId = published?.packageId;
console.log("✓ published package:", packageId);
console.log("  tx:", res.digest);
upsertEnv("TROOF_ANCHOR_PACKAGE", packageId);
upsertEnv("TROOF_ANCHOR_NETWORK", "testnet");
console.log("✓ wrote TROOF_ANCHOR_PACKAGE → .env.local");
