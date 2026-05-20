# Social Publishing — Unblock Runbook

> **Status:** Active. 2026-05-11.
> **Owner:** Carlos hands. Each section is paste-ready, no decisions remaining.
> **Goal:** Get @netwebmedia posting programmatically to Facebook, Instagram, and TikTok.

---

## What's already done (no action needed)

- ✅ Facebook handler [`fb_publish.php`](../crm-vanilla/api/handlers/fb_publish.php) — live in production. Secrets `FB_PAGE_ID` + `FB_PAGE_TOKEN` set. **Posting works right now.**
- ✅ Instagram handler [`ig_publish.php`](../crm-vanilla/api/handlers/ig_publish.php) — code complete. 15 carousel PNGs verified 200-reachable. Blocked only on `IG_BUSINESS_ACCOUNT_ID` + `IG_GRAPH_TOKEN` secrets.
- ✅ TikTok handler [`tt_publish.php`](../crm-vanilla/api/handlers/tt_publish.php) — code complete. 6 reels (AEO/Growth/Scale × EN/ES) catalogued with captions. Blocked only on `TT_ACCESS_TOKEN` secret + domain verification.
- ✅ `deploy-site-root.yml` plumbs all 8 new secrets into `crm-vanilla/api/config.local.php` on every deploy.
- ✅ `/social/` hub badge for TikTok flipped from "Q3 2026" → "Activating".
- ✅ CLAUDE.md durable decision updated.

---

## §1 — Instagram **fast path** (Development Mode, ~90 minutes, NO App Review)

> **Why this works:** Meta's App Review requirement applies to apps that publish to *other people's* Instagram accounts. We only publish to **our own** @netwebmedia. In Development Mode, a Meta App can post to any IG Business account where the app's owner has admin role — instantly, no review.

### Step 1 — Convert @netwebmedia IG to Business (5 min, IG mobile app)

1. Open Instagram → @netwebmedia profile → ☰ → Settings and privacy
2. "For professionals" → Account type → **Switch to Professional Account** → Business
3. Pick category: **Marketing Agency** (use search)
4. Fill contact: email `hello@netwebmedia.com`, website `https://netwebmedia.com`
5. Skip the "connect Facebook" prompt for now — we do it cleanly in Step 2.

### Step 2 — Link IG to FB Page in Meta Business Suite (10 min, desktop)

1. Open https://business.facebook.com → log in as the NetWebMedia FB Page admin
2. ☰ → Settings → **Business assets** → Accounts → Instagram accounts → **Add → Connect an Instagram account**
3. Log in as @netwebmedia, authorize.
4. Back in Business Suite: ☰ → Settings → Business assets → Pages → NetWebMedia FB Page → **Linked Instagram Account** → confirm @netwebmedia is linked.
5. Note the **Instagram Business Account ID** — it appears under @netwebmedia's settings as a 16-digit number. **Save this.** This is `IG_BUSINESS_ACCOUNT_ID`.

### Step 3 — Create Meta App + add Instagram Graph product (15 min)

1. Go to https://developers.facebook.com/apps → **Create app**
2. Use case: **Other** → app type: **Business** → name: `NetWebMedia Social Publisher`
3. In the new app's Dashboard → **Add products** → add:
   - **Instagram Graph API**
   - **Facebook Login for Business** (required dependency)
4. Settings → Basic → confirm **App Mode** says "Development" (default, leave it).
5. Roles → **Roles** → confirm you (Carlos) are listed as Admin. Add @netwebmedia's IG account as a "Tester" if prompted later.

### Step 4 — Generate long-lived IG access token (20 min)

1. From your app dashboard → **Tools** → **Graph API Explorer**
2. Top right: select your app from the dropdown.
3. **User or Page** → "Get Page Access Token" → select the NetWebMedia FB Page → authorize all the permissions in the popup (`pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`, `instagram_content_publish`).
4. Copy the **short-lived Page access token** that appears in the field.
5. Exchange it for a long-lived token (60 days, can refresh indefinitely):
   ```
   GET https://graph.facebook.com/v20.0/oauth/access_token
       ?grant_type=fb_exchange_token
       &client_id=<YOUR_APP_ID>
       &client_secret=<YOUR_APP_SECRET>
       &fb_exchange_token=<SHORT_LIVED_TOKEN>
   ```
   Run that in your browser (yes, GET works) or `curl`. Returns `{"access_token": "...", "expires_in": 5184000}`.
