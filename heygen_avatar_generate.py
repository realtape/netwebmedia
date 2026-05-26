#!/usr/bin/env python3
"""
heygen_avatar_generate.py
-------------------------
Automate HeyGen avatar-video generation for NetWebMedia content.

What it does:
  1. Submits a script + avatar + voice + brand background to HeyGen
     (POST https://api.heygen.com/v2/video/generate).
  2. Polls until the video finishes rendering
     (GET https://api.heygen.com/v1/video_status.get).
  3. Prints the final downloadable MP4 URL.

Helper modes:
  --list-avatars   List your available avatar_id values.
  --list-voices    List Spanish (LatAm) voice_id values.

Stdlib only — no pip install required. Python 3.8+.

SETUP
-----
1. Get your API key: HeyGen → Settings → API → "New Token".
2. Set it as an env var (do NOT hardcode it):
     Windows (PowerShell):  $env:HEYGEN_API_KEY="your_key_here"
     Windows (cmd):         set HEYGEN_API_KEY=your_key_here
     macOS/Linux:           export HEYGEN_API_KEY="your_key_here"
3. Find your avatar + voice IDs:
     python heygen_avatar_generate.py --list-avatars
     python heygen_avatar_generate.py --list-voices
4. Paste those IDs into the CONFIG block below (or pass --avatar / --voice).
5. Generate:
     python heygen_avatar_generate.py

NOTE: The raw Generate API supports avatar + voice + background + script.
"Studio template" extras (animated charts, chapter breaks, background music)
are not exposed here — build those from a HeyGen Studio template if needed.
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request

API_BASE = "https://api.heygen.com"

# ----------------------------------------------------------------------------
# CONFIG — edit these defaults once you know your avatar_id / voice_id.
# ----------------------------------------------------------------------------
DEFAULT_AVATAR_ID = "c58d907a18d3426085da01a855034d82"   # from --list-avatars
DEFAULT_VOICE_ID = "b02e8659016f4dbb8a92004cdf50ad04"     # Narrator Mateo - Friendly

# NetWebMedia brand background (Gulf Oil navy). Set to a hex color, or swap to
# an uploaded image asset by editing build_background().
BRAND_NAVY = "#010F3B"

# 15-second NetWebMedia AI-implementation script (neutral LatAm Spanish).
DEFAULT_SCRIPT = (
    "El problema hoy no es la falta de tecnologia, es el exceso. "
    "Todo cambia tan rapido que las empresas pierden productividad "
    "sin saber que usar. En NetWebMedia implementamos inteligencia "
    "artificial con un plan claro. Conversamos?"
)

# 9:16 vertical for Reels/TikTok. Use 1280x720 for landscape YouTube.
DEFAULT_WIDTH = 720
DEFAULT_HEIGHT = 1280

POLL_INTERVAL_SECONDS = 10
POLL_TIMEOUT_SECONDS = 900  # 15 min


def get_api_key():
    # 1) Prefer the environment variable if set.
    key = os.environ.get("HEYGEN_API_KEY", "").strip()
    # 2) Fallback: read heygen_key.txt sitting next to this script.
    if not key:
        key_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "heygen_key.txt")
        if os.path.exists(key_file):
            with open(key_file, "r", encoding="utf-8") as f:
                key = f.read().strip()
    if not key or "PEGA" in key.upper() or "TOKEN" == key.upper():
        sys.exit(
            "ERROR: No se encontro tu API key de HeyGen.\n"
            "Abre el archivo 'heygen_key.txt' (en esta misma carpeta), pega tu\n"
            "token de HeyGen ahi, guarda, y vuelve a ejecutar."
        )
    return key


def api_request(method, path, api_key, body=None):
    url = API_BASE + path
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("X-Api-Key", api_key)
    req.add_header("Accept", "application/json")
    if data is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")
        sys.exit(f"ERROR: HeyGen API {e.code} on {method} {path}\n{detail}")
    except urllib.error.URLError as e:
        sys.exit(f"ERROR: network problem reaching HeyGen: {e.reason}")


def list_avatars(api_key):
    out = api_request("GET", "/v2/avatars", api_key)
    avatars = (out.get("data") or {}).get("avatars") or []
    if not avatars:
        print("No avatars returned. Raw response:")
        print(json.dumps(out, indent=2)[:2000])
        return
    print(f"{'avatar_id':<40}  name")
    print("-" * 70)
    for a in avatars:
        print(f"{a.get('avatar_id',''):<40}  {a.get('avatar_name','')}")


def list_voices(api_key):
    out = api_request("GET", "/v2/voices", api_key)
    voices = (out.get("data") or {}).get("voices") or []
    es = [v for v in voices if str(v.get("language", "")).lower().startswith("span")
          or "es" in str(v.get("language", "")).lower()]
    rows = es or voices
    print(f"{'voice_id':<40}  {'language':<22}  gender  name")
    print("-" * 90)
    for v in rows:
        print(f"{v.get('voice_id',''):<40}  "
              f"{str(v.get('language','')):<22}  "
              f"{str(v.get('gender','')):<6}  "
              f"{v.get('name','')}")
    if es:
        print(f"\n(Showing {len(es)} Spanish voices; pass --all-voices logic by "
              f"editing list_voices to see every voice.)")


def build_background():
    """Solid brand-navy background. To use an uploaded image instead, return:
       {"type": "image", "image_asset_id": "<asset_id>", "fit": "cover"}"""
    return {"type": "color", "value": BRAND_NAVY}


def generate_video(api_key, script, avatar_id, voice_id, width, height, title):
    payload = {
        "title": title,
        "caption": False,
        "dimension": {"width": width, "height": height},
        "video_inputs": [
            {
                "character": {
                    "type": "avatar",
                    "avatar_id": avatar_id,
                    "avatar_style": "normal",
                },
                "voice": {
                    "type": "text",
                    "input_text": script,
                    "voice_id": voice_id,
                    "speed": 1.0,
                },
                "background": build_background(),
            }
        ],
    }
    out = api_request("POST", "/v2/video/generate", api_key, payload)
    video_id = (out.get("data") or {}).get("video_id")
    if not video_id:
        sys.exit(f"ERROR: no video_id in response:\n{json.dumps(out, indent=2)}")
    print(f"Submitted. video_id = {video_id}")
    return video_id


def poll_until_done(api_key, video_id):
    deadline = time.time() + POLL_TIMEOUT_SECONDS
    while time.time() < deadline:
        out = api_request("GET", f"/v1/video_status.get?video_id={video_id}", api_key)
        data = out.get("data") or {}
        status = data.get("status")
        if status == "completed":
            return data.get("video_url")
        if status == "failed":
            err = data.get("error") or data
            sys.exit(f"ERROR: render failed:\n{json.dumps(err, indent=2)}")
        print(f"  status={status} ... waiting {POLL_INTERVAL_SECONDS}s")
        time.sleep(POLL_INTERVAL_SECONDS)
    sys.exit("ERROR: timed out waiting for render.")


def main():
    p = argparse.ArgumentParser(description="Generate a NetWebMedia HeyGen avatar video.")
    p.add_argument("--list-avatars", action="store_true", help="List available avatar IDs and exit.")
    p.add_argument("--list-voices", action="store_true", help="List Spanish voice IDs and exit.")
    p.add_argument("--avatar", default=DEFAULT_AVATAR_ID, help="avatar_id override.")
    p.add_argument("--voice", default=DEFAULT_VOICE_ID, help="voice_id override.")
    p.add_argument("--script", default=DEFAULT_SCRIPT, help="Spoken script override.")
    p.add_argument("--script-file", help="Path to a .txt file with the script (overrides --script).")
    p.add_argument("--width", type=int, default=DEFAULT_WIDTH)
    p.add_argument("--height", type=int, default=DEFAULT_HEIGHT)
    p.add_argument("--title", default="NetWebMedia - IA para empresas (15s)")
    args = p.parse_args()

    api_key = get_api_key()

    if args.list_avatars:
        list_avatars(api_key)
        return
    if args.list_voices:
        list_voices(api_key)
        return

    script = args.script
    if args.script_file:
        with open(args.script_file, "r", encoding="utf-8") as f:
            script = f.read().strip()

    if "REPLACE_WITH" in args.avatar or "REPLACE_WITH" in args.voice:
        sys.exit(
            "ERROR: avatar_id / voice_id not set.\n"
            "Run with --list-avatars and --list-voices, then either edit the\n"
            "CONFIG block at the top of this file or pass --avatar / --voice."
        )

    print("Generating HeyGen video...")
    print(f"  avatar : {args.avatar}")
    print(f"  voice  : {args.voice}")
    print(f"  size   : {args.width}x{args.height}")
    video_id = generate_video(api_key, script, args.avatar, args.voice,
                              args.width, args.height, args.title)
    url = poll_until_done(api_key, video_id)
    print("\nDONE. Download your video:")
    print(url)


if __name__ == "__main__":
    main()
