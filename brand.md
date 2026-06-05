# Troof — Brand

> **Troof** · troof.site · *Verifiable AI for Sui. AI you can re-check yourself.*

Source of truth for color, type, and voice. `frontend-design` / `impeccable` read this file.

## Direction
**"Verifiable explorer."** Light-first, airy, approachable, with a single blue accent and soft
pastel atmosphere (the marketing surface), built on the same precise instrument underneath. The
dark "cryptographic instrument" theme remains available via the toggle.

## Palette: **Light + one blue accent** (evolved from Pure Mono)
Airy white surfaces, a near-black ink, and **one decorative accent: brand blue** (the logo blue,
`--brand` = `oklch(0.62 0.17 255)`). The blue is used for links, focus rings, sparkles, orbit rings,
button glow, and accent cards. Its chroma (0.17) is held **below** the verdict green (0.18) on purpose.
Soft pastel blue+amber blobs (`--blob-*`, via `.troof-blobs`) provide atmosphere, decoration only.

> The dark toggle keeps `--brand` neutral gray, so the dark theme stays Pure Mono.

## The one rule that defines the brand
**Color is the proof.** The blue is *decoration*; the only **signal** colors anywhere in the product
are the verdict states:
- 🟢 **Verified** — `--verified` = `oklch(0.74 0.18 152)`
- 🔴 **Tampered** — `--tampered` = `oklch(0.637 0.237 25.5)`

Green/red are **sacred**: never decorative, never anything but a verification verdict, never replaced by
blue. The wow-moment (green↔red) stays the most meaningful color on the page. Blue never renders a
status, a verdict, or a grade.

## Color tokens (OKLCH — in `src/app/globals.css`)
Light is the default (`:root`); dark is the toggle (`.dark`).

| Token | Light (default) | Dark | Use |
|---|---|---|---|
| `--background` | `1 0 0` | `0.135 0 0` | page |
| `--card` | `0.995 0.002 260` | `0.18 0 0` | panels / cards |
| `--foreground` | `0.17 0.005 270` | `0.98 0 0` | text |
| `--muted-foreground` | `0.44 0.012 265` | `0.62 0 0` | secondary text (AA on white) |
| `--primary` | `0.18 0.006 270` | `0.98 0 0` | primary buttons (near-black on light) |
| `--border` | `0.922 0.004 260` | `1 0 0 / 7%` | hairlines |
| `--ring` | `var(--brand)` | `0.7 0 0` | focus (blue on light, mono on dark) |
| `--brand` | `0.62 0.17 255` | `0.86 0 0` | **blue accent** (light) / neutral gray (dark) — decoration only |
| `--brand-soft` / `-ring` / `-glow` | derived via `color-mix` | *(same)* | chips, orbit rings, button glow |
| `--blob-blue` / `--blob-amber` | `0.80 0.10 250` / `0.89 0.075 75` | deeper | pastel blob field (decor only) |
| `--verified` | `0.74 0.18 152` | *(same)* | SACRED green — Verified verdict |
| `--tampered` | `0.637 0.237 25.5` | *(same)* | SACRED red — Tampered verdict |

Tailwind utilities: `bg-verified` `text-verified` `bg-verified-muted` `text-tampered` `bg-tampered-muted`
`text-brand` `bg-brand` `bg-brand-soft` `border-brand-ring`. Atmosphere: `.troof-blobs` (light),
`.troof-aurora` (dark). Radius `--radius: 0.75rem`.

## Typography
- **Geist Sans** — UI + headings. Tight display tracking (`tracking-tight`). Max 3 weights.
- **Geist Mono** — every cryptographic artifact (blob ids, SHA-256, Sui ids, tx digests, addresses, amounts) via the `.artifact` class; `tabular-nums` for figures.
- Wired via `next/font/google` in `src/app/layout.tsx` (variables `--font-geist-sans` / `--font-geist-mono`).

## Motion
Crisp springs, no bounce. Entry > exit. The **verdict badge flip** (green↔red) is the single
expressive moment; everything else ≤200ms and functional.

## Voice
Precise, confident, plain. We say "re-check," "prove," "anchored," "sealed," "untampered." We never
oversell the AI — the point is you don't have to trust it. One-sentence why: *a screenshot is
forgeable; a content-addressed blob anchored on-chain is not.*

## Don't (instant AI-slop tells)
No purple/indigo rainbow gradients · no glassmorphism overload · no neon/stacked glow · no emoji-as-icons ·
no `transition: all` · no gradient-filled headings · **blue is the ONLY accent** (no second chromatic color) ·
green/red ONLY for verdicts (never blue, never decorative) · sparkles used sparingly · no pure `#000`.

> Backup of the previous theme at `src/app/globals.css.bak`. Preview at `.brand-preview/` (safe to delete: `rm -rf .brand-preview/`).
