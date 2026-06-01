# SEO Baseline — 2026-05-13

**Purpose:** freeze the pre-intervention numbers so we have a clean before/after for the GSC audit action plan that landed today. Recheck at +30, +60, +90 days.

**Audit source:** Google Search Console pre-audit pulled 2026-05-13 (see screenshot in conversation thread; raw export TBD).

## Baseline metrics (T+0 = 2026-05-13)

| Metric | T+0 value | 90-day target | Stretch |
|---|---|---|---|
| Total impressions (last 90d) | 343 | 1,500 | 2,500 |
| Total clicks (last 90d) | <10 | 25 | 50 |
| Average CTR | ~0% on top 4 pages | 1.5%+ | 3%+ |
| Indexed pages | 13 / 178 reported | 80 / 178 | 140 / 178 |
| Not-indexed pages | 339 | <100 | <50 |
| robots.txt blocks | 14 (all intentional) | unchanged | unchanged |
| 404s in GSC | 14 (export pending) | resolved/redirected | 0 |
| Internal blog → niche-hub links | 0 | 9 (3 per priority hub) | 12+ |

## Top-4 zero/low-click pages (the meta rewrites)

All four had title + meta rewritten on 2026-05-13. New CTAs front-load price anchors, channel names, and timebox language designed to lift CTR from ~0%.

| URL | Pre-90d impr | Pre-90d clicks | Pre-CTR | Post-rewrite title |
|---|---|---|---|---|
| /blog/ai-chatbot-automation-deployment-guide.html | 48 | 0 | 0.0% | AI Chatbot Automation in 2026: 9-Module Playbook for SMBs |
| /blog/sms-multi-platform-messaging-automation.html | 43 | 1 | 2.3% | SMS, WhatsApp & DM Automation: One Inbox, Every Channel |
| /pricing.html | 27 | 0 | 0.0% | Pricing — Fractional AI CMO from $249/mo \| NetWebMedia |
| /tutorials/chatbot-automation.html | 25 | 0 | 0.0% | How to Set Up an AI Chatbot for Your Business (Step-by-Step) |

**Sub-finding:** the tutorials page and blog page were cannibalizing each other — identical title/meta and the tutorials canonical pointed at the blog twin. Tutorials page now self-canonicals and positions as the how-to companion. Expect partial recovery in Search Console once Google re-crawls both URLs.

## Interventions deployed on 2026-05-13

1. **Meta rewrites** — 4 highest-impression / 0-click pages (above).
2. **Subdomain canonical consolidation** — 33 files swept: replaced internal nav links from `https://<sub>.netwebmedia.com` → `https://netwebmedia.com/industries/<niche>/`. Generator templates (`build_industry_pages.py`, `build_subcategory_pages.py`) updated so regenerates stay consistent. Subdomains still resolve via wildcard CNAME (marketing readability preserved); link equity now consolidates to root.
3. **Sitemap thin-page exclusion** — `_deploy/regen-sitemap.py` now drops industry subniche pages with <800 words. Result: 227 URLs removed from `sitemap.xml`, 17 added. Sitemap shrunk from ~675 URLs → 465 URLs.
4. **Internal linking sprint** — 9 inbound contextual links added from blog → priority industry hubs. 3 each:
   - `/industries/healthcare/` ← physical-therapy-clinic-online-marketing-conversion, chiropractic-practice-local-seo-patient-acquisition, mental-health-practice-digital-marketing-strategy
   - `/industries/real-estate/` ← mortgage-broker-seo-lead-generation-conversion, real-estate-photo-google-image-search, mortgage-broker-seo-lead-generation
   - `/industries/hospitality/` ← vacation-rental-ai-marketing-booking-strategy, boutique-hotel-accommodation-digital-marketing, eco-tourism-adventure-travel-seo-strategy
5. **New content pages** — 7 pages drafted by content-strategist agent (status pending at this commit):
   - 2 healthcare (comparison + how-to)
   - 2 real estate (comparison + how-to)
   - 2 tourism/hospitality (comparison + how-to)
   - 1 brand-defense ("vs. IntentMedia")

## Manual follow-ups (require human / Carlos action)

- **GSC: export the 14-page 404 list** — needed to classify each as intentional (e.g., retired Chilean prospect URL → confirm robots.txt block is sufficient) vs. broken (needs 301 in `.htaccess`).
- **GSC: URL Inspection → Request Indexing** on the 4 priority pages once meta rewrites have been deployed for ~24h.
- **GSC: resubmit** `sitemap-index.xml` so Google sees the trimmed sitemap.
- **SaaS niche question** — original audit listed "Healthcare, SaaS, Real Estate, Tourism" as priority niches. SaaS is not in NWM's 14-niche taxonomy. Decision needed:
  - (a) treat SaaS-relevant content as routing to `/industries/smb/` (closest existing fit), or
  - (b) carve SaaS as a sub-section of `/industries/smb/saas/` for AEO purposes (still inside the 14-niche frame, just a sub-hub), or
  - (c) skip SaaS content entirely; focus on the 3 niches we do have hubs for.
- **IntentMedia brand-defense** — page drafted; Carlos to legal-clean-check before publishing.

## 30-day checkpoint (2026-06-13)

Pull GSC and update this file with deltas:
- Impressions (target: >700 by day 30, on pace for 1,500 by day 90)
- Clicks on the 4 rewritten pages (target: ≥1 click each, otherwise the rewrites failed and we A/B again)
- Indexed page count delta (target: +25–40 newly indexed)

## 60-day checkpoint (2026-07-13)

Same drill. Decision point: if impressions are <900 and indexed pages haven't moved, escalate — likely a deeper trust/authority issue requiring backlink work (out of scope for this 90-day plan).

## 90-day checkpoint (2026-08-11)

Final scorecard. If on or above target → repeat the playbook for the remaining 11 niches.
