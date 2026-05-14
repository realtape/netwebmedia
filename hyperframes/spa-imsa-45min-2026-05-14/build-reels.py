#!/usr/bin/env python3
"""
Spa IMSA 45-min Sprint -> 3 highlight reels, dual-handle (@realiracing + @realtape).

Pipeline:
  1) cuts          -> 3 b-roll clips at 1440x2560 with original audio
  2) compositions  -> 6 HTMLs (3 reels x 2 handles)
  3) render        -> 6 silent MP4s via hyperframes
  4) mux           -> 6 final MP4s with onboard audio

Usage:
  python build-reels.py thumbs        # extract 60s-interval thumbs for scrubbing
  python build-reels.py cuts          # cut all 3 b-roll clips
  python build-reels.py compositions  # write all 6 HTMLs
  python build-reels.py render-all    # render every reel sequentially
  python build-reels.py render R01-IG # render specific reel
  python build-reels.py list          # list all reel IDs + timings
"""

import os
import subprocess
import sys
import shutil
from pathlib import Path

BASE = Path(__file__).parent.resolve()
FFMPEG = r"C:\Users\Usuario\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin\ffmpeg.exe"
SOURCE = BASE / "sources" / "video-spa-45min.mp4"

# 3 highlight moments verified via thumbnail scrub (60s-interval thumbs/t-*.jpg).
# t-006: full pack visible, opening lap energy
# t-025: close behind a GTD Porsche, mid-race chase
# t-050: red Ferrari ahead, last-lap pursuit
REELS = [
    dict(rid="R01", start=330,  dur=20, accent="#FF1A1A", arch="THE START",
         hook='GREEN<br>AT <span class="accent">SPA.</span>',
         hud_label="LAP",   hud_val="1",      hud_sub="20 cars. one apex.",
         build='IMSA Multiclass.<br>45-min sprint at <span class="accent">Spa.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(rid="R02", start=1470, dur=20, accent="#00D4FF", arch="THE CHASE",
         hook='REELING IN<br>THE <span class="accent">PORSCHE.</span>',
         hud_label="GAP",   hud_val="0.4s",   hud_sub="closing every lap",
         build='IMSA Multiclass.<br>Three corners to <span class="accent">make the pass.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(rid="R03", start=2985, dur=20, accent="#FF1A1A", arch="LAST LAP",
         hook='ONE LAP<br>TO THE <span class="accent">FLAG.</span>',
         hud_label="POS",   hud_val="P14",    hud_sub="ferrari in sight",
         build='IMSA Multiclass.<br>45 minutes of focus = <span class="accent">one finish line.</span>',
         cta="FULL RACE ON THE CHANNEL"),
]

# Two output variants per reel
HANDLES = [
    ("IG", "REALIRACING"),   # Instagram @realiracing
    ("YT", "REALTAPE"),      # YouTube @realtape
]

