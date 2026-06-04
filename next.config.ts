import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Tatum stdio MCP + MCP SDK are only used in local dev (TROOF_DISABLE_MCP=1 on serverless).
  // Keep them out of the server bundle so the function stays well under Vercel's size limit.
  serverExternalPackages: ["@tatumio/blockchain-mcp", "@modelcontextprotocol/sdk"],
  outputFileTracingExcludes: {
    "**": [
      "node_modules/@tatumio/blockchain-mcp/**",
      "node_modules/@modelcontextprotocol/**",
    ],
  },
};

export default nextConfig;
