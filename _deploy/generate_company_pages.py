#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate individual HTML prospect page per business + CRM import SQL.
Reads 17 city reports, re-extracts 680 businesses, classifies by niche,
audits social media presence, writes:
  - _deploy/companies/{city}/{slug}.html   (one per business)
  - _deploy/companies/index.html           (browseable hub, filters by city+niche)
  - _deploy/crm_import.sql                 (bulk INSERT for NWM contacts table)
  - _deploy/crm_import.json                (JSON payload for POST /api/?r=contacts)
"""
import os
import re
import json
import html as _html
from extract_to_xlsx import (
    extract_businesses_from_html, CITIES, CITY_DISPLAY, DEPLOY_DIR
)
from niches_regions import (
    NICHES, NICHE_ORDER, REGIONS, CITY_TO_REGION, classify_niche
)

OUT_DIR = os.path.join(DEPLOY_DIR, "companies")
os.makedirs(OUT_DIR, exist_ok=True)


# ------------------------------------------------------------
# Social media audit — parse card HTML / gaps for platform signals
# ------------------------------------------------------------
SOCIAL_PLATFORMS = [
    ("facebook", r"facebook\.com|fb\.com|\bFB\b|Facebook"),
    ("instagram", r"instagram\.com|\bIG\b|Instagram"),
    ("tiktok",    r"tiktok\.com|TikTok"),
    ("youtube",   r"youtube\.com|youtu\.be|YouTube"),
    ("linkedin",  r"linkedin\.com|LinkedIn"),
    ("whatsapp",  r"wa\.me|whatsapp|WhatsApp"),
]


def audit_social(biz: dict, card_html: str = "") -> dict:
    """Return a detailed social audit dict from biz fields + raw card HTML."""
    blob = " ".join(str(biz.get(k, "")) for k in ("tech_stack","gaps","description","tags","contact_raw","website")) + " " + card_html
    low = blob.lower()
    present = {k: bool(re.search(p, blob, re.I)) for k, p in SOCIAL_PLATFORMS}

    # Pixel / analytics signals from already-parsed tags
    has_ga4  = bool(re.search(r"GA4|gtag|Google Analytics", blob, re.I))
    has_pixel = bool(re.search(r"FB Pixel|Meta Pixel|Facebook Pixel", blob, re.I))
    has_gtm  = bool(re.search(r"GTM|Tag Manager", blob, re.I))

    issues = []
    if not present["instagram"]:
        issues.append("No Instagram presence — invisible to under-35 Chilean market")
    if not present["facebook"]:
        issues.append("No Facebook Page — zero retargeting surface area")
    if not present["tiktok"]:
        issues.append("No TikTok — missing the fastest-growing reach channel in Chile 2025")
    if not present["whatsapp"]:
        issues.append("No WhatsApp Business link — leads wait, then choose competitor")
    if not has_pixel:
        issues.append("No Meta Pixel installed — cannot build warm retargeting audiences")
    if not has_ga4:
        issues.append("No GA4 — content decisions are pure guesswork, no ROI attribution")
    if "no email" in low or biz.get("email") in (None, "", "Not found"):
        issues.append("No discoverable business email — cold outreach friction, lost B2B leads")
    if "gmail" in low or "hotmail" in low or "yahoo" in low:
        issues.append("Public free-mail address (Gmail/Hotmail) — erodes trust vs custom domain")

    return {
        "platforms": present,
        "has_ga4": has_ga4,
        "has_pixel": has_pixel,
        "has_gtm": has_gtm,
        "issues": issues[:7],  # top 7
    }


def slugify(s: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9\s\-]", "", s).strip().lower()
    s = re.sub(r"\s+", "-", s)
    return s[:60] or "business"


def esc(s) -> str:
    return _html.escape(str(s)) if s is not None else ""


# ------------------------------------------------------------
# Per-company HTML template (social-media focused audit)
# ------------------------------------------------------------
COMPANY_TPL = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{name} — Digital & Social Media Audit | NetWebMedia</title>
<meta name="description" content="Auditoría social + web de {name} ({city}) por NetWebMedia. {vertical_name} / {niche_name}.">
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ font-family: -apple-system, Segoe UI, Roboto, sans-serif; background: #f6f7fb; color: #1a1a2e; line-height: 1.55; }}
.container {{ max-width: 960px; margin: 0 auto; padding: 32px 20px 80px; }}
header {{ background: linear-gradient(135deg, #FF6B00 0%, #ff4e00 100%); color: #fff; padding: 40px 28px; border-radius: 14px; margin-bottom: 28px; box-shadow: 0 10px 30px rgba(255,107,0,.25); }}
header .crumbs {{ opacity: .9; font-size: 13px; margin-bottom: 10px; }}
header h1 {{ font-size: 34px; margin: 0 0 8px; line-height: 1.15; }}
header .meta {{ font-size: 14px; opacity: .92; }}
.chips {{ display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }}
.chip {{ background: rgba(255,255,255,.18); padding: 5px 12px; border-radius: 99px; font-size: 12px; font-weight: 600; }}
section {{ background: #fff; padding: 26px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.06); margin-bottom: 20px; }}
section h2 {{ font-size: 20px; margin-bottom: 16px; color: #FF6B00; border-bottom: 2px solid #ffe3cc; padding-bottom: 8px; }}
.grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }}
.cell {{ background: #fafbff; padding: 14px; border-radius: 8px; border-left: 4px solid #ddd; }}
.cell.good {{ border-left-color: #27ae60; }}
.cell.bad  {{ border-left-color: #c0392b; background: #fdf2f2; }}
.cell .lbl {{ font-size: 11px; text-transform: uppercase; letter-spacing: .5px; color: #777; font-weight: 600; }}
.cell .val {{ font-size: 15px; margin-top: 4px; word-break: break-word; }}
ul.issues {{ list-style: none; }}
ul.issues li {{ padding: 12px 14px; margin-bottom: 8px; background: #fff4ef; border-left: 4px solid #FF6B00; border-radius: 6px; font-size: 14px; }}
.pitch {{ background: linear-gradient(135deg,#1a1a2e 0%,#2d2d5a 100%); color: #fff; padding: 26px; border-radius: 12px; margin-top: 20px; }}
.pitch h2 {{ color: #FFB770; border-color: rgba(255,183,112,.3); }}
.services {{ display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }}
.service {{ background: rgba(255,107,0,.2); border: 1px solid rgba(255,183,112,.35); padding: 6px 12px; border-radius: 6px; font-size: 13px; }}
.cta {{ display: inline-block; background: #FF6B00; color: #fff; padding: 14px 28px; border-radius: 8px; font-weight: 700; text-decoration: none; margin-top: 16px; }}
.back {{ color: #FF6B00; text-decoration: none; font-size: 13px; }}
.platforms {{ display: flex; gap: 10px; flex-wrap: wrap; }}
.platforms .plat {{ padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; }}
.platforms .on  {{ background: #e8f8ef; color: #1e7e34; border: 1px solid #b7e2c4; }}
.platforms .off {{ background: #fdecec; color: #a23;     border: 1px solid #f4b4b4; }}
</style>
</head>
<body>
<div class="container">
  <p><a href="../index.html" class="back">← All {city} prospects</a></p>
  <header>
    <div class="crumbs">{region_name} · {city} · {niche_icon} {niche_name}</div>
    <h1>{name}</h1>
    <div class="meta">Digital & Social Media Audit — prepared by NetWebMedia</div>
    <div class="chips">
      <span class="chip">{website_status}</span>
      <span class="chip">{platform_count}/6 social platforms</span>
      <span class="chip">{issue_count} key gaps</span>
    </div>
  </header>

  <section>
    <h2>Business snapshot</h2>
    <div class="grid">
      <div class="cell"><div class="lbl">Website</div><div class="val">{website}</div></div>
      <div class="cell"><div class="lbl">Email</div><div class="val">{email}</div></div>
      <div class="cell"><div class="lbl">Phone</div><div class="val">{phone}</div></div>
      <div class="cell"><div class="lbl">Address</div><div class="val">{address}</div></div>
      <div class="cell"><div class="lbl">Tech stack</div><div class="val">{tech_stack}</div></div>
      <div class="cell"><div class="lbl">Niche</div><div class="val">{niche_name}</div></div>
    </div>
  </section>

  <section>
    <h2>Social media footprint</h2>
    <div class="platforms">{platform_badges}</div>
    <div class="grid" style="margin-top:18px;">
      <div class="cell {ga4_cls}"><div class="lbl">Google Analytics 4</div><div class="val">{ga4_txt}</div></div>
      <div class="cell {pixel_cls}"><div class="lbl">Meta Pixel</div><div class="val">{pixel_txt}</div></div>
      <div class="cell {gtm_cls}"><div class="lbl">Tag Manager</div><div class="val">{gtm_txt}</div></div>
    </div>
  </section>

  <section>
    <h2>Social media problems we'll fix</h2>
    <ul class="issues">
      {issue_items}
    </ul>
  </section>

  <section>
    <h2>Niche-specific pain points</h2>
    <ul class="issues">
      {niche_pains}
    </ul>
  </section>

  <section>
    <h2>Digital gaps detected in their current setup</h2>
    <p style="font-size:14px;color:#555;">{gaps_or_desc}</p>
  </section>

  <div class="pitch">
    <h2>NetWebMedia proposal for {name}</h2>
    <p style="font-size:15px;opacity:.95;">Based on the audit above, here are the services that close the gap fastest:</p>
    <div class="services">{service_chips}</div>
    <p style="margin-top:18px;font-size:14px;opacity:.9;">Typical engagement for {niche_name}: <strong>$997/mo Growth retainer</strong> (AI Website + Social + CRM + Ads) or <strong>$497/mo Starter</strong> (social + CRM only). AI Fractional CMO from <strong>$249/mo Starter · $999/mo Growth · $2,499/mo Scale</strong>.</p>
    <a class="cta" href="https://netwebmedia.com/contact">Book a 20-minute strategy call →</a>
  </div>
</div>
</body>
</html>
"""


