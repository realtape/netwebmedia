#!/usr/bin/env python3
"""
NWM Lead Scraper v3 — Overpass (OpenStreetMap), phase 1: data collection
Collects name, phone, address, website from public OSM data.
Run enrich.py afterwards to add emails by visiting websites.

Usage:
  python _leads/scraper.py                   # all niches, both countries
  python _leads/scraper.py --country us
  python _leads/scraper.py --country cl
  python _leads/scraper.py --niche restaurants,health,beauty

Resume: if checkpoint.json exists the script skips completed cities.
Output: _leads/leads.csv
"""

import requests
import json
import csv
import time
import random
import os
import argparse
from datetime import datetime

# ── Constants ─────────────────────────────────────────────────────────────────

OVERPASS    = "https://overpass.kumi.systems/api/interpreter"
OUTPUT_DIR  = os.path.dirname(os.path.abspath(__file__))
LEADS_CSV   = os.path.join(OUTPUT_DIR, "leads.csv")
CHECKPOINT  = os.path.join(OUTPUT_DIR, "checkpoint.json")
DELAY       = (4, 8)   # seconds between Overpass requests (be a good citizen)

CSV_FIELDS  = ["source","country","niche","name","phone","address",
               "city","website","email","lat","lon","scraped_at"]

# ── NWM 14 niches — OSM tag value patterns ────────────────────────────────────
# Used both to build the query and to classify results.

NICHE_PATTERNS = {
    "tourism":            {"amenity": {"hotel"}, "tourism": {"hotel","hostel","guest_house","apartment","motel"}},
    "restaurants":        {"amenity": {"restaurant","cafe","bar","fast_food","pub","bistro","food_court"}},
    "health":             {"amenity": {"dentist","clinic","doctors","veterinary","physiotherapist","hospital"},
                           "healthcare": {}},
    "beauty":             {"shop": {"hairdresser","beauty","barber","nail_salon","cosmetics"},
                           "amenity": {"spa","beauty_salon"}},
    "smb":                {"office": {"marketing","consulting","advertising","coworking","company"}},
    "law_firms":          {"office": {"lawyer","legal","notary","attorney"}},
    "real_estate":        {"office": {"estate_agent","real_estate","property_management"}},
    "local_specialist":   {"shop": {"boutique","clothes","fashion","sports","bicycle","jewelry"},
                           "leisure": {"fitness_centre","sports_centre"}},
    "automotive":         {"shop": {"car","car_repair","tyres","motorbike","motorcycle","car_parts"},
                           "amenity": {"car_rental","car_wash"}},
    "education":          {"amenity": {"school","language_school","driving_school","college","university"},
                           "office": {"educational_institution"}},
    "events_weddings":    {"amenity": {"events_venue","conference_centre","nightclub","arts_centre","theatre"},
                           "leisure": {"dance"}},
    "financial_services": {"office": {"accountant","financial","insurance","financial_advisor","tax"},
                           "amenity": {"bank"}},
    "home_services":      {"craft": {"plumber","electrician","carpenter","painter","roofer","glazier","floorer","hvac"},
                           "shop": {"garden_centre","hardware","electrical","plumbing"}},
    "wine_agriculture":   {"craft": {"winery"}, "tourism": {"winery"},
                           "shop": {"wine","alcohol"}, "landuse": {"vineyard","orchard"}},
}

# ── Build one unified Overpass query per city ─────────────────────────────────

def build_union_query(bbox, niches=None, timeout=90):
    """All selected niches combined into one Overpass union query."""
    lat1, lon1, lat2, lon2 = bbox
    bb = f"({lat1},{lon1},{lat2},{lon2})"

    parts = set()
    patterns = {n: v for n, v in NICHE_PATTERNS.items()
                if niches is None or n in niches}

    for _niche, tag_map in patterns.items():
        for key, values in tag_map.items():
            if values:
                regex = "|".join(sorted(values))
                parts.add(f'nw["{key}"~"{regex}"]{bb};')
            else:
                parts.add(f'nw["{key}"]{bb};')

    union = "\n  ".join(sorted(parts))
    return f"[out:json][timeout:{timeout}];\n(\n  {union}\n);\nout body;"

