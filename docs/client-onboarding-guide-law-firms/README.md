# NetWebMedia — Client Onboarding Guide · Law Firms Edition

> **Polished HTML version:** open [`index.html`](./index.html) in a browser.
> Companion to the [Wine & Agriculture edition](../client-onboarding-guide/index.html) — same client journey, different niche, more modules captured.

---

## Test session metadata

| Field | Value |
|---|---|
| Test user | **Sarah Test** |
| Email | `sarah@testlawgroup.com` |
| Plan chosen | Free CRM → Fractional CMO upsell |
| Industry / niche | **Law Firms** (display slug: `legal-services`) |
| Organization | Test Law Group |
| Screens captured | **38 product + 7 nurture = 45 total** |
| Capture date | 2026-05-11 |
| Scripts | [`capture.js`](./capture.js) · [`render-emails.js`](./render-emails.js) |

### New modules in this edition (not in wine_agriculture)

Sites/CMS · Email Builder · Forms · SMS · Tasks · Booking · Payments · A/B Tests · Social · Reputation · Diagnostic · Campaigns

---

## Section 1 — Discovery

![Homepage hero](./screenshots/01-homepage-hero.png)
*Screen 1 · Homepage hero · `/index.html`*

![Homepage CMO tiers](./screenshots/02-homepage-cmo-tiers.png)
*Screen 2 · CMO Standard tier visible on homepage*

---

## Section 2 — The legal-services industry hub

![Legal services hub](./screenshots/03-industries-legal.png)
*Screen 3 · "Be the Firm AI Recommends First" · `/industries/legal-services/`*

![Legal services resources](./screenshots/04-industries-legal-resources.png)
*Screen 4 · AEO content cluster — case studies, methodology, FAQ*

> **Confidentiality rule:** NetWebMedia does NOT name former legal clients. Proof points are anonymized ("a personal-injury firm in the Midwest…"). This is durable.

![Services CMO section](./screenshots/05-services-cmo.png)
*Screen 5 · Services page · CMO tier breakdown*

---

## Section 3 — Reading the pricing page

![Pricing AEO Audit](./screenshots/06-pricing-cmo-tiers.png)
*Screen 6 · AEO Audit $997 (100% credit toward retainer)*

![Pricing CMO Standard](./screenshots/07-pricing-cmo-standard.png)
*Screen 7 · CMO Standard $1,490/mo*

| Tier | Monthly | Setup | For law firms |
|---|---|---|---|
| AEO Starter | $249/mo | — | Solo attorneys, AEO-only |
| **CMO Standard** | **$1,490/mo** | **$499** | **Small-mid firms — Test Law Group lands here** |
| CMO Premium | $2,990/mo | $999 | Multi-attorney firms, $1M+ rev |

---

## Section 4 — Creating the Free CRM account

![Empty registration](./screenshots/08-register-free.png)
*Screen 8 · Empty registration with Free CRM Plan badge*

**Sarah Test enters:**
1. Full name — `Sarah Test`
2. Work email — `sarah@testlawgroup.com`
3. Password — min 8 chars
4. Terms checkbox — GDPR / CCPA / Chile Ley 19.628
5. Create account — organization "Test Law Group" provisioned, redirect to `/app/`

![Registration filled](./screenshots/09-register-filled.png)
*Screen 9 · Registration filled — Sarah Test for Test Law Group*

![App login](./screenshots/10-app-login.png)
*Screen 10 · Public app login · `/login.html`*

![Internal CRM login](./screenshots/11-crm-login.png)
*Screen 11 · Internal CRM login · `/crm-vanilla/login.html`*

---

## Section 5 — First-run niche picker → Law Firms

![14-niche picker](./screenshots/12-firstrun-niche.png)
*Screen 12 · The 14-niche picker · Sarah selects **Law Firms***

> ⚠️ **What changes when "Law Firms" is selected:** Pipeline stages become Intake → Consultation → Retainer Sent → Signed → Active Case. KPIs switch to *case acquisition cost*, *consultation→retainer rate*, *avg case value*. Niche-specific landing-page templates surface in Sites.

