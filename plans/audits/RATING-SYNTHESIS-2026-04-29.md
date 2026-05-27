# netwebmedia.com — Final Rating + Improvements
**Date:** 2026-04-29 (after a full day of fixes shipped)
**Auditors:** 4 parallel sub-audits — engineering, creative, content/AEO, conversion/product

---

## Overall rating: **6.7 / 10**

**A solid B+ foundation with one specific positioning gap that's keeping the whole grade down.**

Today's work moved the site from "fiction in code + leaking secrets" to "credible foundation, three clear gaps." The technical floor is now strong. The brand book is sharp. The schema is rich. But the AEO positioning ("Cited by Claude/ChatGPT/Perplexity") is **not yet true of NetWebMedia itself** — the brand teaches AEO mastery while getting zero external citations. Until that flips, the positioning is hollow and conversion stays low.

| Dimension | Score | Headline |
|---|---|---|
| **Engineering / technical** | 7.5 / 10 | Edge config excellent (HSTS, CSP, immutable assets, sitemap clean). Real gaps: still HTTP/1.1, no Brotli, `Vary: User-Agent` fragmenting cache, CSP `'unsafe-inline'` caps grade at A not A+, no server-side Sentry. |
| **Creative / brand / UX** | 7.3 / 10 | Hero is genuinely strong (typewriter elegant, value prop in 3 sec, trust strip placed before CTA). 18 emojis violate BRAND.md "We Are Not Cute" rule. No component library — buttons + cards drift across pages. Modest trust signals. |
| **Content / SEO / AEO** | 6.0 / 10 | Schema is textbook (14 `@type` values), robots.txt allows every AI crawler, llms.txt published. 60+ blog posts of real quality. **But zero AEO citations, zero original research, invisible in every "Top AEO Agency" 2026 ranking.** Positioning teaches what NetWebMedia doesn't yet do for itself. |
| **Conversion / product** | 6.0 / 10 | Hero is best-in-class. Self-serve Stripe checkout is **already built** at `pricing.html:873` — but primary CTAs route to `/contact.html` instead, leaving money on the table. Trust building is 4/10: only one anonymous Chile case study, in Spanish, on a US-targeted homepage. |

---

## ✅ Top wins to protect (from all 4 audits)

These are the things you got right. Don't let them regress.

