# Social Media Marketing Plan — May 28 → Jul 9, 2026 (Weeks 5–10)

**Owner:** Carlos Martinez (CEO) / CMO
**Sits under:** `plans/90day-campaign-launch-2026Q2.md` (May 1 → Jul 30) — this doc is the tactical execution layer; it does not replace or supersede the campaign plan.
**Window:** 6 weeks, 2026-05-28 → 2026-07-09
**Status:** Live
**Brand tokens:** Navy `#010F3B` / Orange `#FF671F` / Inter + Poppins

---

## 1. Why this doc exists

The 90-day campaign plan locked the strategy: AEO is the engine, email is the X-replacement, paid is acceleration. What it did not lock was the day-by-day social cadence — captions, asset routing, hashtag stacks, posting times, and the manual workflow Carlos uses when API publishing is gated.

This doc is that layer. It assumes:
- **`plans/90day-campaign-launch-2026Q2.md` §2 channel mix is canonical.** 3 IG carousels/wk + 2 IG Reels/wk, mirrored to Facebook. YouTube 1 long-form + 2 Shorts. TikTok now activating (per CLAUDE.md Social channels update 2026-05-11).
- **No LinkedIn. No X / Twitter.** Durable Carlos decisions.
- **API publishing is currently blocked** — IG creds unset, FB Page token broken, TikTok pending Developer Portal approval. Manual posting via Meta Business Suite Scheduler is the contract until those clear. See [`upload-workflow.md`](upload-workflow.md).
- **14 niches, exactly.** No invented niches, no splits.

---

## 2. Channel playbook

### Instagram (`@netwebmedia`)

| Lane | Asset source | Cadence | Hook style |
|---|---|---|---|
| **Carousel A** (brand intro / AEO fundamentals) | `assets/social/carousels/a-slide-{1..5}.png` | Mon 11:00 | Educational, slide-driven |
| **Carousel B** (channel decision matrix) | `assets/social/carousels/b-slide-{1..5}.png` | Wed 11:00 | "AEO vs X" comparative |
| **Carousel C** (client-win / proof) | `assets/social/carousels/c-slide-{1..5}.png` | Fri 11:00 | Anonymized result, single number |
| **Reel #1** (audit teaser) | HeyGen renders + `assets/social/campaign/reel_*.mp4` | Tue 12:00 | 6-sec hook → score teaser → CTA |
| **Reel #2** (niche pivot or proof) | HeyGen renders | Sat 18:00 | "Here's why [niche] is winning at AEO" |

**Campaign carousel pool (additional):** 4 × 7-slide carousels in EN+ES (AEO, CMO Growth, CMO Scale) at `assets/social/campaign/carousels/<set>_<lang>/`. Rotate one into Friday slot every 2 weeks for variety.

