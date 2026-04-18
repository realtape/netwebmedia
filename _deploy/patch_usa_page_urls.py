#!/usr/bin/env python3
"""Patch USA CRM contacts: rewrite notes.page from 'companies-usa/' to 'companies/usa/'."""
import json, urllib.request, urllib.error, time

BASE = "https://netwebmedia.com/companies/crm-vanilla/api/index.php"
UA   = "Mozilla/5.0 Chrome/120"

def http(method, path, body=None):
    url = BASE + path
    data = json.dumps(body, ensure_ascii=False).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("User-Agent", UA)
    if body is not None: req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30) as r: return json.loads(r.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as e: return {"error": e.read().decode("utf-8", errors="replace"), "status": e.code}
    except Exception as e: return {"error": str(e)}

print("Fetching all contacts…")
rows = http("GET", "?r=contacts&limit=5000")
if isinstance(rows, dict) and rows.get("error"): print(rows); raise SystemExit(1)
print(f"  {len(rows)} contacts loaded")

patched = skipped = err = 0
for c in rows:
    try: notes = json.loads(c.get("notes") or "{}")
    except: skipped += 1; continue
    if notes.get("segment") != "usa": skipped += 1; continue
    page = notes.get("page") or ""
    if not page.startswith("companies-usa/"): skipped += 1; continue
    notes["page"] = "companies/usa/" + page[len("companies-usa/"):]
    res = http("PUT", f"?r=contacts&id={c['id']}", {"notes": json.dumps(notes, ensure_ascii=False)})
    if res.get("updated"):
        patched += 1
        if patched % 200 == 0: print(f"  {patched} patched…")
    else:
        err += 1
        if err <= 3: print(f"  fail id={c['id']}: {res}")
    time.sleep(0.02)

print(f"\npatched={patched} skipped={skipped} errors={err}")
