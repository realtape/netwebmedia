# TikTok Publish Runbook — 12 Reels (6 Campaign + 6 HF UGC)

**Date:** 2026-05-14
**Target:** @netwebmedia on TikTok
**Handler:** `crm-vanilla/api/handlers/tt_publish.php` (already wired, 12 reel slots)
**Idempotency:** Each `reel_key` is guarded for 24h — re-running same reel returns existing publish_id without re-calling TikTok

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

## After publishing — cross-publish to other channels

For Instagram + Facebook, the handlers `ig_publish.php` and `fb_publish.php` exist but currently target carousels (IG) and scheduled video posts (FB) — see their headers for parameters. They are also `MIGRATE_TOKEN`-gated. The HF cohort would need an IG-specific Reels handler (the existing `ig_publish.php` is carousel-only) — that's a separate code change if you want to mirror to IG Reels.

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
