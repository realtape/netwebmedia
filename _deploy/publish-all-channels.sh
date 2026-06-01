#!/usr/bin/env bash
#
# publish-all-channels.sh — fire one reel to TikTok + Facebook + Instagram in one command.
#
# Usage:
#   ./publish-all-channels.sh <reel_key> [options]
#
# Required:
#   reel_key             One of the 12 reel keys in lowercase form. The script
#                        auto-uppercases for IG. Valid keys:
#                          1_aeo_en      1_aeo_es      2_growth_en   2_growth_es
#                          3_scale_en    3_scale_es    hf_aeo_en     hf_aeo_es
#                          hf_growth_en  hf_growth_es  hf_speed_en   hf_speed_es
#
# Options:
#   --channels tt,fb,ig  Channels to fire. Default: all three. Comma-separated.
#                        e.g. --channels tt,fb   (skip IG)
#                             --channels ig      (IG only — fastest validation)
#   --dry-run            Use dry_run flag on each handler. No live posts.
#   --fb-delay-min N     Minutes from now for FB scheduled_at_unix. Default: 15.
#                        FB requires minimum 10. Max: 6 months out.
#   --tt-no-poll         Don't poll TikTok status after init (returns publish_id only).
#                        Default: polls every 8s up to 120s until terminal status.
#   --token TOKEN        MIGRATE_TOKEN. Falls back to $MIGRATE_TOKEN env var.
#                        Required for live runs; not strictly needed for --help.
#   --base-url URL       API base. Default: https://netwebmedia.com
#   -h, --help           Show this help.
#
# Examples:
#   export MIGRATE_TOKEN='...'
#   ./publish-all-channels.sh 1_aeo_en --dry-run
#   ./publish-all-channels.sh hf_growth_es --channels ig
#   ./publish-all-channels.sh 3_scale_en --fb-delay-min 60
#   ./publish-all-channels.sh hf_speed_en  # all 3 channels, live
#
# Exit codes:
#   0  All requested channels reported success (or already_published_recently)
#   1  Invalid arguments / usage error
#   2  Token missing
#   3  One or more channels failed
#
# Dependencies: curl, jq.
#
# Author:  Auto-generated 2026-05-14. See _deploy/tiktok-publish-runbook.md for
#          per-channel details and handler internals.

set -uo pipefail

# ── Defaults ────────────────────────────────────────────────────────────────
BASE_URL="${BASE_URL:-https://netwebmedia.com}"
CHANNELS="tt,fb,ig"
DRY_RUN="false"
FB_DELAY_MIN=15
TT_POLL="true"
TOKEN="${MIGRATE_TOKEN:-}"
UA='Mozilla/5.0 (compatible; NWM-Publisher/1.0)'

REEL_KEY=""

# ── Parse args ──────────────────────────────────────────────────────────────
usage() {
  sed -n '2,55p' "$0" | sed 's/^# \{0,1\}//'
}

if [[ $# -eq 0 ]]; then
  usage
  exit 1
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)        usage; exit 0 ;;
    --dry-run)        DRY_RUN="true"; shift ;;
    --tt-no-poll)     TT_POLL="false"; shift ;;
    --channels)       CHANNELS="$2"; shift 2 ;;
    --fb-delay-min)   FB_DELAY_MIN="$2"; shift 2 ;;
    --token)          TOKEN="$2"; shift 2 ;;
    --base-url)       BASE_URL="$2"; shift 2 ;;
    -*)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
    *)
      if [[ -z "$REEL_KEY" ]]; then
        REEL_KEY="$1"
      else
        echo "Unexpected positional arg: $1" >&2
        exit 1
      fi
      shift
      ;;
  esac
done

if [[ -z "$REEL_KEY" ]]; then
  echo "Error: reel_key is required." >&2
  echo "Run with -h for usage." >&2
  exit 1
fi

# ── Validate reel_key against the 12-key registry ───────────────────────────
VALID_KEYS=(
  "1_aeo_en"    "1_aeo_es"
  "2_growth_en" "2_growth_es"
  "3_scale_en"  "3_scale_es"
  "hf_aeo_en"   "hf_aeo_es"
  "hf_growth_en" "hf_growth_es"
  "hf_speed_en" "hf_speed_es"
)
REEL_KEY_LOWER="$(echo "$REEL_KEY" | tr '[:upper:]' '[:lower:]')"

found=false
for k in "${VALID_KEYS[@]}"; do
  if [[ "$k" == "$REEL_KEY_LOWER" ]]; then
    found=true
    break
  fi
done
if [[ "$found" != "true" ]]; then
  echo "Error: '$REEL_KEY' is not a valid reel_key." >&2
  echo "Valid keys (lowercase form):" >&2
  printf '  %s\n' "${VALID_KEYS[@]}" >&2
  exit 1
fi

REEL_KEY_TT="$REEL_KEY_LOWER"
REEL_KEY_FB="$REEL_KEY_LOWER"
REEL_KEY_IG="$(echo "$REEL_KEY_LOWER" | tr '[:lower:]' '[:upper:]')"

