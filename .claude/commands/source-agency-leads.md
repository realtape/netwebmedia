---
description: Source ranked agency-owner leads for the NWM OS design-partner program. Uses Firecrawl to search the web for boutique marketing agencies matching a vertical+geo profile, scrapes each for founder/email/phone/team-size, scores against the ICP, writes a dated wave file, and dedupe-merges new candidates into plans/nwm-os/warm-list.md. Run manually for fresh waves or via the scheduled weekly job.
argument-hint: [vertical] [geo] [wave_size]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, mcp__firecrawl__firecrawl_search, mcp__firecrawl__firecrawl_scrape
---

# /source-agency-leads — NWM OS Design Partner Sourcing Pipeline

You are running the NWM OS design-partner sourcing pipeline. The point of this command is to **produce real, verifiable agency-owner leads** for the design-partner program (target: 1 signed partner at $1,245/mo by Jun 12, 2026, broader cold-outbound thereafter). Output goes to `plans/nwm-os/waves/wave-YYYY-MM-DD-<vertical>-<geo>.md` and dedupe-merges into the master `plans/nwm-os/warm-list.md`.

**Hard rule:** never invent candidates. If Firecrawl returns nothing useful, say so and stop. Fabricated names waste Carlos's time and erode trust — earlier diligence on this exact pipeline caught a fabrication; do not repeat it.

## Arguments

Parse `$ARGUMENTS` as positional space-separated args:

1. `vertical` (default: `auto` → use next in `weekly_rotation.order` from sourcing-config.json, persisted in `plans/nwm-os/waves/.rotation-cursor`)
2. `geo` (default: `us`)
3. `wave_size` (default: `10`, max: `12`)

Examples:
- `/source-agency-leads` — auto-rotate vertical, US, 10 candidates
- `/source-agency-leads home_services us_west 8`
- `/source-agency-leads law_firms miami_bilingual 12`
- `/source-agency-leads --list` — print available verticals + geos from config and stop

## Step 1 — Load config & resolve args

1. Read `plans/nwm-os/sourcing-config.json`. If missing, halt with a clear error.
2. If `vertical == auto`:
   - Read `plans/nwm-os/waves/.rotation-cursor` if it exists (one integer line). Default to 0.
   - Resolve `vertical = config.weekly_rotation.order[cursor % len(order)]`.
   - Write `cursor + 1` back to `.rotation-cursor` after a successful run.
3. Validate `vertical` exists in `config.verticals` and `geo` exists in `config.geos`. If not, halt.
4. Resolve `geo_suffix = config.geos[geo].query_suffix` and `vertical.queries`.

## Step 2 — Run Firecrawl searches

For each query template in `config.verticals[vertical].queries`:
1. Append `geo_suffix` to the query.
2. Call `mcp__firecrawl__firecrawl_search` with `limit: 10`, `sources: [{type: "web"}]`.
3. Collect all result URLs.

After all searches, dedupe URLs and filter out any URL whose domain matches a pattern in `config.exclusions.domain_patterns` (LinkedIn, Facebook, Clutch, DesignRush, etc. — these are aggregators, not agencies).

If you have <5 candidate URLs after filtering: halt with "Search yield too low for `<vertical>` × `<geo>`. Try a different combo or adjust the query templates in sourcing-config.json." Do NOT fabricate candidates to hit `wave_size`.

## Step 3 — Per-site scrape

For each candidate URL (up to `min(wave_size * 2, 20)` — over-pull so we can drop disqualified ones):
1. Call `mcp__firecrawl__firecrawl_scrape` with:
   - `formats: ["json"]`
   - `jsonOptions: {prompt: "Extract founder/CEO/owner name & title, contact email visible on page, phone, city/state, team size signal, key verticals served, year founded, whether boutique under 50 staff, whether boutique under 15, whether they use GoHighLevel, whether HubSpot Partner, whether they mention AEO or Answer Engine Optimization, whether they offer fractional CMO services, and agency_type (boutique-agency, large-agency, SaaS, talent-marketplace, directory, unclear)", schema: <from config.scrape_schema>}`
   - `onlyMainContent: true`
2. Drop any result where `agency_type` matches `config.exclusions.agency_type_disqualifiers` or `is_boutique_under_50 == false`.
3. Keep the rest.

## Step 4 — Score each candidate

For each surviving candidate, compute a raw score by summing applicable weights from `config.scoring.weights`. Use `config.verticals[vertical].vertical_strength` to pick which `matches_nwm_vertical_*` weight applies.

Bucket into Tier 1/2/3 using `config.scoring.tier_thresholds`. Sort by raw score descending. Take the top `wave_size`.

## Step 5 — Write the wave file

Path: `plans/nwm-os/waves/wave-{YYYY-MM-DD}-{vertical}-{geo}.md` (e.g. `wave-2026-06-03-home_services-us.md`).

Format:

```
# NWM OS Sourcing Wave — {Vertical Display} × {Geo Display}

**Date:** {YYYY-MM-DD}
**Sourced by:** /source-agency-leads
**Queries run:** {N}
**URLs surveyed:** {N}
**Candidates after scrape + dedupe:** {N}
**Wave size returned:** {N}

## Ranked candidates

| Rank | Tier | Score | Agency | Founder | Location | Verticals | Contact | Bonus signals |
|---|---|---|---|---|---|---|---|---|
| 1 | Tier 1 | 78 | ... | ... | ... | ... | email · phone | HubSpot Partner, AEO |
...

## Per-candidate detail

### 1. {Agency name}
- **Site:** [{domain}]({url})
- **Founder:** {name}, {title}
- **Contact:** [{email}](mailto:{email}) · {phone}
- **Location:** {city, state}
- **Verticals served:** {list}
- **Year founded:** {year}
- **Team size signal:** {signal}
- **Bonus signals:** {AEO/HubSpot/GHL/Fractional CMO as applicable}
- **Score:** {raw} ({tier})
- **Recommended outreach hook:** {1-2 sentence specific hook tied to a real detail from their site — never generic}

[... repeat for each candidate ...]

## Honest notes
- {Any disqualifications, search-yield issues, or enrichment gaps that should ride with this wave}
```

## Step 6 — Dedupe into master warm-list

1. Read `plans/nwm-os/warm-list.md`.
2. For each wave candidate, extract its domain. If the domain already appears in warm-list.md, skip (no duplicate entries).
3. Append a new "Wave-sourced additions ({date})" section to warm-list.md listing only the new candidates with a one-line tier + contact line each + a link back to the wave file for full detail.

## Step 7 — Summary back to user

Print a 4-line summary:
- Vertical × geo run
- Candidates added (new) vs. skipped (already in warm-list)
- Tier breakdown (T1/T2/T3 counts)
- Path to the wave file (as a clickable markdown link)

## Safety rails

- **Never fabricate.** If a field couldn't be scraped, leave it blank — say "unknown" or "not surfaced on home page; check /about or /team." Do not invent founder names from archetype patterns.
- **Cost awareness.** Firecrawl is paid. Cap total scrapes at `min(wave_size * 2, 20)`. If you need more candidates, surface that as a request for a Wave 2 run, don't blow the cap silently.
- **No outreach from this command.** This command sources and scores only. Outreach drafting is `/draft-outreach`. Sending is a manual human action.
- **NWM Chrome profile rule** doesn't apply here (no browser automation — Firecrawl is server-side).
