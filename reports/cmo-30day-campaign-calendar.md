# NetWebMedia — 30-Day Campaign Calendar
**Window:** May 4 – May 31, 2026
**Owner:** CMO (fractional, AI-native)
**Sign-off:** Carlos Martinez (CEO)
**Date issued:** 2026-04-28

---

## North-star objective for the 30 days

Convert the 39 industry landing pages into measurable pipeline by feeding them targeted, niche-specific WhatsApp + email traffic with end-to-end UTM attribution. Three priority niches lead the calendar: **law_firms, health, restaurants**. The other 11 niches are warmed via secondary sequences but do not get prime-time creative this month.

**Targets (May 4 – May 31):**
- 1,200 unique landing-page visits driven by tracked links (track.php)
- 90 booked 15-min audits across the 3 priority niches
- 18 closed retainers ($249–$2,499 tier)
- 30+ ChatGPT/Perplexity citations attributed to refreshed niche pages
- CAC under $800 blended (per marketing-plan §13)

If we land below 60 audits booked by May 18, we cut the secondary niche email blasts and double-down spend on law_firms WhatsApp. Bear-case lever pulled early, not late.

---

## UTM naming convention (canonical — every link must follow this)

Format: `?utm_source={SOURCE}&utm_medium={MEDIUM}&utm_campaign={CAMPAIGN}&utm_content={TOKEN}`

`utm_content` is appended automatically by `track.php` per recipient — do **not** hardcode it. The link you put in a CRM template ends at `utm_campaign=...`; track.php fills in the per-contact token.

### `utm_source` (closed vocabulary — no free text)
| Value | Use for |
|---|---|
| `whatsapp` | All WhatsApp 1:1 and broadcast sequences |
| `email-crm` | crm-vanilla outbound campaigns |
| `email-newsletter` | Weekly NWM newsletter |
| `email-nurture` | Drip / lifecycle sequences |
| `referral` | Partner / introducer links |
| `direct-outbound` | AI SDR cold (non-WhatsApp) |

### `utm_medium`
| Value | Use for |
|---|---|
| `chat` | WhatsApp |
| `email` | All email |
| `referral` | Partner |
| `cold` | AI SDR outbound |

### `utm_campaign` — use this exact pattern: `{yyyymm}-{niche}-{theme}`
Examples for May 2026:
- `202605-lawfirms-aeo-audit`
- `202605-health-citation-gap`
- `202605-restaurants-google-ai`
- `202605-allniche-newsletter-w1`
- `202605-priority3-webinar-may21`

Lowercase only. No spaces, no underscores in the campaign slug — hyphens only. The `yyyymm` prefix is non-negotiable; it makes cohort retros trivial in Looker Studio.

### `utm_content` (token, auto-injected by track.php)
- Always 12-char alphanumeric, generated server-side per send
- Maps 1:1 to `crm_contacts.id` in crm-vanilla
- Never reused across campaigns — token is unique per (contact × campaign)

### Landing-page binding (mandatory)
Every WhatsApp/email link points to the **niche-specific** page in the recipient's language, not the homepage. Examples:
- Law firm in CDMX → `https://netwebmedia.com/law-firms-es?utm_source=whatsapp&utm_medium=chat&utm_campaign=202605-lawfirms-aeo-audit`
- Restaurant in Austin → `https://netwebmedia.com/restaurants?utm_source=email-crm&utm_medium=email&utm_campaign=202605-restaurants-google-ai`
- Health clinic in Santiago → `https://netwebmedia.com/health-es?utm_source=whatsapp&utm_medium=chat&utm_campaign=202605-health-citation-gap`

Homepage links in outbound campaigns are a fail. Push back on any creative that does it.

---

## Week-by-week plan

### Week 1 — May 4 to May 10 — "Citation Gap"
**Theme:** "I asked ChatGPT about your firm/clinic/restaurant. Here's what it said." Loss aversion + specificity. The hook is brutally concrete and ties to a screenshot.

**Niche focus:** Law firms (primary), Health (secondary).
**Volume:** 600 WhatsApp messages (300 law + 300 health), 1,800 emails (900 law + 900 health).

**Channels & assets:**
- WhatsApp 1:1 (manual + automated mix), niche-segmented lists from crm-vanilla
- Email sequence: 3-touch (D0 hook, D2 proof, D5 CTA)
- Landing pages: refreshed `/law-firms` + `/law-firms-es` and `/health` + `/health-es` with citation-gap module above the fold

**Campaigns / UTMs:**
- `202605-lawfirms-aeo-audit` (WhatsApp + email)
- `202605-health-citation-gap` (WhatsApp + email)

