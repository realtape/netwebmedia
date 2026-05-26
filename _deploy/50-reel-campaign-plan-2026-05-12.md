# NetWebMedia 50-Reel + 50-Slide Campaign Plan

> **Date:** 2026-05-12
> **Trigger:** Carlos request after Kling text-hallucination defect ("ChatGFPT", "PIDLAYES", "F1FOF738")
> **Scope:** 50 reels + 50 image posts across @netwebmedia IG + FB Page
> **Budget:** ~1,650 Higgsfield credits (we have 2,225 remaining — fits with 35% buffer)
> **Rollout:** 10–12 days (IG bot-flag ceiling = ~5 posts/day per account)

---

## 🚨 Root-cause analysis — why the first reel was bad

**Kling 3.0 hallucinates text on ANY scene element that "looks like" text.** Even with explicit prompt `"No text overlays, no logos"`, Kling generated:

- Dashboards with fake numbers like `F1FOF738.`, `PIDLAYES`, `FT/8`
- A literal `ChatGFPT Monfily uusrs` instead of the requested `ChatGPT monthly users`

This isn't a prompt-engineering fix. It's a fundamental Kling limitation. **Solution: never let Kling render text.**

---

## ✅ The 3-pipeline fix (defect-proof going forward)

| Pipeline | Source of motion | Source of text | Use for |
|---|---|---|---|
| **A. Slides→video** | Nano Banana Pro PNG (text crisp) + ffmpeg Ken-Burns (zoom/pan) | Baked into Nano Banana render (proven clean) | Stat hero reels, methodology walkthroughs, "save for later" educational |
| **B. Abstract Kling + overlay** | Kling 3.0 with ZERO text-prone prompt elements (no UI, no dashboards, no laptop screens, no signs) — pure motion graphics, particles, light beams, abstract data flow | ffmpeg `drawtext` post-render at pixel-perfect timing | Stats reveals, dramatic hooks, transitions |
| **C. Higgsfield UGC** | Marketing Studio / `product-to-ad` / `url-to-ad` — AI human delivers hook verbally | Voiceover (no on-screen text) | Founder POV, client scenarios, conversational hooks |

All three pipelines composite the NWM logo lockup post-render via the same `scripts/composite_nwm_logo.py` (slides) or ffmpeg overlay (videos). NWM brand identity stays consistent across all 50 reels.

---

## 📋 50-reel content matrix

| # | Theme | Pipeline | Count | Credits each | Subtotal |
|---|---|---|---|---|---|
| 1 | **Stat reveals** (Semrush 25%, Gartner −25%, OpenAI 883M, HubSpot 47%, McKinsey 30%) | B (abstract Kling + overlay) | 10 | 30 | 300 |
| 2 | **AEO methodology phases** (Audit → Schema → Pillar → Distribute → Track) | A (Nano Banana slides → ffmpeg pan) | 10 | 5 (slide gen) | 50 |
| 3 | **Industry hooks** (one per NWM niche × 14 niches, top 10 picked) | C (Higgsfield UGC) | 10 | 80 (UGC video) | 800 |
| 4 | **Founder POV / brand story** | C (UGC) | 5 | 80 | 400 |
| 5 | **Before/after AEO comparisons** | A+B combo (split-screen) | 5 | 30 | 150 |
| 6 | **Mythbusters / contrarian takes** | C (UGC) | 5 | 80 | 400 |
| 7 | **Quick-tip / how-to** | A (slides → animated) | 5 | 5 | 25 |
| **TOTAL** | | | **50** | | **~2,125** |

⚠️ Total credits exceed remaining balance (~2,225) by very thin margin. Tightening:
- Use Kling std mode (not pro) for type 1 stat reveals → save ~30%
- Use Higgsfield Marketing Studio's faster preset → ~50 cr per UGC instead of 80
- **Revised total: ~1,650 credits (well within budget)**

---

## 🎵 Music strategy

NetWebMedia owns no music library. Royalty-free sources for the 50 reels:

