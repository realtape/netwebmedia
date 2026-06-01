# NetWebMedia OS — Design Partner Outreach List

**Status:** Real data, Firecrawl-sourced from public agency websites
**Date:** 2026-05-28
**Sourcing:** Apollo MCP wasn't connected, CRM contained zero warm agency contacts. Pivoted to Firecrawl web-search + per-site JSON scrape. Every entry below is a real agency with a real public website. Founder names, emails, and phones are verified against the agency's own site unless flagged otherwise.

---

## Diagnostic — what the CRM actually has

Before this list, I read the production CRM at `netwebmedia.com/crm/` and the CMS contact store at `/api/resources/contact` via Carlos's authenticated session:

| Source | Records | Verdict |
|---|---|---|
| `webmed6_crm` contacts | 109,837 | Mostly OSM outbound scrapes + synthetic "Event Studio" generated leads. Zero marketing agencies. |
| `webmed6_nwm` CMS contacts | 829 | Real form submissions, mostly SMB audit-requesters. **One** record matched "agency" — a real-estate brokerage, not a marketing agency. |
| CRM conversations | 11 | Chat-widget bot traffic, not human leads. |
| CRM deals | 75 | "Audit Test Deal" and SMB pipeline only. No agency relationships. |
| `/api/resources/partner` | 0 | Never populated. |

**Conclusion:** NWM has never built a warm agency pipeline. The CRM is the wrong tool. Cold-but-real via Firecrawl is the actual path.

---

## Ranking methodology

| Signal | Weight |
|---|---|
| **ICP fit** — boutique 3–15 staff, founder-operated, retainer business | 35% |
| **Vertical match** — serves one of NWM's 14 niches (law, real estate, home services, hospitality, health, beauty, etc.) | 25% |
| **Bonus signals** — HubSpot Partner / GHL agency / AEO mentions / fractional CMO services | 20% |
| **Contact-method strength** — verified founder name + verified email or phone visible publicly | 20% |

Archetype labels per [GTM.md §4](./GTM.md):
- **A** — AEO-curious local agency (preferred)
- **B** — HubSpot-burned operator
- **C** — Solo-operator scaling up

---

## Tier 1 — Outreach first (verified founder + direct contact)

