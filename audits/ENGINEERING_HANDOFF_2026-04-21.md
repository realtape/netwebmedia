# Engineering-Lead Handoff — 2026-04-21

**From:** CMO agent (Carlos CEO sign-off)
**To:** `engineering-lead` agent (and any human eng contractor)
**Priority:** Week of Apr 21–28
**Source docs:** [SITE_AUDIT_2026-04-21.md](SITE_AUDIT_2026-04-21.md), [BUSINESS_PLAN.md §1 strategic note](../BUSINESS_PLAN.md)

This doc bundles everything the eng workstream needs before the May 4 90-day kickoff. Three buckets: pricing propagation, AEO schema, and trust/CRO fixes.

---

## Bucket 1 — Propagate new pricing to the live site (CRITICAL, do first)

**CEO directive 2026-04-21:** CMO retainer tiers repriced. No exceptions.

| Tier | OLD live-site | OLD setup | **NEW** | **NEW setup** |
|---|---|---|---|---|
| CMO Lite | $1,997/mo | $997 | **$249/mo** | **$0** |
| CMO Growth | $4,997/mo | $1,997 | **$999/mo** | **$499** |
| CMO Scale | $9,997/mo | $2,997 | **$2,499/mo** | **$999** |

### Tier scope adjustments (affects copy on every pricing touchpoint)
- **Lite $249:** Self-serve onboarding. No live strategy calls (was bi-weekly). Monthly async strategy note only. Everything else in Lite scope retained.
- **Growth $999:** Strategy call cadence dropped from **weekly → monthly**. All other scope retained.
- **Scale $2,499:** Keeps weekly strategy calls + quarterly OKR planning. All scope retained.

### Files to update (high to low priority)

| Priority | File | What to change |
|---|---|---|
| P0 | `pricing.html` | All three tier cards (price, setup, scope list per above), FAQ section, comparison calc |
| P0 | `services.html` | Tier price display in the fCMO section, all "$1,997" references in body copy |
| P0 | `index.html` | Hero subheadline says *"starting at $1,997/mo"* → change to *"starting at $249/mo"* |
| P0 | `partners.html` | Any reseller-facing tier references |
| P0 | `pricing-onepager.html` | Entire document is a pricing sheet — full pass |
| P1 | `faq.html` | Pricing-related Q&As (see §Q "How does your pricing work?") |
| P1 | `email-templates/partner-2.html` | Reseller outreach template that quotes pricing |
| P1 | `plans/index.html`, `plans/business-plan.html`, `plans/marketing-plan.html`, `plans/brand-book.html`, `plans/execution-90day.html` | Internal plan HTML mirrors; regenerate from the updated MD files |
| P2 | `_deploy/companies/**/*.html` (250+ files) | Programmatic SEO state/company pages. Many contain hardcoded "$1,997" CTAs. **Use a bulk find-replace script, don't hand-edit.** |

**Bulk-replace script safety rules:**
- Do NOT use a simple `sed -i 's/\$1,997/\$249/g'` — that would break legitimate mentions like "*HubSpot costs $1,997 for the Marketing Hub*" in competitor comparisons.
- Scope the replace to lines containing `netwebmedia`, `our price`, `starting at`, `retainer`, `CMO Lite`, `CMO Growth`, or `CMO Scale` context.
- Dry-run first with `grep -rn '\$1,997\|\$4,997\|\$9,997' _deploy/companies/ | head -50` and eyeball.
- Commit in two stages: (1) commit the grep report, (2) commit the replaced files. Rollback-friendly.

### Promo code
- `Carlos26` = 50% off first 3 months. **Retire July 1** (Brand Guardrails). Set a calendar reminder.
- At new prices: 50% off $249 = $125/mo first 3 months. Verify cart math.
- Consider whether `Carlos26` still makes sense at $249. A 50% promo on a $249 tier may attract the wrong customer. **Flag for Carlos review before May 4.**

---

## Bucket 2 — Ship JSON-LD schema site-wide (highest AEO ROI)

Audit finding: **zero structured data anywhere**. Your 65+ FAQ answers, 31 blog posts, and 18 service pages are all invisible to ChatGPT / Claude / Perplexity citation selection. This is the single biggest AEO leak on the site.

### Minimum schema set (ship by Apr 24)

| Schema | Where | Key fields |
|---|---|---|
| `Organization` | All pages (via layout template) | `name`, `url`, `logo`, `sameAs` (social URLs), `founder` (Carlos), `foundingDate`, `contactPoint`, `areaServed` (US + LATAM countries) |
| `WebSite` + `SearchAction` | Homepage only | Enables sitelinks search box |
| `Service` | Each `/services.html#...` anchor + each service sub-page | `name`, `provider` (ref Organization), `offers` (at new prices), `areaServed` |
| `FAQPage` | `/faq.html` | Every Q&A. All 65+. This alone could double AEO citation rate. |
| `Article` + `Author` | Every blog post | `headline`, `datePublished`, `dateModified`, `author` (Carlos person schema), `publisher` (Organization ref) |
| `Offer` | `/pricing.html`, each tier | `price`, `priceCurrency: USD`, `availability`, `priceValidUntil` (for Carlos26) |
| `BreadcrumbList` | All pages with nav depth > 1 | Standard breadcrumb markup |