TEMPLATE = """<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1440, height=2560" />
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;800;900&family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: 1440px; height: 2560px; overflow: hidden; background: #000; font-family: 'Poppins', sans-serif; }}
      .clip {{ position: absolute; top: 0; left: 0; }}
      .broll {{ position: absolute; top:0; left:0; width: 1440px; height: 2560px; object-fit: cover; }}
      .broll-tint-top {{ position: absolute; top:0; left:0; width: 1440px; height: 2560px; background: linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 22%, rgba(0,0,0,0.0) 38%); }}
      .broll-tint-bottom {{ position: absolute; top:0; left:0; width: 1440px; height: 2560px; background: linear-gradient(180deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.0) 35%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,0.85) 100%); }}
      .handle {{ position: absolute; top: 80px; left: 50%; transform: translateX(-50%); color: #fff; font-weight: 800; font-size: 43px; letter-spacing: 5px; text-shadow: 0 3px 11px rgba(0,0,0,0.7); opacity: 0.95; }}
      .handle .at {{ color: {ACCENT}; }}
      .chapter {{ position: absolute; top: 233px; left: 80px; background: {ACCENT}; color: #fff; font-family: 'JetBrains Mono', monospace; font-size: 29px; font-weight: 700; letter-spacing: 5px; text-transform: uppercase; padding: 13px 27px; opacity: 0; }}
      #hook {{ position: absolute; top: 333px; left: 80px; width: 1280px; opacity: 0; }}
      #hook-headline {{ color: #fff; font-size: 144px; font-weight: 900; line-height: 0.96; text-transform: uppercase; text-shadow: 0 5px 27px rgba(0,0,0,0.92); letter-spacing: -1px; }}
      #hook-headline .accent {{ color: {ACCENT}; }}
      #hud {{ position: absolute; top: 987px; left: 80px; width: 720px; opacity: 0; background: rgba(0,0,0,0.72); border-left: 8px solid {ACCENT}; padding: 35px 43px; backdrop-filter: blur(11px); }}
      #hud-label {{ color: {ACCENT}; font-family: 'JetBrains Mono', monospace; font-size: 24px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 13px; }}
      #hud-val {{ color: #fff; font-size: 112px; font-weight: 900; line-height: 1; }}
      #hud-sub {{ color: rgba(255,255,255,0.85); font-family: 'Inter', sans-serif; font-size: 29px; font-weight: 400; margin-top: 11px; }}
      #build {{ position: absolute; top: 1467px; left: 80px; width: 1280px; opacity: 0; }}
      #build-text {{ color: #fff; font-family: 'Inter', sans-serif; font-size: 59px; font-weight: 700; line-height: 1.18; text-shadow: 0 3px 16px rgba(0,0,0,0.92); }}
      #build-text .accent {{ color: {ACCENT}; }}
      #cta {{ position: absolute; bottom: 120px; left: 50%; transform: translateX(-50%); width: 1280px; text-align: center; opacity: 0; }}
      #cta-line1 {{ color: #fff; font-size: 48px; font-weight: 800; line-height: 1.1; text-transform: uppercase; text-shadow: 0 3px 16px rgba(0,0,0,0.9); margin-bottom: 19px; }}
      #cta-handle {{ display: inline-block; background: {ACCENT}; color: #fff; font-size: 51px; font-weight: 800; padding: 24px 51px; border-radius: 80px; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 11px 37px rgba(255,26,26,0.45); }}
      #progress {{ position: absolute; bottom: 0; left: 0; width: 0; height: 11px; background: {ACCENT}; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="{ID_LOWER}" data-start="0" data-duration="{DUR}" data-width="1440" data-height="2560">
      <video id="broll" class="broll clip" muted autoplay loop src="assets/broll/clip-{RID}.mp4" data-start="0" data-duration="{DUR}" data-track-index="0"></video>
      <div class="broll-tint-top clip" data-start="0" data-duration="{DUR}" data-track-index="1"></div>
      <div class="broll-tint-bottom clip" data-start="0" data-duration="{DUR}" data-track-index="2"></div>
      <div class="handle clip" data-start="0" data-duration="{DUR}" data-track-index="3"><span class="at">@</span>{HANDLE}</div>
      <div class="chapter clip" id="chapter" data-start="0" data-duration="5" data-track-index="4">// {ARCH}</div>
      <div id="hook" class="clip" data-start="0" data-duration="5" data-track-index="5">
        <div id="hook-headline">{HOOK}</div>
      </div>
      <div id="hud" class="clip" data-start="5" data-duration="6" data-track-index="6">
        <div id="hud-label">{HUD_LABEL}</div>
        <div id="hud-val">{HUD_VAL}</div>
        <div id="hud-sub">{HUD_SUB}</div>
      </div>
      <div id="build" class="clip" data-start="11" data-duration="6" data-track-index="7">
        <div id="build-text">{BUILD}</div>
      </div>
      <div id="cta" class="clip" data-start="16" data-duration="4" data-track-index="8">
        <div id="cta-line1">{CTA}</div>
        <div id="cta-handle">@{HANDLE}</div>
      </div>
      <div id="progress" class="clip" data-start="0" data-duration="{DUR}" data-track-index="98"></div>
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      const tl = gsap.timeline({{ paused: true }});
      tl.fromTo("#chapter", {{ opacity: 0, x: -30 }}, {{ opacity: 1, x: 0, duration: 0.35, ease: "power2.out" }}, 0.1)
        .to("#chapter", {{ opacity: 0, x: -20, duration: 0.3, ease: "power2.in" }}, 4.7);
      tl.fromTo("#hook", {{ opacity: 0, y: 40 }}, {{ opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }}, 0.25)
        .to("#hook", {{ opacity: 0, y: -25, duration: 0.4, ease: "power2.in" }}, 4.55);
      tl.fromTo("#hud", {{ opacity: 0, x: -50 }}, {{ opacity: 1, x: 0, duration: 0.45, ease: "power3.out" }}, 5.1)
        .to("#hud", {{ opacity: 0, x: -25, duration: 0.35, ease: "power2.in" }}, 10.55);
      tl.fromTo("#build", {{ opacity: 0, y: 25 }}, {{ opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }}, 11.1)
        .to("#build", {{ opacity: 0, y: -20, duration: 0.35, ease: "power2.in" }}, 16.55);
      tl.fromTo("#cta", {{ opacity: 0, scale: 0.9 }}, {{ opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.5)" }}, 16.1);
      tl.fromTo("#progress", {{ width: 0 }}, {{ width: 1440, duration: {DUR}, ease: "none" }}, 0);
      window.__timelines["{ID_LOWER}"] = tl;
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
"""


def ensure_dirs():
    for d in ("assets/broll", "compositions", "renders", "thumbs"):
        (BASE / d).mkdir(parents=True, exist_ok=True)


def extract_thumbs():
    """Extract 1 thumbnail per minute for scrubbing race timestamps."""
    if not SOURCE.exists():
        print(f"  SKIP thumbs: source not present yet ({SOURCE.name})")
        return False
    out_pattern = str(BASE / "thumbs" / "t-%03d.jpg")
    print("  THUMBS: 1/min from source")
    cmd = [FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
           "-i", str(SOURCE),
           "-vf", "fps=1/60,scale=480:-2",
           "-q:v", "4", out_pattern]
    rc = subprocess.call(cmd)
    return rc == 0


