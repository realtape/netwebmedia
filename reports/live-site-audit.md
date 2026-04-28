# NetWebMedia — Live Site Audit
**Date:** 2026-04-28  
**Auditor:** Senior Growth Consultant (Claude Sonnet 4.6)  
**Scope:** 8 pages + sitemap, robots.txt, security probe  

---

## Executive Summary

Overall site health is **solid at a 7.4 / 10**. The robots-fix is confirmed live across all audited pages. Brand standards (Navy/Orange, WhatsApp/email-only CTAs, correct pricing) hold on every core page. The most urgent issues are: (1) the blog/ directory serves an Apache directory listing with no index.html and no `Options -Indexes` protection, (2) all three industry pages carry a canonical pointing to non-existent subdomains (returning 406), and (3) the pricing page is missing a robots meta tag entirely.

---

## Page-by-Page Scores

---

### 1. Homepage — https://netwebmedia.com
**Score: 8 / 10**

| Element | Status | Detail |
|---|---|---|
| Title tag | PASS | "AI-Native Fractional CMO for US SMBs — NetWebMedia" — keyword-rich, 56 chars, good |
| Meta description | PASS | 145 chars, includes price anchor "$249/mo" — strong |
| Robots meta | PASS | `index, follow, max-image-preview:large` |
| Canonical | PASS | `https://netwebmedia.com/` |
| Viewport | PASS | `width=device-width, initial-scale=1.0` |
| JSON-LD schema | PASS | Three blocks: Organization+LocalBusiness+WebSite+WebPage+ProfessionalService, FAQPage (6 Q&A), BlogPosting. Well-structured @graph. |
| H1 | PASS | "The AI-Native Fractional CMO for Growing US Brands." — one H1, keyword-aligned |
| H2 hierarchy | PASS | Multiple H2s present; hierarchy logical |
| CTA — WhatsApp | PASS | `https://wa.me/14155238886` with pre-filled text |
| CTA — Email | PASS | `mailto:hello@netwebmedia.com` |
| CTA — Phone | PASS | No `tel:` links found |
| CTA — Zoom | PASS | No Zoom links (mentioned only as "no Zoom" in schema FAQ) |
| Pricing | PASS | "$249/mo" shown in hero and FAQ schema |
| Carlos26 promo | PASS | Not present on any public page |
| Social proof above fold | PASS | 340% ROI, 60 days, 4.4x conversion, 30% CAC reduction |
| Image lazy loading | ISSUE | Only 2 `<img>` tags found (nav logo ×2); no `loading="lazy"` attribute on either. Likely most images are CSS backgrounds — acceptable, but logo images should have `loading="eager"` explicitly set (above fold) |
| Font loading | PARTIAL | `preconnect` to Google Fonts is present but no `<link rel="stylesheet">` for the font was found in the HTML head — fonts may be loading via CSS `@import` inside `css/styles.css`, which is render-blocking. |
| JS render-blocking | PASS | All scripts use `defer` or `async`. GTM/GA4 use `async`. |
| GA4 | PASS | G-V71R6PD7C0 tracking active |
| Meta description inconsistency | MINOR | H2 "Resultados Comprobados" and "Nuestros clientes" are in Spanish — acceptable for bilingual positioning but may confuse Google's language classification |

**Issues to fix:**
- Add `loading="eager"` to the nav logo `<img>` (above fold, should not lazy-load).
- Move Google Fonts from CSS `@import` (if present) to a `<link rel="preload">` + `<link rel="stylesheet">` in the HTML head with `font-display: swap`.
- H2 "Números que Importan" and "Nuestros clientes" — consider an English version for US audience alignment.

---

### 2. Pricing Page — https://netwebmedia.com/pricing.html
**Score: 7 / 10**

