#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Patch notes.page on all CRM contacts:
  - Use canonical slugs from the freshly-generated crm_import.json
  - Convert relative page paths to absolute https://netwebmedia.com/... URLs
  - Match live CRM rows to local records by company name
  - PUT updated notes blob per contact

Usage:
    python crm_patch_page_urls.py --dry-run
    python crm_patch_page_urls.py
"""
import argparse, json, os, sys, time
import urllib.request, urllib.error

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = "https://netwebmedia.com/app/api"
HOST = "https://netwebmedia.com"
IMPORT_JSON = os.path.join(HERE, "crm_import.json")
HEADERS = {
    "Content-Type": "application/json; charset=utf-8",
    "User-Agent": "Mozilla/5.0 (NetWebMedia-CRM-Patcher/1.0) AppleWebKit/537.36",
    "Accept": "application/json",
}


def http(method, path, body=None):
    url = BASE.rstrip("/") + "/index.php" + path
    data = json.dumps(body, ensure_ascii=False).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, method=method, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--sleep", type=float, default=0.05)
    args = ap.parse_args()

    # Load local canonical records
    with open(IMPORT_JSON, "r", encoding="utf-8") as f:
        local = json.load(f)
    by_name = {}
    for rec in local:
        key = (rec["name"] or "").strip()
        by_name.setdefault(key, []).append(rec)
    print(f"Loaded {len(local)} local canonical records ({len(by_name)} unique names).")

    # Fetch live CRM contacts
    print("Fetching CRM contacts ...")
    contacts = http("GET", "?r=contacts")
    print(f"Got {len(contacts)} CRM contacts.")

    updated = skipped = not_found = failed = 0
    used_name_idx = {}  # name -> next index into duplicates list

    # Iterate newest-first (same order API returns) so older duplicates get
    # the second match if names repeat.
    for i, c in enumerate(contacts, 1):
        live_raw = c.get("notes") or ""
        if not live_raw:
            skipped += 1
            continue

        name = (c.get("name") or "").strip()
        if name not in by_name:
            not_found += 1
            print(f"[{i}] NOMATCH id={c['id']} {name.encode('ascii','replace').decode('ascii')}")
            continue

        # Pick canonical record for this name (handle dupes)
        idx = used_name_idx.get(name, 0)
        local_list = by_name[name]
        if idx >= len(local_list):
            idx = 0
        local_rec = local_list[idx]
        used_name_idx[name] = idx + 1

        # Parse live notes, patch page to canonical absolute URL
        try:
            live_notes = json.loads(live_raw)
        except json.JSONDecodeError:
            live_notes = {}

        try:
            local_notes = json.loads(local_rec["notes"])
        except json.JSONDecodeError:
            local_notes = {}

        canonical_page = local_notes.get("page", "").lstrip("/")
        if not canonical_page:
            skipped += 1
            continue

        absolute = f"{HOST}/{canonical_page}"
        if live_notes.get("page") == absolute:
            skipped += 1
            continue

        live_notes["page"] = absolute
        new_raw = json.dumps(live_notes, ensure_ascii=False)

        ascii_name = name.encode("ascii", "replace").decode("ascii")
        if args.dry_run:
            print(f"[DRY {i}] id={c['id']} {ascii_name} -> {absolute}")
            updated += 1
            continue

        try:
            http("PUT", f"?r=contacts&id={c['id']}", {"notes": new_raw})
            print(f"[{i}/{len(contacts)}] OK id={c['id']} {ascii_name}")
            updated += 1
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", "ignore")[:150]
            print(f"[{i}] ERR id={c['id']} {ascii_name}: HTTP {e.code} {body}")
            failed += 1
        except Exception as e:
            print(f"[{i}] ERR id={c['id']} {ascii_name}: {e}")
            failed += 1
        time.sleep(args.sleep)

    print(f"\nDone. updated={updated} skipped={skipped} not_found={not_found} failed={failed}")


if __name__ == "__main__":
    main()