# ── Validate channels ───────────────────────────────────────────────────────
do_tt=false; do_fb=false; do_ig=false
IFS=',' read -ra REQUESTED <<< "$CHANNELS"
for c in "${REQUESTED[@]}"; do
  case "$(echo "$c" | tr '[:upper:]' '[:lower:]' | tr -d ' ')" in
    tt|tiktok)    do_tt=true ;;
    fb|facebook)  do_fb=true ;;
    ig|instagram) do_ig=true ;;
    "")           ;;
    *) echo "Error: unknown channel '$c'. Use tt,fb,ig." >&2; exit 1 ;;
  esac
done
if [[ "$do_tt" != "true" && "$do_fb" != "true" && "$do_ig" != "true" ]]; then
  echo "Error: no channels selected." >&2
  exit 1
fi

# ── Token check (skip for help/dry-runs-with-no-channels) ───────────────────
if [[ -z "$TOKEN" ]]; then
  echo "Error: MIGRATE_TOKEN not set. Pass --token or 'export MIGRATE_TOKEN=...'" >&2
  exit 2
fi

# ── Helpers ─────────────────────────────────────────────────────────────────
post_json() {
  local url="$1" body="$2"
  curl -sS -X POST -A "$UA" -H "Content-Type: application/json" \
    --data "$body" \
    "$url"
}

get_json() {
  local url="$1"
  curl -sS -A "$UA" "$url"
}

# Pretty-print a result row
row() {
  printf "  %-12s %s\n" "$1" "$2"
}

# Banner
echo "═══════════════════════════════════════════════════════════════════"
echo "  Publish reel: $REEL_KEY_LOWER"
echo "  Channels:     $(echo "$do_tt $do_fb $do_ig" | sed 's/true/✓/g; s/false/✗/g' | awk '{printf "TT=%s FB=%s IG=%s", $1, $2, $3}')"
echo "  Mode:         $([ "$DRY_RUN" = "true" ] && echo "DRY RUN" || echo "LIVE")"
echo "  API base:     $BASE_URL"
[[ "$do_fb" == "true" ]] && echo "  FB schedule:  now + ${FB_DELAY_MIN} min"
echo "═══════════════════════════════════════════════════════════════════"

exit_code=0
declare -A CHANNEL_STATUS
declare -A CHANNEL_DETAIL

# ── TikTok ──────────────────────────────────────────────────────────────────
if [[ "$do_tt" == "true" ]]; then
  echo
  echo "[TikTok] firing publish for '$REEL_KEY_TT'..."
  body=$(jq -n --arg reel "$REEL_KEY_TT" --argjson dry "$DRY_RUN" '{reel: $reel, dry_run: $dry}')
  resp=$(post_json "$BASE_URL/crm-vanilla/api/?r=tt_publish&action=publish&token=$TOKEN" "$body")
  tt_status=$(echo "$resp" | jq -r '.status // .error // "unknown"')
  tt_pub_id=$(echo "$resp" | jq -r '.publish_id // empty')

  case "$tt_status" in
    processing|dry_run|already_published_recently)
      CHANNEL_STATUS[tt]="$tt_status"
      CHANNEL_DETAIL[tt]="$tt_pub_id"
      row "TikTok init" "$tt_status (publish_id=${tt_pub_id:-n/a})"
      ;;
    *)
      CHANNEL_STATUS[tt]="failed"
      CHANNEL_DETAIL[tt]="$tt_status"
      row "TikTok init" "FAILED — $(echo "$resp" | jq -c '.')"
      exit_code=3
      ;;
  esac

  # Poll TT status until terminal (or skip if --tt-no-poll / dry-run / idempotent)
  if [[ "$TT_POLL" == "true" && "$tt_status" == "processing" && -n "$tt_pub_id" && "$DRY_RUN" == "false" ]]; then
    echo "[TikTok] polling status (max 120s)..."
    deadline=$(( $(date +%s) + 120 ))
    while (( $(date +%s) < deadline )); do
      sleep 8
      poll_body=$(jq -n --arg pid "$tt_pub_id" '{publish_id: $pid}')
      poll_resp=$(post_json "$BASE_URL/crm-vanilla/api/?r=tt_publish&action=status_check&token=$TOKEN" "$poll_body")
      tt_state=$(echo "$poll_resp" | jq -r '.tt_status // "UNKNOWN"')
      printf "             %s %s\n" "$(date +%T)" "$tt_state"
      case "$tt_state" in
        PUBLISH_COMPLETE)
          tt_post_id=$(echo "$poll_resp" | jq -r '.data.publicaly_available_post_id[0] // .data.post_id // empty')
          CHANNEL_STATUS[tt]="published"
          CHANNEL_DETAIL[tt]="tt_post_id=$tt_post_id"
          row "TikTok final" "PUBLISH_COMPLETE — post_id=$tt_post_id"
          break
          ;;
        FAILED|PROCESSING_FAILED|PUBLISH_FAILED)
          CHANNEL_STATUS[tt]="failed_post"
          CHANNEL_DETAIL[tt]="$tt_state"
          row "TikTok final" "FAILED — $tt_state"
          exit_code=3
          break
          ;;
      esac
    done
    if [[ "${CHANNEL_STATUS[tt]}" == "processing" ]]; then
      row "TikTok final" "STILL PROCESSING after 120s — re-run status_check manually with publish_id=$tt_pub_id"
    fi
  fi
