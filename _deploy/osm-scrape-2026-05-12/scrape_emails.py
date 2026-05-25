"""OSM business email scraper — visits websites and extracts emails via regex."""
import json, re, urllib.request, urllib.parse, urllib.error, time, sys, io, ssl, os, csv
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

OSM_RAW = r"C:/Users/Usuario/Desktop/NetWebMedia/_deploy/osm-scrape-2026-05-12/santiago_hotels_osm_raw.json"
OUT_DIR = r"C:/Users/Usuario/Desktop/NetWebMedia/_deploy/osm-scrape-2026-05-12"

data = json.load(open(OSM_RAW, encoding='utf-8'))
elements = data['elements']

businesses = []
for e in elements:
    t = e.get('tags', {})
    name = t.get('name')
    if not name:
        continue
    web = t.get('website') or t.get('contact:website') or t.get('url')
    osm_email = t.get('email') or t.get('contact:email')
    businesses.append({
        'name': name,
        'phone': t.get('phone') or t.get('contact:phone', ''),
        'website': web,
        'osm_email': osm_email,
        'address': (t.get('addr:street', '') + (' ' + t.get('addr:housenumber', '') if t.get('addr:housenumber') else '')).strip(),
        'city': t.get('addr:city') or 'Santiago',
        'tourism': t.get('tourism', ''),
        'osm_id': "{}/{}".format(e.get('type', ''), e.get('id', '')),
        'lat': e.get('lat') or e.get('center', {}).get('lat'),
        'lon': e.get('lon') or e.get('center', {}).get('lon'),
    })

with_web = [b for b in businesses if b['website']]
print("Named businesses: {}".format(len(businesses)))
print("With website to scrape: {}".format(len(with_web)))
print("With OSM email already: {}".format(sum(1 for b in businesses if b['osm_email'])))

EMAIL_RE = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
BAD_LOCAL = {'example', 'test', 'noreply', 'no-reply', 'youremail', 'your-email'}
BAD_DOMAINS = {'sentry.io', 'wixpress.com', 'example.com', 'sentry.wixpress.com',
               'gif.gif', 'png.png', 'jpg.jpg', 'jpeg.jpeg', 'svg.svg', 'webp.webp', 'ico.ico'}

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def fetch(url, timeout=10):
    try:
        if not url.startswith('http'):
            url = 'http://' + url
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html'
        })
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as r:
            ct = r.headers.get('Content-Type', '')
            if 'text' not in ct and 'html' not in ct:
                return ''
            raw = r.read(500_000)
            return raw.decode('utf-8', errors='ignore')
    except Exception:
        return ''

def extract_emails(html):
    if not html:
        return []
    found = set(EMAIL_RE.findall(html))
    out = []
    for e in found:
        e = e.lower().strip('.,;:')
        local, _, domain = e.partition('@')
        if not domain or domain in BAD_DOMAINS:
            continue
        if any(b in local for b in BAD_LOCAL):
            continue
        if domain.endswith(('.png', '.jpg', '.svg', '.gif', '.webp')):
            continue
        if len(local) < 2 or len(local) > 40:
            continue
        out.append(e)
    return list(dict.fromkeys(out))

def scrape_business(b):
    url = b['website']
    if not url:
        b['scraped_emails'] = []
        return b
    base = url if url.startswith('http') else 'http://' + url
    parsed = urllib.parse.urlparse(base)
    root = "{}://{}".format(parsed.scheme, parsed.netloc)
    emails = set()
    pages = [base, root + '/contact', root + '/contacto', root + '/contact-us']
    for p in pages[:3]:
        html = fetch(p)
        if html:
            emails.update(extract_emails(html))
        if emails:
            break
    b['scraped_emails'] = sorted(emails)[:5]
    return b

t0 = time.time()
print("\nScraping {} websites (concurrent 16)...".format(len(with_web)))
with ThreadPoolExecutor(max_workers=16) as ex:
    futures = [ex.submit(scrape_business, b) for b in with_web]
    done = 0
    for f in as_completed(futures):
        done += 1
        if done % 25 == 0:
            print("  {}/{} done".format(done, len(with_web)))
elapsed = time.time() - t0
print("\nDone in {:.1f}s".format(elapsed))

with_scraped = [b for b in with_web if b.get('scraped_emails')]
unique_emails = set()
for b in businesses:
    for e in b.get('scraped_emails', []):
        unique_emails.add(e.lower())
    if b.get('osm_email'):
        unique_emails.add(b['osm_email'].lower())

with_any_email = sum(1 for b in businesses if b.get('scraped_emails') or b.get('osm_email'))

print("\n=== OSM Pilot Results - Santiago Hotels ===")
print("Total businesses (OSM):     {}".format(len(businesses)))
print("With website:               {}".format(len(with_web)))
print("Yielded email via scrape:   {} ({}% of those with websites)".format(
    len(with_scraped), 100 * len(with_scraped) // max(len(with_web), 1)))
print("OSM-tagged emails:          {}".format(sum(1 for b in businesses if b.get('osm_email'))))
print("Businesses with any email:  {}".format(with_any_email))
print("Unique emails total:        {}".format(len(unique_emails)))
print("Time:                       {:.1f}s".format(elapsed))

os.makedirs(OUT_DIR, exist_ok=True)
with open(OUT_DIR + "/santiago_hotels_enriched.json", "w", encoding="utf-8") as f:
    json.dump(businesses, f, ensure_ascii=False, indent=2)

rows = []
for b in businesses:
    emails = list(set([(b.get('osm_email') or '').lower()] + [e.lower() for e in b.get('scraped_emails', [])]))
    emails = [e for e in emails if e]
    base = {
        'company': b['name'],
        'phone': b['phone'],
        'website': b['website'] or '',
        'city': b['city'],
        'country_code': 'CL',
        'address': b['address'],
        'segment': 'chile_santiago_hotel_osm_2026_05_12',
        'source': 'osm_overpass',
        'niche': 'tourism',
        'place_id': b['osm_id'],
    }
    if emails:
        for e in emails:
            rows.append({**base, 'email': e, 'name': b['name'][:60]})
    else:
        rows.append({**base, 'email': '', 'name': b['name'][:60]})

cols = ['name', 'email', 'phone', 'company', 'website', 'city', 'country_code',
        'address', 'segment', 'source', 'niche', 'place_id']
with open(OUT_DIR + "/santiago_hotels_osm.csv", "w", encoding="utf-8", newline='') as f:
    w = csv.DictWriter(f, fieldnames=cols)
    w.writeheader()
    for r in rows:
        w.writerow(r)
print("\nWrote {} CSV rows to {}/santiago_hotels_osm.csv".format(len(rows), OUT_DIR))
