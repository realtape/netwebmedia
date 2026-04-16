#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Upload prospects to the LIVE /app/api/?r=leads endpoint.

The endpoint accepts: name, email, company, phone. It ignores other fields.
Niche/city/website metadata is preserved in the local JSON as source of truth.
"""
import argparse
import json
import os
import sys
import time
import urllib.request
import urllib.error


def post_lead(base, record):
    url = base + "/app/api/?r=leads"
    payload = {
        "name": record.get("name", ""),
        "email": record.get("email", ""),
        "company": record.get("company") or record.get("name", ""),
        "phone": record.get("phone", ""),
    }
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST", headers={
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": "Mozilla/5.0 (NWM-lead-importer/2.0)",
        "Accept": "application/json",
    })
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="https://netwebmedia.com")
    ap.add_argument("--json", required=True)
    ap.add_argument("--sleep", type=float, default=0.1)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()

    with open(args.json, "r", encoding="utf-8") as f:
        records = json.load(f)

    # Filter: only prospects with email
    records = [r for r in records if r.get("email")]
    if args.limit:
        records = records[:args.limit]

    print(f"Uploading {len(records)} leads to {args.base}/app/api/?r=leads")
    ok, fail, returning = 0, 0, 0
    errors = []

    for i, rec in enumerate(records, 1):
        name_safe = rec["name"].encode("ascii", "replace").decode("ascii")
        if args.dry_run:
            print(f"[DRY {i}/{len(records)}] {name_safe} ({rec.get('email')})")
            ok += 1
            continue
        try:
            resp = post_lead(args.base, rec)
            if resp.get("returning"):
                returning += 1
            ok += 1
            if i % 50 == 0 or i == 1:
                print(f"[{i}/{len(records)}] id={resp.get('id')} {name_safe}")
        except Exception as e:
            msg = str(e)[:100]
            errors.append((rec.get("name"), msg))
            fail += 1
            print(f"[{i}/{len(records)}] ERR {name_safe}: {msg}")
        time.sleep(args.sleep)

    print(f"\nDone. ok={ok} fail={fail} returning={returning}")
    if errors[:5]:
        print("First errors:")
        for n, m in errors[:5]:
            print(f"  - {n}: {m}")


if __name__ == "__main__":
    main()
