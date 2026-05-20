# Week 4 Meta Paid Launch Kit — Q2 2026

**Owner:** Carlos Martinez (CEO) / CMO
**Launch window:** 2026-05-19 → 2026-05-25 (Wk 4 of 90-day plan)
**Spend tier at launch:** $1,500/mo ≈ $50/day
**Status:** Spec locked, awaiting creative rendering and Ads Manager build
**Brand colors:** Navy `#010F3B` / Orange `#FF671F` only
**Primary plan reference:** `plans/90day-campaign-launch-2026Q2.md` §5
**Pixel:** `NWM_META_PIXEL_ID` (wired site-wide via `js/form-tracking.js` `fbq('track','Lead')` and `js/app-cta.js` `fbq('track','ViewContent')`)
**Standing exclusions:** No LinkedIn, no X — neither targeted nor referenced in copy

---

## 1. Campaign Architecture

### Hierarchy

```
Campaign:  NWM_Q2-LAUNCH_W4_LEADS
  Objective:           Lead generation (NOT Engagement, NOT Awareness, NOT Reach)
  Buying type:         Auction
  Optimization:        Conversions
  Conversion location: Website
  Bid strategy:        Highest volume (no cost cap at launch — set after $1k spend baseline)
  Special ad category: None (B2B services — no Housing/Employment/Credit/Social-Issue flag)
  CBO:                 OFF (manual ABO — we want spend control across the 3 audiences)
  Attribution:         7-day click + 1-day view (matches plan §5 measurement window)
  Status at launch:    Active 2026-05-19 00:01 America/Santiago
```

### Conversion events (Pixel)

| Event | Trigger | Where it fires | Optimization weight |
|---|---|---|---|
| `Lead` (standard) | Newsletter capture submit, audit-intent contact form submit | `js/form-tracking.js` already fires `fbq('track','Lead')` on every successful form post | Primary optimization event for Audience A and B |
| `Purchase` (standard, custom event name `audit_purchase`) | Stripe/MP `payment.completed` webhook for product=`aeo_audit_997` | `api-php/routes/billing.php` server-side via Conversions API (CAPI) | Primary optimization for Audience C (retargeting) |
| `Subscribe` (custom event `newsletter_subscribe`) | `/blog.html` and `/aeo-index.html` newsletter forms | `js/form-tracking.js` extension — add custom event name alongside `Lead` | Secondary signal across all three ad sets |
| `ViewContent` (passive) | `/aeo-index.html`, `/pricing.html`, audit blog cluster | Already wired via `js/app-cta.js` pattern | Retargeting audience seed |

**Action item before launch:** extend `js/form-tracking.js` to also fire `fbq('trackCustom','newsletter_subscribe', {source: 'meta_q2'})` on newsletter forms. Engineering ticket — 15-min change. Without this we cannot optimize specifically for newsletter subs vs. all Leads.

**CAPI requirement:** the `audit_purchase` event MUST be sent server-side from `billing.php` because Stripe/MP webhook fires after payment, not in-browser. iOS 14.5+ and CSP block in-browser Pixel reliability for purchase tracking; CAPI dedupe via `event_id` (the Stripe payment intent ID) is mandatory for this to attribute.

### Ad-set structure (3 ad sets, 1 campaign)

| Ad set | Audience | Budget | Placements | Optimization event | Geo | Languages |
|---|---|---|---|---|---|---|
| `AS_A_Cold-Stack` | Cold interest stack | $20/day | Advantage+ Placements (let Meta optimize Reels/Feed/Stories) | `Lead` | US + Mexico, Argentina, Chile, Colombia, Spain | English + Spanish |
| `AS_B_ICP-Mirror` | ICP-mirroring stack (LAL substitute until newsletter ≥ 500 subs) | $20/day | Advantage+ Placements | `Lead` | Same as A | English + Spanish |
| `AS_C_Retargeting` | Site visitors 30d ex-customers | $10/day | Feed + Reels only (retargeting waste reduction; no Audience Network) | `Purchase` (audit_purchase) | Same as A | Auto by visitor cookie |

Total: **$50/day = $1,500/mo**. Meta's daily budget can flex ±25%, expect $46–$54/day actuals.

---

## 2. Three Audience Strategies

