#!/usr/bin/env python3
"""
End-to-end test of the 8 niche templates:
  1. Seed 8 templates in DB (idempotent)
  2. Create 8 draft campaigns (one per niche)
  3. Send a TEST of each to carlos@netwebmedia.com with a randomly chosen sample company

Usage:  python send_niche_tests.py
"""
import json, random, time, urllib.request, urllib.error

BASE = "https://netwebmedia.com/companies/crm-vanilla/api/index.php"
TO   = "carlos@netwebmedia.com"
UA   = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36"

# 8 niches × random company/city fixtures for believable tests
FIXTURES = {
    "Tourism & Hospitality": [
        ("Hotel Costa Azul",            "Valparaíso",  "hotel-costa-azul.html"),
        ("Refugio Andino Lodge",        "Puerto Varas","refugio-andino-lodge.html"),
        ("Atacama Sky Tours",           "San Pedro",   "atacama-sky-tours.html"),
    ],
    "Restaurants & Gastronomy": [
        ("La Cocina de Don Pepe",       "Santiago",    "la-cocina-de-don-pepe.html"),
        ("Café Bellavista",             "Valparaíso",  "cafe-bellavista.html"),
        ("Parrilla El Patrón",          "Concepción",  "parrilla-el-patron.html"),
    ],
    "Health & Medical": [
        ("Clínica Dental Sonrisa",      "Viña del Mar","clinica-dental-sonrisa.html"),
        ("Centro Médico Los Andes",     "Rancagua",    "centro-medico-los-andes.html"),
        ("Kinesiología Integral",       "Temuco",      "kinesiologia-integral.html"),
    ],
    "Beauty & Wellness": [
        ("Estudio Belleza Natural",     "Santiago",    "estudio-belleza-natural.html"),
        ("Zen Spa & Wellness",          "La Serena",   "zen-spa-wellness.html"),
        ("Salón Glam Chic",             "Antofagasta", "salon-glam-chic.html"),
    ],
    "Small/Medium Business Services": [
        ("Imprenta del Sur",            "Puerto Montt","imprenta-del-sur.html"),
        ("Ferretería Constructor",      "Iquique",     "ferreteria-constructor.html"),
        ("Lavandería Express",          "Santiago",    "lavanderia-express.html"),
    ],
    "Law Firms & Legal Services": [
        ("Estudio Jurídico Morales",    "Santiago",    "estudio-juridico-morales.html"),
        ("Abogados Asociados Pacífico", "Valparaíso",  "abogados-asociados-pacifico.html"),
        ("Legal Corporativo Sur",       "Concepción",  "legal-corporativo-sur.html"),
    ],
    "Real Estate & Property": [
        ("Propiedades del Litoral",     "Viña del Mar","propiedades-del-litoral.html"),
        ("Inmobiliaria Cordillera",     "Santiago",    "inmobiliaria-cordillera.html"),
        ("Corredora Patagonia",         "Punta Arenas","corredora-patagonia.html"),
    ],
    "Local Specialist Services": [
        ("Electricidad Rápida 24",      "Santiago",    "electricidad-rapida-24.html"),
        ("Gasfitería Don Luis",         "Temuco",      "gasfiteria-don-luis.html"),
        ("Climatización Norte",         "Antofagasta", "climatizacion-norte.html"),
    ],
}

FIRST_NAMES = ["María", "Juan", "Camila", "Diego", "Ignacia", "Matías", "Valentina", "Sebastián"]


def http(method: str, path: str, body: dict | None = None) -> dict:
    url = BASE + path
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("User-Agent", UA)
    if body is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as e:
        return {"error": e.read().decode("utf-8", errors="replace"), "status": e.code}
    except Exception as e:
        return {"error": str(e)}


# ─── Step 1: Seed templates ──────────────────────────────────────────────
print("▶ Seeding 8 niche templates …")
r = http("POST", "?r=seed_templates&token=NWM_SEED_2026", {})
print("  ", r)

# ─── Step 2: Pull template list ──────────────────────────────────────────
print("\n▶ Fetching templates …")
tpls = http("GET", "?r=templates")
if isinstance(tpls, dict) and tpls.get("error"):
    print("  ✗ Failed:", tpls); raise SystemExit(1)
tpl_by_niche = {t["niche"]: t for t in tpls if t.get("niche")}
print(f"   Found {len(tpl_by_niche)} niches in DB: {list(tpl_by_niche.keys())}")

# ─── Step 3: Create/upsert 8 campaigns ───────────────────────────────────
print("\n▶ Creating 8 draft campaigns …")
campaigns_existing = http("GET", "?r=campaigns")
existing_by_name = {c["name"]: c for c in campaigns_existing} if isinstance(campaigns_existing, list) else {}

campaign_ids = {}
for niche, tpl in tpl_by_niche.items():
    cname = f"{niche} — Intro Blast"
    if cname in existing_by_name:
        cid = existing_by_name[cname]["id"]
        print(f"   ≈ exists: [{cid}] {cname}")
    else:
        res = http("POST", "?r=campaigns", {
            "name": cname,
            "template_id": tpl["id"],
            "from_name":  "NetWebMedia",
            "from_email": "newsletter@netwebmedia.com",
            "audience_filter": {"niche": niche},
            "status": "draft",
        })
        cid = res.get("id")
        print(f"   + created [{cid}] {cname}")
    campaign_ids[niche] = cid

# ─── Step 4: Fire 8 test sends to carlos@netwebmedia.com ───────────────────
print(f"\n▶ Sending 8 TEST emails to {TO} …")
results = []
for niche, cid in campaign_ids.items():
    fixtures = FIXTURES.get(niche, [("Muestra Co", "Santiago", "muestra-co.html")])
    company, city, slug_file = random.choice(fixtures)
    first = random.choice(FIRST_NAMES)
    sample = {
        "name":    f"{first} Sample",
        "company": company,
        "city":    city,
        "niche":   niche,
        "page":    f"companies/{city.lower().replace(' ','-').replace('ñ','n').replace('á','a').replace('é','e').replace('í','i').replace('ó','o').replace('ú','u')}/{slug_file}",
    }
    res = http("POST", f"?r=campaigns&id={cid}&action=test", {
        "to": TO, "sample": sample,
        # Until netwebmedia.com is verified in Resend, use the shared sender
        "from_name":  "NetWebMedia (test)",
        "from_email": "onboarding@resend.dev",
    })
    ok = res.get("sent") is True
    mark = "✓" if ok else "✗"
    info = f"id={res.get('id','-')}" if ok else res.get('error') or res
    print(f"   {mark} [{niche:40s}] {company:30s} → {info}")
    results.append((niche, company, ok, info))
    time.sleep(0.15)  # stay under Resend rate limit

# ─── Summary ─────────────────────────────────────────────────────────────
ok_count = sum(1 for _, _, ok, _ in results if ok)
print(f"\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
print(f" {ok_count}/{len(results)} tests sent successfully to {TO}")
print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
if ok_count < len(results):
    print("\nFailures:")
    for n, c, ok, info in results:
        if not ok:
            print(f"  • {n} ({c}): {info}")
