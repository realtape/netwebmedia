# NetWebMedia — Final Site Rating (Pass 4)

**Date:** 2026-04-29 (~21:20 UTC) · **Auditor:** Engineering Lead
**Method:** live curl on production headers/HTML, schema parse on three new pages, sitemap diff, billing endpoint probe, mobile-UA cache test. PSI live run was **blocked**: Google PageSpeed API quota for the project is exhausted (HTTP 429 — "Queries per day = 0"). PSI numbers below are inferred from server-timing/payload, not a fresh Lighthouse run.

---

## 1. Engineering / technical — 8.0 / 10  (was 7.5)

**Verified live on prod:**
- `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=86400` on HTML (correct edge-cache)
- `Cache-Control: public, max-age=31536000, immutable` on `/css/styles.css?v=8` and `/js/main.js?v=8` (correct, both 200)
- `Vary: Accept-Encoding` clean (no `User-Agent`) — same `Content-Length: 93501` on desktop and iPhone UA, confirming no UA-keyed cache fragmentation
- `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, **proper CSP** (Sentry, Cloudflare Turnstile, GA, FB pixel allowlisted only) — clean
- `www.netwebmedia.com → netwebmedia.com` 301 confirmed
- `/crm-vanilla/api/schema.sql` → 403, `/crm-vanilla/README.md` → 403, `/crm-vanilla/migrations/` → 403 — block is live
- `/api/health` returns `{"ok":true,...,"service":"netwebmedia"}` with `Cache-Control: no-store`
- Server-side Sentry require is in `api-php/index.php` line 15

**Regressions / unfixed:**
- **Still HTTP/1.1**, not h2. Server advertises `Upgrade: h2,h2c` but the actual connection didn't upgrade — likely Apache `mod_http2` is configured but the cPanel front-end is not negotiating ALPN. **Mobile LCP cost: ~150–300ms of head-of-line blocking.**
- **Still gzip-only, no Brotli.** No `Content-Encoding: br` even with `Accept-Encoding: br, gzip`. ~15–20% wasted bytes on every HTML/CSS/JS hit.
- **PSI quota burned.** Cannot verify Lighthouse numbers today. Set up a real key on the workflow or stop hammering the unauth endpoint.
- **`/pricing` (extensionless) returns 301 → `/pricing.html`.** Violates the canonical URL rule in `CLAUDE.md` ("top-level pages have NO extension"). The rewrite is reversed. Same likely true for other top-level pages — needs audit.
- ModSecurity is throwing 406 on plain `curl` UA against `robots.txt` and several `/api/*` paths. Real bots are fine, but it makes ops debugging miserable and may false-positive on legitimate scrapers.

**Improved:** caching, headers, htaccess hardening, server-side Sentry, multi-tenant CRM gates, secret rotation workflow.
**Regressed:** none from this morning — but the unfinished items (HTTP/2, Brotli, extensionless rewrite) are the same ones that capped the morning score.

## 2. Creative / brand / UX — 7.0 / 10  (was 7.3)

**Verified:**
- Founder strip renders above the fold with `/assets/founder-carlos.svg` (real SVG monogram, navy/orange linear gradient, accessible `role="img"` + `<title>`). `fetchpriority="high"` is in the document. Good.
- Industry icon system on homepage uses `class="icon icon-tourism"` etc. (10 distinct icon classes) and `class="service-icon service-icon-{color}"` (6). All driven by CSS, no inline emoji per industry card.
- "Q2 2026 · Design Partner" framing **is consistent** between homepage (2 hits) and case-studies (16 hits). compare.html was demoted earlier today.

**Issues:**
- The "SVG mask system replacing 32 emojis across 4 pages" claim is **partly hollow on the homepage**. There are **zero `mask-image` declarations** and only **one `<svg>` inline**. Icons use background-image classes — that's fine, but it's not a "mask system." More importantly, the **footer social row still ships emoji glyphs**: 📸 (Instagram), ▶ (YouTube), 🎵 (TikTok). Font/render lottery. Replace with the same icon class scheme.
- AEO-methodology and case-studies pages do **not** include the founder strip or monogram — the trust signal stops at the homepage. New high-intent pages should reuse it.
- The Spanish/English bleed fix is real on the homepage (typewriter has both `data-words` and `data-words-es`), but the footer still has a hardcoded Spanish line ("Ver reseñas en Google →") with no `data-en` twin. Lang switch will still leak.

**Improved:** founder strip live, icon classes consistent on homepage cards, Q2 2026 badge unified.
**Regressed:** small — emoji-in-footer remained, monogram not propagated to new pages.

## 3. Content / SEO / AEO — 7.0 / 10  (was 6.0)

**Verified live:**
- `/aeo-methodology.html` — 68 KB, schema = **FAQPage (10 Q/A) + HowTo (5 steps) + Article + BreadcrumbList + Organization + ImageObject**. Strongest schema stack on the site.
- `/case-studies.html` — 41 KB, schema = **CollectionPage + 3× Article + BreadcrumbList**. Solid.
- `/aeo-survey.html` — 45 KB, schema = **FAQPage (5 Q/A) + WebPage + Organization**. Healthy.
- Homepage carries FAQPage + ProfessionalService + WebSite + SearchAction + BreadcrumbList — clean.

**Hard problems:**
- **None of the three new flagship pages are in `/sitemap.xml`** — confirmed by grep on the live XML. 206 URLs total, zero hits for `aeo-methodology`, `case-studies`, `aeo-survey`. Google won't discover them in a structured way until they're added. **Single highest-leverage SEO fix today.**
- **Cross-linking is asymmetric:** aeo-methodology links to itself 11x but to case-studies 0x. Case-studies links to itself 12x but to aeo-methodology 0x. They're islands. Each should link to the other in 2–3 places. PageRank is being wasted.
- Homepage has only **1 link to aeo-methodology and 2 to case-studies** — buried, not promoted. New pillar pages need hub-card placement.
- Citation probe via WebSearch: zero results for `"NetWebMedia AEO methodology"` site:netwebmedia.com — expected (~6h since launch), but Google hasn't even crawled them yet because of the sitemap miss.

**Improved:** 5,800w + 4,200w of new ranked-for-citation content with rich schema, FAQ schema added to top 5 blog posts, survey live.
**Regressed:** discoverability. New pages exist but the sitemap and cross-links don't surface them.

## 4. Conversion / product — 6.5 / 10  (was 6.0)

**Verified:**
- `/contact.html?topic=design-partner` returns 33 KB, the inline `autoSelectTopic()` IIFE reads `URLSearchParams`, maps `design-partner → partner`, sets the dropdown, and reveals a "Pre-selected" badge. **Funnel works.**
- pricing.html shows **7 instances of $2,499** (anchor price). Lower numbers are legitimate ($497, $249/mo, $99/mo) for sub-services or add-ons; the lone "$1,997" is contextual ("up to $1,997/mo Premium" on the video tier), not a regression.
- Stripe + MercadoPago wiring is referenced 13× in pricing.html.
- Billing endpoint `/api/billing/checkout` returns `{"error":"Not authenticated"}` for unauth POST — **correct behavior.**

**Issues:**
- The Stripe button can't be tested end-to-end without a logged-in user; auth-then-checkout is two clicks of friction on a $2,499 anchor. For cold traffic, the "Apply for the program" path is the right CTA — but the homepage above-fold buttons are still "Get a Free Audit" / "View Pricing", not "Apply for Q2 Design Partner Program." Pricing is what it is; the design-partner pitch is the realistic 2026-Q2 conversion path and it's not the primary CTA.
- The `$249/mo` and `$999/mo` repeat ten times each on pricing.html — competing anchors against the $2,499 hero. Pricing page is doing the **opposite** of focusing buyers; it's a buffet.
- Founder monogram is doing some trust-building work above the fold, but on the rest of the site (services, industries, blog) it disappears. Single-page trust ≠ site-wide trust.
- No exit-intent, no scroll-CTA, no testimonial carousel reuse on case-studies. Pages are static essays, not conversion machines.

**Improved:** dual-rail billing API live, design-partner deep link works, $2,499 anchor reconciled.
**Regressed:** none.

---

## Overall — **7.2 / 10**  (morning baseline 6.7)

Solid forward motion. The engineering hardening is real and verifiable; AEO content is genuinely strong on the page; the design-partner positioning is honest. The reason it's not 7.5+ is that **distribution and discoverability lag behind production** — content was shipped but not surfaced.

---

## Top 5 improvements still needed (impact ÷ effort)

1. **Add aeo-methodology, case-studies, aeo-survey to `/sitemap.xml` and submit via IndexNow.** 5 min of work, unlocks Google discovery of ~10K words of new pillar content. **Highest ROI on the list.**
2. **Cross-link the AEO pillar pages.** 30 min of editing. Add 2–3 reciprocal links between aeo-methodology and case-studies; add hub cards on the homepage. Internal PageRank is currently leaking.
3. **Fix `/pricing` extensionless rewrite (and audit the rest).** The rule in `CLAUDE.md` says no `.html` for top-level — `/pricing` is currently 301'ing to `/pricing.html`. Apache rewrite needs `RewriteRule ^pricing$ pricing.html [L]` (and equivalents). 15 min.
4. **Replace footer emoji social glyphs.** 📸 ▶ 🎵 → real SVG icons with the same classing scheme. 20 min. Brand consistency fix.
5. **Enable Brotli + verify HTTP/2 negotiation in cPanel.** Single Apache config touch (or open a ticket to InMotion). ~15–20% bandwidth savings sitewide and a real LCP win on mobile. 30–60 min.

## One brutal observation

**You are shipping faster than you are distributing.** Four audits today, three major content drops (aeo-methodology, case-studies, aeo-survey), a full multi-tenant CRM tenancy migration, dual-rail billing, and an icon system — and yet the three flagship AEO pages **are not in the sitemap**. The growth lever today wasn't writing more code or more copy. It was the 5-minute act of telling Google those URLs exist. The pattern to watch: every velocity-driven team eventually optimizes for "did we ship?" instead of "did anyone find it?" You are now on that curve. The fix is a 30-minute distribution checklist that gates every new page (sitemap + IndexNow + cross-link + homepage card + GA event) before the PR is allowed to merge — not a sixth audit.

---

**Files referenced (absolute paths):**
- `C:\Users\Usuario\Desktop\NetWebMedia\api-php\index.php` (Sentry require line 15, `/api/health` confirmed)
- `C:\Users\Usuario\Desktop\NetWebMedia\plans\audits\RATING-SYNTHESIS-2026-04-29.md` (morning baseline)
- `C:\Users\Usuario\Desktop\NetWebMedia\sitemap.xml` (needs 3 URLs added)
- `C:\Users\Usuario\Desktop\NetWebMedia\.htaccess` (root rewrites — `/pricing` extensionless rule missing)
- Live: `https://netwebmedia.com/aeo-methodology.html`, `/case-studies.html`, `/aeo-survey.html`, `/contact.html?topic=design-partner`
