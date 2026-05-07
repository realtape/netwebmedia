#!/usr/bin/env python3
"""
NWM Email Enricher — phase 2: visit business websites to extract emails.
Reads leads.csv, writes emails back, saves progress to enrich_cp.json.
Run overnight — processes ~2,000-3,000 leads/hour.

Usage:
  python _leads/enrich.py                    # enrich all leads missing email
  python _leads/enrich.py --country US       # only US leads
  python _leads/enrich.py --niche restaurants
  python _leads/enrich.py --limit 5000       # stop after 5000 enrichments
"""

import csv
import os
import re
import time
import random
import json
import argparse
import requests
import shutil
from urllib.parse import urljoin

OUTPUT_DIR   = os.path.dirname(os.path.abspath(__file__))
LEADS_CSV    = os.path.join(OUTPUT_DIR, "leads.csv")
ENRICH_CP    = os.path.join(OUTPUT_DIR, "enrich_cp.json")

EMAIL_TIMEOUT = 8
DELAY         = (0.8, 2.0)   # seconds between website visits

EMAIL_RE     = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
SKIP_DOMAINS = {"sentry.io","example.com","wix.com","squarespace.com","yourdomain.com",
                "wordpress.com","domain.com","email.com","yourcompany.com","google.com",
                "facebook.com","instagram.com","twitter.com","yelp.com","tripadvisor.com",
                "opentable.com","grubhub.com","doordash.com","ubereats.com","maps.google.com",
                "site.com","1.com","test.com","localhost.com","mailinator.com","guerrillamail.com",
                "tempmail.com","wixpress.com","hubspot.com","klaviyo.com","mailchimp.com",
                "constantcontact.com","sendgrid.net","amazonses.com","sparkpostmail.com"}
SKIP_DOMAIN_KEYWORDS = {"sentry","wixpress","tracking","noreply","bounce","mailer-daemon",
                        "spamgourmet","guerrilla","tempmail","throwam","trashmail"}
SKIP_PREFIXES = {"noreply","no-reply","donotreply","support@support","webmaster",
                 "postmaster","bounce","mailer","info@info","admin@admin","privacy",
                 "legal","unsubscribe","abuse","spam","newsletter","news","press@",
                 "marketing@","sales@sales","help@help"}
IMAGE_EXTS   = {".jpg",".jpeg",".png",".gif",".svg",".webp",".bmp",".ico",".avif",
                ".tiff",".tif",".heic",".heif"}

HASH_RE      = re.compile(r'^[0-9a-f]{20,}$')   # 20+ hex chars = tracking hash

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
}

def clean_email(email):
    e = email.lower().strip()
    if len(e) < 8 or len(e) > 100:
        return None
    parts = e.split("@")
    if len(parts) != 2:
        return None
    prefix, domain = parts[0], parts[1]

    # --- domain checks ---
    if domain in SKIP_DOMAINS or "." not in domain:
        return None
    # image-extension domains (e.g. img@2x.png, bg@hero.jpg)
    tld = "." + domain.rsplit(".", 1)[-1]
    if tld in IMAGE_EXTS:
        return None
    # domains containing tracking/spam keywords
    if any(kw in domain for kw in SKIP_DOMAIN_KEYWORDS):
        return None

    # --- prefix checks ---
    if len(prefix) < 2:
        return None
    if any(prefix.startswith(p.rstrip("@")) for p in SKIP_PREFIXES):
        return None
    # hex hash prefix (Sentry error IDs, pixel trackers, etc.)
    if HASH_RE.match(prefix):
        return None
    # dimension-style prefix like "190x80_190x" or "img_0384_495x"
    if re.match(r'^[a-z_\-0-9]+\d+x\d*', prefix):
        return None
    # purely numeric prefix
    if prefix.isdigit():
        return None

    return e

def extract_emails(text):
    found = []
    for m in EMAIL_RE.finditer(text):
        e = clean_email(m.group())
        if e and e not in found:
            found.append(e)
    return found

