# Spa-Francorchamps 40-Reel Production — Delivery Brief

**Session date:** 2026-05-13
**Working dir:** `C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\spa-reels-2026-05-12`
**Output:** QHD vertical 1440×2560 @ 30fps, H264 video + AAC audio 192k
**v1 backup:** 1080×1920 silent renders archived at `renders/_v1-1080p/`

> **Why 1440 not 4K:** YouTube only stored these uploads up to 1440p. True 4K source isn't available; 1440p is the native max. Output uses original audio from the source streams.

---

## What's in this folder

| Path | What it is |
|---|---|
| `_audit/realtape-channel-audit-2026-05-13.md` | Full channel audit with growth/retention diagnosis + recommendations |
| `_audit/40-reel-plan.md` | Master plan: 4 sources × 10 archetypes × hook copy + HUD stats |
| `_audit/preview-R*-*.jpg` | Frame previews from rendered reels (sanity-check stills) |
| `build-reels.py` | The generator. Reads its own manifest, cuts b-roll, writes HTMLs, calls hyperframes |
| `sources/video-0?-*.mp4` | 4 YouTube downloads (V01 89min, V02 50min, V03 100min, V04 16min) |
| `assets/broll/clip-R??.mp4` | 40 b-roll clips, 1080×1920, 20s each, h264 |
| `compositions/reel-R??.html` | 40 Hyperframes composition HTMLs (one per reel) |
| `renders/reel-R??.mp4` | The rendered MP4s — drag straight into Instagram / Shorts |
| `thumbs/video-0?/t-*.jpg` | 60s-interval thumbnails used to verify race timestamps |

---

## What got delivered in this session

| Status | Item |
|---|---|
| ✅ | Channel audit (`_audit/realtape-channel-audit-2026-05-13.md`) — *the most important deliverable: identifies the retention crisis and why 40 reels matter* |
| ✅ | 40-reel master plan (`_audit/40-reel-plan.md`) — archetypes, hooks, HUD stats |
| ✅ | All 4 source videos downloaded (5.6 GB total) |
| ✅ | All 40 b-roll clips cut at 1080×1920 (some need timestamp tweaks — see below) |
| ✅ | All 40 Hyperframes composition HTMLs |
| ✅ | **ALL 40 REELS RENDERED** at QHD 1440×2560 + original audio. Files in `renders/reel-R01.mp4` through `reel-R40.mp4`, ~3-4 GB total |
| ✅ | Reusable pipeline script (`build-reels.py`) — adjust timestamps + re-render any individual reel |
| ✅ | **V03 timestamps locked.** TWO races confirmed (Race 1 ~09:00-30:00, Race 2 ~65:00-95:00). Reels R21-R25 = Race 1, R26-R30 = Race 2. |
| ✅ | v1 1080p silent versions kept at `renders/_v1-1080p/` as backup |
| ⚠ | Minor: R09, R10, R11, R12, R31 picked quieter b-roll moments (pit lane / formation). Visually still fine; shift `start=` ±30s in `build-reels.py` and re-render if you want more action. |

---

## Render the rest in one command

```bash
cd C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\spa-reels-2026-05-12
python build-reels.py render R01 R03 R05 R06 R07 R08 R10 R11 R13 R14 R15 R16 R17 R18 R19 R20 R21 R22 R23 R24 R25 R26 R27 R28 R29 R30 R31 R33 R34 R35 R36 R37 R38 R39 R40
```

Or all-at-once:
```bash
python build-reels.py render-all
```

Each reel takes ~60s to render. Total: ~35 minutes for the remaining 35.

---

## Known issue: timestamp accuracy

I picked timestamps from race-structure heuristics, then verified the START moments against extracted thumbnails. Findings:

| Video | Race start timestamp | My pick | Verdict |
|---|---|---|---|
| V01 (89min IMSA) | ~20:00 (Lap 1 with full pack) | 20:30 (R02) | ✅ HERO quality — ships as is |
| V02 (50min IMSA) | ~07:00 (Lap 1 racing) | 05:30 (R12) | ⚠ Picks pit-lane formation; shift +60-90s |
| V03 (100min Porsche) | TWO races: Race 1 = 09:00-30:00, BRB break 40-55:00, Race 2 = 65:00-95:00 | Race 1 = R21-R25, Race 2 = R26-R30 | ✅ FIXED — R22 + R28 verified hero quality |
| V04 (16min IMSA) | ~05:00 (Lap 1 active racing) | 04:50 (R32) | ⚠ Picks formation/pacing lap; shift +30s |

### How to fix timestamps

Open `build-reels.py` and edit the `REELS` list. Each reel has a `start=<seconds>` value. To shift, change the number.

Example — to fix R12 (move V02 start +75s):
```python
dict(id="R12", src="V02", start=405, dur=20, ...)  # was 330
```

Then re-cut + re-render that one reel:
```bash
del assets\broll\clip-R12.mp4
del renders\reel-R12.mp4
python build-reels.py render R12
```

### V03 race location — scrub yourself

V03 thumbnails are at `thumbs/video-03/t-*.jpg` (1 per minute). Look for:
- Multiple cars visible on track
- Lap counter increasing 1, 2, 3...
- No "Like and Subscribe" overlay
- No menu screens / setup pages