---

## Section 6 — Core CRM modules

![CRM Dashboard](./screenshots/13-crm-dashboard.png)
*Screen 13 · Dashboard with KPI cards*

| # | Module | Notes for law firms | Screenshot |
|---|---|---|---|
| 14 | **Contacts** | Segment tabs + region tabs + HubSpot sync | ![](./screenshots/14-crm-contacts.png) |
| 15 | **Pipeline** | Law-firm stages preloaded (Intake → Signed) | ![](./screenshots/15-crm-pipeline.png) |
| 16 | **Conversations** | Unified WhatsApp + email inbox · conflict-of-interest alerts | ![](./screenshots/16-crm-conversations.png) |
| 17 | **Tasks** 🆕 | Per-deal task lists · owner assignment | ![](./screenshots/17-crm-tasks.png) |
| 18 | **Calendars** | Multi-cal: consultations, court dates, internal | ![](./screenshots/18-crm-calendar.png) |
| 19 | **Booking** 🆕 | Public booking pages — consultation slots | ![](./screenshots/19-crm-booking.png) |
| 20 | **SMS** 🆕 | Twilio 2-way SMS — critical for 5-min intake | ![](./screenshots/20-crm-sms.png) |

---

## Section 7 — Marketing modules

| # | Module | Screenshot |
|---|---|---|
| 21 | **Campaigns** 🆕 — sends/opens/clicks/CTR dashboard | ![](./screenshots/21-crm-campaigns.png) |
| 22 | **Marketing** — campaign builder (engine ships Q3 2026) | ![](./screenshots/22-crm-marketing.png) |
| 23 | **Email Builder** 🆕 — drag-drop block editor (Heading/Paragraph/Button/Image/Divider/Spacer/Two Columns) | ![](./screenshots/23-crm-email-builder.png) |
| 24 | **Forms** 🆕 — niche-aware intake templates with case-type routing | ![](./screenshots/24-crm-forms.png) |

---

## Section 8 — CMS / Sites (the headline module)

![Sites CMS module](./screenshots/25-crm-sites-cms.png)
*Screen 25 · Sites · 4 tabs (Funnels · Websites · Forms · Surveys) · 6 funnel templates*

### The 6 funnel templates Sarah sees on Day 1

| Funnel | Pages | Sample Visits | Sample Conv. | Best fit for law firms |
|---|---|---|---|---|
| Lead Capture Funnel | 3 | 12,480 | 15.0% | Practice-area landing → consultation request |
| Webinar Registration | 2 | 8,340 | 25.0% | Estate-planning Q&A · thought leadership |
| Free Audit Funnel | 4 | 6,120 | 15.0% | "Is your firm AI-citable?" — entry hook |
| Service Booking | 2 | 4,560 | 25.0% | Direct consultation booking |
| Course Launch | 5 | 3,200 | 12.0% | Optional — productized knowledge |
| E-commerce Store | 8 | 15,600 | 8.0% | Atypical — flat-fee package payments |

> **What "CMS / Sites" actually is:** A drag-drop site builder that owns hosted pages on the NWM domain (or your custom domain). Every form submission lands as a Contact, every booking lands as a Deal — no separate marketing-website silo.

---

## Section 9 — Growth modules

| # | Module | Screenshot |
|---|---|---|
| 26 | **Automation (BETA)** — visual workflow builder | ![](./screenshots/26-crm-automation.png) |
| 27 | **A/B Tests** 🆕 — subject/CTA/page-variant split tests | ![](./screenshots/27-crm-abtests.png) |
| 28 | **Social** 🆕 — Instagram/Facebook/YouTube/TikTok cross-post (no LinkedIn, no X) | ![](./screenshots/28-crm-social.png) |
| 29 | **Reputation** 🆕 — Google Business / Avvo / Yelp aggregation | ![](./screenshots/29-crm-reputation.png) |

---

## Section 10 — Service + admin modules