**WhatsApp message angle (law_firms, EN):**
> "Hi {first_name} — quick one. I asked ChatGPT 'best {practice_area} attorney in {city}' this morning. Your firm wasn't mentioned. Three competitors were. I made you a 90-second teardown of why — want it? – Carlos, NetWebMedia"

**WhatsApp angle (health, ES):**
> "Hola Dr. {apellido}. Le pregunté a ChatGPT por la mejor clínica de {especialidad} en {ciudad} y su nombre no apareció. Le armé un análisis de 2 minutos sobre por qué. ¿Se lo paso? – Carlos, NetWebMedia"

**Email subject lines (test 50/50):**
- A: "ChatGPT has never heard of {company_name}"
- B: "I asked ChatGPT about {city} {practice_area} — you weren't on the list"
- ES-A: "ChatGPT no conoce a {company_name}"
- ES-B: "Le pregunté a ChatGPT por {especialidad} en {ciudad} — no aparecieron"

**Checkpoint May 10:** Reply rate >= 4% on WhatsApp, >= 1.8% on email. Below that, pause volume and rewrite the hook. Don't keep blasting a dead angle.

---

### Week 2 — May 11 to May 17 — "The $41k Math"
**Theme:** Cost-stack comparison. "You're paying $X across 4 vendors. Here's the same outcome at $249–$999/mo, one invoice." Pillar 2 of the messaging hierarchy.

**Niche focus:** Restaurants (primary — they feel the fragmented-vendor pain hardest), Law firms (continuation — retargeting non-responders from W1 with new angle).

**Volume:** 500 WhatsApp (350 restaurants + 150 law W1 non-responders), 2,000 emails (1,200 restaurants + 800 law).