From what I saw: **active racing happens around 10:00–25:00 minutes** in V03 (not 60–90 as I assumed). The 11-lap sprint likely starts ~15:00. Open the thumbs in Explorer, find where the race actually is, then update all 10 V03 reels (R21–R30) in the manifest accordingly.

---

## Hyperframes pipeline — quick reference

The composition HTML is at 1080×1920 with these timeline beats (defined in template inside `build-reels.py`):

| 0:00–5:00 | HOOK (huge headline) |
| 5:00–11:00 | HUD CARD (track / lap / stat) |
| 11:00–17:00 | BUILD (series + brand line) |
| 16:00–20:00 | CTA (`FULL RACE ON THE CHANNEL` + @REALTAPE pill) |
| 0:00–20:00 | Progress bar at bottom in the reel's accent color |

3 accent colors rotate by archetype:
- **Crimson `#FF1A1A`** — high-energy (start, overtakes, finish)
- **Amber `#FFB400`** — caution (mistakes, defending)
- **Cyan `#00D4FF`** — technical (purple sectors, telemetry)

The `@REALTAPE` handle stays top-center the full 20 seconds. Bottom-third of the source frame stays clear so the in-game Porsche/BMW dashboard reads through.

---

## What to publish & where

These reels are **1440×2560 QHD vertical** with **original iRacing onboard audio** (engine + sim sounds + Carlos's wheel/pedal noise). 20 seconds each. Format: H.264 video + AAC audio in MP4.

**On audio:** The audio is the raw onboard track. If you'd prefer music beds for some platforms (TikTok loves music), mute in the platform editor before posting, or use the script's mux step to swap audio: see "Adding audio" below.

### Recommended publishing order

| Platform | Format | Count | Notes |
|---|---|---|---|
| **Instagram Reels** | as is | 40 | Add a music bed in the IG editor before posting |
| **YouTube Shorts** | as is | 40 | Cross-publish same files — different audience, same hook |
| **TikTok** | as is | 40 | Auto-detected as vertical; add captions in TikTok editor |

**Posting cadence proposal:** 2/day for 20 days. Spread by archetype, not by source video (so each day has variety: e.g. Day 1 = 2 starts from different sources, Day 2 = an overtake + a finish, etc.). Don't dump all 40 in one week — algorithm needs spacing.

### Swapping audio

The reels already ship with original onboard audio. To replace it with a music bed for a specific reel:

```bash
# Replace audio with a music track
ffmpeg -i renders/reel-R02.mp4 -i path/to/music.m4a \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest \
  reel-R02-music.mp4
```

To strip audio entirely (silent reel for music-only platforms):
```bash
ffmpeg -i renders/reel-R02.mp4 -c:v copy -an reel-R02-silent.mp4
```

---

## How the audit ties to the reels (why bother)

From `_audit/realtape-channel-audit-2026-05-13.md`:
- Live VODs get 2–12% retention. Edited reels get **48% retention**.
- "RealTape Reel #1" (Apr 28) — your existing single short — is the channel's #2 video in 28 days at 240 views.
- 40 new reels = 40 more shots at that retention number.

Two predictions worth tracking:
1. **First 10 reels** establish whether shorts-driven sub growth works for this channel. Set a target: avg ≥250 views per reel = format works, scale up. <100 = retreat to one-per-week, recut style.
2. **Cross-publish to YouTube Shorts** within 7 days. YouTube currently rewards sim-racing shorts more than Instagram does for an account this size.

---

## Tooling notes

- **ffmpeg:** `C:\Users\Usuario\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin\ffmpeg.exe`
- **yt-dlp:** installed via `pip install --user yt-dlp` (run via `python -m yt_dlp`)
- **hyperframes:** auto-installed by `npx hyperframes` (currently v0.6.4)
- **Source codec:** YouTube AV1 at 1920×1080@60fps. Slow to decode but works.
- **Disk:** sources + clips + renders total ~9 GB. Sources are the bulk — delete `sources/` after rendering if disk pressure.

---

## If something breaks

| Symptom | Likely cause | Fix |
|---|---|---|
| `clip-RXX.mp4` is tiny (<1MB) | Cut hit black screen / outro card | Adjust `start=` in `REELS`, re-cut |
| Hyperframes render hangs at 25% | Browser GPU mode issue | Re-run, or `npx hyperframes browser --reinstall` |
| Render fails with "AudioContext" warnings | Cosmetic — ignore | These are warnings, render still completes |
| Lint warns `studio_missing_editable_id` | Cosmetic — ignore | Hyperframes Studio (the editor) wants IDs; renders don't need them |
| Render works but reel looks wrong | Timestamp picked a quiet moment | Open thumbs/video-NN/, scrub to active racing, update `start=` |
| `python build-reels.py` UnicodeEncodeError | Fixed in this session, but watch for new non-ASCII chars in print statements | Use plain ASCII in any `print()` you add |

---

*The script `build-reels.py` is the source of truth. Every reel is data in there. To regenerate from scratch: `python build-reels.py compositions && python build-reels.py cuts && python build-reels.py render-all`.*
