# GTM Readiness Audit — Can NWM close a design partner this week?
**Date:** 2026-04-29 (PM)
**Auditor:** Head of Product
**Scope:** Post-foundation reassessment after today's multi-tenancy schema, handler migration, branding render, and admin UI ship.

---

## Verdict

NetWebMedia moved from "fiction in the codebase" (this morning) to **"plausible 15-minute demo, zero-customer reality"** (now). The plumbing exists end-to-end: a master org owner can create a sub-account, switch into it, see branded chrome, and confirm contact-list isolation. That is genuine, material progress. But "demoable" is not "sellable." Six of the seven differentiators on `compare.html` still don't exist as product, the onboarding funnel dead-ends at a generic contact form, and the founding-partner offer has not been written down anywhere a prospect can read it. **Carlos can show this to a friendly agency owner this week and get qualified curiosity. He cannot close a paid deal yet without verbal hand-waving that erodes the credibility he just earned.**

---

## Demo readiness scorecard

15-minute demo path: login → list orgs → create sub-account → set branding → switch → confirm isolated contacts → switch back.

| Step | Status | Notes |
|---|---|---|
| Login as Carlos (master org) | PASS | `crm-vanilla/login.html` works; session resolves to org_id=1 |
| Org-switcher visible in header | PASS | `org-switcher.js` mounts after `admin.js` builds header |
| Create sub-account modal | PASS | `subaccounts.html` + auto-slugify + plan picker |
| POST creates org row | PASS | `organizations.php` handler shipped and routed |
| Branding fields editable on create | PARTIAL | Modal accepts color hex + logo URL, but no preview, no asset upload, logo must be a hosted URL |
| Switch into sub-account | PASS | `?r=organizations&sub=switch` flips session |
| Branded paint on switch | PASS | `branding.js` reads custom props, repaints `.brand-icon`, sets `<title>` |
| Contacts list empty in fresh sub | PASS *(if migration applied)* | Depends on `is_org_schema_applied()` returning true — Carlos must confirm migration ran in prod |
| Sub-account favicon | FAIL | No `favicon_url` column; tab still shows NWM mark |
| Sub-account login URL | FAIL | No `acme.netwebmedia.com` routing yet — the prospect logs in at `netwebmedia.com/crm-vanilla/login.html` and sees the master domain in the URL bar. **This is the most demo-breaking gap.** |
| Custom domain | FAIL | Not in scope this week |
| Switch back to master | PASS | Same dropdown |
| AI SDR demo | FAIL | No UI, no handler, no agent wired |
| Voice AI demo | FAIL | Page does not exist |
| Video Factory demo | FAIL | Page does not exist |
| Stripe Connect / rebill demo | FAIL | Single-merchant `subscriptions` table; no Connect |

**Demoable surface:** the multi-tenancy core. Everything `compare.html` lists as differentiated is still vapor.

---

## Claims-vs-reality table (compare.html)

| Claim | Classification | Evidence |
|---|---|---|
| Full white-label + SaaS mode | **Aspirational** | Branding render + sub-accounts shipped today. Custom domain, per-tenant SSL, sender-domain DNS not built. Page now correctly says "Q2 design partners" — keep that gating. |
| Bilingual EN/ES native | **Truthful** | `data-en/data-es` toggle + geo-IP on public site; CRM UI is English-only but marketing is honest about *site* bilinguality |
| Done-for-you onboarding | **Truthful (as a service)** | This is Carlos's labor, not product. Truthful as long as it stays in the fCMO pitch, not the white-label tier |
| Claude-powered AI agents included | **Bait-and-switch** | `.claude/agents/` is internal NWM ops. No tenant-facing AI surface in `crm-vanilla/`. A buyer reads "included" and expects a button |
| Voice AI (answers calls) | **Vapor** | `/app/voice-ai` 404s. No Twilio integration, no agent. Selling this today is fraud risk |
| Video Factory | **Vapor** | `/app/video-factory` 404s. Heygen pipeline exists for NWM's own reels (`hyperframes/nwm-reels/`), not productized |
| Multi-touch attribution | **Vapor** | `reporting.php` aggregates campaign sends; no touch-graph, no first/last/linear models |
| WhatsApp Business native | **Partial** | `conversations.html` has the surface; backend Twilio webhook is wired but per-tenant Twilio creds and verified senders are not |
| Funnel / landing builder | **Aspirational** | `sites.html` exists in CRM; depth unknown without deeper read. Treat as "basic" not "Yes" |
| Memberships / courses | **Aspirational** | `courses.html` exists as a page; no enrollment, payment, drip logic verified |
| Forecasting (AI-weighted) | **Aspirational** | `pipeline.html` shows stages; no AI weighting model |
| Customer Portal | **Aspirational** | Not verified shipped |
| Reputation aggregator | **Vapor** | `reputation.html` is a 34-line stub. Marketed prominently in pricing.html |
| Affiliates hub | **Vapor** | No `affiliates.html` exists. Marketed as a pillar of the Agency tier on pricing.html |
| Unlimited sub-accounts | **Truthful (today)** | Schema supports it; no quota enforced |
| Stripe Connect rebilling | **Vapor** | Single-merchant only |
| Open REST + GraphQL API | **Half-true** | REST exists (`api/index.php`). No GraphQL anywhere |
| LatAm-first billing (boletas/CFDI/AFIP) | **Vapor** | No SII/SAT/AFIP integration in repo |

