# AI Lead-Gen Carousel — Instagram publish runbook

Publishes the 6-slide deck to **@netwebmedia** through `crm-vanilla/api/handlers/ig_publish.php` (carousel `d`).

**Status of prep (done for you):**
- Handler patched: `d` added to `$ALLOWED_CAROUSELS`, new `ig_carousel_def('d')` with caption + `slide_count => 6`, and the slide loop now honors `slide_count` (a/b/c stay at 5 — backward compatible).
- Export button added to `carousels/ai-lead-gen/index.html`: **"Download IG pipeline PNGs (d-slide-1…6)"**.
- IG Graph credentials: you confirmed `IG_BUSINESS_ACCOUNT_ID` + `IG_GRAPH_TOKEN` are live.

**You run steps 1–6.** Nothing below auto-posts.

---

## 1. Export the PNGs
Open `carousels/ai-lead-gen/index.html` in your browser → click **Download IG pipeline PNGs (d-slide-1…6)**. You get `d-slide-1.png` … `d-slide-6.png` at 1080×1350 (fonts render correctly on your machine).

## 2. Place the assets
Move those 6 files into:
```
NetWebMedia/assets/social/carousels/
```
so they sit beside the existing `a-slide-*.png` / `b-slide-*.png` / `c-slide-*.png`.

## 3. Deploy to production
Commit and push the two changes (assets + handler). Both are picked up by `deploy-site-root.yml`:
```
git add assets/social/carousels/d-slide-1.png assets/social/carousels/d-slide-2.png \
        assets/social/carousels/d-slide-3.png assets/social/carousels/d-slide-4.png \
        assets/social/carousels/d-slide-5.png assets/social/carousels/d-slide-6.png \
        crm-vanilla/api/handlers/ig_publish.php
git commit -m "feat(ig): add 6-slide AI lead-gen carousel (d) + assets"
git push origin main
```
Wait for the GitHub Actions FTPS deploy to finish (CSS/JS cache is irrelevant here; PNGs deploy immediately).

## 4. Confirm readiness (replace TOKEN with MIGRATE_TOKEN)
```
curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36" \
  -H "Origin: https://netwebmedia.com" -H "Referer: https://netwebmedia.com/crm-vanilla/" \
  "https://netwebmedia.com/crm-vanilla/api/?r=ig_publish&action=status&token=TOKEN"
```
Expect `"configured": true` and `"account_accessible": true`. Then inspect the deck:
```
curl -s -A "Mozilla/5.0 ... Chrome/124 Safari/537.36" \
  "https://netwebmedia.com/crm-vanilla/api/?r=ig_publish&action=spec&carousel=d"
```
This returns the 6 `image_url`s + the caption. Open one image URL in a browser to confirm it loads (a bare `curl` may return 406 from mod_security — that's expected; Meta's fetcher uses a real UA and succeeds).

## 5. Dry run (no post)
```
curl -s -X POST \
  -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36" \
  -H "Content-Type: application/json" \
  -H "Origin: https://netwebmedia.com" -H "Referer: https://netwebmedia.com/crm-vanilla/" \
  "https://netwebmedia.com/crm-vanilla/api/?r=ig_publish&action=publish&token=TOKEN" \
  --data '{"carousel":"d","dry_run":true}'
```
Confirms all 6 images are reachable and echoes the final caption. Fix any `412 unreachable` before going live.

## 6. Publish live (posts to @netwebmedia)
```
curl -s -X POST \
  -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36" \
  -H "Content-Type: application/json" \
  -H "Origin: https://netwebmedia.com" -H "Referer: https://netwebmedia.com/crm-vanilla/" \
  "https://netwebmedia.com/crm-vanilla/api/?r=ig_publish&action=publish&token=TOKEN" \
  --data '{"carousel":"d"}'
```
Success returns `"published": true` + `instagram_media_id`. Verify on the profile, or:
```
curl -s -A "Mozilla/5.0 ... Chrome/124 Safari/537.36" \
  "https://netwebmedia.com/crm-vanilla/api/?r=ig_publish&action=list&token=TOKEN"
```

## Notes
- **Idempotent:** `item_key='d'` is unique. Re-running publish after success returns `already_published` (the existing media id) instead of double-posting.
- **Caption override:** add `"caption":"..."` to the POST body to override the built-in caption.
- **To change copy:** edit the `'d'` block in `ig_carousel_def()` (caption) or re-export slides (visuals), then redeploy.
- **Process:** per your workflow, run the deck past Shannon before firing step 6.
