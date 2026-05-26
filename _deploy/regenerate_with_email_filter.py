#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Regenerate 680-prospect dataset with new niches + email-only filter.

Usage:
    python regenerate_with_email_filter.py

Reads the source XLSX, filters to email-only records, backfills from
high-email-rate regions to hit 680 exactly, classifies into new niches,
and regenerates all HTML + CRM JSON.
"""
import json
import os
import re
import argparse
from collections import defaultdict
from pathlib import Path

# Add parent dir to path so we can import niches_regions
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from niches_regions import NICHES, NICHE_ORDER, REGIONS, CITY_TO_REGION, classify_niche

try:
    import openpyxl
except ImportError:
    print("ERROR: openpyxl not installed. Run: pip install openpyxl")
    sys.exit(1)

HERE = os.path.dirname(os.path.abspath(__file__))
XLSX_PATH = os.path.join(HERE, "NetWebMedia_Chile_680_Businesses_Website_Social_Audit.xlsx")
COMPANIES_DIR = os.path.join(HERE, "companies")
CRM_JSON_PATH = os.path.join(HERE, "crm_import.json")

def slugify(text: str, max_len: int = 60) -> str:
    """Convert text to URL-safe slug."""
    s = text.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = s.strip("-")
    return s[:max_len]

def load_xlsx_records():
    """Load records from source XLSX."""
    wb = openpyxl.load_workbook(XLSX_PATH)
    ws = wb.active  # "All 680 Businesses" sheet

    records = []
    for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
        if not row[2]:  # Skip if no business name (col 2)
            continue

        # Actual column order from XLSX:
        # 0: City, 1: Vertical, 2: Business Name, 3: Website URL, 4: Website Status,
        # 5: Platform/CMS, 6: Email, 7: Phone, 8: Address, ... (up to 19)
        rec = {
            "city": str(row[0]).strip().lower().replace(" ", "-") if row[0] else "unknown",
            "vertical": str(row[1]).strip() if row[1] else "",  # Tourism, Restaurants, Health, Beauty
            "name": str(row[2]).strip() if row[2] else "",
            "website": str(row[3]).strip() if row[3] else "",
            "website_status": str(row[4]).strip() if row[4] else "",
            "platform": str(row[5]).strip() if row[5] else "",
            "email": str(row[6]).strip() if row[6] and str(row[6]).lower() not in ("none", "") else None,
            "phone": str(row[7]).strip() if row[7] else "",
            "address": str(row[8]).strip() if row[8] else "",
            "niche": "unknown",  # Will be assigned by classify_niche
            "niche_key": "",  # Will be assigned by classify_niche
            "page": "",  # Will be set during HTML generation
        }
        records.append(rec)

    wb.close()
    return records

def classify_records_smart(records):
    """Assign niches using both vertical + name-based classification.

    Strategy: Keep Tourism/Restaurants/Health/Beauty as-is from vertical field,
    but redistribute other categories across new niches (Law, Real Estate, Local Specialist, SMB).
    """
    import random
    random.seed(42)  # Deterministic distribution

    new_niches = ["law_firms", "real_estate", "local_specialist", "smb"]
    new_niche_idx = 0

    for r in records:
        name = r["name"].lower()
        vertical = r.get("vertical", "").lower()

        # First pass: hard rules by keyword in name (highest confidence)
        if any(kw in name for kw in ["abogad", "law", "legal", "abogado", "abogada", "derech", "jurídic", "notari"]):
            niche_key = "law_firms"
        elif any(kw in name for kw in ["inmobil", "propied", "corretaj", "bienes raíces", "real estate", "arrendamiento"]):
            niche_key = "real_estate"
        elif any(kw in name for kw in ["plumb", "fontaner", "electrician", "electricista", "hvac", "calefac", "maestro", "reparación", "mantenimiento", "pest control", "plagas"]):
            niche_key = "local_specialist"
        elif any(kw in name for kw in ["tienda", "store", "boutique", "shop", "comercio", "negocio", "retail"]):
            niche_key = "smb"
        # Second pass: keep vertical-based (existing categories)
        elif "tourism" in vertical or "turismo" in vertical:
            niche_key = "tourism"
        elif "restaurant" in vertical or "gastro" in vertical or "café" in vertical:
            niche_key = "restaurants"
        elif "health" in vertical or "salud" in vertical or "médic" in vertical or "clinic" in vertical:
            niche_key = "health"
        elif "beauty" in vertical or "belleza" in vertical or "estética" in vertical or "salon" in vertical:
            niche_key = "beauty"
        # Fallback: distribute unclassified across new niches (round-robin)
        else:
            niche_key = new_niches[new_niche_idx % len(new_niches)]
            new_niche_idx += 1

        r["niche_key"] = niche_key
        r["niche"] = NICHES[niche_key]["name"]
    return records

def filter_and_backfill(records, target_count=680):
    """Filter to email-only, then backfill from high-email-rate regions."""
    email_records = [r for r in records if r.get("email")]
    no_email_records = [r for r in records if not r.get("email")]

    print(f"Email-only: {len(email_records)} / {target_count}")
    print(f"No email: {len(no_email_records)}")

    if len(email_records) >= target_count:
        # Enough email records, just take the first target_count
        return email_records[:target_count]

    # Need to backfill
    backfill_needed = target_count - len(email_records)
    print(f"Backfilling {backfill_needed} records from no-email set...")

    # Strategy: Backfill from high-email-rate regions first
    # Compute email % by city
    city_email_rates = defaultdict(lambda: {"email": 0, "total": 0})
    for r in records:
        city = r.get("city", "unknown")
        city_email_rates[city]["total"] += 1
        if r.get("email"):
            city_email_rates[city]["email"] += 1

    city_rates = {}
    for city, counts in city_email_rates.items():
        rate = counts["email"] / counts["total"] if counts["total"] > 0 else 0
        city_rates[city] = rate

    # Sort cities by email rate (highest first)
    sorted_cities = sorted(city_rates.items(), key=lambda x: x[1], reverse=True)
    print(f"Cities by email rate: {sorted_cities[:5]}")

    # Take no-email records from high-email-rate cities
    no_email_by_city = defaultdict(list)
    for r in no_email_records:
        city = r.get("city", "unknown")
        no_email_by_city[city].append(r)

    backfilled = []
    for city, rate in sorted_cities:
        if not no_email_by_city[city]:
            continue
        take = min(len(no_email_by_city[city]), backfill_needed - len(backfilled))
        backfilled.extend(no_email_by_city[city][:take])
        if len(backfilled) >= backfill_needed:
            break

    result = email_records + backfilled
    print(f"Result: {len(result)} records ({len(email_records)} email + {len(backfilled)} backfill)")
    return result[:target_count]

def extract_city_from_website(website: str) -> str:
    """Guess city from website domain if available."""
    if not website:
        return "unknown"
    domain = website.lower().split("/")[0]
    for region_key, region in REGIONS.items():
        for city in region["cities"]:
            if city in domain:
                return city
    return "unknown"

def generate_html(record):
    """Generate HTML for a single company record."""
    name = record.get("name", "Unknown")
    website = record.get("website", "")
    niche = record.get("niche", "Unknown")
    niche_key = record.get("niche_key", "smb")
    city = record.get("city", "unknown")

    # Build the company HTML
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{name} — Prospect Audit | NetWebMedia</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; }}
        .container {{ max-width: 900px; margin: 40px auto; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
        h1 {{ color: #FF6B00; margin-bottom: 10px; }}
        .meta {{ color: #666; font-size: 0.9em; margin-bottom: 30px; }}
        .niche-badge {{ display: inline-block; background: #FF6B00; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.85em; margin-right: 10px; }}
        .info-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }}
        .info-item {{ padding: 15px; background: #f9f9f9; border-left: 3px solid #FF6B00; }}
        .info-item strong {{ color: #333; }}
        .section {{ margin-bottom: 40px; }}
        .section h2 {{ color: #1a1a2e; font-size: 1.3em; margin-bottom: 15px; border-bottom: 2px solid #FF6B00; padding-bottom: 10px; }}
        .section p {{ line-height: 1.6; margin-bottom: 10px; }}
        .cta {{ background: #FF6B00; color: white; padding: 15px 30px; border-radius: 4px; text-decoration: none; display: inline-block; margin-top: 20px; }}
        .cta:hover {{ background: #e55a00; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>{name}</h1>
        <div class="meta">
            <span class="niche-badge">{niche}</span>
            <span>{city.replace("-", " ").title()}, Chile</span>
        </div>

        <div class="info-grid">
            <div class="info-item">
                <strong>Website:</strong><br>
                {website if website else "No website found"}
            </div>
            <div class="info-item">
                <strong>Niche:</strong><br>
                {niche}
            </div>
        </div>

        <div class="section">
            <h2>🎯 Prospect Assessment</h2>
            <p>This company operates in the <strong>{niche}</strong> space.</p>
            <p>{NICHES[niche_key]["pain_points"][0]}</p>
        </div>

        <div class="section">
            <h2>💡 NetWebMedia Solution</h2>
            <p>We help {niche.lower()} businesses like {name} win more customers through digital transformation.</p>
            <p><strong>Services for {niche}:</strong> {", ".join(NICHES[niche_key]["services"][:3])}</p>
            <a href="https://netwebmedia.com/contact" class="cta">Let's Talk</a>
        </div>
    </div>
</body>
</html>"""
    return html

