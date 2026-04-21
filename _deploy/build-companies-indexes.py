#!/usr/bin/env python3
"""build-companies-indexes.py
Generate an index.html in every city folder inside _deploy/companies/ so that
   /companies/temuco/ (etc.) lists the businesses in that city and stops 404-ing
   for direct directory hits.

Also rebuilds the /companies/ root index so it reflects the current city list.
"""
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COMPANIES = ROOT / "_deploy" / "companies"

CITY_LABEL = {
    "antofagasta": "Antofagasta",
    "arica": "Arica",
    "chillan": "Chillán", "chillán": "Chillán",
    "concepcion": "Concepción", "concepción": "Concepción",
    "copiapo": "Copiapó", "copiapó": "Copiapó",
    "coyhaique": "Coyhaique",
    "iquique": "Iquique",
    "la-serena": "La Serena",
    "osorno": "Osorno",
    "puerto-montt": "Puerto Montt",
    "punta-arenas": "Punta Arenas",
    "rancagua": "Rancagua",
    "santiago": "Santiago",
    "talca": "Talca",
    "temuco": "Temuco",
    "valdivia": "Valdivia",
    "valparaiso": "Valparaíso", "valparaíso": "Valparaíso",
    "unknown": "Unclassified",
    "usa": "United States",
}

def titlecase(slug):
    # "gasfiteria-don-luis" -> "Gasfitería Don Luis"
    s = slug.replace("-", " ").replace("_", " ")
    return " ".join(w.capitalize() for w in s.split())

