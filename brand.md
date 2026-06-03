# Troof — Brand

> **Troof** · troof.site · *Verifiable AI for Sui. AI you can re-check yourself.*

Source of truth for color, type, and voice. `frontend-design` / `impeccable` read this file.

## Direction
**"Cryptographic instrument."** Stark Minimal base + Workstation Dense data traits. Dark-first,
near-black, precise. Feels like a precision tool, not an AI toy.

## Palette: **Pure Mono** (chosen via brand-design)
Truest black-and-white. **There is no chromatic accent.** Links, focus rings, and "live" indicators
use a neutral light gray (`--brand`). This is deliberate:

## The one rule that defines the brand
**Color is the proof.** The *only* saturated colors anywhere in the product are the verdict states:
- 🟢 **Verified** — `--verified` = `oklch(0.74 0.18 152)`
- 🔴 **Tampered** — `--tampered` = `oklch(0.637 0.237 25.5)`

Everything else — backgrounds, text, buttons, links, focus — is pure neutral. Green/red are **sacred**:
never decorative, never anything but a verification verdict. The wow-moment (green↔red) is therefore
the single most colorful thing a user ever sees.

## Color tokens (OKLCH — in `src/app/globals.css`)
Dark is the default (`.dark`); light is secondary.

| Token | Dark | Light | Use |
|---|---|---|---|
| `--background` | `0.135 0 0` | `1 0 0` | page (deepest near-black) |
| `--card` | `0.18 0 0` | `0.99 0 0` | lifted panels |
| `--foreground` | `0.98 0 0` | `0.14 0 0` | text |
| `--muted-foreground` | `0.62 0 0` | `0.44 0 0` | secondary text |
| `--primary` | `0.98 0 0` | `0.16 0 0` | primary buttons (stark white on dark) |
| `--border` | `1 0 0 / 7%` | `0.91 0 0` | barely-there hairlines |
| `--ring` | `0.7 0 0` | `0.4 0 0` | focus (monochrome) |
| `--brand` | `0.86 0 0` | `0.32 0 0` | links / focus / "live" — neutral gray, NOT a color |
| `--verified` | `0.74 0.18 152` | *(same)* | SACRED green — Verified verdict |
| `--tampered` | `0.637 0.237 25.5` | *(same)* | SACRED red — Tampered verdict |

Tailwind utilities: `bg-verified` `text-verified` `border-verified/30` `bg-verified-muted`
`text-tampered` `bg-tampered-muted` `text-brand` `bg-brand`. Radius `--radius: 0.5rem`.

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
No purple/indigo AI gradients · no glassmorphism · no neon glow · no emoji-as-icons · no `transition: all` ·
no centered-everything marketing slop · **no chromatic accent at all** · green/red ONLY for verdicts · no pure `#000`.

> Backup of the previous theme at `src/app/globals.css.bak`. Preview at `.brand-preview/` (safe to delete: `rm -rf .brand-preview/`).
