"""
Step 1: Aggregate all S3 scrape outputs → dedupe → master CSV.

Reads every scrape/<niche>/<country>_<city>.json from S3, applies:
  - Dedupe by primary email (first occurrence wins)
  - Secondary dedupe by phone+name when no email
  - Filter: must have email OR phone (skip pure ghosts)
  - Tag: segment = <country_lower>_<region_slug>_<niche>_osm_2026_05_12
  - Normalize: lowercase emails, strip phones, slugify regions

Outputs:
  master_contacts.csv      — all unique businesses with at least 1 contact method
  master_summary.json      — totals by country / niche / segment
"""
import boto3
import csv
import io
import json
import re
import sys
import time
from collections import defaultdict

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", line_buffering=True)

REGION = "us-east-1"
BUCKET = "nwm-scrape-prospects-744092293944"
OUT_DIR = r"C:/Users/Usuario/Desktop/NetWebMedia/_deploy/scraper-stack/output"

import os
os.makedirs(OUT_DIR, exist_ok=True)

s3 = boto3.client("s3", region_name=REGION)


def slugify(s):
    s = (s or "").lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s


def normalize_phone(p):
    if not p:
        return ""
    return re.sub(r"[^\d+]", "", p)[:25]


EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


def is_valid_email(e):
    if not e:
        return False
    if len(e) > 80:
        return False
    if not EMAIL_RE.match(e):
        return False
    # filter obvious garbage
    local, _, domain = e.partition("@")
    if not domain or domain in {"sentry.io", "wixpress.com", "example.com"}:
        return False
    if domain.endswith((".png", ".jpg", ".svg", ".gif", ".webp", ".ico")):
        return False
    if any(b in local for b in {"noreply", "no-reply", "example", "youremail", "test@", "donotreply"}):
        return False
    return True


def main():
    # List + stream every scrape output
    print("Listing S3 objects under scrape/...")
    keys = []
    paginator = s3.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=BUCKET, Prefix="scrape/"):
        for obj in page.get("Contents", []):
            keys.append(obj["Key"])
    print(f"Found {len(keys)} S3 files\n")

    by_email = {}
    by_phone_name = {}  # secondary dedupe key
    stats = defaultdict(int)
    by_segment_count = defaultdict(int)
    by_country = defaultdict(int)
    by_niche = defaultdict(int)
    files_processed = 0
    t0 = time.time()

    for key in keys:
        try:
            obj = s3.get_object(Bucket=BUCKET, Key=key)
            payload = json.loads(obj["Body"].read())
        except Exception as e:
            print(f"  skip {key}: {e}")
            continue

        country = payload.get("country", "")
        city = payload.get("city", "")
        niche = payload.get("niche", "")
        segment = "{}_{}_{}_osm_2026_05_12".format(
            country.lower(), slugify(city), niche
        )

        for b in payload.get("businesses", []):
            name = (b.get("name") or "").strip()
            if not name:
                stats["no_name"] += 1
                continue

            phone = normalize_phone(b.get("phone"))
            emails_raw = (b.get("scraped_emails") or []) + ([b.get("osm_email")] if b.get("osm_email") else [])
            valid_emails = [e.lower().strip() for e in emails_raw if is_valid_email(e.lower().strip() if isinstance(e, str) else "")]

            if not valid_emails and not phone:
                stats["no_contact"] += 1
                continue

            record = {
                "name": name[:120],
                "phone": phone,
                "company": name[:120],
                "website": (b.get("website") or "")[:255],
                "city": (b.get("city") or city)[:60],
                "country": country,
                "niche": niche,
                "segment": segment,
                "source": "osm_overpass_2026_05_12",
                "place_id": b.get("osm_id", ""),
                "address": (b.get("address") or "")[:200],
                "lat": b.get("lat"),
                "lon": b.get("lon"),
                "osm_category": b.get("osm_category", ""),
                "status": "lead",
            }

            if valid_emails:
                # One row per unique email (matches Apify CSV pattern)
                for e in valid_emails:
                    if e in by_email:
                        stats["dup_email"] += 1
                        continue
                    rec = dict(record)
                    rec["email"] = e
                    by_email[e] = rec
                    by_segment_count[segment] += 1
                    by_country[country] += 1
                    by_niche[niche] += 1
                    stats["with_email"] += 1
            else:
                # Phone-only record — dedupe by (phone, name)
                k = phone + "|" + name[:40].lower()
                if k in by_phone_name:
                    stats["dup_phone"] += 1
                    continue
                rec = dict(record)
                rec["email"] = ""
                by_phone_name[k] = rec
                by_segment_count[segment] += 1
                by_country[country] += 1
                by_niche[niche] += 1
                stats["phone_only"] += 1

        files_processed += 1
        if files_processed % 100 == 0:
            print("  {}/{} files | unique emails so far: {} | phone-only: {} | elapsed: {:.0f}s".format(
                files_processed, len(keys), len(by_email), len(by_phone_name), time.time() - t0))

    # Write master CSV
    cols = ["name", "email", "phone", "company", "website", "address", "city",
            "country", "niche", "segment", "source", "place_id",
            "lat", "lon", "osm_category", "status"]
    all_rows = list(by_email.values()) + list(by_phone_name.values())
    out_csv = os.path.join(OUT_DIR, "master_contacts.csv")
    with open(out_csv, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        for r in all_rows:
            w.writerow(r)

    # Summary
    summary = {
        "scraped_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "files_processed": files_processed,
        "stats": dict(stats),
        "total_records": len(all_rows),
        "with_email": len(by_email),
        "phone_only": len(by_phone_name),
        "by_country": dict(by_country),
        "by_niche": dict(by_niche),
        "by_segment": dict(by_segment_count),
    }
    out_summary = os.path.join(OUT_DIR, "master_summary.json")
    with open(out_summary, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    print("\n=== AGGREGATION COMPLETE ===")
    print(f"Files processed:  {files_processed}")
    print(f"Total records:    {len(all_rows)}")
    print(f"  with email:     {len(by_email)}")
    print(f"  phone-only:     {len(by_phone_name)}")
    print(f"Skipped:")
    print(f"  no_name:        {stats['no_name']}")
    print(f"  no_contact:     {stats['no_contact']}")
    print(f"  dup_email:      {stats['dup_email']}")
    print(f"  dup_phone:      {stats['dup_phone']}")
    print(f"\nOutput:")
    print(f"  {out_csv}")
    print(f"  {out_summary}")


if __name__ == "__main__":
    main()
