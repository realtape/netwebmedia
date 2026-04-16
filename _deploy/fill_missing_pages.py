#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Read crm_import.json (source of truth for all 1080 prospects) and generate
an HTML audit page for every record whose notes.page file does not yet exist
under _deploy/companies/.

Uses a simpler template than generate_company_pages.py because the newer
records (from rebalanced niches) lack the per-platform audit blob. Falls back
to niche-level pain_points + services from niches_regions.py.
"""
import os, json, io, sys, html as _html
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from niches_regions import NICHES, REGIONS, CITY_TO_REGION

ROOT = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(ROOT, "crm_import.json")

# Reverse lookup: niche name -> key
NAME_TO_KEY = {v["name"]: k for k, v in NICHES.items()}

def esc(s):
    return _html.escape(str(s)) if s is not None else ""

TPL = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{name} — Digital & Social Media Audit | NetWebMedia</title>
<meta name="description" content="Auditoría digital y social de {name} ({city}) — NetWebMedia.">
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f6f7fb;color:#1a1a2e;line-height:1.55}}
.container{{max-width:960px;margin:0 auto;padding:32px 20px 80px}}
header{{background:linear-gradient(135deg,#FF6B00 0%,#ff4e00 100%);color:#fff;padding:40px 28px;border-radius:14px;margin-bottom:28px;box-shadow:0 10px 30px rgba(255,107,0,.25)}}
header .crumbs{{opacity:.9;font-size:13px;margin-bottom:10px}}
header h1{{font-size:34px;margin:0 0 8px;line-height:1.15}}
header .meta{{font-size:14px;opacity:.92}}
.chips{{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}}
.chip{{background:rgba(255,255,255,.18);padding:5px 12px;border-radius:99px;font-size:12px;font-weight:600}}
section{{background:#fff;padding:26px;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.06);margin-bottom:20px}}
section h2{{font-size:20px;margin-bottom:16px;color:#FF6B00;border-bottom:2px solid #ffe3cc;padding-bottom:8px}}
.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}}
.cell{{background:#fafbff;padding:14px;border-radius:8px;border-left:4px solid #ddd}}
.cell .lbl{{font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#777;font-weight:600}}
.cell .val{{font-size:15px;margin-top:4px;word-break:break-word}}
ul.issues{{list-style:none}}
ul.issues li{{padding:12px 14px;margin-bottom:8px;background:#fff4ef;border-left:4px solid #FF6B00;border-radius:6px;font-size:14px}}
.pitch{{background:linear-gradient(135deg,#1a1a2e 0%,#2d2d5a 100%);color:#fff;padding:26px;border-radius:12px;margin-top:20px}}
.pitch h2{{color:#FFB770;border-color:rgba(255,183,112,.3)}}
.services{{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}}
.service{{background:rgba(255,107,0,.2);border:1px solid rgba(255,183,112,.35);padding:6px 12px;border-radius:6px;font-size:13px}}
.cta{{display:inline-block;background:#FF6B00;color:#fff;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;margin-top:16px}}
.back{{color:#FF6B00;text-decoration:none;font-size:13px}}
</style>
</head>
<body>
<div class="container">
  <p><a href="../index.html" class="back">← All {city} prospects</a></p>
  <header>
    <div class="crumbs">{region_name} · {city} · {niche_name}</div>
    <h1>{name}</h1>
    <div class="meta">Digital & Social Media Audit — prepared by NetWebMedia</div>
    <div class="chips">
      <span class="chip">{website_chip}</span>
      <span class="chip">{email_chip}</span>
      <span class="chip">{niche_name}</span>
    </div>
  </header>

  <section>
    <h2>Business snapshot</h2>
    <div class="grid">
      <div class="cell"><div class="lbl">Company</div><div class="val">{company}</div></div>
      <div class="cell"><div class="lbl">Email</div><div class="val">{email}</div></div>
      <div class="cell"><div class="lbl">Phone</div><div class="val">{phone}</div></div>
      <div class="cell"><div class="lbl">Website</div><div class="val">{website}</div></div>
      <div class="cell"><div class="lbl">City</div><div class="val">{city}</div></div>
      <div class="cell"><div class="lbl">Niche</div><div class="val">{niche_name}</div></div>
    </div>
  </section>

  <section>
    <h2>Niche-specific pain points we see across {niche_name} in {city}</h2>
    <ul class="issues">
      {pain_items}
    </ul>
  </section>

  <section>
    <h2>Why this matters for {name}</h2>
    <p style="font-size:14px;color:#555;">
      In 2025, Chilean buyers in <strong>{niche_name}</strong> research online first and choose
      the business with the strongest digital presence — professional website, active social,
      visible reviews, and fast WhatsApp response. The pain points above are the most common
      gaps we find in audits of {niche_name} businesses in {region_name}. Fixing even two of
      them typically lifts qualified leads by 20–40% within the first 90 days.
    </p>
  </section>

  <div class="pitch">
    <h2>NetWebMedia proposal for {name}</h2>
    <p style="font-size:15px;opacity:.95;">Services matched to {niche_name}:</p>
    <div class="services">{service_chips}</div>
    <p style="margin-top:18px;font-size:14px;opacity:.9;">
      Typical engagement: <strong>$997/mo Growth retainer</strong>
      (AI Website + Social + CRM + Ads) or <strong>$497/mo Starter</strong>
      (social + CRM only). Fractional CMO tier at $1,997/mo available.
    </p>
    <a class="cta" href="https://netwebmedia.com/contact">Book a 20-minute strategy call →</a>
  </div>
</div>
</body>
</html>
"""

