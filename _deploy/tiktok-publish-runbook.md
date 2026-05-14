# Multi-Platform Publish Runbook — 12 Reels × 2 Channels (TikTok + Facebook)

**Date:** 2026-05-14
**Target:** @netwebmedia on TikTok + the @netwebmedia Facebook Page
**Handlers:**
  - `crm-vanilla/api/handlers/tt_publish.php` — TikTok, 12 reel slots, 24h reel-key idempotency
  - `crm-vanilla/api/handlers/fb_publish.php` — Facebook, same 12 reel_keys via `reel_key` shortcut, post_number idempotency

**Both handlers share the same 12-reel registry** (duplicated per file for
self-containment, drift caught by review). Captions and source MP4 paths are
identical across channels — same content, different distribution.

## TWO COHORTS

| Cohort | Style | Keys | Asset path | TikTok prefix verified? |
|---|---|---|---|---|
| **Campaign** | Data-led (Semrush, Gartner, HubSpot) | `1_aeo_*`, `2_growth_*`, `3_scale_*` (× en/es) | `/assets/social/campaign/` | ✅ Already verified |
| **HF UGC** | POV selfie-walk, punchy hooks | `hf_aeo_*`, `hf_growth_*`, `hf_speed_*` (× en/es) | `/assets/social/higgsfield/remix-2026-05-14/` | ⚠️ **Needs verification** — add this URL prefix in TikTok Developer Portal before publishing |

**Before firing any `hf_*` reel:** TikTok Developer Portal → Manage Apps → URL Prefix Configuration → add `https://netwebmedia.com/assets/social/higgsfield/remix-2026-05-14/` and complete the TXT-record verification. Without this, `hf_*` reels will fail init with `url_ownership_unverified`. The Campaign cohort prefix is already verified — those work today.

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

## All 12 reels (reference)

### Campaign cohort — `/assets/social/campaign/`

| reel_key | Theme | Lang | Source MP4 | Caption (first line) |
|---|---|---|---|---|
| `1_aeo_en` | AEO | EN | `reel_1_aeo_en_final.mp4` | "SEO is shifting. AEO is here." |
| `1_aeo_es` | AEO | ES | `reel_1_aeo_es_final.mp4` | "SEO está cambiando. Llega el AEO." |
| `2_growth_en` | Growth | EN | `reel_2_growth_en_final.mp4` | "One senior operator + 12 AI agents > 40-person agency." |
| `2_growth_es` | Growth | ES | `reel_2_growth_es_final.mp4` | "Un operador senior + 12 agentes de IA > agencia de 40 personas." |
| `3_scale_en` | Scale | EN | `reel_3_scale_en_final.mp4` | "How a Chilean-founded agency is winning US SMB CMO seats." |
| `3_scale_es` | Scale | ES | `reel_3_scale_es_final.mp4` | "Cómo una agencia chilena está ganando contratos de CMO en PyMEs estadounidenses." |

### HF UGC cohort — `/assets/social/higgsfield/remix-2026-05-14/`

| reel_key | Theme | Lang | Source MP4 | Caption (first line) |
|---|---|---|---|---|
| `hf_aeo_en` | AEO (UGC) | EN | `hf-aeo-en.mp4` | "POV: AI answers are eating Google — and your business isn't in any of them." |
| `hf_aeo_es` | AEO (UGC) | ES | `hf-aeo-es.mp4` | "POV: la IA se está comiendo a Google — y tu negocio no aparece en ninguna respuesta." |
| `hf_growth_en` | Growth (UGC) | EN | `hf-growth-en.mp4` | "One dashboard. Every lead. Zero chaos." |
| `hf_growth_es` | Growth (UGC) | ES | `hf-growth-es.mp4` | "Un panel. Cada lead. Cero caos." |
| `hf_speed_en` | Speed (UGC) | EN | `hf-speed-en.mp4` | "From audit to launch in 14 days." |
| `hf_speed_es` | Speed (UGC) | ES | `hf-speed-es.mp4` | "De auditoría a lanzamiento en 14 días." |

All 12 verified 200 on production as of 2026-05-14.

---

## Suggested 12-day cadence (mix cohorts for variety)

Posting twice/day for 6 days, alternating cohort + language for algorithm variety:

| Day | Slot 1 (morning) | Slot 2 (evening) |
|---|---|---|
| 1 | `1_aeo_en` | `hf_growth_es` |
| 2 | `hf_aeo_en` | `2_growth_es` |
| 3 | `3_scale_en` | `hf_speed_es` |
| 4 | `hf_growth_en` | `1_aeo_es` |
| 5 | `2_growth_en` | `hf_aeo_es` |
| 6 | `hf_speed_en` | `3_scale_es` |

Spacing of ~6 hours within a day. Adjust to your audience's TZ.

---

## After publishing — cross-publish to Facebook (same 12 reels)