def fetch_email(url, session):
    if not url or not url.startswith("http"):
        return ""
    try:
        r = session.get(url, timeout=EMAIL_TIMEOUT, allow_redirects=True)
        emails = extract_emails(r.text)
        if not emails:
            for path in ["/contact", "/contact-us", "/contacto", "/about", "/sobre-nosotros"]:
                try:
                    r2 = session.get(urljoin(r.url, path), timeout=EMAIL_TIMEOUT)
                    emails = extract_emails(r2.text)
                    if emails:
                        break
                except Exception:
                    continue
        return emails[0] if emails else ""
    except Exception:
        return ""

def load_cp():
    if os.path.exists(ENRICH_CP):
        with open(ENRICH_CP) as f:
            return json.load(f)
    return {"done": set(), "enriched": 0, "visited": 0}

def save_cp(cp):
    cp_save = {**cp, "done": list(cp["done"])}
    with open(ENRICH_CP, "w") as f:
        json.dump(cp_save, f)

def run(args):
    if not os.path.exists(LEADS_CSV):
        print("leads.csv not found — run scraper.py first.")
        return

    cp = load_cp()
    cp["done"] = set(cp.get("done", []))

    niche_filter   = set(args.niche.split(",")) if args.niche else None
    country_filter = args.country.upper() if args.country else None
    limit          = args.limit

    session = requests.Session()
    session.headers.update(HEADERS)

    # Load all rows
    with open(LEADS_CSV, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    total_rows = len(rows)
    eligible   = [
        (i, r) for i, r in enumerate(rows)
        if r.get("website")
        and not r.get("email")
        and str(i) not in cp["done"]
        and (not niche_filter   or r.get("niche")   in niche_filter)
        and (not country_filter or r.get("country") == country_filter)
    ]

    print(f"\n{'='*62}")
    print(f"NWM Email Enricher  -  {len(eligible)} leads to enrich")
    print(f"(already have email: {sum(1 for r in rows if r.get('email'))})")
    print(f"{'='*62}\n")

    enriched_this_run = 0
    for idx, (row_i, row) in enumerate(eligible):
        if limit and enriched_this_run >= limit:
            print(f"\nLimit of {limit} reached.")
            break

        name = row.get("name","?")[:40].encode('ascii', 'replace').decode('ascii')
        print(f"[{idx+1}/{len(eligible)}] {row.get('country','?')} | {row.get('niche','?'):15s} | {name}... ", end="", flush=True)

        email = fetch_email(row["website"], session)
        rows[row_i]["email"] = email

        cp["done"].add(str(row_i))
        cp["visited"] = cp.get("visited", 0) + 1
        if email:
            cp["enriched"] = cp.get("enriched", 0) + 1
            enriched_this_run += 1
            print(f"OK {email}")
        else:
            print("-")

        # Save checkpoint every 50 rows
        if (idx + 1) % 50 == 0:
            save_cp(cp)
            _rewrite_csv(rows)
            print(f"  [checkpoint] visited={cp['visited']} enriched={cp['enriched']}")

        time.sleep(random.uniform(*DELAY))

    save_cp(cp)
    _rewrite_csv(rows)
    total_with_email = sum(1 for r in rows if r.get("email"))
    print(f"\nDone. Enriched this run: {enriched_this_run}")
    print(f"  Total leads with email: {total_with_email} / {total_rows}")
    print(f"  File: {LEADS_CSV}\n")

def _rewrite_csv(rows):
    tmp = LEADS_CSV + ".tmp"
    fieldnames = rows[0].keys() if rows else []
    with open(tmp, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)
    shutil.move(tmp, LEADS_CSV)

if __name__ == "__main__":
    p = argparse.ArgumentParser(description="NWM Email Enricher — phase 2")
    p.add_argument("--niche",   default=None, help="Filter by niche")
    p.add_argument("--country", default=None, help="US or CL")
    p.add_argument("--limit",   default=0, type=int, help="Max enrichments this run (0=unlimited)")
    run(p.parse_args())