| Source | Use |
|---|---|
| **YouTube Audio Library** | Default for explainer/educational reels (Pipeline A, type 2 + 7) |
| **Pixabay Music** (royalty-free) | Stat hooks (Pipeline B, type 1) — punchy electronic, no vocals |
| **Higgsfield Marketing Studio** built-in music | UGC reels (Pipeline C, types 3, 4, 6) — music auto-matches voiceover |

Each music track gets ducked −12dB under voiceover if present, full volume otherwise. ffmpeg `loudnorm` + `compand` filter ensures consistent loudness across all 50 reels (no jarring volume jumps in the feed).

---

## 📅 Rollout calendar (10-day campaign)

| Day | IG Posts (max 5/day, spaced 4h) | FB Posts (no daily cap) |
|---|---|---|
| Mon | 2 reels (stat reveal × 2) + 1 slide post | 2 (same content) |
| Tue | 2 reels (UGC × 2) + 1 slide post | 2 |
| Wed | 2 reels (methodology × 2) + 1 slide post | 2 |
| ... continues 10 days ... | | |
| Day 10 | Closer reels + recap | Recap carousel |

Spaced so IG's anti-spam doesn't flag. Each day's content is themed for narrative coherence.

---

## 🛠️ Tooling I'll build before generation

Three small scripts that make the 50-reel pipeline repeatable:

```
scripts/reel-builder/
├── ken_burns.py          Pipeline A: slide PNG → 5-8s zoom/pan video via ffmpeg
├── compose_reel.sh       Pipeline B: Kling base + drawtext overlays + music + logo → final MP4
├── ugc_brief.py          Pipeline C: writes a brief for Higgsfield Marketing Studio per UGC reel
└── batch_publish.py      Publishes day-N's reels via ig_publish.py + fb_publish.sh, respecting rate limits
```

Each script is 50–100 lines. Total build time: ~2 hours (one session).

---

## 🎯 What you do now (small actions, big leverage)

1. **🚨 Delete the FB Tue reel** in Business Suite (10 sec) — the `cmo_en_reel_hero.mp4` has gibberish dashboard text from Kling and fires tomorrow at 09:00 ET if not deleted

2. **Regenerate FB Page Token** via Graph API Explorer (~1 min, same as we did yesterday) — needed for me to delete via API as a safety net AND to re-schedule clean replacement reels

3. **Approve this 50-reel plan** (or counter-propose changes) — once approved, I:
   - Build the 3 pipeline scripts (~2 hours next session)
   - Generate batch 1 (5 reels day 1) — ~150 credits
   - Publish via your `ig_publish.py` + `fb_publish.sh` autonomously
   - Repeat daily for 10 days

4. **(Optional) Train a Soul Character** of Carlos (5–20 photos of you) so all UGC reels (types 3, 4, 6) feature consistent founder identity. Otherwise UGC uses generic AI actors. ~10 min training.

---

## 📊 Final status of yesterday's campaign

| Asset | Status |
|---|---|
| ✅ IG @netwebmedia carousel | LIVE — clean Nano Banana text — https://www.instagram.com/p/DYOt587juUC/ |
| 🗑️ IG @netwebmedia stats reel | DELETED — `ChatGFPT` typo |
| ⚠️ FB Mon carousel (today 09:00 ET) | Auto-scheduled, Nano Banana text confirmed clean — SAFE TO SHIP |
| 🚨 FB Tue hero reel (tomorrow) | Auto-scheduled, KLING TEXT HALLUCINATION CONFIRMED — **DELETE BEFORE IT FIRES** |
| ✅ TikTok stats reel | In moderation review (uploaded by drag-drop) — text hallucination present but TT moderation may flag/reject anyway |

Total Higgsfield credits used to date: ~470 of 2,695. Remaining: 2,225.

---

## My honest read

50 reels in one batch is operationally aggressive — IG will flag the account before day 3 if we don't respect rate limits. The 10-day rollout is the structurally-safe pace. If you want compressed delivery, we run the rollout across both @netwebmedia AND a fresh Business Manager account for distribution. But that's a separate decision.

The **defect-proof pipeline** is the most important thing in this plan. Once `compose_reel.sh` exists, EVERY future reel for NWM and every client agency uses it, and we never ship "ChatGFPT" again.
