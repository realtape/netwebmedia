"""
Dispatcher — pushes (city × niche) jobs to SQS.

Coverage: 14 NWM niches × 30 major LATAM + US cities = 420 jobs.
Each job hits Overpass with the right tag categories for that niche.
Lambda fan-out: 20 concurrent, ~50s/job → ~18 min total wall-clock.
"""
import json
import os
import sys
import boto3

REGION = "us-east-1"
QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/744092293944/nwm-scrape-jobs"

# ---------------------------------------------------------------------------
# Niche → OSM tag mapping
# ---------------------------------------------------------------------------
NICHE_TAGS = {
    "tourism": {
        "tourism_tags": ["hotel", "hostel", "guest_house", "motel", "apartment", "chalet", "resort"],
    },
    "restaurants": {
        "amenity_tags": ["restaurant", "cafe", "bar", "pub", "fast_food", "food_court", "biergarten"],
    },
    "health": {
        "amenity_tags": ["clinic", "doctors", "hospital", "veterinary", "dentist", "pharmacy", "nursing_home"],
    },
    "beauty": {
        "shop_tags": ["beauty", "hairdresser", "cosmetics", "perfumery"],
        "amenity_tags": ["spa"],
    },
    "smb": {
        "shop_tags": ["general", "hardware", "stationery", "convenience", "supermarket", "department_store"],
    },
    "law_firms": {
        "amenity_tags": ["law_firm", "notary", "courthouse"],
        "office_tags": ["lawyer", "notary"],
    },
    "real_estate": {
        "office_tags": ["estate_agent", "property_management"],
        "shop_tags": ["estate_agent"],
    },
    "local_specialist": {
        "shop_tags": ["boutique", "gift", "jewelry", "leather", "art", "antiques", "books"],
        "leisure_tags": ["fitness_centre"],
    },
    "automotive": {
        "shop_tags": ["car", "car_repair", "car_parts", "tyres", "motorcycle"],
        "amenity_tags": ["car_wash", "fuel"],
    },
    "education": {
        "amenity_tags": ["school", "kindergarten", "language_school", "music_school", "driving_school", "college", "university"],
    },
    "events_weddings": {
        "amenity_tags": ["events_venue", "wedding_hall", "conference_centre"],
        "shop_tags": ["wedding"],
    },
    "financial_services": {
        "amenity_tags": ["bank", "bureau_de_change", "atm"],
        "office_tags": ["financial", "accountant", "tax_advisor", "insurance"],
    },
    "home_services": {
        "shop_tags": ["doityourself", "hardware", "houseware", "paint", "trade"],
        "office_tags": ["company"],
        "craft_tags": ["plumber", "electrician", "carpenter", "painter", "gardener", "tiler", "roofer"],
    },
    "wine_agriculture": {
        "shop_tags": ["wine", "alcohol", "farm"],
        "amenity_tags": ["winery"],
        "tourism_tags": ["winery"],
        "landuse_tags": ["vineyard"],
    },
}