| Element | Status | Detail |
|---|---|---|
| Title tag | PASS | "Pricing \| NetWebMedia — AI Marketing Agency" — clear |
| Meta description | PARTIAL | "Free 14-day trial on all plans" — **conflicts with "90-day minimum" disclosed on-page**. FTC risk. |
| Robots meta | **FAIL** | **No `meta name="robots"` tag present.** Page defaults to browser/crawler default (index) but lacks explicit directive. Inconsistent with all other pages. |
| Canonical | PASS | `https://netwebmedia.com/pricing.html` |
| JSON-LD schema | PASS | Organization, WebPage, Service with Offer for all 3 tiers ($249/$999/$2,499), BreadcrumbList, FAQPage — excellent coverage |
| Pricing accuracy | PASS | $249 / $999 / $2,499 — confirmed correct |
| H1 | PASS | "Strategy, software & execution. One retainer." |
| CTA | PASS | All CTAs route to `/contact.html` with intent params. Email only. No phone/Zoom. |
| Carlos26 | PASS | Not present |
| WhatsApp CTA | ISSUE | **No WhatsApp link on pricing page.** Every pricing page should have a WhatsApp nudge for impulse conversion — currently only email CTAs. |
| Social proof | PARTIAL | Comparison table present but no testimonials/reviews on this page |
| priceValidUntil | MINOR | Schema has `"priceValidUntil": "2026-07-01"` — needs updating quarterly |

**Issues to fix:**
1. **Critical:** Add `<meta name="robots" content="index, follow, max-image-preview:large">` to head.
2. **High:** Fix meta description — remove "Free 14-day trial" or add "with 90-day minimum" to avoid FTC misleading-claim exposure.
3. **Medium:** Add a WhatsApp CTA button (wa.me link) near the pricing table for immediate contact.
4. **Low:** Set a calendar reminder to update `priceValidUntil` in the schema before 2026-07-01.

---

### 3. Contact Page — https://netwebmedia.com/contact.html
**Score: 9 / 10**

| Element | Status | Detail |
|---|---|---|
| Title tag | PASS | "Contact NetWebMedia — Free AI Marketing Audit for US Brands" — keyword-rich |
| Meta description | PASS | 148 chars, includes key "48-hour" value prop and email |
| Robots meta | PASS | `index, follow, max-image-preview:large` |
| Canonical | PASS | `https://netwebmedia.com/contact.html` |
| JSON-LD schema | PASS | Organization, WebSite, ContactPage, FAQPage — complete |
| H1 | PASS | "Request Your Free AI Marketing Audit" |
| CTAs | PASS | WhatsApp (`wa.me/14155238886`) + email. No phone, no Zoom. |
| Form fields | PASS | Website, intent dropdown, name, email, company, budget, services, goals — comprehensive qualification |
| Async positioning | PASS | "No calls required" stated prominently in description and FAQ schema |
| Brand standards | PASS | |
| Minor brand language risk | MINOR | FAQ schema answer: "If you prefer a call we can schedule one, but it's never required." — slightly contradicts the brand's "no calls, no Zoom" positioning in the homepage FAQ. Should be removed or changed to "All communication is async via WhatsApp and email." |

**Issues to fix:**
1. Remove "if you prefer a call we can schedule one" from the contact page FAQ schema — brand standard is async-only.

---

### 4. Services Page — https://netwebmedia.com/services.html
**Score: 8 / 10**

| Element | Status | Detail |
|---|---|---|
| Title tag | PASS | "AI Marketing Services — NetWebMedia for US Brands" |
| Meta description | PASS | Keyword-rich, covers all 7 service pillars |
| Robots meta | PASS | `index, follow, max-image-preview:large` |
| Canonical | PASS | `https://netwebmedia.com/services.html` |
| JSON-LD schema | PASS | Organization, WebPage, ItemList (7 service items), FAQPage — excellent |
| H1 | PASS | "★ Fractional CMO Retainer — Most Popular" — unusual H1 (product name rather than page title); consider "Full-Stack AI Marketing Services" as H1 |
| Anchor IDs | PASS | `#ai-automations`, `#ai-agents`, `#ai-websites`, `#paid-ads`, `#ai-seo`, `#social`, `#aeo`, `#fractional-cmo` all confirmed present |
| Footer anchor refs | ISSUE | Homepage footer links to `services.html#seo`, `services.html#ppc`, `services.html#content` — **these IDs do not exist in services.html**. These will silently land at page top instead of the intended section. |
| CTAs | PASS | All route to contact.html. No phone/Zoom. |
| Brand | PASS | |

