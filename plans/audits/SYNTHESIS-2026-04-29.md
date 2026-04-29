# NetWebMedia — Comprehensive Audit Synthesis
**Date:** 2026-04-29
**Source:** 6 parallel sub-audits (engineering, Facebook, Instagram, YouTube, TikTok, positioning)
**For:** Carlos Martinez, CEO

---

## The one thing to take away

**External positioning has outgrown internal capability.** The marketing site is sharp, AEO is excellent, the brand book is professional, the plan docs are thorough — but `compare.html` promises white-label CRM AI agency features that **don't exist in the codebase**, social channels are at zero volume across the board, and there are **three critical security bugs** that would burn the first real white-label customer the moment they sign up.

This is fixable. None of the gaps are existential. But you need to make three decisions this week, not next quarter.

---

## The three decisions for this week

### 1. Positioning: kill the white-label claim or fund the engineering to deliver it

`compare.html` markets "full white-label + SaaS mode + Voice AI + Video AI + GPT-4 agents included." `crm-vanilla/js/data.js` is hardcoded mock data ("Sarah Chen", "TechCorp"). The real tenancy is `crm-vanilla/api/schema_tenancy.sql` — a `user_id` column added to 6 tables, all backfilled to user 1 (you). **There is no `organization_id`, no agency→sub-account hierarchy.** A reseller cannot have isolated clients underneath them. That's the deal-breaker.

`backend/` (Django, the supposed multi-tenant CRM) has **no source code in the repo** — only `__pycache__/` and `db.sqlite3`. Either it was deleted or never committed.

Three options ranked by realism:

| Option | Cost | Time to credible | Risk |
|---|---|---|---|
| **B. Stay fractional CMO, drop white-label framing** (recommended) | $0 — 2 hrs editing public pages | This week | None. Existing fCMO motion is genuinely differentiated. |
| **C. Hybrid — keep fCMO, sell white-label "design partners only — by application"** | $0 — gates expectations | This week | Low. Buys time to build properly in Q3-Q4. |
| **A. Commit to white-label CRM AI agency** | ~$120-180k contractor budget, 6 months | Q4 2026 | High. Requires hiring + design partner + product-market-fit work. |

**Recommended:** Option B + position C as "by application." Trim claims from `compare.html` and `services.html` Friday at the latest. **The cost of a single $449 customer signing up expecting white-label and getting hardcoded mock data is dramatically higher than the cost of editing one comparison page.**

### 2. Security: three production bugs that block white-label and risk a Claude bill spike

Even if you stay fCMO-only, these need fixing before any customer touches the CRM:

| # | Severity | Where | What |
|---|---|---|---|
| 🔴 | Critical | `js/crm-dashboard.js`, `js/analytics.js` | **25+ unescaped `innerHTML =` interpolations** of contact/deal/audit data. Stored XSS waiting on first real customer with a malicious `<script>` in a contact name. |
| 🔴 | Critical | `api-php/routes/ai.php:133` | **Cross-tenant agent leak.** `addslashes` is the wrong escape for SQL `LIKE`. A `public_token` containing `%` matches every agent in every org. |
| 🔴 | Critical | `api-php/routes/public.php` | **No rate limiting on `/api/public/audit`, `/newsletter/subscribe`, `/agents/chat`.** Direct Claude cost exposure (someone hammers `/agents/chat` → your Anthropic bill explodes). Also a spam-relay attack surface. |
| 🟠 | High | `api-php/migrate.php` | **HTTP-reachable** with the same secret as cron tokens. Should be CLI-only or behind IP allowlist. |
| 🟠 | High | Cron | Single point of failure on GitHub Actions. No backup cPanel cron. GH outage silently pauses every email sequence. |

Engineering-lead audit at `plans/audits/audit-2026-04-29-engineering.md` has line numbers and remediation steps.

### 3. Social: activate FB + IG this week, start YouTube, defer TikTok

| Channel | Current | Decision | Effort |
|---|---|---|---|
| **Facebook** | 33 followers, dormant 18 months, Pixel unwired | **Activate this week.** Paste 3 staged posts + setup (cover, About, category, CTA button) | 2 hrs setup + Pixel ID (you create at events_manager) |
| **Instagram** | Bio live, 5 captions staged, only 1 reel-thumb prepared | **Activate + ship 4-6 NEW Reels by week 4.** Current 20% Reels mix vs. 60% benchmark = launching with content that gets 1/15th distribution | 2 hrs setup + Reel production (use video-factory) |
| **YouTube** | Zero channel | **Start now. Highest AEO leverage of any channel.** YouTube is #1 AI Overview citation source (29.5%), 41% of cited videos have under 1k views. You already have video-factory (Remotion) + hyperframes b-roll | 4 vertical case studies month 1, 17 videos by end of Q2 |
| **TikTok** | Zero | **DEFER.** SMB owners 45-65 not on TikTek. Optional LATAM-Spanish pilot at @netwebmedia_es with $2k MRR gate | Skip Q2, revisit Q3 |

