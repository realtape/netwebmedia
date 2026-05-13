#!/usr/bin/env python3
"""
Spa-Francorchamps 40-reel generator.
Reads the manifest below, cuts b-roll with ffmpeg, generates Hyperframes HTML
compositions from the universal template, and renders via `npx hyperframes`.

Usage:
  python build-reels.py cuts            # cut all b-roll
  python build-reels.py compositions    # write all HTMLs
  python build-reels.py render R02 R12  # render specific reels
  python build-reels.py render-all      # render every reel sequentially
  python build-reels.py wave1           # generate+cut+render R02 R12 R32 (V01/V02/V04 starts)
"""

import json
import os
import subprocess
import sys
import shutil
from pathlib import Path

BASE = Path(__file__).parent.resolve()
FFMPEG = r"C:\Users\Usuario\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin\ffmpeg.exe"
def _find_source(stem):
    """Find source file with stem in /sources, accepting .mp4 or .webm."""
    for ext in (".mp4", ".webm", ".mkv"):
        p = BASE / "sources" / f"{stem}{ext}"
        if p.exists():
            return p
    return BASE / "sources" / f"{stem}.mp4"

SOURCES = {
    "V01": _find_source("video-01-imsa-89min"),
    "V02": _find_source("video-02-imsa-50min"),
    "V03": _find_source("video-03-porsche-100min"),
    "V04": _find_source("video-04-imsa-16min"),
}

