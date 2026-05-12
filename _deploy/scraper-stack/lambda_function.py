"""
NetWebMedia prospect scraper Lambda.

Triggered by SQS messages of shape:
  {"city": "Santiago", "country": "CL", "niche": "tourism",
   "bbox": "-33.7,-70.85,-33.30,-70.45",
   "tourism_tags": ["hotel","hostel","guest_house","motel","apartment"],
   "amenity_tags": null,
   "shop_tags": null}

Per invocation:
  1. Query OSM Overpass API for businesses in that bbox + niche
  2. For each business with website (or where we can discover one), fetch homepage
  3. Extract emails via regex
  4. Write enriched results to S3 at scrape/<niche>/<country>_<city>.json

Designed to run within Lambda's 15-min max timeout for any single (city, niche).
"""
import json
import os
import re
import ssl
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

import boto3

S3 = boto3.client("s3")
BUCKET = os.environ.get("BUCKET", "nwm-scrape-prospects-744092293944")
OVERPASS_MIRRORS = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.openstreetmap.fr/api/interpreter",
]
UA = "NetWebMedia-Lambda/1.0 (contact@netwebmedia.com)"

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
BAD_LOCAL = {"example", "test", "noreply", "no-reply", "youremail", "your-email"}
BAD_DOMAINS = {"sentry.io", "wixpress.com", "example.com", "sentry.wixpress.com"}

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE


def overpass_query(bbox, tourism_tags=None, amenity_tags=None, shop_tags=None):
    """Build + run Overpass query for the given bbox and OSM tag categories."""
    clauses = []
    for cat, tags in [("tourism", tourism_tags), ("amenity", amenity_tags), ("shop", shop_tags)]:
        if not tags:
            continue
        tag_re = "|".join(tags)
        clauses.append(f'node["{cat}"~"{tag_re}"]({bbox});')
        clauses.append(f'way["{cat}"~"{tag_re}"]({bbox});')
    if not clauses:
        return []
    query = f"[out:json][timeout:90];({''.join(clauses)});out center tags;"
    for url in OVERPASS_MIRRORS:
        try:
            data = urllib.parse.urlencode({"data": query}).encode()
            req = urllib.request.Request(url, data=data, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.load(r).get("elements", [])
        except Exception as e:
            print(f"  Overpass {url} failed: {e}")
            time.sleep(2)
    return []


def fetch(url, timeout=8):
    try:
        if not url.startswith("http"):
            url = "http://" + url
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (compatible; nwm-scraper)",
            "Accept": "text/html",
        })
        with urllib.request.urlopen(req, timeout=timeout, context=SSL_CTX) as r:
            ct = r.headers.get("Content-Type", "")
            if "text" not in ct and "html" not in ct:
                return ""
            return r.read(400_000).decode("utf-8", errors="ignore")
    except Exception:
        return ""


def extract_emails(html):
    if not html:
        return []
    out = []
    for e in set(EMAIL_RE.findall(html)):
        e = e.lower().strip(".,;:")
        local, _, domain = e.partition("@")
        if not domain or domain in BAD_DOMAINS:
            continue
        if any(b in local for b in BAD_LOCAL):
            continue
        if domain.endswith((".png", ".jpg", ".svg", ".gif", ".webp", ".ico")):
            continue
        if len(local) < 2 or len(local) > 40:
            continue
        out.append(e)
    return list(dict.fromkeys(out))


def scrape_one(biz):
    url = biz.get("website")
    if not url:
        return biz
    base = url if url.startswith("http") else "http://" + url
    parsed = urllib.parse.urlparse(base)
    root = f"{parsed.scheme}://{parsed.netloc}"
    emails = set()
    for path in ["", "/contact", "/contacto", "/contact-us"]:
        html = fetch(root + path if path else base)
        if html:
            emails.update(extract_emails(html))
        if emails:
            break
    biz["scraped_emails"] = sorted(emails)[:5]
    return biz


def lambda_handler(event, context):
    """Process one or more SQS messages — each a (city, niche, bbox) job."""
    batch_failures = []
    for record in event.get("Records", []):
        msg_id = record["messageId"]
        try:
            body = json.loads(record["body"])
            process_job(body)
        except Exception as e:
            print(f"FAILED {msg_id}: {e}")
            batch_failures.append({"itemIdentifier": msg_id})
    return {"batchItemFailures": batch_failures}


def process_job(job):
    city = job["city"]
    country = job["country"]
    niche = job["niche"]
    bbox = job["bbox"]
    started = time.time()
    print(f"=== JOB: {country}/{city} / {niche} ===")
    elements = overpass_query(
        bbox,
        tourism_tags=job.get("tourism_tags"),
        amenity_tags=job.get("amenity_tags"),
        shop_tags=job.get("shop_tags"),
    )
    print(f"  Overpass: {len(elements)} elements")

    businesses = []
    for e in elements:
        t = e.get("tags", {})
        name = t.get("name")
        if not name:
            continue
        web = t.get("website") or t.get("contact:website") or t.get("url")
        businesses.append({
            "name": name,
            "phone": t.get("phone") or t.get("contact:phone", ""),
            "website": web,
            "osm_email": t.get("email") or t.get("contact:email", ""),
            "address": ((t.get("addr:street", "") + " " + t.get("addr:housenumber", "")).strip()),
            "city": t.get("addr:city") or city,
            "country": country,
            "niche": niche,
            "osm_id": f"{e.get('type','')}/{e.get('id','')}",
            "lat": e.get("lat") or e.get("center", {}).get("lat"),
            "lon": e.get("lon") or e.get("center", {}).get("lon"),
            "osm_category": t.get("tourism") or t.get("amenity") or t.get("shop", ""),
        })

    with_web = [b for b in businesses if b["website"]]
    print(f"  Named: {len(businesses)} | With website: {len(with_web)}")

    # Scrape emails concurrently (Lambda has limited CPU but lots of I/O headroom)
    if with_web:
        with ThreadPoolExecutor(max_workers=20) as ex:
            futures = {ex.submit(scrape_one, b): b for b in with_web}
            for f in as_completed(futures, timeout=600):
                pass

    with_email = sum(1 for b in businesses if b.get("scraped_emails") or b.get("osm_email"))
    elapsed = time.time() - started
    print(f"  Done: {with_email}/{len(businesses)} have email | {elapsed:.1f}s")

    # Save to S3
    key = f"scrape/{niche}/{country}_{city.lower().replace(' ','-')}.json"
    payload = {
        "city": city,
        "country": country,
        "niche": niche,
        "bbox": bbox,
        "total_businesses": len(businesses),
        "with_website": len(with_web),
        "with_email": with_email,
        "elapsed_sec": elapsed,
        "scraped_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "businesses": businesses,
    }
    S3.put_object(
        Bucket=BUCKET,
        Key=key,
        Body=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        ContentType="application/json",
    )
    print(f"  S3: s3://{BUCKET}/{key}")
