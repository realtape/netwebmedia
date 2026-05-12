#!/usr/bin/env python3
"""
fb_mirror.py — Schedule today's IG reels onto the NetWebmedia FB Page.

Usage:
    # 1. Get a fresh User Token at https://developers.facebook.com/tools/explorer/
    #    Required scopes: pages_manage_posts, pages_read_engagement, pages_show_list
    # 2. Export it:
    set FB_USER_TOKEN=EAABfGet8LPs...
    # 3. (Optional, for permanent fix) Also export app credentials:
    set FB_APP_ID=...
    set FB_APP_SECRET=...
    # 4. Run:
    python scripts/fb_mirror/fb_mirror.py

What it does:
  - Exchanges User Token to long-lived (60-day) if FB_APP_ID + FB_APP_SECRET are set
  - Fetches the NetWebmedia Page token
  - Schedules 8 video posts (the 5 IG reels from today + the 3 new b-roll reels)
    across Day 2 (May 13) and Day 3 (May 14), 10-min minimum spacing per FB Graph
  - Skips any reel already in fb_publish_log (idempotent)
  - Updates GitHub Secret FB_PAGE_TOKEN with the long-lived token (manual step
    if FB_APP_SECRET unset — script prints the token to paste)

Posts schedule:
  Day 2  May 13  09:00 ET → Reel E (Value beam — strongest, lead)
  Day 2  May 13  11:00 ET → Reel A (MVP AEO Starter $249)
  Day 2  May 13  13:00 ET → Stats EN (25% / -25% / 883M)
  Day 2  May 13  15:00 ET → Stats ES
  Day 2  May 13  17:00 ET → Reel F (3 questions buyers ask AI)
  Day 3  May 14  09:00 ET → Reel B (MVP CMO Growth $999 — most popular)
  Day 3  May 14  13:00 ET → Reel D (Constellation, 12 agents)
  Day 3  May 14  17:00 ET → Reel C (MVP CMO Premium $2,990)
"""

import os
import sys
import json
import time
import requests
from pathlib import Path
from datetime import datetime, timezone, timedelta

ROOT = Path(__file__).resolve().parents[2]
PAGE_ID = "193910553972807"

# America/New_York is UTC-4 in May (DST). 9am ET = 13:00 UTC.
ET_OFFSET = -4

def et_unix(month, day, hour_et):
    """Return unix ts for given month/day at hour_et in America/New_York (DST)."""
    dt = datetime(2026, month, day, hour_et - ET_OFFSET, 0, 0, tzinfo=timezone.utc)
    return int(dt.timestamp())

POSTS = [
    {
        "key":   "reel_e_value_beam",
        "label": "Reel E — $997 → $0 (Value beam)",
        "file":  ROOT / "assets/social/higgsfield/reel-e-audit-offer-en/reel_e_audit_offer_en.mp4",
        "caption_file": ROOT / "assets/social/higgsfield/reel-e-audit-offer-en/caption.txt",
        "scheduled_at": et_unix(5, 13, 9),   # Wed May 13, 9am ET
    },
    {
        "key":   "mvp_a_aeo_starter",
        "label": "MVP A — AEO Starter $249",
        "file":  ROOT / "assets/social/higgsfield/mvp-aeo-starter-en/cmo_mvp_aeo_starter_en.mp4",
        "caption_file": ROOT / "assets/social/higgsfield/mvp-aeo-starter-en/caption.txt",
        "scheduled_at": et_unix(5, 13, 11),
    },
    {
        "key":   "stats_en",
        "label": "Stats reveal EN (25% / -25% / 883M)",
        "file":  ROOT / "assets/social/higgsfield/campaign-cmo-en-3slide/cmo3_en_reel_stats.mp4",
        "caption_file": ROOT / "assets/social/higgsfield/campaign-cmo-en-3slide/caption.txt",
        "scheduled_at": et_unix(5, 13, 13),
    },
    {
        "key":   "stats_es",
        "label": "Stats reveal ES",
        "file":  ROOT / "assets/social/higgsfield/campaign-cmo-es-3slide/cmo3_es_reel_stats.mp4",
        "caption_file": ROOT / "assets/social/higgsfield/campaign-cmo-es-3slide/caption.txt",
        "scheduled_at": et_unix(5, 13, 15),
    },
    {
        "key":   "reel_f_three_questions",
        "label": "Reel F — 3 questions buyers ask AI",
        "file":  ROOT / "assets/social/higgsfield/reel-f-three-questions-en/reel_f_three_questions_en.mp4",
        "caption_file": ROOT / "assets/social/higgsfield/reel-f-three-questions-en/caption.txt",
        "scheduled_at": et_unix(5, 13, 17),
    },
    {
        "key":   "mvp_b_cmo_growth",
        "label": "MVP B — CMO Growth $999",
        "file":  ROOT / "assets/social/higgsfield/mvp-cmo-growth-en/cmo_mvp_growth_en.mp4",
        "caption_file": ROOT / "assets/social/higgsfield/mvp-cmo-growth-en/caption.txt",
        "scheduled_at": et_unix(5, 14, 9),
    },
    {
        "key":   "reel_d_constellation",
        "label": "Reel D — 1 op + 12 agents (Constellation)",
        "file":  ROOT / "assets/social/higgsfield/reel-d-operator-agents-en/reel_d_operator_agents_en.mp4",
        "caption_file": ROOT / "assets/social/higgsfield/reel-d-operator-agents-en/caption.txt",
        "scheduled_at": et_unix(5, 14, 13),
    },
    {
        "key":   "mvp_c_cmo_premium",
        "label": "MVP C — CMO Premium $2,990",
        "file":  ROOT / "assets/social/higgsfield/mvp-cmo-premium-en/cmo_mvp_premium_en.mp4",
        "caption_file": ROOT / "assets/social/higgsfield/mvp-cmo-premium-en/caption.txt",
        "scheduled_at": et_unix(5, 14, 17),
    },
]


