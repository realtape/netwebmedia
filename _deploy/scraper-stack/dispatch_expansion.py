"""
Expansion dispatch: all Chilean regions + all 50 US states.

We use REGION-LEVEL bboxes (state for US, region for Chile) so we capture
businesses in smaller towns too — not just the metropolitan centers.

Already covered by the first batch (don't re-dispatch):
  Chile cities: Santiago, Valparaiso, Vina del Mar, Concepcion, Antofagasta,
                La Serena, Puerto Montt, Temuco, Iquique, Punta Arenas
  US cities:    NYC, LA, Chicago, Houston, Phoenix, Dallas, Austin, SF, Miami

This script targets the GAPS: Chilean regions (subnational admin1) and all 50 US states.
"""
import json
import boto3

REGION = "us-east-1"
QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/744092293944/nwm-scrape-jobs"

# Niche → OSM tag mapping (copied from dispatch_jobs.py)
NICHE_TAGS = {
    "tourism":       {"tourism_tags": ["hotel","hostel","guest_house","motel","apartment","chalet","resort"]},
    "restaurants":   {"amenity_tags": ["restaurant","cafe","bar","pub","fast_food","food_court","biergarten"]},
    "health":        {"amenity_tags": ["clinic","doctors","hospital","veterinary","dentist","pharmacy","nursing_home"]},
    "beauty":        {"shop_tags": ["beauty","hairdresser","cosmetics","perfumery"], "amenity_tags": ["spa"]},
    "smb":           {"shop_tags": ["general","hardware","stationery","convenience","supermarket","department_store"]},
    "law_firms":     {"amenity_tags": ["law_firm","notary","courthouse"]},
    "real_estate":   {"shop_tags": ["estate_agent"]},
    "local_specialist": {"shop_tags": ["boutique","gift","jewelry","leather","art","antiques","books"]},
    "automotive":    {"shop_tags": ["car","car_repair","car_parts","tyres","motorcycle"], "amenity_tags": ["car_wash","fuel"]},
    "education":     {"amenity_tags": ["school","kindergarten","language_school","music_school","driving_school","college","university"]},
    "events_weddings": {"amenity_tags": ["events_venue","wedding_hall","conference_centre"], "shop_tags": ["wedding"]},
    "financial_services": {"amenity_tags": ["bank","bureau_de_change","atm"]},
    "home_services": {"shop_tags": ["doityourself","hardware","houseware","paint","trade"]},
    "wine_agriculture": {"shop_tags": ["wine","alcohol","farm"], "amenity_tags": ["winery"]},
}

# Already-scraped cities — don't re-dispatch
ALREADY_DONE = {
    ("CL","Santiago"), ("CL","Valparaiso"), ("CL","Vina del Mar"), ("CL","Concepcion"),
    ("CL","Antofagasta"), ("CL","La Serena"), ("CL","Puerto Montt"), ("CL","Temuco"),
    ("CL","Iquique"), ("CL","Punta Arenas"),
    ("US","New York"), ("US","Los Angeles"), ("US","Chicago"), ("US","Houston"),
    ("US","Phoenix"), ("US","Dallas"), ("US","Austin"), ("US","San Francisco"), ("US","Miami"),
}

