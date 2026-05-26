#!/usr/bin/env bash
# ============================================================================
# Recover the 19 MVP Expansion v2 source clips from Higgsfield CloudFront.
#
# macOS / Linux equivalent of recover-source-clips.cmd. Use this when the
# Windows workstation isn't available — the canonical location stays:
#   ~/hyperframes/netwebmedia/social-reels-mvp-v2/clips/
# which mirrors D:\hyperframes\... per CLAUDE.md → Media storage policy.
#
# Source: Higgsfield workspace 4df1d4d6-02bb-48f8-a91e-30eb0ec3aa56,
# jobs from 2026-05-12 15:36-15:37 UTC (Kling 3.0).
# ============================================================================
set -euo pipefail

DEST="${HYPERFRAMES_DIR:-$HOME/hyperframes}/netwebmedia/social-reels-mvp-v2/clips"
CF="https://d8j0ntlcm91z4.cloudfront.net/user_3DJQnJGVViYJk8WBv0y84SffJOU"

mkdir -p "$DEST"
echo "Downloading 19 clips to $DEST"
echo

declare -a MAP=(
  # Hero clips
  "reel_01_aeo_hero_skeptic-founder.mp4|hf_20260512_153600_5f4cb284-617d-4648-8828-d06e74a636c3.mp4"
  "reel_02_aeo_hero_phone-reaction.mp4|hf_20260512_153604_fa457722-f110-48b1-96fb-d4ede93813f5.mp4"
  "reel_03_aeo_hero_audit-reports.mp4|hf_20260512_153607_77232d6f-8b03-45b6-acf4-e6e279b33788.mp4"
  "reel_04_growth_hero_operator-laptop.mp4|hf_20260512_153612_00dc0e26-7fff-47bd-8725-1d199d6e3b25.mp4"
  "reel_05_growth_hero_whiteboard-list.mp4|hf_20260512_153615_805beee6-f261-4be7-84f4-567ce124764a.mp4"
  "reel_06_growth_hero_whiteboard-arrow.mp4|hf_20260512_153619_8c4c6b57-3017-4e54-bf6c-5b911f013d1e.mp4"
  "reel_07_scale_hero_executive-window.mp4|hf_20260512_153622_360af0d2-6c0b-40d8-b42c-e265aecb7803.mp4"
  "reel_08_scale_hero_conference-table.mp4|hf_20260512_153626_f0c42c6e-b4a6-478f-b06f-d9fa8abdd77d.mp4"
  "reel_09_scale_hero_phone-call-window.mp4|hf_20260512_153630_53c8290d-e2e9-4617-87f8-f2070a086d03.mp4"
  # B-roll
  "reel_01_aeo_broll_chatgpt-phone.mp4|hf_20260512_153655_fd6ed0f1-dd0b-477b-bfc7-f1c3925c6940.mp4"
  "reel_02_aeo_broll_schema-markup.mp4|hf_20260512_153658_c8324c62-0cc1-42ef-b14e-5d07b50fe2df.mp4"
  "reel_03_aeo_broll_citation-chart.mp4|hf_20260512_153702_30eb61bf-0d8a-442a-be08-d88f664e98e8.mp4"
  "reel_04_growth_broll_tabs-closing.mp4|hf_20260512_153706_b1725b7d-42a9-4fea-82cf-1a2d768f4ffc.mp4"
  "reel_05_growth_broll_calendar-fill.mp4|hf_20260512_153709_dadbaecf-ad47-48f7-ad7a-010f9f034a87.mp4"
  "reel_06_growth_broll_email-scale.mp4|hf_20260512_153713_70ebf5f9-35b0-4675-8328-2c3e235d3048.mp4"
  "reel_07_scale_broll_chaos-montage.mp4|hf_20260512_153716_4e51723d-5d1d-4cd6-af6e-278a8534ff6e.mp4"
  "reel_08_scale_broll_kpi-dashboard.mp4|hf_20260512_153720_79449f2a-0005-4ad3-9270-79de0b9e577b.mp4"
  "reel_08_scale_broll_workflow-nodes.mp4|hf_20260512_153723_ad246def-0111-4c6f-aeac-fe868b456120.mp4"
  "reel_09_scale_broll_logos-revenue.mp4|hf_20260512_153726_e5bd67ac-525d-463a-b064-78ab5b62fb25.mp4"
)

# Parallel download, max 8 concurrent
printf '%s\n' "${MAP[@]}" | while IFS='|' read -r name remote; do
  printf '%s %s\n' "$name" "$CF/$remote"
done | xargs -P 8 -L 1 sh -c 'curl -sSL -o "'"$DEST"'/$1" "$2" && echo "ok  $1" || echo "FAIL $1"' _

echo
echo "--- summary ---"
COUNT=$(ls "$DEST"/*.mp4 2>/dev/null | wc -l | tr -d ' ')
TOTAL=$(du -sh "$DEST" 2>/dev/null | cut -f1)
echo "Files: $COUNT / 19    Total size: $TOTAL"

if [[ "$COUNT" -ne 19 ]]; then
  echo
  echo "WARN: expected 19 files, got $COUNT. Check that CloudFront is reachable"
  echo "(host d8j0ntlcm91z4.cloudfront.net). On the Claude Code remote sandbox"
  echo "this host is blocked by network policy — run this on Carlos's Windows"
  echo "or a Mac/Linux dev machine instead."
  exit 1
fi

echo
echo "Next: render with cd video-factory && ./scripts/render-mvp-reels.sh"
