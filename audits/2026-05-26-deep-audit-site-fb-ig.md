# Deep Audit — netwebmedia.com + Facebook + Instagram
**Date:** 2026-05-26
**Auditor:** CMO (NetWebMedia)
**Scope:** Public site, Facebook page, Instagram profile — read-only inspection
**Method:** WebFetch + raw curl with Chrome UA for source verification. No automated Meta interactions (per 2026-05-25 IG temp-restriction guardrail).

---

## 1. Executive Summary

- **Site is in strong shape.** Pricing is canonical ($249 / $999 / $2,490 / Custom), phone split (voice 760 / WhatsApp 442) is correctly implemented across `whatsapp.html` and `contact.html`, sitemap is fresh (571 URLs, all `lastmod` 2026-05-25), CSP is live, internal pages are 403-locked. The AEO infrastructure (schema, OG, canonical) is rich and shipping correctly on the pages sampled.
- **Brand-equity P1 on Facebook.** The site links to `facebook.com/profile.php?id=61573687500626` — a numeric Personal Profile URL, not a Business Page with a `/netwebmedia` vanity. Every social CTA on the site routes traffic into a low-trust URL. This is the single biggest brand drift right now.
- **Bilingual coverage is uneven.** Homepage has 109 `data-en/es` attributes, About has 38, hospitality hub has **zero**. Industry hubs and most blog pillars are English-only — a real gap given Carlos's Chile base and the EN/ES positioning.
- **Homepage doesn't surface the phone numbers above the fold.** Phone numbers exist only in the footer as text (no `tel:` link). On mobile, you can't tap to call.
- **FB/IG content audit is impossible without authenticated access.** Both pages return login walls to unauthenticated WebFetch. Carlos should screenshot recent posts so we can audit content quality directly — or grant me a brief authenticated browser session (not for posting, only for inspection).

**Overall verdict: B+ on the site, Incomplete on social.** The site is shipping at near-Carlos standard. The social properties are the bottleneck — both because of the unbranded FB URL and because we can't measure cadence/quality without Carlos's eyes.

---

## 2. Surface-by-Surface Scorecards

### 2.1 netwebmedia.com — 4.2 / 5

| Dimension | Score | Why |
|---|---|---|
| Positioning & messaging clarity | 5/5 | "AI-Native Fractional CMO that gets you cited by ChatGPT, Claude, Perplexity & Google AI Overviews" — unambiguous in <3s |
| Pricing page accuracy | 5/5 | $249 / $999 / $2,490 / Custom — matches canonical ladder exactly. No Scale/Enterprise/Lite. No $2,990/$2,499 regressions |
| Phone number consistency | 4/5 | Split implemented correctly on `whatsapp.html` + `contact.html`. Homepage shows them as text-only (no `tel:` link). About page summary phrased as "WhatsApp / email" without surfacing numbers |
| WhatsApp CTA hygiene | 5/5 | Zero `wa.me/14155238886` survivors in production HTML. Homepage routes through `/whatsapp.html`. Direct `wa.me/14423854585` only on `whatsapp.html` + `contact.html` (per the routing rule) |
| AEO/SEO health | 5/5 | Rich schema (Service, FAQPage, BlogPosting, ProfessionalService, ContactPoint, BreadcrumbList, AggregateOffer). Sitemap = 571 URLs, all `lastmod` 2026-05-25. Robots.txt is precise. Canonical + OG on every blog post sampled |
| Brand consistency | 4/5 | Inter/Poppins + Gulf Oil palette visible across pages. Minor: site OG image is generic `/assets/og-cover.png` — could be stronger on social previews |
| Bilingual (EN/ES) | 3/5 | Homepage strong (109 attrs); About moderate (38); industry hubs and pillar blog posts have **zero** `data-es` attributes. This is the biggest content gap |
| Performance | 4/5 | Homepage 132 KB, TTFB 666ms, total 1.3s — acceptable. Heavy because of inline schema + bilingual duplication. No render-blocking external CSS issues spotted |
| Conversion paths | 4/5 | Pricing → contact (with plan params) is clean. Audit tool → form is wired. Free 48-hour audit CTA is consistent across hubs |
| Trust / social proof | 3/5 | AEO Citation Index is the trust asset. Case studies referenced ("Hotel Boutique +27% in 60 days") but not deep. No testimonial wall on homepage. Founder authority leveraged in About but not visualized |
| Internal-page lockdown | 5/5 | `diagnostic`, `flowchart`, `orgchart`, `dashboard`, `desktop-login`, `nwmai`, `audit-report`, `usa-prospects-report`, `NetWebMedia_Business_Marketing_Plan_2026` — all return 403 |

