# Meta App Review + Dev Mode Setup Packet

> **Status:** Ready to paste-execute. 2026-05-11.
> **Owner:** Carlos hands. Every text field answered, every doc identified.
> **Goal:** Unblock `IG_BUSINESS_ACCOUNT_ID` + `IG_GRAPH_TOKEN` secrets → ig_publish goes live.
> **Two paths:** §1 Dev Mode (fast, no review) | §2 Full App Review (for scale)

---

## §0 — Decision tree (read first)

Are we publishing only to **our own** @netwebmedia account, or also to client accounts via NWM?

- **Own account only** → **§1 Dev Mode path**. NO Meta App Review required. ~90 min Carlos hands. IG goes live same day.
- **Also client accounts** → **§2 Full App Review**. Required to scale beyond your own roles. 7–21 day Meta review wait.

For the May campaign + first 6 months of NWM social: **§1 is sufficient.** Run §2 in parallel only if you plan to publish on behalf of client IG accounts.

---

## §1 — Development Mode setup (paste-execute)

### Pre-flight checklist

- [ ] @netwebmedia IG account converted to Business or Creator (mobile app, 5 min)
- [ ] NetWebMedia Facebook Page exists and you (Carlos Martinez, carlos@netwebmedia.com) are admin
- [ ] Phone available for 2FA on both FB and IG

### Step 1 — Convert @netwebmedia IG to Business (5 min)

1. Open Instagram mobile app → @netwebmedia profile → ☰ → Settings and privacy
2. "For professionals" → Account type → **Switch to Professional Account** → Business
3. Pick category: **Marketing Agency** (use search bar)
4. Fill contact info:
   - Email: `hello@netwebmedia.com`
   - Phone: (your business phone — optional)
   - Website: `https://netwebmedia.com`
5. Tap Done. Skip the "connect to Facebook" prompt — Step 2 handles this cleanly.

### Step 2 — Link IG to FB Page (10 min, desktop)

1. Open https://business.facebook.com → log in as NetWebMedia FB Page admin
2. ☰ → Settings → Business assets → Accounts → Instagram accounts → **Add → Connect an Instagram account**
3. Authenticate as @netwebmedia.
4. Back in Business Suite: ☰ → Settings → Business assets → Pages → NetWebMedia FB Page → Linked Instagram Account → confirm @netwebmedia is linked.
5. **Save the Instagram Business Account ID.** It appears as a 16-digit number on @netwebmedia's settings panel. Copy it. This becomes `IG_BUSINESS_ACCOUNT_ID`.

### Step 3 — Create Meta App + add Instagram Graph product (15 min)

1. Open https://developers.facebook.com/apps → **Create app**
2. Configuration:
   - **Use case:** Other
   - **App type:** Business
   - **App name:** `NetWebMedia Social Publisher`
   - **App contact email:** `hello@netwebmedia.com`
   - **Business portfolio:** NetWebMedia (or create one if missing)
