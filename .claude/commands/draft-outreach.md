---
description: Draft a 3-touch outreach sequence (warm-intro email, 48h follow-up, value-anchored close) for one NWM OS design-partner candidate. Pulls signals from the warm-list or a wave file. Drafts only — never sends.
argument-hint: [candidate_identifier] [tier]
allowed-tools: Read, Write, Glob, Grep
---

# /draft-outreach — NWM OS Design Partner Outreach Draft

You are drafting cold-but-personalized outreach for one specific candidate from the design-partner sourcing pipeline. **You draft. A human sends.** Never call any send tool from this command — output to disk only, optionally also paste into the conversation for review.

## Arguments

Parse `$ARGUMENTS`:

1. `candidate_identifier` (required) — agency name OR domain OR "rank N from wave-YYYY-MM-DD-..." OR "tier1 outdooit" etc. Be flexible; resolve to one row.
2. `tier` (optional, default `tier1`) — affects messaging intensity (Tier 1 = full-warm voice from Carlos; Tier 2 = professional cold; Tier 3 = brief value-anchor only)

Examples:
- `/draft-outreach Outdooit`
- `/draft-outreach nextinymarketing.com tier1`
- `/draft-outreach "rank 3 from wave-2026-06-03-home_services-us"`

## Step 1 — Resolve the candidate

1. Read `plans/nwm-os/warm-list.md` and any matching files under `plans/nwm-os/waves/`.
2. Locate the candidate row by fuzzy match on name, domain, or rank reference.
3. If ambiguous, list the 2–3 closest matches and stop. Do not pick one without confirmation.
4. If no match, halt with "Candidate not found. Run `/source-agency-leads` first or check spelling."

## Step 2 — Read the GTM context

Skim:
- `plans/nwm-os/GTM.md` §1 (positioning), §5 (messaging framework), §6 (sales motion)
- `plans/nwm-os/DECISIONS.md` (locked pricing, design-partner terms)
- `plans/nwm-os/V1-PLAN.md` §4 Tension F (the W6 boot-camp model — outreach must reference this, NOT "weekly calls for 6 weeks")

## Step 3 — Draft the 3-touch sequence

Write to `plans/nwm-os/outreach/draft-{date}-{slug}.md`. Create `plans/nwm-os/outreach/` if it doesn't exist.

Each touch follows these rules:

**Touch 1 — Warm-intro email** (sent at T+0, day 1 of week)
- Subject: under 60 chars, mentions a specific detail from the candidate's site (not generic). Examples: "Your AI SEO positioning at Outdooit", "Saw the HubSpot Platinum + AEO pairing at Nextiny"
- Body: 80–140 words. Opens with a real observation (1 sentence). Names the pain you're solving (1 sentence). Drops the product in one phrase ("AI Agency OS — 6 agents that do the work, white-label"). Offers a 20-min look. From Carlos, signed Carlos.
- One CTA only — Calendly link.

**Touch 2 — 48-hour follow-up** (sent T+2 days if no response)
- Subject: prefix "Re: " + a 4–7 word value tease. Examples: "Re: 6 agents at $1,245/mo for 12 months"
- Body: 50–80 words. References the prior email implicitly. Adds one new value angle (case study line, peer-agency quote, or a specific deliverable example). Re-offers the demo. Drops the design-partner constraint: "We're picking ONE design partner this month — boot-camp week is July 6–12."

**Touch 3 — Value-anchored close** (sent T+5 days if still no response)
- Subject: under 50 chars. Examples: "Last note — design partner closing Friday"
- Body: 40–70 words. Acknowledges silence without guilt-tripping. States the precise deal in one line ($1,245/mo × 12 months, boot-camp W6, case study rights). Offers a graceful door close: "If now's not the moment, I'll close the loop. If it is — here's the calendar."

## Step 4 — Tier-specific voice adjustments

- **Tier 1:** Carlos personal voice. Reference a specific page on their site. Allowed to be slightly informal. Use first names.
- **Tier 2:** Professional cold. Reference a vertical observation (not a personal one). Keep formal-friendly. Use first names if confirmed; otherwise "Hi there".
- **Tier 3:** Brief value-anchor only. Skip Touch 2. Just Touch 1 (short) and Touch 3 (close).

## Step 5 — Honest reasoning footer

At the bottom of the draft file, write a short "Why this approach" footer:
- Why these specific hooks (cite the source page or quote from their site)
- What I left out and why (avoid claiming things we can't prove)
- Risks (e.g., "their team may be 50+; if so, this pitch lands wrong — verify size before sending Touch 1")
- The exact Calendly link Carlos should use (leave a placeholder `<CALENDLY_LINK>` if not specified — never fabricate one)

## Step 6 — Output to conversation

Paste the 3 drafts directly into the conversation as the response. Carlos reviews, edits, and sends manually via Gmail (or whatever sending tool he uses). **Do not call any Gmail/SMTP tool from this command.**

## Safety rails

- **No fabricated personalization.** Every specific detail must come from the candidate's site, the warm-list, or NWM's own marketing. No invented testimonials, case studies, or peer-agency quotes.
- **No sending.** Output is markdown only.
- **No claiming features that don't exist yet.** The OS isn't built; outreach references the design-partner concept and the boot-camp week, not a working demo. If pressed, "we're showing one design partner in W6; you'd be the first."
- **Respect the durable exclusions** (LinkedIn, X) — never mention these as channels.
- **English by default** for US contacts. For Chilean/Mexican/Spanish contacts, draft Spanish OR ask whether to draft both.
