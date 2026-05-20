# 9-Reel MVP Expansion — Higgsfield Kling 3.0

**Status:** ✅ ALL 22 GENERATIONS COMPLETE — clips downloaded to `assets/social/campaign/v2/` (73 MB total).
**Higgsfield balance:** 2,299.38 → 2,132.88 credits. **Actual spend: 166.5 credits** (Ultra plan discounting brought it well below the 290 estimate).
**Confirmed unit cost:** 15 credits/clip preflight; effective average ~7.5 credits/clip on Ultra plan.
**Render time:** All 19 Kling clips completed in ~4 minutes (parallel render).
**Total batch cost:** 166.5 credits for 22 assets (3 portraits + 19 video clips).

## Generation manifest — 2026-05-12

### Character portraits (Nano Banana 2 — completed)

| Char | Role | Job ID | Status |
|---|---|---|---|
| A | Skeptic Founder | `fa4634bb-e146-46f3-b6c3-0d6509f8a074` | completed |
| B | Operator | `a0be5e3f-04df-46bd-be54-0ac56daabf4a` | completed |
| C | Executive Closer | `3336b8d8-a1a8-4669-9e6a-1e2b95d006ee` | completed |

### Character reference portraits (Nano Banana 2 — ✅ completed)

| Char | File | Job ID |
|---|---|---|
| A | `assets/social/campaign/v2/character-refs/character-A-skeptic-founder.png` | `fa4634bb-…0d6509f8a074` |
| B | `assets/social/campaign/v2/character-refs/character-B-operator.png` | `a0be5e3f-…0ac56daabf4a` |
| C | `assets/social/campaign/v2/character-refs/character-C-executive-closer.png` | `3336b8d8-…1e2b95d006ee` |

### Character speaking-shot clips (Kling 3.0 image-to-video — ✅ completed)

| Reel | Char | Dur | Local file |
|---|---|---|---|
| 1A — Hook | A | 10s | `assets/social/campaign/v2/reel_01_aeo_hero_skeptic-founder.mp4` |
| 2A — Demo | A | 5s | `assets/social/campaign/v2/reel_02_aeo_hero_phone-reaction.mp4` |
| 3A — Proof | A | 5s | `assets/social/campaign/v2/reel_03_aeo_hero_audit-reports.mp4` |
| 4B — Hook | B | 7s | `assets/social/campaign/v2/reel_04_growth_hero_operator-laptop.mp4` |
| 5B — Demo | B | 5s | `assets/social/campaign/v2/reel_05_growth_hero_whiteboard-list.mp4` |
| 6B — Proof | B | 5s | `assets/social/campaign/v2/reel_06_growth_hero_whiteboard-arrow.mp4` |
| 7C — Hook | C | 10s | `assets/social/campaign/v2/reel_07_scale_hero_executive-window.mp4` |
| 8C — Demo | C | 5s | `assets/social/campaign/v2/reel_08_scale_hero_conference-table.mp4` |
| 9C — Proof | C | 5s | `assets/social/campaign/v2/reel_09_scale_hero_phone-call-window.mp4` |

### B-roll clips (Kling 3.0 text-to-video — ✅ completed)

| Reel | Beat | Description | Local file |
|---|---|---|---|
| 1A | 2 | iPhone showing ChatGPT result | `assets/social/campaign/v2/reel_01_aeo_broll_chatgpt-phone.mp4` |
| 2A | 3 | Schema markup + FAQ animating | `assets/social/campaign/v2/reel_02_aeo_broll_schema-markup.mp4` |
| 3A | 3 | Citation lift line chart | `assets/social/campaign/v2/reel_03_aeo_broll_citation-chart.mp4` |
| 4B | 3 | 7 tabs closing → CRM | `assets/social/campaign/v2/reel_04_growth_broll_tabs-closing.mp4` |
| 5B | 2 | CRM calendar populating | `assets/social/campaign/v2/reel_05_growth_broll_calendar-fill.mp4` |
| 6B | 3 | iPhone email "ready to scale" | `assets/social/campaign/v2/reel_06_growth_broll_email-scale.mp4` |
| 7C | 2 | Chaotic spreadsheets montage | `assets/social/campaign/v2/reel_07_scale_broll_chaos-montage.mp4` |
| 8C | 2 | Executive KPI dashboard | `assets/social/campaign/v2/reel_08_scale_broll_kpi-dashboard.mp4` |
| 8C | 3 | AI workflow nodes | `assets/social/campaign/v2/reel_08_scale_broll_workflow-nodes.mp4` |
| 9C | 2 | Logos + revenue chart | `assets/social/campaign/v2/reel_09_scale_broll_logos-revenue.mp4` |

