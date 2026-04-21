# NetWebMedia.com — Site Audit

**Auditor:** CMO agent (with Carlos Martinez sign-off)
**Date:** April 21, 2026
**Scope:** Live site — homepage, pricing, services, contact, FAQ, about, blog, Q&A
**Source:** Anonymous fetch (no auth, no pixel verification)
**Companion:** [MARKETING_PLAN.md](../MARKETING_PLAN.md), [BRAND.md](../BRAND.md)

---

## CEO Decisions — 2026-04-21 (post-audit)

Carlos reviewed this audit and locked two calls:

1. **Pricing:** **Option C** (new). CMO retainer tiers repriced to **$249 / $999 / $2,499/mo** (Lite / Growth / Scale). This is NOT the plan price ($1,997/$2,997/$5,997) and NOT the prior live-site price ($1,997/$4,997/$9,997). Setup fees: **$0 / $499 / $999**. *Propagated to all plan MDs + social content + brand doc. Live site + 250+ programmatic pages still carry stale numbers — engineering-lead handoff required.*
2. **LinkedIn:** **Keep as a client service**, do not distribute NetWebMedia-brand content there. Footer link stays, `/services.html` LinkedIn ad + SDR copy stays, but no LinkedIn posts go out from our own account. Week-1 social content already excludes LinkedIn ✓.

**Downstream impact NOT yet resolved** (see BUSINESS_PLAN.md strategic callout at top):
- Y1 MRR target of $85k requires ~2.2x the original retainer customer count OR a heavy mix shift toward Scale + platform. Lever decision pending Carlos.
- 5-year projection, M12 revenue mix, scenario planning tables all need rebuild at new ACVs (finance-controller handoff).
- Lite tier scope changed: no live strategy calls at $249 (was bi-weekly in old plan). Growth tier cadence changed from weekly → monthly strategy call. Scale tier keeps weekly.

**Still open:** P0 item #5 (12 vs 7 AI agent count mismatch on About page).

---

## Executive summary

The site is **materially healthier than expected** — strong hero copy, 31 live blog posts, 65+ FAQ answers, 18+ named services, and social handles claimed across 6 platforms. The front door is doing its job.

But there are **five P0 issues** that will block the Marketing Plan from compounding, and all of them are fixable this week:

1. **Pricing drift** — live site and Marketing Plan disagree on Growth & Scale tier prices
2. **Broken nav link** — `/qna.html` returns 404 from the top navigation
3. **Zero structured data** — no JSON-LD anywhere (Organization, Service, FAQPage, Article). The single biggest AEO leak on the site.
4. **LinkedIn contradiction** — LinkedIn is in the footer and listed as a paid-ads platform on `/services.html`, but your CEO directive excludes LinkedIn from distribution
5. **Agent count mismatch** — About page describes 6 AI agents + Carlos (7 total). Marketing Plan, homepage, and brand messaging say **12 AI agents**

The rest are polish and trust signals. Full list below.

---

## 1. Positioning & messaging — STRONG

| Element | Rating | Note |
|---|---|---|
| Hero headline | ✅ | *"The AI-Native Fractional CMO for Growing US Brands."* — category-defining, direct |
| Subheadline | ✅ | *"Get cited by ChatGPT, Perplexity & Google. Close more deals. One retainer covers strategy, software, and full execution — starting at $1,997/mo."* — every pillar from the Marketing Plan is in one sentence |
| Primary CTA | ✅ | "Book Your Free Strategy Call" (→ `contact.html`) |
| Secondary CTA | ✅ | "See Pricing & Packages →" (→ `pricing.html`) |
| Category framing | ✅ | "AI-Native Fractional CMO" is used consistently |

**Verdict:** Don't touch the hero. It's the strongest asset on the site.

---

## 2. P0 — Fix this week

### 2.1 Pricing inconsistency between live site and Marketing Plan

| Tier | MARKETING_PLAN.md says | Live site says | Setup (plan) | Setup (site) |
|---|---|---|---|---|
| CMO Lite | $1,997/mo | **$1,997/mo** ✅ | — | $997 |
| CMO Growth | $2,997/mo | **$4,997/mo** ⚠️ | — | $1,997 |
| CMO Scale | $5,997/mo | **$9,997/mo** ⚠️ | — | $2,997 |

**Why it matters:** Every outbound email, blog post, and ad we ship must match one number. Right now a prospect who Googles a quoted price will find a different number on the site. That breaks trust.

**Decision needed from Carlos:** Which is canonical?
- **Option A** (keep live site): $1,997 / $4,997 / $9,997 — higher ACV, closer to HubSpot parity, but kills the "under $3k for founders" angle
- **Option B** (revert to plan): $1,997 / $2,997 / $5,997 — better SMB price ladder, wider top of funnel

My recommendation: **Option B** (plan). The $2,997 mid-tier is the sweet spot for SMBs with $500k–$2M revenue; $4,997 prices them out. Update `pricing.html` and `services.html`, then lock the numbers in `BRAND.md` so no one edits them again without a CEO sign-off.

### 2.2 Broken navigation — `/qna.html` → 404