def build_company_html(biz: dict, niche_key: str, region_key: str, audit: dict) -> str:
    niche = NICHES[niche_key]
    region = REGIONS.get(region_key, {"name": "Chile"})

    # Platform badges
    badges = []
    for plat, _ in SOCIAL_PLATFORMS:
        on = audit["platforms"].get(plat, False)
        badges.append(f'<span class="plat {"on" if on else "off"}">{plat.title()} {"✓" if on else "✕"}</span>')
    platform_count = sum(1 for v in audit["platforms"].values() if v)

    issue_items = "\n      ".join(f"<li>{esc(i)}</li>" for i in audit["issues"]) or "<li>Solid baseline — focus on scaling content & paid.</li>"
    niche_pains = "\n      ".join(f"<li>{esc(p)}</li>" for p in niche["pain_points"])
    service_chips = "".join(f'<span class="service">{esc(s)}</span>' for s in niche["services"])

    gaps_or_desc = biz.get("gaps") or biz.get("description") or "Full audit notes available on request."

    def flag(bit: bool, yes: str, no: str):
        return ("good", yes) if bit else ("bad", no)

    ga4_cls, ga4_txt = flag(audit["has_ga4"], "Installed", "Not installed — flying blind")
    pixel_cls, pixel_txt = flag(audit["has_pixel"], "Installed", "Not installed — no retargeting")
    gtm_cls, gtm_txt = flag(audit["has_gtm"], "Installed", "Not installed — no event tracking")

    return COMPANY_TPL.format(
        name=esc(biz["name"]),
        city=esc(biz["city"]),
        region_name=esc(region.get("name", "Chile")),
        vertical_name=esc(biz.get("vertical", "")),
        niche_name=esc(niche["name"]),
        niche_icon=niche["icon"],
        website_status=esc(biz.get("website_status", "")),
        website=esc(biz.get("website", "") or "No website"),
        email=esc(biz.get("email") or "Not found"),
        phone=esc(biz.get("phone") or "—"),
        address=esc(biz.get("address") or "—"),
        tech_stack=esc(biz.get("tech_stack") or "—"),
        platform_badges=" ".join(badges),
        platform_count=platform_count,
        issue_count=len(audit["issues"]),
        ga4_cls=ga4_cls, ga4_txt=ga4_txt,
        pixel_cls=pixel_cls, pixel_txt=pixel_txt,
        gtm_cls=gtm_cls, gtm_txt=gtm_txt,
        issue_items=issue_items,
        niche_pains=niche_pains,
        gaps_or_desc=esc(gaps_or_desc),
        service_chips=service_chips,
    )


