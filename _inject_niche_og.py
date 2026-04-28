#!/usr/bin/env python3
"""
Override og:image on each niche hub page with the per-niche OG image.
Maps directory name -> /assets/og/og-niche-<slug>.png.

Only updates the niche HUB pages (industries/<niche>/index.html), NOT the
sub-niche pages under them — those keep the generic og-industries.png that
was set in the previous pass.
"""
import os, re

ROOT = os.path.dirname(__file__)
LP_DIR = os.path.join(ROOT, "industries")

# Map LP directory name -> niche OG slug. Only the 14 hubs we generated.
# Some directories use slightly different names than the OG slug.
NICHE_MAP = {
    "real-estate":           "real-estate",
    "healthcare":            "healthcare",
    "ecommerce":             "ecommerce",
    "tech-saas":             "tech-saas",
    "hospitality":           "hospitality",
    "professional-services": "professional-services",
    "local-services":        "local-services",
    "finance":               "finance",
    "education":             "education",
    # construction directory may not exist on disk; safe-fallback
    "construction":          "construction",
    # agencies is under tech-saas/agencies, not a hub
    # automotive
    "automotive":            "automotive",
    # events
    "events":                "events",
    "events-weddings":       "events",
    # wine-agriculture
    "wine-agriculture":      "wine-agriculture",
    # extras present on hub but not in OG (covered by industries hub)
    "fitness":               "local-services",   # closest theme
    "beauty":                "local-services",
    "restaurants":           "hospitality",
    "smb":                   "local-services",
    "home-services":         "construction",
    "legal-services":        "professional-services",
}

# og:image meta tag swap — needs to be precise. Matches the line we wrote earlier.
OLD_OG = re.compile(
    r'<meta\s+property="og:image"\s+content="https://netwebmedia\.com/assets/og-industries\.png"\s*/?>',
    re.IGNORECASE
)
OLD_TW = re.compile(
    r'<meta\s+name="twitter:image"\s+content="https://netwebmedia\.com/assets/og-industries\.png"\s*/?>',
    re.IGNORECASE
)

def process(path, niche_slug):
    new_url = f"https://netwebmedia.com/assets/og/og-niche-{niche_slug}.png"
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        html = f.read()
    new = OLD_OG.sub(f'<meta property="og:image" content="{new_url}" />', html)
    new = OLD_TW.sub(f'<meta name="twitter:image" content="{new_url}" />', new)
    if new == html:
        return False
    with open(path, "w", encoding="utf-8") as f:
        f.write(new)
    return True

def main():
    updated = 0
    not_found = []
    for niche_dir, og_slug in NICHE_MAP.items():
        path = os.path.join(LP_DIR, niche_dir, "index.html")
        if not os.path.exists(path):
            not_found.append(niche_dir)
            continue
        if process(path, og_slug):
            print(f"  + {niche_dir}/ -> og-niche-{og_slug}.png")
            updated += 1
        else:
            print(f"  = {niche_dir}/ (no change — pattern not matched)")
    print(f"\nUpdated: {updated}  Not found on disk: {len(not_found)}")
    for n in not_found:
        print(f"  ? {n}/index.html (skipped)")

if __name__ == "__main__":
    main()