6. Copy the long-lived token. **This is `IG_GRAPH_TOKEN`.**

### Step 5 — Set GitHub Secrets + redeploy (5 min)

From a terminal in the NetWebMedia repo:

```bash
gh secret set IG_BUSINESS_ACCOUNT_ID --body "<16-digit-id-from-step-2>"
gh secret set IG_GRAPH_TOKEN          --body "<long-lived-token-from-step-4>"
git commit --allow-empty -m "deploy: wire IG_BUSINESS_ACCOUNT_ID + IG_GRAPH_TOKEN" && git push origin main
```

Wait ~3 min for `Deploy site root` workflow to finish.

### Step 6 — Smoke test (2 min)

```bash
curl -s "https://netwebmedia.com/crm-vanilla/api/?r=ig_publish&action=status" \
  -H "X-Auth-Token: <your-admin-token>"
```

Expected: `{"configured": true, "ig_business_account_id": "...", ...}`. If 503, the secret didn't flow — check the latest deploy log.

### Step 7 — First IG publish (1 min)

```bash
curl -X POST "https://netwebmedia.com/crm-vanilla/api/?r=ig_publish&action=publish" \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: <your-admin-token>" \
  -d '{"carousel":"a","dry_run":true}'
```

`dry_run:true` returns the IG-ready payload without posting. Verify it looks right, then re-run with `dry_run:false` to publish carousel `a` ("Who we are") to @netwebmedia.

### Step 8 — Service-reels batch publish (the 9 R2..R10 reels)

After Steps 1–6 leave IG_BUSINESS_ACCOUNT_ID + IG_GRAPH_TOKEN configured, the 9 NetWebMedia service reels (from `assets/social/higgsfield/service-reels-2026/`) publish via the extended `ig_publish.php` handler in three commands:

```bash
# 1. Readiness probe
MIGRATE_TOKEN=<value> python3 _deploy/publish-service-reels.py --check

# 2. Dry-run all 9 (logs to ig_publish_log as 'dry_run', no Meta calls)
MIGRATE_TOKEN=<value> python3 _deploy/publish-service-reels.py --dry-run

# 3. Live publish all 9 (~90 sec each, sequential, ~15 min total wall time)
MIGRATE_TOKEN=<value> python3 _deploy/publish-service-reels.py
```

Per-reel publish is idempotent on `reel_key` — re-running skips already-`complete` rows and resumes `processing` rows. To publish only a subset: `--only R2,R3,R4`.

**Total elapsed time: ~90 minutes setup + ~15 min publish. IG goes live today.**

---

## §2 — TikTok (2–4 week review, no shortcut)

Unlike Meta, TikTok's Content Posting API has no "development mode" — it requires formal review even for posting to your own account.

### Step 1 — Apply for TikTok developer access (10 min today)

1. Go to https://developers.tiktok.com → **Manage apps** → **Connect an app**
2. App name: `NetWebMedia Reel Publisher`. Category: Marketing.
3. Business verification: upload Chilean SII RUT certificate + utility bill. (TikTok accepts non-US business docs.)

### Step 2 — Add Content Posting API + Direct Post (5 min today)

1. App dashboard → **Add products** → check:
   - ✅ Login Kit
   - ✅ Content Posting API
   - ✅ **Direct Post** (sub-product under Content Posting API — this is the auto-publish permission)
2. For each product, fill the use-case form:
   - **Use case:** "NetWebMedia is a marketing agency. We publish our own brand reels (AEO/Growth/Scale themes, EN+ES, 3-2 min each) on a weekly cadence to @netwebmedia. No third-party content. No user-generated content. Posting is admin-triggered from our internal CRM."
   - **Demo video script:** record a 60-sec screen capture showing: (a) hitting `?r=tt_publish&action=spec&reel=1_aeo_en` in browser → JSON payload, (b) hitting `action=publish&dry_run=true` → success, (c) explaining live publish only fires on admin command. Upload to YouTube unlisted, paste URL.