# ------------------------------------------------------------
# Main run
# ------------------------------------------------------------
def main():
    all_records = []
    for city in CITIES:
        fname = f"{city}-prospects-report.html"
        path = os.path.join(DEPLOY_DIR, fname)
        if not os.path.exists(path):
            print(f"[skip] {fname}")
            continue
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            html = f.read()
        biz_list = extract_businesses_from_html(html, city)
        print(f"[{city}] {len(biz_list)} businesses")

        city_dir = os.path.join(OUT_DIR, city)
        os.makedirs(city_dir, exist_ok=True)

        for biz in biz_list:
            niche_key = classify_niche(biz["name"], biz.get("vertical", ""))
            region_key = CITY_TO_REGION.get(city, "metropolitana")
            audit = audit_social(biz)
            slug = slugify(biz["name"])
            page_html = build_company_html(biz, niche_key, region_key, audit)
            page_path = os.path.join(city_dir, f"{slug}.html")
            # avoid slug collisions
            n = 1
            while os.path.exists(page_path):
                n += 1
                page_path = os.path.join(city_dir, f"{slug}-{n}.html")
            with open(page_path, "w", encoding="utf-8") as f:
                f.write(page_html)

            rel = os.path.relpath(page_path, DEPLOY_DIR).replace("\\", "/")
            all_records.append({
                "city": city,
                "city_name": CITY_DISPLAY.get(city, city),
                "region": region_key,
                "region_name": REGIONS.get(region_key, {}).get("name", ""),
                "niche": niche_key,
                "niche_name": NICHES[niche_key]["name"],
                "name": biz["name"],
                "email": biz.get("email") or "Not found",
                "phone": biz.get("phone") or "",
                "website": biz.get("website") or "",
                "website_status": biz.get("website_status", ""),
                "address": biz.get("address") or "",
                "page": rel,
                "issues": audit["issues"],
                "platforms_on": [k for k,v in audit["platforms"].items() if v],
                "platforms_off": [k for k,v in audit["platforms"].items() if not v],
                "has_ga4": audit["has_ga4"],
                "has_pixel": audit["has_pixel"],
            })

    # -------- Index page --------
    write_index(all_records)
    # -------- CRM import files --------
    write_crm_sql(all_records)
    write_crm_json(all_records)

    print(f"\n=== DONE ===")
    print(f"Total companies: {len(all_records)}")
    print(f"Per-company HTML: {OUT_DIR}")
    print(f"Index: {os.path.join(OUT_DIR,'index.html')}")
    print(f"CRM SQL: {os.path.join(DEPLOY_DIR,'crm_import.sql')}")
    print(f"CRM JSON: {os.path.join(DEPLOY_DIR,'crm_import.json')}")


