# NetWebMedia — Client Onboarding Guide

> **Polished HTML version:** open [`index.html`](./index.html) in a browser.
> This Markdown mirror is for GitHub / Notion / Obsidian.

---

## Test session metadata

| Field | Value |
|---|---|
| Test user | **Carlos Test** |
| Email | `carlos@chilespirits.com` |
| Plan chosen | Free CRM → Fractional CMO upsell |
| Industry / niche | Wine & Agriculture |
| Organization | Chile Spirits |
| Screens captured | 27 |
| Capture date | 2026-05-11 |
| Capture script | [`capture.js`](./capture.js) (Puppeteer + Chrome headless) |

---

## Section 1 — Discovering the Fractional CMO offer

Every client journey starts at `netwebmedia.com`. The homepage answers one question: *"What is an AI-Native Fractional CMO and is it for me?"*

![Homepage hero](./screenshots/01-homepage-hero.png)
*Screen 1 · Homepage hero · `/index.html`*

The hero promises one retainer that covers strategy, software, and execution — starting at **$249/month**. Two CTAs: a paid $997 audit (full credit toward a retainer) or a no-friction click into pricing.

![CMO Standard pricing card](./screenshots/02-homepage-cmo-section.png)
*Screen 2 · CMO Standard $1,490/mo · feature ladder mid-homepage*

### Services page — the long-form pitch

![Services page hero](./screenshots/03-services.png)
*Screen 3 · `/services.html`*

![Three CMO tiers](./screenshots/04-services-cmo.png)
*Screen 4 · Three tiers, 90-day minimum, annual pre-pay saves 15%*

> **Takeaway:** Fractional CMO = strategy + software + execution under one monthly retainer. Free CRM is the on-ramp.

---

## Section 2 — Reading the pricing page

![AEO Audit pricing](./screenshots/05-pricing-cmo-tiers.png)
*Screen 5 · AEO Audit $997 (100% credit toward retainer)*

![CMO Standard tier](./screenshots/06-pricing-cmo-standard.png)
*Screen 6 · CMO Standard — most clients land here*

| Tier | Monthly | Setup | For |
|---|---|---|---|
| AEO Starter | $249/mo | — | Solo founders, AEO-only |
| **CMO Standard** | **$1,490/mo** | **$499** | **SMBs with revenue — recommended for Carlos / Chile Spirits** |
| CMO Premium | $2,990/mo | $999 | $1M+ revenue, full marketing department replacement |

---

## Section 3 — Creating the Free CRM account

The "Free CRM" CTA on pricing routes to `/register.html?plan=free`.

![Empty registration form](./screenshots/07-register-free.png)
*Screen 7 · Registration with Free CRM Plan badge*

**Carlos Test enters:**

1. **Full name** — `Carlos Test`
2. **Work email** — `carlos@chilespirits.com`
3. **Password** — min 8 characters
4. **Terms checkbox** — required (GDPR / CCPA / Chile Ley 19.628 compliance)
5. **Create account** — creates an organization, generates auth token, redirects to `/app/`

![Filled registration form](./screenshots/08-register-filled.png)
*Screen 8 · Registration filled, ready to submit*

> **Why "Free CRM" first?** No credit card, under 2 minutes, immediate access to a working pipeline tool. Once contacts and deals live in NWM, the Fractional CMO upsell sells itself.

---

## Section 4 — Two access tiers (login)

NWM has two CRM entry points:

- **Public app shell** at `/login.html → /app/` — clients use this
- **Internal CRM** at `/crm-vanilla/` — NWM team + power users

![Public app login](./screenshots/09-app-login.png)
*Screen 9 · `/login.html`*

![Internal CRM login](./screenshots/13-crm-login.png)
*Screen 13 · `/crm-vanilla/login.html` — includes a "Sign in as demo user" shortcut*

### App-shell modules (lightweight, customer-facing)

| # | Module | Screenshot |
|---|---|---|
| 10 | Sales Pipeline | ![Sales pipeline](./screenshots/10-app-sales-pipeline-lite.png) |
| 11 | Marketing Pipeline | ![Marketing pipeline](./screenshots/11-app-marketing-pipeline.png) |
| 12 | Conversations | ![Conversations](./screenshots/12-app-conversations.png) |

