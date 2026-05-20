#!/usr/bin/env python3
"""Pick 1 real contact per template niche (with working audit page), then fire 8 tests with corrected CTA URLs."""
import json, pathlib, random, time, urllib.request, urllib.error

ROOT = pathlib.Path(__file__).parent
BASE = "https://netwebmedia.com/companies/crm-vanilla/api/index.php"
TO   = "carlos@netwebmedia.com"
UA   = "Mozilla/5.0 Chrome/120"

WANT = {
  "Tourism & Hospitality":          ["Tourism & Hospitality", "tourism"],
  "Restaurants & Gastronomy":       ["Restaurants & Gastronomy"],
  "Health & Medical":               ["Health & Medical"],
  "Beauty & Wellness":              ["Beauty & Wellness"],
  "Small/Medium Business Services": ["smb", "Small/Medium"],
  "Law Firms & Legal Services":     ["law_firms", "Law Firms"],
  "Real Estate & Property":         ["real_estate", "Real Estate"],
  "Local Specialist Services":      ["local_specialist", "Local Specialist", "home_services"],
}
KEYWORDS = {
  "Tourism & Hospitality":          ["hotel","lodge","turismo","tours","hostal","apart","resort","cabana"],
  "Restaurants & Gastronomy":       ["restaurant","restaurante","cafe","parrilla","pizzer","bistro","coffee","comida","sabor"],
  "Health & Medical":               ["clinica","medic","dental","odonto","kinesi","centro m"],
  "Beauty & Wellness":              ["belleza","estet","salon","peluqu","spa","wellness","barber"],
  "Small/Medium Business Services": ["imprenta","ferreter","lavander","constructor","limpieza","vulcaniz","transport"],
  "Law Firms & Legal Services":     ["abogado","juridic","bufete","legal","estudio jur"],
  "Real Estate & Property":         ["propiedad","inmobil","corred"],
  "Local Specialist Services":      ["electric","gasfiter","climatiz","refrigera","cerraj","carpinter"],
}

def http(method, path, body=None):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("User-Agent", UA)
    if body is not None: req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30) as r: return json.loads(r.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as e: return {"error": e.read().decode("utf-8", errors="replace"), "status": e.code}
    except Exception as e: return {"error": str(e)}

def head_ok(url, timeout=8):
    try:
        req = urllib.request.Request(url, method='HEAD')
        req.add_header("User-Agent", UA)
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return 200 <= r.status < 400
    except Exception: return False

# Load all contacts
print("▶ Fetching all contacts…")
rows = http("GET", "?r=contacts&limit=2000")
if isinstance(rows, dict) and rows.get("error"): print(rows); raise SystemExit(1)
print(f"   {len(rows)} contacts loaded")

# Normalize helper — DB pages may be missing accents
def to_url(page: str) -> str:
    if page.startswith("http"): return page
    return "https://netwebmedia.com/" + page.lstrip("/").replace(" ", "%20")

# Gather candidates per niche
cands = {k: [] for k in WANT}
for c in rows:
    try: m = json.loads(c.get("notes") or "{}")
    except: continue
    n = (m.get("niche") or "").strip()
    page = m.get("page") or ""
    city = m.get("city") or ""
    company = (c.get("company") or c.get("name") or "").strip()
    if not n or not page or not city or not company: continue
    for tpl, tags in WANT.items():
        if not any(t in n for t in tags): continue
        if not any(k in company.lower() for k in KEYWORDS[tpl]): continue
        cands[tpl].append({
            "company": company,
            "city": city.replace("-", " ").title(),
            "page_url": to_url(page),
            "niche_db": n,
        })
        break

picks = {}
for tpl, arr in cands.items():
    print(f"▶ {tpl}: {len(arr)} candidates")
    random.shuffle(arr)
    for cand in arr[:20]:
        if head_ok(cand["page_url"]):
            picks[tpl] = cand
            print(f"   ✓ picked: {cand['company']} ({cand['city']}) → {cand['page_url']}")
            break
    if tpl not in picks:
        print(f"   ⚠ fallback: no live page found — skipping")

# Fetch campaign IDs
print("\n▶ Fetching campaigns…")
camps = http("GET", "?r=campaigns")
cid_by_name = {c["name"]: c["id"] for c in camps} if isinstance(camps, list) else {}

FIRST = ["María", "Juan", "Camila", "Diego", "Valentina", "Sebastián", "Ignacia", "Matías"]
print(f"\n▶ Sending 8 REAL-page tests to {TO}…")
results = []
for tpl_niche, cand in picks.items():
    cname = f"{tpl_niche} — Intro Blast"
    cid = cid_by_name.get(cname)
    if not cid: print(f"   ✗ no campaign for {tpl_niche}"); continue
    sample = {
        "name":    f"{random.choice(FIRST)} Demo",
        "company": cand["company"],
        "city":    cand["city"],
        "niche":   tpl_niche,
        # Trim https://netwebmedia.com/ prefix — buildContactVars prepends it back
        "page":    cand["page_url"].replace("https://netwebmedia.com/", ""),
    }
    res = http("POST", f"?r=campaigns&id={cid}&action=test", {
        "to": TO, "sample": sample,
        "from_name":  "NetWebMedia",
        "from_email": "onboarding@resend.dev",
    })
    ok = res.get("sent") is True
    print(f"   {'✓' if ok else '✗'} {cand['company']:40s} → {res.get('id') or res.get('error')}")
    results.append((tpl_niche, cand["company"], ok))
    time.sleep(0.15)

good = sum(1 for _, _, ok in results if ok)
print(f"\n━━━ {good}/{len(results)} sent with REAL CTA URLs ━━━")
