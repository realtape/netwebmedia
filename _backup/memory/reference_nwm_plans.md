# NetWebMedia canonical plan docs — always reference these

Carlos's directive (2026-04-21): when reasoning about NetWebMedia strategy, positioning, voice, roadmap, or execution, load these five files as the working context. They are the rendered, readable versions of the Markdown sources and the primary artifacts Carlos works from.

## The five canonical docs

| File | What it covers |
|---|---|
| `plans/index.html` | Hub page — links to all four plan docs below |
| `plans/business-plan.html` | Rendered from `BUSINESS_PLAN.md` — strategy, TAM/SAM/SOM, unit economics, scenarios, kill-switches, org + hiring, financial model |
| `plans/marketing-plan.html` | Rendered from `MARKETING_PLAN.md` — positioning pillars, audience, channels, content calendar, funnel, metrics dashboard |
| `plans/brand-book.html` | Rendered from `BRAND.md` — voice attributes, visual system, messaging hierarchy, boilerplate, glossary |
| `plans/execution-90day.html` | Rendered from `EXECUTION_90DAY.md` — 45 tasks across May 4 – Jul 31, 2026, with owners, dates, success criteria, gate metrics |

## Source-of-truth pairing

The `.md` files in `C:\Users\Usuario\Desktop\NetWebMedia\` are the source of truth. The `plans/*.html` files are the rendered web versions. When edits happen to a `.md`, the matching `.html` in `plans/` needs to be regenerated to stay in sync.

## When to use

- Any question about NetWebMedia strategy, pricing, positioning, voice, roadmap, hiring, OKRs, or content planning → consult the relevant file
- Before writing ANY brand-facing copy (web, email, social, sales, proposals) → `brand-book.html` and `marketing-plan.html` are mandatory context
- Before committing to a date or task scope → `execution-90day.html` is the source; any new dates should be synced to Google Calendar per the existing calendar-sync directive
- When answering Carlos strategically → frame against the plan's scenarios and kill-switches, don't invent new numbers

## Known state (as of 2026-04-21)

- Pricing: fCMO Lite $249 / Growth $999 / Scale $2,499 (monthly). Setup fees: $0 / $499 / $999. Repriced 2026-04-21.
- Carlos26 promo: **retired** 2026-04-21. Do not reference or distribute.
- `plans/*.html` files are **stale** vs. current `.md` sources (pre-dates 2026-04-21 repricing). Flagged in `EXECUTION_90DAY.md` pre-flight item #4. Regenerate before relying on HTML for client-facing use.