def write_index(records):
    by_city = {}
    for r in records:
        by_city.setdefault(r["city_name"], []).append(r)

    rows_html = []
    for city_name in sorted(by_city.keys()):
        for r in by_city[city_name]:
            bad = len(r["issues"])
            rows_html.append(
                f'<tr data-city="{esc(city_name)}" data-niche="{r["niche"]}" data-region="{r["region"]}">'
                f'<td>{esc(city_name)}</td>'
                f'<td>{NICHES[r["niche"]]["icon"]} {NICHES[r["niche"]]["name"]}</td>'
                f'<td><a href="{esc(r["page"]).replace("companies/","")}">{esc(r["name"])}</a></td>'
                f'<td>{esc(r["website_status"])}</td>'
                f'<td>{esc(r["email"])}</td>'
                f'<td>{len(r["platforms_on"])}/6</td>'
                f'<td style="color:{"#c0392b" if bad>=5 else "#e67e22" if bad>=3 else "#27ae60"}">{bad}</td>'
                f'</tr>'
            )

    niche_opts = "".join(f'<option value="{k}">{NICHES[k]["icon"]} {NICHES[k]["name"]}</option>' for k in NICHE_ORDER)
    city_opts  = "".join(f'<option value="{c}">{c}</option>' for c in sorted(by_city.keys()))
    region_opts = "".join(f'<option value="{k}">{v["name"]}</option>' for k,v in REGIONS.items())

    # Niche/region coverage matrix
    matrix_rows = []
    for rk, r in REGIONS.items():
        cells = []
        for nk in NICHE_ORDER:
            on = nk in r["niches"]
            cells.append(f'<td style="text-align:center;background:{"#e8f8ef" if on else "#f3f3f3"};color:{"#1e7e34" if on else "#bbb"};font-weight:{"700" if on else "400"}">{"✓" if on else "·"}</td>')
        matrix_rows.append(f'<tr><td style="font-weight:600;white-space:nowrap">{esc(r["name"])}</td>{"".join(cells)}</tr>')
    matrix_header = "".join(f'<th title="{NICHES[k]["name"]}">{NICHES[k]["icon"]}</th>' for k in NICHE_ORDER)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>NetWebMedia Chile — 680 Prospects (10 niches × 16 regions)</title>
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f6f7fb;color:#1a1a2e;padding:24px}}
.wrap{{max-width:1320px;margin:0 auto}}
h1{{background:linear-gradient(135deg,#FF6B00,#ff4e00);color:#fff;padding:28px;border-radius:12px;margin-bottom:20px}}
.filters{{background:#fff;padding:16px;border-radius:10px;margin-bottom:16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center}}
.filters select,.filters input{{padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px}}
.card{{background:#fff;border-radius:10px;padding:0;overflow:hidden;margin-bottom:20px;box-shadow:0 1px 3px rgba(0,0,0,.06)}}
.card h2{{padding:16px 20px;background:#f9faff;font-size:16px;border-bottom:1px solid #eee}}
table{{width:100%;border-collapse:collapse;font-size:13px}}
th,td{{padding:10px 14px;text-align:left;border-bottom:1px solid #f0f0f0}}
th{{background:#fafbff;font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:#666;position:sticky;top:0}}
tr:hover{{background:#fffaf5}}
a{{color:#FF6B00;text-decoration:none}}
a:hover{{text-decoration:underline}}
.stats{{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px}}
.stat{{background:#fff;padding:18px;border-radius:10px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.06)}}
.stat .n{{font-size:26px;font-weight:700;color:#FF6B00}}
.stat .l{{font-size:12px;color:#666;text-transform:uppercase;letter-spacing:.5px}}
</style>
</head>
<body>
<div class="wrap">
  <h1>NetWebMedia Chile — {len(records)} Prospects<br><span style="font-size:14px;opacity:.9">10 niches × 16 regions · social media + web audit per company</span></h1>

  <div class="stats">
    <div class="stat"><div class="n">{len(records)}</div><div class="l">Companies audited</div></div>
    <div class="stat"><div class="n">{len(by_city)}</div><div class="l">Cities</div></div>
    <div class="stat"><div class="n">16</div><div class="l">Regions</div></div>
    <div class="stat"><div class="n">10</div><div class="l">Niches</div></div>
    <div class="stat"><div class="n">{sum(1 for r in records if r['email'] not in ('','Not found'))}</div><div class="l">Email found</div></div>
    <div class="stat"><div class="n">{sum(1 for r in records if r['has_pixel'])}</div><div class="l">Have Meta Pixel</div></div>
  </div>

  <div class="card">
    <h2>Region × Niche coverage matrix (6 most-relevant niches per region)</h2>
    <div style="overflow-x:auto"><table>
      <thead><tr><th>Region</th>{matrix_header}</tr></thead>
      <tbody>{"".join(matrix_rows)}</tbody>
    </table></div>
  </div>

  <div class="filters">
    <input id="q" placeholder="Search name…" style="flex:1;min-width:200px">
    <select id="fCity"><option value="">All cities</option>{city_opts}</select>
    <select id="fRegion"><option value="">All regions</option>{region_opts}</select>
    <select id="fNiche"><option value="">All niches</option>{niche_opts}</select>
    <span id="count" style="margin-left:auto;color:#666;font-size:13px"></span>
  </div>

  <div class="card">
    <table id="tbl">
      <thead><tr>
        <th>City</th><th>Niche</th><th>Company</th><th>Website</th><th>Email</th><th>Social</th><th>Gaps</th>
      </tr></thead>
      <tbody>{"".join(rows_html)}</tbody>
    </table>
  </div>
</div>

<script>
const q=document.getElementById('q'),fC=document.getElementById('fCity'),fR=document.getElementById('fRegion'),fN=document.getElementById('fNiche'),cnt=document.getElementById('count');
const rows=[...document.querySelectorAll('#tbl tbody tr')];
function apply(){{
  const qv=q.value.toLowerCase(),c=fC.value,r=fR.value,n=fN.value;let shown=0;
  rows.forEach(row=>{{
    const match=(!c||row.dataset.city===c)&&(!r||row.dataset.region===r)&&(!n||row.dataset.niche===n)&&(!qv||row.textContent.toLowerCase().includes(qv));
    row.style.display=match?'':'none';if(match)shown++;
  }});
  cnt.textContent=shown+' / '+rows.length+' companies';
}}
[q,fC,fR,fN].forEach(e=>e.addEventListener('input',apply));apply();
</script>
</body></html>"""
    with open(os.path.join(OUT_DIR, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)


def sql_esc(s) -> str:
    if s is None: return "NULL"
    return "'" + str(s).replace("\\","\\\\").replace("'","''") + "'"


def _clean_phone(p):
    """Enforce schema VARCHAR(50) and reject non-phone strings."""
    if not p: return None
    p = str(p).strip()
    # Must contain at least 6 digits to be a real phone
    digits = re.sub(r"\D", "", p)
    if len(digits) < 6:
        return None
    return p[:50]


def _clean_truncate(s, maxlen):
    if s is None: return None
    s = str(s).strip()
    return s[:maxlen] if s else None


def write_crm_sql(records):
    """Bulk INSERT matching NetWebMedia contacts table schema."""
    lines = [
        "-- NetWebMedia CRM bulk import",
        "-- Generated from _deploy/companies/",
        "-- Target table: contacts (see crm-vanilla/api/schema.sql)",
        "USE `webmed6_crm`;",
        "",
    ]
    for r in records:
        name = _clean_truncate(r["name"], 255)
        email = _clean_truncate(r["email"], 255) if r["email"] not in ("", "Not found") else None
        phone = _clean_phone(r["phone"])
        company = _clean_truncate(r["name"], 255)
        role = _clean_truncate(f"{NICHES[r['niche']]['name']} — {r['city_name']}", 255)
        # Compact notes JSON the NWM CRM can parse
        notes = json.dumps({
            "city": r["city_name"],
            "region": r["region_name"],
            "niche": r["niche_name"],
            "website": r["website"],
            "website_status": r["website_status"],
            "address": r["address"],
            "page": r["page"],
            "issues": r["issues"],
            "platforms_on": r["platforms_on"],
            "platforms_off": r["platforms_off"],
            "has_ga4": r["has_ga4"],
            "has_pixel": r["has_pixel"],
        }, ensure_ascii=False)
        lines.append(
            "INSERT INTO `contacts` (`name`,`email`,`phone`,`company`,`role`,`status`,`value`,`notes`) VALUES ("
            f"{sql_esc(name)},{sql_esc(email)},{sql_esc(phone)},{sql_esc(company)},{sql_esc(role)},'lead',0.00,{sql_esc(notes)}"
            ");"
        )
    with open(os.path.join(DEPLOY_DIR, "crm_import.sql"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def write_crm_json(records):
    """JSON array for POST /api/?r=contacts loop, one object per row."""
    out = []
    for r in records:
        out.append({
            "name": _clean_truncate(r["name"], 255),
            "email": _clean_truncate(r["email"], 255) if r["email"] not in ("", "Not found") else None,
            "phone": _clean_phone(r["phone"]),
            "company": _clean_truncate(r["name"], 255),
            "role": _clean_truncate(f"{NICHES[r['niche']]['name']} — {r['city_name']}", 255),
            "status": "lead",
            "value": 0,
            "notes": json.dumps({
                "city": r["city_name"], "region": r["region_name"],
                "niche": r["niche_name"], "website": r["website"],
                "website_status": r["website_status"],
                "page": r["page"],
                "issues": r["issues"],
                "platforms_on": r["platforms_on"],
                "platforms_off": r["platforms_off"],
            }, ensure_ascii=False)
        })
    with open(os.path.join(DEPLOY_DIR, "crm_import.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
