import { tool, jsonSchema, type Tool } from "ai";

// Bridge to the real Tatum blockchain MCP server (@tatumio/blockchain-mcp, stdio).
// The MCP SDK + the stdio server are LOCAL-DEV ONLY. On serverless we run with
// TROOF_DISABLE_MCP=1, return early, and never touch them — and we load the SDK through a
// hidden dynamic import so it is never bundled/traced into the Vercel function (which also lets
// next.config exclude it). Fails soft → the agent falls back to the local Tatum-engine tools.

type ToolMap = Record<string, Tool>;
let cached: ToolMap | null = null;

// Hidden from the bundler's static analysis so @modelcontextprotocol/sdk isn't traced server-side.
/* eslint-disable @typescript-eslint/no-explicit-any */
const lazyImport = (m: string): Promise<any> =>
  (Function("m", "return import(m)") as (m: string) => Promise<any>)(m);

export async function getTatumMcpTools(): Promise<ToolMap> {
  if (cached) return cached;
  if (process.env.TROOF_DISABLE_MCP === "1") return {};
  try {
    const { Client } = await lazyImport("@modelcontextprotocol/sdk/client/index.js");
    const { StdioClientTransport } = await lazyImport("@modelcontextprotocol/sdk/client/stdio.js");

    // Path built from segments (not one literal) so it isn't traced into the serverless bundle.
    const cli =
      process.env.TATUM_MCP_CLI ??
      [process.cwd(), "node_modules", "@tatumio", "blockchain-mcp", "dist", "cli.js"].join("/");

    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [cli],
      env: { ...process.env, TATUM_API_KEY: process.env.TATUM_API_KEY ?? "" },
    });
    const client = new Client({ name: "troof-agent", version: "1.0.0" });
    await client.connect(transport);

    const { tools } = await client.listTools();
    const wrapped: ToolMap = {};
    for (const t of tools as Array<{ name: string; description?: string; inputSchema?: object }>) {
      wrapped[t.name] = tool({
        description: t.description ?? t.name,
        inputSchema: jsonSchema(t.inputSchema ?? { type: "object", properties: {} }),
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
    console.log(`[mcp] Tatum MCP connected - ${Object.keys(wrapped).length} tools`);
    return wrapped;
  } catch (e) {
    console.warn("[mcp] Tatum MCP unavailable, falling back to local tools:", (e as Error).message);
    return {};
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
