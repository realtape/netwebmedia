"""
Alternate importer using POST /contacts with superadmin session auth.

This bypasses the bulk_import_osm endpoint (whose session-auth patch is stuck
in deploy purgatory) and POSTs each contact individually. Slower than bulk
(50/sec × 44k = ~15 min) but works with the existing contacts handler.

Usage:
  python import_to_crm_session.py
"""
import csv
import io
import json
import os
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from http.cookiejar import MozillaCookieJar

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", line_buffering=True)

CSV_PATH = r"C:/Users/Usuario/Desktop/NetWebMedia/_deploy/scraper-stack/output/master_contacts.csv"
PROGRESS_PATH = r"C:/Users/Usuario/Desktop/NetWebMedia/_deploy/scraper-stack/output/import_progress_session.json"
CONCURRENCY = 20
LOGIN_URL = "https://netwebmedia.com/crm-vanilla/api/?r=auth"
CONTACTS_URL = "https://netwebmedia.com/crm-vanilla/api/?r=contacts"

USER_AGENT = "Mozilla/5.0 (NWM-Import-Session/1.0)"
ADMIN_EMAIL = os.environ.get("CRM_EMAIL", "carlos@netwebmedia.com")
ADMIN_PASS = os.environ.get("CRM_PASS", "NWM2026!")


def get_session_cookie():
    """Login and return the PHPSESSID cookie value."""
    body = json.dumps({"email": ADMIN_EMAIL, "password": ADMIN_PASS}).encode("utf-8")
    req = urllib.request.Request(
        LOGIN_URL, data=body, method="POST",
        headers={
            "Content-Type": "application/json",
            "Origin": "https://netwebmedia.com",
            "Referer": "https://netwebmedia.com/crm-vanilla/",
            "User-Agent": USER_AGENT,
        },
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        cookies = r.headers.get_all("Set-Cookie") or []
        for c in cookies:
            if c.startswith("PHPSESSID="):
                return c.split(";", 1)[0]  # e.g. "PHPSESSID=abc123"
    raise RuntimeError("Failed to get PHPSESSID")


def post_contact(row, cookie_header):
    """POST one contact; returns dict with result."""
    # Build a normalized notes blob for OSM metadata
    notes_payload = {
        "website": row.get("website", ""),
        "city": row.get("city", ""),
        "country": row.get("country", ""),
        "niche": row.get("niche", ""),
        "address": row.get("address", ""),
        "place_id": row.get("place_id", ""),
        "lat": row.get("lat", ""),
        "lon": row.get("lon", ""),
        "osm_category": row.get("osm_category", ""),
        "source": row.get("source", "osm_overpass_2026_05_12"),
    }
    payload = {
        "name": row["name"][:120],
        "email": row.get("email", "") or None,
        "phone": row.get("phone", "") or None,
        "company": row.get("company", row["name"])[:120],
        "status": row.get("status", "lead"),
        "segment": row.get("segment", ""),
        "value": 0,
        "notes": json.dumps(notes_payload, ensure_ascii=False),
    }
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        CONTACTS_URL, data=body, method="POST",
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "Origin": "https://netwebmedia.com",
            "Referer": "https://netwebmedia.com/crm-vanilla/",
            "User-Agent": USER_AGENT,
            "Cookie": cookie_header,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return {"ok": True, "code": r.status}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")[:200]
        return {"ok": False, "code": e.code, "error": body, "row": row.get("email") or row.get("name", "?")}
    except Exception as e:
        return {"ok": False, "error": str(e), "row": row.get("email") or row.get("name", "?")}


def load_progress():
    if not os.path.exists(PROGRESS_PATH):
        return {"last_index": 0, "inserted": 0, "failed": 0, "duplicates": 0}
    with open(PROGRESS_PATH, encoding="utf-8") as f:
        return json.load(f)


def save_progress(p):
    with open(PROGRESS_PATH, "w", encoding="utf-8") as f:
        json.dump(p, f, indent=2)


def main():
    print("Authenticating...")
    cookie = get_session_cookie()
    print("OK, got PHPSESSID")

    print(f"Reading {CSV_PATH}...")
    rows = []
    with open(CSV_PATH, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append(r)
    print(f"Loaded {len(rows)} rows")

    progress = load_progress()
    start_at = progress["last_index"]
    if start_at > 0:
        print(f"Resuming from row {start_at}")
    rows = rows[start_at:]

    t0 = time.time()
    completed = 0
    with ThreadPoolExecutor(max_workers=CONCURRENCY) as ex:
        futures = {ex.submit(post_contact, r, cookie): i for i, r in enumerate(rows)}
        for f in as_completed(futures):
            idx = futures[f]
            res = f.result()
            completed += 1
            if res["ok"]:
                progress["inserted"] += 1
            elif res.get("code") == 400 and "Name is required" in str(res.get("error", "")):
                progress["failed"] += 1
            elif res.get("code") in (400, 409) and ("dup" in str(res.get("error", "")).lower() or "1062" in str(res.get("error",""))):
                progress["duplicates"] += 1
            else:
                progress["failed"] += 1
                if progress["failed"] < 10:
                    print(f"  fail: {res.get('code','?')} {res.get('error','')[:80]} | {res.get('row','?')}")
            # Resume tracking: track highest index completed
            progress["last_index"] = max(progress["last_index"], start_at + idx + 1)
            if completed % 500 == 0:
                rate = completed / (time.time() - t0)
                eta = (len(rows) - completed) / rate if rate > 0 else 0
                print(f"  {completed}/{len(rows)}  ins={progress['inserted']} dup={progress['duplicates']} fail={progress['failed']}  rate={rate:.1f}/s  eta={eta:.0f}s")
                save_progress(progress)

    save_progress(progress)
    elapsed = time.time() - t0
    print(f"\n=== IMPORT DONE in {elapsed:.0f}s ===")
    print(f"  inserted:   {progress['inserted']}")
    print(f"  duplicates: {progress['duplicates']}")
    print(f"  failed:     {progress['failed']}")


if __name__ == "__main__":
    main()
