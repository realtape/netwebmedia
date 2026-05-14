# Spa IMSA 45-min Sprint — 3 Highlight Reels

**Source:** https://www.youtube.com/watch?v=b7Y7e8N0osg (LIVE | iRacing IMSA Multiclass @ Spa-Francorchamps | 45 Min Sprint, 51:36)
**Rendered:** 2026-05-14 · 6 files (3 IG + 3 YT) at QHD 1440×2560 · 30fps · h264 + AAC original audio
**Files:** `renders/reel-R01-IG.mp4`, `reel-R01-YT.mp4`, `reel-R02-IG.mp4`, `reel-R02-YT.mp4`, `reel-R03-IG.mp4`, `reel-R03-YT.mp4`

---

## The 3 reels

| # | Source min | Moment | Accent | Hook |
|---|---|---|---|---|
| R01 | 5:30–5:50 | Race start — full pack heading down the straight | Crimson | GREEN AT SPA |
| R02 | 24:30–24:50 | Chasing a green GTD Porsche through a corner | Cyan | REELING IN THE PORSCHE |
| R03 | 49:45–50:05 | Last lap, FUEL LOW warning, red cars in mirror | Crimson | ONE LAP TO THE FLAG |

Each reel runs 20 seconds. Original onboard audio kept (engine + sim sounds). Add the music bed inside the Instagram editor at post time — IG's licensed library is broader than anything we could safely mux in, and skipping the mux step also avoids YouTube Shorts copyright strikes when cross-publishing.

---

## Posting schedule (proposed)

| Day | Time (Santiago) | Platform | File |
|---|---|---|---|
| Day 1 | 19:00 | Instagram @realiracing | `reel-R01-IG.mp4` |
| Day 1 | 19:05 | YouTube Shorts @realtape | `reel-R01-YT.mp4` |
| Day 2 | 19:00 | Instagram @realiracing | `reel-R02-IG.mp4` |
| Day 2 | 19:05 | YouTube Shorts @realtape | `reel-R02-YT.mp4` |
| Day 3 | 19:00 | Instagram @realiracing | `reel-R03-IG.mp4` |
| Day 3 | 19:05 | YouTube Shorts @realtape | `reel-R03-YT.mp4` |

One per day per platform — algorithm needs spacing. Don't dump all 3 in one night.

---

## R01 — "Green at Spa" (race start)

### Instagram @realiracing
**Caption:**
> Lights out at Spa-Francorchamps.
>
> 20 cars. One apex. 45 minutes to the flag.
>
> Full race on YouTube → @realtape
>
> #iRacing #SimRacing #Spa #IMSA #SpaFrancorchamps #Porsche911GT3 #RacingSimulator #SimRacingCommunity

### YouTube Shorts @realtape
**Title:** Lights Out at Spa — IMSA Multiclass Sprint #iRacing #Shorts
**Description:**
> The opening seconds of a 45-min IMSA Multiclass sprint at Spa-Francorchamps. 20 cars, one apex into La Source.
>
> Full race: [link to long-form VOD]
>
> #iRacing #SimRacing #Spa #IMSA

---

## R02 — "Reeling in the Porsche" (mid-race chase)

### Instagram @realiracing
**Caption:**
> Three corners to make the pass.
>
> Reeling in a GTD Porsche at Spa. The mirrors mean nothing if the gap keeps closing.
>
> Full race on YouTube → @realtape
>
> #iRacing #SimRacing #Spa #IMSA #Porsche911GT3 #GTD #SimRacingCommunity

### YouTube Shorts @realtape
**Title:** Chasing Down a Porsche at Spa — IMSA #iRacing #Shorts
**Description:**
> Mid-race chase through Spa-Francorchamps. The Porsche has track position; we have one stint left to take it.
>
> Full race: [link to long-form VOD]
>
> #iRacing #SimRacing #Spa #IMSA

---

## R03 — "One lap to the flag" (last lap, FUEL LOW)

### Instagram @realiracing
**Caption:**
> FUEL LOW. One lap to the flag.
>
> 45 minutes of focus = one finish line. Ferrari in the mirrors. Don't lift.
>
> Full race on YouTube → @realtape
>
> #iRacing #SimRacing #Spa #IMSA #LastLap #SimRacingCommunity

### YouTube Shorts @realtape
**Title:** FUEL LOW on the Last Lap at Spa #iRacing #Shorts
**Description:**
> Fuel light is on. Ferrari is closing. One lap left at Spa-Francorchamps after a 45-minute IMSA Multiclass sprint.
>
> Full race: [link to long-form VOD]
>
> #iRacing #SimRacing #Spa #IMSA

---

## How to post (Instagram)

1. Open Instagram on phone → switch to @realiracing
2. Plus → Reel → select `reel-R0X-IG.mp4` from Camera Roll (AirDrop or Google Drive the file over first)
3. Skip "Edit clips" — the reel is already 20s
4. **Music tab → search "race" / "tense" / "electronic"** and pick a track ≤ 90 BPM that doesn't fight the engine audio. Set music volume to about 30% so the onboard engine still reads
5. Caption + hashtags from above
6. Share

## How to post (YouTube Shorts)

1. YouTube Studio app → switch to @realtape
2. Plus → Upload → pick `reel-R0X-YT.mp4`
3. Title + description from above
4. Keep "Made for kids" → NO
5. **Don't add music** — YouTube's copyright auto-flagger is more aggressive than IG's. Original onboard audio is the safer ship.
6. Set visibility → Public → Publish

---

## What to track (week 1)

- **R01 vs R02 vs R03** — which hook lands hardest on each platform
- **IG vs YT** — same hook, same edit, different audience: which is bigger for sim racing right now
- **48-hour view threshold**: if any reel clears 250 views in 48h, that hook + accent + clip type is the template for the next batch

The audit at `_audit/realtape-channel-audit-2026-05-13.md` (from the spa-reels-2026-05-12 batch) holds the broader retention thesis. These 3 reels are the first test of the dual-handle format.

---

## Tech notes — for next time

- Source was 1080p60 (no 4K available from YouTube). True 4K renders aren't possible without a higher-quality master.
- Crop strategy: `scale=-2:2560,crop=1440:2560` from 1920×1080 source = center 32% of original. Captures dashboard + windscreen. Works for any in-car cockpit view.
- Each render: ~60s through hyperframes + ~5s mux. Six reels ≈ 7 minutes total.
- Re-render any single reel: `python build-reels.py render R02-IG`
- Re-cut a clip after shifting timestamp: delete `assets/broll/clip-R02.mp4` first.
