---
status: verified
phase: 01-cmo-pricing-404-cleanup
source: [git commits 794ceaa53 (F-04), 50c34e4fc (F-03), 9221efa22 (F-01/F-02)]
verified_by: claude
started: 2026-05-21T10:00:00-04:00
updated: 2026-05-22T00:00:00-04:00
---

# Verification — CMO Pricing Cleanup + Custom 404

Goal-backward verification of the recently shipped pricing-tier cleanup (retire CMO
Scale/Lite/Enterprise + the $2,990 price; canonical ladder = AEO Starter $249 /
CMO Growth $999 / CMO Premium $2,490 / Custom-Agency) and the branded bilingual
custom 404 page. These deliverables landed across commits F-01, F-02, F-03, F-04 but
were never captured in a GSD phase artifact; this file records an after-the-fact,
objective verification against the live working tree.

## Method

Objective greps against the working tree (not conversational UAT — every check below
is reproducible):

- Canonical price ladder presence/absence in `pricing.html`
- Retired CMO tier names (`Scale` / `Lite` / `Enterprise`) in fractional-CMO context
- Retired `$2,990` CMO-Premium price across all `*.html`
- `404.html` existence, bilingual (`data-en`/`data-es`) + brand markers
- `ErrorDocument 404` wiring in root `.htaccess`
- Deploy scope of `docs/` (staging allowlist in `deploy-site-root.yml`)

## Results

| # | Deliverable | Verdict | Evidence |
|---|---|---|---|
| 1 | Pricing page shows canonical ladder, no retired tiers | PASS | `pricing.html:154,448,460,661` — Starter $249 / Growth $999 / Premium **$2,490** |
| 2 | Retired CMO tier names removed from PUBLIC copy | PASS (resolved 2026-05-22) | `compare.html:426` fixed; no fractional-CMO "Scale plan" remains. Product "Scale" tiers (email/SEO/ads) are distinct products, not the retired CMO tier |
| 3 | Retired `$2,990` price removed from internal docs | PASS (resolved 2026-05-22) | docs/** re-derived to $2,490; zero $2,990 in docs/**. Remaining 4 site-wide $2,990 tokens are unrelated products (reseller/website/ads) |
| 4 | Custom 404 renders branded + bilingual | PASS | `404.html` present, 22 `data-en`/`data-es`/brand-color/brand-name markers |
| 5 | 404 wired via ErrorDocument | PASS | `.htaccess:41` → `ErrorDocument 404 /404.html` |

## Scope note (severity calibration)

`docs/` is **not** in the `deploy-site-root.yml` staging allowlist (`for d in …` at
line ~190), so `docs/**` files are internal-only and never reach the public server.
This is consistent with F-04's "from internal docs" scope. `compare.html` IS a public
root page (root `*.html` deploys), so its residual ranks higher than the `docs/` ones.
`coyhaique-digital-gaps.html` is internal (`*-digital-gaps.html` is `.htaccess`-blocked
publicly).

## Gaps

See `01-UAT.md` `## Gaps` for the structured, machine-parseable findings consumed by
`/gsd-audit-fix` and `/gsd-plan-phase --gaps`.

**Status: all gaps resolved (verified 2026-05-22).** The original 4 findings were closed
during the 2026-05-21 site-wide $2,490 reprice (Carlos approved full re-derivation of the
historical sims/proposals). A 2026-05-22 `/gsd-audit-fix` re-verification confirmed zero
`$2,990` in `docs/**` and no fractional-CMO "Scale plan" in public copy, and additionally
corrected a stale `docs/payment-flow-tutorial` recommendation that had advised resurrecting
the retired "CMO Standard $1,490" tier (now records the Option A resolution: CMO Growth $999).
Note: the canonical Premium price is **$2,490** (Carlos reconfirmed 2026-05-22) — the
earlier `$2,499` references in this phase were stale and have been corrected throughout.
