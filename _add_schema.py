#!/usr/bin/env python3
"""
Batch-inject JSON-LD schema into all industry landing page index.html files.
Run from the NetWebMedia repo root:
  python _add_schema.py

Skips files that already have application/ld+json.
"""
import os
import re
import json

INDUSTRIES_DIR = os.path.join(os.path.dirname(__file__), "industries")

# Map directory path fragments to schema @type + serviceType
SCHEMA_MAP = {
    "legal":              ("LegalService",           "Legal Marketing Services"),
    "accounting":         ("AccountingService",      "Accounting Firm Marketing"),
    "consulting":         ("ProfessionalService",    "Consulting Firm Marketing"),
    "dental":             ("Dentist",                "Dental Practice Marketing"),
    "vet":                ("VeterinaryCare",         "Veterinary Practice Marketing"),
    "aesthetics":         ("HealthAndBeautyBusiness","Aesthetics Clinic Marketing"),
    "salons":             ("BeautySalon",            "Hair Salon Marketing"),
    "spas":               ("DaySpa",                 "Spa Marketing"),
    "barbershops":        ("BeautySalon",            "Barbershop Marketing"),
    "hotels":             ("LodgingBusiness",        "Hotel Marketing"),
    "boutique":           ("LodgingBusiness",        "Boutique Hotel Marketing"),
    "resorts":            ("Resort",                 "Resort Marketing"),
    "agents":             ("RealEstateAgent",        "Real Estate Agent Marketing"),
    "brokerages":         ("RealEstateAgent",        "Real Estate Brokerage Marketing"),
    "property-management":("RealEstateAgent",        "Property Management Marketing"),
    "bars":               ("BarOrPub",               "Bar Marketing"),
    "catering":           ("FoodEstablishment",      "Catering Marketing"),
    "gyms":               ("ExerciseGym",            "Gym Marketing"),
    "studios":            ("ExerciseGym",            "Fitness Studio Marketing"),
    "personal-training":  ("ExerciseGym",            "Personal Training Marketing"),
    "shopify":            ("OnlineStore",            "Shopify Store Marketing"),
    "dtc":                ("OnlineStore",            "DTC Brand Marketing"),
    "marketplace":        ("OnlineStore",            "Marketplace Marketing"),
    "contractors":        ("HomeAndConstructionBusiness","Contractor Marketing"),
    "plumbers":           ("Plumber",                "Plumber Marketing"),
    "landscaping":        ("LandscapingBusiness",    "Landscaping Marketing"),
    "saas":               ("ProfessionalService",    "SaaS Marketing"),
    "startups":           ("ProfessionalService",    "Startup Marketing"),
    "agencies":           ("ProfessionalService",    "Agency Marketing"),
    "dealerships":        ("AutomotiveBusiness",     "Car Dealership Marketing"),
    "autorepair":         ("AutoRepair",             "Auto Repair Marketing"),
    "detailing":          ("AutomotiveBusiness",     "Auto Detailing Marketing"),
    "weddingvenues":      ("EventVenue",             "Wedding Venue Marketing"),
    "eventplanners":      ("EventPlanner",           "Event Planner Marketing"),
    "corporateevents":    ("EventPlanner",           "Corporate Events Marketing"),
    "wineries":           ("Winery",                 "Winery Marketing"),
    "vineyards":          ("Winery",                 "Vineyard Marketing"),
    "agribusiness":       ("LocalBusiness",          "Agribusiness Marketing"),
    "photography":        ("LocalBusiness",          "Photography Marketing"),
    "coaching":           ("ProfessionalService",    "Coaching Business Marketing"),
    "trades":             ("HomeAndConstructionBusiness","Trades Marketing"),
    "advisors":           ("FinancialService",       "Financial Advisor Marketing"),
    "insurance":          ("FinancialService",       "Insurance Agency Marketing"),
    "tutoring":           ("EducationalOrganization","Tutoring Marketing"),
    "vocational":         ("EducationalOrganization","Vocational School Marketing"),
    "onlinecourses":      ("EducationalOrganization","Online Course Marketing"),
    "retail":             ("Store",                  "Retail Store Marketing"),
    "services":           ("LocalBusiness",          "Local Services Marketing"),
    "localbrands":        ("LocalBusiness",          "Local Brand Marketing"),
    # Parent categories
    "hospitality":        ("LodgingBusiness",        "Hospitality Marketing"),
    "healthcare":         ("MedicalClinic",          "Healthcare Marketing"),
    "beauty":             ("BeautySalon",            "Beauty & Wellness Marketing"),
    "professional-services": ("ProfessionalService", "Professional Services Marketing"),
    "real-estate":        ("RealEstateAgent",        "Real Estate Marketing"),
    "restaurants":        ("Restaurant",             "Restaurant Marketing"),
    "fitness":            ("ExerciseGym",            "Fitness Marketing"),
    "ecommerce":          ("OnlineStore",            "E-Commerce Marketing"),
    "home-services":      ("HomeAndConstructionBusiness","Home Services Marketing"),
    "tech-saas":          ("ProfessionalService",    "Tech & SaaS Marketing"),
    "automotive":         ("AutomotiveBusiness",     "Automotive Marketing"),
    "events-weddings":    ("EventPlanner",           "Events & Weddings Marketing"),
    "wine-agriculture":   ("LocalBusiness",          "Wine & Agriculture Marketing"),
    "local-services":     ("LocalBusiness",          "Local Services Marketing"),
    "finance":            ("FinancialService",       "Financial Services Marketing"),
    "education":          ("EducationalOrganization","Education Marketing"),
    "smb":                ("LocalBusiness",          "Small Business Marketing"),
}

