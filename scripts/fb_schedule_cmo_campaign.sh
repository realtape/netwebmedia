#!/bin/bash
# Schedule the Fractional CMO Higgsfield campaign on Facebook.
#
# Usage:
#   MIGRATE_TOKEN=<your-token> bash scripts/fb_schedule_cmo_campaign.sh           # dry-run (default, safe)
#   MIGRATE_TOKEN=<your-token> bash scripts/fb_schedule_cmo_campaign.sh --live    # actually schedule it
#
# Schedules:
#   POST_NUMBER 1001 → 6-slide CARROUSEL  (Mon 2026-05-12 09:00 ET)
#   POST_NUMBER 1002 → hero VIDEO reel   (Tue 2026-05-13 09:00 ET)
#
# FB Graph API minimum scheduling lead time = now + 10 min. These are well within range.
# Idempotent via post_number — re-running the same post_number after success returns the existing fb_post_id.

set -e

if [ -z "$MIGRATE_TOKEN" ]; then
  echo "ERROR: Set MIGRATE_TOKEN env var first."
  echo "  Get it from GitHub Secrets (you wrote it) or ~/.netwebmedia-config.php on your server."
  echo "  Example: MIGRATE_TOKEN=NWM_xxxx bash $0"
  exit 1
fi

DRY_RUN=true
if [ "$1" = "--live" ]; then
  DRY_RUN=false
  echo "⚠️  LIVE mode — posts will actually schedule on @netwebmedia FB Page."
  echo "    Hit Ctrl-C in the next 5 seconds to abort."
  sleep 5
fi

API="https://netwebmedia.com/crm-vanilla/api/?r=fb_publish&action=schedule&token=$MIGRATE_TOKEN"
BASE="https://netwebmedia.com/assets/social/higgsfield/campaign-cmo-en"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

# Caption — same for both posts (FB allows duplicate caption across post types)
read -r -d '' CAPTION <<'CAP' || true
Your Fractional CMO. AI-native.

Most agencies need 40 people and six weeks to ship one campaign. By the time they decide, your competitor already launched.

NetWebMedia is one senior operator plus 12 AI agents. Same agency-grade work. Half the cost. Zero handoffs.

The numbers from real client work:
• 340% average ROI
• 4.4x conversion vs traditional agencies
• 60 days to your first ChatGPT citation

Bilingual EN/ES. Direct line to the founder. Free audit, $997 credited toward your first retainer.

Book a strategy call at netwebmedia.com

#FractionalCMO #AImarketing #AEO #SmallBusiness #MarketingAgency
CAP

# Compute scheduled timestamps — tomorrow & day-after at 09:00 ET (13:00 UTC)
# Using GNU date (works in Git Bash on Windows + Linux)
CAR_AT=$(date -d "tomorrow 09:00 EDT" +%s)
VID_AT=$(date -d "tomorrow 09:00 EDT + 24 hours" +%s)

echo "Carousel scheduled for: $(date -d @$CAR_AT)  (unix=$CAR_AT)"
echo "Video    scheduled for: $(date -d @$VID_AT)  (unix=$VID_AT)"
echo "Dry run: $DRY_RUN"
echo ""

# Build JSON body using a heredoc (jq optional for tidy output)
read -r -d '' BODY <<JSON || true
{
  "dry_run": $DRY_RUN,
  "posts": [
    {
      "post_number": 1001,
      "format": "carousel",
      "caption": $(printf '%s' "$CAPTION" | python -c "import json,sys; print(json.dumps(sys.stdin.read()))"),
      "scheduled_at_unix": $CAR_AT,
      "image_urls": [
        "$BASE/cmo_en_slide_1.png",
        "$BASE/cmo_en_slide_2.png",
        "$BASE/cmo_en_slide_3.png",
        "$BASE/cmo_en_slide_4.png",
        "$BASE/cmo_en_slide_5.png",
        "$BASE/cmo_en_slide_6.png"
      ]
    },
    {
      "post_number": 1002,
      "format": "video",
      "caption": $(printf '%s' "$CAPTION" | python -c "import json,sys; print(json.dumps(sys.stdin.read()))"),
      "scheduled_at_unix": $VID_AT,
      "video_url": "$BASE/cmo_en_reel_hero.mp4"
    }
  ]
}
JSON

echo "--- Request body (truncated) ---"
echo "$BODY" | head -25
echo "..."
echo ""

echo "--- Calling fb_publish ---"
RESP=$(curl -sS -X POST "$API" \
  -A "$UA" \
  -H "Origin: https://netwebmedia.com" \
  -H "Referer: https://netwebmedia.com/crm-vanilla/" \
  -H "Content-Type: application/json" \
  -d "$BODY")

echo "$RESP" | python -m json.tool 2>/dev/null || echo "$RESP"
echo ""
echo "--- List recent scheduled posts ---"
curl -sS "https://netwebmedia.com/crm-vanilla/api/?r=fb_publish&action=list&token=$MIGRATE_TOKEN" \
  -A "$UA" -H "Origin: https://netwebmedia.com" -H "Referer: https://netwebmedia.com/crm-vanilla/" \
  | python -m json.tool 2>/dev/null | head -40