**Total delivered:** 22 assets (3 portraits + 19 video clips), 73 MB on disk.

## Next steps (post-production — NOT done yet)

1. **QA review** — open each clip and flag any that need a regenerate (Kling sometimes hallucinates faces in `start_image` mode; check Character A/B/C consistency across their 3 reels).
2. **Editor handoff** — open `assets/social/campaign/v2/` in DaVinci Resolve / CapCut / Premiere.
3. **Per-reel assembly** (for each of the 9 reels):
   - Hero clip (character) + b-roll clip cut to script timing → 12–15s total
   - Burn-in captions (orange `#FF671F` for emphasis words; IG mutes ~85% of plays)
   - Corner watermark — square `assets/nwm-logo.svg` top-right, 80×80px, 70% opacity
   - 2s end card — `assets/nwm-logo-horizontal.svg` on navy `#010F3B`, orange CTA strip with package name + URL
4. **Voice-over** — Carlos or hired VO records the 9 EN scripts; ES dubs after EN locked.
5. **Final export** — H.264 MP4, 1080×1920, 30fps. Naming: `reel_01_aeo_v2_en_final.mp4` … `reel_09_scale_v2_es_final.mp4`.
6. **Publishing** — HOLD until Meta verification confirmed. Then use `ig_publish.php` (admin-gated), `fb_publish.php` (MIGRATE_TOKEN), `tt_publish.php` (MIGRATE_TOKEN).


**Target:** 9 IG Reels (9:16, 12–15s each), 3 per MVP package, different face per package.
**Generator:** Higgsfield Kling 3.0 via Higgsfield MCP.
**Posting:** HOLD until Meta verification confirmed (memory flag 2026-05-07 — status unconfirmed).

## Logo & brand assets (Apr 27, latest)

| Asset | Path | Use |
|---|---|---|
| Horizontal lockup (light bg) | `assets/nwm-logo-horizontal.svg` | End card on dark backgrounds |
| Horizontal lockup (dark bg) | `assets/nwm-logo-horizontal-dark.svg` | End card on light/white backgrounds |
| Logo lockup PNG | `assets/nwm-logo-lockup.png` | Higgsfield overlay-ready raster |
| Square mark | `assets/nwm-logo.svg` | Corner watermark (top-right, 80×80px, 70% opacity) |

**Brand palette (locked):** Navy `#010F3B` + Orange `#FF671F` + Inter / Poppins (BRAND.md).

## End-card spec (every reel ends with this)

- 2s static frame, navy `#010F3B` background
- Horizontal NWM logo centered, 60% canvas width
- Orange `#FF671F` CTA strip bottom 12%: package name + URL
- Same end card across all 9 — composited in post (DaVinci/Premiere/CapCut), NOT generated by Kling

## Corner watermark (every shot)

Square `nwm-logo.svg` top-right corner, 80×80px, 70% opacity. Composited in post — do NOT prompt Kling to render logos (it will distort the lockup).

## Character lockers (consistency across 3 reels per MVP)

Use `higgsfield-cowork-pack:character-locker` to save each character profile so Reels 1–3 of each set share the same face, build, and wardrobe.

