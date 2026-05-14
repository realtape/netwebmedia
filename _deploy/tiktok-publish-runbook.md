# TikTok Publish Runbook — 6 Campaign Reels

**Date:** 2026-05-14
**Target:** @netwebmedia on TikTok
**Handler:** `crm-vanilla/api/handlers/tt_publish.php` (already wired)
**Idempotency:** Each `reel_key` is guarded for 24h — re-running same reel returns existing publish_id without re-calling TikTok

---

## Pre-flight (run once before publishing)

```bash
# Set your token once per terminal session
export MIGRATE_TOKEN='<paste MIGRATE_TOKEN from GitHub Secrets>'

# Probe readiness — verifies TT_ACCESS_TOKEN + creator info
curl -s -A "Mozilla/5.0" \
  "https://netwebmedia.com/crm-vanilla/api/?r=tt_publish&action=status&token=$MIGRATE_TOKEN" | jq .
```

**Expected:** `{"configured":true,"creator_ok":true,"creator_info":{...},"reels_available":[6 keys]}`

If `creator_ok=false`, check `error` field — usually means TikTok rejected the token (scopes missing, or domain ownership for `https://netwebmedia.com/assets/social/campaign/` not verified in TikTok Developer Portal).

---

## Dry-run any reel first (recommended)

```bash
curl -s -X POST -A "Mozilla/5.0" \
  -H "Content-Type: application/json" \
  -d '{"reel":"1_aeo_en","dry_run":true}' \
  "https://netwebmedia.com/crm-vanilla/api/?r=tt_publish&action=publish&token=$MIGRATE_TOKEN" | jq .
```

**Expected:** `{"reel_key":"1_aeo_en","status":"dry_run","spec":{...},"note":"Dry run logged..."}`

Inspect the `spec.post_info.title` to confirm caption is what you want before live publishing.

---

## Publish — fire one at a time

