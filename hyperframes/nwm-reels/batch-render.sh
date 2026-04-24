#!/bin/bash
set -e
export PATH="/c/Users/Usuario/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1-full_build/bin:$PATH"
cd '/c/Users/Usuario/Desktop/NetWebMedia/hyperframes/nwm-reels'

# backup root
cp index.html index-demo.html.bak

declare -A slug=(
  [02]="reel-02-seo-dead"
  [03]="reel-03-80-hours"
  [04]="reel-04-roas-playbook"
  [05]="reel-05-2m-teardown"
  [06]="reel-06-aeo-audit"
  [07]="reel-07-agency-freelancer"
  [08]="reel-08-340k-pipeline"
  [09]="reel-09-cac-62"
  [10]="reel-10-apollo-teardown"
)

for n in 02 03 04 05 06 07 08 09 10; do
  s=${slug[$n]}
  echo "=== Rendering $s ==="
  cp "compositions/${s}.html" index.html
  sed -i 's|../assets/|assets/|g' index.html
  sed -i "s|\"${s}\"|\"main\"|g" index.html
  npx hyperframes render -q standard -f 30 -o "renders/${s}.mp4" 2>&1 | tail -2
  echo "=== DONE $s ==="
done

# restore root
mv index-demo.html.bak index.html
echo "=== ALL RENDERS COMPLETE ==="
ls -la renders/
