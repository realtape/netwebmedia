#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Bulk-import all 1080 prospects into crm-vanilla `contacts` table.
Endpoint: /companies/crm-vanilla/api/index.php?r=contacts
"""
import argparse
import json
import time
import urllib.request

URL = "https://netwebmedia.com/companies/crm-vanilla/api/index.php?r=contacts"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"


def post(rec):
    payload = {
        "name": rec.get("name", ""),
        "email": rec.get("email") or None,
        "phone": rec.get("phone") or None,
        "company": rec.get("company") or rec.get("name"),
        "role": rec.get("role") or f'{rec.get("niche","")} — {rec.get("city","")}',
        "status": rec.get("status", "lead"),
        "value": rec.get("value", 0),
        "notes": rec.get("notes") or json.dumps({
            "niche": rec.get("niche_key"),
            "city": rec.get("city"),
            "website": rec.get("website"),
        }, ensure_ascii=False),
    }
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(URL, data=data, method="POST", headers={
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": UA,
        "Accept": "application/json",
    })
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode("utf-8"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", default="crm_import.json")
    ap.add_argument("--sleep", type=float, default=0.03)
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()

    with open(args.json, "r", encoding="utf-8") as f:
        records = json.load(f)
    if args.limit:
        records = records[:args.limit]

    print(f"Importing {len(records)} contacts -> {URL}")
    ok = fail = 0
    errors = []
    for i, r in enumerate(records, 1):
        name = r["name"].encode("ascii", "replace").decode("ascii")
        try:
            resp = post(r)
            ok += 1
            if i % 100 == 0 or i == 1:
                print(f"[{i}/{len(records)}] id={resp.get('id')} {name}")
        except Exception as e:
            fail += 1
            msg = str(e)[:80]
            errors.append((r.get("name"), msg))
            print(f"[{i}/{len(records)}] ERR {name}: {msg}")
        time.sleep(args.sleep)
    print(f"\nDone. ok={ok} fail={fail}")
    for n, m in errors[:5]:
        print(f"  - {n}: {m}")


if __name__ == "__main__":
    main()
