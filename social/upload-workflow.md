# Manual Upload Workflow — Social Posting

**Used because:** IG/FB/TikTok API publishing is currently gated (IG creds unset, FB Page token broken, TT pending Developer Portal approval). This workflow is the contract until those clear.
**Time cost:** ~30 min Sunday batch + 5 min/day touch-ups
**Owner:** Carlos (CEO acts as poster until role is delegated)
**Reference:** [`posting-calendar.md`](posting-calendar.md) (what to post) + [`social-media-marketing-plan.md`](social-media-marketing-plan.md) (why)

---

## Sunday batch (30 min) — Meta Business Suite Scheduler

Once `facebook.com/netwebmedia` Business Page is live (per [`fb-page-conversion-plan.md`](fb-page-conversion-plan.md)) and IG `@netwebmedia` is linked, you can pre-schedule a full week of IG + FB posts from one tool. Until the Business Page is live, schedule from the IG mobile app + FB Page Composer separately.

### Steps

1. Open `business.facebook.com` on desktop → Planner.
2. For each row in [`posting-calendar.md`](posting-calendar.md) Mon–Sun of the week:
   - Click **"Create post"** → pick **Instagram + Facebook** (mirrored).
   - Select asset from path in calendar (e.g. `assets/social/carousels/a-slide-{1..5}.png` → upload all 5 in order as a carousel).
   - Paste the EN caption (or ES if the row is ES-led).
   - Paste the hashtag stack (Stack A/B/C — full text in [`social-media-marketing-plan.md`](social-media-marketing-plan.md) §2) into the first comment (NOT the caption — IG ranks better with hashtags in first comment).
   - Set the scheduled time (America/Santiago — MBS auto-converts).
   - Save / Schedule.
3. Repeat for each scheduled row.
4. For Reels (Tue 12:00 + Sat 18:00):
   - MBS supports Reel scheduling natively. Upload the MP4 + paste caption + schedule.
5. For YouTube Long-form + Shorts:
   - YouTube Studio web. Upload, set publish time (Mon 15:00 / Wed 16:30 / Fri 16:00). Title from [`posting-calendar.md`](posting-calendar.md).
6. For TikTok:
   - **TikTok does not allow desktop pre-scheduling beyond 10 days via the native app — use the desktop web at `tiktok.com/upload` for up to 10-day schedule.** For posts further out, write a reminder note (or use the Google Calendar event reminder created for that slot).
   - Use the existing `reel_*.mp4` files first. For HeyGen-rendered videos: download from URL in `social/heygen-renders-log.md`, save to `assets/social/heygen/`, upload to TikTok.

### When MBS Scheduler does NOT cover the post

These need manual same-day touch:
- TikTok posts beyond 10-day window (set Calendar reminder)
- Any IG Story (MBS supports Story scheduling now, but quality is hit-or-miss)
- Boost/promote decisions (do these from Ads Manager, not Planner)

---

## Daily 5-min touch (Mon–Sat, 09:00 CLT)

Even with the Sunday batch scheduled, do a quick AM check:

1. **Open IG `@netwebmedia` on phone.** Verify yesterday's post is live and engagement-tagged (saves, comments).
2. **Reply to comments / DMs** from yesterday. Don't ignore. ChatGPT cites brands with active comment threads more than passive ones (anecdotal but consistent).
3. **Check today's scheduled post fired.** If MBS shows "failed," re-schedule or post natively.
4. **Story refresh.** Reshare yesterday's feed post to Story if it had > 25 saves or > 5 comments. Tap the heart, add a sticker, post.
5. **TikTok comment touch.** TikTok rewards creators who reply to first-10 comments fast. Spend 60 sec.