def cut_one(r):
    """Cut 1440x2560 vertical clip from source, KEEPING audio."""
    out = BASE / "assets" / "broll" / f"clip-{r['rid']}.mp4"
    if not SOURCE.exists():
        print(f"  SKIP {r['rid']}: source missing")
        return False
    if out.exists() and out.stat().st_size > 5_000_000:
        print(f"  KEEP {r['rid']}: clip already cut ({out.stat().st_size // 1024 // 1024} MB)")
        return True
    print(f"  CUT  {r['rid']} @ {r['start']}s for {r['dur']}s (1440x2560 + audio)")
    cmd = [FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
           "-ss", str(r["start"]), "-i", str(SOURCE),
           "-t", str(r["dur"]),
           "-vf", "scale=-2:2560,crop=1440:2560,fps=30",
           "-c:v", "libx264", "-preset", "fast", "-crf", "20",
           "-c:a", "aac", "-b:a", "192k", "-ac", "2",
           "-movflags", "+faststart", str(out)]
    rc = subprocess.call(cmd)
    return rc == 0


def comp_id(rid, suffix):
    return f"{rid}-{suffix}"


def write_composition(r, suffix, handle):
    cid = comp_id(r["rid"], suffix)
    out = BASE / "compositions" / f"reel-{cid}.html"
    html = TEMPLATE.format(
        ID_LOWER=cid.lower(), RID=r["rid"],
        DUR=r["dur"], ACCENT=r["accent"], ARCH=r["arch"],
        HOOK=r["hook"], HUD_LABEL=r["hud_label"], HUD_VAL=r["hud_val"],
        HUD_SUB=r["hud_sub"], BUILD=r["build"], CTA=r["cta"],
        HANDLE=handle,
    )
    out.write_text(html, encoding="utf-8")
    print(f"  HTML {cid}")


def render_one(r, suffix):
    """Render via hyperframes (silent), then mux audio from b-roll clip."""
    cid = comp_id(r["rid"], suffix)
    out_mp4 = BASE / "renders" / f"reel-{cid}.mp4"
    if out_mp4.exists() and out_mp4.stat().st_size > 500_000:
        print(f"  KEEP RENDER {cid}: already rendered ({out_mp4.stat().st_size // 1024 // 1024} MB)")
        return True
    comp_html = BASE / "compositions" / f"reel-{cid}.html"
    if not comp_html.exists():
        print(f"  SKIP {cid}: composition missing")
        return False
    idx_html = BASE / "index.html"
    shutil.copyfile(comp_html, idx_html)
    print(f"  RENDER {cid}")
    silent_mp4 = BASE / "renders" / f"reel-{cid}-silent.mp4"
    cmd = ["npx", "hyperframes", "render", "-q", "high", "-f", "30",
           "-o", str(silent_mp4)]
    rc = subprocess.call(cmd, cwd=str(BASE), shell=True)
    try:
        idx_html.unlink()
    except Exception:
        pass
    if rc != 0 or not silent_mp4.exists():
        return False
    broll = BASE / "assets" / "broll" / f"clip-{r['rid']}.mp4"
    print(f"  MUX  {cid} (audio from {broll.name})")
    mux_cmd = [FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
               "-i", str(silent_mp4), "-i", str(broll),
               "-map", "0:v:0", "-map", "1:a:0",
               "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
               "-shortest", str(out_mp4)]
    mrc = subprocess.call(mux_cmd)
    if mrc == 0:
        silent_mp4.unlink()
    return mrc == 0


def find_reel(rid):
    for r in REELS:
        if r["rid"] == rid:
            return r
    raise SystemExit(f"reel {rid} not found")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    ensure_dirs()
    op = sys.argv[1]
    if op == "thumbs":
        extract_thumbs()
    elif op == "cuts":
        for r in REELS:
            cut_one(r)
    elif op == "compositions":
        for r in REELS:
            for suffix, handle in HANDLES:
                write_composition(r, suffix, handle)
    elif op == "render":
        for cid in sys.argv[2:]:
            rid, suffix = cid.split("-", 1)
            r = find_reel(rid)
            handle = dict(HANDLES)[suffix]
            cut_one(r)
            write_composition(r, suffix, handle)
            render_one(r, suffix)
    elif op == "render-all":
        for r in REELS:
            cut_one(r)
            for suffix, handle in HANDLES:
                write_composition(r, suffix, handle)
                render_one(r, suffix)
    elif op == "list":
        for r in REELS:
            for suffix, handle in HANDLES:
                cid = comp_id(r["rid"], suffix)
                print(f"  {cid:>8}  start={r['start']:>5}s  dur={r['dur']:>2}s  "
                      f"{r['arch']:>16}  @{handle.lower()}")
    else:
        print(f"unknown op: {op}")
        sys.exit(1)


if __name__ == "__main__":
    main()
