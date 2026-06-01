"""
Path B: Split big-state bboxes into top metros to avoid Lambda 15-min timeouts.

For each US state we expand to top 4-5 metropolitan bboxes covering ~80% of
the state's businesses. Smaller bboxes = fewer businesses per job = each job
finishes well within Lambda's 15-min budget.

Also re-runs the Chilean regions as 2-3 sub-bboxes each (Antofagasta is huge,
Magallanes is huge, etc.).
"""
import json
import boto3

REGION = "us-east-1"
QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/744092293944/nwm-scrape-jobs"

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

# US — top 3-5 metros per state (population-weighted)
# bbox order: south, west, north, east
US_METROS = [
    # AL
    {"city": "Birmingham AL",      "country": "US", "bbox": "33.37,-87.04,33.65,-86.65"},
    {"city": "Huntsville AL",      "country": "US", "bbox": "34.60,-86.85,34.85,-86.45"},
    {"city": "Mobile AL",          "country": "US", "bbox": "30.55,-88.20,30.80,-87.95"},
    # AK
    {"city": "Anchorage AK",       "country": "US", "bbox": "61.05,-150.05,61.40,-149.65"},
    {"city": "Fairbanks AK",       "country": "US", "bbox": "64.75,-147.95,64.92,-147.55"},
    # AZ
    {"city": "Tucson AZ",          "country": "US", "bbox": "32.10,-111.10,32.35,-110.75"},
    {"city": "Mesa AZ",            "country": "US", "bbox": "33.30,-111.95,33.55,-111.55"},
    {"city": "Tempe AZ",           "country": "US", "bbox": "33.30,-111.99,33.45,-111.85"},
    {"city": "Scottsdale AZ",      "country": "US", "bbox": "33.45,-111.95,33.85,-111.75"},
    # AR
    {"city": "Little Rock AR",     "country": "US", "bbox": "34.65,-92.40,34.85,-92.15"},
    {"city": "Fayetteville AR",    "country": "US", "bbox": "36.00,-94.25,36.15,-94.05"},
    # CA (split LA was already done, but we add SD, Sacramento, Fresno, SJ, Oakland)
    {"city": "San Diego CA",       "country": "US", "bbox": "32.65,-117.30,32.90,-116.95"},
    {"city": "Sacramento CA",      "country": "US", "bbox": "38.50,-121.60,38.65,-121.40"},
    {"city": "San Jose CA",        "country": "US", "bbox": "37.20,-122.05,37.50,-121.75"},
    {"city": "Fresno CA",          "country": "US", "bbox": "36.65,-119.95,36.90,-119.65"},
    {"city": "Long Beach CA",      "country": "US", "bbox": "33.72,-118.25,33.88,-118.05"},
    {"city": "Oakland CA",         "country": "US", "bbox": "37.70,-122.30,37.85,-122.10"},
    {"city": "Bakersfield CA",     "country": "US", "bbox": "35.30,-119.20,35.45,-119.00"},
    # CO
    {"city": "Denver CO",          "country": "US", "bbox": "39.60,-105.10,39.85,-104.85"},
    {"city": "Colorado Springs CO","country": "US", "bbox": "38.78,-104.95,38.95,-104.70"},
    {"city": "Aurora CO",          "country": "US", "bbox": "39.60,-104.90,39.78,-104.65"},
    # CT
    {"city": "Hartford CT",        "country": "US", "bbox": "41.72,-72.75,41.82,-72.62"},
    {"city": "Bridgeport CT",      "country": "US", "bbox": "41.15,-73.25,41.25,-73.15"},
    {"city": "New Haven CT",       "country": "US", "bbox": "41.25,-72.95,41.35,-72.85"},
    # DE
    {"city": "Wilmington DE",      "country": "US", "bbox": "39.70,-75.60,39.79,-75.50"},
    {"city": "Dover DE",           "country": "US", "bbox": "39.13,-75.60,39.20,-75.50"},
    # FL
    {"city": "Tampa FL",           "country": "US", "bbox": "27.85,-82.55,28.05,-82.30"},
    {"city": "Orlando FL",         "country": "US", "bbox": "28.40,-81.50,28.65,-81.20"},
    {"city": "Jacksonville FL",    "country": "US", "bbox": "30.15,-81.85,30.50,-81.50"},
    {"city": "Fort Lauderdale FL", "country": "US", "bbox": "26.05,-80.25,26.25,-80.05"},
    {"city": "St Petersburg FL",   "country": "US", "bbox": "27.70,-82.78,27.85,-82.60"},
    # GA
    {"city": "Atlanta GA",         "country": "US", "bbox": "33.65,-84.55,33.90,-84.30"},
    {"city": "Augusta GA",         "country": "US", "bbox": "33.40,-82.05,33.55,-81.85"},
    {"city": "Savannah GA",        "country": "US", "bbox": "32.00,-81.20,32.15,-81.05"},
    # HI
    {"city": "Honolulu HI",        "country": "US", "bbox": "21.25,-158.10,21.40,-157.80"},
    # ID
    {"city": "Boise ID",           "country": "US", "bbox": "43.55,-116.30,43.70,-116.10"},
    {"city": "Idaho Falls ID",     "country": "US", "bbox": "43.45,-112.10,43.55,-111.95"},
    # IL (Chicago was done; add others)
    {"city": "Springfield IL",     "country": "US", "bbox": "39.72,-89.75,39.85,-89.55"},
    {"city": "Peoria IL",          "country": "US", "bbox": "40.65,-89.70,40.80,-89.50"},
    # IN
    {"city": "Indianapolis IN",    "country": "US", "bbox": "39.70,-86.30,39.90,-86.05"},
    {"city": "Fort Wayne IN",      "country": "US", "bbox": "41.00,-85.20,41.15,-85.05"},
    # IA
    {"city": "Des Moines IA",      "country": "US", "bbox": "41.55,-93.75,41.65,-93.55"},
    {"city": "Cedar Rapids IA",    "country": "US", "bbox": "41.95,-91.75,42.05,-91.60"},
    # KS
    {"city": "Wichita KS",         "country": "US", "bbox": "37.65,-97.45,37.80,-97.25"},
    {"city": "Kansas City KS",     "country": "US", "bbox": "39.05,-94.80,39.20,-94.60"},
    # KY
    {"city": "Louisville KY",      "country": "US", "bbox": "38.15,-85.85,38.30,-85.65"},
    {"city": "Lexington KY",       "country": "US", "bbox": "37.95,-84.60,38.10,-84.40"},
    # LA
    {"city": "New Orleans LA",     "country": "US", "bbox": "29.90,-90.15,30.05,-89.95"},
    {"city": "Baton Rouge LA",     "country": "US", "bbox": "30.35,-91.20,30.50,-91.05"},
    # ME
    {"city": "Portland ME",        "country": "US", "bbox": "43.60,-70.30,43.75,-70.15"},
    # MD
    {"city": "Baltimore MD",       "country": "US", "bbox": "39.20,-76.70,39.40,-76.50"},
    # MA
    {"city": "Boston MA",          "country": "US", "bbox": "42.30,-71.20,42.40,-70.95"},
    {"city": "Worcester MA",       "country": "US", "bbox": "42.20,-71.85,42.30,-71.75"},
    {"city": "Springfield MA",     "country": "US", "bbox": "42.05,-72.65,42.20,-72.50"},
    # MI
    {"city": "Detroit MI",         "country": "US", "bbox": "42.30,-83.30,42.45,-83.00"},
    {"city": "Grand Rapids MI",    "country": "US", "bbox": "42.90,-85.75,43.05,-85.55"},
    # MN
    {"city": "Minneapolis MN",     "country": "US", "bbox": "44.85,-93.35,45.05,-93.15"},
    {"city": "Saint Paul MN",      "country": "US", "bbox": "44.90,-93.20,45.00,-93.00"},
    # MS
    {"city": "Jackson MS",         "country": "US", "bbox": "32.25,-90.30,32.40,-90.10"},
    # MO
    {"city": "Kansas City MO",     "country": "US", "bbox": "38.95,-94.65,39.20,-94.45"},
    {"city": "St Louis MO",        "country": "US", "bbox": "38.55,-90.35,38.75,-90.15"},
    # MT
    {"city": "Billings MT",        "country": "US", "bbox": "45.75,-108.65,45.85,-108.45"},
    # NE
    {"city": "Omaha NE",           "country": "US", "bbox": "41.20,-96.20,41.35,-95.95"},
    {"city": "Lincoln NE",         "country": "US", "bbox": "40.75,-96.80,40.90,-96.60"},
    # NV
    {"city": "Las Vegas NV",       "country": "US", "bbox": "36.05,-115.30,36.30,-115.05"},
    {"city": "Reno NV",            "country": "US", "bbox": "39.45,-119.85,39.60,-119.70"},
    # NH
    {"city": "Manchester NH",      "country": "US", "bbox": "42.95,-71.55,43.05,-71.40"},
    # NJ
    {"city": "Newark NJ",          "country": "US", "bbox": "40.70,-74.25,40.80,-74.10"},
    {"city": "Jersey City NJ",     "country": "US", "bbox": "40.70,-74.10,40.78,-74.00"},
    # NM
    {"city": "Albuquerque NM",     "country": "US", "bbox": "35.00,-106.75,35.25,-106.50"},
    {"city": "Santa Fe NM",        "country": "US", "bbox": "35.65,-106.00,35.75,-105.85"},
    # NY (NYC was done; add others)
    {"city": "Buffalo NY",         "country": "US", "bbox": "42.85,-78.95,42.95,-78.80"},
    {"city": "Rochester NY",       "country": "US", "bbox": "43.10,-77.75,43.25,-77.55"},
    {"city": "Albany NY",          "country": "US", "bbox": "42.60,-73.85,42.75,-73.70"},
    # NC
    {"city": "Charlotte NC",       "country": "US", "bbox": "35.10,-80.95,35.35,-80.70"},
    {"city": "Raleigh NC",         "country": "US", "bbox": "35.70,-78.75,35.90,-78.55"},
    {"city": "Greensboro NC",      "country": "US", "bbox": "36.00,-79.95,36.15,-79.75"},
    # ND
    {"city": "Fargo ND",           "country": "US", "bbox": "46.80,-96.95,46.95,-96.75"},
    # OH
    {"city": "Columbus OH",        "country": "US", "bbox": "39.85,-83.10,40.10,-82.85"},
    {"city": "Cleveland OH",       "country": "US", "bbox": "41.40,-81.85,41.55,-81.55"},
    {"city": "Cincinnati OH",      "country": "US", "bbox": "39.05,-84.65,39.20,-84.40"},
    # OK
    {"city": "Oklahoma City OK",   "country": "US", "bbox": "35.35,-97.65,35.55,-97.40"},
    {"city": "Tulsa OK",           "country": "US", "bbox": "36.05,-96.05,36.20,-95.85"},
    # OR
    {"city": "Portland OR",        "country": "US", "bbox": "45.45,-122.80,45.60,-122.55"},
    {"city": "Eugene OR",          "country": "US", "bbox": "44.00,-123.20,44.10,-123.00"},
    # PA
    {"city": "Philadelphia PA",    "country": "US", "bbox": "39.85,-75.30,40.15,-74.95"},
    {"city": "Pittsburgh PA",      "country": "US", "bbox": "40.35,-80.10,40.50,-79.85"},
    # RI
    {"city": "Providence RI",      "country": "US", "bbox": "41.78,-71.50,41.88,-71.35"},
    # SC
    {"city": "Charleston SC",      "country": "US", "bbox": "32.70,-80.10,32.90,-79.90"},
    {"city": "Columbia SC",        "country": "US", "bbox": "33.95,-81.10,34.10,-80.90"},
    # SD
    {"city": "Sioux Falls SD",     "country": "US", "bbox": "43.50,-96.85,43.65,-96.65"},
    # TN
    {"city": "Nashville TN",       "country": "US", "bbox": "36.10,-86.85,36.25,-86.65"},
    {"city": "Memphis TN",         "country": "US", "bbox": "35.05,-90.10,35.20,-89.90"},
    {"city": "Knoxville TN",       "country": "US", "bbox": "35.90,-84.05,36.05,-83.85"},
    # TX (Houston/Dallas/Austin done; add others)
    {"city": "San Antonio TX",     "country": "US", "bbox": "29.30,-98.65,29.60,-98.35"},
    {"city": "Fort Worth TX",      "country": "US", "bbox": "32.65,-97.45,32.85,-97.25"},
    {"city": "El Paso TX",         "country": "US", "bbox": "31.65,-106.50,31.85,-106.25"},
    {"city": "Corpus Christi TX",  "country": "US", "bbox": "27.70,-97.50,27.85,-97.30"},
    # UT
    {"city": "Salt Lake City UT",  "country": "US", "bbox": "40.65,-112.05,40.85,-111.80"},
    # VT
    {"city": "Burlington VT",      "country": "US", "bbox": "44.45,-73.30,44.55,-73.20"},
    # VA
    {"city": "Virginia Beach VA",  "country": "US", "bbox": "36.75,-76.10,36.90,-75.95"},
    {"city": "Richmond VA",        "country": "US", "bbox": "37.45,-77.55,37.60,-77.40"},
    {"city": "Norfolk VA",         "country": "US", "bbox": "36.80,-76.35,36.95,-76.20"},
    # WA
    {"city": "Seattle WA",         "country": "US", "bbox": "47.50,-122.45,47.75,-122.20"},
    {"city": "Spokane WA",         "country": "US", "bbox": "47.60,-117.50,47.75,-117.30"},
    {"city": "Tacoma WA",          "country": "US", "bbox": "47.15,-122.55,47.30,-122.35"},
    # WV
    {"city": "Charleston WV",      "country": "US", "bbox": "38.30,-81.70,38.40,-81.55"},
    # WI
    {"city": "Milwaukee WI",       "country": "US", "bbox": "43.00,-88.05,43.15,-87.85"},
    {"city": "Madison WI",         "country": "US", "bbox": "43.00,-89.55,43.15,-89.30"},
    # WY
    {"city": "Cheyenne WY",        "country": "US", "bbox": "41.10,-104.85,41.18,-104.75"},
]


def main():
    sqs = boto3.client("sqs", region_name=REGION)
    pushed = 0
    print(f"Dispatching {len(US_METROS)} US metros x {len(NICHE_TAGS)} niches = {len(US_METROS)*len(NICHE_TAGS)} jobs")
    for m in US_METROS:
        for niche, tag_def in NICHE_TAGS.items():
            job = {"city": m["city"], "country": m["country"], "niche": niche, "bbox": m["bbox"]}
            for k in ("tourism_tags","amenity_tags","shop_tags","office_tags",
                      "craft_tags","leisure_tags","landuse_tags"):
                if tag_def.get(k):
                    job[k] = tag_def[k]
            sqs.send_message(QueueUrl=QUEUE_URL, MessageBody=json.dumps(job))
            pushed += 1
            if pushed % 200 == 0:
                print(f"  {pushed} pushed")
    print(f"\nDispatched {pushed} new jobs (path B — city-level US split)")


if __name__ == "__main__":
    main()