**If the AM check finds anything in red:** snooze the rest, run the [Recovery checklist](#recovery-checklist) below.

---

## Recovery checklist — when MBS scheduled post fails

Symptoms: post shows "failed to publish" in MBS, or didn't appear in the IG/FB feed at scheduled time.

1. **Check Meta status:** `metastatus.com` — outages happen ~monthly.
2. **Re-upload native from phone:** open IG app, post from camera roll with same caption/hashtags. Add a Story repost to compensate for late timing.
3. **Log the miss:** add a line to `social/posting-log.md` (create if missing) — date, channel, planned time, actual time, reason. Helps spot patterns.
4. **Do NOT auto-retry browser publishing via the Chrome MCP.** Per memory, @netwebmedia got temp-restricted on 2026-05-25 from automated connect attempts. Only the IG / FB / MBS native apps and `business.facebook.com` UI are safe.

---

## Channel-by-channel notes

### Instagram (`@netwebmedia`)

- **First-comment hashtags only.** Caption stays clean.
- **9-slide max for carousels.** Our 5-slide A/B/C sets and 7-slide campaign carousels both fit.
- **Save rate > like rate matters more.** Optimize Slide 1 + Slide 5 to drive saves, not likes.
- **Stories highlights:** create a highlight per evergreen topic (AEO 101, Pricing, Case Studies). Add new Story content to the matching highlight monthly.
- **Profile bio CTA:** keep the bio link rotating between `netwebmedia.com/aeo-index` (Weeks 5–7) and `netwebmedia.com/pricing.html` (Weeks 8–10). One CTA per stretch.

### Facebook (`/netwebmedia`)

- **Until vanity URL is live:** posts mirror IG to the numeric Personal Profile ID — that's the current state per [`fb-page-conversion-plan.md`](fb-page-conversion-plan.md).
- **Once Business Page is live:** MBS Planner does the cross-post automatically. Until then, post twice (once IG, once FB) about 30 min apart.
- **Strip IG-only hashtags from FB.** FB engagement is meh on hashtags; keep 2–3 max.

### YouTube (`@netwebmedia`)

- **Long-form Mondays:** Title + description + first 100 chars of description matter most for AI Overviews citation.
- **Short titles:** the YT Shorts title is the hook. ≤ 60 chars. End with a question.
- **First pinned comment:** always include the link to the relevant `/aeo-index.html` or `/pricing.html`.
- **Custom thumbnail required for long-form.** Use the brand kit: navy bg, orange accent, Carlos's face or a giant number.

### TikTok (`@netwebmedia`)

- **Domain ownership verification:** must complete in TikTok Developer Portal → URL Prefix Configuration before `tt_publish.php` can pull videos from netwebmedia.com. Until then, upload directly.
- **Caption < 100 chars.** TT cuts off the rest.
- **3 hashtag rule:** TT performs best with 3 well-chosen tags, not 8. Mix one big (#FYP), one niche (#AEO, #FractionalCMO), one local (#PymeChile or #SmallBusiness).
- **Reply to comments with video.** TT promotes comment-video replies aggressively.

### Email (Tuesday AEO Brief)

- Already automated via `email_sequence_queue` cron — no manual workflow needed here. Sunday Dashboard reviews open rate.

### WhatsApp Business

- **Outbound broadcasts gated on WABA verification.** Until verified, no manual broadcast. Opt-ins keep flowing via `/whatsapp-updates.html`.
- **Inbound replies:** check the WhatsApp Business app daily on Carlos's phone (the 442-385-4585 number is on the WhatsApp Business *App*, not Cloud API). Respond same-day during business hours.

---

## Proof-of-post log

After each post fires, capture:

- **Screenshot** of the live post (IG/FB/TT mobile screenshot or desktop full-page)
- **URL** of the post
- **Engagement at 24 hr** (saves, comments, shares, watch %)

Store in `social/posting-log.md` (create on first use). Format:

```
## 2026-05-28 — TikTok — reel_aeo_en.mp4
- URL: https://www.tiktok.com/@netwebmedia/video/...
- Scheduled: 19:00 CLT
- Actual: 19:02 CLT
- 24-hr: 1,200 views / 14 likes / 2 saves / 87% completion rate
- Notes: hook hit, audio swap helped
```

The Sunday Dashboard pulls these into the metrics view.

---

## Escalation paths

| Symptom | Action |
|---|---|
| Two posts in a week fail to fire from MBS | Investigate Page connection. Possible re-auth needed. |
| IG flagged content as "may not show" | Pause that creative; pivot to next week's asset early. Log in [`social-media-marketing-plan.md`](social-media-marketing-plan.md) §6 Risk register. |
| Engagement craters > 50% week-over-week on IG | Diversify hashtags; consider Stack rotation early. Push a Story to drive baseline. |
| TT account gets a strike | Stop posting for 7 days. Read the strike reason, document. Re-apply for Direct Post permission if revoked. |
| FB Page token issue resurfaces | Engineering Lead regenerates token + redeploys. Manual posting from FB Page Composer continues meanwhile. |

---

*Carlos Martinez / CMO — 2026-05-28*