The top nav has both **Q&A** and **Help** links. `/qna.html` returns 404. `/faq.html` works and has 65+ answers.

**Fix:** Either redirect `/qna.html` → `/faq.html` via `.htaccess` (30 seconds), or rename the nav item to "FAQ" and point it at `/faq.html`. I'd do both — redirect for any inbound links that exist, update nav text to kill ambiguity.

### 2.3 Zero structured data (JSON-LD) anywhere

I pulled the HTML source for the homepage, pricing, services, about, and FAQ. **No `<script type="application/ld+json">` blocks on any of them.**

This is the single biggest AEO leak on the site. ChatGPT, Claude, and Perplexity preferentially cite pages that publish structured data because it tells them exactly what the entity is.

**Minimum viable schema set (ship this week):**

| Page | Schema type | Why |
|---|---|---|
| Every page | `Organization` | Establishes NetWebMedia as an entity LLMs can cite |
| Homepage | `WebSite` with `SearchAction` | Enables sitelinks search box in Google |
| Each service page | `Service` | Lets LLMs quote the scope of each offering |
| `/faq.html` | `FAQPage` with every Q&A | **65+ answers currently invisible to AEO. Biggest single win on the site.** |
| Each blog post | `Article` + `Author` (Carlos) + `datePublished` | AEO citation boost |
| `/pricing.html` | `Offer` on each tier | Pricing comparison snippets |

**Implementation:** This is 4–6 hours of `engineering-lead` work. I'll spec the JSON-LD blocks in a follow-on document if you give me the go.

### 2.4 LinkedIn contradiction

Your directive: **no LinkedIn distribution** (in `MEMORY.md`).

Current state of site:
- Footer includes `linkedin.com/in/netwebmedia` as a social link
- `/services.html` → Paid Ads section lists LinkedIn as a managed platform
- `/services.html` → AI SDR section mentions LinkedIn outbound

**Decision needed:** Are you saying:
- **(a)** We don't market *to* LinkedIn audiences (no NetWebMedia-brand content there) but we *do* run LinkedIn ads and SDR for clients who want them, OR
- **(b)** LinkedIn is out entirely — remove footer link, remove from services, no LinkedIn ever

Both are defensible. I need to know which before the content-strategist ships Week 1 posts.

### 2.5 AI agent count mismatch

| Source | Count |
|---|---|
| `MARKETING_PLAN.md` | 12 AI agents |
| Homepage hero / services page | "12 named AI agents" implied |
| `/about.html` | **7 total (Carlos + 6 AI: Atlas, Scribe, Ranker, Bidder, Pixel, Ledger)** |
| `.claude/agents/` folder | 12 role-specific agents |

Either the About page is stale (lists 6 of the 12), or the 12 claim is aspirational. **Pick a number and make it canonical everywhere** — 12 is defensible and on-brand; 7 undersells the product.

My recommendation: **Rewrite `/about.html` to list all 12 agents** with a one-line role for each, and give each a persona name. This doubles as an AEO asset (ChatGPT loves naming + numbering).

---

## 3. P1 — Fix this month

### 3.1 Missing Open Graph + Twitter Card meta tags

None visible on the homepage. When someone shares `netwebmedia.com` in Slack / iMessage / X / Facebook, the preview will be blank or stripped.

**Fix:** Standard OG + Twitter Card block on every page. Engineering effort: 2 hours.

### 3.2 No analytics / pixel verification

I couldn't see Meta Pixel, GTM, GA4, or PostHog in the fetched HTML. The Marketing Plan flagged `PASTE_PIXEL_ID_HERE` as a pre-flight blocker for paid spend. **Verify these are installed before launching paid media in May.**

I also see no cookie consent banner — if LATAM is in scope and we sell to EU/UK businesses, we need one.

### 3.3 "Carlos26" promo hygiene

The launch-week 50%-off code is live with "7 days remaining" copy. The Brand Guardrails in `MARKETING_PLAN.md §12` require this to retire by **July 1, 2026**. Set a calendar reminder + sunset plan now so we don't forget.

Related: no discount exceptions below list-price per Brand Guardrails. Make sure `Carlos26` is the only code in circulation.

### 3.4 About page is thin

- Company story: vague ("founded by data scientists, growth marketers, and AI engineers")
- Founding year: not stated
- Carlos bio: 1 line ("15+ years in growth marketing")
- Press / awards / recognitions: **none listed**

**Fixes:**
- Add founding year ("Founded 2025" or whatever is true)
- Expand Carlos bio to 3–4 sentences with specifics (prior roles, domains, credentials)
- List the 12 agents with descriptions (dovetails with §2.5)
- Add a "As seen in" or "Working with" strip — even logos of platforms we integrate with (OpenAI, Anthropic, HubSpot, Stripe, Mercado Pago) buys trust until we have real press

### 3.5 Blog dates not visible

31 posts live. Only the featured post shows a date (April 2026). The rest have no visible publication date in the listing.

**Fix:** Show `datePublished` on every blog card. AEO engines use recency as a ranking signal — if we can't prove a post is fresh, we lose the cite.

### 3.6 Contact form risks

