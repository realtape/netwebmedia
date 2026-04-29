import json, subprocess

TOKEN = "e158aac301307b58a34ac4aaa5d7db444d30dec4f9b384d0877b79df4b8e5bff"
BASE_URL = "https://netwebmedia.com/api/resources/contact"
DATE = "2026-04-29"

enrichments = [
    {
        "id": 1011,
        "title": "Township of Mount Holly",
        "data": {
            "email": "dmuchowski@twp.mountholly.nj.us",
            "name": "dmuchowski@twp.mountholly.nj.us",
            "source": "footer-homepage",
            "tags": ["newsletter", "lead-new"],
            "company_name": "Township of Mount Holly",
            "company_industry": "Local Government / Municipal Administration",
            "company_location": "Mount Holly, New Jersey, USA",
            "company_size": "medium",
            "company_services": "Municipal administration, police, parks, planning/zoning, tax collection, public works, economic development",
            "website": "https://twp.mountholly.nj.us",
            "fit_for_nwm": False,
            "fit_reason": "Government municipality, not an SMB — NWM targets private small-to-medium businesses needing digital marketing and websites.",
            "enriched_at": DATE
        }
    },
    {
        "id": 1009,
        "title": "Kiki Elvis (domain down)",
        "data": {
            "email": "johnmeyer@kikielvis.com",
            "name": "johnmeyer@kikielvis.com",
            "source": "footer-homepage",
            "tags": ["newsletter", "lead-new"],
            "company_name": "Kiki Elvis",
            "company_industry": "Unknown — domain is down/inactive",
            "company_location": "Unknown",
            "company_size": "small",
            "company_services": "Unknown — website unreachable",
            "website": "https://kikielvis.com",
            "fit_for_nwm": True,
            "fit_reason": "Domain is dead/inactive — if this is a small business that lost its web presence, NWM could help rebuild it.",
            "enriched_at": DATE
        }
    },
    {
        "id": 1006,
        "title": "Valve Corporation",
        "data": {
            "email": "subpoenainquiries@valvesoftware.com",
            "name": "subpoenainquiries@valvesoftware.com",
            "source": "footer-homepage",
            "tags": ["newsletter", "lead-new"],
            "company_name": "Valve Corporation",
            "company_industry": "Video Games / Digital Distribution",
            "company_location": "Bellevue, Washington, USA",
            "company_size": "large",
            "company_services": "Game development, Steam digital distribution platform, gaming hardware",
            "website": "https://www.valvesoftware.com",
            "fit_for_nwm": False,
            "fit_reason": "Valve is a major tech/gaming corporation (Steam) — far too large and technical for NWM's SMB digital marketing services.",
            "enriched_at": DATE
        }
    },
    {
        "id": 1000,
        "title": "Arcadian Projects",
        "data": {
            "email": "luke@arcadianprojects.ca",
            "name": "luke@arcadianprojects.ca",
            "source": "footer-homepage",
            "tags": ["newsletter", "lead-new"],
            "company_name": "Arcadian Projects",
            "company_industry": "Renewable Energy / B2B Industrial",
            "company_location": "Ontario, Canada",
            "company_size": "medium",
            "company_services": "Renewable energy project development and management",
            "website": "https://arcadianprojects.ca",
            "fit_for_nwm": False,
            "fit_reason": "B2B industrial renewable energy firm in Canada — too large and outside NWM's US/LatAm SMB target market.",
            "enriched_at": DATE
        }
    },
    {
        "id": 997,
        "title": "Lake County Government (Shannon Heenan)",
        "data": {
            "email": "shannon.heenan@lakecountyca.gov",
            "name": "shannon.heenan@lakecountyca.gov",
            "source": "footer-homepage",
            "tags": ["newsletter", "lead-new"],
            "company_name": "County of Lake, California",
            "company_industry": "County Government",
            "company_location": "Lakeport, California, USA",
            "company_size": "large",
            "company_services": "County administration, public health, courts, elections, public works, social services",
            "website": "https://www.lakecountyca.gov",
            "fit_for_nwm": False,
            "fit_reason": "California county government agency — not an SMB and not a fit for NWM digital marketing services.",
            "enriched_at": DATE
        }
    },
    {
        "id": 994,
        "title": "Kevlar Electrical Ltd",
        "data": {
            "email": "kevin@kevlarelectrical.com",
            "name": "kevin@kevlarelectrical.com",
            "source": "footer-homepage",
            "tags": ["newsletter", "lead-new"],
            "company_name": "Kevlar Electrical Ltd",
            "company_industry": "Electrical Contracting / Home Services",
            "company_location": "Hampshire, United Kingdom",
            "company_size": "small",
            "company_services": "Residential and commercial electrical installation, testing, and repairs",
            "website": "https://kevlarelectrical.com",
            "fit_for_nwm": True,
            "fit_reason": "Small electrical contractor founded Jan 2023 with basic web presence — ideal for NWM website/digital marketing (home_services niche), though UK-based.",
            "enriched_at": DATE
        }
    },
    {
        "id": 988,
        "title": "Fleet Clean USA",
        "data": {
            "email": "kfinley@fleetcleanusa.com",
            "name": "kfinley@fleetcleanusa.com",
            "source": "footer-homepage",
            "tags": ["newsletter", "lead-new"],
            "company_name": "Fleet Clean USA",
            "company_industry": "Commercial Vehicle Washing / Franchise",
            "company_location": "USA (national, 60+ locations)",
            "company_size": "large",
            "company_services": "Mobile fleet washing and exterior cleaning for commercial trucks and vehicles",
            "website": "https://fleetcleanusa.com",
            "fit_for_nwm": False,
            "fit_reason": "National franchise with 50+ years history and 60+ locations — too large and established for NWM SMB-focused services.",
            "enriched_at": DATE
        }
    },
    {
        "id": 986,
        "title": "Lake County Government (Admin)",
        "data": {
            "email": "admin@lakecountyca.gov",
            "name": "admin@lakecountyca.gov",
            "source": "footer-homepage",
            "tags": ["newsletter", "lead-new"],
            "company_name": "County of Lake, California",
            "company_industry": "County Government",
            "company_location": "Lakeport, California, USA",
            "company_size": "large",
            "company_services": "County administration, public health, courts, elections, public works, social services",
            "website": "https://www.lakecountyca.gov",
            "fit_for_nwm": False,
            "fit_reason": "California county government agency — not an SMB and not a fit for NWM digital marketing services.",
            "enriched_at": DATE
        }
    }
]

results = []
for e in enrichments:
    cid = e["id"]
    payload = {
        "title": e["title"],
        "status": "active",
        "data": e["data"]
    }
    payload_path = f"/tmp/payload_{cid}.json"
    with open(payload_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)

    cmd = [
        "curl", "-s", "-X", "PUT",
        f"{BASE_URL}/{cid}",
        "-H", f"X-Auth-Token: {TOKEN}",
        "-H", "Accept: application/json",
        "-H", "Content-Type: application/json",
        "-H", "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
        "-H", "Referer: https://netwebmedia.com/crm-vanilla/",
        "-d", f"@{payload_path}"
    ]

    result = subprocess.run(cmd, capture_output=True)
    resp_text = result.stdout.decode("utf-8", errors="replace")

    try:
        resp = json.loads(resp_text)
        if resp.get("id"):
            status = f"OK (id={resp['id']})"
        else:
            status = f"RESP: {resp_text[:150]}"
    except Exception as ex:
        status = f"ERROR: {resp_text[:150]}"

    print(f"ID={cid} ({e['title'][:35]}): {status}")
    results.append({"id": cid, "title": e["title"], "status": status})

with open("/tmp/crm_update_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("\nAll updates complete.")