def render(rec, notes):
    niche_name = notes.get("niche") or "Local Business"
    niche_key = NAME_TO_KEY.get(niche_name, "smb")
    niche = NICHES.get(niche_key, NICHES["smb"])
    city = notes.get("city") or "Chile"
    # Normalize city for region lookup (lowercase, no accents approximation)
    city_slug = city.lower().replace(" ", "-")
    region_key = CITY_TO_REGION.get(city_slug, "metropolitana")
    region = REGIONS.get(region_key, {"name": "Chile"})

    website = notes.get("website") or rec.get("website") or ""
    email = rec.get("email") or ""
    phone = rec.get("phone") or "—"
    company = rec.get("company") or rec.get("name") or ""

    pain_items = "\n      ".join(f"<li>{esc(p)}</li>" for p in niche["pain_points"])
    service_chips = "".join(f'<span class="service">{esc(s)}</span>' for s in niche["services"])

    return TPL.format(
        name=esc(rec["name"]),
        company=esc(company),
        email=esc(email) if email else "Not found",
        phone=esc(phone),
        website=esc(website) if website else "No website",
        website_chip="Website found" if website else "No website",
        email_chip="Email on file" if email else "No email",
        city=esc(city),
        region_name=esc(region.get("name", "Chile")),
        niche_name=esc(niche_name),
        pain_items=pain_items,
        service_chips=service_chips,
    )


def main():
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        records = json.load(f)

    generated = 0
    skipped = 0
    errors = 0
    for rec in records:
        try:
            notes = json.loads(rec["notes"]) if isinstance(rec.get("notes"), str) else (rec.get("notes") or {})
        except Exception:
            errors += 1
            continue
        page = notes.get("page")
        if not page:
            continue
        full_path = os.path.join(ROOT, page.replace("/", os.sep))
        if os.path.exists(full_path):
            skipped += 1
            continue
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        try:
            html = render(rec, notes)
            with open(full_path, "w", encoding="utf-8") as fh:
                fh.write(html)
            generated += 1
        except Exception as e:
            print(f"[err] {rec.get('name')}: {e}")
            errors += 1

    print(f"generated={generated} already_existed={skipped} errors={errors} total={len(records)}")


if __name__ == "__main__":
    main()
