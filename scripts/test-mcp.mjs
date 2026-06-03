// Verify the Tatum blockchain MCP server connects over stdio and lists its tools.
// Run: node --env-file=.env.local scripts/test-mcp.mjs
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const cli = path.join(process.cwd(), "node_modules/@tatumio/blockchain-mcp/dist/cli.js");
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [cli],
  env: { ...process.env, TATUM_API_KEY: process.env.TATUM_API_KEY ?? "" },
});
const client = new Client({ name: "troof-test", version: "1.0.0" });
await client.connect(transport);

const { tools } = await client.listTools();
console.log(`✓ connected — ${tools.length} tools:`);
for (const t of tools) console.log("  •", t.name);

// Probe a likely tool to confirm it actually works + Sui support.
const probe = tools.find((t) => /supported_chains|chains/i.test(t.name));
if (probe) {
  try {
    const r = await client.callTool({ name: probe.name, arguments: {} });
    const txt = JSON.stringify(r.content);
    console.log(`\n${probe.name} → ${txt.slice(0, 400)}`);
    console.log("mentions sui:", /sui/i.test(txt));
  } catch (e) {
    console.log(`${probe.name} error:`, e.message);
  }
}
await client.close();
process.exit(0);
