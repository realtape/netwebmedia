#!/usr/bin/env python3
"""
compose_reel.py — Pipeline B reel composer.

Takes an abstract Kling MP4 (NO text-prone elements per its prompt) and composites
NWM-branded text overlays via ffmpeg drawtext at pixel-perfect timing. NWM logo
lockup also composited bottom-left. Optional music track gets ducked under any
voiceover if present.

This is the defect-proof replacement for letting Kling render text directly. Every
piece of visible text on the final reel comes from a real font file (Arial Bold,
or downloaded Inter/Poppins), not from Kling's image-generation model. No more
"ChatGFPT" or "Stop Buring Ad Buiqet" defects.

Usage:
  python compose_reel.py overlays.json -i raw.mp4 -o final.mp4

  overlays.json schema:
    {
      "background_video": "path/to/kling.mp4",         # input video (no text)
      "output": "path/to/final.mp4",                    # output
      "logo": "C:/.../nwm-logo-lockup.png",              # optional logo overlay
      "music": "C:/.../track.mp3",                      # optional music track
      "music_volume_db": -8,                            # how much to attenuate music
      "text_overlays": [
        {
          "text": "25%",
          "start": 1.8,                                  # seconds
          "end": 4.5,
          "x": "(w-text_w)/2",                          # ffmpeg expression
          "y": "h*0.30",
          "font_size": 220,
          "color": "#FF671F",                            # NWM orange
          "font": "C:/Windows/Fonts/arialbd.ttf",
          "fade_in": 0.3,
          "fade_out": 0.3
        },
        # ... more overlays
      ]
    }

The script writes each text to a temp .txt file (avoids drawtext's nightmarish
shell-escaping for %, :, ', \\), then references them via textfile=. ffmpeg's
own filtergraph handles font rendering and antialiasing.
"""

from __future__ import annotations

import argparse
import json
import shlex
import subprocess
import sys
import tempfile
from pathlib import Path


def build_drawtext_filter(overlays: list[dict], textfile_dir: Path) -> str:
    """Compose a single drawtext filtergraph string with N overlays."""
    chunks = []
    for idx, ov in enumerate(overlays):
        # Write text to its own file so we don't fight shell escaping
        textfile = textfile_dir / f"overlay_{idx:02d}.txt"
        textfile.write_text(ov["text"], encoding="utf-8")

        start = float(ov["start"])
        end = float(ov["end"])
        fade_in = float(ov.get("fade_in", 0))
        fade_out = float(ov.get("fade_out", 0))

        # Alpha expression: fade in over fade_in seconds, fade out over fade_out seconds
        if fade_in or fade_out:
            alpha_expr = (
                f"if(lt(t,{start}),0,"
                f"if(lt(t,{start + fade_in}),(t-{start})/{fade_in},"
                f"if(lt(t,{end - fade_out}),1,"
                f"if(lt(t,{end}),({end}-t)/{fade_out},0))))"
            )
            enable_expr = f"between(t,{start},{end})"
            alpha_kv = f"alpha='{alpha_expr}'"
        else:
            enable_expr = f"between(t,{start},{end})"
            alpha_kv = ""

        # ffmpeg drawtext requires forward-slashes in font paths even on Windows
        font_path = str(Path(ov["font"])).replace("\\", "/").replace(":", "\\:")
        textfile_str = str(textfile).replace("\\", "/").replace(":", "\\:")

        parts = [
            f"fontfile='{font_path}'",
            f"textfile='{textfile_str}'",
            f"fontcolor={ov['color']}",
            f"fontsize={ov['font_size']}",
            f"x={ov['x']}",
            f"y={ov['y']}",
            f"enable='{enable_expr}'",
            "borderw=0",
        ]
        if alpha_kv:
            parts.append(alpha_kv)
        if ov.get("box"):
            parts.append("box=1")
            parts.append(f"boxcolor={ov.get('box_color', '#010F3B@0.6')}")
            parts.append(f"boxborderw={ov.get('box_padding', 24)}")
        if ov.get("shadow"):
            parts.append(f"shadowcolor={ov.get('shadow_color', 'black@0.5')}")
            parts.append(f"shadowx={ov.get('shadow_x', 3)}")
            parts.append(f"shadowy={ov.get('shadow_y', 3)}")

        chunks.append("drawtext=" + ":".join(parts))

    return ",".join(chunks)