### Audience A — Cold Interest Stack ($20/day)

**Hypothesis:** SMB owners and marketing-curious operators who self-identify with AI tooling and small-business marketing are our cheapest cold-traffic acquisition.

**Layered interests (Meta requires OR-stack — pick the highest-quality terms only; do NOT use Detailed Targeting Expansion, it bleeds into garbage at this budget):**

- Small business marketing
- Digital marketing
- Search engine optimization
- Marketing automation
- ChatGPT
- Anthropic / Claude (AI)
- Artificial intelligence
- Small business owners (demographic interest)
- Entrepreneurs (Pages-liked layer)
- Inbound marketing
- HubSpot (interest only — competitive intent signal)
- Google Ads (interest)

**Demographics layer (AND):**
- Age 28–55
- Gender: All
- Geo: United States, Mexico, Argentina, Chile, Colombia, Spain
- Language: English OR Spanish
- Job titles (where exposed): Founder, Owner, CEO, CMO, Marketing Director, Marketing Manager, Agency Owner

**Exclusions:**
- Existing customers (custom audience: CRM upload of paying customers)
- Newsletter subscribers (custom audience: CRM upload, refresh weekly)
- Past 30-day site visitors (handled by Audience C)
- Employees of agency holding companies (WPP, Publicis, Omnicom — irrelevant ICP)

### Audience B — ICP-Mirror Stack ($20/day) — Lookalike substitute until list ≥ 500

**Hypothesis:** While the newsletter list is below 500 subs (per `90day-campaign-launch-2026Q2.md` §5), a hand-built ICP-mirror stack approximates a 1% LAL well enough to test creative and gather data for the real LAL once unlocked.

**Promotion criteria:** When newsletter list crosses 500 subs (target: end of Wk 6, Jun 1–8), pause this stack and replace with `Lookalike (US, 1%) — seed: newsletter_subscribers_30d`. Keep B's creatives identical for clean A/B carry-over.

**ICP-mirror layers (more behavioral, less interest):**

- Job title: Agency Owner, Fractional CMO, Marketing Consultant, Founder/CEO of services business 10–50 employees
- Behavioral: Small business owners (Meta behavioral category)
- Behavioral: Engaged Shoppers (proxy for active service buyers)
- Industry interests: Professional services, Legal services, Real estate, Financial services, Healthcare, Hospitality (mirrors our top-4 niche priority from the 90-day plan)
- Page interests: Stripe, Shopify, Notion, Asana, Webflow (proxy for "modern operator" stack)
- Behavioral: Technology early adopters
- Education: Bachelor's degree minimum

**Demographics:**
- Age 32–58 (slightly older than A — owner-operators skew up)
- Geo: Same as A
- Language: English OR Spanish

**Exclusions:** Same as A.

### Audience C — Retargeting ($10/day)

**Source audiences (Meta Custom Audiences — set up before launch):**

1. **Site visitors past 30 days** — Pixel base audience, includes any pageview
2. **Pricing-page viewers past 14 days** — high-intent (URL contains `/pricing.html`)
3. **AEO Index tool users past 14 days** — high-intent (URL contains `/aeo-index.html`)
4. **Blog readers past 30 days** — mid-funnel (URL contains `/blog/`)

**Combined audience:** Union of 1+2+3+4, **EXCLUDE**:
- Existing paying customers (CRM upload, refreshed weekly)
- Past 90-day audit purchasers (`Purchase` event = `audit_purchase`)
- Newsletter subscribers who already converted to audit (CRM segment)
- Form submitters past 7 days (give them email-sequence breathing room)

**Frequency cap:** 3 impressions per user per 7 days at the ad-set level. Above this, brand fatigue tax exceeds the conversion lift. (Hard kill criterion below.)

---

## 3. Nine Creatives — 3 per Audience

All copy bilingual (`EN` then `ES`). Visuals use ONLY navy `#010F3B` + orange `#FF671F`. Inter for body, Poppins for headlines (per `BRAND.md`). No stock photos — only assets we own or render.

### Creative IDs (use as `utm_content` value)

Format: `q2w4-{audience}-{n}` → `q2w4-a-1`, `q2w4-a-2`, etc.

---

### AUDIENCE A — Cold Stack (3 creatives)