fi

# ── Facebook ────────────────────────────────────────────────────────────────
if [[ "$do_fb" == "true" ]]; then
  echo
  echo "[Facebook] scheduling '$REEL_KEY_FB' for now+${FB_DELAY_MIN}min..."
  fb_when=$(( $(date +%s) + FB_DELAY_MIN * 60 ))
  # post_number: stable hash of reel_key + schedule time so re-runs don't collide
  # Use date-bucket so a same-day re-run hits the same number (idempotent).
  bucket=$(date +%Y%m%d%H)
  pn=$(( $(printf '%s_%s' "$REEL_KEY_FB" "$bucket" | cksum | awk '{print $1}') % 900000 + 100000 ))
  body=$(jq -n \
    --argjson pn "$pn" \
    --arg rk "$REEL_KEY_FB" \
    --argjson when "$fb_when" \
    --argjson dry "$DRY_RUN" \
    '{posts: [{post_number: $pn, reel_key: $rk, scheduled_at_unix: $when}], dry_run: $dry}')
  resp=$(post_json "$BASE_URL/crm-vanilla/api/?r=fb_publish&action=schedule&token=$TOKEN" "$body")
  fb_result=$(echo "$resp" | jq -r '.results[0].status // .error // "unknown"')
  fb_video=$(echo "$resp" | jq -r '.results[0].fb_video_id // .results[0].fb_post_id // empty')
  fb_when_iso=$(echo "$resp" | jq -r '.results[0].scheduled_at_iso // empty')

  case "$fb_result" in
    scheduled|dry_run|already_scheduled)
      CHANNEL_STATUS[fb]="$fb_result"
      CHANNEL_DETAIL[fb]="post_number=$pn id=${fb_video:-n/a}"
      row "Facebook" "$fb_result (post_number=$pn, id=${fb_video:-n/a}, when=${fb_when_iso:-n/a})"
      ;;
    *)
      CHANNEL_STATUS[fb]="failed"
      CHANNEL_DETAIL[fb]="$fb_result"
      row "Facebook" "FAILED — $(echo "$resp" | jq -c '.')"
      exit_code=3
      ;;
  esac
fi

# ── Instagram ───────────────────────────────────────────────────────────────
if [[ "$do_ig" == "true" ]]; then
  echo
  echo "[Instagram] firing publish_reel for '$REEL_KEY_IG'..."
  body=$(jq -n --arg reel "$REEL_KEY_IG" --argjson dry "$DRY_RUN" '{reel: $reel, dry_run: $dry, share_to_feed: true}')
  resp=$(post_json "$BASE_URL/crm-vanilla/api/?r=ig_publish&action=publish_reel&token=$TOKEN" "$body")
  ig_result=$(echo "$resp" | jq -r '.results[0].status // .error // "unknown"')
  ig_media=$(echo "$resp" | jq -r '.results[0].ig_media_id // empty')
  ig_container=$(echo "$resp" | jq -r '.results[0].container_id // empty')

  case "$ig_result" in
    published|already_published|dry_run)
      CHANNEL_STATUS[ig]="$ig_result"
      CHANNEL_DETAIL[ig]="media_id=${ig_media:-n/a}"
      row "Instagram" "$ig_result (media_id=${ig_media:-n/a})"
      ;;
    still_processing)
      CHANNEL_STATUS[ig]="still_processing"
      CHANNEL_DETAIL[ig]="container_id=$ig_container"
      row "Instagram" "still_processing — re-run with same reel_key to resume (container_id=$ig_container)"
      # not a hard failure — handler returns this when the 90s poll didn't hit FINISHED
      ;;
    *)
      CHANNEL_STATUS[ig]="failed"
      CHANNEL_DETAIL[ig]="$ig_result"
      row "Instagram" "FAILED — $(echo "$resp" | jq -c '.')"
      exit_code=3
      ;;
  esac
fi

# ── Final summary ──────────────────────────────────────────────────────────
echo
echo "═══════════════════════════════════════════════════════════════════"
echo "  Summary for reel: $REEL_KEY_LOWER"
echo "─────────────────────────────────────────────────────────────────"
for ch in tt fb ig; do
  if [[ -n "${CHANNEL_STATUS[$ch]:-}" ]]; then
    printf "  %-10s %-22s %s\n" "$ch" "${CHANNEL_STATUS[$ch]}" "${CHANNEL_DETAIL[$ch]}"
  fi
done
echo "═══════════════════════════════════════════════════════════════════"
[[ $exit_code -eq 0 ]] && echo "OK — all requested channels succeeded." || echo "ONE OR MORE CHANNELS FAILED. Inspect output above and the per-handler audit log (?action=list)."
exit "$exit_code"
