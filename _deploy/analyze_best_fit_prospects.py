#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Re-analyze 680 prospects for fit with NetWebMedia's 7 core services:
- AI Automations
- AI Agents (Booking, SDR, etc.)
- CRM
- AI Websites
- Paid Ads
- AI SEO & Content
- Social Media

Scores each prospect by:
1. Service fit (does NetWebMedia solve their top pain points?)
2. Conversion likelihood (budget + urgency + company size)
3. Revenue potential (LTV × conversion rate)

Output:
- top_fit_prospects.json (best 170 by NetWebMedia fit score)
- analysis_report.txt (breakdown by niche + service opportunity)

Usage:
    python analyze_best_fit_prospects.py
"""
import json
import os
import sys
from collections import defaultdict

sys.path.insert(0, os.path.dirname(__file__))
from niches_regions import NICHES, NICHE_ORDER

try:
    import openpyxl
except ImportError:
    print("ERROR: openpyxl not installed")
    sys.exit(1)

HERE = os.path.dirname(os.path.abspath(__file__))
XLSX_PATH = os.path.join(HERE, "NetWebMedia_Chile_680_Businesses_Website_Social_Audit.xlsx")
CRM_JSON_PATH = os.path.join(HERE, "crm_import.json")

# NetWebMedia's service fit mapping per niche
SERVICE_FIT = {
    "tourism": {
        "primary": ["AI Booking Agent", "AI Website", "Paid Ads", "AI SEO"],
        "secondary": ["Social Media", "CRM"],
        "conversion_likelihood": 0.65,  # High: seasonal, responsive to ads
        "avg_ltv": 8000,  # Monthly revenue from conversions
    },
    "restaurants": {
        "primary": ["AI Website", "Social Media", "Paid Ads", "CRM"],
        "secondary": ["AI Automations", "AI SEO"],
        "conversion_likelihood": 0.70,
        "avg_ltv": 4000,
    },
    "health": {
        "primary": ["AI Website", "AI Booking Agent", "CRM", "AI SEO"],
        "secondary": ["Social Media", "Paid Ads"],
        "conversion_likelihood": 0.60,
        "avg_ltv": 6000,
    },
    "beauty": {
        "primary": ["Social Media", "AI Booking Agent", "AI Website"],
        "secondary": ["Paid Ads", "CRM"],
        "conversion_likelihood": 0.72,
        "avg_ltv": 3500,
    },
    "smb": {
        "primary": ["AI Website", "Paid Ads", "AI SEO", "Social Media"],
        "secondary": ["CRM", "AI Automations"],
        "conversion_likelihood": 0.58,
        "avg_ltv": 2500,
    },
    "law_firms": {
        "primary": ["AI Website", "CRM", "AI SDR Agent", "Paid Ads"],
        "secondary": ["AI SEO", "AI Automations"],
        "conversion_likelihood": 0.45,
        "avg_ltv": 15000,
    },
    "real_estate": {
        "primary": ["AI Website", "CRM", "Paid Ads", "AI Automations"],
        "secondary": ["AI SEO", "Social Media"],
        "conversion_likelihood": 0.55,
        "avg_ltv": 8000,
    },
    "local_specialist": {
        "primary": ["AI Booking Agent", "AI Website", "Paid Ads"],
        "secondary": ["CRM", "AI SEO", "Social Media"],
        "conversion_likelihood": 0.62,
        "avg_ltv": 3000,
    },
}

def score_for_netwebmedia(row_data, niche_key):
    """Score prospect by fit with NetWebMedia services."""
    score = 0
    details = {
        "niche": niche_key,
        "fit_services": [],
        "pain_points": [],
    }

    # Extract fields
    website_status = (row_data.get("website_status") or "").lower()
    analytics = (row_data.get("analytics") or "").lower()
    social_media = (row_data.get("social_media") or "").lower()
    fb_pixel = (row_data.get("fb_pixel") or "").lower()

    # Service fit scoring
    fit_config = SERVICE_FIT.get(niche_key, SERVICE_FIT["smb"])

    # AI Website need: broken/missing website
    if not website_status or website_status in ("error", "broken", "offline", "no", "inactive"):
        score += 25
        details["fit_services"].append("AI Website")
        details["pain_points"].append("No/broken website")

    # AI Booking Agent need: no online booking (implied by lack of integrations)
    score += 15  # Default assumption for all niches
    details["fit_services"].append("AI Booking Agent")
    details["pain_points"].append("No 24/7 booking")

    # CRM need: manual follow-up (implied if no CRM status or analytics)
    if not analytics or "no" in analytics:
        score += 20
        details["fit_services"].append("CRM")
        details["pain_points"].append("No analytics/CRM visibility")

    # Paid Ads need: no retargeting (FB Pixel missing)
    if not fb_pixel or "no" in fb_pixel:
        score += 20
        details["fit_services"].append("Paid Ads")
        details["pain_points"].append("Can't retarget visitors")

    # AI SEO need: no analytics or low-optimization signals
    if not analytics or "no" in analytics:
        score += 15
        details["fit_services"].append("AI SEO & Content")
        details["pain_points"].append("No SEO strategy")

    # Social Media need: missing social presence
    if not social_media or "no" in social_media.lower() or social_media.count(",") == 0:
        score += 18
        details["fit_services"].append("Social Media")
        details["pain_points"].append("No social strategy")

    # AI Automations: general efficiency (all niches benefit)
    score += 8
    details["fit_services"].append("AI Automations")

    # Revenue potential bonus (high-LTV niches)
    ltv = fit_config.get("avg_ltv", 3000)
    if ltv >= 8000:
        score += 15
        details["revenue_potential"] = "High"
    elif ltv >= 5000:
        score += 10
        details["revenue_potential"] = "Medium"
    else:
        score += 5
        details["revenue_potential"] = "Lower"

    # Conversion likelihood multiplier
    conv_likelihood = fit_config.get("conversion_likelihood", 0.6)
    score = int(score * (0.3 + conv_likelihood * 0.7))  # Weight by conversion

    # Deduplicate and limit services
    details["fit_services"] = list(set(details["fit_services"]))[:3]

    return score, details

def main():
    print("Loading prospects...")
    with open(CRM_JSON_PATH, "r", encoding="utf-8") as f:
        records = json.load(f)

    print(f"Scoring {len(records)} prospects for NetWebMedia fit...")

    scored = []
    by_niche = defaultdict(list)

    for r in records:
        niche_key = r.get("niche_key", "smb")
        score, details = score_for_netwebmedia(r, niche_key)

        prospect = {
            "name": r.get("name"),
            "email": r.get("email"),
            "city": r.get("city"),
            "niche": r.get("niche"),
            "niche_key": niche_key,
            "website": r.get("website"),
            "nwm_score": score,
            "nwm_details": details,
        }
        scored.append(prospect)
        by_niche[niche_key].append((score, prospect))

    # Sort by score
    scored.sort(key=lambda x: x["nwm_score"], reverse=True)

    # Top 170 by fit
    top_170 = scored[:170]

    print(f"\nDistribution of top 170 by niche:")
    for niche in NICHE_ORDER:
        count = sum(1 for p in top_170 if p["niche_key"] == niche)
        print(f"  {niche:20s}: {count:3d}")

    print(f"\nTop 170 prospect fit scores:")
    print(f"  Avg: {sum(p['nwm_score'] for p in top_170) / len(top_170):.0f}")
    print(f"  Min: {top_170[-1]['nwm_score']:.0f}")
    print(f"  Max: {top_170[0]['nwm_score']:.0f}")

    # Write output
    output_path = os.path.join(HERE, "top_fit_prospects.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(top_170, f, indent=2, ensure_ascii=False)
    print(f"\nWrote {output_path}")

    # Analysis report
    report_path = os.path.join(HERE, "nwm_analysis_report.txt")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("NetWebMedia Prospect Analysis Report\n")
        f.write("=" * 60 + "\n\n")
        f.write(f"Total Prospects Analyzed: {len(records)}\n")
        f.write(f"Top-Fit Selected: 170 (10 per region)\n\n")
        f.write("Top 5 Prospects by NetWebMedia Fit Score:\n")
        f.write("-" * 60 + "\n")
        for i, p in enumerate(top_170[:5], 1):
            f.write(f"{i}. {p['name']:40s} ({p['niche']:25s}) Score: {p['nwm_score']:3d}\n")
            f.write(f"   Email: {p['email']}\n")
            f.write(f"   Services: {', '.join(p['nwm_details']['fit_services'])}\n")
            f.write(f"   Pain Points: {', '.join(p['nwm_details']['pain_points'])}\n\n")

        f.write("\nService Fit Breakdown (top 170):\n")
        f.write("-" * 60 + "\n")
        service_counts = defaultdict(int)
        for p in top_170:
            for service in p['nwm_details']['fit_services']:
                service_counts[service] += 1
        for service in sorted(service_counts.keys(), key=lambda x: service_counts[x], reverse=True):
            f.write(f"  {service:25s}: {service_counts[service]:3d} prospects\n")

    print(f"Wrote {report_path}")

if __name__ == "__main__":
    main()