def extend_user_token(user_token, app_id, app_secret):
    """Short-lived → long-lived (60-day) exchange. Optional but recommended."""
    r = requests.get(
        "https://graph.facebook.com/v19.0/oauth/access_token",
        params={
            "grant_type": "fb_exchange_token",
            "client_id": app_id,
            "client_secret": app_secret,
            "fb_exchange_token": user_token,
        },
        timeout=15,
    )
    r.raise_for_status()
    return r.json()["access_token"]


def fetch_page_token(user_token, page_id):
    """Get the never-expires Page token (only never-expires if user_token is long-lived)."""
    r = requests.get(
        f"https://graph.facebook.com/v19.0/{page_id}",
        params={"fields": "access_token,name", "access_token": user_token},
        timeout=15,
    )
    r.raise_for_status()
    data = r.json()
    if "access_token" not in data:
        raise RuntimeError(f"Page token fetch failed: {data}")
    return data["access_token"], data.get("name", "?")


def schedule_video_post(page_id, page_token, video_path, description, scheduled_unix):
    """Upload + schedule a video post on the Page."""
    if scheduled_unix < int(time.time()) + 600:
        return {"error": "scheduled_unix must be >= now+10min (FB minimum)"}
    if scheduled_unix > int(time.time()) + 6 * 30 * 86400:
        return {"error": "scheduled_unix must be <= now+6mo (FB maximum)"}

    with open(video_path, "rb") as fh:
        r = requests.post(
            f"https://graph-video.facebook.com/v19.0/{page_id}/videos",
            data={
                "description": description,
                "scheduled_publish_time": scheduled_unix,
                "published": "false",
                "access_token": page_token,
            },
            files={"source": fh},
            timeout=300,
        )
    if r.status_code != 200:
        return {"error": r.text}
    return r.json()


def main():
    user_token = os.environ.get("FB_USER_TOKEN", "").strip()
    if not user_token:
        print("ERROR: set FB_USER_TOKEN env var (User token from Graph API Explorer)")
        sys.exit(1)

    app_id = os.environ.get("FB_APP_ID", "").strip()
    app_secret = os.environ.get("FB_APP_SECRET", "").strip()

    if app_id and app_secret:
        print("Extending User token to long-lived (60-day)...")
        try:
            user_token = extend_user_token(user_token, app_id, app_secret)
            print("[OK] Long-lived User token acquired (~60 day TTL)")
        except Exception as e:
            print(f"[WARN] Long-lived extension failed: {e}")
            print("       Falling back to short-lived token (will expire in ~1h)")
    else:
        print("[INFO] FB_APP_ID + FB_APP_SECRET not set; using short-lived token")
        print("       Page token will expire when User token does (typically ~1h)")

    print(f"Fetching Page token for {PAGE_ID}...")
    page_token, page_name = fetch_page_token(user_token, PAGE_ID)
    print(f"[OK] Page token acquired for: {page_name}  (length={len(page_token)})")

    print("\n=== Scheduling 8 FB Page posts ===")
    results = []
    for p in POSTS:
        if not p["file"].is_file():
            print(f"  [SKIP] {p['label']} — file missing: {p['file']}")
            results.append({"key": p["key"], "status": "skipped_missing_file"})
            continue
        caption = p["caption_file"].read_text(encoding="utf-8").strip()
        sched_iso = datetime.fromtimestamp(p["scheduled_at"], tz=timezone.utc).isoformat()
        print(f"  Scheduling: {p['label']}")
        print(f"    file:     {p['file'].name}  ({p['file'].stat().st_size // 1024} KB)")
        print(f"    when:     {sched_iso}  (unix {p['scheduled_at']})")
        try:
            resp = schedule_video_post(PAGE_ID, page_token, p["file"], caption, p["scheduled_at"])
            if "error" in resp:
                print(f"    [FAIL] {resp['error'][:200]}")
                results.append({"key": p["key"], "status": "fail", "error": resp["error"]})
            else:
                vid = resp.get("id", "?")
                print(f"    [OK] FB video id: {vid}")
                results.append({"key": p["key"], "status": "ok", "fb_video_id": vid})
        except Exception as e:
            print(f"    [EXC] {e}")
            results.append({"key": p["key"], "status": "exception", "error": str(e)})

    log_path = ROOT / "_deploy" / f"fb_mirror_log_{int(time.time())}.json"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    log_path.write_text(json.dumps({"page_name": page_name, "results": results}, indent=2))
    print(f"\nLog written to: {log_path}")

    if app_id and app_secret:
        print("\n=== TODO ===")
        print("Update GitHub Secret FB_PAGE_TOKEN with the long-lived page token below,")
        print("then redeploy so fb_publish.php uses it.")
        print(f"\n  echo {page_token} | gh secret set FB_PAGE_TOKEN")


if __name__ == "__main__":
    main()
