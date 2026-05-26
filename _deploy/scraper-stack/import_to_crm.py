"""
Step 2: Import master_contacts.csv → crm-vanilla CRM via bulk endpoint.

Reads master_contacts.csv (from aggregate_and_dedupe.py), batches in groups of
500 contacts, POSTs to /crm-vanilla/api/?r=bulk_import_osm with concurrent
threads. Tracks success/failure per batch + writes a resumable progress log.

Usage:
  python import_to_crm.py [--resume]    # resume from last batch on failure
  python import_to_crm.py --dry-run     # process locally, don't POST
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

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", line_buffering=True)

CSV_PATH = r"C:/Users/Usuario/Desktop/NetWebMedia/_deploy/scraper-stack/output/master_contacts.csv"
PROGRESS_PATH = r"C:/Users/Usuario/Desktop/NetWebMedia/_deploy/scraper-stack/output/import_progress.json"
BATCH_SIZE = 500
CONCURRENCY = 8
ENDPOINT = "https://netwebmedia.com/crm-vanilla/api/?r=bulk_import_osm"
# Token from GitHub Secret IMPORT_BEST_TOKEN — falls back to historic default if not in env
IMPORT_TOKEN = os.environ.get("IMPORT_BEST_TOKEN", "NWM_IMPORT_BEST_2026")


def post_batch(batch_id, contacts):
    """POST a batch to the bulk import endpoint. Returns dict with result + batch_id."""
    body = json.dumps({"contacts": contacts}, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        f"{ENDPOINT}&token={IMPORT_TOKEN}",
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "Origin": "https://netwebmedia.com",
            "Referer": "https://netwebmedia.com/crm-vanilla/",
            "User-Agent": "Mozilla/5.0 (nwm-import-client)",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return {"batch_id": batch_id, "ok": True, "result": json.load(r)}
    except urllib.error.HTTPError as e:
        try:
            err_body = json.load(e)
        except Exception:
            err_body = e.read().decode("utf-8", errors="replace")[:200]
        return {"batch_id": batch_id, "ok": False, "status": e.code, "error": err_body}
    except Exception as e:
        return {"batch_id": batch_id, "ok": False, "error": str(e)}


def load_progress():
    if not os.path.exists(PROGRESS_PATH):
        return {"completed_batches": [], "total_inserted": 0, "total_skipped_dup": 0, "errors": []}
    with open(PROGRESS_PATH, encoding="utf-8") as f:
        return json.load(f)


def save_progress(prog):
    with open(PROGRESS_PATH, "w", encoding="utf-8") as f:
        json.dump(prog, f, indent=2, ensure_ascii=False)


def main():
    dry_run = "--dry-run" in sys.argv
    resume = "--resume" in sys.argv

    print(f"Reading {CSV_PATH}...")
    rows = []
    with open(CSV_PATH, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    print(f"Loaded {len(rows)} rows")

    # Build batches
    batches = [(i // BATCH_SIZE, rows[i:i + BATCH_SIZE]) for i in range(0, len(rows), BATCH_SIZE)]
    print(f"Split into {len(batches)} batches of {BATCH_SIZE}\n")

    progress = load_progress() if resume else {
        "completed_batches": [], "total_inserted": 0, "total_skipped_dup": 0,
        "total_skipped_missing": 0, "errors": []
    }
    done_ids = set(progress["completed_batches"])
    pending = [(bid, b) for bid, b in batches if bid not in done_ids]
    print(f"Already complete: {len(done_ids)} batches | Pending: {len(pending)} batches\n")

    if dry_run:
        print("DRY RUN — not POSTing. Showing first batch sample:")
        for c in pending[0][1][:3]:
            print(f"  {c['name'][:30]:<30} {c.get('email','-')[:30]:<30} seg={c.get('segment','')[:30]}")
        return

    t0 = time.time()
    with ThreadPoolExecutor(max_workers=CONCURRENCY) as ex:
        futures = {ex.submit(post_batch, bid, b): bid for bid, b in pending}
        completed = 0
        for f in as_completed(futures):
            r = f.result()
            completed += 1
            if r["ok"]:
                res = r["result"]
                progress["completed_batches"].append(r["batch_id"])
                progress["total_inserted"] += res.get("inserted", 0)
                progress["total_skipped_dup"] += res.get("skipped_dup", 0)
                progress["total_skipped_missing"] += res.get("skipped_missing", 0)
                if completed % 5 == 0:
                    save_progress(progress)
                if completed % 10 == 0:
                    rate = completed / (time.time() - t0)
                    eta = (len(pending) - completed) / rate if rate > 0 else 0
                    print("  batch {:4d}/{:4d}  inserted={}  dup={}  rate={:.1f}/s  eta={:.0f}s".format(
                        completed, len(pending),
                        progress["total_inserted"], progress["total_skipped_dup"],
                        rate, eta))
            else:
                progress["errors"].append({"batch_id": r["batch_id"], "error": r.get("error"), "status": r.get("status")})
                print(f"  batch {r['batch_id']} FAILED: {r.get('status','?')} {str(r.get('error'))[:120]}")
                save_progress(progress)

    save_progress(progress)
    elapsed = time.time() - t0
    print("\n=== IMPORT COMPLETE ===")
    print(f"Time:               {elapsed:.0f}s")
    print(f"Total inserted:     {progress['total_inserted']}")
    print(f"Skipped (dup):      {progress['total_skipped_dup']}")
    print(f"Skipped (missing):  {progress['total_skipped_missing']}")
    print(f"Errors:             {len(progress['errors'])}")
    if progress["errors"]:
        print("\nFirst 5 errors:")
        for e in progress["errors"][:5]:
            print(f"  batch {e['batch_id']}: {e}")


if __name__ == "__main__":
    main()