**Hashtag stacks** (rotated weekly to avoid IG suppression per Risk #2 in 90-day plan):

- **Stack A — AEO fundamentals** (Weeks 5, 8):  
  `#AEO #AnswerEngineOptimization #AISearch #ChatGPTMarketing #SMBMarketing #FractionalCMO #AIMarketing #B2BMarketing`
- **Stack B — Channel comparison** (Weeks 6, 9):  
  `#AEOvsSEO #AISearch #MarketingStrategy #LocalSEO #SEO2026 #DigitalMarketing #SmallBusinessMarketing #MarketingAgency`
- **Stack C — Client proof** (Weeks 7, 10):  
  `#CaseStudy #MarketingROI #LeadGeneration #BusinessGrowth #SMBSuccess #MarketingResults #AEOResults #GrowthMarketing`

**Never put "ChatGPT" in the primary copy line on IG** — use "AI search" instead (per 90-day plan Risk #2).

### Facebook (`/netwebmedia`)

Mirrors Instagram 1:1. Same asset, same caption (minus IG-only hashtags). Posted ~30 min after IG to avoid Meta's cross-poster spam detector.

**Pending action:** vanity URL `facebook.com/netwebmedia` not yet claimed. See `social/fb-page-conversion-plan.md` for the Carlos-execution checklist. Once live, the 18-file URL sweep happens — until then we keep posting to the numeric profile ID.

### YouTube (`@netwebmedia`)

| Lane | Cadence | Source | Notes |
|---|---|---|---|
| **Long-form** | Mon 15:00 (publish) | Wed record day → Thu edit → Mon publish | 8–14 min, AEO/strategy/explainer |
| **Short #1** | Wed 16:30 | Cut from long-form | 30–60 sec hook clip |
| **Short #2** | Fri 16:00 | Cut from long-form OR repurposed Reel | 30–60 sec, different angle |

**Title formula:** `<Question buyers ask AI> | NetWebMedia` — e.g. "Why ChatGPT Won't Cite Your Law Firm | NetWebMedia."

### TikTok (`@netwebmedia`)

Activating per CLAUDE.md social-channels update 2026-05-11. 6 reels at `assets/social/campaign/reel_*.mp4`:

- `reel_aeo_en.mp4` / `reel_aeo_es.mp4` — AEO hook
- `reel_growth_en.mp4` / `reel_growth_es.mp4` — Growth pitch
- `reel_scale_en.mp4` / `reel_scale_es.mp4` — Scale pitch

**Cadence:** 2/week (Mon 19:00 + Thu 19:00). Rotate the 6 across 3 weeks; weeks 8–10 cycle in HeyGen-rendered videos (see [`heygen-video-briefs.md`](heygen-video-briefs.md)).

**Publishing path:** `tt_publish.php` is gated on TikTok Developer Portal Content Posting API + Direct Post approval (2–4 wk review). Until then: native upload from phone, captions stored in [`posting-calendar.md`](posting-calendar.md). Once domain ownership verifies in TT Dev Portal URL Prefix Config, switch to API.

### Email broadcasts

**Tuesday AEO Brief 9:00 send** — already locked in the 90-day plan. No change here.

### WhatsApp Business

Opt-ins captured via `/whatsapp-updates.html`. WABA broadcast still gated on Meta verification (target Jun). No outbound social posting until verified — opt-ins flow as `pending_double_opt_in` per `wa_flush.php`. The public 442-385-4585 number is on the WhatsApp Business *App* (not Cloud API), so Meta-Cloud broadcasts via `wa_flush.php` are not available on that line; this is the standing constraint in CLAUDE.md.

---

## 3. Hook bank — 18 hooks, ready to remix

Each hook tested against the "would Carlos's mother understand it in 3 seconds" filter. Use as caption-line-1 or Reel cold-open.

**AEO fundamentals (6):**
1. "Your customers asked AI about your business this week. You weren't there."
2. "ChatGPT cites 3 marketing agencies in answer to 'best AEO agency near me.' Are you one of them?"
3. "AEO is what SEO became when buyers stopped clicking blue links."
4. "Search just moved. Most agencies haven't noticed."
5. "If AI doesn't know you exist, the buyer doesn't either."
6. "Google sends 12% less traffic than 2023. AI sends the rest."

**Channel comparison (6):**
7. "AEO vs SEO: same craft, different target."
8. "Local SEO ranks you in Google Maps. AEO ranks you in ChatGPT. Both matter."
9. "Your 5-star Google reviews don't help if ChatGPT can't find them."
10. "Featured snippets are dead. Citations are forever."
11. "PPC stops the day you stop paying. AEO compounds."
12. "Three queries decide if you exist: brand + niche + 'near me'. We rank you on all three in AI."

**Client proof / pricing (6):**
13. "12 AI citations in 60 days. Single retainer client."
14. "$997 audit. 100% credited to your retainer. The math is obvious."
15. "Anonymous client. Law firm. 4 new retainers in Q1 from AEO alone."
16. "Most agencies charge $5K/mo. We charge $999. Same outputs, half the layers."
17. "Free AEO Index check at netwebmedia.com/aeo-index. Score in 30 seconds."
18. "Every Tuesday at 9 AM: one AEO move you can ship by Friday."

---

## 4. Asset reuse matrix

Existing assets cover ~6 weeks of unique posts before we need to manufacture new carousels.

| Asset path | Count | Allocated to |
|---|---|---|
| `assets/social/carousels/a-slide-{1..5}.png` | 1 set | Week 5+8 Mon (rotate 4-wk gap) |
| `assets/social/carousels/b-slide-{1..5}.png` | 1 set | Week 5+8 Wed |
| `assets/social/carousels/c-slide-{1..5}.png` | 1 set | Week 5+8 Fri |
| `assets/social/campaign/carousels/aeo_en/` (7-slide) | 1 | Week 6 Mon |
| `assets/social/campaign/carousels/aeo_es/` (7-slide) | 1 | Week 9 Mon (ES audience swing) |
| `assets/social/campaign/carousels/cmo_growth_en/` (7-slide) | 1 | Week 6 Wed |
| `assets/social/campaign/carousels/cmo_growth_es/` (7-slide) | 1 | Week 9 Wed |
| `assets/social/campaign/carousels/cmo_scale_en/` (7-slide) | 1 | Week 6 Fri (premium-tier teaser) |
| `assets/social/campaign/carousels/cmo_scale_es/` (7-slide) | 1 | Week 9 Fri |
| `assets/social/campaign/reel_*.mp4` (6 videos) | 6 | Tue+Sat IG Reels weeks 5–7; TikTok weeks 5–7 |
| HeyGen renders (12 new) | 12 | Weeks 8–10 IG Reels + TikTok |
| `assets/social/ig-identity-card.png` | 1 | Week 5 Sat audit teaser fallback |
| `assets/social/ig-aeo-stat.png` | 1 | Pin to top of profile end of Week 5 |
| `assets/social/ig-cta.png` | 1 | Stories-only (highlights cover) |

**Gap analysis:** by Week 10 we'll need a new carousel batch (3 sets, 15 slides). Decision point: 2026-07-09. Either re-run `_deploy/render-carousels.py` with new copy, or hand off to Creative.

---

## 5. Success metrics (Sunday dashboard add-on)

These extend the 90-day plan §6 dashboard. All measured America/Santiago Sunday 5pm.

| Metric | Source | Green | Yellow | Red |
|---|---|---|---|---|
| **IG carousel saves/post** | IG insights | ≥ 25 | 10–24 | < 10 |
| **IG Reel watch-through %** | IG insights | ≥ 45% | 30–44% | < 30% |
| **FB→IG mirror engagement parity** | Manual cross-check | FB ≥ 50% of IG eng | 30–49% | < 30% |
| **TikTok avg watch time** | TT analytics | ≥ 8 sec | 5–7.9 | < 5 |
| **YT Shorts CTR to long-form** | YT analytics | ≥ 4% | 2–3.9% | < 2% |
| **AEO Index page visits from social** | GA4 UTM `?utm_source=ig|fb|tt|yt` | ≥ 35/wk by Week 10 | 15–34 | < 15 |
| **Audit purchases attributed to social** | Stripe + GA4 | ≥ 1/wk by Week 8 | sporadic | 0 by Week 10 = red |

---

## 6. Risk additions (extends 90-day plan §7)

| # | Risk | Mitigation |
|---|---|---|
| S1 | **API publishing stays blocked through Week 10** (IG creds + FB token + TT portal all pending) | Manual workflow via [`upload-workflow.md`](upload-workflow.md) is sufficient through Week 10. If still blocked Week 11+, decide: re-prioritize the unblock, or accept manual permanently |
| S2 | **HeyGen credits exhaust mid-cycle** | The 12 rendered videos cover Weeks 8–10. If credits run out before Week 8: fall back to repurposed TikTok reels (6 existing) re-captioned for IG. Worst case: skip a slot |
| S3 | **IG temp-restriction recurrence** (per memory: @netwebmedia was temp-restricted 2026-05-25 from automated connect attempts) | Zero browser-automated IG actions. All posts go through MBS Scheduler (a first-party Meta product) — same trust signal as native posting |
| S4 | **TikTok Developer Portal rejects the Content Posting API application** | Stay on manual upload via phone. Reapply with Direct Post permission + verified domain. Don't re-attempt the API call until portal approves |

---

## 7. Single source of truth

This is the only social-execution doc that should be edited. If you need a Week 11+ extension, supersede this doc — don't fork it. Related files:

- [`plans/90day-campaign-launch-2026Q2.md`](../plans/90day-campaign-launch-2026Q2.md) — campaign strategy
- [`social/posting-calendar.md`](posting-calendar.md) — 6-week day-by-day schedule
- [`social/upload-workflow.md`](upload-workflow.md) — manual posting checklist + MBS scheduler walkthrough
- [`social/heygen-video-briefs.md`](heygen-video-briefs.md) — 12 video scripts
- [`social/heygen-renders-log.md`](heygen-renders-log.md) — render URLs (populated by `Generar_Video_HeyGen.bat`)
- [`social/fb-page-conversion-plan.md`](fb-page-conversion-plan.md) — Carlos's FB Business Page checklist
- [`social/WEEK_01_CONTENT.md`](WEEK_01_CONTENT.md) — historical reference (Week 1 of 90-day)
- [`social/PROFILE_KIT.md`](PROFILE_KIT.md) — bios + brand tokens (already shipped)

---

*Carlos Martinez / CMO — 2026-05-28*
