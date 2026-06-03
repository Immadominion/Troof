// Bridge to the real Tatum blockchain MCP server (@tatumio/blockchain-mcp, stdio).
// Connects via the official MCP SDK, lists the server's tools, and wraps each as an AI-SDK
// tool so the agent's calls genuinely flow through Tatum's MCP. Fails soft (returns {}) so the
// app falls back to local Tatum-engine tools when stdio can't run (e.g. serverless deploy).
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { tool, jsonSchema, type Tool } from "ai";

type ToolMap = Record<string, Tool>;
let cached: ToolMap | null = null;

export async function getTatumMcpTools(): Promise<ToolMap> {
  if (cached) return cached;
  if (process.env.TROOF_DISABLE_MCP === "1") return {};
  try {
    const cli = path.join(process.cwd(), "node_modules/@tatumio/blockchain-mcp/dist/cli.js");
    const transport = new StdioClientTransport({
      command: process.execPath, // current node binary (avoids npx network fetch)
      args: [cli],
      env: { ...process.env, TATUM_API_KEY: process.env.TATUM_API_KEY ?? "" },
    });
    const client = new Client({ name: "troof-agent", version: "1.0.0" });
    await client.connect(transport);

    const { tools } = await client.listTools();
    const wrapped: ToolMap = {};
    for (const t of tools) {
      wrapped[t.name] = tool({
        description: t.description ?? t.name,
        inputSchema: jsonSchema((t.inputSchema as object) ?? { type: "object", properties: {} }),
        execute: async (args: unknown) => {
          const res = await client.callTool({
            name: t.name,
            arguments: (args ?? {}) as Record<string, unknown>,
          });
          return res.content;
        },
      });
    }
    cached = wrapped;
    console.log(`[mcp] Tatum MCP connected — ${Object.keys(wrapped).length} tools`);
    return wrapped;
  } catch (e) {
    console.warn("[mcp] Tatum MCP unavailable, falling back to local tools:", (e as Error).message);
    return {};
  }
}