# ---------------------------------------------------------------------------
# CHILEAN REGIONS — bbox covers each region's primary populated belt
# bbox order: south, west, north, east
# ---------------------------------------------------------------------------
CHILE_REGIONS = [
    # Northern regions
    {"city": "Arica region",          "country": "CL", "bbox": "-18.55,-70.40,-17.50,-69.45"},
    {"city": "Tarapaca region",       "country": "CL", "bbox": "-21.50,-70.20,-19.20,-68.95"},
    {"city": "Antofagasta region",    "country": "CL", "bbox": "-26.10,-70.65,-21.55,-68.05"},
    {"city": "Atacama region",        "country": "CL", "bbox": "-29.30,-71.05,-26.15,-68.30"},
    {"city": "Coquimbo region",       "country": "CL", "bbox": "-32.30,-71.70,-29.35,-69.85"},
    # Central regions
    {"city": "Valparaiso region",     "country": "CL", "bbox": "-33.50,-71.95,-32.05,-70.05"},
    {"city": "Metropolitana region",  "country": "CL", "bbox": "-34.20,-71.10,-33.10,-69.85"},
    {"city": "OHiggins region",       "country": "CL", "bbox": "-34.95,-72.10,-33.85,-70.05"},
    {"city": "Maule region",          "country": "CL", "bbox": "-36.40,-72.90,-34.75,-70.30"},
    {"city": "Nuble region",          "country": "CL", "bbox": "-37.15,-72.95,-36.10,-71.05"},
    {"city": "Biobio region",         "country": "CL", "bbox": "-38.80,-73.80,-36.50,-71.20"},
    # Southern regions
    {"city": "Araucania region",      "country": "CL", "bbox": "-39.65,-73.95,-37.55,-70.95"},
    {"city": "Los Rios region",       "country": "CL", "bbox": "-40.70,-73.95,-39.20,-71.50"},
    {"city": "Los Lagos region",      "country": "CL", "bbox": "-44.10,-74.55,-40.65,-71.50"},
    {"city": "Aysen region",          "country": "CL", "bbox": "-49.45,-75.95,-43.85,-70.85"},
    {"city": "Magallanes region",     "country": "CL", "bbox": "-56.55,-75.65,-48.65,-66.40"},
]