---

## Section 5 — First-run: pick your industry

The first time a client opens `/crm-vanilla/`, NWM asks one question. The answer reshapes pipeline stages, KPI definitions, and email templates for that niche.

![14-niche picker modal](./screenshots/14-crm-firstrun-niche.png)
*Screen 14 · The 14-niche picker · Carlos selects **Wine & Agriculture** for Chile Spirits*

> ⚠️ **Critical:** Niche selection reshapes the entire CRM. Pipeline stages, KPI templates, and email automation are all niche-aware. Worth taking 60 seconds here. (Changeable later in Settings.)

---

## Section 6 — Module tour (the 46-module Free CRM)

The Free CRM ships with the same 46 modules clients get on a Fractional CMO retainer. The difference: who operates them.

![Dashboard](./screenshots/15-crm-dashboard.png)
*Screen 15 · Dashboard — at-a-glance counters, revenue trend, today's schedule*

### Module grid

| # | Module | Purpose | Screenshot |
|---|---|---|---|
| 16 | **Contacts** | Segments (Customers/Prospects/Leads/Churned), regions (USA/Chile), HubSpot sync | ![](./screenshots/16-crm-contacts.png) |
| 17 | **Pipeline / Deals** | Kanban + List, KPI strip (Open · Weighted · Won MTD · Win Rate · Active) | ![](./screenshots/17-crm-deals.png) |
| 18 | **Marketing** | Campaign builder (engine ships Q3 2026 — empty on new accounts) | ![](./screenshots/18-crm-marketing.png) |
| 19 | **Calendars** | Booking pages + multi-cal view, Google Calendar sync | ![](./screenshots/19-crm-calendar.png) |
| 20 | **Reporting** | Conversion funnels, source attribution, MRR trend | ![](./screenshots/20-crm-reporting.png) |
| 21 | **Automation (BETA)** | Visual workflow builder — triggers, branches, send-email, wait, tag | ![](./screenshots/21-crm-automation.png) |
| 22 | **Documents** | Proposal + contract storage tied to a deal | ![](./screenshots/22-crm-documents.png) |
| 23 | **Courses** | Drip-released video lessons attached to contact records | ![](./screenshots/23-crm-courses.png) |
| 24 | **Settings** | Org, team, branding, language (EN/ES), niche, integrations | ![](./screenshots/24-crm-settings.png) |

> **Note:** "Marketing" and "Automation BETA" ship UI today; full backend engines complete in Q3 2026. CMO Standard/Premium clients get the engines turned on day-one — part of the upgrade story.

---

## Section 7 — The Fractional CMO upgrade path

When a free user is ready for done-for-you marketing, three contact paths surface at the right moments.

![WhatsApp handoff](./screenshots/25-whatsapp-handoff.png)
*Screen 25 · `/whatsapp.html?topic=fractional-cmo` — intent-aware copy primes the first message*

![Contact page](./screenshots/26-contact-cmo.png)
*Screen 26 · Contact page — calendar booking + form fallback*

![Thanks page](./screenshots/27-thanks.png)
*Screen 27 · Thanks page — what happens next (calendar invite within 24h)*

### Three paths, when to use each

| Path | When | Response time |
|---|---|---|
| **AEO Audit ($997)** | Prospect wants concrete proof of AI citation gaps before signing | 48h written report |
| **WhatsApp** | Active prospect, ready to talk, prefers async | Same day, business hours |
| **Calendar / Form** | Enterprise-feel buyer who wants a structured call | Calendar invite within 24h |

---

## How to regenerate this guide

```bash
# 1. Start the static server (.claude/launch.json "netwebmedia" profile)
npx http-server . -p 8083 -c-1
# 2. In another terminal, run the capture
node docs/client-onboarding-guide/capture.js
# 3. Open the rendered HTML guide
start docs/client-onboarding-guide/index.html
```

The capture script (`capture.js`) drives Puppeteer through the same 27 URLs, sets the right localStorage state per screen (logged-out for register/login pages, niche-set for clean CRM screens), and stubs `/api/*` responses so empty-state UI renders instead of "Error loading data".

---

*Generated 2026-05-11 · Test user: Carlos Test (`carlos@chilespirits.com`) · Free CRM Plan → Fractional CMO funnel*