**Channels & assets:**
- WhatsApp: voice-note option (15-sec Carlos audio in ES + EN)
- Email sequence: 4-touch over 7 days, with embedded calculator
- Landing pages: `/restaurants` and `/restaurants-es` get the cost-stack comparator block (already in CRO backlog as ICE rank #7 — push it for this week)
- Lead magnet: 1-page PDF "The SMB Marketing Stack Math (May 2026)"

**Campaigns / UTMs:**
- `202605-restaurants-stack-math`
- `202605-lawfirms-stack-math-retarget`
- `202605-allniche-newsletter-w2` (Tuesday newsletter, full list)

**WhatsApp angle (restaurants, EN):**
> "{first_name}, ran the numbers on what {restaurant_name} likely spends across web, social, ads, email — adds up to ~$2,400/mo if you're typical. We do all of it for $249. Want the math sheet? – Carlos"

**Email subject lines:**
- A: "{restaurant_name}: the $2,400/mo marketing stack vs $249"
- B: "We rebuilt {restaurant_name}'s marketing stack on a napkin"
- ES-A: "{restaurant_name}: pagar $2.400 al mes o pagar $249"
- ES-B: "Rehice el stack de marketing de {restaurant_name} en una servilleta"

**Checkpoint May 17:** 35+ audit bookings cumulative across W1+W2. If under 22, kill the W3 webinar amplification spend and redirect to AI SDR top-up on law_firms.

---

### Week 3 — May 18 to May 24 — "Live Proof" (webinar week)
**Theme:** "Dominating ChatGPT Search in 60 Days" — live webinar Thursday May 21, 12pm CLT (also recorded for async). Pillar 1 + Pillar 3. Webinar is the conversion event for everyone touched in W1–W2 who didn't book yet.

**Niche focus:** All 3 priority niches (law_firms, health, restaurants) — segmented invites with niche-specific case study slot in the webinar deck.

**Volume:** 800 WhatsApp invites (split evenly across 3 niches), 4,000 emails (newsletter + dedicated invites + reminders).

**Channels & assets:**
- WhatsApp: invite + day-of reminder + post-webinar replay link
- Email: 3-touch invite sequence (D-7 invite, D-1 reminder, D+0 reminder), then D+1 replay, D+3 case-study follow-up
- Webinar landing page: `/webinars/chatgpt-60-days` (build new this week — engineering-lead)
- Niche pages: each priority niche page gets a "Watch the May 21 webinar" sticky CTA strip for the duration of the week

**Campaigns / UTMs:**
- `202605-priority3-webinar-may21` (invite)
- `202605-priority3-webinar-replay` (post-event)
- Per-niche sub-segmentation lives in the CRM tag, NOT in utm_campaign — keeps cohort math clean

**WhatsApp invite angle (any niche, EN):**
> "{first_name} — running a 30-min live session Thurs 12pm CLT on getting cited by ChatGPT in 60 days. Showing one {niche_label} case in detail. Worth your lunch? Link: {tracked_url}"

**Email subject lines:**
- Invite: "30 min, Thurs 12pm: how {niche_example_client} got 847 ChatGPT citations"
- D-1 reminder: "Tomorrow, 12pm CLT — final reminder"
- D+0: "Starting in 1 hour"
- Replay: "The ChatGPT citation playbook (35-min replay inside)"
- ES-Invite: "30 min, jueves 12pm: cómo {niche_example_client} consiguió 847 citas en ChatGPT"

**Checkpoint May 24:** 120+ webinar registrations, 35%+ live attendance, 10%+ of attendees book a 1:1 call within 48 hours. If attendance under 25%, the email subject line was weak — rewrite for the W4 case-study push instead of trying to salvage.

---

### Week 4 — May 25 to May 31 — "Case Study + Close"
**Theme:** Proof + scarcity. Publish the case study referenced in the webinar; push fence-sitters to a May-end close on the $249 Lite tier (no discount — Lite IS the entry tier per brand guardrails). Pillar 1 reinforced with named outcomes.

**Niche focus:** Law firms (primary — highest ACV expected), Health (secondary). Restaurants stays warm with a single newsletter touch only.

**Volume:** 400 WhatsApp (focused on warm hand-raisers from W1–W3, not cold), 2,500 emails.

**Channels & assets:**
- Long-form case study published on blog: `/blog/847-citations-90-days-{niche}` (one for law_firms, one for health)
- WhatsApp: 1:1 personal close from Carlos to top 50 hand-raisers per niche
- Email: 3-touch close sequence (D0 case study, D3 ROI math, D6 "books closing this month" nudge)
- Landing pages: niche pages get a "Featured case study" block linking to the new posts

**Campaigns / UTMs:**
- `202605-lawfirms-case-study-close`
- `202605-health-case-study-close`
- `202605-allniche-newsletter-w4`
- `202605-priority3-may-close` (Carlos personal WhatsApp 1:1s — manually generated tracked links)

**WhatsApp angle (Carlos personal, law_firms):**
> "{first_name} — saw you opened the webinar replay twice. Just published the full case study on how we got {client_name} 847 ChatGPT citations. Same playbook works for {practice_area} firms. Want me to map it to {company_name} on a 15-min call this week? – Carlos"

**Email subject lines:**
- D0: "847 citations, 90 days, one {niche} firm — full breakdown"
- D3: "{company_name}: the citation math, your specific numbers"
- D6: "Closing the May intake Friday — quick decision on {company_name}?"
- ES-D0: "847 citas, 90 días, un despacho de {niche} — caso completo"
- ES-D6: "Cerramos el cupo de mayo el viernes — ¿hablamos de {company_name}?"

**Checkpoint May 31 (month-end retro):**
- Audits booked: target 90, kill threshold 55
- Retainers closed: target 18, kill threshold 10
- Citations gained: target 30, kill threshold 15
- CAC: target <$800, kill threshold >$1,400
- If 2+ kill thresholds tripped, June calendar pivots to bear-case: Lite acquisition pause, full focus on Growth/Scale + CRM-449 per marketing-plan §13.

---

## Operating cadence

| Cadence | Owner | Action |
|---|---|---|
| Daily 09:00 CLT | CMO | Pipeline & Revenue board check, 5 min |
| Mon 10:00 CLT | CMO + Carlos | Weekly walk of all 4 Looker boards; one cut, one double-down |
| Wed 14:00 CLT | CMO + sales-director | WhatsApp + email reply triage; reassign hot leads |
| Fri 16:00 CLT | CMO solo | UTM hygiene audit — any campaign without `yyyymm-niche-theme` slug gets killed and recreated |

---

## Brand guardrails (apply to every asset this month)
- Gulf-Oil palette only: `#010F3B` navy + `#FF671F` orange + `#4A90D9` blue
- Inter (body) + Poppins (display) — no substitutions
- No public discount below list — Lite is $249, full stop
- Bilingual is localized, not translated — Spanish drafts go through the LATAM voice review before send
- No LinkedIn anywhere in distribution (CEO directive)
- No HubSpot references — crm-vanilla is the system of record
- Every "we" claim ties to a published case study; manufactured proof is dishonesty and gets cut

---

## What's explicitly NOT in this 30 days
- Paid media at scale — Meta Pixel ID still gated per marketing-plan §06 pre-flight blocker. Don't spend until the loader is unblocked.
- Programmatic SEO new-page launch — that's a Q2 push, not a May activity.
- The other 11 niches get newsletter touches only. We resist the temptation to spread thin. Three niches done well > fourteen done badly.
