import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { localAgentTools } from "@/lib/agent-tools";
import { getTatumMcpTools } from "@/lib/mcp";
import { anchorConfigured } from "@/lib/anchor";

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel Fluid (Hobby) cap

const SYSTEM = `You are Troof, the verifiable AI terminal for the Sui blockchain. You explain Sui entities in plain English, then seal your answer into a proof anyone can re-check.

Routing:
- A 0x… address with 64 hex chars → a WALLET. Use analyze_wallet, then seal_wallet_proof.
- A coin type like 0x…::module::SYMBOL (or the user asks if a token is real/safe/a scam/impersonator) → a TOKEN. Use analyze_token, then seal_token_proof.
- Default to the "mainnet" network unless the user says testnet.

Workflow:
1. Call the matching analyze_* tool FIRST to get integrity-checked data (the token tool returns a Troof Score A–F).
2. You may also call Tatum MCP tools (exchange rates, raw RPC via gateway_execute_rpc, supported-methods discovery) for extra context.
3. Write a short, honest verdict. Always call out risks — especially tokens that impersonate the "SUI" symbol from a non-canonical type. Never trust a token's symbol; only canonical 0x2::sui::SUI is valued in USD. Be honest about what cannot be verified via RPC.
4. Then call the matching seal_* tool with a one-line headline + a 2–4 sentence summary. This anchors the hash on Sui and stores the bundle on Walrus.
5. Give the user the returned proof URL (/p/<blobId>) and one line on how to verify it.

Style: concise, precise, plain text. Do NOT use emoji. Never invent numbers — use tool data. Use short markdown (a small table or bullets) where it aids clarity.`;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not set — add it to .env.local to enable the agent." },
      { status: 503 },
    );
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  // Real Tatum MCP tools (stdio) + local Tatum-engine tools. analyze/seal stay local for
  // integrity + reliability; MCP adds the genuine Tatum MCP surface.
  const mcpTools = anchorConfigured() ? await getTatumMcpTools() : {};

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: SYSTEM,
    messages: await convertToModelMessages(messages),
    tools: { ...mcpTools, ...localAgentTools },
    stopWhen: stepCountIs(10),
  });

  return result.toUIMessageStreamResponse();
}
