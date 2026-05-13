#!/usr/bin/env python3
"""
Generate 200 financial services leads with STRICT email quality:
- Must have a real first + last name
- Email must look personal (no generic prefixes)
- No free mail
- No info@, contact@, team@, office@, hello@, support@, admin@,
  sales@, mail@, billing@, help@, service@, reception@, general@,
  inquiries@, info@, noreply@, webmaster@, accounts@, hr@, jobs@,
  marketing@, welcome@, connect@, engage@, grow@, media@, digital@
"""
import json, csv, re, os

SRC   = os.path.join(os.path.dirname(__file__), 'usa_crm_import.json')
OUT   = os.path.join(os.path.dirname(__file__), 'brevo_financial_clean.csv')
GAP6  = os.path.join(os.path.dirname(__file__), 'usa_crm_gap6.json')

# ── filters ──────────────────────────────────────────────────────────
FREE_MAIL = {
    'yahoo.com','gmail.com','hotmail.com','outlook.com','aol.com',
    'icloud.com','live.com','msn.com','yahoo.co.uk','hotmail.co.uk'
}
BLOCKED_PREFIX = {
    'info','contact','team','office','hello','support','admin','sales',
    'mail','billing','help','service','noreply','no-reply','webmaster',
    'postmaster','accounts','marketing','hr','jobs','careers','reception',
    'general','inquiries','inquiry','enquiry','enquiries','welcome',
    'connect','engage','grow','media','digital','news','press','pr',
    'legal','compliance','operations','ops','finance','accounting',
    'customerservice','cs','care','feedback','request','quote'
}

TOP_STATES = {
    'California','Texas','Florida','New York','Illinois',
    'Georgia','Pennsylvania','Ohio','North Carolina','Michigan'
}
NICHE_SCORE = {
    'law_firms':6,'real_estate':5,'financial_services':5,'health':4,
    'automotive':3,'education':3,'events_weddings':2,'home_services':2,
    'restaurants':2,'beauty':2,'tourism':2,'smb':1,'local_specialist':1,
    'wine_agriculture':1
}
STATE_CAP  = 20
TARGET     = 200

# ── load gap6 bonus set ───────────────────────────────────────────────
gap6_emails = set()
if os.path.exists(GAP6):
    with open(GAP6, encoding='utf-8', errors='replace') as f:
        for rec in json.load(f):
            e = (rec.get('email') or '').strip().lower()
            if e: gap6_emails.add(e)

def looks_personal(local: str) -> bool:
    """Return True if the local part looks like a person's name."""
    # Must be at least 2 chars
    if len(local) < 2:
        return False
    # Reject known generic prefixes (exact match on the whole local part
    # OR local starts with a blocked word followed by nothing or a digit)
    low = local.lower()
    # Exact blocked prefix match
    if low in BLOCKED_PREFIX:
        return False
    # Starts with a blocked word (e.g. "info2", "sales_dept")
    for bp in BLOCKED_PREFIX:
        if low.startswith(bp) and (len(low) == len(bp) or not low[len(bp)].isalpha()):
            return False
    # Must contain at least one letter sequence that could be a name
    # (blocks things like "123", "nwm2024", pure acronyms < 3 chars)
    letters_only = re.sub(r'[^a-z]', '', low)
    if len(letters_only) < 3:
        return False
    return True

def score(rec, notes, gap6_emails):
    email  = (rec.get('email') or '').strip().lower()
    local  = email.split('@')[0] if '@' in email else ''
    domain = email.split('@')[1] if '@' in email else ''
    niche  = notes.get('niche', '')
    state  = notes.get('state', '')
    website= (rec.get('notes') or '')  # reused field for website flag

    s = NICHE_SCORE.get(niche, 0)
    if domain and domain not in FREE_MAIL:
        s += 2   # business domain
    has_website = bool(notes.get('website') or notes.get('page'))
    if has_website:
        s += 2
    if rec.get('phone'):
        s += 1
    if state in TOP_STATES:
        s += 1
    if email in gap6_emails:
        s += 2
    return s

# ── main ─────────────────────────────────────────────────────────────
with open(SRC, encoding='utf-8', errors='replace') as f:
    raw = json.load(f)

candidates = []
seen_emails = set()

for rec in raw:
    try:
        notes_raw = rec.get('notes') or '{}'
        notes = json.loads(notes_raw) if isinstance(notes_raw, str) else notes_raw
    except Exception:
        notes = {}

    niche = notes.get('niche', '')
    if niche != 'financial_services':
        continue

    email = (rec.get('email') or '').strip().lower()
    if not email or email in seen_emails:
        continue

    domain = email.split('@')[1] if '@' in email else ''
    local  = email.split('@')[0] if '@' in email else ''

    # ── hard filters ──
    if domain in FREE_MAIL:
        continue
    if not looks_personal(local):
        continue

    # ── must have a real name ──
    fname = (rec.get('name') or '').strip()
    # Try to split name field into first/last
    parts = fname.split()
    if len(parts) < 2:
        continue   # no full name → skip
    firstname = parts[0]
    lastname  = ' '.join(parts[1:])

    seen_emails.add(email)

    s = score(rec, notes, gap6_emails)
    candidates.append({
        'score':     s,
        'firstname': firstname,
        'lastname':  lastname,
        'email':     email,
        'company':   (rec.get('company') or '').strip(),
        'industry':  'Financial Services',
        'city':      notes.get('city', ''),
        'state':     notes.get('state', ''),
        'phone':     (rec.get('phone') or '').strip(),
    })

# ── sort & state-cap ─────────────────────────────────────────────────
candidates.sort(key=lambda x: -x['score'])

state_counts = {}
selected = []
for c in candidates:
    st = c['state']
    if state_counts.get(st, 0) >= STATE_CAP:
        continue
    state_counts[st] = state_counts.get(st, 0) + 1
    selected.append(c)
    if len(selected) >= TARGET:
        break

# ── write CSV ─────────────────────────────────────────────────────────
with open(OUT, 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=['SCORE','FIRSTNAME','LASTNAME','EMAIL','COMPANY','INDUSTRY','CITY','STATE','PHONE'])
    w.writeheader()
    for i, r in enumerate(selected, 1):
        w.writerow({k.upper() if k != 'score' else 'SCORE': v for k, v in r.items()} if False else r)

# Fix: write manually
with open(OUT, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['SCORE','FIRSTNAME','LASTNAME','EMAIL','COMPANY','INDUSTRY','CITY','STATE','PHONE'])
    for r in selected:
        writer.writerow([r['score'], r['firstname'], r['lastname'], r['email'],
                         r['company'], r['industry'], r['city'], r['state'], r['phone']])

# ── report ────────────────────────────────────────────────────────────
from collections import Counter
state_dist = Counter(r['state'] for r in selected)
score_dist = Counter(r['score'] for r in selected)

print(f"\n{'='*55}")
print(f"  Financial Services — Clean Personal Email List")
print(f"{'='*55}")
print(f"  Total leads selected : {len(selected)}")
print(f"  Pool size (financial): {len(candidates)} personal-email leads found")
print(f"\n  Score distribution:")
for sc in sorted(score_dist, reverse=True):
    print(f"    score {sc}: {score_dist[sc]}")
print(f"\n  Top states:")
for st, cnt in state_dist.most_common(10):
    print(f"    {st:<25} {cnt}")
print(f"\n  Sample emails:")
for r in selected[:10]:
    print(f"    {r['email']:<40} {r['company'][:35]}")
print(f"\n  Output: {OUT}")
print(f"{'='*55}\n")