1. **Hero converts in 3 seconds.** H1 + ICP + $249 price + dual CTA + "Cited by Claude/ChatGPT/Perplexity" differentiator all land before scroll. (Creative 8/10 + Conversion 8/10)
2. **Schema.org markup is textbook.** ProfessionalService, FAQPage, BreadcrumbList, BlogPosting, Person — 14 types. AI-crawler allowlist comprehensive. AEO infrastructure is correct.
3. **Edge config is best-in-class.** HSTS preload + enforced CSP + XFO + Permissions-Policy + HTTP/2 (apex), CSS/JS immutable 1-year cache, HTML edge-cacheable with stale-while-revalidate, sitemap clean, internal pages 403'd.
4. **Brand book exists and is precise.** Gulf Oil palette + Inter/Poppins/Space Grotesk are correctly applied where applied. The standard is documented; enforcement is the only gap.
5. **Multi-tenant CRM foundation is real.** Schema applied, handlers gated, branding render path live, security hardened — demoable end-to-end. (Today's afternoon build)

---

## 🚨 Top 8 improvements ranked by impact ÷ effort

### Tier 1 — Ship this week (transforms conversion)

| # | Improvement | From | To | Effort |
|---|---|---|---|---|
| 1 | **Wire self-serve Stripe checkout from `/pricing` CTAs.** Code already exists at `pricing.html:873`. Replace `/contact.html?plan=…` with the existing Stripe handler. | Conversion 6/10 | 7.5/10 | 1 hour |
| 2 | **Generate real trust signals.** 3 named US case studies (even if pre-revenue, frame as pilots/design partners), founder photo + bio above-fold, 1 founder Loom video on homepage. | Conversion 6/10 + Creative 7/10 | 8/10 each | 4-6 hours |
| 3 | **Fix English/Spanish bleed.** Spanish "Nuestros clientes" block (line 935-957 in `index.html`) is on the US-targeted English homepage. Either translate to English with US framing or move to Spanish-only path. | Creative 7.3/10 → 8/10 | UX gut-check | 30 min |
| 4 | **Publish "NetWebMedia AEO Methodology" landing page** with a named framework. Make this the one quotable thing every AEO post links to. The blog post about "AEO Replaces SEO" doesn't itself use FAQ schema — fix both: add FAQ schema to top 5 blog posts (2 hrs) + write the methodology page (3 hrs). | Content 6/10 → 7.5/10 | 5 hours |

### Tier 2 — Ship this month (lifts ceiling)

| # | Improvement | Effort |
|---|---|---|
| 5 | **Replace 18 emojis** in nav dropdowns + service cards + section titles with a unified SVG icon system. Direct BRAND.md violation today ("We Are Not Cute"). | 4-6 hours |
| 6 | **Component library** — consolidate 3 different card border treatments + scattered button styles into CSS pattern library. Prevents future drift. | 2-3 hours |
| 7 | **Original research push** — survey 200-300 SMBs on AEO adoption, publish report, pitch to TechCrunch/CMSWire/HubSpot. This is the moat. AEO agencies that get cited have all done this. | 3-4 weeks |
| 8 | **CTA copy specificity** — "Free AI Audit" → "Free 48-Hour Written Audit" everywhere (matches BRAND.md "Name things exactly" principle). | 30 min |

### Tier 3 — Quick technical wins

| # | Improvement | Impact | Effort |
|---|---|---|---|
| 9 | Enable **HTTP/2** at apex (currently HTTP/1.1) + **Brotli compression** | TTFB + transfer size | cPanel toggle, 5 min |
| 10 | Strip `User-Agent` from `Vary:` header — fragmenting cache keys for no benefit | CDN cache-hit ratio | 2 lines `.htaccess` |
| 11 | Add `fetchpriority="high"` on LCP element + remove `loading="lazy"` from above-the-fold logo | LCP score | 5 min |
| 12 | Add **server-side Sentry** to `api-php` (currently JS-only). PHP errors today only land in `error_log` with no aggregation. | Observability | 30 min |

---

## ⚠️ Errata from the audits

**The engineering audit reported a P0:** "`/api/public/*` returns 404 — newsletter signups and audit requests silently failing." **I verified live and this is a false positive.**

```
/api/public/blog → 200
/api/public/audit (POST) → 400 (reachable, validation rejects empty body)
/api/public/newsletter/subscribe (POST) → 200
```

The `.htaccess` line `RewriteRule ^api-php(/|$) - [F,L]` blocks direct `/api-php/` access (correct — that's a security measure), but `/api/*` routing to `api-php/index.php` is handled separately and works. API is healthy.

The other engineering findings (HTTP/1.1, no Brotli, Vary fragmentation, CSP unsafe-inline, no server-side Sentry) are all legitimate — see Tier 3 above.

---

## The single biggest barrier to growth

**You teach AEO mastery while getting zero AEO citations yourself.**

This is the brutal one. NetWebMedia's homepage promises "Get cited by ChatGPT, Claude, Perplexity & Google AI" — but a search for `"AEO agency" 2026` doesn't surface NetWebMedia in any of the major rankings (First Page Sage, Modern Marketing Partners, Minuttia, ACHIEVE CMO, Respona). Competitors who do appear there have all built moats through:

- **Original research reports** (e.g. First Page Sage's "Surround Sound SEO" framework)
- **Tier 1 backlinks** (Harvard Business Review, CMSWire, HubSpot)
- **Named, quotable methodologies** that other writers cite
- **Industry roundup mentions**

NetWebMedia has none of these yet. The blog has 60+ well-written posts. The infrastructure (schema, robots.txt, llms.txt) is perfect. But none of it generates citations.

**The fix isn't more blog posts — it's earning ONE Tier 1 citation.** Pick one of these three plays:

1. **Original research:** survey 200-300 SMB owners about AEO adoption + publish the data. Pitch to TechCrunch's marketing vertical, CMSWire, HubSpot's blog as a guest contributor.
2. **Named framework:** brand and document the "NetWebMedia AEO Methodology" — a 5-step process. Make it the thing other writers reference when they explain what AEO is.
3. **Public pitch in a major roundup:** apply to be evaluated by First Page Sage / Modern Marketing Partners / Respona for their 2026 Q3 AEO agency rankings. Half of those slots go to applicants, not just incumbents.

Pick one in the next 30 days. Until you do, NetWebMedia stays at 6/10 on the dimension that defines its positioning.

---

## What this means for the white-label motion

Today's afternoon build made the white-label CRM foundation real. Today's content audit says **the master brand isn't yet citable.** These are connected: a design partner buying white-label is buying NWM's positioning + their own brand on top. If NWM's positioning is "Cited by AI" but isn't actually cited, the design partner buys vapor.

**Before onboarding the first paying design partner:**
1. Fix Tier 1 (#1-#4 above) — especially #4 (the AEO Methodology page + FAQ schema on top blog posts)
2. Apply for at least one AEO agency ranking (#7) — even being mentioned on the long list is a citation moat
3. One named US case study published (#2)

That's a 1-week effort from here. Then the white-label motion has something honest to sell.

---

## Files

All audit detail in `plans/audits/`:
- `RATING-engineering-2026-04-29.md`
- `RATING-creative-2026-04-29.md`
- `RATING-content-2026-04-29.md`
- `RATING-conversion-2026-04-29.md`
- `RATING-SYNTHESIS-2026-04-29.md` ← this file

Today's earlier work (already shipped):
- `audit-2026-04-29.md` (morning baseline)
- `SYNTHESIS-POST-BUILD-2026-04-29.md` (afternoon — multi-tenant + security + GTM)
- `multi-tenancy-foundation-2026-04-29.md`, `handler-migration-2026-04-29.md`, `branding-render-2026-04-29.md`, `admin-ui-2026-04-29.md`, `tenancy-patches-2026-04-29.md`, `frontend-patches-2026-04-29.md`, `secret-lockdown-2026-04-29.md`