`fb_publish.php` now accepts the same 12 `reel_key`s as `tt_publish.php`. The
key resolves to `format=video` + `video_url` + `caption` from a shared
registry, so the same content posts to TikTok and Facebook with identical
captions. FB requires scheduling at least 10 min in the future (and at most
6 months out).

### FB readiness probe

```bash
curl -s -A "Mozilla/5.0" \
  "https://netwebmedia.com/crm-vanilla/api/?r=fb_publish&action=status&token=$MIGRATE_TOKEN" | jq .
```

Expected: `{"configured":true,"page_accessible":true,"token_kind":"page",...}`. If
`token_kind:user` is returned, posts still work but `pages_manage_posts` scope on a
Page token is preferred (rotate via `/me/accounts`).

### FB schedule one reel — dry-run first

```bash
WHEN=$(($(date +%s) + 900))   # 15 minutes from now
curl -s -X POST -A "Mozilla/5.0" \
  -H "Content-Type: application/json" \
  -d "{\"dry_run\":true,\"posts\":[{\"post_number\":101,\"reel_key\":\"1_aeo_en\",\"scheduled_at_unix\":$WHEN}]}" \
  "https://netwebmedia.com/crm-vanilla/api/?r=fb_publish&action=schedule&token=$MIGRATE_TOKEN" | jq .
```

Expected: `{"results":[{"post_number":101,"status":"dry_run","scheduled_at_iso":"..."}]}`.
Inspect the logged caption + asset URLs via `action=list` before live-firing.

### FB live schedule — single reel

```bash
WHEN=$(($(date +%s) + 900))
curl -s -X POST -A "Mozilla/5.0" \
  -H "Content-Type: application/json" \
  -d "{\"posts\":[{\"post_number\":101,\"reel_key\":\"1_aeo_en\",\"scheduled_at_unix\":$WHEN}]}" \
  "https://netwebmedia.com/crm-vanilla/api/?r=fb_publish&action=schedule&token=$MIGRATE_TOKEN" | jq .
```

Expected: `{"results":[{"post_number":101,"status":"scheduled","fb_video_id":"...","scheduled_at_iso":"..."}]}`.

### FB batch — all 12 reels, staggered 6 hours apart

```bash
NOW=$(date +%s)
HOUR=3600

curl -s -X POST -A "Mozilla/5.0" \
  -H "Content-Type: application/json" \
  -d "{\"posts\":[
    {\"post_number\":201,\"reel_key\":\"1_aeo_en\",     \"scheduled_at_unix\":$((NOW + 1*HOUR))},
    {\"post_number\":202,\"reel_key\":\"hf_growth_es\", \"scheduled_at_unix\":$((NOW + 7*HOUR))},
    {\"post_number\":203,\"reel_key\":\"hf_aeo_en\",    \"scheduled_at_unix\":$((NOW + 13*HOUR))},
    {\"post_number\":204,\"reel_key\":\"2_growth_es\",  \"scheduled_at_unix\":$((NOW + 19*HOUR))},
    {\"post_number\":205,\"reel_key\":\"3_scale_en\",   \"scheduled_at_unix\":$((NOW + 25*HOUR))},
    {\"post_number\":206,\"reel_key\":\"hf_speed_es\",  \"scheduled_at_unix\":$((NOW + 31*HOUR))},
    {\"post_number\":207,\"reel_key\":\"hf_growth_en\", \"scheduled_at_unix\":$((NOW + 37*HOUR))},
    {\"post_number\":208,\"reel_key\":\"1_aeo_es\",     \"scheduled_at_unix\":$((NOW + 43*HOUR))},
    {\"post_number\":209,\"reel_key\":\"2_growth_en\",  \"scheduled_at_unix\":$((NOW + 49*HOUR))},
    {\"post_number\":210,\"reel_key\":\"hf_aeo_es\",    \"scheduled_at_unix\":$((NOW + 55*HOUR))},
    {\"post_number\":211,\"reel_key\":\"hf_speed_en\",  \"scheduled_at_unix\":$((NOW + 61*HOUR))},
    {\"post_number\":212,\"reel_key\":\"3_scale_es\",   \"scheduled_at_unix\":$((NOW + 67*HOUR))}
  ]}" \
  "https://netwebmedia.com/crm-vanilla/api/?r=fb_publish&action=schedule&token=$MIGRATE_TOKEN" | jq .
```

Each entry's `post_number` is the idempotency key — re-running this batch
returns `already_scheduled` for any post_number already on FB. Bump numbers
(301+) for a second batch.

### FB audit log

```bash
curl -s -A "Mozilla/5.0" \
  "https://netwebmedia.com/crm-vanilla/api/?r=fb_publish&action=list&token=$MIGRATE_TOKEN" | jq '.rows[] | {post_number, status, fb_video_id, scheduled_at_iso, error}'
```

### Instagram

`ig_publish.php` is still carousel-only (image carousels matching
`assets/social/carousels/{a,b,c}-slide-{1..5}.png`). Adding IG Reels support
for these video reels requires a separate code change (Reels use a different
Graph API flow than carousels — resumable upload + REELS media_type).

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
