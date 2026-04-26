"""
NetWebMedia YouTube Shorts uploader.

Uploads + schedules all 10 reels to youtube.com/@netwebmedia.
Uses YouTube Data API v3 with OAuth2 (installed-app flow).

Setup:
  1. Place client_secret.json in this folder (or pass --client-secret).
  2. pip install google-auth-oauthlib google-api-python-client
  3. python yt_upload.py

First run opens browser for OAuth consent. Token cached in token.json.

Schedule: MWF 18:30 America/Santiago (UTC-4 during this window — CLT
standard time, no DST in Chile from 2026).
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from googleapiclient.errors import HttpError

SCOPES = ["https://www.googleapis.com/auth/youtube.upload",
          "https://www.googleapis.com/auth/youtube"]

HERE = Path(__file__).parent.resolve()
RENDERS = HERE / "renders"
TOKEN_PATH = HERE / "token.json"
DEFAULT_CLIENT_SECRET = HERE / "client_secret.json"

CLT = ZoneInfo("America/Santiago")

# Each reel: file, title (question form for YT search), 2-line desc, 3 hashtags, schedule.
# All times 18:30 America/Santiago → converted to UTC RFC3339 by the script.
REELS = [
    {
        "file": "reel-02-seo-dead.mp4",
        "title": "Is SEO dead in 2026?",
        "desc": ("SEO isn't dead — it just evolved into AEO. If your brand isn't "
                 "cited in AI answers, you're invisible.\n\n"
                 "Chat with us → netwebmedia.com"),
        "tags": ["AEO", "SEO", "FractionalCMO"],
        "schedule_clt": "2026-04-27 18:30",
    },
    {
        "file": "reel-01-ai-sdr.mp4",
        "title": "Can you replace a $70K SDR with $180/month of AI?",
        "desc": ("I built a working AI SDR in 9 minutes for $180/mo: Apollo + Clay "
                 "+ Claude + Smartlead + HubSpot.\n\n"
                 "Chat with us → netwebmedia.com"),
        "tags": ["AISDR", "OutboundSales", "FractionalCMO"],
        "schedule_clt": "2026-04-29 18:30",
    },
    {
        "file": "reel-03-80-hours.mp4",
        "title": "How do you give a founder 80 hours a month back?",
        "desc": ("Fractional CMO motion: strategy + specialists + AI agents, one "
                 "weekly sync. 90 days = 80 hours/mo back.\n\n"
                 "Chat with us → netwebmedia.com"),
        "tags": ["FractionalCMO", "FounderLife", "StartupGrowth"],
        "schedule_clt": "2026-05-01 18:30",
    },
    {
        "file": "reel-06-aeo-audit.mp4",
        "title": "Is your brand cited by ChatGPT? Run this audit.",
        "desc": ("5 steps: 20 ICP queries → run in ChatGPT/Claude/Perplexity → "
                 "log citations vs competitors → map gaps → fix.\n\n"
                 "Chat with us → netwebmedia.com"),
        "tags": ["AEO", "AIMarketing", "ContentStrategy"],
        "schedule_clt": "2026-05-04 18:30",
    },
    {
        "file": "reel-09-cac-62.mp4",
        "title": "How did we cut CAC 62% in 11 weeks?",
        "desc": ("3 levers: kill bottom 40% of ad spend, rebuild offer page around "
                 "1 objection, AI SDR on stale MQLs.\n\n"
                 "Chat with us → netwebmedia.com"),
        "tags": ["CAC", "GrowthMarketing", "FractionalCMO"],
        "schedule_clt": "2026-05-06 18:30",
    },
    {
        "file": "reel-07-agency-freelancer.mp4",
        "title": "Agency vs freelancer vs Fractional CMO — which fits?",
        "desc": ("Honest breakdown by ARR band. Fractional CMO wins for $500K-$10M "
                 "founders who need exec strategy without a $280K hire.\n\n"
                 "Chat with us → netwebmedia.com"),
        "tags": ["FractionalCMO", "StartupMarketing", "FounderAdvice"],
        "schedule_clt": "2026-05-08 18:30",
    },
    {
        "file": "reel-04-roas-playbook.mp4",
        "title": "What's the exact playbook to 3x Meta ROAS?",
        "desc": ("5 steps: audit creative by ROAS, rebuild hooks, consolidate ad "
                 "sets, match LP to ad, weekly kill/scale meeting.\n\n"
                 "Chat with us → netwebmedia.com"),
        "tags": ["ROAS", "MetaAds", "PerformanceMarketing"],
        "schedule_clt": "2026-05-11 18:30",
    },
    {
        "file": "reel-10-apollo-teardown.mp4",
        "title": "What's wrong with Apollo.io's homepage?",
        "desc": ("Teardown: generic hero, buried logos, competing CTAs, weak AEO "
                 "citation share. Public company should own more.\n\n"
                 "Chat with us → netwebmedia.com"),
        "tags": ["HomepageTeardown", "Positioning", "AEO"],
        "schedule_clt": "2026-05-13 18:30",
    },
    {
        "file": "reel-05-2m-teardown.mp4",
        "title": "What works inside a $2M/month Meta ad account?",
        "desc": ("Volume beats quality (40 ads/wk), UGC crushes studio 3-to-1, and "
                 "ROAS lies at scale — measure incrementality.\n\n"
                 "Chat with us → netwebmedia.com"),
        "tags": ["MetaAds", "PaidMedia", "Incrementality"],
        "schedule_clt": "2026-05-15 18:30",
    },
    {
        "file": "reel-08-340k-pipeline.mp4",
        "title": "How did one client build $340K pipeline in 90 days?",
        "desc": ("Killed 3 channels, installed AI SDR, rebuilt 5 pages around AEO, "
                 "scaled the 1 ad + 1 LP that worked. Concentration > expansion.\n\n"
                 "Chat with us → netwebmedia.com"),
        "tags": ["B2BSaaS", "Pipeline", "FractionalCMO"],
        "schedule_clt": "2026-05-18 18:30",
    },
]


def get_credentials(client_secret_path: Path) -> Credentials:
    creds = None
    if TOKEN_PATH.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not client_secret_path.exists():
                sys.exit(f"client_secret.json not found at {client_secret_path}. "
                         "Download from Google Cloud Console > APIs & Services > "
                         "Credentials > OAuth 2.0 Client IDs (Desktop app).")
            flow = InstalledAppFlow.from_client_secrets_file(str(client_secret_path), SCOPES)
            creds = flow.run_local_server(port=0)
        TOKEN_PATH.write_text(creds.to_json())
    return creds


def to_rfc3339_utc(local_str: str) -> str:
    """'2026-04-27 18:30' (CLT) -> RFC3339 UTC string."""
    dt_local = datetime.strptime(local_str, "%Y-%m-%d %H:%M").replace(tzinfo=CLT)
    return dt_local.astimezone(ZoneInfo("UTC")).strftime("%Y-%m-%dT%H:%M:%SZ")


def upload_one(youtube, reel: dict) -> str:
    path = RENDERS / reel["file"]
    if not path.exists():
        raise FileNotFoundError(f"Missing video: {path}")

    publish_at = to_rfc3339_utc(reel["schedule_clt"])
    description = reel["desc"] + "\n\n" + " ".join(f"#{t}" for t in reel["tags"])

    body = {
        "snippet": {
            "title": reel["title"],
            "description": description,
            "tags": reel["tags"] + ["netwebmedia", "aifractionalcmo"],
            "categoryId": "22",  # People & Blogs
            "defaultLanguage": "en",
            "defaultAudioLanguage": "en",
        },
        "status": {
            "privacyStatus": "private",  # required when publishAt is set
            "publishAt": publish_at,
            "selfDeclaredMadeForKids": False,
            "license": "youtube",
            "embeddable": True,
        },
    }

    media = MediaFileUpload(str(path), chunksize=-1, resumable=True,
                            mimetype="video/mp4")
    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)

    print(f"\n→ Uploading {reel['file']}  (scheduled {reel['schedule_clt']} CLT / {publish_at} UTC)")
    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            pct = int(status.progress() * 100)
            print(f"   {pct}%", end="\r")
    video_id = response["id"]
    print(f"   done. video_id = {video_id}")
    return video_id


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--client-secret", type=Path, default=DEFAULT_CLIENT_SECRET)
    parser.add_argument("--only", type=str, default=None,
                        help="Comma-separated reel filenames to upload (default: all 10)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Validate config + files + schedules; do not upload.")
    args = parser.parse_args()

    selected = REELS
    if args.only:
        wanted = {s.strip() for s in args.only.split(",")}
        selected = [r for r in REELS if r["file"] in wanted]
        if len(selected) != len(wanted):
            missing = wanted - {r["file"] for r in selected}
            sys.exit(f"Unknown reel(s): {missing}")

    # Pre-flight: every file exists and every schedule parses.
    print("Pre-flight check...")
    for r in selected:
        p = RENDERS / r["file"]
        if not p.exists():
            sys.exit(f"  MISSING: {p}")
        publish_at = to_rfc3339_utc(r["schedule_clt"])
        size_mb = p.stat().st_size / (1024 * 1024)
        print(f"  OK  {r['file']:<32}  {size_mb:6.1f} MB  -> {r['schedule_clt']} CLT  ({publish_at} UTC)")

    if args.dry_run:
        print("\nDry run — exiting without uploading.")
        return 0

    creds = get_credentials(args.client_secret)
    youtube = build("youtube", "v3", credentials=creds)

    results = {}
    for r in selected:
        try:
            vid = upload_one(youtube, r)
            results[r["file"]] = {"video_id": vid, "schedule_clt": r["schedule_clt"],
                                  "url": f"https://youtu.be/{vid}"}
        except HttpError as e:
            print(f"   FAILED: {e}")
            results[r["file"]] = {"error": str(e)}
        except Exception as e:
            print(f"   FAILED: {e}")
            results[r["file"]] = {"error": str(e)}

    out = HERE / "yt_upload_results.json"
    out.write_text(json.dumps(results, indent=2))
    print(f"\nResults written to {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