### 2.2 Facebook (@netwebmedia / Page ID 61573687500626) — 1.5 / 5 (estimated)

| Dimension | Score | Why |
|---|---|---|
| Profile URL / vanity | 1/5 | `facebook.com/profile.php?id=61573687500626` — numeric Personal Profile URL. Not a Business Page with `/netwebmedia` vanity. Low trust signal, hard to remember, hurts referral attribution |
| Profile completeness | N/A | Login wall — unable to verify avatar/cover/about/contact from public WebFetch |
| Brand consistency vs site | N/A | Can't verify without authenticated view |
| Content cadence | N/A | Same |
| Cross-channel linking | 3/5 | Site links to FB (footer + `/social/`); whether FB links back to site is unverified |
| Activation status | 2/5 | Page exists; CLAUDE.md lists `fb_publish.php` as wired with FB_PAGE_ID + FB_PAGE_TOKEN in production. Memory note flags FB Page token as "broken" (Social publishing blockers 2026-05) |

### 2.3 Instagram (@netwebmedia) — 2 / 5 (estimated)

| Dimension | Score | Why |
|---|---|---|
| Profile URL / vanity | 5/5 | `instagram.com/netwebmedia/` — clean vanity handle |
| Profile completeness | N/A | Login wall — public WebFetch returns image-only payload |
| Brand consistency vs site | N/A | Unverifiable without authenticated view |
| Content cadence | N/A | Same |
| Cross-channel linking | 3/5 | Site links out to IG; bio link-in-bio status unknown |
| Activation status | 2/5 | Per memory: IG not yet linked to FB Page; needs Professional account upgrade + manual connect; `ig_publish.php` returns 503 until `IG_BUSINESS_ACCOUNT_ID` + `IG_GRAPH_TOKEN` are set. **Temp-restricted on 2026-05-25** from automated activity — recovery still TBD |

---

## 3. Cross-Channel Brand Consistency

### What's aligned
- **Pricing ladder** — site is canonical and locked in. No drift detected on `pricing.html` or `services.html` (Starter $249 / Growth $999 / Premium $2,490 visible on both).
- **Phone number split** — voice 760 / WhatsApp 442 implemented correctly on the pages where they appear (`contact.html`, `whatsapp.html`).
- **AEO positioning** — homepage hero + blog pillars + industry hubs all carry the "get cited by ChatGPT / Claude / Perplexity / Google AI Overviews" line. Single, consistent message.
- **AEO Citation Index** — `/aeo-index.html` is publicly indexable and schema-rich. This is the strongest top-of-funnel asset.

### What's drifting
- **Facebook page URL** — `profile.php?id=...` instead of `/netwebmedia`. Likely because the page hasn't been converted from a Personal Profile to a Business Page (or the username hasn't been claimed). High-impact, low-effort fix on Carlos's side (Meta UI, not code).
- **Bilingual coverage** — homepage and pricing have it; industry hubs and pillar blog posts don't. A US-SMB-targeted ES-speaking owner landing on `industries/restaurants/` gets English only.
- **Phone visibility on homepage** — phones appear only as static text in the footer with no `tel:` anchor. Either show them prominently with click-to-call, or don't show them at all and route everything through `whatsapp.html` / `contact.html`.
- **OG image** — every blog post uses the same `og-cover.png` (or, on `restaurants-aeo-strategy-2026.html`, a generic Unsplash photo). No per-cluster branded OG art. This dilutes social-share quality.

