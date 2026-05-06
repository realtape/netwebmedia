"""One-shot script to add industry-specific Service JSON-LD to each industry hub.

Idempotent: detects an existing block by @id and skips if present.
Run from repo root: python _deploy/_add_industry_schema.py
"""
import json, os, re, glob

SCHEMA = {
  "hospitality": {
    "audience": "Hotels, boutique hotels, resorts, vacation rentals, and lodging businesses",
    "service": "AI marketing services for the hospitality industry",
    "subdomain": "hospitality.netwebmedia.com",
    "knows": ["Direct booking optimization","OTA dependency reduction","Hotel local SEO","Booking.com alternatives","AEO for hotels","Hospitality content marketing","Boutique hotel marketing","Resort marketing"],
    "areaServed": ["United States","Chile"],
  },
  "restaurants": {
    "audience": "Restaurants, cafes, bars, and food & beverage businesses",
    "service": "AI marketing services for restaurants and food & beverage operators",
    "subdomain": "restaurants.netwebmedia.com",
    "knows": ["Restaurant local SEO","Google reviews growth","Takeout discovery via AI","Restaurant AEO citations","Menu schema markup","Restaurant Reels","Reservation automation","Cafe and bar marketing"],
    "areaServed": ["United States","Chile"],
  },
  "healthcare": {
    "audience": "Dental clinics, veterinary practices, medical aesthetics, and outpatient health businesses",
    "service": "AI marketing services for dental, veterinary, and aesthetics clinics",
    "subdomain": "healthcare.netwebmedia.com",
    "knows": ["Patient acquisition","Healthcare AEO","Dental marketing","Veterinary marketing","Medical aesthetics marketing","No-show reduction","Recall sequences","HIPAA-aware marketing"],
    "areaServed": ["United States","Chile"],
  },
  "beauty": {
    "audience": "Hair salons, spas, barbershops, and wellness studios",
    "service": "AI marketing services for salons, spas, and barbershops",
    "subdomain": "beauty.netwebmedia.com",
    "knows": ["Salon booking automation","Instagram-to-bookings funnels","Beauty AEO citations","Loyalty automation for salons","Stylist content marketing","Spa marketing","Barbershop branding"],
    "areaServed": ["United States","Chile"],
  },
  "smb": {
    "audience": "Small and medium-sized businesses across founder-led verticals",
    "service": "AI marketing services for SMBs and founder-led companies",
    "subdomain": "smb.netwebmedia.com",
    "knows": ["Fractional CMO services","SMB marketing strategy","Founder-led growth","AEO for small business","Lead generation","CRM automation for SMBs"],
    "areaServed": ["United States","Chile"],
  },
  "legal-services": {
    "audience": "Law firms, attorneys, and legal practices",
    "service": "AI marketing services for law firms and legal practices",
    "subdomain": "legal.netwebmedia.com",
    "knows": ["Legal marketing","Attorney AEO","Law firm SEO","Qualified consult generation","DWI defense marketing","Practice-area content","Bar-compliant advertising","Legal handbooks for SEO"],
    "areaServed": ["United States"],
  },
  "real-estate": {
    "audience": "Real estate agents, brokerages, and property management companies",
    "service": "AI marketing services for real estate teams and brokerages",
    "subdomain": "realestate.netwebmedia.com",
    "knows": ["Listing promotion","Real estate AI SDR","Real estate AEO","Agent local SEO","IDX integration","Buyer and seller lead nurture","Open-house marketing"],
    "areaServed": ["United States"],
  },
  "local-services": {
    "audience": "Local specialist businesses, boutiques, gyms, and neighborhood retailers",
    "service": "AI marketing services for hyperlocal specialty businesses",
    "subdomain": "local.netwebmedia.com",
    "knows": ["Hyperlocal SEO","Foot-traffic marketing","Boutique retail marketing","Gym membership growth","Loyalty programs","Local AEO citations"],
    "areaServed": ["United States","Chile"],
  },
  "automotive": {
    "audience": "Auto dealerships, repair shops, and automotive service businesses",
    "service": "AI marketing services for auto dealers and repair shops",
    "subdomain": "auto.netwebmedia.com",
    "knows": ["Dealership marketing","Auto repair local SEO","Auto AEO citations","Service-bay scheduling","Lead nurture for auto","Inventory feed marketing"],
    "areaServed": ["United States"],
  },
  "education": {
    "audience": "Schools, tutors, language schools, and educational organizations",
    "service": "AI marketing services for educational organizations",
    "subdomain": "education.netwebmedia.com",
    "knows": ["Enrollment marketing","Education SEO","Parent acquisition","Tutor marketing","Language-school growth","Education AEO citations"],
    "areaServed": ["United States","Chile"],
  },
  "events-weddings": {
    "audience": "Wedding planners, event venues, and event-services businesses",
    "service": "AI marketing services for wedding planners and event venues",
    "subdomain": "events.netwebmedia.com",
    "knows": ["Wedding planner SEO","Event venue marketing","Seasonal demand management","Wedding lead nurture","Vendor referral networks","Event AEO citations"],
    "areaServed": ["United States","Chile"],
  },
  "finance": {
    "audience": "Accountants, financial advisors, and financial-services firms",
    "service": "AI marketing services for accounting firms and financial advisors",
    "subdomain": "finance.netwebmedia.com",
    "knows": ["Accounting firm marketing","Financial advisor SEO","Compliance-aware content","Lead nurture for financial services","Tax-season campaigns","Financial AEO citations"],
    "areaServed": ["United States"],
  },
  "home-services": {
    "audience": "Plumbers, electricians, landscapers, cleaning services, and home contractors",
    "service": "AI marketing services for home-services contractors",
    "subdomain": "home.netwebmedia.com",
    "knows": ["Home services SEO","Emergency-response lead capture","Service-area marketing","Plumber marketing","Electrician marketing","Home contractor AEO citations"],
    "areaServed": ["United States"],
  },
  "wine-agriculture": {
    "audience": "Wineries, vineyards, and farm-to-table agricultural businesses",
    "service": "AI marketing services for wineries and farm-to-table agriculture",
    "subdomain": "wine.netwebmedia.com",
    "knows": ["Winery marketing","Direct-to-consumer wine sales","Vineyard agritourism","Wine club retention","Farm-to-table storytelling","Agriculture AEO citations"],
    "areaServed": ["United States","Chile"],
  },
}

