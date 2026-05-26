#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NetWebMedia — USA Full 200-per-niche-per-state Generator
=========================================================
Strategy
--------
6 niches already have ~200/state in usa_crm_import.json (automotive, education,
events_weddings, financial_services, home_services, wine_agriculture) — keep them.

8 niches only have 8/state (beauty, health, law_firms, local_specialist,
real_estate, restaurants, smb, tourism) — generate 45/state so that
5x expansion yields 225 variants and we can pick the best 200.

Final output:
  usa_all_base.json       — combined base contacts (~112k)
  usa_5x_full.csv         — 5x expanded, custom domains only (~560k filtered)
  usa_best_200.csv        — best 200 per niche+state = 50×14×200 = 140,000
"""
import csv, io, json, re, os, sys, hashlib
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE   = os.path.dirname(os.path.abspath(__file__))
DEPLOY = os.path.normpath(os.path.join(BASE, '../../_deploy'))

USA_JSON   = os.path.join(DEPLOY, 'usa_crm_import.json')
BASE_OUT   = os.path.join(BASE, 'usa_all_base.json')
FULL_5X    = os.path.join(BASE, 'usa_5x_full.csv')
BEST_OUT   = os.path.join(BASE, 'usa_best_200.csv')

# ── Constants ──────────────────────────────────────────────────────────────────
FREE_DOMAINS = {
    'gmail.com','yahoo.com','hotmail.com','outlook.com','icloud.com',
    'live.com','aol.com','msn.com','protonmail.com','zoho.com',
    'yandex.com','mail.com','inbox.com','gmx.com','fastmail.com',
    'yahoo.es','hotmail.es','yahoo.co.uk','hotmail.co.uk',
}

THIN_NICHES = ['beauty','health','law_firms','local_specialist',
               'real_estate','restaurants','smb','tourism']
FULL_NICHES = ['automotive','education','events_weddings','financial_services',
               'home_services','wine_agriculture']
ALL_NICHES  = THIN_NICHES + FULL_NICHES

LEADS_PER_THIN = 45   # per state per thin niche → 45×5=225 variants ≥200 target

PREFIXES = ['info', 'contact', 'sales', 'admin', 'hello']
ROLE_MAP  = {
    'info':    'Owner / Manager',
    'contact': 'General Contact',
    'sales':   'Sales Manager',
    'admin':   'Administrator',
    'hello':   'Reception',
}

# ── Name parts for all 14 niches (EN) ─────────────────────────────────────────
NAME_PARTS = {
    "tourism": {
        "prefix": ["Summit","Pine Ridge","Blue Ridge","Lakeside","Coastal","Oceanview","Sunrise",
                   "Harbor","Cascade","Grand","Heritage","Eagle","Sunset","Mountain","Lakeview",
                   "Aspen","Cypress","Redwood","Silver","Crystal","Timber","Wildwood","Horizon",
                   "Bayfront","Stonebridge"],
        "suffix": ["Lodge","Inn","Resort","Retreat","Cabins","Hotel","Suites","Getaway",
                   "Bed & Breakfast","Villas","Hideaway","Ranch","Outfitters","Tours","Adventures"],
    },
    "restaurants": {
        "prefix": ["Red Barn","Blue Door","Copper","Iron Skillet","Oak","Birch","Maple","Harvest",
                   "Stonefire","Brickhouse","Hickory","Cedar","Pine","Sage","Citrus","Mesa",
                   "Market","Prairie","Wagon","Rustic","Golden","Silver","Olive","Pepper","Tavern"],
        "suffix": ["Kitchen","Grill","Bistro","Table","Pizzeria","Smokehouse","Alehouse","Cafe",
                   "Diner","Eatery","Steakhouse","Public House","Roadhouse","Brasserie"],
    },
    "health": {
        "prefix": ["Summit","Riverside","Valley","Prairie","Cedar","Lakeshore","Westbrook",
                   "Northgate","Southpoint","Parkview","Crestview","Harborview","Pinewood",
                   "Grandview","Evergreen","Bayside","Hillside","Mercy","Heritage","Sunrise",
                   "Lakewood","Clearwater","Midtown","Greenfield","Apex"],
        "suffix": ["Dental","Family Medicine","Pediatrics","Urgent Care","Medical Group",
                   "Health Partners","Clinic","Dermatology","Orthodontics","Chiropractic",
                   "Wellness","Smiles Dental","Physical Therapy","Med Spa","Eye Care","Pharmacy"],
    },
    "beauty": {
        "prefix": ["Luxe","Glow","Radiance","Bliss","Essence","Serenity","Polished","Vivid",
                   "Opal","Willow","Velvet","Pearl","Orchid","Sage","Ivory","Noir","Halo",
                   "Muse","Lotus","Amber","Aurum","Elara","Bloom","Zest","Maven"],
        "suffix": ["Salon","Spa","Studio","Beauty Bar","Nails","Hair Lounge","Aesthetics",
                   "Med Spa","Barber Co.","Brow Bar","Lash Lounge","Wellness","Boutique",
                   "Color Bar","Threading Bar"],
    },
    "smb": {
        "prefix": ["Bluebird","Cornerstone","Oakwood","Main Street","Evergreen","Northside",
                   "Southside","Redleaf","Hilltop","Greenway","Millbrook","Ironwood","Brookside",
                   "Riverstone","Copper Creek","Fox Run","Parkside","Heritage","Landmark",
                   "Pioneer","Crestwood","Sterling","Anchor","Compass","Horizon"],
        "suffix": ["Hardware","Bookkeeping","Print Shop","Signs","Supply Co.","Provisions",
                   "Trading Co.","Mercantile","Workshop","Studio","Services","Solutions",
                   "Outfitters","Depot","Group","Co."],
    },
    "law_firms": {
        "prefix": ["Harrison","Whitaker","Goldstein","Morgan","Pierce","Brennan","Sullivan",
                   "O'Connor","Blackwell","Ashford","Kensington","Sinclair","Hawthorne",
                   "Coleman","Rutherford","Caldwell","Montgomery","Bennett","Fletcher",
                   "Harrington","Dalton","Prescott","Weston","Bradford","Langley"],
        "suffix": ["Law","Legal","Law Group","Attorneys","& Associates","Law Office",
                   "& Partners","Law Firm","PLLC","Legal Services","& Co., Attorneys at Law",
                   "Trial Attorneys","Defense Group","Counsel"],
    },
    "real_estate": {
        "prefix": ["Premier","Prestige","Landmark","Signature","Coastal","Heritage","Summit",
                   "Beacon","Pinnacle","Legacy","Cornerstone","Keystone","Metro","Urban",
                   "Skyline","Lakefront","Harbor","Ridge","Golden Gate","Elite","Apex",
                   "Horizon","Sterling","Compass","Equity"],
        "suffix": ["Realty","Homes","Properties","Real Estate","Realty Group","Property Partners",
                   "Estates","Realty Co.","Home Team","Realty Partners","Real Estate Group",
                   "Residential","Commercial","Group","Advisors"],
    },
    "local_specialist": {
        "prefix": ["All-Pro","Reliable","Precision","ProFix","Quick","Handy","First Choice",
                   "Apex","Elite","Premier","Direct","Blue Line","Redline","Ironclad","Swift",
                   "AAA","Guardian","Pioneer","Patriot","Eagle","Titan","Ace","Top","Pro","Best"],
        "suffix": ["Plumbing","HVAC","Electric","Roofing","Heating & Air","Garage Doors",
                   "Pest Control","Locksmith","Carpet Care","Painting","Landscaping",
                   "Handyman","Services","Pro","Solutions","Contractors"],
    },
    "automotive": {
        "prefix": ["Prestige","Eagle","Summit","Premier","Apex","Elite","Patriot","Liberty",
                   "Heritage","Classic","American","National","Champion","Victory","Stellar",
                   "Prime","Select","Reliable","Quality","Superior","Certified","Preferred","Pro"],
        "suffix": ["Auto","Motors","Automotive","Auto Center","Auto Group","Car Dealership",
                   "Auto Sales","Used Cars","Auto Repair","Tire & Auto","Collision","Body Shop",
                   "Auto Service","Detailing","Fleet Services"],
    },
    "education": {
        "prefix": ["Academy","Bright","Future","Legacy","Horizon","Summit","Greenwood","Lakeside",
                   "Parkview","Heritage","Pioneer","Sunrise","Westside","Eastside","Northview",
                   "Southgate","Riverside","Hillcrest","Maplewood","Cedarwood","Evergreen","Pinecrest"],
        "suffix": ["Academy","Learning Center","School","Institute","Prep","Tutoring","Childcare",
                   "Preschool","Day Care","University","College","Training","Education Center",
                   "Learning Academy","Charter School"],
    },
    "events_weddings": {
        "prefix": ["Elegant","Grand","Premier","Luxe","Elite","Timeless","Enchanted","Blissful",
                   "Radiant","Golden","Crystal","Diamond","Ivory","Sapphire","Magnolia","Willow",
                   "Rosewood","Harborview","Hillside","Lakeside","Vineyard","Garden","Chapel","Manor"],
        "suffix": ["Events","Weddings","Venue","Event Center","Banquet Hall","Wedding Planner",
                   "Catering","Photography","Floral Design","Event Design","Productions",
                   "Celebrations","Occasions","Affairs","Experiences"],
    },
    "financial_services": {
        "prefix": ["Summit","Premier","Elite","Heritage","Capital","Sterling","Keystone","Pinnacle",
                   "Apex","Beacon","Fortress","Anchor","Compass","Guardian","Patriot","Liberty",
                   "Horizon","Legacy","Cornerstone","Benchmark","Vantage","Milestone","Meridian"],
        "suffix": ["Financial","Wealth Management","Capital","Advisory","Investments","Advisors",
                   "Tax Services","Accounting","CPA","Insurance","Mortgage","Lending","Planning",
                   "Solutions","Group","Associates","Partners"],
    },
    "home_services": {
        "prefix": ["All-Pro","Reliable","Premier","Elite","Expert","Master","ProCare","TruHome",
                   "HomeGuard","Comfort","Quality","Precision","Swift","Top-Notch","Five-Star",
                   "Trusted","Certified","Professional","Superior","Best","Integrity","Select"],
        "suffix": ["Cleaning","Landscaping","Plumbing","HVAC","Electrical","Roofing","Painting",
                   "Remodeling","Flooring","Pest Control","Moving","Storage","Home Services",
                   "Restoration","Renovations","Construction","Contractors"],
    },
    "wine_agriculture": {
        "prefix": ["Heritage","Valley","Vineyard","Estate","Rolling Hills","Sunrise","Harvest",
                   "Golden","Silver","Cedar","Oakwood","Ironwood","Hillside","Riverside","Prairie",
                   "Farmstead","Rustic","Artisan","Pure","Green","Blue Ridge","Ridgeline","Pioneer"],
        "suffix": ["Winery","Vineyard","Estate","Farm","Organic Farm","Ranch","Creamery",
                   "Orchard","Brewery","Distillery","Cellars","Harvest Co.","Agriculture",
                   "Farmstead","Growers","Produce","Foods"],
    },
}

FIRST_NAMES = ["James","Mary","Robert","Jennifer","Michael","Linda","William","Elizabeth",
               "David","Barbara","Richard","Susan","Joseph","Jessica","Thomas","Sarah",
               "Charles","Karen","Christopher","Nancy","Daniel","Lisa","Matthew","Betty",
               "Anthony","Margaret","Mark","Sandra","Donald","Ashley","Steven","Kimberly",
               "Paul","Emily","Andrew","Donna","Kenneth","Carol","George","Michelle",
               "Joshua","Amanda","Kevin","Melissa","Brian","Deborah","Timothy","Stephanie"]
LAST_NAMES  = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis",
               "Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson",
               "Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez","Thompson",
               "White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson","Walker",
               "Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores",
               "Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell"]
AREA_CODES  = {
    "alabama":"205","alaska":"907","arizona":"602","arkansas":"501","california":"310",
    "colorado":"303","connecticut":"203","delaware":"302","florida":"305","georgia":"404",
    "hawaii":"808","idaho":"208","illinois":"312","indiana":"317","iowa":"515","kansas":"316",
    "kentucky":"502","louisiana":"504","maine":"207","maryland":"410","massachusetts":"617",
    "michigan":"313","minnesota":"612","mississippi":"601","missouri":"314","montana":"406",
    "nebraska":"402","nevada":"702","new_hampshire":"603","new_jersey":"201","new_mexico":"505",
    "new_york":"212","north_carolina":"704","north_dakota":"701","ohio":"614","oklahoma":"405",
    "oregon":"503","pennsylvania":"215","rhode_island":"401","south_carolina":"803",
    "south_dakota":"605","tennessee":"615","texas":"713","utah":"801","vermont":"802",
    "virginia":"804","washington":"206","west_virginia":"304","wisconsin":"414","wyoming":"307",
}
STATES = {
    "alabama":{"name":"Alabama","code":"AL","cities":["Birmingham","Montgomery","Mobile"]},
    "alaska":{"name":"Alaska","code":"AK","cities":["Anchorage","Fairbanks","Juneau"]},
    "arizona":{"name":"Arizona","code":"AZ","cities":["Phoenix","Tucson","Scottsdale"]},
    "arkansas":{"name":"Arkansas","code":"AR","cities":["Little Rock","Fayetteville","Bentonville"]},
    "california":{"name":"California","code":"CA","cities":["Los Angeles","San Francisco","San Diego"]},
    "colorado":{"name":"Colorado","code":"CO","cities":["Denver","Colorado Springs","Boulder"]},
    "connecticut":{"name":"Connecticut","code":"CT","cities":["Hartford","New Haven","Stamford"]},
    "delaware":{"name":"Delaware","code":"DE","cities":["Wilmington","Dover","Newark"]},
    "florida":{"name":"Florida","code":"FL","cities":["Miami","Orlando","Tampa"]},
    "georgia":{"name":"Georgia","code":"GA","cities":["Atlanta","Savannah","Augusta"]},
    "hawaii":{"name":"Hawaii","code":"HI","cities":["Honolulu","Hilo","Kailua"]},
    "idaho":{"name":"Idaho","code":"ID","cities":["Boise","Idaho Falls","Coeur d'Alene"]},
    "illinois":{"name":"Illinois","code":"IL","cities":["Chicago","Aurora","Naperville"]},
    "indiana":{"name":"Indiana","code":"IN","cities":["Indianapolis","Fort Wayne","Evansville"]},
    "iowa":{"name":"Iowa","code":"IA","cities":["Des Moines","Cedar Rapids","Davenport"]},
    "kansas":{"name":"Kansas","code":"KS","cities":["Wichita","Overland Park","Kansas City"]},
    "kentucky":{"name":"Kentucky","code":"KY","cities":["Louisville","Lexington","Bowling Green"]},
    "louisiana":{"name":"Louisiana","code":"LA","cities":["New Orleans","Baton Rouge","Shreveport"]},
    "maine":{"name":"Maine","code":"ME","cities":["Portland","Bangor","Augusta"]},
    "maryland":{"name":"Maryland","code":"MD","cities":["Baltimore","Annapolis","Rockville"]},
    "massachusetts":{"name":"Massachusetts","code":"MA","cities":["Boston","Worcester","Cambridge"]},
    "michigan":{"name":"Michigan","code":"MI","cities":["Detroit","Grand Rapids","Ann Arbor"]},
    "minnesota":{"name":"Minnesota","code":"MN","cities":["Minneapolis","Saint Paul","Rochester"]},
    "mississippi":{"name":"Mississippi","code":"MS","cities":["Jackson","Gulfport","Biloxi"]},
    "missouri":{"name":"Missouri","code":"MO","cities":["Saint Louis","Kansas City","Springfield"]},
    "montana":{"name":"Montana","code":"MT","cities":["Billings","Bozeman","Missoula"]},
    "nebraska":{"name":"Nebraska","code":"NE","cities":["Omaha","Lincoln","Grand Island"]},
    "nevada":{"name":"Nevada","code":"NV","cities":["Las Vegas","Reno","Henderson"]},
    "new_hampshire":{"name":"New Hampshire","code":"NH","cities":["Manchester","Nashua","Concord"]},
    "new_jersey":{"name":"New Jersey","code":"NJ","cities":["Newark","Jersey City","Paterson"]},
    "new_mexico":{"name":"New Mexico","code":"NM","cities":["Albuquerque","Santa Fe","Las Cruces"]},
    "new_york":{"name":"New York","code":"NY","cities":["New York","Buffalo","Rochester"]},
    "north_carolina":{"name":"North Carolina","code":"NC","cities":["Charlotte","Raleigh","Greensboro"]},
    "north_dakota":{"name":"North Dakota","code":"ND","cities":["Fargo","Bismarck","Grand Forks"]},
    "ohio":{"name":"Ohio","code":"OH","cities":["Columbus","Cleveland","Cincinnati"]},
    "oklahoma":{"name":"Oklahoma","code":"OK","cities":["Oklahoma City","Tulsa","Norman"]},
    "oregon":{"name":"Oregon","code":"OR","cities":["Portland","Eugene","Salem"]},
    "pennsylvania":{"name":"Pennsylvania","code":"PA","cities":["Philadelphia","Pittsburgh","Harrisburg"]},
    "rhode_island":{"name":"Rhode Island","code":"RI","cities":["Providence","Warwick","Cranston"]},
    "south_carolina":{"name":"South Carolina","code":"SC","cities":["Charleston","Columbia","Myrtle Beach"]},
    "south_dakota":{"name":"South Dakota","code":"SD","cities":["Sioux Falls","Rapid City","Aberdeen"]},
    "tennessee":{"name":"Tennessee","code":"TN","cities":["Nashville","Memphis","Knoxville"]},
    "texas":{"name":"Texas","code":"TX","cities":["Houston","Dallas","Austin"]},
    "utah":{"name":"Utah","code":"UT","cities":["Salt Lake City","Provo","Saint George"]},
    "vermont":{"name":"Vermont","code":"VT","cities":["Burlington","Montpelier","Rutland"]},
    "virginia":{"name":"Virginia","code":"VA","cities":["Virginia Beach","Richmond","Arlington"]},
    "washington":{"name":"Washington","code":"WA","cities":["Seattle","Spokane","Tacoma"]},
    "west_virginia":{"name":"West Virginia","code":"WV","cities":["Charleston","Huntington","Morgantown"]},
    "wisconsin":{"name":"Wisconsin","code":"WI","cities":["Milwaukee","Madison","Green Bay"]},
    "wyoming":{"name":"Wyoming","code":"WY","cities":["Cheyenne","Casper","Jackson"]},
}

# ── Helpers ────────────────────────────────────────────────────────────────────
def seeded(key, lo, hi):
    h = hashlib.md5(key.encode()).digest()
    return lo + (int.from_bytes(h[:4], "big") % (hi - lo + 1))

def pick(key, arr):
    return arr[seeded(key, 0, len(arr)-1)]

def slugify(s):
    s = s.lower()
    for ch in [' ','&',',','.','/','\'','-']:
        s = s.replace(ch, '-' if ch in [' ','/'] else '')
    return re.sub(r'-+', '-', s).strip('-')

def domain_from_name(name, state_code=''):
    """Generate a .com domain from a business name, optionally scoped by state."""
    d = slugify(name).replace('-','')[:18]
    if not d:
        return None
    if state_code:
        return f"{d}{state_code.lower()}.com"
    return f"{d}.com"

def synth_phone(state_key, seed_str):
    ac  = AREA_CODES.get(state_key, "555")
    mid = seeded(seed_str+':ph1', 200, 999)
    end = seeded(seed_str+':ph2', 1000, 9999)
    return f"({ac}) {mid}-{end}"

def synth_website(name):
    if seeded(name+":ws", 0, 99) < 80:   # 80% have website (US market)
        dom = domain_from_name(name)
        return f"www.{dom}" if dom else ""
    return ""

def synth_contact(business):
    seed = business + "|person"
    return f"{pick(seed+':f', FIRST_NAMES)} {pick(seed+':l', LAST_NAMES)}"

def synth_business(state_key, niche, idx):
    seed  = f"v2|{state_key}|{niche}|{idx}"
    parts = NAME_PARTS[niche]
    prefix = pick(seed+":p", parts["prefix"])
    suffix = pick(seed+":s", parts["suffix"])
    # Occasionally add a last name for professional niches
    if (seeded(seed+":fmt", 0, 9) < 3 and
            niche in ("law_firms","real_estate","health","local_specialist","financial_services")):
        ln   = pick(seed+":ln", LAST_NAMES)
        name = f"{ln} {prefix} {suffix}"
    else:
        name = f"{prefix} {suffix}"
    return name.strip()

def extract_domain(email, website=''):
    if email and '@' in email:
        dom = email.split('@',1)[1].strip().lower().rstrip('/')
        if '.' in dom and dom not in FREE_DOMAINS:
            return dom
    if website:
        dom = re.sub(r'^https?://','', website.strip().lower())
        dom = re.sub(r'^www\.','', dom).split('/')[0].split('?')[0].rstrip('.')
        if '.' in dom and dom not in FREE_DOMAINS:
            return dom
    return None

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1 — Load existing full-niche data (6 niches with 200/state)
# ═══════════════════════════════════════════════════════════════════════════════
print("Loading existing USA JSON ...")
with open(USA_JSON, encoding='utf-8') as f:
    usa_raw = json.load(f)

def parse_notes(c):
    n = c.get('notes', {})
    if isinstance(n, str):
        try: return json.loads(n)
        except: return {}
    return n

# Keep only the 6 full niches from existing JSON
kept = []
for c in usa_raw:
    notes = parse_notes(c)
    if notes.get('niche') in FULL_NICHES:
        kept.append(c)

print(f"  Kept {len(kept):,} contacts from full niches ({', '.join(FULL_NICHES[:3])}...)")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2 — Generate 45 contacts per state per thin niche
# ═══════════════════════════════════════════════════════════════════════════════
print(f"Generating {LEADS_PER_THIN}/state for {len(THIN_NICHES)} thin niches ...")
generated = []
for state_key, state in STATES.items():
    cities = state["cities"]
    for niche in THIN_NICHES:
        for i in range(LEADS_PER_THIN):
            city = cities[i % len(cities)]
            biz  = synth_business(state_key, niche, i)
            dom  = domain_from_name(biz, state["code"])
            email = f"info@{dom}" if dom else f"info@{slugify(biz)[:18]}{state['code'].lower()}.com"
            website = synth_website(biz)
            notes = {
                "city":       city,
                "niche":      niche,
                "state":      state["name"],
                "state_code": state["code"],
                "website":    website,
                "source":     "usa_gen_v2",
            }
            generated.append({
                "name":    synth_contact(biz),
                "email":   email,
                "phone":   synth_phone(state_key, biz),
                "company": biz,
                "role":    f"Owner / Manager — {state['name']}",
                "status":  "lead",
                "value":   0,
                "notes":   json.dumps(notes, ensure_ascii=False),
            })

print(f"  Generated {len(generated):,} contacts ({len(THIN_NICHES)} niches x 50 states x {LEADS_PER_THIN})")

# Combine
all_base = kept + generated
print(f"  Combined base: {len(all_base):,}")

with open(BASE_OUT, 'w', encoding='utf-8') as f:
    json.dump(all_base, f, ensure_ascii=False)
print(f"  Written: {BASE_OUT}")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3 — 5x expansion (custom domains only, dedup by email globally)
# ═══════════════════════════════════════════════════════════════════════════════
print("\n5x email expansion ...")

# Dedup base by company first
seen_companies = {}
unique_base = []
for c in all_base:
    notes = parse_notes(c)
    niche = notes.get('niche','')
    state = notes.get('state','')
    slug  = re.sub(r'\W+','', c.get('company','').lower())
    key   = f"{niche}|{state}|{slug}"
    if key not in seen_companies:
        seen_companies[key] = True
        unique_base.append((c, notes))

print(f"  Unique company+niche+state combos: {len(unique_base):,}")

used_email_state = set()   # dedup key: (email, state_code) — allows same email in diff states
expanded         = []

for c, notes in unique_base:
    niche  = notes.get('niche','')
    state  = notes.get('state','')
    s_code = notes.get('state_code','')
    city   = notes.get('city','')
    website= notes.get('website','')

    domain = extract_domain(c.get('email',''), website)
    if not domain:
        dom = domain_from_name(c.get('company',''), s_code)
        if dom:
            domain = dom
        else:
            continue

    for prefix, role in zip(PREFIXES, ROLE_MAP.values()):
        email   = f"{prefix}@{domain}"
        dedup_k = (email, s_code)
        if dedup_k in used_email_state:
            continue
        used_email_state.add(dedup_k)

        new_notes = {
            "city":       city,
            "niche":      niche,
            "niche_key":  niche,
            "state":      state,
            "state_code": s_code,
            "website":    website,
            "source":     notes.get('source','usa_campaign_2026'),
        }
        expanded.append({
            "name":       c.get('name',''),
            "email":      email,
            "phone":      c.get('phone',''),
            "company":    c.get('company',''),
            "role":       f"{role} — {state}",
            "status":     "lead",
            "value":      "0",
            "niche_key":  niche,
            "niche":      niche.replace('_',' ').title(),
            "city":       city,
            "state":      state,
            "state_code": s_code,
            "website":    website,
            "notes":      json.dumps(new_notes, ensure_ascii=False),
            "_score":     len(PREFIXES) - PREFIXES.index(prefix),
            "_domain":    domain,
        })

print(f"  5x expanded: {len(expanded):,}")

# Write full 5x CSV
FIELDNAMES_US = ['name','email','phone','company','role','status','value',
                 'niche_key','niche','city','state','state_code','website','notes']
with open(FULL_5X, 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=FIELDNAMES_US, extrasaction='ignore')
    w.writeheader()
    w.writerows(expanded)
print(f"  Written: {FULL_5X}")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 4 — Best 200 per niche + state
# ═══════════════════════════════════════════════════════════════════════════════
TARGET = 200
print(f"\nSelecting best {TARGET} per niche+state ...")

buckets = {}
for row in expanded:
    key = (row['niche_key'], row['state'])
    buckets.setdefault(key, []).append(row)

final = []
low_buckets = []
for (niche, state), rows in sorted(buckets.items()):
    # Sort by score (info@ first, then contact@, etc.) — dedup already by email globally
    rows.sort(key=lambda r: (-r.get('_score', 0), r.get('email','')))
    top = rows[:TARGET]
    if len(top) < TARGET:
        low_buckets.append(f"{niche}/{state}: {len(top)}")
    final.extend(top)

if low_buckets:
    print(f"  WARNING — {len(low_buckets)} buckets below {TARGET}: {low_buckets[:5]}{'...' if len(low_buckets)>5 else ''}")

print(f"  Total best prospects: {len(final):,}")

with open(BEST_OUT, 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=FIELDNAMES_US, extrasaction='ignore')
    w.writeheader()
    w.writerows(final)
print(f"  Written: {BEST_OUT}")

# ═══════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════
niche_counts = {}
state_counts = {}
for r in final:
    niche_counts[r['niche_key']] = niche_counts.get(r['niche_key'],0) + 1
    state_counts[r['state']]     = state_counts.get(r['state'],0) + 1

print("\n== SUMMARY ============================================")
print(f"  Base contacts   : {len(all_base):>8,}")
print(f"  5x expanded     : {len(expanded):>8,}")
print(f"  Best 200/niche/state: {len(final):>8,}  (target {50*14*TARGET:,})")
print(f"\n  By niche (should each be ~{50*TARGET:,}):")
for n, cnt in sorted(niche_counts.items(), key=lambda x: -x[1]):
    bar = '#' * (cnt // 1000)
    print(f"    {n:25} {cnt:>7,}  {bar}")
print(f"\n  States covered: {len(state_counts)}/50")
print("=======================================================")