| # | Module | Screenshot |
|---|---|---|
| 30 | **Courses** — drip video lessons for CLE / client education | ![](./screenshots/30-crm-courses.png) |
| 31 | **Documents** — engagement letters, retainer agreements per deal | ![](./screenshots/31-crm-documents.png) |
| 32 | **Payments (BETA)** 🆕 — Stripe Connect, flat-fee + payment plans | ![](./screenshots/32-crm-payments.png) |
| 33 | **Reporting** — funnels, attribution, revenue trend | ![](./screenshots/33-crm-reporting.png) |
| 34 | **Diagnostic** 🆕 — account health · integrations · dedupe queue | ![](./screenshots/34-crm-diagnostic.png) |
| 35 | **Settings** — org, team, branding, language, niche, integrations | ![](./screenshots/35-crm-settings.png) |

---

## Section 11 — Email nurture sequence (7 emails over 16 days)

| Day | Email | Sequence | Subject |
|---|---|---|---|
| Day 0 · +5min | welcome-1 | Welcome | Your NetWebMedia account is live |
| Day 3 | welcome-2 | Welcome | Your 10-minute first win on the platform |
| Day 7 | welcome-3 | Welcome | Meet the 5 AI Agents in your account |
| Tue 9am | aeo-brief-001 | Weekly broadcast | ChatGPT now cites FAQs 3.2x more than text |
| Day 14 · +5min | law-firms-plan-1 | Niche · law_firms | Your law firm growth plan is being prepared, Sarah |
| Day 14 · +2hr | law-firms-plan-2 | Niche · law_firms | 3 growth levers for Test Law Group, Sarah |
| Day 16 | law-firms-plan-3 | Niche · law_firms | Did the law firm growth plan land, Sarah? |

### Email 1 · Day 0 — Welcome (account is live)

![welcome-1](./screenshots/email-01-welcome-1.png)

### Email 2 · Day 3 — Welcome (10-minute first win)

![welcome-2](./screenshots/email-02-welcome-2.png)

### Email 3 · Day 7 — Welcome (5 AI Agents)

![welcome-3](./screenshots/email-03-welcome-3.png)

### Tuesday Broadcast — AEO Brief #001

![aeo-brief-001](./screenshots/email-07-aeo-brief-001.png)

### Email 4 · Day 14 — Niche (your law firm growth plan)

![law_firms-plan-1](./screenshots/email-04-law-firms-plan-1.png)
*Personalized to "Test Law Group" · Three pillars: intake pipeline, referral gaps, authority content footprint*

### Email 5 · Day 14 +2hr — Niche (3 growth levers)

![law_firms-plan-2](./screenshots/email-05-law-firms-plan-2.png)
*The substance email: 5-min AI intake (21x conversion), authority content for practice area + location, systematic referral nurture*

### Email 6 · Day 16 — Niche (did the plan land?)

![law_firms-plan-3](./screenshots/email-06-law-firms-plan-3.png)
*Low-pressure follow-up close · CTA: Yes, let's talk*

---

## Section 12 — The Fractional CMO upgrade path

![WhatsApp handoff](./screenshots/36-whatsapp-handoff.png)
*Screen 36 · WhatsApp handoff · `?topic=fractional-cmo`*

![Contact page](./screenshots/37-contact-cmo.png)
*Screen 37 · Contact page · calendar + form*

![Thanks page](./screenshots/38-thanks.png)
*Screen 38 · Thanks page · calendar invite within 24h*

---

## How to regenerate this guide

```bash
# Terminal 1
npx http-server . -p 8083 -c-1

# Terminal 2
node docs/client-onboarding-guide-law-firms/capture.js         # 38 product screens
node docs/client-onboarding-guide-law-firms/render-emails.js   # 7 nurture emails
start docs/client-onboarding-guide-law-firms/index.html        # open the guide
```

---

*Generated 2026-05-11 · Test user: Sarah Test (`sarah@testlawgroup.com`) · Test Law Group · Law Firms niche · Free CRM → Fractional CMO funnel*
