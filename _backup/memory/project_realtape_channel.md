---
name: Realtape YouTube channel — Carlos's iRacing sim-racing channel
description: Carlos's personal sim-racing YouTube channel (separate from NetWebMedia). Pipeline for cutting Instagram reels from race VODs lives at NetWebMedia/hyperframes/realtape-reels and spa-reels-2026-05-12. Channel retention crisis = long-form live VODs at 2-12%; edited shorts at 48%.
type: project
originSessionId: c0cfb3d3-e495-4339-b86f-42ca750be7f7
---
@realtape (`UChzmRHNnY_HkIuHdzLT_Ttg`) is Carlos's personal sim-racing channel — NOT part of NetWebMedia. Treat as personal-brand work.

**Why:** Channel has a retention problem. Long-form iRacing live VODs (45–100 min) get 2–12% retention; edited shorts (e.g. "RealTape Reel #1") get 48% retention. The strategy is to harvest reels from each live stream and cross-publish to IG / YouTube Shorts / TikTok.

**How to apply:** When Carlos asks for Realtape content, the pipeline at `NetWebMedia/hyperframes/realtape-reels/` (Apr 2026, 3 hero reels from one Nürburgring stream) is the canonical pattern. Recreated and extended at `NetWebMedia/hyperframes/spa-reels-2026-05-12/` (40-reel batch from 4 Spa streams). The generator is `build-reels.py` in each folder.

**Brand details:**
- Accent colors: red `#FF1A1A` (default), amber `#FFB400` (caution), cyan `#00D4FF` (technical)
- Handle: `@REALTAPE` (top-center, full-bleed)
- Fonts: Poppins 900 / Inter 700 / JetBrains Mono 700
- Format: 1080×1920, 20–30s, h264 MP4
- Timeline: HOOK 0–5s, HUD 5–11s, BUILD 11–17s, CTA 16–20s, progress bar 0–full

**Tooling:**
- yt-dlp installed via `pip install --user yt-dlp` → invoke as `python -m yt_dlp`
- ffmpeg at `C:\Users\Usuario\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_*\bin\ffmpeg.exe`
- hyperframes via `npx hyperframes render -q high -f 30 -o renders/reel-X.mp4`
- Source format is YouTube AV1 1920×1080@60fps (slow to decode but works)

**Channel exclusions / decisions:** Pre-2025 content (Tapati Rapa Nui, Eclipse 2019, Smashing Pumpkins concert) dilutes the sim-racing niche — recommend unlisting. LinkedIn and X already excluded as durable Carlos decisions (see existing memories).
