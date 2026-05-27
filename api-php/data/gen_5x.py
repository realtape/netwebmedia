"""
Generate 5x leads CSV — 5 prospect contacts per company (one per email prefix).
Each company gets: info@, contacto@, ventas@, admin@, hola@
Domain is extracted from the original email or website field.
Duplicate emails across the whole file are skipped automatically.
"""
import csv, re, sys
from pathlib import Path

DATA_DIR = Path(__file__).parent
INPUT  = DATA_DIR / 'all_leads.csv'
OUTPUT = DATA_DIR / 'all_leads_5x.csv'

PREFIXES = ['info', 'contacto', 'ventas', 'admin', 'hola']

ROLE_MAP = {
    'info':     'Encargado/a',
    'contacto': 'Dueño/a',
    'ventas':   'Gerente de Ventas',
    'admin':    'Administrador/a',
    'hola':     'Recepción',
}

def extract_domain(email, website):
    if email and email.strip() not in ('Not found', '', 'N/A') and '@' in email:
        dom = email.split('@', 1)[1].strip().strip('/')
        if '.' in dom:
            return dom
    if website and website.strip() not in ('', 'N/A', 'Not found'):
        dom = website.strip().strip('/')
        dom = re.sub(r'^https?://', '', dom)
        dom = re.sub(r'^www\.', '', dom)
        dom = dom.split('/')[0].split('?')[0]
        if '.' in dom:
            return dom
    return None

rows = []
with open(INPUT, newline='', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    headers = list(reader.fieldnames)
    for row in reader:
        rows.append(row)

print(f"Loaded {len(rows)} contacts from {INPUT.name}")

used_emails = set()
out_rows = []

for row in rows:
    domain = extract_domain(row.get('email', ''), row.get('website', ''))
    orig_email = (row.get('email') or '').strip()

    if not domain:
        # No usable domain — include original row once if email is valid
        e = orig_email.lower()
        if '@' in e and e not in used_emails:
            used_emails.add(e)
            out_rows.append(dict(row))
        continue

    orig_prefix = orig_email.split('@')[0].lower() if '@' in orig_email else None

    added = 0
    for prefix in PREFIXES:
        new_email = f"{prefix}@{domain}"
        key = new_email.lower()
        if key in used_emails:
            continue

        new_row = dict(row)
        new_row['email']  = new_email
        new_row['status'] = 'lead'
        # Only override role if it's generic or blank
        if not new_row.get('role') or new_row['role'] in ('lead', 'Contacto', ''):
            new_row['role'] = ROLE_MAP[prefix]
        elif added > 0:
            new_row['role'] = ROLE_MAP[prefix]

        used_emails.add(key)
        out_rows.append(new_row)
        added += 1

    if added == 0:
        # All prefixes taken — include original if valid and not seen
        e = orig_email.lower()
        if '@' in e and e not in used_emails:
            used_emails.add(e)
            out_rows.append(dict(row))

print(f"Generated {len(out_rows)} contacts (avg {len(out_rows)/len(rows):.1f}x per original)")

# Summary by niche
niches = {}
for r in out_rows:
    nk = r.get('niche_key') or 'unknown'
    niches[nk] = niches.get(nk, 0) + 1
print("\nPer niche:")
for nk in sorted(niches):
    print(f"  {nk:25s}  {niches[nk]:>5}")

# Summary by city
cities = {}
for r in out_rows:
    c = (r.get('city') or 'unknown').lower()
    cities[c] = cities.get(c, 0) + 1
print(f"\nPer city ({len(cities)} cities):")
for c in sorted(cities):
    print(f"  {c:25s}  {cities[c]:>5}")

with open(OUTPUT, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    writer.writerows(out_rows)

print(f"\nWritten {len(out_rows)} rows → {OUTPUT.name}")
