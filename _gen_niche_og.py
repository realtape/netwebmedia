#!/usr/bin/env python3
"""
Generate 14 per-niche OG images (1200x630) matching the industries hub taxonomy.
Saves to assets/og/og-niche-<slug>.png. Run once, delete.
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(__file__)
OUT = os.path.join(ROOT, "assets", "og")
os.makedirs(OUT, exist_ok=True)

NAVY = (1, 15, 59)
ORANGE = (255, 103, 31)
WHITE = (255, 255, 255)
GRAY = (176, 187, 206)

W, H = 1200, 630

NICHES = [
    # (slug,             eyebrow,                          headline_lines,                                    sub)
    ("real-estate",      "REAL ESTATE",                    ["More qualified buyers.",   "Fewer cold tours."],   "AEO + AI SDRs for agents, brokerages, property mgmt."),
    ("healthcare",       "HEALTHCARE",                     ["More patients.",            "Fewer no-shows."],     "HIPAA-aware AI marketing for clinics, dentists, vets."),
    ("ecommerce",        "E-COMMERCE",                     ["Higher AOV.",               "Lower CAC."],          "AEO + email + ads for DTC, Shopify, marketplaces."),
    ("tech-saas",        "TECH & SAAS",                    ["Cited by Claude.",          "Closed by humans."],   "Pipeline plays for SaaS, agencies, startups."),
    ("hospitality",      "HOSPITALITY",                    ["Direct bookings up.",       "OTA dependency down."],"AEO + reviews for hotels, resorts, boutiques."),
    ("professional-services","PROFESSIONAL SERVICES",      ["More qualified clients.",   "Less waiting."],       "Lead gen for legal, accounting, consulting."),
    ("local-services",   "LOCAL SERVICES",                 ["Lead-response in 60 sec.",  "Closed in 7 days."],   "AI SDRs for trades, photography, coaching."),
    ("finance",          "FINANCIAL SERVICES",             ["Compliant content.",        "Cited content."],      "AEO for advisors, insurance, fintech."),
    ("education",        "EDUCATION",                      ["More enrollments.",         "Lower CAC."],          "AEO + nurture for tutors, vocational, online courses."),
    ("construction",     "CONSTRUCTION & TRADES",          ["Booked solid weeks out.",   "No more cold callers."],"Lead gen for contractors, plumbers, landscaping."),
    ("agencies",         "MARKETING AGENCIES",             ["White-label AEO.",          "Margin you can ship."],"Resell our stack as your own."),
    ("automotive",       "AUTOMOTIVE",                     ["More test drives.",         "Higher RO conversion."],"AI marketing for dealerships, repair, detailing."),
    ("events",           "EVENTS & WEDDINGS",              ["Booked the season.",        "Without cold calls."], "AEO + nurture for venues, planners, corporate."),
    ("wine-agriculture", "WINE & AGRICULTURE",             ["Wine club growth.",         "On autopilot."],       "AEO + email for wineries, vineyards, agribusiness."),
]

def font(size, bold=False):
    cands = [
        r"C:\Windows\Fonts\seguisb.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
    ]
    for c in cands:
        if os.path.exists(c):
            try: return ImageFont.truetype(c, size)
            except: pass
    return ImageFont.load_default()

def make(slug, eyebrow, head_lines, sub):
    img = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(img)
    # eyebrow
    d.text((80, 130), eyebrow, font=font(28), fill=ORANGE)
    # accent rule
    d.rectangle([80, 168, 200, 174], fill=ORANGE)
    # headline
    f_head = font(72, bold=True)
    y = 200
    for line in head_lines:
        d.text((78, y), line, font=f_head, fill=WHITE)
        y += 84
    # sub
    d.text((80, y + 30), sub, font=font(28), fill=GRAY)
    # NWM badge top-right
    cx, cy, r = W-100, 100, 38
    d.ellipse([cx-r, cy-r, cx+r, cy+r], outline=ORANGE, width=4)
    fnwm = font(20, bold=True)
    bbox = d.textbbox((0,0), "NWM", font=fnwm)
    tw = bbox[2]-bbox[0]
    d.text((cx-tw/2, cy-14), "NWM", font=fnwm, fill=WHITE)
    # bottom URL
    d.rectangle([80, H-90, 200, H-84], fill=ORANGE)
    d.text((80, H-70), "netwebmedia.com", font=font(28), fill=WHITE)
    out = os.path.join(OUT, f"og-niche-{slug}.png")
    img.save(out, "PNG", optimize=True)
    print(f"  + assets/og/og-niche-{slug}.png")

def main():
    print(f"Generating {len(NICHES)} niche OG images to assets/og/...")
    for niche in NICHES:
        make(*niche)
    print("Done.")

if __name__ == "__main__":
    main()