**Score: 2 truthful, 5 partial/aspirational, 8 vapor or bait.** That's worse than this morning's read because today's progress also raised the bar — buyers will now poke at the demo.

---

## Pricing recalibration

Today's actual product = single-tenant CRM + multi-tenant scaffolding + branding switch + admin UI. Compared to:

- **GoHighLevel Agency Pro $497/mo:** unlimited sub-accounts, Voice AI, funnel builder, affiliate manager, reputation, white-label mobile app, 7 years of reseller community
- **Vendasta $999/mo+:** marketplace, white-label storefront, multi-product reseller infra
- **Roadmap proposal:** $499 platform + $99/sub-account

**Recommended pricing for what actually ships today:**

| Tier | Roadmap price | Recalibrated price | Rationale |
|---|---|---|---|
| White-Label Founding Partner | n/a | **$199/mo platform + $0/sub-account, capped at 5 subs, 12-month price lock** | Honest "you are a design partner, you accept rough edges, you keep this rate forever" |
| White-Label Agency (post-GA) | $499 + $99/sub | **$299 + $49/sub-account, 3 included** | Undercut GHL deliberately; this is single-tenant feature parity, not GHL parity. Charging GHL's price for half the product gets you compared unfavorably |
| White-Label Pro | $1,499 + $79/sub | **Hold until Voice AI + custom domain ship** | Selling "Pro" without the Pro features is the bait-and-switch row in the table above |
| White-Label Enterprise | Custom | Hold | No SOC 2, no SLA, no audit log. Not a real SKU yet |

**The $499 platform fee in the roadmap was anchored on what NWM wants to be worth, not on what a buyer comparing tabs sees.** Either drop the price, or ship the Voice AI / affiliates / reputation modules that justify it. Don't do both partial.

---

## Onboarding flow gap analysis

What exists end-to-end for a prospect today:
1. Lands on `compare.html` from organic / social
2. Clicks the white-label row → routes to `/contact.html?topic=design-partner`
3. `contact.html` auto-selects the "partner" topic and hides the budget field — this works
4. Fills out generic contact form → email lands in Carlos's inbox
5. **Dead end.** No calendar booking, no automated follow-up, no design-partner application form, no terms, no founding-pricing one-pager, no Loom walkthrough URL to share

**What's missing to convert curiosity → signed:**

| Gap | Effort | Why it matters |
|---|---|---|
| Calendly / native booking on contact form | 2 hr | "Schedule a 20-min call" beats "we'll be in touch" by ~40% conversion |
| `/partners/design-partner.html` — explicit founding offer page | 4 hr | Right now there is no URL Carlos can DM to a candidate. Must include: price, term, what's included, what's expected from partner, how to apply |
| One-page design-partner agreement (PDF) | 3 hr | Removes the "send me a contract" round-trip. 5 partners × no contract = 0 partners |
| Loom of the demo path (5 min) | 1 hr | Asynchronous qualification — sends to 20 candidates, screens for the 5 who actually engage |
| Provisioning runbook | 2 hr | Carlos's own checklist for when a partner says yes: create org, set branding, send creds, schedule kickoff. Without this, onboarding takes 4 hours per partner instead of 30 min |
| Subdomain auto-provision (cPanel API) | 1-2 days | Without this, "design partner" demo always shows `netwebmedia.com/crm-vanilla/` in the URL bar — undermining the white-label promise during the very first impression |