### Pattern for implementation
Put a single `schema.js` module that emits the correct block per page type. Don't inline JSON-LD per page — it drifts. Inject server-side via your static-site build.

Validate with:
- https://validator.schema.org/ (official)
- https://search.google.com/test/rich-results (Google-specific)
- Manually test one query in ChatGPT after deploy: *"What is NetWebMedia's pricing?"* — within 7 days, should start citing the new $249 figure.

---

## Bucket 3 — Trust, CRO, and pre-flight blockers

All of these surfaced in the audit. Ordered by ICE score (impact × confidence × ease):

| # | Action | Effort | Deadline |
|---|---|---|---|
| 1 | Redirect `/qna.html` → `/faq.html` via `.htaccess` (301). Also rename nav "Q&A" → "FAQ" | 15 min | Apr 22 |
| 2 | **Install / verify Meta Pixel + GA4 + GTM** on all pages — currently no pixels visible in source. **Blocks paid media launch.** Replace any `PASTE_PIXEL_ID_HERE` placeholder | 1 hr | Apr 22 |
| 3 | Add OG + Twitter Card meta tags on every page (template-level change) | 2 hr | Apr 23 |
| 4 | Rewrite `/about.html` to list **12 AI agents** by name (current page shows 6 — Atlas, Scribe, Ranker, Bidder, Pixel, Ledger). The 12 are in `.claude/agents/`: cmo, sales-director, product-manager, engineering-lead, content-strategist, creative-director, data-analyst, operations-manager, customer-success, finance-controller, project-manager, ceo-assistant. Give each a persona name + one-liner + avatar (use creative-director). AEO bonus: ChatGPT loves naming + numbering. | 3 hr | Apr 25 |
| 5 | Show `datePublished` on every blog card (not just featured) | 30 min | Apr 23 |
| 6 | Add honeypot field + Cloudflare Turnstile on contact form. Today no anti-spam visible — guaranteed abuse once paid traffic arrives. | 1 hr | Apr 24 |
| 7 | De-dupe `hello@netwebmedia.com` in footer (listed twice) | 5 min | anytime |
| 8 | Verify contact form POST lands in CRM. Submit a test. | 15 min | Apr 22 |
| 9 | Expand Carlos bio on `/about.html` from 1 line to 3–4 sentences. Add founding year. | 30 min | Apr 25 |
| 10 | Add trust strip on `/about.html` — logos of integrations (OpenAI, Anthropic, HubSpot, Stripe, Mercado Pago). Not client logos (don't have those yet). | 1 hr | Apr 25 |

Total estimated effort: **~18 hours** engineering + **~4 hours** content.

---

## LinkedIn policy (CEO-locked 2026-04-21)

- **Keep** LinkedIn URL in site footer (it's a claimed handle).
- **Keep** LinkedIn mentions on `/services.html` (Paid Ads section + AI SDR section) — we DO offer LinkedIn as a client-delivered service.
- **DO NOT** publish any NetWebMedia-brand content to our own LinkedIn profile. All owned-channel social distribution goes to X, IG, FB, YT, TikTok, Reddit only. Week 1 content pack already complies.

Engineering impact: **none**. No files need to change for the LinkedIn decision.

---

## Out-of-scope for this handoff (separate workstreams)

- **Financial rebuild:** BUSINESS_PLAN.md §7 (5-year projection), §8 (M12 revenue mix), §11 (scenarios). Needs `finance-controller` at new ACVs.
- **Revenue strategy:** Deciding between Lever A (2x customer count) vs Lever B (mix shift toward Scale). Needs Carlos + CMO.
- **Tier scope rework:** Whether Lite at $249 should include anything live (chat? Slack?). Needs `product-manager`.
- **Lite acquisition funnel:** $249 retainer can't sustain human-led sales. Needs a self-serve / PLG motion. Owner TBD.

---

## Definition of done (for this handoff)

- [ ] All 7 high-priority files carry new pricing + new tier scopes
- [ ] Bulk replace on `_deploy/companies/*.html` complete, committed, reviewed
- [ ] `Carlos26` math verified at new prices in cart checkout
- [ ] All 7 JSON-LD schema types deployed + validated via schema.org validator
- [ ] `/qna.html` redirect live; nav renamed
- [ ] Meta Pixel + GA4 + GTM firing on all pages (verified via Tag Assistant)
- [ ] OG + Twitter Card tags on all pages
- [ ] `/about.html` lists 12 agents + expanded Carlos bio
- [ ] Contact form spam-protected + test submission confirmed in CRM
- [ ] All changes committed to `main` before May 3, 23:59 CLT

Ping Carlos when done. He'll unblock paid-media launch (Task 16 in EXECUTION_90DAY.md, Jun 1) contingent on this.