#### Creative `q2w4-a-1` — "AI is citing your competitor right now"

- **Format:** 9:16 Reel, 18 seconds, animated typography over navy gradient
- **Visual treatment:** Animated text-only (no face, no UGC). Navy `#010F3B` background; orange `#FF671F` headline accents. Cursor-typing animation showing a real ChatGPT response naming a competitor for "best [niche] in [city]" — competitor name blurred for legal safety. Closes on the AEO Index logo lockup.
- **Hook (first 3s, EN):** "ChatGPT just recommended your competitor. Not you."
- **Hook (ES):** "ChatGPT acaba de recomendar a tu competencia. A ti no."
- **Body line 2:** "AI cites the businesses it can read. We score yours in 60 seconds."
- **Body line 2 (ES):** "La IA cita los negocios que puede leer. Calificamos el tuyo en 60 segundos."
- **CTA button:** "Get Score" / "Ver Puntaje"
- **CTA copy in ad:** "Score your AEO Citation Index in 60 seconds"
- **Destination:** `/aeo-index.html?utm_source=meta&utm_campaign=q2-launch-w4&utm_content=q2w4-a-1`

#### Creative `q2w4-a-2` — "Static carousel — AEO vs SEO in 5 cards"

- **Format:** 1:1 carousel, 5 slides at 1080×1080
- **Visual treatment:** Static carousel. Repurpose `assets/social/carousels/a-slide-{1..5}.svg` (already brand-locked to navy/orange). No new render needed. Slide 5 swapped to a CTA card.
- **Hook (Slide 1, EN):** "SEO is for Google. AEO is for ChatGPT, Claude, and Perplexity. Here's how they differ."
- **Hook (ES):** "El SEO es para Google. El AEO es para ChatGPT, Claude y Perplexity. Así se diferencian."
- **Body slides 2–4:** Same content as the existing brand-intro carousel (already approved).
- **Slide 5 CTA:** "Score your AEO Citation Index in 60 seconds — free"
- **Slide 5 CTA (ES):** "Calcula tu Índice AEO en 60 segundos — gratis"
- **CTA button:** "Learn More" / "Más Info"
- **Destination:** `/aeo-index.html?utm_source=meta&utm_campaign=q2-launch-w4&utm_content=q2w4-a-2`

#### Creative `q2w4-a-3` — "$997 audit, fully credited"

- **Format:** 1:1 single image, 1080×1080
- **Visual treatment:** Static. Navy background. Orange callout box: `$997 → $0`. Subhead: "100% credited toward your first month of CMO Growth retainer." Small AEO Index logomark bottom-right. NO stock photos, NO faces.
- **Hook (EN):** "Your AEO Audit is $997. Sign the retainer in 60 days — it's free."
- **Hook (ES):** "Tu Auditoría AEO cuesta $997. Firma el retainer en 60 días — es gratis."
- **Body:** "We audit how AI engines see your business and hand you the fix list. Apply the audit fee to month one of CMO Growth ($999/mo). Net cost: $2 if you stay."
- **Body (ES):** "Auditamos cómo te ven los motores de IA y te entregamos la lista de correcciones. El pago de la auditoría se aplica al primer mes del retainer CMO Growth ($999/mes). Costo neto: $2 si firmas."
- **CTA button:** "Get Quote" / "Cotizar"
- **CTA copy in ad:** "Get your $997 AEO Audit (100% credited)"
- **Destination:** `/contact.html?topic=audit&intent=audit&utm_source=meta&utm_campaign=q2-launch-w4&utm_content=q2w4-a-3`

---

### AUDIENCE B — ICP-Mirror Stack (3 creatives)

#### Creative `q2w4-b-1` — "Talking-head Reel: Carlos in 20s"

