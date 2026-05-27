#!/usr/bin/env bash
# Render all 9 MVP Expansion v2 reels with the per-reel theme + music pipeline.
# Outputs to video-factory/out/reel_*_v2_en_final.mp4 (1080×1920, 30fps, H.264).
#
# Asset storage policy (CLAUDE.md → "Media storage policy"):
# All video/music binaries live at D:\hyperframes\nwm-reels\mvp-v2\
# on the Windows workstation. video-factory/public/clips and public/music are
# Windows junctions (mklink /J) pointing to that path — never check binaries
# into the repo, never upload to Google Drive.
#
# Setup on Windows (one-time):
#   mklink /J video-factory\public\clips D:\hyperframes\nwm-reels\mvp-v2\clips
#   mklink /J video-factory\public\music D:\hyperframes\nwm-reels\mvp-v2\music
#
# Setup on Linux/macOS (or remote sandbox):
#   ln -s ~/hyperframes/nwm-reels/mvp-v2/clips video-factory/public/clips
#   ln -s ~/hyperframes/nwm-reels/mvp-v2/music video-factory/public/music
#
# Prerequisites (verified by this script before rendering):
#   - 19 source clips reachable via video-factory/public/clips/ (per data/mvp-reels.ts)
#   - 3 music tracks reachable via video-factory/public/music/ (per MUSIC-BRIEF.md)
#   - nwm-logo.png + nwm-logo-horizontal.png in video-factory/public/

set -euo pipefail
cd "$(dirname "$0")/.."

REELS=(
  reel_01_aeo_hook_en
  reel_02_aeo_demo_en
  reel_03_aeo_proof_en
  reel_04_growth_hook_en
  reel_05_growth_demo_en
  reel_06_growth_proof_en
  reel_07_scale_hook_en
  reel_08_scale_demo_en
  reel_09_scale_proof_en
)

CLIPS=(
  reel_01_aeo_hero_skeptic-founder.mp4
  reel_01_aeo_broll_chatgpt-phone.mp4
  reel_02_aeo_hero_phone-reaction.mp4
  reel_02_aeo_broll_schema-markup.mp4
  reel_03_aeo_hero_audit-reports.mp4
  reel_03_aeo_broll_citation-chart.mp4
  reel_04_growth_hero_operator-laptop.mp4
  reel_04_growth_broll_tabs-closing.mp4
  reel_05_growth_hero_whiteboard-list.mp4
  reel_05_growth_broll_calendar-fill.mp4
  reel_06_growth_hero_whiteboard-arrow.mp4
  reel_06_growth_broll_email-scale.mp4
  reel_07_scale_hero_executive-window.mp4
  reel_07_scale_broll_chaos-montage.mp4
  reel_08_scale_hero_conference-table.mp4
  reel_08_scale_broll_kpi-dashboard.mp4
  reel_08_scale_broll_workflow-nodes.mp4
  reel_09_scale_hero_phone-call-window.mp4
  reel_09_scale_broll_logos-revenue.mp4
)

MUSIC=(
  aeo-tense-resolve.mp3
  growth-operator.mp3
  scale-cinematic.mp3
)

OVERLAYS=(
  nwm-logo.png
  nwm-logo-horizontal.png
)

# Pre-flight: confirm every required asset is on disk.
missing=0
for f in "${CLIPS[@]}"; do
  [[ -f "public/clips/$f" ]] || { echo "MISSING: public/clips/$f"; missing=1; }
done
for f in "${MUSIC[@]}"; do
  [[ -f "public/music/$f" ]] || { echo "MISSING: public/music/$f"; missing=1; }
done
for f in "${OVERLAYS[@]}"; do
  [[ -f "public/$f" ]] || { echo "MISSING: public/$f"; missing=1; }
done

if [[ $missing -ne 0 ]]; then
  echo
  echo "Pre-flight failed. Asset storage policy (CLAUDE.md) requires all video"
  echo "+ music binaries to live at D:\\hyperframes\\nwm-reels\\mvp-v2\\"
  echo "and be reached via Windows junctions (mklink /J) on the public/ folders."
  echo
  echo "If you're missing source clips, re-pull from the Higgsfield workspace"
  echo "(_deploy/social-reels-mvp-expansion-2026-05/BRIEF.md has the job IDs)"
  echo "and save them directly to D:\\hyperframes\\nwm-reels\\mvp-v2\\clips\\."
  echo
  echo "If you're missing music, follow MUSIC-BRIEF.md and save the licensed"
  echo "mp3s to D:\\hyperframes\\nwm-reels\\mvp-v2\\music\\."
  exit 1
fi

mkdir -p out

for id in "${REELS[@]}"; do
  out="out/${id}_final.mp4"
  echo "==> Rendering $id → $out"
  npx remotion render src/index.tsx "$id" "$out" \
    --codec=h264 \
    --crf=18 \
    --pixel-format=yuv420p \
    --concurrency=2
done

echo
echo "Done. 9 reels in video-factory/out/."
echo "Next: copy finals to assets/social/campaign/finals/ and commit."