# ---------------------------------------------------------------------------
# Cities → bbox (south, west, north, east) — approximate metro coverage
# ---------------------------------------------------------------------------
CITIES = [
    # Chile (NWM home market, priority)
    {"city": "Santiago",       "country": "CL", "bbox": "-33.70,-70.90,-33.30,-70.45"},
    {"city": "Valparaiso",     "country": "CL", "bbox": "-33.10,-71.65,-32.95,-71.55"},
    {"city": "Vina del Mar",   "country": "CL", "bbox": "-33.10,-71.60,-32.95,-71.50"},
    {"city": "Concepcion",     "country": "CL", "bbox": "-36.95,-73.20,-36.70,-72.95"},
    {"city": "Antofagasta",    "country": "CL", "bbox": "-23.75,-70.50,-23.45,-70.35"},
    {"city": "La Serena",      "country": "CL", "bbox": "-30.05,-71.30,-29.85,-71.20"},
    {"city": "Puerto Montt",   "country": "CL", "bbox": "-41.55,-73.10,-41.40,-72.90"},
    {"city": "Temuco",         "country": "CL", "bbox": "-38.78,-72.70,-38.65,-72.55"},
    {"city": "Iquique",        "country": "CL", "bbox": "-20.30,-70.20,-20.10,-70.10"},
    {"city": "Punta Arenas",   "country": "CL", "bbox": "-53.20,-70.95,-53.10,-70.85"},
    # Argentina
    {"city": "Buenos Aires",   "country": "AR", "bbox": "-34.75,-58.60,-34.50,-58.30"},
    {"city": "Cordoba",        "country": "AR", "bbox": "-31.50,-64.30,-31.30,-64.10"},
    {"city": "Rosario",        "country": "AR", "bbox": "-33.05,-60.75,-32.85,-60.55"},
    {"city": "Mendoza",        "country": "AR", "bbox": "-32.97,-68.95,-32.80,-68.78"},
    # Peru / Colombia / Brazil / Mexico
    {"city": "Lima",           "country": "PE", "bbox": "-12.25,-77.10,-11.95,-76.85"},
    {"city": "Bogota",         "country": "CO", "bbox": "4.50,-74.20,4.85,-74.00"},
    {"city": "Medellin",       "country": "CO", "bbox": "6.15,-75.65,6.35,-75.50"},
    {"city": "Mexico City",    "country": "MX", "bbox": "19.30,-99.30,19.55,-99.05"},
    {"city": "Guadalajara",    "country": "MX", "bbox": "20.60,-103.45,20.75,-103.25"},
    {"city": "Monterrey",      "country": "MX", "bbox": "25.60,-100.40,25.80,-100.20"},
    {"city": "Sao Paulo",      "country": "BR", "bbox": "-23.70,-46.85,-23.45,-46.55"},
    # USA (top metros)
    {"city": "New York",       "country": "US", "bbox": "40.55,-74.05,40.90,-73.70"},
    {"city": "Los Angeles",    "country": "US", "bbox": "33.85,-118.50,34.30,-118.10"},
    {"city": "Chicago",        "country": "US", "bbox": "41.65,-87.85,42.05,-87.55"},
    {"city": "Houston",        "country": "US", "bbox": "29.55,-95.55,29.95,-95.20"},
    {"city": "Phoenix",        "country": "US", "bbox": "33.30,-112.30,33.70,-111.95"},
    {"city": "Dallas",         "country": "US", "bbox": "32.65,-97.00,32.95,-96.65"},
    {"city": "Austin",         "country": "US", "bbox": "30.20,-97.85,30.45,-97.65"},
    {"city": "San Francisco",  "country": "US", "bbox": "37.70,-122.55,37.85,-122.35"},
    {"city": "Miami",          "country": "US", "bbox": "25.65,-80.35,25.95,-80.10"},
]


def main():
    sqs = boto3.client("sqs", region_name=REGION)
    pushed = 0
    skipped = 0
    print(f"Dispatching {len(CITIES)} cities × {len(NICHE_TAGS)} niches = {len(CITIES)*len(NICHE_TAGS)} jobs...")
    print()
    for city_def in CITIES:
        for niche, tag_def in NICHE_TAGS.items():
            # Skip empty tag sets (defensive)
            if not tag_def:
                skipped += 1
                continue
            job = {
                "city": city_def["city"],
                "country": city_def["country"],
                "niche": niche,
                "bbox": city_def["bbox"],
            }
            # Forward all tag categories (Lambda handles whichever are populated)
            for key in ("tourism_tags", "amenity_tags", "shop_tags", "office_tags",
                        "craft_tags", "leisure_tags", "landuse_tags"):
                if tag_def.get(key):
                    job[key] = tag_def[key]
            sqs.send_message(QueueUrl=QUEUE_URL, MessageBody=json.dumps(job))
            pushed += 1
            if pushed % 50 == 0:
                print(f"  {pushed} jobs pushed")
    print(f"\nDone. {pushed} jobs in flight, {skipped} skipped.")
    print(f"Watch CloudWatch: aws logs tail /aws/lambda/nwm-scrape-osm --follow --region us-east-1")
    print(f"Watch S3:        aws s3 ls s3://nwm-scrape-prospects-744092293944/scrape/ --recursive")


if __name__ == "__main__":
    main()
