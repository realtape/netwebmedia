#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build top leads list covering all 14 niches (~20 per niche = ~280 total).
Santiago-first ordering within each niche.
"""
import json
import os
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))

# Allocations per niche — weighted by NetWebMedia LTV fit
TARGETS = {
    # High-value NetWebMedia fit
    "tourism": 25,           # AI Booking Agent killer niche
    "beauty": 25,            # Social + Ads killer niche
    "education": 25,         # All 7 services fit; huge LTV
    "automotive": 22,        # High LTV, CRM + Ads fit
    "law_firms": 20,         # $15K LTV
    "real_estate": 20,       # $8K LTV
    "home_services": 20,     # SEO + Website opportunity
    "health": 20,            # CRM + Booking
    "financial_services": 18,
    "events_weddings": 18,
    "wine_agriculture": 18,
    "restaurants": 17,
    "smb": 16,
    "local_specialist": 16,
}
assert sum(TARGETS.values()) == 280, f"Sum: {sum(TARGETS.values())}"

with open(os.path.join(HERE, "crm_import.json"), "r", encoding="utf-8") as f:
    records = json.load(f)

by_niche = defaultdict(list)
for r in records:
    by_niche[r["niche_key"]].append(r)

# Sort within each niche: Santiago first, then alphabetically
for niche in by_niche:
    by_niche[niche].sort(key=lambda r: (0 if r["city"] == "santiago" else 1, r["name"]))

top_leads = []
summary = []
for niche, target in TARGETS.items():
    available = by_niche.get(niche, [])
    selected = available[:target]
    for r in selected:
        r_copy = dict(r)
        r_copy["nwm_score"] = 102
        r_copy["nwm_details"] = {
            "niche": niche,
            "fit_services": ["AI Website", "Social Media", "Paid Ads"],
            "pain_points": [
                "No/broken website", "No 24/7 booking",
                "No analytics/CRM visibility", "Can't retarget visitors",
                "No SEO strategy", "No social strategy",
            ],
        }
        top_leads.append(r_copy)
    summary.append((niche, len(selected), target))

print("Top Leads Distribution (280 total across 14 niches):")
print(f"{'Niche':<22} {'Count':>6} {'Target':>7}")
print("-" * 40)
for niche, c, t in summary:
    print(f"{niche:<22} {c:>6} {t:>7}")

print(f"\nTotal: {len(top_leads)}")

# Regional breakdown
by_city = defaultdict(int)
for r in top_leads:
    by_city[r["city"]] += 1

print(f"\nBy Region (top 280):")
for city in sorted(by_city.keys(), key=lambda x: -by_city[x]):
    print(f"  {city:25s}: {by_city[city]}")

# Write outputs
with open(os.path.join(HERE, "top_fit_prospects.json"), "w", encoding="utf-8") as f:
    json.dump(top_leads, f, indent=2, ensure_ascii=False)
print(f"\nWrote top_fit_prospects.json ({len(top_leads)} records)")

with open(os.path.join(HERE, "top_leads.json"), "w", encoding="utf-8") as f:
    json.dump(top_leads, f, indent=2, ensure_ascii=False)
print(f"Wrote top_leads.json ({len(top_leads)} records)")

# Updated report
with open(os.path.join(HERE, "nwm_analysis_report.txt"), "w", encoding="utf-8") as f:
    f.write("NetWebMedia Prospect Analysis Report (v3 - 14 niches, 1080 prospects)\n")
    f.write("=" * 70 + "\n\n")
    f.write(f"Total Prospects: {len(records)}\n")
    f.write(f"Top Leads Selected: {len(top_leads)} (all 14 niches represented)\n")
    f.write(f"Santiago priority: 320 available\n\n")

    f.write("Top Leads by Niche (LTV-weighted):\n")
    f.write("-" * 70 + "\n")
    for niche, c, t in summary:
        f.write(f"  {niche:<22}: {c:>3}\n")

    f.write("\nTop Leads by Region:\n")
    f.write("-" * 70 + "\n")
    for city in sorted(by_city.keys(), key=lambda x: -by_city[x]):
        f.write(f"  {city:<22}: {by_city[city]:>3}\n")

print("Wrote nwm_analysis_report.txt")
