# Social Uploads — Drag-and-drop ready

**Last built:** 2026-05-28

Open the next-upcoming folder, follow `INSTRUCTIONS.md`, drag the asset(s) into the uploader, paste `caption.txt` and `hashtags.txt`. Done.

## Quick start

- Double-click `OPEN-NEXT.bat` to open the next upcoming post folder in Explorer.
- Or browse the weeks below — folders sort chronologically.

## What's in each post folder

- `INSTRUCTIONS.md` — channel-specific upload steps (TikTok / IG+FB / YouTube)
- `caption.txt` — the primary-language caption (copy + paste)
- `caption-alt.txt` — the other language, if both EN and ES exist for this post
- `hashtags.txt` — hashtag stack to paste into the FIRST COMMENT on IG
- The asset file(s) — drag these into the uploader

## Next 5 upcoming

- **2026-05-28 thu 19:00** · tiktok · [2026-05-28_thu_19-00_tiktok_001/](week-05_may-28-jun-01/2026-05-28_thu_19-00_tiktok_001/) — Wk5 Thu — AEO hook EN (existing reel)
- **2026-05-29 fri 11:00** · ig-fb · [2026-05-29_fri_11-00_ig-fb_002/](week-05_may-28-jun-01/2026-05-29_fri_11-00_ig-fb_002/) — Wk5 Fri — Carousel C (client-win)
- **2026-05-29 fri 16:00** · youtube-short · [2026-05-29_fri_16-00_youtube-short_003/](week-05_may-28-jun-01/2026-05-29_fri_16-00_youtube-short_003/) — Cut from this week's Mon long-form. Pin first comment with /aeo-index.html link.
- **2026-05-30 sat 18:00** · ig-fb · [2026-05-30_sat_18-00_ig-fb_004/](week-05_may-28-jun-01/2026-05-30_sat_18-00_ig-fb_004/) — Wk5 Sat — IG identity card (Reel #2 sub; HeyGen for Wk8+)
- **2026-06-01 mon 11:00** · ig-fb · [2026-06-01_mon_11-00_ig-fb_005/](week-05_may-28-jun-01/2026-06-01_mon_11-00_ig-fb_005/) — Wk5 Mon — Carousel A (brand intro)

## All weeks

- [Week 5 — may-28 → jun-01](week-05_may-28-jun-01/) (7 posts)
- [Week 6 — jun-02 → jun-08](week-06_jun-02-jun-08/) (10 posts)
- [Week 7 — jun-09 → jun-15](week-07_jun-09-jun-15/) (10 posts)
- [Week 8 — jun-16 → jun-22](week-08_jun-16-jun-22/) (10 posts)
- [Week 9 — jun-23 → jun-29](week-09_jun-23-jun-29/) (10 posts)
- [Week 10 — jun-30 → jul-06](week-10_jun-30-jul-06/) (10 posts)
- [Week 11 — jul-07 → jul-13](week-11_jul-07-jul-13/) (3 posts)

## Re-run the build

Source of truth is the `POSTS` list at the top of [_automation/build.py](_automation/build.py).
To change captions, dates, or assets: edit that list and re-run:

```
python social/uploads/_automation/build.py
```

The script is idempotent. **Don't store proof-of-post screenshots inside upload folders** — they'll get wiped on next build. Put them in `social/posting-log.md` instead.
