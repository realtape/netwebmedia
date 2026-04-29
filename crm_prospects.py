import json, subprocess

TOKEN = "e158aac301307b58a34ac4aaa5d7db444d30dec4f9b384d0877b79df4b8e5bff"
BASE_URL = "https://netwebmedia.com/api/resources/contact"
DATE = "2026-04-29"

prospects = [
    {
        "title": "Natasha's Exclusive Salon",
        "data": {
            "email": "Natashasexclusivesalon@gmail.com",
            "name": "Natasha's Exclusive Salon",
            "source": "web-prospecting-2026-04",
            "tags": ["lead-new", "prospected"],
            "company_name": "Natasha's Exclusive Salon",
            "company_industry": "beauty",
            "company_location": "Webster, Texas, USA",
            "company_size": "small",
            "website": "https://www.natashasexclusivesalon.com",
            "fit_for_nwm": True,
            "fit_reason": "Small beauty salon in Webster TX operating from a suite — fits NWM beauty niche, needs stronger digital marketing and local SEO to compete in Houston metro.",
            "enriched_at": DATE
        }
    },
    {
        "title": "The Real Estate Agency of SW Florida",
        "data": {
            "email": "info@theagencyswfl.com",
            "name": "The Real Estate Agency of SW Florida",
            "source": "web-prospecting-2026-04",
            "tags": ["lead-new", "prospected"],
            "company_name": "The Real Estate Agency of SW Florida",
            "company_industry": "real_estate",
            "company_location": "Naples, Florida, USA",
            "company_size": "small",
            "website": "https://theagencyswfl.com",
            "fit_for_nwm": True,
            "fit_reason": "Boutique real estate agency in Southwest Florida — fits NWM real_estate niche and would benefit from professional digital marketing to compete in the Naples/Bonita Springs luxury market.",
            "enriched_at": DATE
        }
    },
    {
        "title": "Ideal South America Travel",
        "data": {
            "email": "info@idealsouthamerica.com",
            "name": "Ideal South America",
            "source": "web-prospecting-2026-04",
            "tags": ["lead-new", "prospected"],
            "company_name": "Ideal South America",
            "company_industry": "tourism",
            "company_location": "Miami, Florida, USA",
            "company_size": "small",
            "website": "https://idealsouthamerica.com",
            "fit_for_nwm": True,
            "fit_reason": "US-based boutique travel agency specializing in LatAm tourism — squarely in NWM tourism niche and US/LatAm market, strong fit for SEO and content marketing.",
            "enriched_at": DATE
        }
    },
    {
        "title": "Chad Miller Auto Care",
        "data": {
            "email": "info@cmautocare.com",
            "name": "Chad Miller Auto Care",
            "source": "web-prospecting-2026-04",
            "tags": ["lead-new", "prospected"],
            "company_name": "Chad Miller Auto Care",
            "company_industry": "automotive",
            "company_location": "San Antonio, Texas, USA",
            "company_size": "small",
            "website": "https://cmautocare.com",
            "fit_for_nwm": True,
            "fit_reason": "Family-owned auto repair shop in San Antonio since 2014 — fits NWM automotive niche and would benefit from local SEO and digital ads to grow beyond word-of-mouth.",
            "enriched_at": DATE
        }
    },
    {
        "title": "Family Auto Center Houston",
        "data": {
            "email": "familyauto1@comcast.net",
            "name": "Family Auto Center",
            "source": "web-prospecting-2026-04",
            "tags": ["lead-new", "prospected"],
            "company_name": "Family Auto Center",
            "company_industry": "automotive",
            "company_location": "Houston, Texas, USA",
            "company_size": "small",
            "website": "https://www.familyautocenterhouston.com",
            "fit_for_nwm": True,
            "fit_reason": "30+ year family-owned auto shop in Houston with AAA certification but an outdated web presence — strong candidate for NWM website redesign and local SEO.",
            "enriched_at": DATE
        }
    },
    {
        "title": "Serendipity Events by Tina",
        "data": {
            "email": "tina.dannel@serendipityeventsbytina.com",
            "name": "Tina Dannel",
            "source": "web-prospecting-2026-04",
            "tags": ["lead-new", "prospected"],
            "company_name": "Serendipity Events by Tina",
            "company_industry": "events_weddings",
            "company_location": "Dallas/Fort Worth, Texas, USA",
            "company_size": "small",
            "website": "https://www.serendipityeventsbytina.com",
            "fit_for_nwm": True,
            "fit_reason": "Small certified wedding planning boutique serving DFW and Central Florida — fits NWM events_weddings niche, needs stronger digital presence to compete in the crowded DFW wedding market.",
            "enriched_at": DATE
        }
    },
    {
        "title": "KPT Event Planning",
        "data": {
            "email": "hello@kpteventplanning.com",
            "name": "Kristin (KPT Event Planning)",
            "source": "web-prospecting-2026-04",
            "tags": ["lead-new", "prospected"],
            "company_name": "KPT Event Planning",
            "company_industry": "events_weddings",
            "company_location": "Dallas-Fort Worth, Texas, USA",
            "company_size": "small",
            "website": "https://www.kpteventplanning.com",
            "fit_for_nwm": True,
            "fit_reason": "Small DFW wedding planning company led by Kristin — fits NWM events_weddings niche, could benefit from SEO-driven lead generation and social media marketing.",
            "enriched_at": DATE
        }
    },
    {
        "title": "Alief Lawn Care",
        "data": {
            "email": "contact@alieflawncare.com",
            "name": "Alief Lawn Care",
            "source": "web-prospecting-2026-04",
            "tags": ["lead-new", "prospected"],
            "company_name": "Alief Lawn Care",
            "company_industry": "home_services",
            "company_location": "Houston, Texas, USA",
            "company_size": "small",
            "website": "https://www.alieflawncare.com",
            "fit_for_nwm": True,
            "fit_reason": "Family-owned lawn care company in greater Houston — fits NWM home_services niche, relying on word-of-mouth with minimal digital presence, perfect for local SEO and Google Ads.",
            "enriched_at": DATE
        }
    },
    {
        "title": "Florida Turf Pros",
        "data": {
            "email": "floridaturfpros@gmail.com",
            "name": "Florida Turf Pros",
            "source": "web-prospecting-2026-04",
            "tags": ["lead-new", "prospected"],
            "company_name": "Florida Turf Pros",
            "company_industry": "home_services",
            "company_location": "Pace, Florida, USA",
            "company_size": "small",
            "website": "https://floridaturfpros.com",
            "fit_for_nwm": True,
            "fit_reason": "Family-owned landscaping company in Pace FL with a basic website — strong fit for NWM home_services niche, needs SEO and Google Maps optimization to capture local search traffic.",
            "enriched_at": DATE
        }
    },
    {
        "title": "Sabina Vineyards",
        "data": {
            "email": "ryan@sabinavineyards.com",
            "name": "Ryan (Sabina Vineyards)",
            "source": "web-prospecting-2026-04",
            "tags": ["lead-new", "prospected"],
            "company_name": "Sabina Vineyards",
            "company_industry": "wine_agriculture",
            "company_location": "St. Helena, Napa Valley, California, USA",
            "company_size": "small",
            "website": "https://sabinavineyards.com",
            "fit_for_nwm": True,
            "fit_reason": "Boutique family winery in Napa Valley with organic farming and e-commerce — fits NWM wine_agriculture niche and could benefit from targeted digital marketing to grow wine club memberships.",
            "enriched_at": DATE
        }
    }
]

results = []
for p in prospects:
    payload = {
        "title": p["title"],
        "status": "active",
        "data": p["data"]
    }

    payload_path = f"/tmp/prospect_payload_{p['title'][:20].replace(' ', '_')}.json"
    with open(payload_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)

    cmd = [
        "curl", "-s", "-X", "POST",
        BASE_URL,
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
            status = f"CREATED (id={resp['id']})"
        else:
            status = f"RESP: {resp_text[:150]}"
    except Exception as ex:
        status = f"ERROR: {resp_text[:150]}"

    print(f"{p['title'][:40]}: {status}")
    results.append({"title": p["title"], "status": status})

with open("/tmp/crm_prospects_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("\nAll prospect POSTs complete.")