### Character A — "The Skeptic Founder" (AEO Starter, Reels 1–3)
- **Age/build:** 32, lean, 5'10"
- **Ethnicity:** Latino, medium tan, dark brown hair, short clean cut
- **Wardrobe:** Slim navy blazer over white tee, dark jeans, leather watch
- **Vibe:** Sharp but skeptical — eyebrow-raise energy, MIT-grad-turned-founder
- **Setting:** Modern co-working desk, MacBook open, exposed brick wall, warm Edison-bulb lighting
- **Voice:** Mid-range, measured, US English (also generate ES dub variant)

### Character B — "The Operator" (CMO Growth, Reels 4–6)
- **Age/build:** 41, athletic-stocky, 6'0"
- **Ethnicity:** Mixed/Mediterranean, olive skin, salt-and-pepper short hair, light stubble
- **Wardrobe:** Navy polo, dark jeans, sleeves rolled mid-forearm, no jewelry
- **Vibe:** "I run the marketing team and I've seen everything" — calm authority, marketing-ops director
- **Setting:** Open-plan office, sit-stand desk, dual monitors, plants, soft natural daylight
- **Voice:** Lower register, dry humor, US English (also ES dub variant)

### Character C — "The Closer" (CMO Scale, Reels 7–9)
- **Age/build:** 52, fit, 6'1"
- **Ethnicity:** Caucasian-Latino, light olive, salt-grey hair swept back, clean shaven
- **Wardrobe:** Charcoal blazer, crisp white shirt (no tie), navy pocket square, simple steel watch
- **Vibe:** Executive presence — "I've built three companies, this is what I learned" — warm but commanding
- **Setting:** Executive office, floor-to-ceiling window, city skyline at golden hour, modern minimalist desk
- **Voice:** Deeper baritone, deliberate pace, US English (also ES dub variant)

---

## AEO Starter — Character A — Reels 1–3

### Reel 1A — Hook: "AI is the new Google"

| Beat | Time | Visual | Script |
|---|---|---|---|
| 1 | 0–3s | A at desk, looks straight to camera, slight skeptical squint | "60% of online searches now end **without a click**." |
| 2 | 3–7s | Smash cut to phone screen showing ChatGPT answering "best CRM for restaurants" — competitor named | "Your customers don't Google anymore. They ask AI." |
| 3 | 7–12s | Back to A, leans forward, knowing half-smile | "If AI doesn't know your business — you're invisible." |
| 4 | 12–14s | End card | (silent — logo + URL) |

**Kling 3.0 prompt (Beat 1 + 3 combined, 10s clip):**
> Cinematic medium shot of a 32-year-old Latino man with short dark hair, slim navy blazer over white tee, sitting at a modern co-working desk with MacBook open. Exposed brick wall background, warm Edison-bulb lighting. He looks directly at camera with a measured, skeptical expression, then leans slightly forward as if making a confident point. Subtle handheld camera movement, shallow depth of field, 9:16 vertical, photoreal. No text, no logos.

**Kling 3.0 prompt (Beat 2, 4s b-roll):**
> Extreme close-up of an iPhone screen showing ChatGPT answering the query "best CRM for restaurants" with a competitor's name highlighted. Thumb scrolls slowly. Soft bokeh background of a cafe. Vertical 9:16, photoreal, no UI text edits needed.

---

### Reel 2A — Demo: "What AEO actually does"

| Beat | Time | Visual | Script |
|---|---|---|---|
| 1 | 0–3s | POV phone — typing "best [niche] near me" into ChatGPT | (text on screen, no VO) |
| 2 | 3–7s | A reacts to result: competitor wins. Slight wince | "That should've been us." |
| 3 | 7–12s | Cut to laptop screen: schema markup populating, FAQ blocks animating in | "AEO injects what AI needs to cite you — schema, FAQs, authority signals." |
| 4 | 12–15s | Phone retry — A's business now appears in answer | "Three weeks. Now we get the citation." |
| 5 | 15–16s | End card | — |

