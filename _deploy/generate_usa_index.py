#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build the USA prospecting hub: /companies/usa/index.html with 50-state grid +
filterable list of all 2,400 prospects. Also builds per-state index pages."""
import os, json, html as _html
from collections import defaultdict
from usa_config import STATES

ROOT = os.path.dirname(os.path.abspath(__file__))
USA_JSON = os.path.join(ROOT, "usa_crm_import.json")
OUT_ROOT = os.path.join(ROOT, "companies/usa")

def esc(s): return _html.escape(str(s)) if s else ""

NICHE_META = {
    "tourism":          ("Tourism & Hospitality","Turismo",   "#3498db", "🏔️"),
    "restaurants":      ("Restaurants & Gastronomy","Restaurantes","#e67e22","🍽️"),
    "health":           ("Health & Medical","Salud",          "#27ae60", "⚕️"),
    "beauty":           ("Beauty & Wellness","Belleza",       "#e91e63", "💅"),
    "smb":              ("Small/Medium Business","Pymes",     "#9b59b6", "🏪"),
    "law_firms":        ("Law Firms & Legal","Legal",         "#1a1a2e", "⚖️"),
    "real_estate":      ("Real Estate & Property","Inmobiliaria","#c0392b","🏡"),
    "local_specialist": ("Local Specialist Services","Servicios Locales","#16a085","🔧"),
}

CSS = """
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f4f5f9;color:#1a1a2e;line-height:1.55}
.container{max-width:1280px;margin:0 auto;padding:28px 20px 80px}
.hero{background:linear-gradient(135deg,#FF6B00,#ff4e00);color:#fff;padding:48px 32px;border-radius:18px;margin-bottom:28px;box-shadow:0 20px 48px rgba(255,107,0,.28)}
.hero h1{font-size:40px;margin-bottom:10px;letter-spacing:-.5px}
.hero p{font-size:16px;opacity:.95;max-width:720px}
.hero .chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}
.hero .chip{background:rgba(255,255,255,.18);padding:8px 16px;border-radius:99px;font-size:13px;font-weight:600}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:28px}
.kpi{background:#fff;padding:20px;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.04);text-align:center}
.kpi .n{font-size:32px;font-weight:800;color:#FF6B00;line-height:1}
.kpi .l{font-size:11px;text-transform:uppercase;letter-spacing:.6px;color:#888;margin-top:6px;font-weight:700}
section{background:#fff;padding:26px;border-radius:14px;box-shadow:0 2px 6px rgba(0,0,0,.04);margin-bottom:22px}
section h2{font-size:22px;margin-bottom:18px;display:flex;align-items:center;gap:10px}
section h2::before{content:'';width:4px;height:24px;background:#FF6B00;border-radius:2px}
.state-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}
.state{display:block;text-decoration:none;color:inherit;background:#fafbff;padding:14px 16px;border-radius:10px;border:1px solid #eee;transition:all .15s}
.state:hover{background:#fff4ef;border-color:#FF6B00;transform:translateY(-2px);box-shadow:0 6px 18px rgba(255,107,0,.12)}
.state .code{font-size:11px;color:#999;font-weight:700;letter-spacing:.5px}
.state .name{font-size:15px;font-weight:700;margin:2px 0 4px}
.state .count{font-size:12px;color:#FF6B00;font-weight:600}
.filters{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px}
.filter{padding:6px 14px;border-radius:99px;background:#eef;font-size:12px;font-weight:700;cursor:pointer;border:1px solid transparent;transition:all .12s;user-select:none}
.filter.active{background:#FF6B00;color:#fff;border-color:#FF6B00}
.filter:hover{border-color:#FF6B00}
input[type=search]{width:100%;padding:12px 16px;border:1px solid #ddd;border-radius:10px;font-size:14px;margin-bottom:14px;font-family:inherit}
input[type=search]:focus{outline:none;border-color:#FF6B00;box-shadow:0 0 0 3px rgba(255,107,0,.15)}
.prospects{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
.prospect{background:#fafbff;padding:14px 16px;border-radius:10px;border-left:4px solid #FF6B00;text-decoration:none;color:inherit;transition:all .15s;display:block}
.prospect:hover{background:#fff;box-shadow:0 8px 22px rgba(0,0,0,.07);transform:translateX(2px)}
.prospect .name{font-size:14px;font-weight:700;margin-bottom:2px}
.prospect .where{font-size:12px;color:#666}
.prospect .niche{display:inline-block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;padding:2px 8px;border-radius:99px;color:#fff;margin-top:6px}
.niche-legend{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px;font-size:12px}
.niche-legend .leg{display:flex;align-items:center;gap:6px}
.niche-legend .sw{width:12px;height:12px;border-radius:3px}
.showing{font-size:13px;color:#666;margin-bottom:12px}
footer{text-align:center;color:#999;font-size:12px;margin-top:30px}
@media(max-width:640px){.hero h1{font-size:28px}.prospects{grid-template-columns:1fr}}
"""

def top_index():
    with open(USA_JSON, "r", encoding="utf-8") as f:
        contacts = json.load(f)

    # Build state/niche indices
    state_count = defaultdict(int)
    niche_count = defaultdict(int)
    items = []
    for c in contacts:
        try: m = json.loads(c.get("notes") or "{}")
        except: continue
        state_name = m.get("state","")
        niche = m.get("niche","")
        page = m.get("page","")
        if not page: continue
        rel = page[len("companies/usa/"):] if page.startswith("companies/usa/") else page
        state_count[state_name] += 1
        niche_count[niche] += 1
        items.append({
            "company": c.get("company",""),
            "city": m.get("city",""),
            "state": state_name,
            "state_code": m.get("state_code",""),
            "niche": niche,
            "href": rel,
        })

    total = len(items)
    total_states = len(state_count)

    # State grid
    state_html = ""
    for sk, s in STATES.items():
        cnt = state_count.get(s["name"], 0)
        state_html += (f'<a class="state" href="{sk.replace("_","-")}/index.html">'
                       f'<div class="code">{s["code"]}</div>'
                       f'<div class="name">{esc(s["name"])}</div>'
                       f'<div class="count">{cnt} prospects</div></a>')

    # Niche legend + filter chips
    legend_html = '<span class="leg"><span class="sw" style="background:#888"></span>All</span>'
    for k,(en,es,color,icon) in NICHE_META.items():
        legend_html += f'<span class="leg"><span class="sw" style="background:{color}"></span>{icon} {esc(en)} ({niche_count.get(k,0)})</span>'

    filters_html = '<span class="filter active" data-n="all">All ' + str(total) + '</span>'
    for k,(en,_,_,icon) in NICHE_META.items():
        filters_html += f'<span class="filter" data-n="{k}">{icon} {esc(en)}</span>'

    # Full prospect list (only first 300 rendered, rest filtered by JS)
    rows = ""
    for it in items:
        meta = NICHE_META.get(it["niche"], ("","","#888",""))
        rows += (f'<a class="prospect" data-niche="{esc(it["niche"])}" data-state="{esc(it["state"])}" '
                 f'data-search="{esc((it["company"]+" "+it["city"]+" "+it["state"]).lower())}" '
                 f'href="{esc(it["href"])}">'
                 f'<div class="name">{esc(it["company"])}</div>'
                 f'<div class="where">{esc(it["city"])}, {esc(it["state_code"])} · {esc(it["state"])}</div>'
                 f'<span class="niche" style="background:{meta[2]}">{meta[3]} {esc(meta[0])}</span>'
                 f'</a>')

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>USA Prospecting — {total} leads across {total_states} states | NetWebMedia</title>
<meta name="description" content="NetWebMedia USA prospecting hub — {total} pre-audited SMB leads across 50 states and 8 niches.">
<style>{CSS}</style>
</head>
<body>
<div class="container">
  <div class="hero">
    <h1>USA Prospecting Hub</h1>
    <p>Pre-audited growth opportunities across the United States — every lead comes with a deep digital audit page showing gaps, revenue uplift projection, and matched services.</p>
    <div class="chips">
      <span class="chip">🇺🇸 {total} prospects</span>
      <span class="chip">📍 {total_states} states</span>
      <span class="chip">🎯 8 niches</span>
      <span class="chip">📊 Interactive audits</span>
      <span class="chip">🌐 EN / ES bilingual</span>
    </div>
  </div>

  <div class="kpis">
    <div class="kpi"><div class="n">{total:,}</div><div class="l">Total prospects</div></div>
    <div class="kpi"><div class="n">{total_states}</div><div class="l">States covered</div></div>
    <div class="kpi"><div class="n">8</div><div class="l">Target niches</div></div>
    <div class="kpi"><div class="n">$12.5T</div><div class="l">Addressable market</div></div>
  </div>

  <section>
    <h2>Browse by state</h2>
    <div class="state-grid">{state_html}</div>
  </section>

  <section>
    <h2>All prospects</h2>
    <div class="niche-legend">{legend_html}</div>
    <input type="search" id="q" placeholder="Search by company, city, or state..." />
    <div class="filters">{filters_html}</div>
    <div class="showing" id="showing">Showing all {total:,} prospects</div>
    <div class="prospects" id="list">{rows}</div>
  </section>

  <footer>NetWebMedia · Audits generated from public signals · April 2026</footer>
</div>

<script>
(function(){{
  var list = document.getElementById('list');
  var items = list.querySelectorAll('.prospect');
  var showing = document.getElementById('showing');
  var q = document.getElementById('q');
  var currentNiche = 'all';
  function apply(){{
    var term = (q.value||'').toLowerCase().trim();
    var count = 0;
    items.forEach(function(el){{
      var okN = currentNiche==='all' || el.dataset.niche===currentNiche;
      var okQ = !term || el.dataset.search.indexOf(term) !== -1;
      var show = okN && okQ;
      el.style.display = show ? '' : 'none';
      if (show) count++;
    }});
    showing.textContent = 'Showing ' + count.toLocaleString() + ' prospects';
  }}
  q.addEventListener('input', apply);
  document.querySelectorAll('.filter').forEach(function(f){{
    f.addEventListener('click', function(){{
      document.querySelectorAll('.filter').forEach(function(x){{x.classList.remove('active')}});
      f.classList.add('active');
      currentNiche = f.dataset.n;
      apply();
    }});
  }});
}})();
</script>
</body>
</html>"""
    with open(os.path.join(OUT_ROOT, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)
    return items

def per_state_indexes(items):
    # Group by state_key via slug
    state_slug_to_key = {sk.replace("_","-"): sk for sk in STATES.keys()}
    by_state = defaultdict(list)
    for it in items:
        # Match by state name
        for sk,s in STATES.items():
            if s["name"] == it["state"]:
                by_state[sk].append(it); break

    for sk, arr in by_state.items():
        state = STATES[sk]
        slug = sk.replace("_","-")
        rows = ""
        niche_count = defaultdict(int)
        for it in arr:
            niche_count[it["niche"]] += 1
            meta = NICHE_META.get(it["niche"], ("","","#888",""))
            href = it["href"]
            # strip "state-slug/" prefix so it's relative
            if href.startswith(slug+"/"):
                href = href[len(slug)+1:]
            rows += (f'<a class="prospect" data-niche="{esc(it["niche"])}" '
                     f'data-search="{esc((it["company"]+" "+it["city"]).lower())}" '
                     f'href="{esc(href)}">'
                     f'<div class="name">{esc(it["company"])}</div>'
                     f'<div class="where">{esc(it["city"])}</div>'
                     f'<span class="niche" style="background:{meta[2]}">{meta[3]} {esc(meta[0])}</span>'
                     f'</a>')
        filters_html = '<span class="filter active" data-n="all">All ' + str(len(arr)) + '</span>'
        for k,(en,_,_,icon) in NICHE_META.items():
            c = niche_count.get(k,0)
            if c: filters_html += f'<span class="filter" data-n="{k}">{icon} {esc(en)} ({c})</span>'

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{esc(state['name'])} ({state['code']}) — {len(arr)} prospects | NetWebMedia</title>
<style>{CSS}</style>
</head>
<body>
<div class="container">
  <p><a href="../index.html" style="color:#FF6B00;text-decoration:none;font-size:13px">← All 50 states</a></p>
  <div class="hero">
    <h1>{esc(state['name'])} <span style="opacity:.6;font-size:24px">({state['code']})</span></h1>
    <p>{esc(state['economy'])}</p>
    <div class="chips">
      <span class="chip">🇺🇸 {len(arr)} prospects</span>
      <span class="chip">🎯 {len([k for k,v in niche_count.items() if v])} niches</span>
      <span class="chip">📍 {len(state['cities'])} cities</span>
    </div>
  </div>
  <section>
    <h2>Prospects in {esc(state['name'])}</h2>
    <input type="search" id="q" placeholder="Search by company or city..." />
    <div class="filters">{filters_html}</div>
    <div class="showing" id="showing">Showing all {len(arr)} prospects</div>
    <div class="prospects" id="list">{rows}</div>
  </section>
  <footer>NetWebMedia · April 2026</footer>
</div>
<script>
(function(){{
  var list = document.getElementById('list');
  var items = list.querySelectorAll('.prospect');
  var showing = document.getElementById('showing');
  var q = document.getElementById('q');
  var currentNiche = 'all';
  function apply(){{
    var term = (q.value||'').toLowerCase().trim();
    var count = 0;
    items.forEach(function(el){{
      var okN = currentNiche==='all' || el.dataset.niche===currentNiche;
      var okQ = !term || el.dataset.search.indexOf(term) !== -1;
      var show = okN && okQ;
      el.style.display = show ? '' : 'none';
      if (show) count++;
    }});
    showing.textContent = 'Showing ' + count.toLocaleString() + ' prospects';
  }}
  q.addEventListener('input', apply);
  document.querySelectorAll('.filter').forEach(function(f){{
    f.addEventListener('click', function(){{
      document.querySelectorAll('.filter').forEach(function(x){{x.classList.remove('active')}});
      f.classList.add('active');
      currentNiche = f.dataset.n;
      apply();
    }});
  }});
}})();
</script>
</body>
</html>"""
        with open(os.path.join(OUT_ROOT, slug, "index.html"), "w", encoding="utf-8") as f:
            f.write(html)

def main():
    items = top_index()
    per_state_indexes(items)
    print(f"wrote companies/usa/index.html + 50 state indexes")

if __name__ == "__main__":
    main()
