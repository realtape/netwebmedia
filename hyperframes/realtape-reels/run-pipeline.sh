#!/bin/bash
set -e
BASE="/c/Users/Usuario/Desktop/NetWebMedia/hyperframes/realtape-reels"
URL="https://www.youtube.com/watch?v=aKvGwNiVSKk"
OUT="$BASE/renders"

cd "$BASE"
mkdir -p "$OUT"

echo "[1/7] Transcode clip-03 (CFR, video-only, error-concealment)"
ffmpeg -y \
  -err_detect ignore_err \
  -fflags +discardcorrupt+genpts \
  -i "$BASE/assets/broll/raw-03.mp4" \
  -t 45 -vf "scale=-2:1920,crop=1080:1920,fps=30" \
  -c:v libx264 -preset fast -crf 18 -r 30 -g 30 -keyint_min 30 \
  -an -vsync cfr -movflags +faststart \
  "$BASE/assets/broll/clip-03-video.mp4"
echo "clip-03-video.mp4: $(ls -lh "$BASE/assets/broll/clip-03-video.mp4")"

echo "[2/7] Render reel-01-race-start"
cp "$BASE/compositions/reel-01-race-start.html" "$BASE/index.html"
sed -i 's|\.\./assets/|assets/|g' "$BASE/index.html"
sed -i 's|"reel-01-race-start"|"main"|g' "$BASE/index.html"
npx hyperframes render -q high -f 30 -o "$OUT/reel-01-race-start.mp4"
echo "reel-01 done: $(ls -lh "$OUT/reel-01-race-start.mp4")"

echo "[3/7] Render reel-02-karussell"
cp "$BASE/compositions/reel-02-karussell.html" "$BASE/index.html"
sed -i 's|\.\./assets/|assets/|g' "$BASE/index.html"
sed -i 's|"reel-02-karussell"|"main"|g' "$BASE/index.html"
npx hyperframes render -q high -f 30 -o "$OUT/reel-02-karussell.mp4"
echo "reel-02 done: $(ls -lh "$OUT/reel-02-karussell.mp4")"

echo "[4/7] Render reel-03-final-stretch"
cp "$BASE/compositions/reel-03-final-stretch.html" "$BASE/index.html"
sed -i 's|\.\./assets/|assets/|g' "$BASE/index.html"
sed -i 's|clip-03-final\.mp4|clip-03-video.mp4|g' "$BASE/index.html"
sed -i 's|"reel-03-final-stretch"|"main"|g' "$BASE/index.html"
npx hyperframes render -q high -f 30 -o "$OUT/reel-03-final-stretch.mp4"
echo "reel-03 done: $(ls -lh "$OUT/reel-03-final-stretch.mp4")"

echo "[5/7] Mux audio → reel-01-final"
ffmpeg -y -i "$OUT/reel-01-race-start.mp4" -i "$BASE/assets/audio/audio-01.m4a" \
  -c:v copy -c:a aac -shortest "$OUT/reel-01-final.mp4"
echo "reel-01-final: $(ls -lh "$OUT/reel-01-final.mp4")"

echo "[6/7] Mux audio → reel-02-final"
ffmpeg -y -i "$OUT/reel-02-karussell.mp4" -i "$BASE/assets/audio/audio-02.m4a" \
  -c:v copy -c:a aac -shortest "$OUT/reel-02-final.mp4"
echo "reel-02-final: $(ls -lh "$OUT/reel-02-final.mp4")"

echo "[7/7] Mux audio → reel-03-final"
ffmpeg -y -i "$OUT/reel-03-final-stretch.mp4" -i "$BASE/assets/broll/raw-03.mp4" \
  -c:v copy -c:a aac -shortest "$OUT/reel-03-final.mp4"
echo "reel-03-final: $(ls -lh "$OUT/reel-03-final.mp4")"

rm -f "$BASE/index.html"
echo ""
echo "=== ALL DONE ==="
ls -lh "$OUT"/*.mp4
