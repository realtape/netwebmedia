# USA Lead Pipeline — Scaling Plan

_Drafted 2026-05-14 in response to "we need 500,000 USA leads today." Author: Claude (engineering-lead delegate). Status: PROPOSAL — awaiting Carlos sign-off._

## TL;DR

**500K USA leads "today" is not achievable through legitimate channels.** What IS achievable in 2–3 weeks of focused work: **50K–100K qualified, deliverable USA SMB leads** in the 14 NWM niches, scraped fresh, enriched with real owner emails where findable, and deduped against existing CRM data. This doc names the work.

## Current state (verified 2026-05-14)

| Asset | Rows | Quality |
|---|---|---|
| `_leads/leads.csv` (OSM scraper output) | 219,873 (global) | Real, lat/lon-tagged. **23,080 retain an email post-cleanup.** Only ~10% of OSM listings publish an email in the source data. |
| `api-php/data/usa_best_200.csv` | 139,951 | **82% synthetic** — 5 hardcoded local-parts attached to fabricated names. Treat as company-level prospect list, not contact-level. |
| `api-php/data/usa_best_prospects.csv` | 62,009 | Same template-fill pattern. |
| `api-php/data/usa_5x.csv` | 39,886 | Duplicates of the above with role variants. |
| `_leads/master_usa_cleaned.csv` (post-dedupe) | **204,671** | 167K of these still trace to the synthetic source — usable as company list, not personal outreach. |

**Real, scraped, deliverable USA rows with personal-ish emails: ~5K–10K** (the non-`info/contact/sales/admin/hello` subset of master_usa_cleaned.csv, minus dupes against the CRM).

## Why 500K "today" can't happen ethically or legally

1. **CAN-SPAM** is permissive on B2B cold email but requires the recipient to be a real business contact, not a fabricated name. Mass-fabricating "Leah Walker @ Ace Auto" addresses violates the spirit of the law and tanks deliverability when bounces and complaints land your sending IP on Spamhaus.
2. **GDPR** still applies to any EU residents accidentally swept up — and 500K untargeted scrapes will catch some.
3. **List brokers** selling 500K USA SMB lists exist (Apollo, ZoomInfo, ListGiant) — costs $5K–$50K, refresh rate is usually 30%+ stale, and most are role accounts anyway. Not faster than scraping cleanly.
4. **Deliverability arithmetic:** sending 500K cold emails from a 30-day-warmed `netwebmedia.com` domain results in a soft-block on day 1, a permanent reputation hit by day 3, and SES suspension by day 5. The realistic warm-up ceiling for the current SES setup (per `_deploy/EMAIL-DELIVERABILITY.md`) is **5K–10K sends/day after 60 days of gradual ramp**.

## Realistic 3-week pipeline — 50K–100K USA leads

### Phase 1 — Scrape expansion (days 1–7)

**Goal: 80K–120K raw OSM rows from USA SMBs in NWM 14 niches.**

`_leads/scraper.py` already handles 25 metros × 14 niches. To scale:

1. **Expand city list to 100 metros.** Current 25 covers ~25% of US SMBs; adding the next 75 metros (Sacramento, Salt Lake, Tampa-Clearwater, Kansas City, Indianapolis, Columbus, Memphis, Louisville, Oklahoma City, Albuquerque, Tucson, Fresno, Bakersfield, Long Beach, Mesa, Virginia Beach, Omaha, Raleigh, Miami secondary metros, Cleveland, Cincinnati, Pittsburgh, Buffalo, Hartford, Providence, Richmond, Birmingham AL, Tulsa, Wichita, Anaheim, Aurora CO, Anchorage, Santa Ana, Riverside, St. Louis, Bakersfield, Stockton, Lincoln NE, Henderson NV, Greensboro, Plano, Newark, Toledo, Lubbock, Madison WI, Reno, Boise, Winston-Salem, Glendale, Garland, Hialeah, Chesapeake, Norfolk, Fremont, Irving, Scottsdale, San Bernardino, Boise ID, Spokane, Modesto, Tacoma, Fontana, Rochester NY, Oxnard, Moreno Valley, Glendale CA, Yonkers, Aurora IL, Akron, Huntington Beach, Little Rock, Augusta GA, Amarillo, Mobile AL, Grand Rapids, Salt Lake City, Tallahassee, Huntsville AL, Knoxville, Worcester, Newport News, Brownsville TX, Santa Clarita, Providence RI, Fort Lauderdale, Chattanooga, Tempe, Oceanside, Garden Grove, Cape Coral) gets us to ~80% USA SMB coverage. Implementation: add to `US_CITIES` dict in `_leads/scraper.py:259`.
2. **Add state-level bounding boxes for rural niches.** `home_services`, `wine_agriculture`, and `automotive` skew rural — add 50 secondary cities (population 50K–250K) and one state-wide bbox per state for the truly rural niches.
3. **Overpass rate-limit reality.** The script uses kumi.systems Overpass mirror with 4–8s delay. 175 cities × 14 niches = 2,450 queries × ~6s = ~4h of wall-clock time. Realistic with current code; one developer-day to extend the city list + run.
4. **Output:** appended to `_leads/leads.csv` (script already supports resume via checkpoint.json).

### Phase 2 — Email enrichment (days 6–14, parallel with phase 1)

**Goal: lift "has email" from 10% → 35–50% of scraped rows.**