The onboarding gap is **bigger than the product gap** for closing this week. Carlos has more product than he has selling apparatus.

---

## Top 3 shipping priorities — next 7 days

1. **Subdomain provisioning + DNS automation for one test sub-account.** Pick `acme.netwebmedia.com`, manually wire it through cPanel + AutoSSL, prove the demo can show a branded domain in the URL bar. Without this, every demo is "imagine if the URL said acme..." Highest single ROI item this week.
2. **Ship `/partners/design-partner.html` with explicit founding-partner offer.** Concrete: $199/mo platform fee, 5 sub-accounts, 12-month price lock, 3 months free, monthly roadmap call, exit clause if NWM ships fewer than 2 of [Voice AI, custom domain, affiliates] by Q4. Add Calendly booking. This converts the existing `?topic=design-partner` traffic that currently dead-ends.
3. **Strip vapor claims from `compare.html`.** Move Voice AI, Video Factory, multi-touch attribution, affiliates, reputation, GraphQL, LatAm billing from "Yes/Included" to "Q3 2026" or remove. The morning audit moved one row; this is round 2. Every false claim a partner finds in due diligence is a deal that doesn't close — and a churn risk if they signed before finding it.

Honorable mentions deferred to next 30 days: Calendly, design-partner agreement PDF, NOT NULL enforcement on `organization_id` (lock the door), favicon column.

---

## One brutal honest call Carlos needs to make this week

**Pick a buyer profile and stop selling to two markets at once.** The white-label CRM tier targets agency owners with 5+ retainers who want a GoHighLevel alternative. The fCMO tier targets SMB owners who want done-for-you marketing. These are different customers, different sales motions, different objections, different competitors. The current `compare.html` and `pricing.html` try to sell both audiences simultaneously and signal to neither — an SMB doesn't care about Stripe Connect, and an agency owner doesn't care about the fCMO included on Scale.

**Recommendation:** make `agency.netwebmedia.com` (or `/partners/`) the dedicated white-label property with its own pricing page, its own comparison table, its own founding-partner offer. Keep `netwebmedia.com` focused on fCMO. Same product underneath, two clear front doors. The morning audit recommended killing white-label entirely; today's build justifies keeping it — but only if it gets its own room rather than being a sidebar pitch on the SMB site.

If Carlos cannot say by Friday "this week I'm selling to agency owners; SMBs are paused" or vice versa, neither audience converts. The graveyard is healthier than the zombie. Same rule applies to positioning, not just SKUs.

---

**Files referenced:**
- `C:\Users\Usuario\Desktop\NetWebMedia\plans\audits\audit-2026-04-29-positioning.md`
- `C:\Users\Usuario\Desktop\NetWebMedia\plans\audits\multi-tenancy-foundation-2026-04-29.md`
- `C:\Users\Usuario\Desktop\NetWebMedia\plans\audits\handler-migration-2026-04-29.md`
- `C:\Users\Usuario\Desktop\NetWebMedia\plans\audits\branding-render-2026-04-29.md`
- `C:\Users\Usuario\Desktop\NetWebMedia\plans\audits\admin-ui-2026-04-29.md`
- `C:\Users\Usuario\Desktop\NetWebMedia\plans\white-label-roadmap-2026.md`
- `C:\Users\Usuario\Desktop\NetWebMedia\compare.html`
- `C:\Users\Usuario\Desktop\NetWebMedia\pricing.html` (lines 584-609 — Agency tier marketing)
- `C:\Users\Usuario\Desktop\NetWebMedia\contact.html` (lines 526-568 — topic auto-routing)
- `C:\Users\Usuario\Desktop\NetWebMedia\crm-vanilla\subaccounts.html`
- `C:\Users\Usuario\Desktop\NetWebMedia\crm-vanilla\org-settings.html`
- `C:\Users\Usuario\Desktop\NetWebMedia\crm-vanilla\reputation.html` (34-line stub)