- **Format:** 9:16 Reel, 20 seconds, talking-head
- **Visual treatment:** Carlos to-camera, navy backdrop or office wall in brand-aligned tones. Burned-in subtitles (orange highlight color for keywords). One cut at 8s for pace. Brand bug bottom-left throughout.
- **Hook (first 3s, EN):** "Most agencies are still selling SEO. Your buyers are on ChatGPT."
- **Hook (ES):** "La mayoría de agencias siguen vendiendo SEO. Tus compradores ya están en ChatGPT."
- **Body:** "I'm Carlos at NetWebMedia. We score how often ChatGPT, Claude, and Perplexity cite your business — then we fix it. Sixty seconds, no card needed."
- **Body (ES):** "Soy Carlos de NetWebMedia. Medimos cuánto te citan ChatGPT, Claude y Perplexity — y luego lo arreglamos. Sesenta segundos, sin tarjeta."
- **CTA button:** "Get Score" / "Ver Puntaje"
- **CTA copy in ad:** "Score your AEO Citation Index in 60 seconds"
- **Destination:** `/aeo-index.html?utm_source=meta&utm_campaign=q2-launch-w4&utm_content=q2w4-b-1`

#### Creative `q2w4-b-2` — "Anonymized client win — carousel"

- **Format:** 1:1 carousel, 5 slides
- **Visual treatment:** Static carousel pulled from one of the 3 homepage client-win cards (anonymized industry + result). Reuse the existing card art; expand to 5 slides for the carousel format. Navy/orange only.
- **Slide 1 hook (EN):** "Mid-size law firm. 0 ChatGPT citations in March. 14 in April. Here's the playbook."
- **Slide 1 hook (ES):** "Despacho jurídico mediano. 0 citas en ChatGPT en marzo. 14 en abril. Este es el playbook."
- **Slides 2–4:** Problem → audit → fix → result
- **Slide 5 CTA (EN):** "Get your $997 AEO Audit (100% credited)"
- **Slide 5 CTA (ES):** "Solicita tu Auditoría AEO ($997, 100% acreditable)"
- **CTA button:** "Get Quote" / "Cotizar"
- **Destination:** `/contact.html?topic=audit&intent=audit&utm_source=meta&utm_campaign=q2-launch-w4&utm_content=q2w4-b-2`

#### Creative `q2w4-b-3` — "Animation — 3 questions to ask your marketing"

- **Format:** 9:16 animated Reel, 22 seconds
- **Visual treatment:** Animation. Three question cards flip in sequence over navy background, orange accent on the question marks. No talking head, no stock B-roll. Closes on AEO Index logo + URL bar.
- **Hook (first 3s, EN):** "Three questions every CEO should ask their marketing — today."
- **Hook (ES):** "Tres preguntas que todo CEO debería hacerle a su marketing — hoy."
- **Body slide 1:** "Does ChatGPT cite us when buyers ask?"
- **Body slide 1 (ES):** "¿ChatGPT nos cita cuando preguntan los compradores?"
- **Body slide 2:** "Are we structured for Claude and Perplexity to read us?"
- **Body slide 2 (ES):** "¿Estamos estructurados para que Claude y Perplexity nos lean?"
- **Body slide 3:** "If the answer is no — what's the cost per month we lose?"
- **Body slide 3 (ES):** "Si la respuesta es no — ¿cuánto perdemos cada mes?"
- **CTA button:** "Get Score" / "Ver Puntaje"
- **CTA copy in ad:** "Score your AEO Citation Index in 60 seconds"
- **Destination:** `/aeo-index.html?utm_source=meta&utm_campaign=q2-launch-w4&utm_content=q2w4-b-3`

---

### AUDIENCE C — Retargeting (3 creatives)

#### Creative `q2w4-c-1` — "You read 3 of our posts — finish the loop"

- **Format:** 1:1 static, 1080×1080
- **Visual treatment:** Static. Navy. A simple "1 → 2 → 3 → AEO Score" progression bar in orange. References the 24-post AEO blog cluster without naming specific posts (so it works for any visitor).
- **Hook (EN):** "You read our AEO posts. Now see your own score."
- **Hook (ES):** "Ya leíste nuestros artículos AEO. Ahora mira tu propio puntaje."
- **Body:** "Sixty seconds. No card. Get the same AEO Citation Index we use with paying clients."
- **Body (ES):** "Sesenta segundos. Sin tarjeta. Obtén el mismo Índice de Citación AEO que usamos con clientes."
- **CTA button:** "Get Score" / "Ver Puntaje"
- **CTA copy in ad:** "Score your AEO Citation Index in 60 seconds"
- **Destination:** `/aeo-index.html?utm_source=meta&utm_campaign=q2-launch-w4&utm_content=q2w4-c-1`