Detail in `plans/audits/audit-2026-04-29-{facebook,instagram,youtube,tiktok}.md`.

---

## What's actually working — don't regress

The audit isn't all bad news. NetWebMedia has real differentiators:

- **Public site is healthy** — schema/AEO posture is excellent (ProfessionalService + FAQPage + BlogPosting + BreadcrumbList all wired), HSTS+CSP+XFO security headers solid, ~55KB total gzipped page weight, AI crawler allowlist comprehensive (GPTBot, ClaudeBot, anthropic-ai, PerplexityBot all explicitly allowed)
- **14 industry pages + 39 industry subdomains + 680 generated company audit pages** — sales asset infrastructure that competitors don't have
- **Email sequence engine** — niche-aware, multi-tenant-ready (per-niche templates exist)
- **Brand book is professional** — Gulf Oil palette, EN+ES bilingual scaffolding, voice principles defined
- **Sentry + GA4 wired and verified live** (browser-side)
- **Plan docs are sharp** — business plan, marketing plan, brand book, 90-day execution all coherent
- **Today's audit fixes shipped successfully** — www→apex 301, CDN-cacheable HTML, immutable CSS/JS caching, Chilean prospect links removed, sitemap clean (190→206 URLs without forbidden URLs)

The fCMO product is real and differentiated. The white-label CRM AI agency product is not — yet.

---

## Tech-stack reality check

| Capability | "White-label CRM AI agency" requires | Current state | Gap |
|---|---|---|---|
| Multi-tenant data isolation | `organization_id` + per-tenant DB row scoping | `user_id`-only, all backfilled to user 1 | **No.** |
| Agency → sub-account hierarchy | Resellers manage their clients' clients | Single-level user scoping | **No.** |
| Per-tenant branding | Custom logo, colors, subdomain per client | Brand hardcoded in CSS | **No.** |
| Per-tenant billing | Stripe Connect or similar | Stripe wired for own MRR only | **No.** |
| AI SDR pipeline | Productized handoff → outreach | Email sequence engine exists, AI SDR aspirational | **Half.** |
| AI content gen | Claude API integrated, gated | Claude API exists in `api-php/routes/ai.php`, **but with cross-tenant leak bug** + no rate limiting | **Half (insecure).** |
| AI analytics agents | LLM read of campaign data | Aspirational | **No.** |
| Client onboarding automation | Self-serve provisioning | Manual | **No.** |
| Backend codebase | Production-grade, tested | Two parallel CRM backends, zero tests, no staging | **No.** |

**You're at ~15-20% of what "white-label CRM AI agency" requires.** Three months of contractor engineering minimum to close it.

---

## Recommended action order

**This week:**
1. Trim white-label claims from `compare.html` and `services.html` → "by application — design partner program" gating
2. Patch the 3 critical security bugs (XSS, cross-tenant leak, rate limiting) — engineering-lead has line numbers
3. Activate Facebook + Instagram (paste staged content via paste-helper.ps1, complete profile setup)
4. Create Meta Pixel, send the ID, I wire it sitewide in 5 min
5. Decide on Option A vs. B vs. C for white-label (Friday)

**Next 2 weeks:**
1. Ship Reel #1 from `video-factory` (5-min Remotion render → IG)
2. Record YouTube video #1 (Restaurants AEO case study)
3. Add `organization_id` to `crm-vanilla` schema if Option A or C
4. Kill `backend/` Django (commit to PHP only) OR restore Django source (commit to Django only) — running two parallel CRM backends is unsustainable
5. Add rate limiting to `/api/public/*` endpoints

**By end of Q2:**
1. 4 YouTube case studies live (one per top-4 verticals)
2. ~20 IG Reels in the bank
3. Facebook ad campaign running with proper Pixel + Conversions API
4. Decision on white-label engineering hire (if Option A)

---

## Files referenced

All audit detail in `plans/audits/`:
- `audit-2026-04-29-engineering.md` (1,443 words) — security + tech-stack
- `audit-2026-04-29-facebook.md` (790 words)
- `audit-2026-04-29-instagram.md` (738 words)
- `audit-2026-04-29-youtube.md` (679 words)
- `audit-2026-04-29-tiktok.md` (under 600 words)
- `audit-2026-04-29-positioning.md` — strategic call

Original web audit: `plans/audit-2026-04-29.md` (already executed — fixes shipped today).

---

## One brutal honest call

**Stop selling what you don't have.** The fractional CMO offering is real, differentiated, and saleable today. The white-label CRM AI agency is a 6-month engineering project with a six-figure contractor budget. Marketing the latter while shipping the former is the fastest path to a refund-and-public-complaint cycle that destroys the AEO reputation the rest of this site has earned.

Pick the lane this week.