# ── Classify an OSM element into an NWM niche ─────────────────────────────────

def classify_niche(tags, selected_niches):
    for niche in (selected_niches or list(NICHE_PATTERNS.keys())):
        for key, values in NICHE_PATTERNS[niche].items():
            tag_val = tags.get(key, "").lower()
            if not tag_val:
                continue
            if not values:        # key must just exist
                return niche
            if tag_val in values:
                return niche
            if any(tag_val.startswith(v) or v in tag_val for v in values):
                return niche
    return "smb"                  # fallback

# ── Parse element → lead dict ─────────────────────────────────────────────────

def parse_element(el, city_name, country, selected_niches):
    t = el.get("tags", {})
    name = t.get("name", "").strip()
    if not name:
        return None

    phone   = (t.get("phone") or t.get("contact:phone") or t.get("telephone") or "").strip()
    website = (t.get("website") or t.get("contact:website") or t.get("url") or "").strip()
    email   = (t.get("email") or t.get("contact:email") or "").strip()

    parts = [t.get("addr:housenumber",""), t.get("addr:street",""),
             t.get("addr:city",""), t.get("addr:postcode","")]
    address = " ".join(p for p in parts if p).strip() or city_name

    lat = el.get("lat") or (el.get("bounds", {}).get("minlat") or "")
    lon = el.get("lon") or (el.get("bounds", {}).get("minlon") or "")

    return {
        "source":     "openstreetmap",
        "country":    country,
        "niche":      classify_niche(t, selected_niches),
        "name":       name,
        "phone":      phone,
        "address":    address,
        "city":       city_name,
        "website":    website,
        "email":      email,
        "lat":        lat,
        "lon":        lon,
        "scraped_at": datetime.utcnow().strftime("%Y-%m-%d"),
    }

# ── Overpass request ──────────────────────────────────────────────────────────

def fetch_overpass(query, retries=3):
    for attempt in range(retries):
        try:
            r = requests.post(OVERPASS, data=query, timeout=110)
            if r.status_code == 200:
                data = json.loads(r.text)
                # detect server-side timeout (elements=[] but remark present)
                if not data.get("elements") and "remark" in data:
                    print(f"  [overpass] server timeout: {data['remark'][:80]}")
                    return None   # signals caller to retry in smaller batches
                return data.get("elements", [])
            if r.status_code == 429:
                wait = 90 * (attempt + 1)
                print(f"  [rate-limit] sleeping {wait}s")
                time.sleep(wait)
            elif r.status_code in (504, 502, 503):
                print(f"  [overpass] HTTP {r.status_code}, retry {attempt+1}")
                time.sleep(20 * (attempt + 1))
            else:
                print(f"  [overpass] HTTP {r.status_code}")
                break
        except Exception as e:
            print(f"  [overpass] attempt {attempt+1} error: {e}")
            time.sleep(15)
    return []


# ── Split niche groups for large cities ───────────────────────────────────────

NICHE_GROUPS = [
    ["tourism", "restaurants", "health", "beauty", "smb", "law_firms", "real_estate"],
    ["local_specialist", "automotive", "education", "events_weddings",
     "financial_services", "home_services", "wine_agriculture"],
]

def split_bbox(bbox):
    """Split a bounding box into 4 quadrants."""
    lat1, lon1, lat2, lon2 = bbox
    lat_mid = (lat1 + lat2) / 2
    lon_mid = (lon1 + lon2) / 2
    return [
        (lat1,    lon1,    lat_mid, lon_mid),
        (lat1,    lon_mid, lat_mid, lon2),
        (lat_mid, lon1,    lat2,    lon_mid),
        (lat_mid, lon_mid, lat2,    lon2),
    ]