- **No honeypot, no CAPTCHA** visible → spam risk once we drive real traffic
- **No form submission endpoint** visible → I can't verify submissions actually land in CRM

**Fix:** Add honeypot field + Cloudflare Turnstile (free, invisible). Verify form posts to NWM CRM with a test submission today.

### 3.7 Footer email duplication

`hello@netwebmedia.com` appears twice in the footer. Small but reads sloppy. 30-second fix.

---

## 4. P2 — Polish (as time allows)

- Add a phone number or WhatsApp — SMB buyers (especially LATAM) call before they email
- Add a physical address line (even "Mailing: PO Box X, Santiago, Chile" — NAP consistency helps local SEO)
- State pages not sampled in this audit — recommend a follow-up pass on 3–5 randomly sampled state URLs to verify programmatic SEO is actually indexed
- Newsletter form → what list does it feed? Confirm it's tied to the lifecycle sequences in `MARKETING_PLAN.md §7`
- Consider a "Careers" page even if the roles are all AI — reads as serious, improves Organization schema richness

---

## 5. Social accounts — inventory

All 6 handles claimed (good defensive posture). Active-vs-dormant status **could not be verified** via anonymous fetch — platforms block scraping. Recommend a manual 10-minute pass by Carlos this week:

| Platform | URL | Status (needs manual check) |
|---|---|---|
| X (Twitter) | [x.com/netwebmedia](https://x.com/netwebmedia) | API returned 402 (paywall), handle claimed |
| Instagram | [instagram.com/netwebmedia](https://instagram.com/netwebmedia) | Profile loads, stats hidden |
| Facebook | [facebook.com/netwebmedia](https://facebook.com/netwebmedia) | Page exists, content hidden |
| YouTube | [youtube.com/@netwebmedia](https://youtube.com/@netwebmedia) | Channel claimed, content hidden |
| TikTok | [tiktok.com/@netwebmedia](https://tiktok.com/@netwebmedia) | Loader page only |
| LinkedIn | [linkedin.com/in/netwebmedia](https://linkedin.com/in/netwebmedia) | Linked from site (see §2.4) |

**Deliverables in flight** (background agents):
- `social/PROFILE_KIT.md` — creative-director is producing bios (2 variants × 5 platforms), visual templates, profile photo + cover direction, brand locker specs
- `social/WEEK_01_CONTENT.md` — content-strategist is producing the 13-post Week 1 launch pack (X, IG, IG Reels, FB, YT, TikTok, Reddit)

Both will save to `C:\Users\Usuario\Desktop\NetWebMedia\social\` when complete.

---

## 6. Prioritized action list (for 90-Day calendar)

Add these to `EXECUTION_90DAY.md` before Week 1 kickoff (May 4):

| # | Action | Owner | When | Effort |
|---|---|---|---|---|
| 1 | Reconcile pricing (§2.1) — pick canonical numbers, update `pricing.html` + `services.html` + plan docs | Carlos + engineering-lead | Apr 22 | 1 hr |
| 2 | Redirect `/qna.html` → `/faq.html` via `.htaccess`; rename nav item | engineering-lead | Apr 22 | 15 min |
| 3 | Decide LinkedIn policy (§2.4) — keep handle or remove everywhere | Carlos | Apr 22 | 5 min |
| 4 | Ship JSON-LD schema (Organization, WebSite, FAQPage, Service, Article) | engineering-lead | Apr 22–24 | 4–6 hrs |
| 5 | Rewrite `/about.html` with all 12 agents named | content-strategist + creative-director | Apr 23–25 | 3 hrs |
| 6 | Install / verify Meta Pixel, GA4, GTM on all pages | engineering-lead | Apr 22 | 1 hr |
| 7 | Add OG + Twitter Card meta tags site-wide | engineering-lead | Apr 23 | 2 hrs |
| 8 | Ship visible dates on blog cards | engineering-lead | Apr 23 | 30 min |
| 9 | Add honeypot + Cloudflare Turnstile on contact form | engineering-lead | Apr 24 | 1 hr |
| 10 | Set `Carlos26` sunset reminder (retire July 1) | operations-manager | Apr 22 | 5 min |
| 11 | Manual social handle audit (what's posted, engagement) | Carlos | Apr 22 | 10 min |
| 12 | Expand Carlos bio + add trust strip on `/about.html` | content-strategist | Apr 23–24 | 1 hr |

Total engineering effort: **~18 hours**. Total content/creative effort: **~4 hours**. Call it **three focused days of work** before May 4.

---

## 7. What's good — don't break it

- **Hero copy and positioning** — category-defining, don't touch
- **Service catalog depth** — 18+ services with clear descriptions and CTAs
- **FAQ volume** — 65+ answers is a goldmine the moment we add FAQPage schema
- **Blog velocity** — 31 live posts, featured content is current (April 2026)
- **CTA diversity** — "Audit", "Demo", "Strategy Call", "Scoping Call" — buyers can self-select by readiness
- **Social handles all claimed** — defensive, one less thing to fix
- **Tone** — direct, confident, founder-led. Matches brand voice.

---

*Audit complete. Recommend Carlos reviews P0 list within 24 hours so engineering-lead can start Monday.*