**Kling 3.0 prompt (Beat 2, 5s):**
> 32-year-old Latino man in navy blazer reacts to phone screen with a flash of disappointment then resolve. Modern co-working desk, warm lighting, shallow DOF. 9:16 vertical, photoreal.

**Kling 3.0 prompt (Beat 3, 5s b-roll):**
> Macro shot of a laptop screen: code editor with JSON-LD schema markup populating line by line, then transitions to a website preview where FAQ accordion blocks fade in sequentially. Cool blue and amber screen glow. 9:16 vertical, photoreal.

---

### Reel 3A — Proof: "We audited 50 sites"

| Beat | Time | Visual | Script |
|---|---|---|---|
| 1 | 0–3s | Stack of audit reports on desk, A flips through | "We audited 50 small businesses last quarter." |
| 2 | 3–7s | Cut to dashboard: 47 zeros lined up | "47 had zero AEO structure. Zero citations." |
| 3 | 7–12s | Line chart climbing — citation lift over 90 days | "Ninety days in, our AEO clients average **4× the AI citation rate**." |
| 4 | 12–14s | A back to camera, calm | "Starts at $497/month. Link in bio." |
| 5 | 14–16s | End card | — |

**Kling 3.0 prompt (Beat 1, 5s):**
> 32-year-old Latino man in navy blazer flipping through a stack of printed audit reports on a modern desk. Top-down then medium angle. Warm Edison-bulb lighting, shallow DOF. 9:16 vertical, photoreal.

**Kling 3.0 prompt (Beat 3, 5s b-roll):**
> Animated line chart on a dark navy background climbing steeply from week 0 to week 12, orange accent line, clean modern data-viz aesthetic, subtle particle effects on data points. 9:16 vertical, photoreal.

---

## CMO Growth — Character B — Reels 4–6

### Reel 4B — Hook: "Stop duct-taping 7 tools"

| Beat | Time | Visual | Script |
|---|---|---|---|
| 1 | 0–3s | B opens laptop. Screen shows 7 tabs: Mailchimp, HubSpot, Canva, Loom, Trello, Buffer, GA4 | "Mailchimp. HubSpot. Canva. Loom. Trello. Buffer. GA4." |
| 2 | 3–7s | B sighs, deadpan to camera | "Each one promised to make marketing easier." |
| 3 | 7–11s | Tabs close one by one. Single NWM CRM dashboard fills the screen | "Now it's one stack. One CMO. One bill." |
| 4 | 11–14s | B relaxes back, half-smile | "$2,997 a month. Done-for-you." |
| 5 | 14–16s | End card | — |

**Kling 3.0 prompt (Beat 1–2, 7s):**
> Medium shot of a 41-year-old Mediterranean man with salt-and-pepper hair, navy polo, opening a laptop at an open-plan office sit-stand desk. He looks at the screen, then at camera with a dry, knowing expression. Dual monitors visible, plants nearby, soft natural daylight. 9:16 vertical, photoreal.

**Kling 3.0 prompt (Beat 3, 4s b-roll):**
> Screen-recording aesthetic: seven browser tabs visible at top, then closing one by one in rapid succession until a single clean dashboard remains — a marketing CRM showing campaigns, calendar, and analytics in navy and orange. Smooth motion, no text changes needed. 9:16 vertical.

---

### Reel 5B — Demo: "What you get with CMO Growth"

| Beat | Time | Visual | Script |
|---|---|---|---|
| 1 | 0–3s | B at whiteboard, lists with marker | "Blog. Social. Email. Ads. One calendar." |
| 2 | 3–7s | Cut to CRM Marketing tab — scheduled posts populate weekly view | "Everything scheduled. Everything tracked." |
| 3 | 7–11s | Phone buzzes — notification: "New lead from blog post." B nods | "Leads land here, not in your inbox chaos." |
| 4 | 11–14s | B to camera | "Done-for-you. Not done-by-you." |
| 5 | 14–16s | End card | — |