def fetch_city(bbox, niche_filter):
    """Fetch all elements for a city. Falls back to split strategies on timeout."""
    niches = niche_filter or list(NICHE_PATTERNS.keys())

    # 1. Try single combined query (90s server timeout)
    query = build_union_query(bbox, set(niches), timeout=90)
    result = fetch_overpass(query)
    if result is not None:
        return result

    # 2. Split into 2 niche batches (same bbox)
    print(f"  [split-niches] retrying in 2 niche batches...")
    all_elements = []
    any_success = False
    for group in NICHE_GROUPS:
        batch = [n for n in group if n in niches]
        if not batch:
            continue
        time.sleep(random.uniform(5, 10))
        q = build_union_query(bbox, set(batch), timeout=90)
        els = fetch_overpass(q)
        if els:
            all_elements.extend(els)
            any_success = True
        elif els is None:
            # Still timing out — fall through to geographic split
            any_success = False
            break

    if any_success:
        return all_elements

    # 3. Geographic split: 4 quadrants × 2 niche batches
    print(f"  [split-geo] retrying in 4 geographic quadrants...")
    all_elements = []
    for quad_bbox in split_bbox(bbox):
        for group in NICHE_GROUPS:
            batch = [n for n in group if n in niches]
            if not batch:
                continue
            time.sleep(random.uniform(4, 8))
            q = build_union_query(quad_bbox, set(batch), timeout=60)
            els = fetch_overpass(q)
            if els:
                all_elements.extend(els)
    return all_elements

# ── CSV / checkpoint helpers ──────────────────────────────────────────────────

def ensure_csv():
    if not os.path.exists(LEADS_CSV):
        with open(LEADS_CSV, "w", newline="", encoding="utf-8") as f:
            csv.DictWriter(f, fieldnames=CSV_FIELDS).writeheader()