3. Required scopes — request all three: `video.publish`, `video.upload`, `user.info.basic`.

### Step 3 — Verify domain ownership (10 min today)

1. App settings → **URL Prefix Configuration** → **Add URL prefix**
2. Enter: `https://netwebmedia.com/assets/social/campaign/`
3. TikTok shows a TXT record value. Add it as a DNS TXT on `netwebmedia.com` via InMotion cPanel → DNS → Add Record.
4. Wait 10–30 min for DNS propagation, then click **Verify** in TikTok dashboard.
5. Without this, `tt_publish.php` will get `url_ownership_unverified` errors.

### Step 4 — Submit for review (5 min today, then wait)

App dashboard → **Submit for review**. TikTok review: 2–4 weeks. They may email follow-up questions; respond within 48h or the submission deprioritizes.

### Step 5 — When approved (~Q3 ETA realistic)

```bash
gh secret set TT_ACCESS_TOKEN --body "<token-from-tiktok-oauth-flow>"
gh secret set TT_CLIENT_KEY   --body "<client-key-from-app-dashboard>"
git commit --allow-empty -m "deploy: wire TT_ACCESS_TOKEN + TT_CLIENT_KEY" && git push origin main
```

Then smoke-test + first publish:

```bash
# readiness
curl -s "https://netwebmedia.com/crm-vanilla/api/?r=tt_publish&action=status&token=<MIGRATE_TOKEN>"

# dry-run AEO English reel
curl -X POST "https://netwebmedia.com/crm-vanilla/api/?r=tt_publish&action=publish&token=<MIGRATE_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"reel":"1_aeo_en","dry_run":true}'

# live publish
curl -X POST "https://netwebmedia.com/crm-vanilla/api/?r=tt_publish&action=publish&token=<MIGRATE_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"reel":"1_aeo_en"}'

# poll status (TT processes asynchronously; takes 30–120s)
curl -X POST "https://netwebmedia.com/crm-vanilla/api/?r=tt_publish&action=status_check&token=<MIGRATE_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"publish_id":"<from-previous-response>"}'
```

---

## §3 — Facebook (already live — first scheduled post)

Decision: which May campaign piece goes up first?

| Option | Format | Asset | Recommended slot |
|---|---|---|---|
| **A** | Carousel | `a-slide-{1..5}.png` ("Who we are") | Tue 2026-05-13 09:00 ET |
| **B** | Video | `reel_1_aeo_en_final.mp4` | Wed 2026-05-14 12:00 ET |
| **C** | Carousel | `aeo_en_slide_{1..7}.png` (long-form AEO explainer) | Thu 2026-05-15 09:00 ET |

Pick one (or all three) and tell me — I'll fire the `fb_publish&action=schedule` call with `dry_run: true` first to verify the payload, then `dry_run: false` to schedule.

The 10-min FB minimum lead time means scheduled posts must be >= now+10min. Standard practice: schedule for the next morning 09:00 ET so we don't post at random hours.

---

## §4 — Cross-posting orchestrator (next phase, when IG is live)

Once IG and TT are both live, build `crm-vanilla/api/handlers/social_broadcast.php`:

```
POST /api/?r=social_broadcast&action=publish&token=<MIGRATE_TOKEN>
body: {
  channels: ["fb", "ig", "tt"],
  asset_set: "may_aeo_en",     // bundle of reel + carousel + caption
  schedule_at_unix: 1747393200
}
```

Calls fb_publish, ig_publish, tt_publish sequentially with content adapted per channel (FB gets video + carousel link, IG gets carousel, TT gets reel). Audit-logs to `social_broadcast_log`. Not in scope for today — opens after IG is verified live.

---

## Estimated Carlos hours-to-live

| Channel | Hours today | Calendar wait |
|---|---|---|
| **Facebook** | 0 (just pick content option A/B/C) | 0 — live now |
| **Instagram** | ~1.5 (steps 1–7 above) | 0 — live today |
| **TikTok** | ~0.5 (submit app + DNS verify) | 14–28 days TikTok review |

After today: cross-posting orchestrator + WhatsApp re-entry (after WABA verification, target June 2026).
