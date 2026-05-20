#!/usr/bin/env python3
"""
Publish all 9 NetWebMedia service reels (R2..R10) to @netwebmedia via the
extended ig_publish.php handler. Mirrors the fb-schedule-campaign.yml pattern.

Pre-flight (handled by deploy-site-root.yml):
  - IG_BUSINESS_ACCOUNT_ID secret set in GitHub Actions
  - IG_GRAPH_TOKEN          secret set in GitHub Actions
  - MIGRATE_TOKEN           secret set in GitHub Actions (already configured)

Usage (Carlos hands):
  # readiness probe
  python3 _deploy/publish-service-reels.py --check

  # full sequence (dry-run first, then live)
  python3 _deploy/publish-service-reels.py --dry-run
  python3 _deploy/publish-service-reels.py

  # publish just one reel
  python3 _deploy/publish-service-reels.py --only R2

  # publish a subset (comma-separated)
  python3 _deploy/publish-service-reels.py --only R2,R3,R4

Environment:
  MIGRATE_TOKEN — required. Read from env var or passed via --token.
  API_BASE      — defaults to https://netwebmedia.com/crm-vanilla/api/
"""

import argparse
import json
import os
import sys
import time
from urllib import parse, request

DEFAULT_API_BASE = "https://netwebmedia.com/crm-vanilla/api/"
ALL_REELS = ["R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9", "R10"]
USER_AGENT = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")


def _request(url: str, *, method: str = "GET", body: dict | None = None, timeout: int = 180) -> tuple[int, dict | str]:
    data = None
    headers = {
        "User-Agent": USER_AGENT,
        "Origin": "https://netwebmedia.com",
        "Referer": "https://netwebmedia.com/crm-vanilla/",
        "Accept": "application/json",
    }
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = request.Request(url, data=data, method=method, headers=headers)
    try:
        with request.urlopen(req, timeout=timeout) as r:
            raw = r.read().decode("utf-8", errors="replace")
            try:
                return r.status, json.loads(raw)
            except Exception:
                return r.status, raw
    except Exception as e:
        # urlopen raises on 4xx/5xx — try to read the body anyway
        if hasattr(e, "read"):
            raw = e.read().decode("utf-8", errors="replace")  # type: ignore
            try:
                return getattr(e, "code", 0), json.loads(raw)
            except Exception:
                return getattr(e, "code", 0), raw
        return 0, str(e)


def check(api_base: str, token: str) -> int:
    url = f"{api_base.rstrip('/')}/?r=ig_publish&action=status&token={parse.quote(token)}"
    code, body = _request(url)
    print(f"[status] HTTP {code}")
    print(json.dumps(body, indent=2) if isinstance(body, dict) else body)
    if not isinstance(body, dict):
        return 2
    if not body.get("configured"):
        print("\nNOT READY: IG_BUSINESS_ACCOUNT_ID and IG_GRAPH_TOKEN must be set in GitHub Secrets.")
        return 3
    if not body.get("account_accessible", True):
        print("\nNOT READY: Token cannot access the configured IG_BUSINESS_ACCOUNT_ID.")
        return 4
    print("\nREADY.")
    return 0


def list_reels(api_base: str, token: str) -> int:
    url = f"{api_base.rstrip('/')}/?r=ig_publish&action=reel_list&token={parse.quote(token)}"
    code, body = _request(url)
    print(f"[reel_list] HTTP {code}")
    if not isinstance(body, dict) or "reels" not in body:
        print(json.dumps(body, indent=2) if isinstance(body, dict) else body)
        return 2
    print(f"\n{'Key':<5} {'Status':<18} {'Hook':<32} {'Service'}")
    print("-" * 100)
    for r in body["reels"]:
        log = r.get("log") or {}
        status = log.get("status", "—")
        media_id = log.get("ig_media_id") or ""
        suffix = f"  (media_id: {media_id})" if media_id else ""
        print(f"{r['key']:<5} {status:<18} {r['hook'][:31]:<32} {r['service']}{suffix}")
    return 0


def publish(api_base: str, token: str, only: list[str] | None, dry_run: bool, share_to_feed: bool, poll_seconds: int) -> int:
    targets = only if only else ALL_REELS
    print(f"[publish] target reels: {','.join(targets)}  dry_run={dry_run}  share_to_feed={share_to_feed}")
    print(f"[publish] this will block ~{poll_seconds}s per reel during status polling")
    print()

    # Per-reel single publish — gives us per-reel timeout headroom + a clean log line per reel.
    # The publish_all_reels action exists too but a single tubed request would hang ~9 × 90s = 13.5min.
    rc = 0
    for key in targets:
        body = {
            "reel": key,
            "share_to_feed": bool(share_to_feed),
            "dry_run": bool(dry_run),
            "poll_seconds": int(poll_seconds),
        }
        url = f"{api_base.rstrip('/')}/?r=ig_publish&action=publish_reel&token={parse.quote(token)}"
        t0 = time.time()
        code, resp = _request(url, method="POST", body=body, timeout=poll_seconds + 60)
        elapsed = round(time.time() - t0, 1)

        line = f"[{key}] HTTP {code} in {elapsed}s"
        if isinstance(resp, dict):
            results = resp.get("results", [])
            r0 = results[0] if results else None
            if r0:
                line += f"  status={r0.get('status')}"
                if "ig_media_id" in r0:
                    line += f"  media_id={r0['ig_media_id']}"
                if "error" in r0:
                    line += f"  error={r0.get('error')}"
            else:
                line += f"  resp={json.dumps(resp)[:200]}"
        else:
            line += f"  resp={str(resp)[:200]}"
        print(line)

        if isinstance(resp, dict) and resp.get("results"):
            s = resp["results"][0].get("status")
            if s == "failed":
                rc = 1
            elif s == "still_processing":
                # Not a hard failure — caller can re-run to resume
                rc = max(rc, 0)

    return rc


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--api-base", default=os.environ.get("API_BASE", DEFAULT_API_BASE))
    ap.add_argument("--token", default=os.environ.get("MIGRATE_TOKEN", ""), help="MIGRATE_TOKEN (or set env var)")
    ap.add_argument("--check", action="store_true", help="Run status probe only")
    ap.add_argument("--list", action="store_true", help="List all 9 reels and their publish status")
    ap.add_argument("--dry-run", action="store_true", help="Don't actually publish — log to ig_publish_log as 'dry_run'")
    ap.add_argument("--only", default="", help="Comma-separated subset, e.g. R2,R3")
    ap.add_argument("--no-share-to-feed", action="store_true", help="Don't share the reel to the main feed")
    ap.add_argument("--poll-seconds", type=int, default=90, help="Max seconds to poll container status before giving up (handler-side)")
    args = ap.parse_args()

    if not args.token:
        print("ERROR: MIGRATE_TOKEN required (set env var or pass --token).", file=sys.stderr)
        return 2

    if args.check:
        return check(args.api_base, args.token)
    if args.list:
        return list_reels(args.api_base, args.token)

    only = [k.strip().upper() for k in args.only.split(",") if k.strip()] if args.only else None
    if only:
        invalid = [k for k in only if k not in ALL_REELS]
        if invalid:
            print(f"ERROR: unknown reel keys: {invalid}. Valid: {ALL_REELS}", file=sys.stderr)
            return 2

    return publish(
        args.api_base,
        args.token,
        only=only,
        dry_run=args.dry_run,
        share_to_feed=not args.no_share_to_feed,
        poll_seconds=args.poll_seconds,
    )


if __name__ == "__main__":
    sys.exit(main())