#### Creative `q2w4-c-2` — "$997 → $0 — direct response"

- **Format:** 9:16 Reel, 12 seconds (shorter — high-intent retargeting)
- **Visual treatment:** UGC-style screen-record: scrolling `/pricing.html` with the FAQ accordion expanding "What if I sign the retainer?" — answer reveals the 100% credit. Navy/orange overlay text reinforces.
- **Hook (first 3s, EN):** "You looked at our pricing. Here's what we didn't make obvious enough."
- **Hook (ES):** "Viste nuestros precios. Esto es lo que no dejamos suficientemente claro."
- **Body:** "The $997 audit fee is 100% credited toward month one of CMO Growth. Sign within 60 days — net cost: $2."
- **Body (ES):** "Los $997 de la auditoría se acreditan al 100% en el primer mes del retainer. Firma en 60 días — costo neto: $2."
- **CTA button:** "Get Quote" / "Cotizar"
- **CTA copy in ad:** "Get your $997 AEO Audit (100% credited)"
- **Destination:** `/contact.html?topic=audit&intent=audit&utm_source=meta&utm_campaign=q2-launch-w4&utm_content=q2w4-c-2`

#### Creative `q2w4-c-3` — "Social proof — 3 client wins"

- **Format:** 1:1 carousel, 4 slides (1 intro + 3 client cards)
- **Visual treatment:** Static carousel. Slide 1 intro card; slides 2–4 are the 3 anonymized homepage client-win cards (already designed). Navy/orange only. End-card identical to slide 1 with CTA.
- **Slide 1 hook (EN):** "Three real wins. Three different industries. One playbook."
- **Slide 1 hook (ES):** "Tres victorias reales. Tres industrias distintas. Un solo playbook."
- **Slide 4 CTA (EN):** "Get your $997 AEO Audit (100% credited)"
- **Slide 4 CTA (ES):** "Solicita tu Auditoría AEO ($997, 100% acreditable)"
- **CTA button:** "Get Quote" / "Cotizar"
- **Destination:** `/contact.html?topic=audit&intent=audit&utm_source=meta&utm_campaign=q2-launch-w4&utm_content=q2w4-c-3`

---

## 4. Landing Page Mapping (Verified Live)

Both destination pages confirmed present in repo:
- `C:\Users\Usuario\Desktop\NetWebMedia\aeo-index.html` (31KB, last touch 2026-04-30)
- `C:\Users\Usuario\Desktop\NetWebMedia\contact.html` (39KB, last touch 2026-05-01)

| Creative ID | Audience | Destination | Full URL with UTMs |
|---|---|---|---|
| `q2w4-a-1` | Cold | `/aeo-index.html` | `https://netwebmedia.com/aeo-index.html?utm_source=meta&utm_campaign=q2-launch-w4&utm_content=q2w4-a-1` |
| `q2w4-a-2` | Cold | `/aeo-index.html` | `https://netwebmedia.com/aeo-index.html?utm_source=meta&utm_campaign=q2-launch-w4&utm_content=q2w4-a-2` |
| `q2w4-a-3` | Cold | `/contact.html` | `https://netwebmedia.com/contact.html?topic=audit&intent=audit&utm_source=meta&utm_campaign=q2-launch-w4&utm_content=q2w4-a-3` |
| `q2w4-b-1` | ICP-mirror | `/aeo-index.html` | `https://netwebmedia.com/aeo-index.html?utm_source=meta&utm_campaign=q2-launch-w4&utm_content=q2w4-b-1` |
| `q2w4-b-2` | ICP-mirror | `/contact.html` | `https://netwebmedia.com/contact.html?topic=audit&intent=audit&utm_source=meta&utm_campaign=q2-launch-w4&utm_content=q2w4-b-2` |
| `q2w4-b-3` | ICP-mirror | `/aeo-index.html` | `https://netwebmedia.com/aeo-index.html?utm_source=meta&utm_campaign=q2-launch-w4&utm_content=q2w4-b-3` |
| `q2w4-c-1` | Retargeting | `/aeo-index.html` | `https://netwebmedia.com/aeo-index.html?utm_source=meta&utm_campaign=q2-launch-w4&utm_content=q2w4-c-1` |
| `q2w4-c-2` | Retargeting | `/contact.html` | `https://netwebmedia.com/contact.html?topic=audit&intent=audit&utm_source=meta&utm_campaign=q2-launch-w4&utm_content=q2w4-c-2` |
| `q2w4-c-3` | Retargeting | `/contact.html` | `https://netwebmedia.com/contact.html?topic=audit&intent=audit&utm_source=meta&utm_campaign=q2-launch-w4&utm_content=q2w4-c-3` |

