# Carlos — Week 1 Action Sheet

**Generated:** 2026-05-01 · all auto-running pieces are LIVE; this is what needs your hands.

---

## 🟢 What's already running on its own

You don't need to do anything for these — they're firing automatically:

| | What | Where to verify |
|---|---|---|
| ✅ | All 5 P0/P1 site fixes deployed (homepage cards, pricing FAQ, blog newsletter, services FAQ, contact FAQ) | `https://netwebmedia.com` (already live) |
| ✅ | Pricing Monthly/Annual toggle with 4 tier swaps + `gtag` event | `https://netwebmedia.com/pricing.html` — click the toggle |
| ✅ | Newsletter form end-to-end validated (test sub #1104 enrolled in welcome sequence) | CRM → Contacts → ID 1104 |
| ✅ | IndexNow ping submitted (29 URLs to Bing/Yandex/AI consumers, HTTP 200) | Bing Webmaster Tools (24-48h) |
| ✅ | Tuesday AEO Brief #1 ready for May 5 9am cron | `email-templates/aeo-brief-001-launch.html` |
| ✅ | Pixel `Subscribe` event wires on any newsletter form | Live on `/blog.html` |
| ✅ | CAPI `Purchase`/`Subscribe` server-side hooks in MP webhook (no-op until secrets) | `api-php/routes/billing.php` |
| ✅ | 5 Google Calendar events on `carlos@netwebmedia.com` | Calendar |

---

## 🔴 4 things only you can do (start NOW)

### 1. Render the IG Carousel A PNGs (5 minutes)

Open this internal-only page in your browser (it's `noindex`):

> **https://netwebmedia.com/social-carousel-preview.html**

Click the orange **"Export all 15 as PNG (1080×1080)"** button. Saves 15 PNGs to your Downloads folder. You only need slides `a-slide-1.png` through `a-slide-5.png` for Carousel A.

### 2. Post Carousel A to Instagram + Facebook (10 minutes)

**Caption file:** `plans/week1-ig-launch-kit.md` (open it; copy the EN caption + hashtag stack).

Steps:
1. Open Instagram app → New post → Select 5 photos → Pick `a-slide-1.png` through `a-slide-5.png` IN ORDER
2. Skip filters → Next
3. Paste caption from the kit
4. Tag location (your home market)
5. Post
6. Open Facebook Pages app → Cross-post the same carousel (or use IG's "Also share to Facebook" toggle if it's wired)

**Optimal time:** Saturday May 2, 11:00 AM Santiago (per the calendar event I created). Posting today is fine if you'd rather not wait — algorithm doesn't penalize for early.

### 3. Add 2 GitHub Secrets for Meta CAPI (3 minutes)

Before the May 19 paid launch, you need these two new secrets so server-side conversion tracking works:

> **https://github.com/netwebmedia/netwebmedia/settings/secrets/actions**

Click "New repository secret" twice:

| Name | Where to find the value |
|---|---|
| `META_CAPI_PIXEL_ID` | Meta Events Manager → Data Sources → your Pixel → Settings → Pixel ID |
| `META_CAPI_TOKEN` | Meta Events Manager → Data Sources → your Pixel → Settings → Conversions API → Generate access token |
| `META_CAPI_TEST_CODE` | *(Optional)* Events Manager → Test Events → Test Event Code (use during testing only) |

The CAPI helper (`bl_meta_capi_fire`) will start firing Purchase + Subscribe events automatically the next time the deploy runs (which auto-injects secrets into `api-php/config.local.php`).

### 4. Record Reels (45 minutes total — when you have time this week)

Both scripts (shot list + line-by-line VO + on-screen overlays) are in:
> `plans/week1-ig-launch-kit.md`

- **Reel 1:** "Why AEO Is Beating SEO in 2026" — 30 sec, talking-head + screen recording of `aeo-index.html`
- **Reel 2:** "The 60-Second AEO Citation Index Test" — 30 sec, screen recording of the tool with animated results

Edit in CapCut (already on your machine) or hand the raw clips to whoever does post — they'll match the brand from the script.

---

## 🟡 Optional this week (lower priority)

- [ ] First **YouTube long-form** ("Why AEO Beat SEO in 2026", 8–14 min). Can wait until Wk 2.
- [ ] Pre-stage **Meta Ads Manager** campaign structure now (don't fund yet) so May 19 launch is one-click. The full spec is in `plans/week4-meta-paid-launch-kit.md`.

---

## 📊 Success thresholds for this Sunday's review (May 3, 5pm)

- Newsletter subscribers: **≥ 5** organic (excluding test sub)
- IG Carousel A reach: **≥ 1,500**
- IG Carousel A profile clicks: **≥ 40**
- AEO Index tool plays: **≥ 25**
- Sentry errors related to today's deploys: **0**

Anything below 50% of these = signal to investigate (probably distribution issue, not content).

---

## 🚨 If something breaks

| Symptom | Where to look first |
|---|---|
| Newsletter form shows error to user | Sentry → `/blog.html` events; check `/api/public/newsletter/subscribe` returns `{ok:true}` |
| Pricing toggle does nothing on click | Browser console → look for JS errors; check `applyMode` is defined |
| Tuesday email didn't fire | `crm-vanilla` cron status; queue table `email_sequence_queue WHERE status='pending'` |
| Meta Pixel not seeing events | Events Manager → Test Events → check IP filter; confirm `NWM_META_PIXEL_ID` set in deploy secrets |
| CAPI events show "skipped" in `billing_events` | `META_CAPI_PIXEL_ID` or `META_CAPI_TOKEN` not in GH Actions secrets yet (action #3 above) |

---

**Calendar reminder:** Sunday 5pm Santiago — first weekly review block. The agenda is in the calendar event description.