I recommend **spreading these across 5–6 hours** (TikTok's algorithm penalizes burst-posting from new accounts). Cadence proposal: one per hour for 6 hours, or two per day for 3 days.

### Reel 1: AEO (English)

```bash
curl -s -X POST -A "Mozilla/5.0" \
  -H "Content-Type: application/json" \
  -d '{"reel":"1_aeo_en"}' \
  "https://netwebmedia.com/crm-vanilla/api/?r=tt_publish&action=publish&token=$MIGRATE_TOKEN" | jq .
```

### Reel 2: AEO (Spanish)

```bash
curl -s -X POST -A "Mozilla/5.0" \
  -H "Content-Type: application/json" \
  -d '{"reel":"1_aeo_es"}' \
  "https://netwebmedia.com/crm-vanilla/api/?r=tt_publish&action=publish&token=$MIGRATE_TOKEN" | jq .
```

### Reel 3: Growth (English)

```bash
curl -s -X POST -A "Mozilla/5.0" \
  -H "Content-Type: application/json" \
  -d '{"reel":"2_growth_en"}' \
  "https://netwebmedia.com/crm-vanilla/api/?r=tt_publish&action=publish&token=$MIGRATE_TOKEN" | jq .
```

### Reel 4: Growth (Spanish)

```bash
curl -s -X POST -A "Mozilla/5.0" \
  -H "Content-Type: application/json" \
  -d '{"reel":"2_growth_es"}' \
  "https://netwebmedia.com/crm-vanilla/api/?r=tt_publish&action=publish&token=$MIGRATE_TOKEN" | jq .
```

### Reel 5: Scale (English)

```bash
curl -s -X POST -A "Mozilla/5.0" \
  -H "Content-Type: application/json" \
  -d '{"reel":"3_scale_en"}' \
  "https://netwebmedia.com/crm-vanilla/api/?r=tt_publish&action=publish&token=$MIGRATE_TOKEN" | jq .
```

### Reel 6: Scale (Spanish)

```bash
curl -s -X POST -A "Mozilla/5.0" \
  -H "Content-Type: application/json" \
  -d '{"reel":"3_scale_es"}' \
  "https://netwebmedia.com/crm-vanilla/api/?r=tt_publish&action=publish&token=$MIGRATE_TOKEN" | jq .
```

Each call returns a `publish_id` like `v_pub_url~v2.123...`. Save it.

---

## Poll status — confirm publish completed

TikTok's upload + processing is async. Each `publish_id` should be polled every 5–10s until `PUBLISH_COMPLETE` (typically 30–90s after init).

```bash
# Substitute PUBLISH_ID from the publish response
PUBLISH_ID='v_pub_url~v2.YOURIDHERE'

curl -s -X POST -A "Mozilla/5.0" \
  -H "Content-Type: application/json" \
  -d "{\"publish_id\":\"$PUBLISH_ID\"}" \
  "https://netwebmedia.com/crm-vanilla/api/?r=tt_publish&action=status_check&token=$MIGRATE_TOKEN" | jq '.tt_status, .data'
```

**Statuses:**
- `PROCESSING_UPLOAD` — TikTok is downloading the video. Wait.
- `PROCESSING_DOWNLOAD` — TikTok is processing. Wait.
- `PUBLISH_COMPLETE` — Live on @netwebmedia. The `data.publicaly_available_post_id` or `data.post_id` gives the post URL component.
- `FAILED` / `PROCESSING_FAILED` / `PUBLISH_FAILED` — check the `data.fail_reason`. Most common: `url_ownership_unverified` (domain TXT not set in TikTok Developer Portal) or scope missing.

### One-liner that auto-polls until terminal

```bash
PUBLISH_ID='v_pub_url~v2.YOURIDHERE'
while true; do
  s=$(curl -s -X POST -A "Mozilla/5.0" -H "Content-Type: application/json" \
        -d "{\"publish_id\":\"$PUBLISH_ID\"}" \
        "https://netwebmedia.com/crm-vanilla/api/?r=tt_publish&action=status_check&token=$MIGRATE_TOKEN" \
        | jq -r '.tt_status')
  echo "$(date +%T) $s"
  case "$s" in
    PUBLISH_COMPLETE|FAILED|PROCESSING_FAILED|PUBLISH_FAILED) break ;;
  esac
  sleep 8
done
```

---

## View audit log

```bash
curl -s -A "Mozilla/5.0" \
  "https://netwebmedia.com/crm-vanilla/api/?r=tt_publish&action=list&token=$MIGRATE_TOKEN" | jq '.rows[] | {reel_key, status, publish_id, tt_post_id, created_at}'
```

Returns the last 50 publish attempts with status + tt_post_id + error.

---

## What's posted (reference)

| reel_key | Theme | Lang | Source MP4 | Caption (first line) |
|---|---|---|---|---|
| `1_aeo_en` | AEO | EN | `reel_1_aeo_en_final.mp4` | "SEO is shifting. AEO is here." |
| `1_aeo_es` | AEO | ES | `reel_1_aeo_es_final.mp4` | "SEO está cambiando. Llega el AEO." |
| `2_growth_en` | Growth | EN | `reel_2_growth_en_final.mp4` | "One senior operator + 12 AI agents > 40-person agency." |
| `2_growth_es` | Growth | ES | `reel_2_growth_es_final.mp4` | "Un operador senior + 12 agentes de IA > agencia de 40 personas." |
| `3_scale_en` | Scale | EN | `reel_3_scale_en_final.mp4` | "How a Chilean-founded agency is winning US SMB CMO seats." |
| `3_scale_es` | Scale | ES | `reel_3_scale_es_final.mp4` | "Cómo una agencia chilena está ganando contratos de CMO en PyMEs estadounidenses." |

All 6 verified 200 on production at `https://netwebmedia.com/assets/social/campaign/<filename>` as of 2026-05-14.

---

## After publishing — cross-publish to other channels

The 6 HF UGC remix reels (rendered today, different content) are also live and ready at `https://netwebmedia.com/assets/social/higgsfield/remix-2026-05-14/hf-{aeo,growth,speed}-{en,es}.mp4`. To publish those too, the handler needs 6 new reel definitions added — separate task.

For Instagram + Facebook, the handlers `ig_publish.php` and `fb_publish.php` exist but currently target carousels (IG) and scheduled video posts (FB) — see their headers for parameters. They are also `MIGRATE_TOKEN`-gated.

---

## Common failures

| Symptom | Cause | Fix |
|---|---|---|
| `Forbidden` 403 | Wrong MIGRATE_TOKEN | Check `crm-vanilla/api/config.local.php` on production via cPanel, or rotate the GitHub Secret + redeploy |
| `TT_ACCESS_TOKEN not configured` 503 | Secret unset | Add `TT_ACCESS_TOKEN` to GitHub Secrets + redeploy `main` |
| Init returns `url_ownership_unverified` | Domain not verified in TT dev portal | Go to TikTok Developer Portal → Manage Apps → URL Prefix Configuration → add `https://netwebmedia.com/assets/social/campaign/` + complete TXT-record verification |
| `Video URL pre-flight failed: HTTP 406` | InMotion mod_security blocked bare curl from the handler's pre-flight | Handler already uses a browser-style User-Agent (Mozilla); if seen, check `.htaccess` for new mod_security rules |
| Status stays `PROCESSING_UPLOAD` >5 min | Source video too large or unreachable | Verify URL with HEAD; TikTok's `PULL_FROM_URL` has a soft timeout |
| 24h-idempotency `already_published_recently` | Re-firing same reel within 24h | Wait, or check the `publish_id` in the response to poll the previous attempt |