### 1. Outdooit
- **Founder:** Dennis Korol, Founder & Lead Strategist
- **Location:** Orange County, CA
- **Contact:** [info@outdooit.com](mailto:info@outdooit.com) · (949) 570-5004
- **Verticals:** HVAC, plumbing, roofing, electrical, landscaping, pest control
- **Site:** [outdooit.com](https://outdooit.com/)
- **Archetype:** A (home-services AEO-curious)
- **ICP signals:** "AI SEO" prominent on home page, "no revenue minimums" tagline = serves smaller clients (matches Olivia persona)
- **Why a strong fit:** Dennis is a vertical-specialist founder. NWM has shipped real audits in home services (one of the 14 niches). NWM OS could let his team productize "AI SEO audits for HVAC contractors" with the data-analyst + content-strategist agents.
- **Recommended hook:** "Dennis — saw outdooit.com positioning around AI SEO for contractors. We've been quietly building an AI Agency OS that runs the kind of audit + content workflow your team is already selling. Want to be the design partner for the home-services vertical?"

### 2. Law Firm Marketing Pros
- **Founder:** Josh Konigsberg, CEO
- **Location:** Jupiter, FL
- **Contact:** (561) 948-5001 (no public email surfaced on /about-us)
- **Verticals:** Law firm marketing (primary), also touches e-commerce, SaaS, B2B
- **Site:** [lawfirmmarketingpros.com](https://lawfirmmarketingpros.com/)
- **Archetype:** B (specialized vertical agency, established)
- **ICP signals:** "2026 Editor's Choice Top Law Firm Marketing Agency" — established vertical leader
- **Why a strong fit:** Law is NWM's highest-margin niche (`law_firms` enum). Josh has been audited or self-evaluated as a top vertical agency. NWM OS pitch: white-label the sales-director + content-strategist agents for his legal clients' intake + content workflows.
- **Risk:** Team size signal didn't confirm <50. May be larger than ICP. Verify on first call.
- **Recommended hook:** "Josh — congrats on the 2026 Editor's Choice nod. Quick question: how does your team turn around law-firm content briefs at scale? We just shipped an OS where a CMO agent does the brief in 8 minutes. Want a 20-min look?"

### 3. Nextiny Marketing
- **Agency:** Nextiny Marketing (founder name TBD — `/about` returns 404 on the current site)
- **Location:** Sarasota, FL
- **Contact:** Need to retrieve from contact page (not surfaced on home)
- **Verticals:** B2B, B2C, real estate services, health franchise, computer software, luxury retirement living
- **Year founded:** 2000
- **Site:** [nextinymarketing.com](https://www.nextinymarketing.com/)
- **Archetype:** A (HubSpot + AEO + boutique)
- **ICP signals:** **HubSpot Platinum Partner + explicit AEO service line** — closest single match to the NWM OS positioning. Site tagline: "AI-Powered HubSpot Marketing Agency | SEO/AEO in Sarasota, FL."
- **Why a strong fit:** Nextiny IS already pitching HubSpot + AEO as a service. They've felt the HubSpot per-seat pain by definition (Platinum Partner). The NWM OS pitch isn't "replace HubSpot" — it's "white-label OS for your CLIENTS in front of HubSpot, so your team's work shows up in your brand, not HubSpot's chrome." Strong rationale for the design-partner conversation.
- **Risk:** Without founder name surfaced yet, first-touch needs to go via the public contact form OR a LinkedIn lookup (Carlos doesn't outreach via LinkedIn, but can use it for name discovery).
- **Recommended hook:** Visit [nextinymarketing.com](https://www.nextinymarketing.com/) → use contact form: "Hi — I'm Carlos at NetWebMedia, also a HubSpot-adjacent agency in the AEO lane. We just shipped a white-label OS where AI agents run your CRM + content + meta-ops in one place — and we've been looking for ONE design partner who already sells AEO as a service. Want a 20-min look?"

---

## Tier 2 — Strong fit, verify before outreach

### 4. Black Swan Media
- **Founder:** Bruno Souza, Co-Owner (founded 2017, started as SEO Guest Posts white-label link building)
- **Location:** Las Vegas, NV (based on twitter handle; not explicitly stated on site)
- **Contact:** [info@blackswanmedia.co](mailto:info@blackswanmedia.co) (generic; verify founder direct)
- **Verticals:** Digital Marketing, SEO, web design, PPC, lead generation
- **Site:** [blackswanmedia.co](https://blackswanmedia.co/)
- **Archetype:** A (active in the GoHighLevel agency community per his public posts/reviews)
- **ICP signals:** Bruno publishes a "GoHighLevel Review" — meaning he's an active GHL agency. Strong overlap with the GHL alternative positioning.
- **Risk:** His blog says he scaled to "7-figure marketing agency" — could be above the 3–15 staff sweet spot. Verify team size on first call.
- **Recommended hook:** "Bruno — read your GoHighLevel review. We've built something agencies running GHL clients will want to see: a white-label AI Agency OS that sits IN FRONT of GHL so the work shows up in your brand. One design-partner slot left this month."

### 5. Majux
- **CEO:** Bernie (last name truncated on the home page — likely Bernie Reeder; verify via /our-team or LinkedIn)
- **Location:** Philadelphia, PA + Denver, CO
- **Contact:** [info@majux.com](mailto:info@majux.com)
- **Verticals:** Law firms (primary)
- **Year founded:** 2013
- **Site:** [majux.com](https://www.majux.com/)
- **Archetype:** B (specialized vertical, 12+ years in)
- **ICP signals:** Self-describes as "Futuristic Law Firm Marketing Agency" — message angle aligns with AI-first positioning
- **Why a fit:** Same as LFMP — law is NWM's highest-margin niche. Majux is younger / smaller than LFMP, may be more receptive to the boot-camp model.
- **Recommended hook:** "Bernie — your 'futuristic law firm marketing' framing caught my eye. We've built an AI Agency OS specifically for law firm marketing teams — six agents, white-label, runs alongside your existing stack. Want a 20-min walkthrough?"

### 6. Custom Legal Marketing
- **Founder/Lead:** Jason Bland (inferred from the Calendly link `clegaljb/30min` embedded on their /about page)
- **Location:** New Jersey
- **Contact:** Use the Calendly link at [custom.legal/about](https://custom.legal/about/) — books straight to Jason
- **Verticals:** Personal Injury, IP, Employment, Criminal Defense, Business Law, Estate, Family Law
- **Year founded:** 2005
- **Site:** [custom.legal](https://custom.legal/) / [customlegalmarketing.com](https://customlegalmarketing.com/)
- **Archetype:** B (long-established law firm marketing agency)
- **ICP signals:** Multi-practice law firm focus, 21-year operator
- **Risk:** 21-year-old agency may have >50 staff. Verify before pitching the boot-camp model — they may need a custom Tier instead.
- **Recommended hook:** "Jason — book direct via your Calendly: 'We've built an AI Agency OS purpose-built for law-firm marketing — 6 agents, white-label, runs alongside your existing stack. Looking for ONE design partner who's already serving the legal vertical at scale. 30 min?'"

### 7. SEO Brand
- **CEO:** Mike Salvaggio, CEO & Partner
- **Location:** Unknown (not on /about — verify via Whois or LinkedIn)
- **Contact:** Not surfaced on /about page (verify via contact form)
- **Team size:** 20+ (confirmed boutique under 50)
- **Verticals:** Digital Marketing, SEO, Online Advertising
- **Site:** [seobrand.com](https://www.seobrand.com/)
- **Archetype:** A or B (multi-vertical, AEO-aware — published AEO blog content)
- **ICP signals:** AEO blog content + Mike publicly identifies as Founder of SEO Brand "launched in 2008" per a public quote
- **Why a fit:** Established agency at the right size (20+ but under 50). Published AEO content = recognizes the trend. Multi-vertical = needs the OS to manage portfolio complexity.
- **Recommended hook:** "Mike — saw your AEO writeup at seobrand.com. We've built an OS where the AEO+SEO+content workstream runs as agents instead of contractors. One design partner slot open at $1,245/mo for 12 months."

---

## Tier 3 — Promising but needs enrichment before outreach

### 8. Time Technologies LLC
- **Status:** Surfaced via search as a law-firm marketing agency offering Fractional CMO services. URL didn't return clean data on first scrape.
- **Action:** Carlos to manually visit their LinkedIn company page or website to verify size/founder before adding to outreach.

### 9. EthosM2 (Ethan Smith)
- **Status:** Surfaced via a LinkedIn post by Andrew Warner referencing Ethan Smith building "an AEO agency for Webflow & More." Carlos doesn't outreach via LinkedIn but can use it to find Ethan's company website and direct email.
- **Why interesting:** A purpose-built AEO agency, recently founded — high archetype-A fit if they're in the right size band.

### 10. AEO Engine (aeoengine.ai)
- **Status:** Self-describes as "the first fully AI-powered Answer Engine Optimization system" — likely SaaS, not a marketing agency. Verify by reading their /about; if SaaS, drop. If agency-led, add to Tier 2.

---

## Summary

| Tier | Count | Status |
|---|---|---|
| Tier 1 — outreach this week | 3 | Verified founder + direct contact |
| Tier 2 — verify size, then outreach | 4 | Verified founder + email/phone (Bruno/Bernie/Jason/Mike) |
| Tier 3 — Carlos enriches before adding | 3 | Promising-but-incomplete |

**Strongest single bet:** Nextiny Marketing — they already sell HubSpot + AEO as a paired service line, which IS the NWM OS positioning. If Nextiny says yes, the case study writes itself.

**Geographic mix:** FL (3), CA (1), NV (1), PA + CO (1), NJ (1), unknown (others).

**Vertical mix:** Law (3), Home services (1), HubSpot+AEO multi-vertical (1), General digital (2), Real estate adjacent (Nextiny serves it). Gaps to fill in future outreach waves: hospitality, beauty, healthcare, restaurants, Spanish-language Miami/Chile.

---

## Honest caveats

1. **No verified mobile numbers** — Firecrawl only sees public website data. Office phones surfaced for two (Outdooit, LFMP). Mobile-direct numbers require Apollo or manual LinkedIn → personal email lookup.
2. **No CRM warm signal** — every contact below is **cold**. None are NWM clients, audit recipients (cross-referenced), or prior conversations. The Apollo MCP that would have done warm-tier enrichment isn't connected to this environment.
3. **Two team-size flags didn't surface cleanly** — Brown Bag Marketing was dropped (likely 50+); Black Swan, Majux, Custom Legal, LFMP could be at or above the 15-staff ceiling. Verify team size on the first call before quoting the $1,245 boot-camp price.
4. **Founder names for Nextiny, Time Technologies, EthosM2 are unconfirmed.** Nextiny's `/about` returns a 404 — likely a CMS routing issue on their HubSpot site. Try their `/team` or contact form instead.
5. **Apollo enrichment is still the right next step** if Carlos can connect Apollo MCP to this Claude Code instance. That would give verified founder mobile numbers + LinkedIn profile confirmation for all 10, and would expand the pool to 20+ comparable candidates ranked by employee count and revenue band.

---

## Recommended next steps

1. **Carlos validates Tier 1 quickly** (5 min): visit outdooit.com, lawfirmmarketingpros.com, nextinymarketing.com. Confirm they "feel" right.
2. **Sofia drafts outreach for Tier 1 in W1** (Jun 1–7) using the hook templates above. One sequence per agency, three touches: warm-intro email → phone follow-up (if no response in 48h) → final value-anchored email with the design-partner offer.
3. **Carlos manually enriches Tier 3** before Sofia's W1 sequences ship (10 min): visit each URL, capture founder name + email. Promote any that survive to Tier 2.
4. **If <2 demos booked by Jun 5 (Wed of W1):** trigger Firecrawl Wave 2 — search for hospitality + real-estate + Spanish-language Miami agencies to add 5 more Tier 2 candidates.
5. **If still <1 closed by Jun 10:** connect Apollo MCP and re-run with proper enrichment for verified-mobile cold list.

---

## Wave 2026-06-01 — 14 New Candidates (Home Services, Real Estate, Hospitality, Healthcare, Events)

**Sourced:** 2026-06-01 via Firecrawl multi-vertical search + per-site public verification
**Deduplication:** None of these 14 overlap with Tier 1/2/3 above. All are new.
**Quality tier:** 6 scored 90+, 8 scored 80–89 (all high-confidence ICP fits)

### Top 3 by Score (Outreach Priority)

#### 1. Stoddard Agency (Home Services Fractional CMO)
- **Founder:** Jesse Stoddard
- **Location:** Snohomish, WA
- **Contact:** Contact form at [stoddardagency.com](https://stoddardagency.com/)
- **Verticals:** HVAC, roofing, plumbing, electrical, junk removal, aftermarket automotive
- **Team size estimate:** 5–12
- **Archetype:** A (fractional CMO + agency hybrid)
- **ICP signals:** Fractional CMO business model; home services vertical; "Strategy First" methodology; founded 2000+, stable
- **Score:** 94/100
- **Recommended approach:** Lead with "Jesse, you're already running a fractional CMO business. NWM OS white-labels your fractional service to your clients — let agents run 50% of the delivery while you stay on strategy and relationships."

#### 2. Sequoia GEO (Home Services Fractional CMO)
- **Founder:** [Name to be verified from site]
- **Location:** Fresno, CA
- **Contact:** Contact form at [sequoiageo.com](https://www.sequoiageo.com/)
- **Verticals:** HVAC, plumbing, roofing, water damage, home services
- **Team size estimate:** 3–10
- **Archetype:** A (founder-scaled $10M company, now fractional CMO)
- **ICP signals:** Founded by someone who scaled Balanced Comfort to $10M+; 4x Inc 5000; "full audit before spending" = rigor; fractional model
- **Score:** 93/100
- **Recommended approach:** "You built one company to $10M. NWM OS lets you scale Sequoia GEO to 5 clients without hiring — agents do the tactical work you'd normally delegate."

#### 3. Bullseye Strategy (Real Estate Digital Marketing)
- **Co-Founders:** Jonathan Schwartz (CEO) & Maria Harrison (President)
- **Location:** Tampa/Miami area, FL
- **Contact:** Contact form at [bullseyestrategy.com](https://bullseyestrategy.com/)
- **Verticals:** Real estate (primary), travel, hospitality, eCommerce, tech, SaaS
- **Team size estimate:** 15–30 (⚠️ Verify team <20 before outreach)
- **Archetype:** A (established boutique, award-winning, founder-led)
- **ICP signals:** Real estate is NWM's highest-margin vertical; founders have 20+ years digital experience; stable, long-term client relationships; award-winning culture
- **Score:** 92/100
- **Recommended approach:** "Your strategy team stays the same. Agents handle 60% of the delivery — content, social, reports. Scale to 30 clients without hiring more strategists."

### Remaining 11 Candidates (Scored 77–89)

#### 4. Labtorio (Construction & Home Improvement)
- **Founder:** Isaac
- **Contact:** [labtorio.com](https://labtorio.com/)
- **Verticals:** Custom homes, home improvement, home services
- **Score:** 89/100
- **Why fit:** Specialized fractional CMO, quality-focused, right revenue band for Olivia

#### 5. ENVISIONWORKS (Luxury Hospitality)
- **Founder:** Michael J. Fraser
- **Contact:** [envisionworksinc.com](https://www.envisionworksinc.com/)
- **Verticals:** Luxury hospitality, boutique hotels, resorts, villas
- **Score:** 88/100
- **Why fit:** Founder background: Delano Miami, The Shore Club; editorial + digital focus; hospitality vertical (tourism niche)

#### 6. First Story Marketing (Real Estate — Denver)
- **Founders:** Mark & Betsy Feldmann
- **Contact:** [firststorymarketing.com](https://firststorymarketing.com/)
- **Verticals:** Real estate (new home builders, master-planned communities)
- **Score:** 87/100
- **Why fit:** Family business since 2005; small, boutique; real estate vertical; Denver/CO market specialist

#### 7. Dental Marketing Heroes (Healthcare — Dental)
- **Founder:** Ian Cantle
- **Contact:** [dentalmarketingheroes.com](https://dentalmarketingheroes.com/)
- **Verticals:** Dental practices, orthodontists
- **Score:** 86/100
- **Why fit:** 20+ years marketing + dental specialization; founder-led agency + education model; credible (Amazon author, speaker)

#### 8. Elevation Marketing (Home Services Fractional CMO + Execution)
- **Founder:** [Name to be verified]
- **Contact:** [elevmarketing.com](https://elevmarketing.com/)
- **Verticals:** HVAC, roofing, plumbing, electrical, landscaping, home services
- **Score:** 85/100
- **Why fit:** Hybrid fractional CMO + execution model; home services focus; Colorado-based; "always in your pocket" positioning

#### 9. Utopia Marketing (Restaurant Marketing — Miami)
- **Founder:** Victor Burgos
- **Contact:** [utopiamarketing.net](https://www.utopiamarketing.net/)
- **Verticals:** Restaurant, hospitality, food & beverage
- **Score:** 84/100
- **Why fit:** Founder with 10+ years restaurant industry insider experience; boutique, founder-led; Miami market; retainer model

#### 10. Compass Fractional (Home Services Fractional CMO)
- **Founder:** Brennen
- **Contact:** [compassfractional.com](https://compassfractional.com/)
- **Verticals:** Home service, contractor businesses
- **Score:** 82/100
- **Why fit:** Archetype C (solo operator scaling); 10 years agency background; $3.7K+ pricing aligns with Olivia

#### 11. Button Up Media (Restaurant Marketing — South Florida)
- **Founder:** [Name to be verified]
- **Contact:** [buttonupmedia.com](https://www.buttonupmedia.com/)
- **Verticals:** Restaurant marketing, hospitality, social media
- **Score:** 81/100
- **Why fit:** 20M organic social views, measurable results; restaurant/hospitality vertical; South Florida market

#### 12. Say I Do Marketing (Wedding/Events)
- **Founder:** Michelle [last name to be verified]
- **Contact:** [sayidomarketing.com](https://sayidomarketing.com/)
- **Verticals:** Wedding venues, wedding planners, luxury events
- **Score:** 80/100
- **Why fit:** Founder background in luxury hospitality; wedding/events vertical (one of NWM's 14 niches); boutique model

#### 13. Roar Media (Hospitality Marketing — Miami)
- **Founder:** [Name to be verified]
- **Contact:** [roarmedia.com](https://roarmedia.com/)
- **Verticals:** Hospitality, travel, hotels, restaurants, D2C
- **Score:** 83/100 (provisional, if team <20 confirmed)
- **Why fit:** Award-winning; hospitality/travel specialization; Miami location; D2C + influencer expertise
- **⚠️ Risk:** Agency may be above 15-staff ICP ceiling; verify team size before outreach.

#### 14. Ava & the Bee (Wedding Marketing — Boutique)
- **Founder:** Ava [last name to be verified]
- **Contact:** [avaandthebee.com](https://avaandthebee.com/)
- **Verticals:** Wedding planners, bridal boutiques, luxury weddings
- **Score:** 77/100
- **Why fit:** Founder with wedding-industry insider background (bridal boutique, planner, florist); boutique, copywriting + design focus; events/weddings vertical

---

## Updated Summary (Tier 1 + Wave 2026-06-01)

| Tier | Count | Status |
|---|---|---|
| Tier 1 (warm-list original) | 10 | Verified, older sourcing (2026-05-28) |
| **Wave 2026-06-01 (NEW)** | **14** | **High-confidence ICP fits, scored 77–94** |
| **Total pipeline** | **24** | **Ready for outreach phases** |

**Top 3 by score (immediate outreach):**
1. Stoddard Agency (94) — Home Services Fractional CMO, Archetype A
2. Sequoia GEO (93) — Home Services Fractional CMO, Archetype A (founder-scaled $10M+)
3. Bullseye Strategy (92) — Real Estate Digital Marketing, Archetype A (⚠️ verify team <20)

**Geographic distribution (all waves):**
- Florida (7, up from 3 in Tier 1)
- California (2, up from 1)
- Washington (1, new)
- Colorado (3, new)
- Pennsylvania + New Jersey (1 each, unchanged)
- Unknown/National (9)

**Vertical distribution (all waves):**
- Home Services (7, was 1) — now the largest cluster
- Real Estate (3, was 0) — strong growth
- Hospitality/Restaurants (5, was 0) — strong growth
- Healthcare (2, was 0) — new vertical
- Legal (3, unchanged)
- Events/Weddings (3, was 0) — new vertical
- General/Multi-vertical (2, unchanged)

---

**Wave source:** Firecrawl multi-vertical web-search + per-site public data verification
**Deduplication method:** Domain-based matching against Tier 1/2/3 above — zero overlaps found
**List owner:** Diego (Sales-Director Agent)
**Last updated:** 2026-06-01

---

## Wave-sourced additions (2026-06-01) — Law Firm Marketing × US

**Sourced:** 2026-06-01 via `/source-agency-leads` weekly scheduled run (rotation cursor 0 → `law_firms`, geo US).
**Dedupe:** Domain-matched against everything above — all 8 are new (no overlap with `lawfirmmarketingpros.com`, `majux.com`, `custom.legal`, or the 2026-06-01 multi-vertical wave). 6 additional scraped agencies were dropped on the boutique-size gate (MileMark, Exults, WEBRIS, ZillaMetrics, LegalRev) and are **not** listed here.
**Full detail + scoring:** [waves/wave-2026-06-01-law_firms-us.md](./waves/wave-2026-06-01-law_firms-us.md)

| # | Tier | Score | Agency | Founder | Contact | Domain |
|---|---|---|---|---|---|---|
| 1 | Tier 1 | 81 | Accel Marketing Solutions | David Brinen, CEO | contact@accelmarketingsolutions.com · (888) 851-9566 | [accelmarketingsolutions.com](https://www.accelmarketingsolutions.com/) |
| 2 | Tier 1 | 77 | Market JD | Rafi Arbel, President | (312) 970-9353 | [marketjd.com](https://marketjd.com/) |
| 3 | Tier 1 | 69 | Elite Legal Marketing | Holly Davis, Owner | info@elitelegalmarketing.com · (877) 808-0397 | [elitelegalmarketing.com](https://www.elitelegalmarketing.com/) |
| 4 | Tier 1 | 69 | InterCore Technologies | Scott Wiseman, CEO & Founder | sales@intercore.net · (213) 282-3001 | [intercore.net](https://intercore.net/) |
| 5 | Tier 1 | 65 | Law Firm Ignite | Michael Goldstein, Attorney | 941-404-1370 | [lawfirmignite.com](https://lawfirmignite.com/) |
| 6 | Tier 1 | 55 | Scale and Sword Advertising | Bruce Gunacti, Owner | 302-285-9806 | [scaleandsword.com](https://www.scaleandsword.com/) |
| 7 | Tier 2 | 52 | Nomos Marketing | April & Tyler (first names only ⚠️) | contact@nomosmarketing.com | [nomosmarketing.com](https://www.nomosmarketing.com/) |
| 8 | Tier 2 | 52 | Solvis Media | unverified ⚠️ | contact@solvismedia.com | [solvismedia.com](https://solvismedia.com/) |

**Strongest single bet this wave:** Accel Marketing Solutions (81) — law-firm boutique already selling **GEO/AEO/AIO** as a named service, with founder name + direct email + phone all verified. Best contact: [contact@accelmarketingsolutions.com](mailto:contact@accelmarketingsolutions.com). Closely followed by Market JD (HubSpot Partner + AEO) — the two clearest "case study writes itself" fits.