**Kling 3.0 prompt (Beat 1, 4s):**
> 41-year-old Mediterranean man in navy polo standing at a glass whiteboard, writing four words with a black marker, glancing back at camera. Open office, soft daylight. 9:16 vertical, photoreal.

**Kling 3.0 prompt (Beat 2, 5s b-roll):**
> Screen recording of a CRM marketing calendar interface, weekly view, scheduled blog posts and social posts populating cells one by one in navy and orange brand colors. Clean modern SaaS aesthetic. 9:16 vertical.

---

### Reel 6B — Proof: "Real client, real numbers"

| Beat | Time | Visual | Script |
|---|---|---|---|
| 1 | 0–3s | B at whiteboard draws "Month 1 → Month 6" arrow | "Six months ago this client had zero leads." |
| 2 | 3–7s | Cut to growth chart: 0 → 47 qualified leads/mo | "Forty-seven qualified leads a month. From content." |
| 3 | 7–11s | Phone email: "Hey, we're ready to scale." B smiles | "Last week they asked to upgrade to Scale." |
| 4 | 11–14s | B to camera, shrugs | "That's the play. Growth, then Scale." |
| 5 | 14–16s | End card | — |

**Kling 3.0 prompt (Beat 1, 4s):**
> 41-year-old Mediterranean man in navy polo at a glass whiteboard, drawing a horizontal arrow with two labels, energetic but composed. Open office, soft daylight. 9:16 vertical, photoreal.

**Kling 3.0 prompt (Beat 3, 4s b-roll):**
> Top-down close-up of an iPhone on a wooden desk showing an email preview: "Hey, we're ready to scale." Coffee cup partially in frame, warm natural light. 9:16 vertical, photoreal.

---

## CMO Scale — Character C — Reels 7–9

### Reel 7C — Hook: "Marketing as a system"

| Beat | Time | Visual | Script |
|---|---|---|---|
| 1 | 0–3s | C at floor-to-ceiling window, city skyline behind, golden hour | "Most businesses do marketing in **spurts**." |
| 2 | 3–7s | Cut to chaotic spreadsheets, missed calendar slots, red exclamation marks | "Big campaign. Quiet. Big campaign. Quiet." |
| 3 | 7–11s | Back to C, turns to camera | "Scale isn't more effort. It's a system that compounds." |
| 4 | 11–14s | C subtle nod | "That's what CMO Scale builds." |
| 5 | 14–16s | End card | — |

**Kling 3.0 prompt (Beat 1 + 3, 10s):**
> Cinematic medium shot of a 52-year-old executive with salt-grey hair swept back, charcoal blazer over crisp white shirt, navy pocket square. He stands in front of a floor-to-ceiling window with a city skyline at golden hour. Slow camera push-in as he turns from the window toward the camera with calm executive presence. Modern minimalist office, warm golden-hour light. 9:16 vertical, photoreal.

**Kling 3.0 prompt (Beat 2, 4s b-roll):**
> Fast-cut montage: a chaotic spreadsheet with red error cells, a calendar with empty slots, a Gantt chart with missed deadlines, all on a dark navy screen. Glitchy transitions, slight handheld jitter. 9:16 vertical.

---

### Reel 8C — Demo: "Inside the Scale stack"

| Beat | Time | Visual | Script |
|---|---|---|---|
| 1 | 0–3s | C at conference table, hands folded | "Strategy. Content. Paid. Automation. Analytics." |
| 2 | 3–7s | Cut to executive dashboard: pipeline, CAC, LTV, MRR — all green trending up | "All five — owned. Measured. Optimized weekly." |
| 3 | 7–11s | Cut to AI automation flow firing — lead → nurture → booked call, no human touch | "Your AI runs the funnel while you run the company." |
| 4 | 11–14s | C to camera | "Custom-built per client. Book a Scale audit." |
| 5 | 14–16s | End card | — |

