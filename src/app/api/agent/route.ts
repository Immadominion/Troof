import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { localAgentTools } from "@/lib/agent-tools";
import { getTatumMcpTools } from "@/lib/mcp";
import { anchorConfigured } from "@/lib/anchor";
import { rateLimit, clientIp, tooMany } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel Fluid (Hobby) cap

const SYSTEM = `You are Troof, an AI explorer for the Sui blockchain. You explain any wallet, token, or transaction in plain English, and you can seal any answer into a proof anyone can independently re-check.

Routing:
- A 0x… address with 64 hex chars → a WALLET. Use analyze_wallet.
- A coin type like 0x…::module::SYMBOL (or the user asks if a token is real/safe/a scam/impersonator) → a TOKEN. Use analyze_token.
- A base58 digest (~43–44 chars, NOT starting with 0x, e.g. "DZfCuQKR…") or any "what did this transaction/tx do" question → a TRANSACTION. Use analyze_transaction.
- Default to the "mainnet" network unless the user says testnet.

Workflow:
1. Call the matching analyze_* tool FIRST to get integrity-checked data (the token tool returns a Troof Score A–F; the transaction tool returns status, gas, what moved, and which contracts were called).
2. You may also call Tatum MCP tools (exchange rates, raw RPC via gateway_execute_rpc, supported-methods discovery) for extra context.
3. Write a short, honest answer. For transactions, lead with what actually happened (who, what moved, which contract). Always call out risks, especially coins that impersonate the "SUI" symbol from a non-canonical type. Never trust a token's symbol; only canonical 0x2::sui::SUI is valued in USD. Be honest about what cannot be verified via RPC.
4. SEALING IS OPTIONAL — when the user asks to "seal", "prove", or "save" it, or when the finding is notable (a scam token, a flagged wallet), call the matching seal_* tool with a one-line headline + a 2–4 sentence summary. This surfaces a "Seal this as a proof" BUTTON to the user; it does NOT seal automatically. In your reply, tell them they can click Seal to anchor the answer on Sui and store it on Walrus, producing a shareable proof anyone can re-verify. Do NOT claim a proof URL yourself — the user seals it. If they just want a quick read, don't prepare a seal.

Scope (be honest, never fake it):
- Troof reads SPECIFIC things: a given wallet, token, transaction, or object. It does NOT have a chain-wide index, so it CANNOT answer rankings/superlatives like "who holds the most SUI", "the most profitable wallet", "top tokens by volume", or "trending wallets" — those need an indexer Troof doesn't use. If asked, say so in one sentence, never invent names or numbers, and offer what you CAN do: "paste a specific wallet, token, or transaction and I'll explain it."

Style: concise, precise, plain text. Do NOT use emoji. Never invent numbers, use tool data. Use short markdown (a small table or bullets) where it aids clarity.`;

export async function POST(req: NextRequest) {
  const rl = rateLimit(`agent:${clientIp(req)}`, 12, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not set, add it to .env.local to enable the agent." },
      { status: 503 },
    );
  }

  const { messages, mode }: { messages: UIMessage[]; mode?: "fast" | "thinking" } = await req.json();

  // Real Tatum MCP tools (stdio) + local Tatum-engine tools. analyze/seal stay local for
  // integrity + reliability; MCP adds the genuine Tatum MCP surface.
  const mcpTools = anchorConfigured() ? await getTatumMcpTools() : {};

  // Fast = latest Haiku (cheap, snappy, great with this tightly-scoped prompt).
  // Thinking = Sonnet for harder, multi-hop questions.
  const model = anthropic(mode === "thinking" ? "claude-sonnet-4-6" : "claude-haiku-4-5");

  const result = streamText({
    model,
    system: SYSTEM,
    messages: await convertToModelMessages(messages),
    tools: { ...mcpTools, ...localAgentTools },
    stopWhen: stepCountIs(10),
  });

  return result.toUIMessageStreamResponse();
}
