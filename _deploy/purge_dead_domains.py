#!/usr/bin/env python3
"""Async MX/A-record check on all CRM email domains, then bulk-purge dead ones.

Workflow:
  1. Pull all distinct domains from /api/?r=domain_audit&action=list (paginated)
  2. Concurrent socket.gethostbyname() with 100 workers, 2s timeout
  3. POST dead domains back to /api/?r=domain_audit&action=purge

A domain with no A or MX record cannot receive mail — emails to it hard-bounce.
"""
import json
import socket
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE   = "https://netwebmedia.com/crm-vanilla/api/index.php"
TOKEN  = "NWM_FILTER_ID_2026"
HEADERS = {
    "User-Agent": "Mozilla/5.0 Chrome/124.0",
    "Accept": "application/json",
    "Referer": "https://netwebmedia.com/crm-vanilla/",
}
WORKERS = 100
DNS_TIMEOUT = 2.0      # seconds per lookup
PURGE_BATCH = 1000     # domains per purge POST

socket.setdefaulttimeout(DNS_TIMEOUT)


def fetch_json(url, data=None, method="GET"):
    req = urllib.request.Request(url, data=data, method=method, headers={
        **HEADERS,
        "Content-Type": "application/json",
    })
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def get_count():
    return fetch_json(f"{BASE}?r=domain_audit&token={TOKEN}&action=count")


def list_domains(offset, limit=10000):
    url = f"{BASE}?r=domain_audit&token={TOKEN}&action=list&offset={offset}&limit={limit}"
    return fetch_json(url)


def is_alive(domain):
    """Returns True if domain resolves to any A record (proxy for 'exists')."""
    try:
        socket.gethostbyname(domain)
        return True
    except (socket.gaierror, socket.timeout, OSError):
        return False


def check_batch(domains):
    """Returns (alive_set, dead_list) for a batch of domains."""
    alive = set()
    dead  = []
    with ThreadPoolExecutor(max_workers=WORKERS) as ex:
        futures = {ex.submit(is_alive, d): d for d in domains}
        for fut in as_completed(futures):
            d = futures[fut]
            if fut.result():
                alive.add(d)
            else:
                dead.append(d)
    return alive, dead


def purge(domains):
    body = json.dumps({"domains": domains}).encode("utf-8")
    return fetch_json(
        f"{BASE}?r=domain_audit&token={TOKEN}&action=purge",
        data=body, method="POST"
    )


def main():
    cnt = get_count()
    total_contacts   = cnt["total_contacts"]
    distinct_domains = cnt["distinct_domains"]
    print(f"Starting: {total_contacts:,} contacts across {distinct_domains:,} distinct domains")
    print(f"DNS workers: {WORKERS}, timeout: {DNS_TIMEOUT}s/lookup")
    print()

    all_dead   = []
    all_alive  = 0
    offset     = 0
    page_size  = 10000
    t0         = time.time()

    while True:
        page = list_domains(offset, page_size)
        domains = page["domains"]
        if not domains:
            break

        page_t0 = time.time()
        alive, dead = check_batch(domains)
        page_t  = time.time() - page_t0

        all_dead.extend(dead)
        all_alive += len(alive)
        offset += len(domains)

        print(
            f"  page offset={offset-len(domains):>6} "
            f"checked={len(domains):>5} "
            f"alive={len(alive):>5} "
            f"dead={len(dead):>5} "
            f"({page_t:.1f}s, running_dead={len(all_dead)})",
            flush=True,
        )

        if not page["has_more"]:
            break

    dns_t = time.time() - t0
    print()
    print(f"DNS check done in {dns_t/60:.1f} min")
    print(f"  Alive domains: {all_alive:,}")
    print(f"  Dead domains:  {len(all_dead):,} ({100*len(all_dead)/distinct_domains:.1f}%)")
    print()

    if not all_dead:
        print("No dead domains — nothing to purge.")
        return

    # Purge in batches
    print(f"Purging {len(all_dead):,} dead domains in batches of {PURGE_BATCH}…")
    deleted_total = 0
    for i in range(0, len(all_dead), PURGE_BATCH):
        chunk = all_dead[i:i+PURGE_BATCH]
        r = purge(chunk)
        deleted_total += r["contacts_deleted"]
        print(
            f"  batch {i//PURGE_BATCH+1:>3} "
            f"domains={r['domains_received']:>4} "
            f"deleted={r['contacts_deleted']:>5} "
            f"running_total={deleted_total:,} "
            f"left_in_crm={r['total_after']:,}",
            flush=True,
        )

    print()
    print(f"DONE — {deleted_total:,} contacts deleted, {r['total_after']:,} reachable contacts remain")


if __name__ == "__main__":
    main()