def make_schema(cfg):
    obj = {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": f"https://{cfg['subdomain']}/#service",
      "name": cfg["service"],
      "serviceType": ["Fractional CMO","AEO (Answer Engine Optimization)","Local SEO","Paid Ads","AI Automation","CRM"],
      "provider": {"@id": "https://netwebmedia.com/#org"},
      "areaServed": [{"@type":"Country","name":c} for c in cfg["areaServed"]],
      "audience": {"@type": "BusinessAudience", "audienceType": cfg["audience"]},
      "knowsAbout": cfg["knows"],
      "offers": {
        "@type": "AggregateOffer",
        "lowPrice": "249",
        "highPrice": "5999",
        "priceCurrency": "USD",
        "offerCount": "5",
        "url": "https://netwebmedia.com/pricing.html"
      }
    }
    return json.dumps(obj, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    added = skipped = errors = 0
    for folder, cfg in SCHEMA.items():
        path = f"industries/{folder}/index.html"
        if not os.path.exists(path):
            print(f"missing: {path}")
            errors += 1
            continue
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        marker = f'"@id": "https://{cfg["subdomain"]}/#service"'
        if marker in content:
            print(f"already has industry schema: {path}")
            skipped += 1
            continue
        if "</head>" not in content:
            print(f"NO </head> in {path} — skipping")
            errors += 1
            continue
        schema_json = make_schema(cfg)
        block = (
            "  <!-- Industry-specific schema for AEO citation (Service + audience) -->\n"
            '  <script type="application/ld+json">\n'
            f"{schema_json}\n"
            "  </script>\n"
        )
        fixed = content.replace("</head>", block + "</head>", 1)
        with open(path, "w", encoding="utf-8") as f:
            f.write(fixed)
        added += 1
        print(f"added schema: {path}")
    print(f"\n--- summary: added={added}, skipped={skipped}, errors={errors} ---")