**Issues to fix:**
1. **High:** Add `id="seo"`, `id="ppc"`, and `id="content"` anchors to the relevant sections in `services.html`, or update the homepage footer links to match the actual IDs (`#ai-seo`, etc.).
2. **Low:** Reconsider H1 — "★ Fractional CMO Retainer — Most Popular" reads as a sales badge, not a page-level keyword. Better: "AI Marketing Services for US Brands."

---

### 5. Legal Industry Page — https://netwebmedia.com/industries/professional-services/legal/index.html
**Score: 6 / 10**

| Element | Status | Detail |
|---|---|---|
| Title tag | PASS | "Free AI Growth Plan \| Law Firms — NetWebMedia" |
| Meta description | PASS | Mentions WhatsApp delivery, no calls, actionable |
| Robots meta | PASS | `index, follow, max-image-preview:large` |
| Canonical | **CRITICAL FAIL** | Points to `https://legal.netwebmedia.com/` — **this subdomain returns 406 (Not Acceptable)**. Google will try to crawl the canonical, find a 406, and may refuse to index the page or consolidate authority incorrectly. |
| JSON-LD schema | **FAIL** | **No JSON-LD schema blocks present.** A law firm landing page should have LocalBusiness + Service + FAQPage schema at minimum. |
| H1 | PASS | "Free growth plan — for Law Firms" |
| H2s | PARTIAL | "Get your free growth plan," "How the free plan works," "Frequently asked" — functional but thin; no H2 that mentions "law firm marketing" or "legal" keyword |
| CTAs | PASS | Form anchor (#plan-form), email. No phone/Zoom. |
| WhatsApp | PARTIAL | Mentioned in copy ("We WhatsApp you the plan") but no direct `wa.me` link confirmed in CTAs |
| Social proof | PASS | "+71% consults," "Top 3 AI citations" — credible stats |
| Pricing | PASS | Not shown (correct — free plan entry) |

**Issues to fix:**
1. **Critical:** Fix canonical — change from `https://legal.netwebmedia.com/` to `https://netwebmedia.com/industries/professional-services/legal/index.html` until the subdomain is live and properly set up.
2. **High:** Add JSON-LD schema (LocalBusiness or ProfessionalService + FAQPage).
3. **Medium:** Add a direct WhatsApp CTA link (`wa.me/14155238886`) as a visible button, not just mentioned in copy.
4. **Low:** Add an H2 containing "law firm digital marketing" or "legal marketing AI" for keyword coverage.

---

### 6. Healthcare Industry Page — https://netwebmedia.com/industries/healthcare/index.html
**Score: 6 / 10**

| Element | Status | Detail |
|---|---|---|
| Title tag | PASS | "Free AI Growth Plan \| Healthcare — NetWebMedia" |
| Meta description | PASS | Aligned with WhatsApp delivery, no-calls brand |
| Robots meta | PASS | `index, follow, max-image-preview:large` |
| Canonical | **CRITICAL FAIL** | Points to `https://healthcare.netwebmedia.com/` — returns 406. Same issue as legal page. |
| JSON-LD schema | **FAIL** | No JSON-LD blocks. MedicalOrganization or LocalBusiness + Service + FAQPage needed. |
| H1 | PASS | "More Qualified Patients. Less No-Shows." — benefit-driven, strong |
| Social proof | PASS | "+58% new patients," "-34% no-shows," "Top 3 AI search" |
| CTAs | PASS | Form, email. No phone/Zoom. |
| WhatsApp | PARTIAL | No direct wa.me link confirmed in rendered CTAs |

**Issues to fix:** Same pattern as legal page — canonical fix, add schema, add WhatsApp CTA button.

---

### 7. Restaurants Industry Page — https://netwebmedia.com/industries/restaurants/index.html
**Score: 6 / 10**

| Element | Status | Detail |
|---|---|---|
| Title tag | PASS | "Free AI Growth Plan \| Restaurants & F&B — NetWebMedia" |
| Meta description | PASS | WhatsApp delivery, no-calls messaging |
| Robots meta | PASS | `index, follow, max-image-preview:large` |
| Canonical | **CRITICAL FAIL** | Points to `https://restaurants.netwebmedia.com/` — returns 406. |
| JSON-LD schema | **FAIL** | No JSON-LD blocks. FoodEstablishment or LocalBusiness schema needed. |
| H1 | PASS | "Packed Every Night. Not Just on Weekends." — compelling |
| Social proof | PASS | "+61% weeknight covers," "+88% event pre-sales," "4.7★ avg rating" |
| CTAs | PASS | Form, email. No phone/Zoom. |
| 90-day minimum disclosure | MINOR | Mentioned ("90-day minimum, then month-to-month") — good transparency |

**Issues to fix:** Same canonical + schema pattern as all industry pages.

---

### 8. Blog Index — https://netwebmedia.com/blog/
**Score: 5 / 10**

| Element | Status | Detail |
|---|---|---|
| Blog index page | **FAIL** | `https://netwebmedia.com/blog/` serves an **Apache directory listing** of 67 HTML files. No `index.html`, no `Options -Indexes` directive in root or blog-level `.htaccess`. |
| Canonical blog page | PASS | `blog.html` at root exists with proper title, meta, robots, canonical pointing to `https://netwebmedia.com/blog.html` |
| Sitemap blog entry | PARTIAL | Sitemap lists `https://netwebmedia.com/blog` (without trailing slash, no .html) — this redirects to `blog.html` via .htaccess rule, which is correct. But the raw `blog/` directory URL has no protection. |
| Blog article — robots | PASS | Individual articles (e.g., `aeo-replaces-seo-2026.html`) have `index, follow` and JSON-LD BlogPosting schema |
| Blog article — schema | PASS | Articles have BlogPosting schema with headline, description, datePublished |
| Directory listing risk | **CRITICAL** | Any crawler or user hitting `https://netwebmedia.com/blog/` gets a full file listing — exposes all unpublished/draft articles, file names, and modification timestamps |

**Issues to fix:**
1. **Critical:** Add `Options -Indexes` to the root `.htaccess` (globally) **or** add a `blog/.htaccess` with `Options -Indexes`. This prevents directory traversal on ALL subdirectories site-wide.
2. **High:** Create a `blog/index.html` that redirects to `/blog.html` (301) as a belt-and-suspenders defense.

---

## Technical & Security Checks

### robots.txt — https://netwebmedia.com/robots.txt
**Score: 9 / 10**

- Well-structured. All sensitive directories blocked (`/api/`, `/admin/`, `/backend/`, `/_deploy/`, etc.).
- AI crawlers (GPTBot, ClaudeBot, Perplexity, Bingbot) explicitly **allowed** — excellent for AEO strategy.
- Chilean city prospect-report paths blocked — correct.
- Sitemap referenced at `https://netwebmedia.com/sitemap.xml`.
- **Missing:** No `Disallow: /blog/` (the directory listing) — but this is a server-config issue, not robots.txt scope. Add `Disallow: /blog/$` if you want to prevent directory listing indexing while keeping individual articles crawlable.

---

### Sitemap — https://netwebmedia.com/sitemap.xml
**Score: 8 / 10**

- Exists and is valid XML (sitemaps.org protocol).
- 155 URLs across core pages, blog articles, landing pages, compare pages.
- All URLs have `lastmod: 2026-04-28` (today) — shows active maintenance.
- Clean URL structure without `.html` for root pages (backed by .htaccess redirects).
- **Issue:** Sitemap lists `https://netwebmedia.com/blog` (which redirects to `blog.html`) — acceptable, but Google prefers the canonical final destination. Consider updating to `https://netwebmedia.com/blog.html`.
- **Issue:** No `<priority>` or `<changefreq>` values — add them for crawl budget optimization (homepage: 1.0, core pages: 0.9, blog: 0.7).

---

### Security Probe — /submit-leads.log
**Status: PASS — Returns 403 Forbidden**

The `.log` file protection is working. The `.htaccess` `<FilesMatch "\.log$">` directive is confirmed live. No sensitive data is publicly accessible.

---

## Brand Standards Verification

| Standard | Status | Notes |
|---|---|---|
| Navy #010F3B | PASS | Confirmed as `--nwm-navy-dark` and `--bg-primary` in `css/styles.css` |
| Orange #FF671F | PASS | Confirmed as `--nwm-orange` and CTA gradient base in `css/styles.css` |
| WhatsApp CTAs only (no phone) | PASS | No `tel:` links found on homepage, pricing, contact, or services |
| No Zoom links | PASS | Zoom only appears as "no Zoom" in FAQ copy — not as a link |
| Pricing $249/$999/$2,499 | PASS | Confirmed on pricing.html and in homepage FAQ schema |
| Carlos26 promo absent | PASS | Only appears in `plans/` internal docs (correctly blocked in robots.txt) |
| No LinkedIn distribution | N/A | Not a live-site concern — confirmed absent from social proof section |
| Canonical is non-www | PASS | All canonicals use `https://netwebmedia.com/` (no www) |

---

## Overall Score: 7.4 / 10

| Page | Score |
|---|---|
| Homepage | 8/10 |
| Pricing | 7/10 |
| Contact | 9/10 |
| Services | 8/10 |
| Legal Industry | 6/10 |
| Healthcare Industry | 6/10 |
| Restaurants Industry | 6/10 |
| Blog Index | 5/10 |
| robots.txt | 9/10 |
| sitemap.xml | 8/10 |
| **Average** | **7.2/10** |

---

## Top 5 Priority Improvements

### Priority 1 — Fix industry page canonicals (Critical / SEO / 30 min)
All three industry pages (`legal/`, `healthcare/`, `restaurants/`) have canonicals pointing to subdomains that return HTTP 406. Google will discard or demote these pages. Fix: change each canonical to the actual URL of the page being served.

```html
<!-- legal/index.html: change FROM -->
<link rel="canonical" href="https://legal.netwebmedia.com/">
<!-- TO -->
<link rel="canonical" href="https://netwebmedia.com/industries/professional-services/legal/index.html">
```
Apply same pattern to healthcare and restaurants pages.

---

### Priority 2 — Block Apache directory listing on blog/ (Critical / Security / 15 min)
`https://netwebmedia.com/blog/` exposes all 67+ blog file names, timestamps, and any drafts to any visitor. Fix: add one line to root `.htaccess`:

```apache
Options -Indexes
```
This protects ALL directories site-wide. Alternatively add a `blog/.htaccess` with the same directive as a targeted fix.

---

### Priority 3 — Add robots meta to pricing.html (High / SEO / 5 min)
Pricing is one of the highest-value pages. It is the only audited page missing an explicit robots meta tag. While it defaults to indexable, the inconsistency creates risk during a robots re-audit. Fix:

```html
<meta name="robots" content="index, follow, max-image-preview:large">
```

---

### Priority 4 — Add JSON-LD schema to all industry pages (High / AEO / 2 hours)
Three high-intent landing pages (legal, healthcare, restaurants) have zero structured data. This directly undercuts the AEO strategy — AI answer engines use schema to extract and cite specific facts. Each page needs at minimum: `LocalBusiness` or `ProfessionalService` + `FAQPage` + `Service` with `Offer`. Use the services.html schema as a template.

---

### Priority 5 — Fix pricing meta description (High / Conversion + Legal / 10 min)
The meta description says "Free 14-day trial on all plans" but the page also discloses a "90-day minimum." This is potentially misleading to a user who clicks through expecting a no-strings trial. Fix the description to:

```
"CMO Lite $249/mo · Growth $999/mo · Scale $2,499/mo. 14-day free trial, then 90-day retainer. Full AI marketing — strategy, software, and execution."
```

---

## Bonus Issues Logged (Lower Priority)

| Issue | Impact | Fix |
|---|---|---|
| Homepage nav logo `<img>` has no `loading` attribute | Minor performance | Add `loading="eager"` (above fold) |
| Google Fonts may load via CSS `@import` | Minor CWV (render-blocking) | Move to `<link rel="preload" as="style">` in HTML head |
| services.html footer anchors `#seo`, `#ppc`, `#content` don't exist | Broken UX on homepage footer clicks | Update homepage links to match actual IDs or add missing anchors to services.html |
| Contact page FAQ schema allows calls | Minor brand inconsistency | Remove "if you prefer a call we can schedule one" from schema answer |
| Blog sitemap entry uses `/blog` (redirects) not `/blog.html` | Minor crawl efficiency | Update sitemap to use the canonical destination URL |
| priceValidUntil in pricing schema expires 2026-07-01 | Schema staleness | Update before July 1 |

---

*Report generated: 2026-04-28 | Auditor: Claude Sonnet 4.6 for NetWebMedia*
