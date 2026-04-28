#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
"""
NetWebMedia — Best Prospects Generator
Processes Chile (CSV) + USA (JSON) contact lists:
  1. Generates 5x email variants per unique company domain
  2. Validates emails (custom domain only, no free providers)
  3. Scores & ranks prospects per niche + region/state
  4. Exports best-prospect CSVs for CRM import

Outputs:
  chile_best_prospects.csv    — top prospects per niche/city
  usa_5x.csv                  — full 5x expansion of USA contacts
  usa_best_prospects.csv      — top prospects per niche/state
"""
import csv, json, re, os, sys

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE     = os.path.dirname(os.path.abspath(__file__))
DEPLOY   = os.path.normpath(os.path.join(BASE, '../../_deploy'))
CHILE_IN = os.path.join(BASE, 'all_leads_5x.csv')
USA_IN   = os.path.join(DEPLOY, 'usa_crm_import.json')
CHILE_OUT = os.path.join(BASE, 'chile_best_prospects.csv')
USA_5X    = os.path.join(BASE, 'usa_5x.csv')
USA_OUT   = os.path.join(BASE, 'usa_best_prospects.csv')

# ── Constants ──────────────────────────────────────────────────────────────────
FREE_DOMAINS = {
    'gmail.com','yahoo.com','hotmail.com','outlook.com','icloud.com',
    'live.com','aol.com','msn.com','protonmail.com','zoho.com',
    'yandex.com','mail.com','inbox.com','gmx.com','fastmail.com',
    'yahoo.es','hotmail.es','yahoo.co.uk','hotmail.co.uk',
}

# Prefix priority: lower index = higher quality
PREFIXES_ES = ['info', 'contacto', 'ventas', 'admin', 'hola']
PREFIXES_EN = ['info', 'contact', 'sales', 'admin', 'hello']

ROLE_MAP_ES = {
    'info':     'Encargado/a',
    'contacto': 'Dueño/a',
    'ventas':   'Gerente de Ventas',
    'admin':    'Administrador/a',
    'hola':     'Recepción',
}
ROLE_MAP_EN = {
    'info':    'Owner / Manager',
    'contact': 'General Contact',
    'sales':   'Sales Manager',
    'admin':   'Administrator',
    'hello':   'Reception',
}

# ── Helpers ────────────────────────────────────────────────────────────────────
def extract_domain(email, website=''):
    """Return lowercase domain or None; skip free providers."""
    # Try email first
    if email and '@' in email:
        dom = email.split('@', 1)[1].strip().lower().rstrip('/')
        if '.' in dom and dom not in FREE_DOMAINS:
            return dom
    # Fallback to website
    if website:
        dom = re.sub(r'^https?://', '', website.strip().lower())
        dom = re.sub(r'^www\.', '', dom).split('/')[0].split('?')[0].rstrip('.')
        if '.' in dom and dom not in FREE_DOMAINS:
            return dom
    return None

def is_valid_email(email):
    """Basic email validation — must have local@domain.tld."""
    if not email or '@' not in email:
        return False
    local, domain = email.rsplit('@', 1)
    return bool(local and '.' in domain and len(domain) >= 4)

def score_email(prefix, prefixes_list):
    """Lower index = better quality = higher score."""
    try:
        return len(prefixes_list) - prefixes_list.index(prefix)
    except ValueError:
        return 0

def score_contact(row, prefix, prefixes_list):
    """Composite score for prospect quality."""
    s = 0
    s += score_email(prefix, prefixes_list) * 10   # email prefix quality
    if row.get('phone','').strip():       s += 5    # has phone
    if row.get('website','').strip():     s += 5    # has website
    if row.get('company','').strip():     s += 3    # has company name
    return s

# ── CSV field names ────────────────────────────────────────────────────────────
FIELDNAMES = ['name','email','phone','company','role','status',
              'value','niche_key','niche','city','website','notes']

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1 — Chile: validate + score existing 5x list
# ═══════════════════════════════════════════════════════════════════════════════
print("── CHILE ──────────────────────────────────────────────────────")
print(f"Reading {CHILE_IN} …")

