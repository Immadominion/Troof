# Architecture diagram specs

Each JSON in this folder is a **brief for one architecture image** — feed it to an AI image/diagram
tool (or a designer) to produce a consistent figure for the README / pitch deck. Rendered images go
in `docs/diagrams/out/` and are referenced from the README.

**Shared visual style (keep all diagrams consistent):**
- Theme: "Pure Mono" — near-black background (`#0a0a0a`), white/light-gray text, **monospace** for ids/hashes/addresses.
- The ONLY saturated colors are the verdict states: **green = Verified**, **red = Tampered**. Everything else is neutral.
- Thin 1px connectors, rounded panels, subtle borders, generous whitespace. No gradients, no emoji, no drop shadows.
- Label the three sponsors where they appear: **Tatum** (data/RPC/MCP), **Walrus** (storage), **Sui** (anchor).

Files: `01-system-overview` · `02-seal-flow` · `03-verify-flow` · `04-troof-score` · `05-agent-mcp`.
