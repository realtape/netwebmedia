---
name: NetWebMedia brand palette — final logo colors
description: Exact colors from the real final NWM logo (netwebmedia-logo-lockup.png) — navy + orange wordmark, Gulf Oil light blue for backgrounds
type: project
originSessionId: a00cc6b2-77c0-46d9-8a15-e45dd927b098
---
The real final NetWebMedia logo (`assets/images/netwebmedia-logo-lockup.png`) uses:

- **Navy**: `#1B2A4A` — "net" and "media" wordmark text
- **Orange**: `#F47920` — "web" wordmark text, accents
- **Gulf Blue**: `#00AEEF` — used for section heading fonts AND as primary background color (cover, stat boxes, CTA page) in guides/PDFs

**Why:** Gulf Oil racing livery — light blue is the dominant background color, orange is the stripe/accent. This is the correct Gulf Oil look (like the Porsche 917 livery: powder blue + orange).

**Guide CSS** (`css/guide.css`) tokens:
- `--navy: #1B2A4A` → dark text, structural accents
- `--gulf-blue: #00AEEF` → ALL colored backgrounds + heading font color on white pages
- `--orange: #F47920` → CTAs, section numbers, stat figures, decorative accents

**How to apply:**
- Dark backgrounds (covers, callout boxes, CTA pages) → `--gulf-blue`, not `--navy`
- Text ON gulf-blue backgrounds → `--navy` (dark navy for contrast)
- Text ON white backgrounds → `--gulf-blue` for headings, `--text` (#111827) for body
- Orange is always the accent/CTA color — never use it as a background

**Previous wrong values** (do not use): `#010F3B` (navy), `#FF671F` (orange).