chile_rows = []
with open(CHILE_IN, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        chile_rows.append(row)

print(f"  Loaded {len(chile_rows):,} contacts")

# Validate & score
chile_valid = []
for row in chile_rows:
    email = row.get('email','').strip()
    if not is_valid_email(email):
        continue
    domain = extract_domain(email, row.get('website',''))
    if domain is None:
        continue   # free provider email — skip
    prefix = email.split('@')[0].lower()
    row['_score'] = score_contact(row, prefix, PREFIXES_ES)
    row['_domain'] = domain
    chile_valid.append(row)

print(f"  Valid custom-domain emails: {len(chile_valid):,}")

# Best prospect per niche + city: keep top-scored unique domain per bucket
chile_best = {}   # key: (niche_key, city) → list sorted by score
for row in chile_valid:
    key = (row.get('niche_key','').strip(), row.get('city','').strip().lower())
    chile_best.setdefault(key, []).append(row)

# Sort each bucket, deduplicate by domain (keep best per domain), take top 25
chile_final = []
for (niche, city), rows in sorted(chile_best.items()):
    rows.sort(key=lambda r: -r['_score'])
    seen_domains = {}
    for r in rows:
        dom = r['_domain']
        if dom not in seen_domains:
            seen_domains[dom] = r
    # take top 25 per niche+city
    top = sorted(seen_domains.values(), key=lambda r: -r['_score'])[:25]
    chile_final.extend(top)

print(f"  Best prospects (top 25 per niche+city): {len(chile_final):,}")

# Write Chile best
with open(CHILE_OUT, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=FIELDNAMES, extrasaction='ignore')
    writer.writeheader()
    writer.writerows(chile_final)

# Stats
chile_niche_counts = {}
chile_city_counts = {}
for r in chile_final:
    n = r.get('niche_key','')
    c = r.get('city','')
    chile_niche_counts[n] = chile_niche_counts.get(n, 0) + 1
    chile_city_counts[c]  = chile_city_counts.get(c, 0) + 1

print(f"  Written: {CHILE_OUT}")
print(f"  By niche:")
for n, cnt in sorted(chile_niche_counts.items(), key=lambda x: -x[1]):
    print(f"    {n:25} {cnt:>5,}")
print(f"  Top 5 cities:")
for c, cnt in sorted(chile_city_counts.items(), key=lambda x: -x[1])[:5]:
    print(f"    {c:25} {cnt:>5,}")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2 — USA: generate 5x then score
# ═══════════════════════════════════════════════════════════════════════════════
print("\n── USA ────────────────────────────────────────────────────────")
print(f"Reading {USA_IN} …")

with open(USA_IN, encoding='utf-8') as f:
    usa_raw = json.load(f)

print(f"  Loaded {len(usa_raw):,} contacts")

# Parse notes JSON
def parse_notes(c):
    n = c.get('notes', {})
    if isinstance(n, str):
        try: n = json.loads(n)
        except: n = {}
    return n

# Deduplicate by company (keep first occurrence per company slug)
usa_rows = []
seen_companies = set()
for c in usa_raw:
    company = c.get('company','').strip()
    slug = re.sub(r'\W+', '', company.lower())
    if slug in seen_companies:
        continue
    seen_companies.add(slug)
    notes = parse_notes(c)
    usa_rows.append({
        'company':  company,
        'email':    c.get('email',''),
        'phone':    c.get('phone',''),
        'name':     c.get('name',''),
        'role':     c.get('role',''),
        'niche_key': notes.get('niche',''),
        'niche':    notes.get('niche','').replace('_',' ').title(),
        'city':     notes.get('city',''),
        'state':    notes.get('state',''),
        'state_code': notes.get('state_code',''),
        'website':  notes.get('website',''),
        'notes':    json.dumps(notes),
        'status':   'lead',
        'value':    '0',
    })

print(f"  Unique companies: {len(usa_rows):,}")

# Generate 5x variants
print("  Generating 5x email variants …")
used_emails = set()
usa_5x = []

for row in usa_rows:
    domain = extract_domain(row['email'], row['website'])
    if not domain:
        # Keep original if valid custom domain somehow missed, else skip
        if is_valid_email(row['email']) and row['email'].split('@')[1] not in FREE_DOMAINS:
            email = row['email']
            if email not in used_emails:
                used_emails.add(email)
                usa_5x.append({**row})
        continue

    # Generate up to 5 prefix variants
    state_abbr = row.get('state_code','')
    for prefix, role in zip(PREFIXES_EN, ROLE_MAP_EN.values()):
        email = f"{prefix}@{domain}"
        if email in used_emails:
            continue
        used_emails.add(email)
        new_row = dict(row)
        new_row['email'] = email
        new_row['role']  = f"{role} — {row['state']}" if row.get('state') else role
        new_row['_score'] = score_contact(new_row, prefix, PREFIXES_EN)
        new_row['_domain'] = domain
        usa_5x.append(new_row)

print(f"  5x expanded: {len(usa_5x):,} contacts")

# Write USA 5x full list
USA_FIELDNAMES = ['name','email','phone','company','role','status',
                  'value','niche_key','niche','city','state','state_code','website','notes']
with open(USA_5X, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=USA_FIELDNAMES, extrasaction='ignore')
    writer.writeheader()
    writer.writerows(usa_5x)
print(f"  Written full 5x list: {USA_5X}")

# Best prospect per niche + state: top-scored unique domain, max 25 per bucket
usa_best_buckets = {}
for row in usa_5x:
    if not is_valid_email(row.get('email','')):
        continue
    key = (row.get('niche_key',''), row.get('state',''))
    usa_best_buckets.setdefault(key, []).append(row)

usa_final = []
for (niche, state), rows in sorted(usa_best_buckets.items()):
    rows.sort(key=lambda r: -r.get('_score', 0))
    seen_domains = {}
    for r in rows:
        dom = r.get('_domain', extract_domain(r['email'], r.get('website','')))
        if dom and dom not in seen_domains:
            seen_domains[dom] = r
    top = sorted(seen_domains.values(), key=lambda r: -r.get('_score', 0))[:25]
    usa_final.extend(top)

print(f"  Best prospects (top 25 per niche+state): {len(usa_final):,}")

# Write USA best
with open(USA_OUT, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=USA_FIELDNAMES, extrasaction='ignore')
    writer.writeheader()
    writer.writerows(usa_final)

# Stats
usa_niche_counts = {}
usa_state_counts = {}
for r in usa_final:
    n = r.get('niche_key','')
    s = r.get('state','')
    usa_niche_counts[n] = usa_niche_counts.get(n, 0) + 1
    usa_state_counts[s] = usa_state_counts.get(s, 0) + 1

print(f"  Written: {USA_OUT}")
print(f"  By niche:")
for n, cnt in sorted(usa_niche_counts.items(), key=lambda x: -x[1]):
    print(f"    {n:25} {cnt:>6,}")
print(f"  Top 10 states:")
for s, cnt in sorted(usa_state_counts.items(), key=lambda x: -x[1])[:10]:
    print(f"    {s:25} {cnt:>6,}")

# ═══════════════════════════════════════════════════════════════════════════════
# FINAL SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════
print("\n══ SUMMARY ═══════════════════════════════════════════════════")
print(f"  Chile best prospects : {len(chile_final):>7,}  →  {CHILE_OUT}")
print(f"  USA   5x full list   : {len(usa_5x):>7,}  →  {USA_5X}")
print(f"  USA   best prospects : {len(usa_final):>7,}  →  {USA_OUT}")
print("══════════════════════════════════════════════════════════════")