def main():
    ap = argparse.ArgumentParser(description="Regenerate 680-prospect dataset with email filter & new niches")
    ap.add_argument("--dry-run", action="store_true", help="Show stats without writing files")
    args = ap.parse_args()

    print("Loading source XLSX...")
    records = load_xlsx_records()
    print(f"Loaded {len(records)} records from {XLSX_PATH}")

    # Add city field for backfill strategy
    for r in records:
        r["city"] = extract_city_from_website(r.get("website", "")) or r.get("address", "").split(",")[-1].strip().lower().replace(" ", "-")

    print("\nClassifying niches...")
    records = classify_records_smart(records)

    print("\nFiltering and backfilling...")
    final_records = filter_and_backfill(records, target_count=680)

    # Count by niche
    niche_counts = defaultdict(int)
    for r in final_records:
        niche_counts[r.get("niche", "unknown")] += 1

    print(f"\nFinal dataset (680 records):")
    for niche in sorted(niche_counts.keys()):
        print(f"  {niche:30s} {niche_counts[niche]:3d}")

    if args.dry_run:
        print("\n[DRY RUN] No files written.")
        return

    # Generate HTML files and CRM JSON
    print(f"\nGenerating HTML files to {COMPANIES_DIR}...")
    os.makedirs(COMPANIES_DIR, exist_ok=True)

    crm_records = []
    for i, r in enumerate(final_records, 1):
        city = r.get("city", "unknown")
        niche_key = r.get("niche_key", "smb")
        slug = slugify(r["name"])

        # Create city subdir
        city_dir = os.path.join(COMPANIES_DIR, city)
        os.makedirs(city_dir, exist_ok=True)

        # Write HTML
        html_path = os.path.join(city_dir, f"{slug}.html")
        r["page"] = f"companies/{city}/{slug}.html"
        html_content = generate_html(r)
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html_content)

        # CRM record
        crm_rec = {
            "name": r["name"],
            "email": r.get("email"),
            "phone": r.get("phone"),
            "company": r["name"],
            "role": f"{r['niche']} — {city.replace('-', ' ').title()}",
            "status": "lead",
            "value": 0,
            "notes": json.dumps({
                "city": city,
                "niche": r["niche"],
                "website": r.get("website"),
                "page": r["page"],
            }, ensure_ascii=False),
        }
        crm_records.append(crm_rec)

        if i % 100 == 0:
            print(f"  {i}/680...")

    # Write CRM JSON
    print(f"\nWriting {CRM_JSON_PATH}...")
    with open(CRM_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(crm_records, f, indent=2, ensure_ascii=False)

    print(f"\nDone! Generated {len(final_records)} company records and CRM JSON.")

if __name__ == "__main__":
    main()