# ---------------------------------------------------------------------------
# US STATES — 50 states, bbox per state (Census Bureau approx)
# bbox order: south, west, north, east
# ---------------------------------------------------------------------------
US_STATES = [
    {"city": "Alabama",         "country": "US", "bbox": "30.14,-88.47,35.01,-84.89"},
    {"city": "Alaska",          "country": "US", "bbox": "51.20,-179.99,71.40,-129.99"},
    {"city": "Arizona",         "country": "US", "bbox": "31.33,-114.82,37.00,-109.05"},
    {"city": "Arkansas",        "country": "US", "bbox": "33.00,-94.62,36.50,-89.64"},
    {"city": "California",      "country": "US", "bbox": "32.53,-124.41,42.01,-114.13"},
    {"city": "Colorado",        "country": "US", "bbox": "36.99,-109.06,41.00,-102.04"},
    {"city": "Connecticut",     "country": "US", "bbox": "40.95,-73.73,42.05,-71.79"},
    {"city": "Delaware",        "country": "US", "bbox": "38.45,-75.79,39.84,-75.05"},
    {"city": "Florida",         "country": "US", "bbox": "24.40,-87.63,31.00,-79.97"},
    {"city": "Georgia",         "country": "US", "bbox": "30.36,-85.61,35.00,-80.84"},
    {"city": "Hawaii",          "country": "US", "bbox": "18.91,-160.25,22.24,-154.81"},
    {"city": "Idaho",           "country": "US", "bbox": "41.99,-117.24,49.00,-111.04"},
    {"city": "Illinois",        "country": "US", "bbox": "36.97,-91.51,42.51,-87.49"},
    {"city": "Indiana",         "country": "US", "bbox": "37.77,-88.10,41.76,-84.78"},
    {"city": "Iowa",            "country": "US", "bbox": "40.38,-96.64,43.50,-90.14"},
    {"city": "Kansas",          "country": "US", "bbox": "36.99,-102.05,40.00,-94.59"},
    {"city": "Kentucky",        "country": "US", "bbox": "36.50,-89.57,39.15,-81.96"},
    {"city": "Louisiana",       "country": "US", "bbox": "28.93,-94.04,33.02,-88.82"},
    {"city": "Maine",           "country": "US", "bbox": "43.07,-71.08,47.46,-66.95"},
    {"city": "Maryland",        "country": "US", "bbox": "37.89,-79.49,39.72,-75.05"},
    {"city": "Massachusetts",   "country": "US", "bbox": "41.24,-73.51,42.89,-69.93"},
    {"city": "Michigan",        "country": "US", "bbox": "41.70,-90.42,48.31,-82.41"},
    {"city": "Minnesota",       "country": "US", "bbox": "43.50,-97.24,49.38,-89.49"},
    {"city": "Mississippi",     "country": "US", "bbox": "30.17,-91.66,34.99,-88.10"},
    {"city": "Missouri",        "country": "US", "bbox": "35.99,-95.77,40.61,-89.10"},
    {"city": "Montana",         "country": "US", "bbox": "44.36,-116.05,49.00,-104.04"},
    {"city": "Nebraska",        "country": "US", "bbox": "39.99,-104.05,43.00,-95.31"},
    {"city": "Nevada",          "country": "US", "bbox": "35.00,-120.01,42.00,-114.04"},
    {"city": "New Hampshire",   "country": "US", "bbox": "42.70,-72.56,45.31,-70.61"},
    {"city": "New Jersey",      "country": "US", "bbox": "38.93,-75.56,41.36,-73.89"},
    {"city": "New Mexico",      "country": "US", "bbox": "31.33,-109.05,37.00,-103.00"},
    {"city": "North Carolina",  "country": "US", "bbox": "33.84,-84.32,36.59,-75.46"},
    {"city": "North Dakota",    "country": "US", "bbox": "45.94,-104.05,49.00,-96.55"},
    {"city": "Ohio",            "country": "US", "bbox": "38.40,-84.82,41.98,-80.52"},
    {"city": "Oklahoma",        "country": "US", "bbox": "33.62,-103.00,37.00,-94.43"},
    {"city": "Oregon",          "country": "US", "bbox": "41.99,-124.55,46.29,-116.46"},
    {"city": "Pennsylvania",    "country": "US", "bbox": "39.72,-80.52,42.27,-74.69"},
    {"city": "Rhode Island",    "country": "US", "bbox": "41.15,-71.86,42.02,-71.12"},
    {"city": "South Carolina",  "country": "US", "bbox": "32.03,-83.35,35.22,-78.50"},
    {"city": "South Dakota",    "country": "US", "bbox": "42.48,-104.06,45.94,-96.44"},
    {"city": "Tennessee",       "country": "US", "bbox": "34.98,-90.31,36.68,-81.65"},
    {"city": "Texas",           "country": "US", "bbox": "25.84,-106.65,36.50,-93.51"},
    {"city": "Utah",            "country": "US", "bbox": "36.99,-114.05,42.00,-109.04"},
    {"city": "Vermont",         "country": "US", "bbox": "42.73,-73.43,45.02,-71.46"},
    {"city": "Virginia",        "country": "US", "bbox": "36.54,-83.68,39.46,-75.24"},
    {"city": "Washington",      "country": "US", "bbox": "45.54,-124.85,49.00,-116.92"},
    {"city": "West Virginia",   "country": "US", "bbox": "37.20,-82.65,40.64,-77.72"},
    {"city": "Wisconsin",       "country": "US", "bbox": "42.49,-92.89,47.08,-86.80"},
    {"city": "Wyoming",         "country": "US", "bbox": "40.99,-111.06,45.01,-104.05"},
    {"city": "District of Columbia", "country": "US", "bbox": "38.79,-77.12,38.99,-76.91"},
]


def main():
    sqs = boto3.client("sqs", region_name=REGION)
    all_regions = CHILE_REGIONS + US_STATES
    pushed = 0
    skipped = 0
    for region_def in all_regions:
        key = (region_def["country"], region_def["city"])
        if key in ALREADY_DONE:
            skipped += 1
            continue
        for niche, tag_def in NICHE_TAGS.items():
            job = {"city": region_def["city"], "country": region_def["country"],
                   "niche": niche, "bbox": region_def["bbox"]}
            for k in ("tourism_tags","amenity_tags","shop_tags","office_tags",
                      "craft_tags","leisure_tags","landuse_tags"):
                if tag_def.get(k):
                    job[k] = tag_def[k]
            sqs.send_message(QueueUrl=QUEUE_URL, MessageBody=json.dumps(job))
            pushed += 1
            if pushed % 100 == 0:
                print(f"  {pushed} pushed")
    print(f"\nDispatched {pushed} new jobs ({len(all_regions)} regions x 14 niches, {skipped} skipped as already done).")


if __name__ == "__main__":
    main()