---

## 4. Top 10 Findings — Ranked by Impact

| # | Severity | Surface | Finding | Fix | Effort |
|---|---|---|---|---|---|
| 1 | **P1** | Facebook | Page URL is `profile.php?id=61573687500626` — looks like a personal profile, not a brand page. Site links here from footer + `/social/` | In Meta: convert to/claim Business Page, set username `netwebmedia`, then update the URL across the repo | 1 hr Carlos UI + 30 min repo sweep |
| 2 | **P1** | Site | Industry hubs and pillar blog posts have zero EN/ES bilingual coverage despite Chile base | Add `data-en/data-es` attributes to the 14 industry hubs and the 28 pillar blog posts — patch hub outputs directly (generators are stale, per memory) | ~2-3 hrs per hub if scripted; or batch-translate via Claude API in a one-off pass |
| 3 | **P1** | IG / FB | Can't verify content cadence, last-post date, bio quality, or brand consistency from public WebFetch (both are login-walled) | Carlos to either screenshot the current state of both profiles OR grant authenticated browser session for inspection only | 10 min |
| 4 | **P2** | Site | Homepage shows phone numbers as plain text in footer, no `tel:` link — mobile UX miss | Wrap voice number in `<a href="tel:+17603348731">` and WhatsApp in the existing `/whatsapp.html` route. Or remove text entirely if we want all contact through async channels | 15 min |
| 5 | **P2** | Site | No testimonial wall or named-client social proof on homepage. AEO Citation Index is the only trust asset above the fold | Add a 3-logo + 1-quote strip below the hero. Even 1-2 founding-client logos move trust meaningfully | 1 hr if logos exist; longer if we need to ask permission |
| 6 | **P2** | Site | OG images are generic (`/assets/og-cover.png` or Unsplash stock). Social shares look unbranded | Generate 3-5 branded OG templates (Inter/Poppins + Gulf Oil) per cluster: AEO pillar, industry hub, case study. Reuse `_deploy/render-carousels.py` pattern | 2-3 hrs |
| 7 | **P2** | IG | Per memory: IG not yet linked to FB Page; not yet a Professional account; `ig_publish.php` 503s until creds set. Temp-restriction from 2026-05-25 may still be active | Carlos to manually: (a) upgrade to Professional/Business account, (b) link to the FB Business Page after #1 is fixed, (c) populate `IG_BUSINESS_ACCOUNT_ID` + `IG_GRAPH_TOKEN` secrets. NO automated retries (per the 2026-05-25 guardrail) | 30 min Carlos UI; deploy = automatic |
| 8 | **P2** | FB | Per memory ("Social publishing blockers 2026-05"): FB Page token is broken; carousel D deployed but no live posts going out | Rotate `FB_PAGE_TOKEN` in GitHub Secrets, redeploy. Verify with `fb_publish.php?action=status` after | 15 min once Carlos generates a fresh token in Meta Developer |
| 9 | **P3** | Site | About page positioning is solid but doesn't surface the "14 AI agents mirroring the org chart" differentiator strongly enough — that's the genuine moat | Add an `/orgchart` (or visualized agent-roster) public-safe equivalent, or a section to About showing the 12-agent stack. (Note: `orgchart.html` is currently 403-blocked — make a public version) | 2-3 hrs |
| 10 | **P3** | Site | Case study depth is thin — hospitality hub references "+27% bookings in 60 days" but there's no full case-study page linked from the hub | Build out 1-2 deep case studies (problem → AEO play → measurable outcome) and link from the matching industry hub. Reuse the `_deploy/case-study-program.md` playbook | 1 day per case study |

---

## 5. Quick Fixes I Can Make Today (awaiting green light)

These are 1-file changes I can ship in a single PR if Carlos approves:

- [ ] **Homepage `tel:` link** — wrap the voice number in `<a href="tel:+17603348731">` and the WhatsApp number in `<a href="https://wa.me/14423854585">` (or, more consistently, route through `/whatsapp.html`). One edit to `index.html` footer.
- [ ] **OG image refresh** — replace the Unsplash stock image on `blog/restaurants-aeo-strategy-2026.html` with a branded OG card. One-line meta tag change.
- [ ] **Footer FB link sweep** — once Carlos claims the `/netwebmedia` username on Facebook, sweep `facebook.com/profile.php?id=61573687500626` → `facebook.com/netwebmedia` across all HTML files (homepage, contact, social, footer template). Single-pattern replace.
- [ ] **About page phone surfacing** — currently lists "WhatsApp, email, chat" but doesn't show the numbers. Add the split-line phones in the contact block.
- [ ] **Homepage testimonial strip placeholder** — add the markup + styles for a 3-logo + 1-quote strip below the hero. Leave content empty until Carlos approves which clients we can name.
- [ ] **Internal pages in robots.txt sweep** — `nwmai.html`, `desktop-login.html`, `audit-report.html`, `*-prospects-report.html`, `NetWebMedia_Business_Marketing_Plan_2026.html` are 403-locked but not all are in `robots.txt`. Belt-and-suspenders: add them.

I will NOT touch the FB page URL across the repo until Carlos confirms the `/netwebmedia` vanity is live on Meta's side.

---

## 6. Strategic Recommendations — Next 30 Days

Framed inside Carlos's durable constraints (no LinkedIn, no X/Twitter, InMotion only, crm-vanilla only, AEO-first).

### Rec 1 — Fix the Facebook URL today; this is the single highest-ROI move
The numeric URL is leaking trust on every footer impression and every `/social/` page visit. Cost = 1 hr of Carlos's time in Meta UI + my 30-min sweep. The FB account is the gateway to IG Business linking too — fixing #1 unblocks Finding #7 (IG activation) and #8 (FB Page token rotation).

### Rec 2 — Get IG and FB unblocked and start posting cadence by end of week 2
Carrying both as "dormant" any longer is brand debt. Sequence:
1. Carlos fixes FB Business Page + vanity (Rec 1)
2. Carlos upgrades IG to Business account + links to FB Page
3. We rotate FB_PAGE_TOKEN, set IG_BUSINESS_ACCOUNT_ID + IG_GRAPH_TOKEN
4. Use the 3 carousels already rendered in `assets/social/carousels/{a,b,c}` + 6 TikTok reels in `assets/social/campaign/reel_*.mp4` as the activation content — they're already built, just sitting waiting
5. No automated retries on Meta connect flows (per the 2026-05-25 guardrail)

### Rec 3 — Translate the 14 industry hubs + 28 pillar blog posts to ES (one-off batch)
Chile is the founder market and ~15% of US SMBs are Spanish-primary (restaurants, beauty, home services, legal — exactly our niches). Burn a Claude API batch run, sweep `data-en/data-es` into each hub + pillar, redeploy. Single-day effort, multi-quarter SEO benefit. Industry generators are stale per memory — patch outputs directly.

### Rec 4 — Build 2-3 deep case studies and link them from industry hubs
The hospitality hub references "+27% bookings in 60 days" with no destination page. That's a wasted citation magnet. Real numbers + named clients + AEO-tagged case studies are exactly what ChatGPT/Claude pull when answering "best fractional CMO for hotels." Effort: 1 day each. Reuse `_deploy/case-study-program.md`.

### Rec 5 — Brand the OG image pipeline
Every social share right now renders a generic Unsplash photo or a stock OG. Build 3-5 templated OG cards (industry-hub, AEO pillar, case study, audit report, generic). Use the existing `_deploy/render-carousels.py` pattern. One-time 2-3 hr investment, compounding asset.

---

## 7. Appendix — Raw Evidence