def page_head(title, description):
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>{title} | NetWebMedia</title>
  <meta name="description" content="{description}">
  <link rel="canonical" href="https://netwebmedia.com/companies/">
  <style>
    * {{ box-sizing:border-box; margin:0; padding:0; }}
    body {{ background:#0b0d1a; color:#ccd6f6; font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif; padding:48px 20px 80px; }}
    .wrap {{ max-width:1100px; margin:0 auto; }}
    .back {{ color:#8892b0; font-size:13px; text-decoration:none; display:inline-flex; align-items:center; gap:6px; margin-bottom:20px; }}
    .back:hover {{ color:#22d3ee; }}
    h1 {{ font-size:clamp(26px,5vw,42px); background:linear-gradient(135deg,#22d3ee,#a29bfe); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; margin-bottom:12px; font-weight:800; }}
    .sub {{ color:#8892b0; font-size:15px; margin-bottom:32px; line-height:1.5; }}
    .stats {{ display:flex; gap:20px; flex-wrap:wrap; margin-bottom:32px; }}
    .stat {{ background:#12152b; border:1px solid #1e2340; border-radius:12px; padding:16px 22px; }}
    .stat-num {{ font-size:22px; font-weight:800; color:#e6f1ff; }}
    .stat-lbl {{ font-size:11px; color:#8892b0; text-transform:uppercase; letter-spacing:.08em; margin-top:2px; }}
    .grid {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:12px; }}
    .card {{ background:#12152b; border:1px solid #1e2340; border-radius:10px; padding:14px 18px; text-decoration:none; color:#ccd6f6; transition:border-color .2s,transform .1s; }}
    .card:hover {{ border-color:#22d3ee; color:#e6f1ff; transform:translateY(-1px); }}
    .card-name {{ font-size:14px; font-weight:600; }}
    .card-url {{ font-size:11px; color:#64748b; margin-top:3px; }}
  </style>
</head>
<body><div class="wrap">"""

def page_tail():
    return "</div></body></html>"

# ── Build city-level indexes ──────────────────────────────
cities_built = 0
total_biz = 0
all_cities = []

for city_dir in sorted(COMPANIES.iterdir()):
    if not city_dir.is_dir():
        continue
    city_slug = city_dir.name
    if city_slug == "usa":
        continue  # handled separately below (has nested state dirs)

    businesses = sorted([f for f in city_dir.glob("*.html") if f.name != "index.html"])
    if not businesses:
        continue

    label = CITY_LABEL.get(city_slug, titlecase(city_slug))
    all_cities.append((city_slug, label, len(businesses)))

    cards = []
    for b in businesses:
        biz_name = titlecase(b.stem)
        cards.append(
            f'    <a class="card" href="./{b.name}">\n'
            f'      <div class="card-name">{biz_name}</div>\n'
            f'      <div class="card-url">{b.name}</div>\n'
            f'    </a>'
        )

    html = (
        page_head(
            f"{label} — Business Audit",
            f"NetWebMedia digital audit of {len(businesses)} businesses in {label}, Chile."
        ) +
        f'<a class="back" href="../">&larr; All cities</a>\n'
        f'<h1>{label}</h1>\n'
        f'<p class="sub">Digital presence audit of {len(businesses)} businesses in {label}. Website, social, and local-search gaps reviewed.</p>\n'
        f'<div class="stats">\n'
        f'  <div class="stat"><div class="stat-num">{len(businesses)}</div><div class="stat-lbl">Businesses audited</div></div>\n'
        f'  <div class="stat"><div class="stat-num">{label}</div><div class="stat-lbl">City</div></div>\n'
        f'</div>\n'
        f'<div class="grid">\n' + "\n".join(cards) + "\n</div>\n" +
        page_tail()
    )
    (city_dir / "index.html").write_text(html, encoding="utf-8")
    cities_built += 1
    total_biz += len(businesses)

# ── Build USA index (by state) ────────────────────────────
usa_dir = COMPANIES / "usa"
if usa_dir.exists():
    states = sorted([d for d in usa_dir.iterdir() if d.is_dir()])
    state_cards = []
    usa_total_biz = 0
    for state in states:
        biz = [f for f in state.glob("*.html") if f.name != "index.html"]
        usa_total_biz += len(biz)
        state_cards.append(
            f'    <a class="card" href="./{state.name}/">\n'
            f'      <div class="card-name">{titlecase(state.name)}</div>\n'
            f'      <div class="card-url">{len(biz)} businesses</div>\n'
            f'    </a>'
        )
    html = (
        page_head("United States — Business Audit",
                  f"NetWebMedia digital audit of US businesses across {len(states)} states.") +
        f'<a class="back" href="../">&larr; All regions</a>\n'
        f'<h1>United States</h1>\n'
        f'<p class="sub">Digital audit of {usa_total_biz} businesses across {len(states)} states.</p>\n'
        f'<div class="grid">\n' + "\n".join(state_cards) + "\n</div>\n" +
        page_tail()
    )
    (usa_dir / "index.html").write_text(html, encoding="utf-8")

    # Also build state-level indexes
    for state in states:
        biz = sorted([f for f in state.glob("*.html") if f.name != "index.html"])
        cards = [
            f'    <a class="card" href="./{b.name}"><div class="card-name">{titlecase(b.stem)}</div><div class="card-url">{b.name}</div></a>'
            for b in biz
        ]
        state_label = titlecase(state.name)
        html = (
            page_head(f"{state_label} — Business Audit",
                      f"NetWebMedia audit of {len(biz)} businesses in {state_label}.") +
            f'<a class="back" href="../">&larr; All states</a>\n'
            f'<h1>{state_label}</h1>\n'
            f'<p class="sub">{len(biz)} businesses audited.</p>\n'
            f'<div class="grid">\n' + "\n".join(cards) + "\n</div>\n" +
            page_tail()
        )
        (state / "index.html").write_text(html, encoding="utf-8")

    cities_built += 1 + len(states)

# ── Build root /companies/ index ──────────────────────────
city_cards = []
for slug, label, count in sorted(all_cities, key=lambda x: -x[2]):
    city_cards.append(
        f'    <a class="card" href="./{slug}/">\n'
        f'      <div class="card-name">{label}</div>\n'
        f'      <div class="card-url">{count} businesses · Chile</div>\n'
        f'    </a>'
    )
if usa_dir.exists():
    city_cards.insert(0,
        f'    <a class="card" href="./usa/">\n'
        f'      <div class="card-name">🇺🇸 United States</div>\n'
        f'      <div class="card-url">50 states · full audit</div>\n'
        f'    </a>'
    )

html = (
    page_head("Business Audit Directory | NetWebMedia",
              f"NetWebMedia digital audits across {len(all_cities)} Chilean cities and the United States.") +
    f'<a class="back" href="/">&larr; netwebmedia.com</a>\n'
    f'<h1>Business Audits</h1>\n'
    f'<p class="sub">Digital presence reviews across {total_biz:,}+ Chilean businesses and {len(all_cities)} cities, plus the full US market.</p>\n'
    f'<div class="stats">\n'
    f'  <div class="stat"><div class="stat-num">{total_biz:,}+</div><div class="stat-lbl">Chilean businesses</div></div>\n'
    f'  <div class="stat"><div class="stat-num">{len(all_cities)}</div><div class="stat-lbl">Chilean cities</div></div>\n'
    f'  <div class="stat"><div class="stat-num">50</div><div class="stat-lbl">US states</div></div>\n'
    f'</div>\n'
    f'<div class="grid">\n' + "\n".join(city_cards) + "\n</div>\n" +
    page_tail()
)
(COMPANIES / "index.html").write_text(html, encoding="utf-8")

print(f"[OK] Built {cities_built} city-level indexes")
print(f"[OK] Built root /companies/ index with {len(all_cities)} Chilean cities + USA")
print(f"[OK] Total businesses indexed: {total_biz:,}")