`_leads/enrich.py` already visits each website and scrapes mailto/contact-page emails. To improve hit rate:

1. **Audit `enrich.py` against modern obfuscation.** Many SMB sites hide email behind Cloudflare email-protection or JS injection. Add: render with headless Chrome (Playwright) for pages where the static fetch returns 0 emails AND the page has a `/contact` route.
2. **GMB scrape as fallback** (NOT API — Google's GMB API requires owner verification of each profile). Use SerpAPI's Google Maps endpoint (~$50/month for 5K queries) for the businesses where OSM has no website. Returns the GMB-listed phone + website + sometimes email. **Decision needed: $50–$200/mo SerpAPI spend.**
3. **Optional Hunter.io domain-search top-up** for the ~5K highest-value targets where OSM gave us a domain but no email. ~$50/month for 1K Hunter searches. **Decision needed: $50/mo Hunter spend.**
4. **Skip paid list brokers** — Apollo et al. add cost, not quality, at this scale.

**Realistic output after enrichment:** 80K raw × 40% email = 32K leads with email. Combined with existing clean ~10K, we land at **~40K USA leads with email** at the low end, **80K–100K** if Phase 1 hits the high end.

### Phase 3 — Quality gating + CRM import (days 14–21)

**Goal: only deliverable, niche-tagged, deduped leads land in `webmed6_crm`.**

1. **Re-run `_deploy/clean_leads.py`** against the expanded `leads.csv`. Rules from the 2026-05-14 cleanup pass apply: drop non-human locals, junk domains, malformed, dupes by email.
2. **MX validation pass.** Add a new step: for each retained email, DNS-lookup the MX record. Reject domains with no MX or with `null` MX records. Cost: free, runtime ~30min over 100K rows with parallelism.
3. **Bounce-test the top 10%** via SES bulk verify or a third-party (NeverBounce, ZeroBounce — both ~$5/10K emails). Reject `invalid` and `risky` statuses. **Decision needed: $30–$50 one-time bounce-test spend.**
4. **Dedupe against `webmed6_crm.contacts`** before import (already 691 contacts; don't double-touch).
5. **Niche distribution check.** Audit final list against the 14 NWM niches; flag any niche under 1K rows for a targeted Phase 1 re-scrape.
6. **CRM import** in batches of 5K via `crm-vanilla/api/handlers/contacts.php`, tagged `source=usa_scrape_2026_q2`, lifecycle stage `unverified`. Workflow trigger: `tag_added=usa_scrape_2026_q2` → enroll in low-volume warm-up sequence (max 100/day to start).

### Phase 4 — Sending plan (week 4+, gated on warm-up)

This is where the "we need 500K leads today" framing falls apart. **You cannot send to 500K cold contacts on day 1 regardless of list size.** SES warm-up arithmetic:

| Week | Daily ceiling | Total sent | Reputation status |
|---|---|---|---|
| 1 | 100 | 700 | warming |
| 2 | 500 | 4,200 | warming |
| 3 | 1,500 | 14,700 | yellow |
| 4 | 3,000 | 35,700 | green |
| 5+ | 5K-10K | — | sustainable |

A 50K list takes **~12–14 weeks to fully send** through a warming domain. A 500K list would take **18+ months** and require multiple sending domains. This is non-negotiable infrastructure physics.

If the urgency is real: parallelize across `mail.netwebmedia.com`, `go.netwebmedia.com`, and `hi.netwebmedia.com` (three warming subdomains) — gets you to 30K/day combined after 8 weeks. See `_deploy/EMAIL-DELIVERABILITY.md` for the warm-up SOPs already in place.

## Cost summary

| Item | Cost | Required? |
|---|---|---|
| Engineering time (1 dev × 3 weeks) | internal | yes |
| SerpAPI (Google Maps fallback) | $50–$200/mo | recommended |
| Hunter.io (high-value top-up) | $50/mo | optional |
| Bounce verification (NeverBounce one-time) | $30–$50 | yes |
| Additional SES capacity | included | yes |
| **Total external spend (Phase 1)** | **~$150–$300** | — |

Compare to: $5K–$50K for a stale list broker dump of 500K names with no targeting, no consent, and a 30% bounce rate.

## What I need from Carlos to start

1. **Sign-off on the $150–$300 external spend.** (SerpAPI + NeverBounce minimum.)
2. **Sign-off on the 50K–100K realistic target** in place of 500K.
3. **Niche priority for the first scrape pass.** All 14? Or front-load tourism/restaurants/health where the existing case studies are strongest?
4. **Sending domain decision:** stick with `netwebmedia.com` (slower warm-up) or stand up `mail.netwebmedia.com` as a dedicated cold-outreach subdomain (resets warm-up clock to zero but isolates main-domain reputation)?

Once these are decided I can ship phase 1 (extended city list + scraper run) in 2–3 working days.

## What I will NOT do

- Fabricate names attached to `info@` / `contact@` addresses. This is what produced the bad rows in `usa_best_200.csv` and it damages sender reputation, brand trust, and is borderline misrepresentation under FTC guidelines.
- Buy a list broker dump. The `_leads/leads.csv` OSM data is higher quality than any commercial USA SMB list I've seen at the $5K–$10K tier.
- Promise 500K leads on a 2–3 week timeline. The honest ceiling for that timeline is 100K, and only ~40K of those will have findable emails.
