#!/bin/bash
set -e
export PATH="/c/Users/Usuario/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1-full_build/bin:$PATH"
cd '/c/Users/Usuario/Desktop/NetWebMedia/hyperframes/nwm-reels'

cp index.html index-demo.html.bak

for s in reel-01-ai-sdr reel-02-seo-dead reel-03-80-hours reel-04-roas-playbook reel-05-2m-teardown reel-06-aeo-audit reel-07-agency-freelancer reel-08-340k-pipeline reel-09-cac-62 reel-10-apollo-teardown; do
  echo "=== Rendering $s ==="
  cp "compositions/${s}.html" index.html
  sed -i 's|\.\./assets/|assets/|g' index.html
  sed -i "s|\"${s}\"|\"main\"|g" index.html
  npx hyperframes render -q standard -f 30 -o "renders/${s}.mp4" 2>&1 | tail -2
  echo "=== DONE $s ==="
done

mv index-demo.html.bak index.html
echo "=== ALL RENDERS COMPLETE ==="
ls -la renders/*.mp4