def append_leads(leads):
    with open(LEADS_CSV, "a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        for lead in leads:
            w.writerow({k: lead.get(k, "") for k in CSV_FIELDS})

def load_cp():
    if os.path.exists(CHECKPOINT):
        with open(CHECKPOINT) as f:
            return json.load(f)
    return {"done": [], "total": 0}

def save_cp(cp):
    with open(CHECKPOINT, "w") as f:
        json.dump(cp, f)

# ── City definitions ──────────────────────────────────────────────────────────

US_CITIES = {
    "Miami FL":         (25.70, -80.35, 25.88, -80.12),
    "New York NY":      (40.50, -74.30, 40.92, -73.70),
    "Los Angeles CA":   (33.70, -118.70, 34.35, -118.10),
    "Chicago IL":       (41.64, -87.95, 42.05, -87.50),
    "Houston TX":       (29.52, -95.60, 30.11, -95.00),
    "Phoenix AZ":       (33.29, -112.35, 33.83, -111.80),
    "Philadelphia PA":  (39.87, -75.30, 40.14, -74.95),
    "San Antonio TX":   (29.27, -98.70, 29.72, -98.27),
    "San Diego CA":     (32.53, -117.29, 32.99, -116.90),
    "Dallas TX":        (32.62, -97.00, 33.01, -96.55),
    "Austin TX":        (30.10, -97.95, 30.52, -97.55),
    "Jacksonville FL":  (30.10, -82.00, 30.59, -81.40),
    "Seattle WA":       (47.48, -122.45, 47.73, -122.24),
    "Denver CO":        (39.61, -105.10, 39.91, -104.72),
    "Nashville TN":     (36.05, -87.00, 36.35, -86.65),
    "Atlanta GA":       (33.65, -84.55, 33.89, -84.30),
    "Las Vegas NV":     (36.08, -115.40, 36.35, -115.05),
    "Portland OR":      (45.43, -122.87, 45.65, -122.47),
    "Minneapolis MN":   (44.89, -93.37, 45.05, -93.19),
    "Tampa FL":         (27.87, -82.60, 28.07, -82.37),
    "San Francisco CA": (37.70, -122.52, 37.83, -122.36),
    "Charlotte NC":     (35.05, -81.02, 35.36, -80.70),
    "New Orleans LA":   (29.90, -90.14, 30.04, -89.94),
    "Fort Worth TX":    (32.62, -97.47, 32.87, -97.17),
    "Orlando FL":       (28.40, -81.55, 28.65, -81.28),
}

CHILE_CITIES = {
    "Santiago":    (-33.65, -70.80, -33.32, -70.50),
    "Valparaiso":  (-33.10, -71.80, -33.00, -71.55),
    "Concepcion":  (-37.02, -73.10, -36.80, -72.90),
    "La Serena":   (-30.00, -71.35, -29.87, -71.23),
    "Antofagasta": (-23.75, -70.47, -23.58, -70.35),
    "Temuco":      (-38.78, -72.75, -38.68, -72.55),
    "Rancagua":    (-34.20, -70.82, -34.09, -70.68),
    "Talca":       (-35.48, -71.72, -35.38, -71.60),
    "Iquique":     (-20.30, -70.20, -20.18, -70.10),
    "Arica":       (-18.53, -70.35, -18.45, -70.30),
}

# ── Main ──────────────────────────────────────────────────────────────────────

def run(args):
    cp = load_cp()
    ensure_csv()

    niche_filter = set(args.niche.split(",")) if args.niche else None
    country_flt  = args.country.lower()

    tasks = []
    if country_flt in ("us", "both"):
        for city, bbox in US_CITIES.items():
            tasks.append(("US", city, bbox))
    if country_flt in ("cl", "both"):
        for city, bbox in CHILE_CITIES.items():
            tasks.append(("CL", city, bbox))

    print(f"\n{'='*62}")
    print(f"NWM Lead Scraper v3  —  {len(tasks)} city queries")
    print(f"Country: {country_flt.upper()}  |  Niches: {','.join(niche_filter) if niche_filter else 'all 14'}")
    print(f"Output:  {LEADS_CSV}")
    print(f"Tip: run enrich.py afterwards to add emails from websites.")
    print(f"{'='*62}\n")

    for i, (country, city, bbox) in enumerate(tasks):
        task_id = f"{country}|{city}"
        if task_id in cp["done"]:
            print(f"[{i+1}/{len(tasks)}] SKIP  {country} | {city}")
            continue

        print(f"[{i+1}/{len(tasks)}] {country} | {city}... ", end="", flush=True)

        elements = fetch_city(bbox, niche_filter)

        leads = []
        seen  = set()
        for el in elements:
            lead = parse_element(el, city, country, niche_filter)
            if lead:
                key = (lead["name"].lower(), lead["address"])
                if key not in seen:
                    seen.add(key)
                    leads.append(lead)

        has_website = sum(1 for l in leads if l["website"])
        has_email   = sum(1 for l in leads if l["email"])
        has_phone   = sum(1 for l in leads if l["phone"])

        append_leads(leads)
        cp["done"].append(task_id)
        cp["total"] = cp.get("total", 0) + len(leads)
        save_cp(cp)

        print(f"{len(leads):>5} leads | "
              f"phone {has_phone} | web {has_website} | email {has_email} | "
              f"total so far: {cp['total']}")

        time.sleep(random.uniform(*DELAY))

    print(f"\nDone. Collection complete.  Total leads: {cp['total']}")
    print(f"  CSV:  {LEADS_CSV}")
    print(f"  Next: python _leads/enrich.py  (adds emails from websites)\n")


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="NWM Lead Scraper — data collection phase")
    p.add_argument("--niche",   default=None, help="Comma-separated niches. Default: all 14.")
    p.add_argument("--country", default="both", help="us | cl | both  (default: both)")
    run(p.parse_args())