**Routing balance:** 5 creatives → `/aeo-index.html` (top-of-funnel score), 4 creatives → `/contact.html?topic=audit` (mid-funnel direct response). Roughly 56/44 split, weighted toward score-tool to seed retargeting and newsletter list.

**Note on URL conventions** — both `aeo-index.html` and `contact.html` keep the `.html` extension because they're top-level files. The 90-day plan and existing internal linking already use these forms; no change to canonical routing rules.

---

## 5. Budget Tier Ladder

Decision points at end of Wk 5 (Jun 1) and Wk 7 (Jun 15) — these are the mid-cycle paid-review checkpoints in the 90-day plan.

### Step UP from $1.5k → $3k/mo

**ALL of the following must be GREEN, sustained ≥ 7 days:**

| Metric | Threshold | Calc |
|---|---|---|
| **CPM** | ≤ $18 average across all 3 ad sets | Meta-reported, 7d |
| **CTR (link)** | ≥ 1.2% average | Meta-reported, 7d |
| **CPC** | ≤ $1.80 average | Meta-reported, 7d |
| **CPL** (newsletter or audit-form lead) | ≤ $35 average | Meta `Lead` event / spend |
| **Audit conversion rate** | ≥ 1 paid audit per $500 ad spend | Stripe/MP `audit_purchase` events / Meta spend |
| **CAC trajectory** | On-pace to ≤ $750 (per plan §5) | Sheet calc weekly |