### URLs checked (live, this session)
- `https://netwebmedia.com/` — 200, 132 KB, TTFB 666 ms
- `https://netwebmedia.com/pricing.html` — 200; tiers AEO Starter $249, CMO Growth $999, CMO Premium $2,490, Custom — confirmed
- `https://netwebmedia.com/services.html` — 200
- `https://netwebmedia.com/about.html` — 200
- `https://netwebmedia.com/contact.html` — 200; voice +1 (760) 334-8731, WhatsApp +1 (442) 385-4585, `wa.me/14423854585` confirmed
- `https://netwebmedia.com/whatsapp.html` — 200; matches contact split
- `https://netwebmedia.com/social/` — 200; lists IG, YouTube, FB, TikTok, WhatsApp Updates; explicitly states "We deliberately don't operate on X"
- `https://netwebmedia.com/industries/hospitality/` — 200; FAQPage + Service + AggregateOffer JSON-LD present; **0 `data-es` attrs**
- `https://netwebmedia.com/industries/restaurants/` — 200; 8-question FAQ; cluster posts linked
- `https://netwebmedia.com/industries/legal-services/` — 200; 8-question FAQ; 3-pillar cluster (incl. audit-findings)
- `https://netwebmedia.com/blog/aeo-replaces-seo-2026.html` — 200; full canonical + OG + BlogPosting + FAQPage schema
- `https://netwebmedia.com/blog/restaurants-aeo-strategy-2026.html` — 200; full canonical + OG + BlogPosting + FAQPage + Restaurant schema with AggregateRating
- `https://netwebmedia.com/aeo-index.html` — 200; WebApplication + FAQPage + BreadcrumbList JSON-LD
- `https://netwebmedia.com/sitemap.xml` — 200; 571 `<url>` entries; all `<lastmod>` = 2026-05-25
- `https://netwebmedia.com/robots.txt` — 200; precise allowlist + disallow blocks

### Internal-only pages — all returned 403 Forbidden (as expected)
- `/diagnostic.html`
- `/flowchart.html`
- `/orgchart.html`
- `/dashboard.html`
- `/audit-report.html`
- `/desktop-login.html`
- `/nwmai.html`
- `/usa-prospects-report.html`
- `/NetWebMedia_Business_Marketing_Plan_2026.html`

### Security headers (homepage)
- `Server: Apache`
- `X-Frame-Options: SAMEORIGIN`
- `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://browser.sentry-cdn.com https://challenges.cloudflare.com https://unpkg.com https://cdnjs.cloudflare.com; ...` (live, not Report-Only)
- `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=86400`

### `wa.me/14155238886` (dead Twilio sandbox) — zero survivors in HTML
Verified by `grep -r wa\.me/14155238886 --include=*.html` against the repo. Only hit is the memory file.

### Facebook + Instagram — public WebFetch returned login walls
- `facebook.com/profile.php?id=61573687500626` — page title resolves but no public profile content. Per memory: page exists, FB_PAGE_TOKEN broken, IG not linked, no live posts.
- `instagram.com/netwebmedia/` — login wall returns image-only payload. Per memory: not yet Professional/Business account, ig_publish.php 503, temp-restricted 2026-05-25 from automated activity.

### Schema types observed in the wild
- Homepage: BlogPosting, ProfessionalService, ContactPoint, FAQPage, BreadcrumbList, Country, EntryPoint
- Pricing: Service, AggregateOffer, FAQPage, BreadcrumbList, Offer, Organization, UnitPriceSpecification, WebPage
- Hospitality hub: FAQPage, Service, Country, BusinessAudience, AggregateOffer
- Restaurant blog pillar: BlogPosting, FAQPage, Restaurant, AggregateRating, Person, Organization
- AEO Citation Index: WebApplication, FAQPage, BreadcrumbList

This is best-in-class schema coverage for AEO. The infrastructure is doing its job; the gaps are content-density (case studies, ES coverage) and off-site (FB/IG activation).