3. From the new app's dashboard → **Add products** → add:
   - **Instagram Graph API** (or "Instagram" depending on Meta's current naming — same product)
   - **Facebook Login for Business** (required dependency)
4. Confirm **App Mode** in the top bar shows "Development" (default — leave it).
5. Roles → confirm you (Carlos) are listed as Admin.

### Step 4 — Generate long-lived IG token via Graph API Explorer (20 min)

1. App dashboard → **Tools** → **Graph API Explorer**
2. Top right: select your app from the dropdown.
3. **User or Page** → "Get Page Access Token" → select **NetWebMedia FB Page** → authorize all the permissions in the popup:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `instagram_basic`
   - `instagram_content_publish`
4. Copy the **short-lived Page access token** shown in the field below.
5. Exchange it for a long-lived token (60 days, can refresh indefinitely):
   ```
   GET https://graph.facebook.com/v20.0/oauth/access_token
       ?grant_type=fb_exchange_token
       &client_id=<YOUR_APP_ID>
       &client_secret=<YOUR_APP_SECRET>
       &fb_exchange_token=<SHORT_LIVED_TOKEN>
   ```
   Run that in the browser address bar (yes, GET works) or `curl`. Returns:
   ```json
   {"access_token": "EAAB...long-string...", "expires_in": 5184000}
   ```
6. Copy the long-lived `access_token`. **This is `IG_GRAPH_TOKEN`.**

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
# Get your admin auth token first by logging into /crm-vanilla/ in browser
# then extracting nwm_token from localStorage. OR call /api/auth/login.
curl -s "https://netwebmedia.com/crm-vanilla/api/?r=ig_publish&action=status" \
  -H "X-Auth-Token: <admin-token>"
```

Expected response shape:
```json
{
  "configured": true,
  "ig_business_account_id": "17841...",
  "ig_token_status": "valid",
  "creator_info": { "...": "..." }
}
```

If `configured: false` — the secret didn't flow. Check the latest deploy run for errors in the config-gen step.

### Step 7 — First IG publish (1 min)

Dry-run first:
```bash
curl -X POST "https://netwebmedia.com/crm-vanilla/api/?r=ig_publish&action=publish" \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: <admin-token>" \
  -d '{"carousel":"a","dry_run":true}'
```

That returns the IG-ready 3-step payload (upload children → create CAROUSEL container → media_publish). Verify it looks right. Then go live:
```bash
curl -X POST "https://netwebmedia.com/crm-vanilla/api/?r=ig_publish&action=publish" \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: <admin-token>" \
  -d '{"carousel":"a","dry_run":false}'
```

Carousel `a` publishes to @netwebmedia. Check Instagram app on your phone within 30 seconds to confirm.

**Total elapsed time §1: ~90 minutes. IG goes live today.**

---

## §2 — Full App Review submission (only if scaling to client accounts)

Required ONLY if you plan to publish to IG accounts other than @netwebmedia (i.e., on behalf of clients with their permission). Skip this unless that's the goal.

### Permissions to request

| Permission | Why | Review difficulty |
|---|---|---|
| `instagram_content_publish` | Post content to IG accounts | **Hard** (App Review required) |
| `instagram_basic` | Read IG profile data | Easy (granted automatically with Business apps) |
| `pages_show_list` | List FB Pages user manages | Easy |
| `pages_read_engagement` | Read FB Page insights | Easy |
| `pages_manage_posts` | Post to FB Page on user's behalf | Medium |

### Use-case description (paste verbatim into the App Review submission form)

> NetWebMedia is an AI-native marketing agency serving SMB clients across 14 verticals (tourism, restaurants, health, beauty, legal, etc.). We provide Fractional CMO services that include scheduled social content publishing across Instagram, Facebook, and TikTok on behalf of clients who explicitly authorize us via Meta Business Suite role grants.
>
> Our internal CRM (crm-vanilla, custom-built) handles the publishing workflow. An admin operator (Carlos Martinez, NetWebMedia founder) reviews and approves each post via an internal dashboard before triggering publication. The Meta Graph API is called server-side via the `ig_publish.php` handler with the long-lived access token associated with the authorized Page+Instagram pair. No automated content generation, no bulk publishing without human approval.
>
> Authorization model: Each client signs an engagement letter granting NetWebMedia admin role on their FB Page and linked IG Business account via Meta Business Suite role management. We do not request `instagram_content_publish` for accounts where we are not formally authorized.

### Screencast script (record at https://www.loom.com — upload unlisted to YouTube, paste URL)

**0:00–0:15 — Setup:** Show your screen with the NetWebMedia CRM admin dashboard open. Voice-over: "This is NetWebMedia's internal CRM. As a marketing agency operator, I publish social content for our own brand and for clients who have authorized us via Meta Business Suite."

**0:15–0:35 — Show authorization:** Navigate to Meta Business Suite → Settings → Business assets → Pages → show NetWebMedia FB Page + linked IG account. Voice-over: "Here's the @netwebmedia Business account I'm authorized to publish to."

**0:35–1:00 — Show the publish workflow:** Open `/crm-vanilla/api/?r=ig_publish&action=spec&carousel=a` in browser to show the JSON payload. Voice-over: "When I trigger a publish, the handler validates the carousel content, verifies image URLs are reachable, then makes 3 sequential Graph API calls."

**1:00–1:30 — Show the dry-run safety:** Show a `curl` call with `dry_run: true`. Voice-over: "Before any live publish, we run a dry-run to verify the payload. The handler only fires the actual Graph API calls after human admin confirmation."

**1:30–2:00 — Show a live publish + IG result:** Fire the live publish (`dry_run: false`). Then open Instagram on your phone within 30 seconds and show the new carousel on @netwebmedia. Voice-over: "This is the published carousel. End user (followers) see content authorized by the account owner and reviewed by the operator."

### Business verification docs needed

| Doc | Where to get it | Notes |
|---|---|---|
| Business registration | SII (Chilean tax authority) | RUT certificate for NetWebMedia |
| Tax ID / VAT | Same SII | |
| Utility bill / office lease | Office address on file | Within 6 months |
| Director ID | Your Chilean RUT / passport | |
| Business website screenshot | https://netwebmedia.com | Just a screenshot of the homepage |

Meta requires these for any app handling permissions like `instagram_content_publish`. Upload during App Review submission.

### Expected timeline

- Day 0: Submit
- Days 1–3: Meta auto-checks (most apps fail here on missing docs — make sure all 5 docs above are uploaded)
- Days 4–14: Manual human review (Meta reviewer watches your screencast, tries to find issues)
- Day 14: Decision. ~60% of apps pass first review. If rejected, you'll get specific feedback — address and resubmit. Each cycle is another 7–14 days.

**Realistic ETA from your submit-day:** 2–4 weeks for first approval.

---

## §3 — Status of NWM secrets infrastructure (read-only reference)

| Secret | Status | Used by |
|---|---|---|
| `FB_PAGE_ID` | ✅ Set (production) | `fb_publish.php` |
| `FB_PAGE_TOKEN` | ✅ Set (production) | `fb_publish.php` |
| `IG_BUSINESS_ACCOUNT_ID` | 🟡 Wired in deploy workflow, not set | `ig_publish.php` (returns 503 until set) |
| `IG_GRAPH_TOKEN` | 🟡 Wired in deploy workflow, not set | `ig_publish.php` (returns 503 until set) |
| `IG_IMAGE_BASE_URL` | 🟡 Wired with default `https://netwebmedia.com` | `ig_publish.php` |
| `TT_ACCESS_TOKEN` | 🟡 Wired, not set | `tt_publish.php` (returns 503) |
| `TT_CLIENT_KEY` | 🟡 Wired, not set | `tt_publish.php` |
| `TT_REEL_BASE_URL` | 🟡 Wired with default | `tt_publish.php` |
| `MIGRATE_TOKEN` | ✅ Set (rotated) | `fb_publish.php`, `tt_publish.php`, `cron_workflows.php`, `migrate.php` |

Wiring done by `.github/workflows/deploy-site-root.yml` lines ~294–305 (config.local.php generation) + lines ~357–365 (env vars).

---

## §4 — Quick fire commands (after §1 secrets land)

**Smoke test IG status:**
```bash
curl -s -H "X-Auth-Token: <admin>" "https://netwebmedia.com/crm-vanilla/api/?r=ig_publish&action=status"
```

**Dry-run publish carousel `a` (3 brand intro slides exist) or campaign-cmo-en (6 slides):**
```bash
# campaign-cmo-en — IG carousel publish (currently ig_publish ships built-in carousels a/b/c only;
# campaign-cmo-en uses a/b/c slot 'a' style format. To publish campaign-cmo-en, either
# (i) extend ig_publish.php's ig_carousel_def() to add 'cmo' carousel, or
# (ii) use the FB cross-poster which already supports the campaign-cmo-en image_urls[])
curl -s -X POST -H "X-Auth-Token: <admin>" -H "Content-Type: application/json" \
  "https://netwebmedia.com/crm-vanilla/api/?r=ig_publish&action=publish" \
  -d '{"carousel":"a","dry_run":true}'
```

**Manual phone post (zero infrastructure needed):**
1. AirDrop / sync the PNGs from `assets/social/higgsfield/campaign-cmo-en/` to your phone
2. IG app → + → Post → multi-select 6 slides → caption from `caption.txt` → Share

The manual path works TODAY. The API path works after §1 (or §2 if scaling to clients).
