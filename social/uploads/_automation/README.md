# Upload Automation — How it works

The folder one level up (`social/uploads/`) is the **drag-and-drop ready** staging area. One folder per scheduled post. Open it, read `INSTRUCTIONS.md`, drag the assets into MBS Scheduler / TikTok / YouTube, paste the caption + hashtags, schedule. Done.

This `_automation/` folder is where the *source of truth* lives — edit here when content changes.

## Files

- [build.py](build.py) — the script. Reads the inline `POSTS` list near the top and materializes folders.
- [open_next.py](open_next.py) — helper called by `OPEN-NEXT.bat`. Finds the next upcoming folder by today's date and opens it in Explorer.

## When you change a caption / date / asset

1. Open [build.py](build.py).
2. Find the matching `POSTS` entry (they're ordered chronologically with `WEEK NN` section headers).
3. Edit the field (caption, date, asset path, hashtag stack, etc.).
4. From the repo root, run:

```
python social/uploads/_automation/build.py
```

5. The script wipes and rebuilds the week's folders. Idempotent.

## Adding a new post

Append a new dict to the `POSTS` list. Required fields depend on channel:

**Reel (TikTok or IG-FB reel):**
```python
{
    "date": "2026-07-15", "day": "tue", "time": "12:00", "week": 11,
    "channel": "tiktok",  # or "ig-fb"
    "type": "reel",
    "asset_path": "assets/social/heygen/05-niche-pivot-en.mp4",
    "caption_en": "...",
    "caption_es": "...",  # optional
    "primary": "en",  # or "es"
    "hashtags": "#AEO #FYP #SmallBusiness",  # for TikTok (inline)
    # OR
    "stack": "A",  # for IG/FB (first-comment from STACKS dict)
    "notes": "Wk11 Tue — short description",
},
```

**Carousel (IG-FB only):**
```python
{
    "date": "2026-07-15", "day": "wed", "time": "11:00", "week": 11,
    "channel": "ig-fb",
    "type": "carousel",
    "asset_glob": "assets/social/carousels/a-slide-*.png",  # globs for slides 1..N
    "caption_en": "...",
    "caption_es": "...",
    "primary": "en",
    "stack": "A",
    "notes": "...",
},
```

**YouTube (long or short):**
```python
{
    "date": "2026-07-15", "day": "mon", "time": "15:00", "week": 11,
    "channel": "youtube-long",  # or "youtube-short"
    "type": "youtube",
    "title": "The title — copy-paste verbatim",
    "notes": "Optional context",
},
```

## Adding a new hashtag stack

Edit the `STACKS` dict near the top of `build.py`. Then reference by code in posts (`"stack": "D"`).

## Don't store anything inside upload folders

The build script **wipes** each week's folders before regenerating them. Anything you put inside `week-NN_*/.../` will be lost on next build. Use [social/posting-log.md](../../posting-log.md) for proof-of-post screenshots and engagement notes.

## Why not parse the markdown posting-calendar?

Considered it. Decided against it because:
- The markdown has em-dashes (`—`) where data is empty, conditional cells (e.g. `"or HeyGen render (Wk 8-10)"`), and prose annotations that would need fragile regex.
- Single source of truth = the Python dict. The markdown calendar in [social/posting-calendar.md](../../posting-calendar.md) is a human-readable view; if it drifts from build.py, build.py wins.
- Less than 60 entries makes the inline data tractable.

## Scheduled refresh (optional)

If you want OPEN-NEXT to always reflect today's date without manual rebuilding, set up Windows Task Scheduler to run `python social/uploads/_automation/build.py` daily at, say, 08:00. The README's "Next 5 upcoming" list will then always be current.

```
schtasks /create /tn "NWM Social Uploads Refresh" /tr "python C:\Users\Usuario\Desktop\NetWebMedia\social\uploads\_automation\build.py" /sc daily /st 08:00
```

Then check with `schtasks /query /tn "NWM Social Uploads Refresh"`.

(Optional only — re-running the build is so fast you can just do it manually before each Sunday batch.)