**Kling 3.0 prompt (Beat 1, 4s):**
> 52-year-old executive with salt-grey hair, charcoal blazer, seated at a modern conference table, hands folded, looking directly at camera with measured authority. Executive office, soft golden-hour window light behind. 9:16 vertical, photoreal.

**Kling 3.0 prompt (Beat 2, 4s b-roll):**
> Executive SaaS dashboard close-up: four KPI cards showing pipeline value, CAC, LTV, MRR — all green arrows trending up. Navy and orange brand palette. Clean, premium aesthetic. 9:16 vertical.

**Kling 3.0 prompt (Beat 3, 4s b-roll):**
> Animated workflow diagram: a node labeled "Lead" connecting via glowing orange line to "Nurture" then "Booked Call," nodes light up sequentially. Dark navy background, clean futuristic UI. 9:16 vertical.

---

### Reel 9C — Proof: "When growth becomes inevitable"

| Beat | Time | Visual | Script |
|---|---|---|---|
| 1 | 0–3s | C on phone call by window, nods slowly | "That was Q4. Now they're hiring three reps." |
| 2 | 3–7s | Cut to client logo wall + revenue chart climbing | "Eighteen months in. MRR up 4×. CAC down 38%." |
| 3 | 7–11s | C to camera, subtle smile | "Scale isn't about more hours. It's about better systems." |
| 4 | 11–14s | C: "When you're ready — we're ready." | |
| 5 | 14–16s | End card with CTA: "Book a Scale audit — netwebmedia.com" | — |

**Kling 3.0 prompt (Beat 1, 4s):**
> 52-year-old executive with salt-grey hair, charcoal blazer, on a phone call by a floor-to-ceiling window, nodding slowly with quiet confidence. City skyline at golden hour behind. 9:16 vertical, photoreal.

**Kling 3.0 prompt (Beat 2, 4s b-roll):**
> Wall of client company logos in a clean grid (use placeholder square logos), then transitions to a revenue line chart climbing steeply with orange highlight against navy. Premium corporate aesthetic. 9:16 vertical.

---

## Cost estimate (Higgsfield Kling 3.0)

| Item | Count | Credits each | Subtotal |
|---|---|---|---|
| Character clips (5–10s each) | 9 | ~50 | ~450 |
| B-roll clips (4–5s each) | ~14 | ~35 | ~490 |
| **Total estimate** | 23 clips | — | **~940 credits** |

**Note:** Earlier estimate of 270–540 assumed 1 clip per reel. Actual quality requires 2–3 clips per reel cut together. If budget is tight, fallback is **1 clip per reel** at ~450 credits total — less dynamic but ships.

## Post-production (after Kling generates)

1. **DaVinci/CapCut assembly** — chain Kling clips, time to 12–16s each
2. **VO recording** — Carlos or hired VO; ES dubs after EN approved
3. **Logo overlay** — corner watermark (square mark) + 2s end card on each reel
4. **Captions** — burned-in (IG mutes ~85% of plays); use brand orange `#FF671F` for emphasis words
5. **Export** — H.264 MP4, 1080×1920, 30fps
6. **File naming convention** (matches existing `reel_*_final.mp4`):
   - `reel_4_aeo_v2_en_final.mp4` … `reel_9_scale_v3_es_final.mp4`
   - Drop into `assets/social/campaign/`

## Publishing (HOLD until verification confirmed)

When Meta verification clears, use existing handlers:
- **Instagram:** `crm-vanilla/api/handlers/ig_publish.php` (admin-gated; needs `IG_BUSINESS_ACCOUNT_ID` + `IG_GRAPH_TOKEN`)
- **Facebook:** `crm-vanilla/api/handlers/fb_publish.php` (MIGRATE_TOKEN gated; scheduled 10min–6mo out)
- **TikTok:** `crm-vanilla/api/handlers/tt_publish.php` (MIGRATE_TOKEN gated; needs Direct Post approval)

Do NOT post until Carlos confirms Meta verification status.
