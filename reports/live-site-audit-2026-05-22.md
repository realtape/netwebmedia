# NetWebMedia — Deep Live-Site Audit

**Date:** 2026-05-22
**Scope:** netwebmedia.com production (live HTTP) — security headers, SEO/AEO infra, pricing consistency, redirects, schema, broken-link sweep across 526 discovered URLs, internal-page lockdown.
**Method:** Direct curl probes (full Chrome UA + Origin) + Firecrawl URL map. No staging; all checks against production.
**Baseline compared:** `reports/live-site-audit.md` (2026-04-28, scored 7.2/10).

---

## Executive Summary

**Overall health: 9.0 / 10 — up sharply from 7.2 (Apr 28).** Every Priority-1 through Priority-5 issue from the April baseline is now fixed and verified live. Security posture is strong (CSP enforced, HSTS preloaded, real 404s, internal pages locked to 403). Pricing is fully consistent at the canonical ladder ($249 / $999 / $2,490) with **zero** stray `$2,499` and **zero** stray retired-tier CMO pricing. AEO infrastructure is best-in-class (llms.txt + comprehensive AI-crawler allowlist).

Remaining issues are **low-severity**: one orphan page that 404s due to a deploy-allowlist gap, one stale "Scale tier" copy reference (fixed in this pass), and a product naming overlap. Nothing here is a fire.

---

## Baseline Regression — All April P1–P5 Now FIXED ✅

| # | April 2026 finding | Status today | Evidence |
|---|---|---|---|
| P1 | Industry canonicals pointed to 406 subdomains | **FIXED** | All 14 hubs self-canonical (`/industries/<niche>/`), verified legal/healthcare/restaurants/beauty/real-estate |
| P2 | `blog/` served Apache directory listing | **FIXED** | `/blog/` now 301 → `/blog.html`; no listing exposed |
| P3 | `pricing.html` missing robots meta | **FIXED** | `index, follow, max-image-preview:large` present |
| P4 | Industry pages had zero JSON-LD | **FIXED** | 5 JSON-LD blocks per industry hub |
| P5 | Pricing meta description / FTC risk | **N/A** | Pricing now consistent; ladder reflects $2,490 |

---

## Current Health by Dimension

### 1. Security & Headers — 9.5/10
| Check | Result |
|---|---|
| HSTS | `max-age=31536000; includeSubDomains; preload` ✅ |
| CSP | **Enforced** (not Report-Only); scoped `script-src`/`connect-src` allowlists ✅ |
| X-Frame-Options | `SAMEORIGIN` ✅ |
| Referrer-Policy | `strict-origin-when-cross-origin` ✅ |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` ✅ |
| Internal pages (diagnostic/flowchart/orgchart/dashboard/nwmai/audit-report) | All **403** ✅ |
| Soft-404 test | Bogus URL returns true **404** (no soft-404) ✅ |

### 2. Redirects & Canonicalization — 10/10
- `www → non-www`: 301 ✅
- `/pricing → /pricing.html`, `/services → /services.html`: 301 ✅
- Folder URLs (`/industries/...`, `/social`, `/crm-demo`, `/es`, `/app/*`): 301 → trailing-slash, all resolve **200** ✅

### 3. Pricing Consistency — 10/10
- Live `pricing.html`: **$249 / $999 / $2,490** only. Zero `$2,499`, zero `$2,990`.
- Repo-wide: **zero** `$2,499` tokens anywhere.
- The four files containing `$2,990` are **unrelated products**, not the CMO ladder: reseller margin ranges (`partners.html`, `nwm-cms.html`), website-build pricing (`tutorials/websites.html`), multi-channel ad-management example (`tutorials/paid-ads.html`). The 2026-05-21 repricing sweep was clean.

### 4. SEO / AEO Infrastructure — 9.5/10
- Sitemap: **510 URLs**, all `lastmod 2026-05-21` (fresh).
- `llms.txt` + `llms-full.txt`: **200**, `text/plain` ✅ (excellent AEO hygiene).
- robots.txt: explicit allowlist for GPTBot, ClaudeBot, OAI-SearchBot, PerplexityBot, Google-Extended, Bingbot, + ~15 more.
- `.well-known/apple-app-site-association`: **200**, `application/json`, no redirect ✅ (mobile deep-linking correct).
- All 14 industry hubs present with 5 schema blocks + robots meta each.

### 5. Broken-Link Sweep — 9/10
Swept all 70 non-blog pages + blog sample (526 discovered URLs). Result: **1 genuine 404** (below). Every other non-200 was an expected canonicalization 301 that resolves to 200.

---

## Open Findings (prioritized)

### F-1 — `competitive/` directory never deployed → 404 live (LOW/MEDIUM)
`competitive/instagram-reels-battlecard.html` exists in the repo (30 KB, committed Apr 24) and was discovered by the crawler, but returns **404** in production.
**Root cause:** `competitive/` is missing from BOTH the `on.push.paths` triggers and the staging `for d in …` allowlist (line 190) in `.github/workflows/deploy-site-root.yml` — the exact "new top-level directory" gotcha documented in CLAUDE.md.
**Note:** Not linked from any current live page (orphan), so user-facing impact is low. It is also a *competitive battlecard* — likely an internal sales asset.
**Decision needed:** Either (a) add `competitive/` to the two deploy spots if it should be public, or (b) leave it un-deployed (and optionally remove the file) if it's internal. **Recommend (b)** unless Carlos wants it public.

### F-2 — Stale "Scale tier" copy in `faq.html` (LOW) — **FIXED THIS PASS** ✅
`faq.html:1634` read "Power users get raw BigQuery exports on the **Scale tier**" — references a tier retired in the 2026-05-20 sweep. Corrected to "**CMO Premium tier**" (the current top tier). Pending deploy.

### F-3 — `email-marketing.html` reuses retired "Scale" tier name (LOW)
The email-marketing product ships its own ladder (Starter $99 / Growth $249 / **Scale $599**) in both visible plans and JSON-LD `Offer`. This is a *distinct product*, so it's not a pricing bug — but reusing the retired "Scale" brand name risks confusion with the old CMO tier.
**Recommend:** Rename to a non-colliding label (e.g., "Pro" or "Volume") for brand cleanliness. Not urgent.

### F-4 — `priceValidUntil` schema staleness (LOW / watch)
April audit flagged `priceValidUntil: 2026-07-01` in pricing schema. Set a calendar reminder to roll this forward before July 1 to keep Offer schema valid.

---

## What's Working (no action needed)
- Brand standards hold: Navy/Orange, WhatsApp/email CTAs (no stray `wa.me` spraying), no LinkedIn/X.
- Canonical phone `+1 (760) 334-8731` consistent with click-to-chat.
- 14-niche taxonomy intact across industry hubs + subcategory pages (hotels, vineyards, agribusiness).
- Spanish `/es/` resolves 200; bilingual surface intact.

---

## Recommended Next Actions
1. **Decide F-1** (deploy `competitive/` vs. leave internal) — only item needing a Carlos call.
2. **Ship F-2** (faq fix) on next push — done, awaiting deploy.
3. **F-3 rename** when convenient (brand hygiene).
4. **F-4** calendar reminder before 2026-07-01.

---

*Generated 2026-05-22 · Method: live curl probes + Firecrawl map · Prior baseline: 2026-04-28 (7.2/10) → today 9.0/10*