**Execution if step-up triggered:** Add 4th audience (interest stack focused on top niche showing best CPL — likely `law_firms` or `health` per the 90-day plan priority). Lift each existing ad set by ~50% over 3 days (Meta's learning phase tolerates ~20%/day; faster nukes the algorithm).

### Step DOWN from $1.5k → $750/mo (or pause entirely)

**ANY of the following YELLOW for 5+ days OR RED for 3+ days:**

| Metric | Yellow | Red |
|---|---|---|
| **CPM** | $20–$25 sustained | > $25 sustained 3 days (also a kill criterion — see §7) |
| **CTR (link)** | 0.6–0.9% | < 0.6% after 5,000 impressions |
| **CPL** | $60–$100 | > $100 |
| **Audit conversion rate** | 1 audit per $750–$1,200 spend | 0 audits in $1,500 spend |
| **CAC** | $1,000–$1,400 | > $1,400 |

**Execution if step-down triggered:** Pause Audience A first (the cold stack is the most exposed), keep B and C running at half budget while diagnosing. Reallocate the freed $750 to organic content velocity (extra YT Short, extra Tue Brief send, IG paid boost on a single highest-performing organic post — NOT a new campaign).

### Hard ceiling at $1.5k tier

- No single ad set exceeds $30/day until Wk 6.
- No single creative exceeds $15/day spend before having ≥ 50 events. If a creative is spending more without conversions, kill it (§7).
- Total monthly Meta spend hard-capped at $1,650 (10% buffer over $1,500 to absorb auction volatility) regardless of performance — anything beyond requires Carlos sign-off.

---

## 6. Daily / Weekly Review Cadence

### Carlos's 9am daily review (5 metrics max — under 4 minutes)

Source: Meta Ads Manager "Q2-LAUNCH-W4" custom dashboard column preset.

| # | Metric | Looking for | Red flag |
|---|---|---|---|
| 1 | **Spend yesterday** | $46–$54 | > $54 (Meta over-delivery) or < $40 (delivery throttled) |
| 2 | **CPM (campaign avg, 24h)** | < $20 | > $25 = pause path |
| 3 | **CTR link (campaign avg, 24h)** | > 1.0% | < 0.6% after 5k imp = creative kill |
| 4 | **Leads (Meta `Lead` event, 24h)** | ≥ 1 | 0 leads with $50 spent = day-2 review |
| 5 | **Audit purchases (CAPI `audit_purchase`, 24h)** | Track only — too low-volume for daily decisions | 0 in 7 days at $350 spend = retainer-funnel issue, not creative |

If everything green: no action, log spend, move on.
If any yellow: note in Slack `#paid` thread, no action until 3-day window confirms.
If any red: pause the offending ad/ad-set immediately, reroute budget per §7.

### Sunday 5pm deep review (CMO + Carlos, 30 min)

Plugs into the existing Sunday KPI dashboard (`90day-campaign-launch-2026Q2.md` §6). Add a Meta-paid block:

| Section | Inputs | Output |
|---|---|---|
| **7-day spend & efficiency** | Spend, CPM, CTR, CPC, CPL by ad set | Green/yellow/red call per ad set |
| **Creative leaderboard** | All 9 creatives ranked by CPL ascending | Top 3 keep, bottom 2 evaluate for kill, middle 4 hold |
| **Audience leaderboard** | A vs B vs C by CPL and audit-conversion rate | Reallocation plan for next 7 days (max ±30% per ad set) |
| **Funnel handoff** | LP CVR (`/aeo-index.html` and `/contact.html` form-submit rate from Meta sessions, GA4) | LP friction issues flagged to engineering |
| **Pipeline tie** | Audits sold this week, retainer signed this week from Meta-attributed leads (CRM tag `source=meta_q2`) | Goes into the main dashboard's CAC/LTV row |
| **Step decision** | Tier up / hold / tier down / pause | One sentence, written in plan |

The Meta-paid block lives as a tab in the same Sunday dashboard sheet — not a separate review meeting.

---

## 7. Kill Criteria (Auto-Pause Rules)

These are NOT suggestions. They are auto-pauses. If Carlos sees any of these on the 9am check, the ad/creative gets paused before the call ends.

| Code | Trigger | Action | Recovery condition |
|---|---|---|---|
| **K1 — High CPM** | CPM > $25 sustained ≥ 3 consecutive days at the ad-set level | Pause the ad set immediately | Re-enable only after creative refresh AND audience tweak; new CPM must come in ≤ $18 in first 48h |
| **K2 — Low CTR** | CTR (link) < 0.6% after ≥ 5,000 impressions on a single creative | Pause that creative; siblings continue | Replace with new creative variant; do not re-enable the killed one |
| **K3 — Zero conversions on burn** | Zero `Lead` AND zero `audit_purchase` events after $200 spend on a single creative | Pause that creative | Same as K2 — replace, don't revive |
| **K4 — Frequency saturation** | Frequency > 3.0 with no week-over-week scaling in conversions | Pause the ad set; refresh creative pool | Re-enable with ≥ 2 net-new creatives |
| **K5 — Account-level safety** | Account CPM > $30 OR campaign CPL > $150 for any 3-day rolling window | Pause entire campaign; CMO root-cause | Carlos sign-off required to relaunch |

**The most aggressive of these is K3 — $200 spend with zero conversions kills a creative.** At $50/day total split nine ways (~$5.50/day per creative on average), that's roughly 36 days of spend on one creative — but in practice Meta concentrates spend on top performers, so weak creatives hit $200 in 7–10 days. K3 fires first in most cases.

---

## 8. Compliance + Brand

### Meta policy gotchas — claims we cannot make

Meta Ads policies that bite small B2B advertisers (April 2026 enforcement state):

| Risk area | What we will NOT say | What we WILL say instead |
|---|---|---|
| **Outcome guarantees** | "Guarantee you'll be cited by ChatGPT", "Promise 10× leads", "Guaranteed retainer ROI" | "We score how often AI cites you", "We hand you the fix list", "$997 credited toward retainer" — process, not outcome |
| **AI capability claims** | "Our AI does it for you", "Fully autonomous AI marketing" | "AI-native methodology", "We use Claude and GPT to scale our work" — describes our process, not a magic-box result |
| **Personal attributes** | Anything implying targeting based on health, financial status, religion, ethnicity, or political views | Our targeting is industry/role/behavior — none of these flag in Special Ad Categories, but copy must not imply we're calling out a personal attribute |
| **Before/after** | "From 0 to 14 ChatGPT citations" — Meta has been hostile to before/after framing in cosmetics; tolerates it in B2B but borderline | We use it ONLY for `q2w4-b-2` and only when anonymized; if rejected, fall back to a process-only frame |
| **Engagement bait** | "Tag 3 friends", "Share if you agree" | Direct CTAs only — "Get Score", "Get Quote" |
| **Misleading social proof** | Specific named clients we don't have written consent to name | All testimonials anonymized to industry + city scale |

### Disclaimer footer (required on `q2w4-b-2`, `q2w4-c-3`, and any future client-result creative)

Add to the ad's primary text below the body copy, smallest legal font in the visual:

**EN:** *"Results shown are anonymized client outcomes from Q1–Q2 2026. Individual results vary. NetWebMedia does not guarantee specific citation counts, traffic, or revenue outcomes."*

**ES:** *"Los resultados mostrados son datos anonimizados de clientes Q1–Q2 2026. Los resultados individuales varían. NetWebMedia no garantiza un número específico de citaciones, tráfico ni ingresos."*

### Brand bar — the standing rule

- Navy `#010F3B` and orange `#FF671F` — that's it. No third color, no trendy gradients.
- Inter (body) and Poppins (headlines) — no other typeface in any creative.
- No stock photos of generic "diverse business team in conference room" — we never ship that. Animation, text-only, or our own assets only.
- The `assets/social/carousels/{a,b,c}-slide-{1..5}.svg` set is brand-approved and reusable. Anything new requires the same brand bar.
- If a creative does not pass brand-book sniff at thumbnail size on a phone, kill it before it spends a dollar. Brand debt compounds faster than tech debt — that rule applies to ad creative the same as it does to landing pages.

---

## 9. Pre-Launch Checklist (must be DONE by 2026-05-18 EOD)

- [ ] `js/form-tracking.js` extended to fire `fbq('trackCustom','newsletter_subscribe')` alongside `Lead`
- [ ] Conversions API (CAPI) wired in `api-php/routes/billing.php` for `audit_purchase` event with Stripe payment intent ID as `event_id` for dedupe
- [ ] Custom audiences created in Meta Ads Manager: site visitors 30d, pricing 14d, AEO Index 14d, blog 30d, existing customers (CRM CSV upload), newsletter subs (CRM CSV upload)
- [ ] All 9 creatives rendered, brand-checked at phone-thumbnail size, exported in correct ratios (9:16 + 1:1)
- [ ] All 9 destination URLs tested live (200 status, UTMs reaching GA4 and CRM, Pixel firing)
- [ ] Disclaimer footers added to `q2w4-b-2`, `q2w4-c-3` in both languages
- [ ] Daily 9am Meta dashboard column preset saved in Ads Manager
- [ ] Sunday review sheet has Meta-paid tab inserted with the rows from §6
- [ ] Slack `#paid` channel pinned with kill criteria (§7) so the team can self-pause without waiting on Carlos
- [ ] Calendar entry created on `carlos@netwebmedia.com` (America/Santiago): "NWM - Paid - Meta Q2 launch goes live" Mon 2026-05-19 09:00, "NWM - Paid - Wk1 paid review" Sun 2026-05-25 17:00

---

## 10. Why this spec doesn't waste money

Three guards against the typical $1.5k-tier failure mode:

1. **No optimization for vanity events.** We do NOT optimize for ThruPlay, video views, post engagement, or reach. Every dollar is bid against `Lead` or `Purchase`. Meta will deliver fewer impressions but higher-quality ones.
2. **No Audience Network on retargeting.** Audience Network placements consistently deliver bot-scale impressions that tank retargeting CPL. Feed + Reels only on Audience C.
3. **Kill criteria are pre-committed.** Carlos doesn't have to argue with the algorithm or the team. K1–K5 fire automatically. The biggest paid-budget leak is sentimentality about underperforming creative — this spec removes the human emotion from that loop.

If the kit performs as forecast, we're at ~25 newsletter subs + 1–2 audits + 0–1 retainer in Wk 4 alone — which would put us roughly on track for the Day-30 deliverables in the main plan. If it under-delivers, we step down and reinvest in organic. Either way, no money is lost; we learn the audience response curve before scaling.
