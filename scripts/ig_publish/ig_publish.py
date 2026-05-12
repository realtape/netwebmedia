#!/usr/bin/env python3
"""
Instagram autonomous publisher for NetWebMedia campaigns.

Uses `instagrapi` (unofficial IG private-API client) to post carousels and reels
to @netwebmedia without going through Meta's web UI or Graph API. This sidesteps
the walls that block browser automation on instagram.com:
  - Server-side feature-flag gating on web-create modal (display:none)
  - CSP blocking cross-origin asset fetch from netwebmedia.com
  - event.isTrusted check on synthetic clicks
  - Meta App Review wall (Graph API instagram_content_publish)

Why `instagrapi` works: it speaks Instagram's mobile-app HTTPS protocol directly,
which IS what the official IG app uses. No browser, no Graph API, no review.

⚠️  RISKS — read before first run:
  1. Instagram bans automation aggressively. Use at most ~5 posts/day per account.
     Spacing posts 4+ hours apart is safer.
  2. Session can get challenged (CAPTCHA / SMS verify). Script handles 2FA but
     not CAPTCHA — if challenged, log in via the IG mobile app first to clear it.
  3. This is an UNOFFICIAL library that reverse-engineers IG's mobile API. Meta
     can break it any time with an app update. Pin the version.
  4. Sessions persist in ~/.nwm-ig-session.json so you don't re-auth every run.
     That file contains long-lived auth tokens — keep it private.

Setup (one-time):
  1. Copy .env.ig.example → .env.ig at the repo root
  2. Fill in IG_USERNAME and IG_PASSWORD
  3. pip install -r scripts/ig_publish/requirements.txt
  4. First run: python scripts/ig_publish/ig_publish.py status
     (will prompt for 2FA code if enabled, then save session)
  5. Subsequent runs: session loaded automatically, no prompts

Usage examples:
  python ig_publish.py status
      Probe connection, verify @netwebmedia is the active session.

  python ig_publish.py carousel campaign-cmo-en-3slide
      Post the 3-slide carousel from assets/social/higgsfield/campaign-cmo-en-3slide/
      Uses cmo3_en_slide_{1,2,3}.png + caption.txt from that folder.

  python ig_publish.py carousel campaign-cmo-en
      Post the 6-slide carousel.

  python ig_publish.py reel campaign-cmo-en-3slide
      Post the stats reel (cmo3_en_reel_stats.mp4) + caption from same folder.

  python ig_publish.py carousel campaign-cmo-en-3slide --dry-run
      Validate everything (paths, file sizes, caption length, session) without
      actually posting. ALWAYS run dry-run first on a fresh asset folder.

  python ig_publish.py logout
      Clear the saved session. Use if the account got into a weird state.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Optional

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
SESSION_PATH = Path.home() / ".nwm-ig-session.json"
ASSETS_BASE = REPO_ROOT / "assets" / "social" / "higgsfield"

# Load .env.ig if present (lightweight loader — no python-dotenv dependency)
ENV_FILE = REPO_ROOT / ".env.ig"
if ENV_FILE.exists():
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def _import_instagrapi():
    """Import instagrapi with a friendly error if missing."""
    try:
        from instagrapi import Client
        from instagrapi.exceptions import (
            LoginRequired,
            ChallengeRequired,
            TwoFactorRequired,
            PleaseWaitFewMinutes,
            BadPassword,
        )
        return Client, LoginRequired, ChallengeRequired, TwoFactorRequired, PleaseWaitFewMinutes, BadPassword
    except ImportError:
        print("ERROR: instagrapi not installed. Run:")
        print(f"    pip install -r {Path(__file__).parent / 'requirements.txt'}")
        sys.exit(2)


# Module-level imports (deferred after env load)
Client, LoginRequired, ChallengeRequired, TwoFactorRequired, PleaseWaitFewMinutes, BadPassword = _import_instagrapi()


# ───────────────────────────────────────────────────────────────────────────
# Session management
# ───────────────────────────────────────────────────────────────────────────

def login(username: str, password: str, verbose: bool = True) -> Client:
    """Login to IG. Reuses ~/.nwm-ig-session.json if present and valid."""
    cl = Client()
    cl.delay_range = [2, 5]  # human-like inter-request delay

    # Try session reuse
    if SESSION_PATH.exists():
        try:
            session = json.loads(SESSION_PATH.read_text(encoding="utf-8"))
            cl.set_settings(session)
            cl.login(username, password)
            # Force a benign API call to verify the session is alive
            cl.get_timeline_feed()
            if verbose:
                print(f"[OK] Loaded session from {SESSION_PATH}")
            return cl
        except (LoginRequired, ChallengeRequired) as e:
            if verbose:
                print(f"[WARN] Saved session invalid ({type(e).__name__}); re-authenticating...")
            SESSION_PATH.unlink(missing_ok=True)
        except Exception as e:
            if verbose:
                print(f"[WARN] Session reuse failed: {e}; re-authenticating...")
            SESSION_PATH.unlink(missing_ok=True)

    # Fresh login
    try:
        cl.login(username, password)
    except TwoFactorRequired:
        code = input("Instagram 2FA code (6 digits): ").strip()
        cl.login(username, password, verification_code=code)
    except ChallengeRequired:
        print("ERROR: IG asked for a security challenge. Open the IG mobile app, "
              "complete the challenge there, then re-run this script.")
        sys.exit(3)
    except BadPassword:
        print("ERROR: bad IG credentials. Check IG_USERNAME / IG_PASSWORD in .env.ig.")
        sys.exit(3)

    # Save session for next time
    SESSION_PATH.write_text(json.dumps(cl.get_settings(), indent=2), encoding="utf-8")
    if verbose:
        print(f"[OK] Logged in fresh. Session saved to {SESSION_PATH}.")
    return cl


# ───────────────────────────────────────────────────────────────────────────
# Asset discovery
# ───────────────────────────────────────────────────────────────────────────

def discover_carousel(campaign: str) -> tuple[list[Path], str]:
    """Find carousel slide PNGs + caption.txt in a campaign folder."""
    folder = ASSETS_BASE / campaign
    if not folder.is_dir():
        raise FileNotFoundError(f"Campaign folder not found: {folder}")

    # Carousel slides: anything matching *slide_<N>.png in numeric order
    pngs = sorted(folder.glob("*slide_*.png"))
    if not pngs:
        # Fall back to a-slide-1.png / b-slide-2.png pattern (the original IG carousels)
        pngs = sorted(folder.glob("*-slide-*.png"))
    if not pngs:
        raise FileNotFoundError(f"No carousel slides found in {folder} (looked for *slide_*.png)")

    caption_path = folder / "caption.txt"
    if not caption_path.is_file():
        raise FileNotFoundError(f"caption.txt missing from {folder}")
    caption = caption_path.read_text(encoding="utf-8").strip()

    return pngs, caption


def discover_reel(campaign: str) -> tuple[Path, str]:
    """Find an MP4 reel + caption.txt in a campaign folder."""
    folder = ASSETS_BASE / campaign
    if not folder.is_dir():
        raise FileNotFoundError(f"Campaign folder not found: {folder}")

    mp4s = sorted(folder.glob("*.mp4"))
    if not mp4s:
        raise FileNotFoundError(f"No .mp4 reel found in {folder}")
    # Prefer files with "reel" in the name; otherwise take the first MP4
    reel = next((m for m in mp4s if "reel" in m.name.lower()), mp4s[0])

    caption_path = folder / "caption.txt"
    if not caption_path.is_file():
        raise FileNotFoundError(f"caption.txt missing from {folder}")
    caption = caption_path.read_text(encoding="utf-8").strip()
    return reel, caption


# ───────────────────────────────────────────────────────────────────────────
# Publishing actions
# ───────────────────────────────────────────────────────────────────────────

def cmd_status(args, creds):
    cl = login(creds["username"], creds["password"])
    me = cl.account_info()
    print()
    print(f"  username:      @{me.username}")
    print(f"  full_name:     {me.full_name}")
    print(f"  is_business:   {getattr(me, 'is_business', '?')}")
    print(f"  media_count:   {me.media_count}")
    print(f"  follower_count:{me.follower_count}")
    print(f"  following:     {me.following_count}")
    print()
    print("[OK] IG session healthy. Ready to publish.")


def cmd_carousel(args, creds):
    pngs, caption = discover_carousel(args.campaign)
    print(f"Carousel: {len(pngs)} slides from assets/social/higgsfield/{args.campaign}/")
    for p in pngs:
        print(f"  - {p.name}  ({p.stat().st_size // 1024} KB)")
    print(f"Caption: {len(caption)} chars")
    print(f"  preview: {caption[:120]}...")
    print()

    if args.dry_run:
        print("[DRY-RUN] Would post the above. No API call made.")
        return

    cl = login(creds["username"], creds["password"])
    print("Uploading carousel to Instagram... (45-90 sec)")
    media = cl.album_upload([str(p) for p in pngs], caption=caption)
    print()
    print(f"[OK] Posted! Media ID: {media.pk}")
    print(f"     Permalink:       https://www.instagram.com/p/{media.code}/")


def cmd_reel(args, creds):
    reel_path, caption = discover_reel(args.campaign)
    size_mb = reel_path.stat().st_size / (1024 * 1024)
    print(f"Reel: {reel_path.name}  ({size_mb:.1f} MB)")
    print(f"Caption: {len(caption)} chars")
    print(f"  preview: {caption[:120]}...")
    print()

    if args.dry_run:
        print("[DRY-RUN] Would post the above. No API call made.")
        return

    cl = login(creds["username"], creds["password"])
    print("Uploading reel to Instagram... (60-120 sec; IG re-encodes server-side)")
    # clip_upload posts as a Reel by default for vertical videos
    media = cl.clip_upload(str(reel_path), caption=caption)
    print()
    print(f"[OK] Posted! Media ID: {media.pk}")
    print(f"     Permalink:       https://www.instagram.com/reel/{media.code}/")


def cmd_logout(args, creds):
    if SESSION_PATH.exists():
        SESSION_PATH.unlink()
        print(f"[OK] Session cleared: {SESSION_PATH}")
    else:
        print(f"[OK] No session to clear at {SESSION_PATH}")


# ───────────────────────────────────────────────────────────────────────────
# CLI
# ───────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Instagram autonomous publisher for NetWebMedia campaigns",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    sub = parser.add_subparsers(dest="cmd", required=True)

    sub.add_parser("status", help="Probe IG connection + show account info")

    p_car = sub.add_parser("carousel", help="Post a multi-slide carousel")
    p_car.add_argument("campaign", help="Folder name under assets/social/higgsfield/")
    p_car.add_argument("--dry-run", action="store_true")

    p_reel = sub.add_parser("reel", help="Post a video reel")
    p_reel.add_argument("campaign", help="Folder name under assets/social/higgsfield/")
    p_reel.add_argument("--dry-run", action="store_true")

    sub.add_parser("logout", help="Clear the saved IG session")

    args = parser.parse_args()

    username = os.environ.get("IG_USERNAME")
    password = os.environ.get("IG_PASSWORD")
    if args.cmd != "logout" and (not username or not password):
        print("ERROR: IG_USERNAME / IG_PASSWORD not set.")
        print(f"       Copy {REPO_ROOT / '.env.ig.example'} → {REPO_ROOT / '.env.ig'}")
        print("       and fill in the values (NEVER commit .env.ig — it's gitignored).")
        sys.exit(1)

    creds = {"username": username, "password": password}
    handlers = {
        "status": cmd_status,
        "carousel": cmd_carousel,
        "reel": cmd_reel,
        "logout": cmd_logout,
    }
    try:
        handlers[args.cmd](args, creds)
    except PleaseWaitFewMinutes:
        print("ERROR: Instagram is rate-limiting this account. Wait 30+ minutes and try again.")
        sys.exit(4)
    except KeyboardInterrupt:
        print("\nAborted.")
        sys.exit(130)
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