def compose(spec_path: Path, input_override: str | None, output_override: str | None) -> int:
    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    bg = Path(input_override or spec["background_video"]).resolve()
    out = Path(output_override or spec["output"]).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)

    if not bg.is_file():
        print(f"ERROR: background video not found: {bg}")
        return 2

    overlays = spec.get("text_overlays", [])
    logo = spec.get("logo")
    music = spec.get("music")
    music_db = spec.get("music_volume_db", -8)

    with tempfile.TemporaryDirectory(prefix="reel-compose-") as tmpdir:
        tmp = Path(tmpdir)
        # Stage 1: drawtext overlays
        filter_text = build_drawtext_filter(overlays, tmp) if overlays else "null"

        # Build ffmpeg command
        # Pattern: [0:v] drawtext... [vt]; [1:v] scale + overlay = logo composite [v];
        #          [vt] = text-overlayed; [v] = final video
        cmd: list[str] = ["ffmpeg", "-y", "-loglevel", "error", "-i", str(bg)]
        filter_parts: list[str] = []

        if logo:
            # ffprobe the main video width so we can compute logo_w as a fixed pixel value
            # (ffmpeg scale filter doesn't expose main-canvas dimensions; W/H only work in overlay)
            probe = subprocess.run(
                ["ffprobe", "-v", "error", "-select_streams", "v:0",
                 "-show_entries", "stream=width", "-of", "csv=p=0", str(bg)],
                capture_output=True, text=True
            )
            main_w = int(probe.stdout.strip() or "1080")
            logo_w = int(main_w * 0.22)
            cmd.extend(["-i", str(Path(logo).resolve())])
            filter_parts.append(f"[0:v]{filter_text}[vt]")
            # Scale logo to ~22% of video width, place bottom-left at 6% inset
            filter_parts.append(
                f"[1:v]scale={logo_w}:-1,format=rgba,colorchannelmixer=aa=0.92[wm]"
            )
            filter_parts.append("[vt][wm]overlay=W*0.06:H-h-H*0.06[v]")
            map_video = "[v]"
        else:
            filter_parts.append(f"[0:v]{filter_text}[v]")
            map_video = "[v]"

        # Audio handling
        if music:
            cmd.extend(["-i", str(Path(music).resolve())])
            music_input = "2:a" if logo else "1:a"
            # Lower the music volume by music_db dB and loop/trim to match video length
            filter_parts.append(
                f"[{music_input}]volume={music_db}dB,aloop=loop=-1:size=2e+09[ma]"
            )
            map_audio = "[ma]"
        else:
            map_audio = None

        filter_complex = ";".join(filter_parts)
        cmd.extend(["-filter_complex", filter_complex, "-map", map_video])
        if map_audio:
            cmd.extend(["-map", map_audio, "-shortest"])
        # IG / FB / TT-friendly H.264 + AAC
        cmd.extend([
            "-c:v", "libx264", "-preset", "medium", "-crf", "20",
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
        ])
        if map_audio:
            cmd.extend(["-c:a", "aac", "-b:a", "192k"])
        else:
            cmd.append("-an")
        cmd.append(str(out))

        # Run
        print("Running ffmpeg...")
        print("  " + " ".join(shlex.quote(c) for c in cmd))
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print("ERROR: ffmpeg failed")
            print(result.stderr)
            return 3

    print(f"[OK] composed reel: {out}")
    print(f"     size: {out.stat().st_size // 1024} KB")
    return 0


def main():
    ap = argparse.ArgumentParser(description="Compose a NWM reel from abstract Kling MP4 + text overlays + logo.")
    ap.add_argument("spec", help="Path to JSON overlay spec")
    ap.add_argument("-i", "--input", help="Override background_video from spec")
    ap.add_argument("-o", "--output", help="Override output from spec")
    args = ap.parse_args()
    sys.exit(compose(Path(args.spec), args.input, args.output))


if __name__ == "__main__":
    main()
