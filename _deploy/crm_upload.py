#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bulk-upload the 680 prospects into NetWebMedia's CRM via its REST API.
Uses existing endpoint: POST /api/?r=contacts (see crm-vanilla/api/handlers/contacts.php).

Usage:
    python crm_upload.py --base https://netwebmedia.com/crm-vanilla/api --dry-run
    python crm_upload.py --base https://netwebmedia.com/crm-vanilla/api

Falls back to the local PHP dev server if --base is omitted.
"""
import argparse, json, os, sys, time
import urllib.request, urllib.error

HERE = os.path.dirname(os.path.abspath(__file__))


def post(base: str, payload: dict) -> dict:
    url = base.rstrip("/") + "/index.php?r=contacts"
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST",
                                 headers={
                                     "Content-Type": "application/json; charset=utf-8",
                                     "User-Agent": "Mozilla/5.0 (NetWebMedia-CRM-Importer/1.0) AppleWebKit/537.36",
                                     "Accept": "application/json",
                                 })
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:8000", help="CRM API base URL")
    ap.add_argument("--json", default=os.path.join(HERE, "crm_import.json"))
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--only-with-email", action="store_true",
                    help="Skip prospects without a discoverable email")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--skip", type=int, default=0, help="Skip first N records")
    ap.add_argument("--sleep", type=float, default=0.05, help="Seconds between requests")
    args = ap.parse_args()

    with open(args.json, "r", encoding="utf-8") as f:
        records = json.load(f)

    if args.only_with_email:
        records = [r for r in records if r.get("email")]
    if args.skip:
        records = records[args.skip:]
    if args.limit:
        records = records[: args.limit]

    print(f"Uploading {len(records)} contacts to {args.base} ...")
    ok, fail = 0, 0
    for i, rec in enumerate(records, 1):
        if args.dry_run:
            print(f"[DRY {i}] {rec['name']} ({rec.get('email') or '—'})")
            ok += 1
            continue
        name_ascii = rec['name'].encode('ascii', 'replace').decode('ascii')
        try:
            resp = post(args.base, rec)
            print(f"[{i}/{len(records)}] OK  id={resp.get('id')} {name_ascii}")
            ok += 1
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", "ignore")[:200]
            print(f"[{i}/{len(records)}] ERR HTTP {e.code} {name_ascii}: {body}")
            fail += 1
        except Exception as e:
            print(f"[{i}/{len(records)}] ERR {name_ascii}: {e}")
            fail += 1
        time.sleep(args.sleep)

    print(f"\nDone. ok={ok} fail={fail}")


if __name__ == "__main__":
    main()