def get_schema_type(path):
    """Return (schema_type, service_type) based on path fragments."""
    parts = path.replace("\\", "/").split("/")
    # Check most-specific (leaf) first, then work up
    for part in reversed(parts):
        if part in SCHEMA_MAP:
            return SCHEMA_MAP[part]
    return ("LocalBusiness", "Digital Marketing Services")

def extract_meta(html):
    """Extract title and description from HTML head."""
    title_m = re.search(r'<title[^>]*>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
    desc_m  = re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']', html, re.IGNORECASE)
    if not desc_m:
        desc_m = re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']description["\']', html, re.IGNORECASE)
    canon_m = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)["\']', html, re.IGNORECASE)
    return (
        (title_m.group(1).strip() if title_m else "NetWebMedia — AI Marketing"),
        (desc_m.group(1).strip()  if desc_m  else "AI-powered marketing services for US businesses."),
        (canon_m.group(1).strip() if canon_m else "https://netwebmedia.com/"),
    )

def build_schema(schema_type, service_type, title, description, url):
    return {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": title,
        "description": description,
        "url": url,
        "serviceType": service_type,
        "areaServed": {
            "@type": "Country",
            "name": "United States"
        },
        "provider": {
            "@type": schema_type,
            "name": "NetWebMedia",
            "url": "https://netwebmedia.com",
            "logo": "https://netwebmedia.com/assets/nwm-logo.svg",
            "telephone": "+1-415-523-8886",
            "email": "hello@netwebmedia.com",
            "areaServed": "US",
            "sameAs": [
                "https://netwebmedia.com"
            ]
        }
    }

def inject_schema(html, schema_dict):
    tag = '\n<script type="application/ld+json">\n' + json.dumps(schema_dict, indent=2, ensure_ascii=False) + '\n</script>'
    # Insert just before </head>
    return re.sub(r'(</head>)', tag + r'\n\1', html, count=1, flags=re.IGNORECASE)

def process_file(filepath):
    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        html = f.read()

    # Skip if already has JSON-LD
    if "application/ld+json" in html:
        return False

    # Get relative path from industries/ for mapping
    rel = os.path.relpath(filepath, INDUSTRIES_DIR)
    schema_type, service_type = get_schema_type(rel)
    title, description, url = extract_meta(html)

    schema = build_schema(schema_type, service_type, title, description, url)
    new_html = inject_schema(html, schema)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(new_html)
    return True

def main():
    updated = 0
    skipped = 0
    for root, dirs, files in os.walk(INDUSTRIES_DIR):
        # Skip hidden dirs
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        for fname in files:
            if fname == "index.html":
                path = os.path.join(root, fname)
                if process_file(path):
                    rel = os.path.relpath(path, INDUSTRIES_DIR)
                    print(f"  + {rel}")
                    updated += 1
                else:
                    skipped += 1
    print(f"\nDone: {updated} files updated, {skipped} skipped (already had schema).")

if __name__ == "__main__":
    main()
