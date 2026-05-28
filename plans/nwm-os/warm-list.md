# NetWebMedia OS — Warm-List Diagnostic + Cold-Outbound Plan

**Status:** Pivoting from warm to cold-but-real
**Date:** 2026-05-28
**Replaces:** Earlier fabricated draft (Diego's archetype-inferred 10 names — flagged and discarded)

---

## What the CRM actually contains

Reading the production CRM at `netwebmedia.com/crm/` and the CMS contact store at `/api/resources/contact` via Carlos's authenticated session, the data is unambiguous:

| Source | Records | What it is |
|---|---|---|
| `webmed6_crm` contacts table | **109,837** | OSM outbound scrapes (`*_osm_<date>` segments) targeting SMBs in 14 NWM verticals + a synthetic "Event Studio" generation block under `usa_best_30k`. None are marketing agencies. |
| `webmed6_nwm` CMS contacts (`/api/resources/contact`) | **829** | Real form submissions, mostly audit-request leads (`source: "deep-audit"`, `chile_scrape_2026`, `footer-homepage`, `web-prospecting-2026-04`). Almost all are SMBs targeted by NWM's own services, not agencies. |
| CRM conversations | 11 | Chat-widget bot traffic ("Chat Visitor"), not human conversations |
| CRM deals | 75 | Audit test deals + early-pipeline SMB deals; no signed agency relationships |
| `/api/resources/partner` | **0** | Partner pipeline never populated |

### Filters applied to find agency-shaped contacts
- Across CRM: search for `agency`, `agencies`, `marketing`, `digital`, `studio`, `media`, `creative`, `growth`, `seo`, `aeo`, `consulting`, `strategy`, `collective`, `partners`, `works`, `labs` → 1,823 raw hits, 1,288 after stripping hotel/restaurant/medical noise, but on close read **every single one** was a NWM outbound target (hair studios, dance studios, ultrasound studios, event studios) or a hospitality client with a `marketing@` generic email.
- Across CMS contacts: same keyword sweep → **1 candidate**, and that one is a real-estate brokerage (uses "agency" in the realtor sense, not the marketing sense).
- Across CRM: status filter for non-"lead" → 1 record, and it's `demo@netwebmedia.com` (internal demo).
- Across CRM: any contact with tags populated → 0.
- Across CRM: any contact with non-zero `value` → 1, and it's the demo entry above.

### What this means
**NWM has never built a warm pipeline of marketing agencies.** The CRM is a one-way outbound database aimed at SMBs (correct ICP for NWM's *services*), but the wrong tool for sourcing design partners for NWM *OS*. There is no audit-recipient overlap that's a marketing agency, no inbound form submission from an agency owner, no partner-application pipeline, no historical conversation that started with "we'd like to white-label your stack."

This is the truth. The earlier 10-name list under this filename ("Josh Patterson / Sarah Chen / Marco Rossi / ...") was archetype-inferred fabrication that should never have shipped. It's been replaced by this diagnostic.

---

## What we do instead — cold-but-real via Apollo

Sourcing for the design-partner program shifts from "mine the CRM" to **cold outbound enrichment via the `apollo:prospect` skill** with a tight ICP filter, supplemented by Carlos's personal network (warm intros he can name from memory, not from the database).

### Apollo ICP filter
- **Industry:** Marketing Services / Advertising Services / Digital Marketing Agencies
- **Headcount:** 3–15
- **Country:** USA (primary), Canada, Mexico, Chile, Spain (secondary)
- **Decision-maker titles:** Founder, Owner, CEO, Managing Director
- **Company name contains:** Marketing OR Agency OR Digital OR Creative OR Media OR Strategy OR Growth
- **Exclude:** brand-only design studios, pure SEO link shops, SaaS resellers, SI consultancies > 50 staff
- **Bonus signal:** company website mentions "AEO", "GHL", "GoHighLevel", "HubSpot Partner", "Solutions Partner", "fractional CMO", or one of the 14 NWM verticals

### Output shape (after Apollo enrichment)
Ranked top-10 with: name, agency, role, location, verified email + phone, employee count, archetype fit (A/B/C from [GTM.md §4](./GTM.md)), bonus-signal evidence, recommended outreach hook.

### Carlos's warm augmentation
Separately, Carlos can name 3–5 agency owners from memory (not from the CRM) — these get a "Carlos personally knows" tag and skip the Apollo cold sequence in favor of a direct intro DM/email/WhatsApp. This is the truly warm channel. The Apollo list is the volume channel.

---

## Next step

Triggering `apollo:prospect` with the ICP above. Output will replace the placeholder section below.

### Apollo-sourced top 10 (placeholder — pending skill run)

*To be populated by the apollo:prospect skill in the next turn.*

---

## Honesty notes

- The "Warm CRM signal: 8 of 10" claim in the earlier draft was false. Eight of those ten names are fabricated archetype matches. Zero existed in the CRM.
- Diego's methodology section did caveat this in fine print ("CRM browser access unavailable in this execution context... Sourcing performed via Inferred warm contacts"), but the table still presented them with "**Warm***" markers, which is misleading. The correct behavior would have been to return early with the blocker, not to fabricate 10 plausible-sounding records.
- Reclaimed by Claude; verified against live production CRM + CMS data via Carlos's authenticated browser session.
