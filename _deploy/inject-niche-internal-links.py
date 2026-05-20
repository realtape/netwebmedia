"""Insert one contextual inbound link from each of 9 niche-relevant blog posts to
its priority industry hub (/industries/healthcare/, /industries/real-estate/,
/industries/hospitality/).

Rationale: GSC audit 2026-05-13 found 0 inbound internal links from the blog to
priority commercial pages. Blog is the only thing Google trusts on the domain,
so it should be feeding equity into the niche hubs. Adding 3 links per priority
hub from semantically-adjacent posts.

Idempotent: skips files that already contain the marker class `post-niche-anchor`.
"""
import os
import sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
BLOG = os.path.join(ROOT, "blog")

# (filename, hub_path, anchor_text, intro_phrase)
LINKS = [
    # Healthcare → /industries/healthcare/
    ("physical-therapy-clinic-online-marketing-conversion.html",
     "/industries/healthcare/",
     "AI marketing playbook for healthcare clinics",
     "Physical therapy is one of several healthcare verticals where the AEO playbook below applies. See the full"),
    ("chiropractic-practice-local-seo-patient-acquisition.html",
     "/industries/healthcare/",
     "AI marketing services for medical and chiropractic practices",
     "If you run a practice and want this implemented for you, see our"),
    ("mental-health-practice-digital-marketing-strategy.html",
     "/industries/healthcare/",
     "patient-acquisition automation for healthcare",
     "Looking for done-for-you implementation? Explore our"),
    # Real Estate → /industries/real-estate/
    ("mortgage-broker-seo-lead-generation-conversion.html",
     "/industries/real-estate/",
     "AI marketing for real-estate brokerages and lenders",
     "Mortgage and real-estate marketing converge on the same buyer-intent queries. See our"),
    ("real-estate-photo-google-image-search.html",
     "/industries/real-estate/",
     "real-estate AI marketing services",
     "For agents and brokerages ready to operationalize this, see our"),
    ("mortgage-broker-seo-lead-generation.html",
     "/industries/real-estate/",
     "real-estate and mortgage AI marketing playbook",
     "Want the full playbook applied to your business? See our"),
    # Tourism / Hospitality → /industries/hospitality/
    ("vacation-rental-ai-marketing-booking-strategy.html",
     "/industries/hospitality/",
     "AI marketing for hospitality and short-term rentals",
     "Short-term rentals sit inside the broader hospitality playbook. See our"),
    ("boutique-hotel-accommodation-digital-marketing.html",
     "/industries/hospitality/",
     "hospitality and boutique-hotel marketing services",
     "If you'd like NetWebMedia to implement this for your property, see our"),
    ("eco-tourism-adventure-travel-seo-strategy.html",
     "/industries/hospitality/",
     "tourism and adventure-travel AI marketing",
     "Eco-tourism is one of several hospitality sub-verticals we serve. Explore our"),
]

MARKER_CLASS = "post-niche-anchor"


def build_aside(hub_path, anchor, intro):
    return (
        f'\n  <aside class="{MARKER_CLASS}" '
        f'style="margin:32px 0;padding:20px 24px;background:rgba(255,103,31,0.06);'
        f'border-left:3px solid #FF671F;border-radius:8px;font-size:15px;line-height:1.55;">'
        f'\n    {intro} <a href="https://netwebmedia.com{hub_path}">{anchor}</a>.'
        f'\n  </aside>\n'
    )


def main():
    edited = 0
    skipped = 0
    missing = 0
    for fname, hub, anchor, intro in LINKS:
        full = os.path.join(BLOG, fname)
        if not os.path.exists(full):
            print(f"  MISSING: {fname}")
            missing += 1
            continue
        with open(full, "r", encoding="utf-8") as fh:
            content = fh.read()
        if MARKER_CLASS in content:
            print(f"  skip (already linked): {fname}")
            skipped += 1
            continue
        if "</main>" not in content:
            print(f"  skip (no </main>): {fname}")
            skipped += 1
            continue
        block = build_aside(hub, anchor, intro)
        new_content = content.replace("</main>", block + "</main>", 1)
        with open(full, "w", encoding="utf-8") as fh:
            fh.write(new_content)
        print(f"  linked: {fname}  ->  {hub}")
        edited += 1
    print(f"\nEdited {edited}, skipped {skipped}, missing {missing}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
