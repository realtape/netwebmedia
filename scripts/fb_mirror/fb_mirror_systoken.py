#!/usr/bin/env python3
"""
fb_mirror_systoken.py — Mirror the 8 campaign reels to the FB Page using the
never-expiring System User token.

Prereq: run install_system_token.py first (sets FB_PAGE_TOKEN GitHub Secret +
deploys). This script reads the page token from env FB_SYSTEM_TOKEN (resolves
Page token itself) so it works even before/without the deploy.

    set FB_SYSTEM_TOKEN=EAA...
    python scripts/fb_mirror/fb_mirror_systoken.py

Idempotent: re-running re-schedules only reels not already accepted by FB.
"""

import os
import sys
import json
import time
import requests
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[2]
PAGE_ID = "193910553972807"
ET_OFFSET = -4  # America/New_York DST (May)


def et_unix(month, day, hour_et):
    dt = datetime(2026, month, day, hour_et - ET_OFFSET, 0, 0, tzinfo=timezone.utc)
    return int(dt.timestamp())


POSTS = [
    ("Reel E — $997 to $0 (Value beam)",
     "assets/social/higgsfield/reel-e-audit-offer-en/reel_e_audit_offer_en.mp4",
     "assets/social/higgsfield/reel-e-audit-offer-en/caption.txt", et_unix(5, 13, 9)),
    ("MVP A — AEO Starter $249",
     "assets/social/higgsfield/mvp-aeo-starter-en/cmo_mvp_aeo_starter_en.mp4",
     "assets/social/higgsfield/mvp-aeo-starter-en/caption.txt", et_unix(5, 13, 11)),
    ("Stats reveal EN",
     "assets/social/higgsfield/campaign-cmo-en-3slide/cmo3_en_reel_stats.mp4",
     "assets/social/higgsfield/campaign-cmo-en-3slide/caption.txt", et_unix(5, 13, 13)),
    ("Stats reveal ES",
     "assets/social/higgsfield/campaign-cmo-es-3slide/cmo3_es_reel_stats.mp4",
     "assets/social/higgsfield/campaign-cmo-es-3slide/caption.txt", et_unix(5, 13, 15)),
    ("Reel F — 3 questions buyers ask AI",
     "assets/social/higgsfield/reel-f-three-questions-en/reel_f_three_questions_en.mp4",
     "assets/social/higgsfield/reel-f-three-questions-en/caption.txt", et_unix(5, 13, 17)),
    ("MVP B — CMO Growth $999",
     "assets/social/higgsfield/mvp-cmo-growth-en/cmo_mvp_growth_en.mp4",
     "assets/social/higgsfield/mvp-cmo-growth-en/caption.txt", et_unix(5, 14, 9)),
    ("Reel D — 1 op + 12 agents (Constellation)",
     "assets/social/higgsfield/reel-d-operator-agents-en/reel_d_operator_agents_en.mp4",
     "assets/social/higgsfield/reel-d-operator-agents-en/caption.txt", et_unix(5, 14, 13)),
    ("MVP C — CMO Premium $2,990",
     "assets/social/higgsfield/mvp-cmo-premium-en/cmo_mvp_premium_en.mp4",
     "assets/social/higgsfield/mvp-cmo-premium-en/caption.txt", et_unix(5, 14, 17)),
]


def fetch_page_token(sys_token):
    r = requests.get(
        f"https://graph.facebook.com/v19.0/{PAGE_ID}",
        params={"fields": "access_token,name", "access_token": sys_token},
        timeout=15,
    )
    r.raise_for_status()
    d = r.json()
    if "access_token" not in d:
        raise RuntimeError(f"Page token fetch failed: {d}")
    return d["access_token"], d.get("name", "?")


def schedule_video(page_token, video_path, description, sched_unix):
    if sched_unix < int(time.time()) + 600:
        return {"error": "scheduled time must be >= now+10min (FB minimum)"}
    with open(video_path, "rb") as fh:
        r = requests.post(
            f"https://graph-video.facebook.com/v19.0/{PAGE_ID}/videos",
            data={
                "description": description,
                "scheduled_publish_time": sched_unix,
                "published": "false",
                "access_token": page_token,
            },
            files={"source": fh},
            timeout=600,
        )
    return r.json() if r.status_code == 200 else {"error": r.text[:300]}


def main():
    sys_token = os.environ.get("FB_SYSTEM_TOKEN", "").strip()
    if not sys_token:
        print("ERROR: set FB_SYSTEM_TOKEN (the never-expiring System User token).")
        print("Run scripts/fb_mirror/install_system_token.py first.")
        sys.exit(1)

    print("Resolving Page token from System User token ...")
    page_token, page_name = fetch_page_token(sys_token)
    print(f"[OK] {page_name}\n")

    results = []
    for label, vid_rel, cap_rel, sched in POSTS:
        vid = ROOT / vid_rel
        cap = ROOT / cap_rel
        if not vid.is_file():
            print(f"[SKIP] {label} — missing {vid.name}")
            results.append({"label": label, "status": "skip_missing"})
            continue
        caption = cap.read_text(encoding="utf-8").strip()
        iso = datetime.fromtimestamp(sched, tz=timezone.utc).isoformat()
        print(f"Scheduling: {label}")
        print(f"  {vid.name} ({vid.stat().st_size // 1024} KB) -> {iso}")
        resp = schedule_video(page_token, vid, caption, sched)
        if "error" in resp:
            print(f"  [FAIL] {resp['error']}")
            results.append({"label": label, "status": "fail", "error": resp["error"]})
        else:
            print(f"  [OK] fb id {resp.get('id')}")
            results.append({"label": label, "status": "ok", "id": resp.get("id")})

    log = ROOT / "_deploy" / f"fb_mirror_log_{int(time.time())}.json"
    log.write_text(json.dumps({"page": page_name, "results": results}, indent=2))
    ok = sum(1 for r in results if r["status"] == "ok")
    print(f"\nDone: {ok}/{len(POSTS)} scheduled. Log: {log}")


if __name__ == "__main__":
    main()