# Each reel: id, source, cut_start_sec, duration_sec, accent, archetype,
# hook (HTML allowed), hud_label, hud_val, hud_sub, build_html, cta_line
# Color accents: #FF1A1A (crimson, default), #FFB400 (amber, caution), #00D4FF (cyan, technical)
REELS = [
    # V01 — IMSA 89-min
    dict(id="R01", src="V01", start=1170, dur=20, accent="#FF1A1A", arch="PRE-GREEN",
         hook='BEFORE<br>LIGHTS <span class="accent">OUT.</span>',
         hud_label="GRID", hud_val="20", hud_sub="cars on the line at Spa",
         build='IMSA Multiclass.<br><span class="accent">Spa-Francorchamps.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R02", src="V01", start=1230, dur=20, accent="#FF1A1A", arch="THE START",
         hook='GREEN.<br>GO. GO. <span class="accent">GO.</span>',
         hud_label="LAP", hud_val="1", hud_sub="Spa is awake",
         build='IMSA Multiclass.<br>Lights out at <span class="accent">Spa.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R03", src="V01", start=1320, dur=20, accent="#FF1A1A", arch="EAU ROUGE",
         hook='FLAT THROUGH<br>EAU <span class="accent">ROUGE.</span>',
         hud_label="ELEVATION", hud_val="40m", hud_sub="climbing up Raidillon",
         build='IMSA GTD.<br>The corner that <span class="accent">defines Spa.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R04", src="V01", start=1500, dur=20, accent="#FF1A1A", arch="FIRST OVERTAKE",
         hook='INSIDE LINE<br>AT LES <span class="accent">COMBES.</span>',
         hud_label="POSITION", hud_val="+1", hud_sub="gained on entry",
         build='IMSA Multiclass.<br>The first <span class="accent">move</span> of the race.',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R05", src="V01", start=1920, dur=20, accent="#FFB400", arch="DEFEND",
         hook='DEFEND<br>THE <span class="accent">LINE.</span>',
         hud_label="GAP", hud_val="0.4s", hud_sub="closing every lap",
         build='IMSA Multiclass.<br>The mirrors <span class="accent">just got busy.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R06", src="V01", start=2280, dur=20, accent="#FFB400", arch="THE MISTAKE",
         hook='ALMOST<br>LOST <span class="accent">IT.</span>',
         hud_label="SECTOR", hud_val="S2", hud_sub="wide at Blanchimont",
         build='IMSA Multiclass.<br>One mistake = <span class="accent">three seconds.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R07", src="V01", start=2640, dur=20, accent="#00D4FF", arch="PURPLE SECTOR",
         hook='PURPLE<br>SECTOR <span class="accent">INCOMING.</span>',
         hud_label="DELTA", hud_val="-0.3s", hud_sub="vs personal best",
         build='IMSA Multiclass.<br>Free time hiding in <span class="accent">Pouhon.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R08", src="V01", start=3120, dur=20, accent="#FF1A1A", arch="WHEEL TO WHEEL",
         hook='WHEEL TO WHEEL<br>THROUGH <span class="accent">POUHON.</span>',
         hud_label="GAP", hud_val="0.0", hud_sub="side by side",
         build='IMSA Multiclass.<br>Neither lifts. <span class="accent">Spa rewards faith.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R09", src="V01", start=3600, dur=20, accent="#FF1A1A", arch="FINAL STINT",
         hook='FIVE LAPS<br>TO <span class="accent">GO.</span>',
         hud_label="LAP", hud_val="9/13", hud_sub="gloves off",
         build='IMSA Multiclass.<br>The last stint <span class="accent">writes the story.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R10", src="V01", start=3870, dur=20, accent="#FF1A1A", arch="THE LINE",
         hook='TO THE<br><span class="accent">FLAG.</span>',
         hud_label="FINISH", hud_val="P-?", hud_sub="watch the channel",
         build='IMSA Multiclass.<br>89 minutes of focus = <span class="accent">one finish line.</span>',
         cta="FULL RACE ON THE CHANNEL"),

    # V02 — IMSA 50-min
    dict(id="R11", src="V02", start=270, dur=20, accent="#FF1A1A", arch="PRE-GREEN",
         hook='LIGHTS OUT<br>T-MINUS <span class="accent">60.</span>',
         hud_label="GRID", hud_val="20", hud_sub="lined up at La Source",
         build='IMSA Multiclass.<br><span class="accent">Spa-Francorchamps.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R12", src="V02", start=330, dur=20, accent="#FF1A1A", arch="THE START",
         hook='GREEN<br>AT <span class="accent">SPA.</span>',
         hud_label="LAP", hud_val="1", hud_sub="20 cars. one apex.",
         build='IMSA Multiclass.<br>50-min sprint. <span class="accent">No safety net.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R13", src="V02", start=390, dur=20, accent="#FF1A1A", arch="EAU ROUGE",
         hook='UPHILL<br><span class="accent">FLAT OUT.</span>',
         hud_label="SPEED", hud_val="245kph", hud_sub="through Raidillon",
         build='IMSA Multiclass.<br>The corner where <span class="accent">faith earns time.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R14", src="V02", start=540, dur=20, accent="#FF1A1A", arch="FIRST OVERTAKE",
         hook='THE PASS<br>AT LES <span class="accent">COMBES.</span>',
         hud_label="POSITION", hud_val="+1", hud_sub="brake later, exit cleaner",
         build='IMSA Multiclass.<br>One pass = <span class="accent">10 minutes saved.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R15", src="V02", start=840, dur=20, accent="#FFB400", arch="DEFEND",
         hook='HOLD<br>THE <span class="accent">INSIDE.</span>',
         hud_label="GAP", hud_val="0.6s", hud_sub="DRS in range",
         build='IMSA Multiclass.<br>Mirrors full. <span class="accent">Line tighter.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R16", src="V02", start=1320, dur=20, accent="#FFB400", arch="THE MISTAKE",
         hook='WIDE AT<br><span class="accent">STAVELOT.</span>',
         hud_label="SECTOR", hud_val="S3", hud_sub="grass tap on exit",
         build='IMSA Multiclass.<br>The track always <span class="accent">collects the debt.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R17", src="V02", start=1680, dur=20, accent="#00D4FF", arch="PURPLE SECTOR",
         hook='NEW<br>PERSONAL <span class="accent">BEST.</span>',
         hud_label="DELTA", hud_val="-0.4s", hud_sub="purple S1+S2",
         build='IMSA Multiclass.<br><span class="accent">Free time</span> waiting in Pouhon.',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R18", src="V02", start=2040, dur=20, accent="#FF1A1A", arch="WHEEL TO WHEEL",
         hook='THREE<br><span class="accent">WIDE.</span>',
         hud_label="GAP", hud_val="0.0", hud_sub="GTD vs GTP traffic",
         build='IMSA Multiclass.<br>Spa was <span class="accent">made</span> for this.',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R19", src="V02", start=2400, dur=20, accent="#FF1A1A", arch="FINAL STINT",
         hook='LAST LAPS.<br>GLOVES <span class="accent">OFF.</span>',
         hud_label="LAP", hud_val="14/17", hud_sub="fuel saving over",
         build='IMSA Multiclass.<br>The last 5 minutes <span class="accent">decide everything.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R20", src="V02", start=2670, dur=20, accent="#FF1A1A", arch="THE LINE",
         hook='TAKE<br>THE <span class="accent">FLAG.</span>',
         hud_label="FINISH", hud_val="P-?", hud_sub="50 minutes done",
         build='IMSA Multiclass.<br>One race. <span class="accent">Every corner counted.</span>',
         cta="FULL RACE ON THE CHANNEL"),

    # V03 — Porsche Cup 992.2 100-min — TWO races confirmed via thumbs.
    # Race 1: ~09:00-30:00 (R21-R25). Race 2: ~65:00-95:00 (R26-R30).
    dict(id="R21", src="V03", start=540, dur=20, accent="#FF1A1A", arch="PRE-GREEN",
         hook='11 LAPS.<br>ONE <span class="accent">CHANCE.</span>',
         hud_label="GRID", hud_val="20", hud_sub="all 992.2 Cup cars",
         build='Porsche Cup 992.2.<br><span class="accent">Spa-Francorchamps.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R22", src="V03", start=600, dur=20, accent="#FF1A1A", arch="THE START",
         hook='GREEN.<br>PORSCHE <span class="accent">CUP.</span>',
         hud_label="LAP", hud_val="1/11", hud_sub="single-make. no excuses.",
         build='Porsche Cup 992.2.<br>20 identical cars. <span class="accent">One winner.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R23", src="V03", start=720, dur=20, accent="#FF1A1A", arch="EAU ROUGE",
         hook='EAU ROUGE<br>FLAT IN A <span class="accent">CUP CAR.</span>',
         hud_label="G-FORCE", hud_val="3.2g", hud_sub="compression bottoms it out",
         build='Porsche 992.2.<br>500hp. <span class="accent">Zero downforce help.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R24", src="V03", start=900, dur=20, accent="#FF1A1A", arch="FIRST OVERTAKE",
         hook='DIVE BOMB<br>INTO LES <span class="accent">COMBES.</span>',
         hud_label="POSITION", hud_val="+1", hud_sub="committed late",
         build='Porsche Cup 992.2.<br>Same car. <span class="accent">Brake later wins.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R25", src="V03", start=1200, dur=20, accent="#FFB400", arch="DEFEND",
         hook='DEFEND.<br>DEFEND. <span class="accent">DEFEND.</span>',
         hud_label="GAP", hud_val="0.3s", hud_sub="he is faster on the straight",
         build='Porsche Cup 992.2.<br>No DRS. <span class="accent">No tricks.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    # Race 2 (post-BRB break)
    dict(id="R26", src="V03", start=4080, dur=20, accent="#FFB400", arch="THE MISTAKE",
         hook='LOCK-UP<br>INTO LA <span class="accent">SOURCE.</span>',
         hud_label="TIME LOST", hud_val="+1.8s", hud_sub="flat-spot inbound",
         build='Porsche Cup 992.2.<br>One late brake = <span class="accent">qualifying gone.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R27", src="V03", start=4500, dur=20, accent="#00D4FF", arch="PURPLE SECTOR",
         hook='LAP DELTA<br>WENT <span class="accent">PURPLE.</span>',
         hud_label="DELTA", hud_val="-0.5s", hud_sub="found grip mid-corner",
         build='Porsche Cup 992.2.<br>The reward for <span class="accent">trusting it.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R28", src="V03", start=4800, dur=20, accent="#FF1A1A", arch="WHEEL TO WHEEL",
         hook='DOOR HANDLE<br>TO DOOR <span class="accent">HANDLE.</span>',
         hud_label="GAP", hud_val="0.0", hud_sub="Spa rewards both",
         build='Porsche Cup 992.2.<br>No room. <span class="accent">No backing out.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R29", src="V03", start=5400, dur=20, accent="#FF1A1A", arch="FINAL STINT",
         hook='TWO LAPS<br>TO <span class="accent">GO.</span>',
         hud_label="LAP", hud_val="9/11", hud_sub="tires fading",
         build='Porsche Cup 992.2.<br>Worn rubber. <span class="accent">Wide open.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R30", src="V03", start=5700, dur=20, accent="#FF1A1A", arch="THE LINE",
         hook='CROSSING<br>THE <span class="accent">LINE.</span>',
         hud_label="FINISH", hud_val="P-?", hud_sub="11 laps. one number.",
         build='Porsche Cup 992.2.<br>Sprint format. <span class="accent">Sprint finish.</span>',
         cta="FULL RACE ON THE CHANNEL"),

    # V04 — IMSA 16-min (compact) — timestamps confirmed via thumbs; race starts ~04:30
    dict(id="R31", src="V04", start=240, dur=20, accent="#FF1A1A", arch="PRE-GREEN",
         hook='THE BUTTON<br>YOU CAN\'T <span class="accent">UN-PRESS.</span>',
         hud_label="STATUS", hud_val="ARMED", hud_sub="engine cycle complete",
         build='IMSA Multiclass.<br><span class="accent">Spa-Francorchamps.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R32", src="V04", start=290, dur=20, accent="#FF1A1A", arch="THE START",
         hook='GREEN FLAG<br><span class="accent">SPA.</span>',
         hud_label="LAP", hud_val="1", hud_sub="20 cars into La Source",
         build='IMSA Multiclass.<br>The first 30 seconds <span class="accent">decide the race.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R33", src="V04", start=360, dur=20, accent="#FF1A1A", arch="EAU ROUGE",
         hook='UP THROUGH<br><span class="accent">RAIDILLON.</span>',
         hud_label="SPEED", hud_val="240kph", hud_sub="committing blind",
         build='IMSA Multiclass.<br>Crest the hill. <span class="accent">Find your line.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R34", src="V04", start=420, dur=20, accent="#FF1A1A", arch="FIRST OVERTAKE",
         hook='INSIDE<br>AT LES <span class="accent">COMBES.</span>',
         hud_label="POSITION", hud_val="+1", hud_sub="late brake. clean exit.",
         build='IMSA Multiclass.<br>The corner where <span class="accent">positions change.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R35", src="V04", start=510, dur=20, accent="#FFB400", arch="DEFEND",
         hook='NOT<br><span class="accent">TODAY.</span>',
         hud_label="GAP", hud_val="0.2s", hud_sub="mirrors don't lie",
         build='IMSA Multiclass.<br>Closing the door. <span class="accent">No regrets.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R36", src="V04", start=600, dur=20, accent="#FFB400", arch="THE MISTAKE",
         hook='ALMOST<br><span class="accent">GONE.</span>',
         hud_label="SECTOR", hud_val="S2", hud_sub="tap of grass at Pouhon",
         build='IMSA Multiclass.<br>Half a wheel = <span class="accent">half a second.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R37", src="V04", start=690, dur=20, accent="#00D4FF", arch="PURPLE SECTOR",
         hook='PURPLE THROUGH<br><span class="accent">SECTOR 2.</span>',
         hud_label="DELTA", hud_val="-0.3s", hud_sub="middle sector unlocked",
         build='IMSA Multiclass.<br>Where the lap <span class="accent">gets fast.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R38", src="V04", start=780, dur=20, accent="#FF1A1A", arch="WHEEL TO WHEEL",
         hook='SIDE BY<br><span class="accent">SIDE.</span>',
         hud_label="GAP", hud_val="0.0", hud_sub="contact-free, somehow",
         build='IMSA Multiclass.<br>Trust the other driver. <span class="accent">Trust yourself more.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R39", src="V04", start=840, dur=20, accent="#FF1A1A", arch="FINAL STINT",
         hook='TWO<br>TO <span class="accent">GO.</span>',
         hud_label="LAP", hud_val="6/8", hud_sub="last fast laps",
         build='IMSA Multiclass.<br>The race only <span class="accent">remembers the end.</span>',
         cta="FULL RACE ON THE CHANNEL"),
    dict(id="R40", src="V04", start=920, dur=20, accent="#FF1A1A", arch="THE LINE",
         hook='TO THE<br><span class="accent">FLAG.</span>',
         hud_label="FINISH", hud_val="P-?", hud_sub="16 minutes of focus",
         build='IMSA Multiclass.<br>Short race. <span class="accent">Long memory.</span>',
         cta="FULL RACE ON THE CHANNEL"),
]

TEMPLATE = r"""<!doctype html>
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
      <video id="broll" class="broll clip" muted autoplay loop src="assets/broll/clip-{ID}.mp4" data-start="0" data-duration="{DUR}" data-track-index="0"></video>
      <div class="broll-tint-top clip" data-start="0" data-duration="{DUR}" data-track-index="1"></div>
      <div class="broll-tint-bottom clip" data-start="0" data-duration="{DUR}" data-track-index="2"></div>
      <div class="handle clip" data-start="0" data-duration="{DUR}" data-track-index="3"><span class="at">@</span>REALTAPE</div>
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
        <div id="cta-handle">@REALTAPE</div>
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
      tl.fromTo("#progress", {{ width: 0 }}, {{ width: 1080, duration: {DUR}, ease: "none" }}, 0);
      window.__timelines["{ID_LOWER}"] = tl;
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
"""

def find_reel(rid):
    for r in REELS:
        if r["id"] == rid:
            return r
    raise SystemExit(f"reel {rid} not found")

def ensure_dirs():
    for d in ("assets/broll", "compositions", "renders"):
        (BASE / d).mkdir(parents=True, exist_ok=True)

def cut_one(r):
    """Cut 1440x2560 vertical clip from source, KEEPING audio."""
    src = SOURCES[r["src"]]
    out = BASE / "assets" / "broll" / f"clip-{r['id']}.mp4"
    if not src.exists():
        print(f"  SKIP {r['id']}: source missing ({src.name})")
        return False
    if out.exists() and out.stat().st_size > 5_000_000:
        print(f"  KEEP {r['id']}: clip already cut ({out.stat().st_size // 1024 // 1024} MB)")
        return True
    print(f"  CUT  {r['id']} from {r['src']} @ {r['start']}s for {r['dur']}s (1440x2560 + audio)")
    cmd = [FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
           "-ss", str(r["start"]), "-i", str(src),
           "-t", str(r["dur"]),
           "-vf", "scale=-2:2560,crop=1440:2560,fps=30",
           "-c:v", "libx264", "-preset", "fast", "-crf", "20",
           "-c:a", "aac", "-b:a", "192k", "-ac", "2",
           "-movflags", "+faststart", str(out)]
    rc = subprocess.call(cmd)
    return rc == 0

def write_composition(r):
    out = BASE / "compositions" / f"reel-{r['id']}.html"
    html = TEMPLATE.format(
        ID=r["id"], ID_LOWER=r["id"].lower(),
        DUR=r["dur"], ACCENT=r["accent"], ARCH=r["arch"],
        HOOK=r["hook"], HUD_LABEL=r["hud_label"], HUD_VAL=r["hud_val"],
        HUD_SUB=r["hud_sub"], BUILD=r["build"], CTA=r["cta"],
    )
    out.write_text(html, encoding="utf-8")
    print(f"  HTML {r['id']}")

def render_one(r):
    """Render via hyperframes (silent), then mux audio from b-roll clip."""
    out_mp4 = BASE / "renders" / f"reel-{r['id']}.mp4"
    if out_mp4.exists() and out_mp4.stat().st_size > 500_000:
        print(f"  KEEP RENDER {r['id']}: already rendered ({out_mp4.stat().st_size // 1024 // 1024} MB)")
        return True
    comp_html = BASE / "compositions" / f"reel-{r['id']}.html"
    idx_html = BASE / "index.html"
    shutil.copyfile(comp_html, idx_html)
    print(f"  RENDER {r['id']}")
    silent_mp4 = BASE / "renders" / f"reel-{r['id']}-silent.mp4"
    cmd = ["npx", "hyperframes", "render", "-q", "high", "-f", "30",
           "-o", str(silent_mp4)]
    rc = subprocess.call(cmd, cwd=str(BASE), shell=True)
    try:
        idx_html.unlink()
    except Exception:
        pass
    if rc != 0 or not silent_mp4.exists():
        return False
    # Mux audio from b-roll clip onto the silent render
    broll = BASE / "assets" / "broll" / f"clip-{r['id']}.mp4"
    print(f"  MUX  {r['id']} (audio from {broll.name})")
    mux_cmd = [FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
               "-i", str(silent_mp4), "-i", str(broll),
               "-map", "0:v:0", "-map", "1:a:0",
               "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
               "-shortest", str(out_mp4)]
    mrc = subprocess.call(mux_cmd)
    if mrc == 0:
        silent_mp4.unlink()
    return mrc == 0

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    ensure_dirs()
    op = sys.argv[1]
    if op == "cuts":
        for r in REELS:
            cut_one(r)
    elif op == "compositions":
        for r in REELS:
            write_composition(r)
    elif op == "render":
        ids = sys.argv[2:]
        for rid in ids:
            r = find_reel(rid)
            cut_one(r) and write_composition(r) or None
            render_one(r)
    elif op == "render-all":
        for r in REELS:
            if r["id"] in sys.argv[2:] or not sys.argv[2:]:
                cut_one(r)
                write_composition(r)
                render_one(r)
    elif op == "wave1":
        for rid in ("R02", "R12", "R32"):
            r = find_reel(rid)
            cut_one(r)
            write_composition(r)
            render_one(r)
    elif op == "list":
        for r in REELS:
            print(f"{r['id']}  {r['src']}  start={r['start']:>5}s  dur={r['dur']:>2}s  {r['arch']:>16}  {r['hud_label']}={r['hud_val']}")
    else:
        print(f"unknown op: {op}")
        sys.exit(1)

if __name__ == "__main__":
    main()
