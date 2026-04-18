import json, glob, html, os
from datetime import datetime

pages = []
order = ['audit_home.json','audit_pricing.json','audit_services.json','audit_about.json','audit_blog.json','audit_contact.json','audit_analytics.json']
for f in order:
    d = json.load(open(f, encoding='utf-8'))
    pages.append({
        'label': f.replace('audit_','').replace('.json','').upper(),
        'url': d.get('url'),
        'final_url': d.get('final_url'),
        'status': d.get('http_status'),
        'timing_ms': d.get('timing_ms'),
        'size_kb': d.get('size_kb'),
        'parsed': d.get('parsed') or {},
        'performance': d.get('performance') or {},
        'security': d.get('security') or {},
        'scores': d.get('scores') or {},
        'recs': d.get('recommendations') or [],
    })

def avg(k):
    vals = [p['scores'].get(k, 0) for p in pages]
    return sum(vals) / len(vals)

avg_overall = avg('overall')
avg_seo = avg('seo')
avg_perf = avg('performance')
avg_mob = avg('mobile')
avg_content = avg('content')
avg_tech = avg('technical')

now = datetime.now().strftime('%Y-%m-%d %H:%M UTC')

def yn(v): return 'YES' if v else 'NO'
def cls(v): return 'ok' if v else 'bad'

def score_color(s):
    if s >= 95: return '#10b981'
    if s >= 85: return '#84cc16'
    if s >= 70: return '#f59e0b'
    return '#ef4444'

rows_html = []
for p in pages:
    s = p['scores']
    rows_html.append(
        '<tr>'
        '<td><strong>' + html.escape(p['label']) + '</strong><br>'
        '<a href="' + html.escape(p['final_url'] or p['url']) + '" target="_blank">' + html.escape(p['url'].replace('https://netwebmedia.com','') or '/') + '</a></td>'
        '<td><span class="badge" style="background:' + score_color(s.get('overall',0)) + '">' + str(s.get('overall','?')) + '</span></td>'
        '<td>' + str(s.get('seo','?')) + '</td>'
        '<td>' + str(s.get('performance','?')) + '</td>'
        '<td>' + str(s.get('mobile','?')) + '</td>'
        '<td>' + str(s.get('content','?')) + '</td>'
        '<td>' + str(s.get('technical','?')) + '</td>'
        '<td>' + str(p['timing_ms']) + ' ms / ' + str(p['size_kb']) + ' kb</td>'
        '</tr>'
    )

detail_html = []
for p in pages:
    pa = p['parsed']; perf = p['performance']; sec = p['security']
    recs_items = []
    for r in p['recs']:
        sev = r.get('severity','low')
        issue = html.escape(r.get('issue',''))
        fix = r.get('fix','')
        suffix = ' &mdash; <em>' + html.escape(fix) + '</em>' if fix else ''
        recs_items.append('<li class="sev-' + sev + '"><strong>' + html.escape(sev.upper()) + '</strong>: ' + issue + suffix + '</li>')
    recs_html = ''.join(recs_items) if recs_items else '<li class="ok-li">No issues found.</li>'
    s = p['scores']
    title_txt = (pa.get('title') or '').strip().replace('\r',' ').replace('\n',' ')[:80]
    detail_html.append(
        '<section class="page-card">'
        '<h3>' + html.escape(p['label']) + ' <span class="url-line">' + html.escape(p['url']) + '</span></h3>'
        '<div class="score-row">'
          '<div class="big-score" style="background:' + score_color(s.get('overall',0)) + '">' + str(s.get('overall','?')) + '</div>'
          '<div class="sub-scores">'
            '<span>SEO <b>' + str(s.get('seo','?')) + '</b></span>'
            '<span>Perf <b>' + str(s.get('performance','?')) + '</b></span>'
            '<span>Mobile <b>' + str(s.get('mobile','?')) + '</b></span>'
            '<span>Content <b>' + str(s.get('content','?')) + '</b></span>'
            '<span>Technical <b>' + str(s.get('technical','?')) + '</b></span>'
          '</div>'
        '</div>'
        '<div class="grid">'
          '<div class="panel"><h4>Technical</h4><ul>'
            '<li>HTTPS: <span class="' + cls(sec.get('https')) + '">' + yn(sec.get('https')) + '</span></li>'
            '<li>HSTS: <span class="' + cls(sec.get('hsts')) + '">' + yn(sec.get('hsts')) + '</span></li>'
            '<li>GZIP: <span class="' + cls(perf.get('gzip')) + '">' + yn(perf.get('gzip')) + '</span></li>'
            '<li>Cache headers: <span class="' + cls(perf.get('cache')) + '">' + yn(perf.get('cache')) + '</span></li>'
            '<li>Favicon: <span class="' + cls(pa.get('has_favicon')) + '">' + yn(pa.get('has_favicon')) + '</span></li>'
            '<li>Canonical: <code>' + html.escape(pa.get('canonical') or '-') + '</code></li>'
          '</ul></div>'
          '<div class="panel"><h4>SEO &amp; AEO</h4><ul>'
            '<li>Title (' + str(len(pa.get('title') or '')) + ' chars): <code>' + html.escape(title_txt) + '</code></li>'
            '<li>Meta desc (' + str(len(pa.get('meta_description') or '')) + ' chars)</li>'
            '<li>Schema.org JSON-LD: <span class="' + cls(pa.get('has_schema')) + '">' + yn(pa.get('has_schema')) + '</span></li>'
            '<li>OpenGraph: <span class="' + cls(pa.get('has_og')) + '">' + yn(pa.get('has_og')) + '</span></li>'
            '<li>Twitter Card: <span class="' + cls(pa.get('has_twitter')) + '">' + yn(pa.get('has_twitter')) + '</span></li>'
            '<li>H1 count: ' + str(len(pa.get('h1') or [])) + '</li>'
            '<li>H2 count: ' + str(pa.get('h2_count','?')) + '</li>'
          '</ul></div>'
          '<div class="panel"><h4>Content</h4><ul>'
            '<li>Images (alt missing): ' + str(pa.get('images_no_alt','?')) + ' / ' + str(pa.get('images_total','?')) + '</li>'
            '<li>Links total: ' + str(pa.get('links_total','?')) + ' (external ' + str(pa.get('links_external','?')) + ')</li>'
            '<li>Language: ' + html.escape(pa.get('lang') or '-') + '</li>'
            '<li>Viewport: <span class="' + cls(pa.get('viewport')) + '">' + yn(pa.get('viewport')) + '</span></li>'
          '</ul></div>'
          '<div class="panel"><h4>Analytics</h4><ul>'
            '<li>GA4 / gtag: <span class="' + cls(pa.get('has_gtag')) + '">' + yn(pa.get('has_gtag')) + '</span></li>'
            '<li>GTM: <span class="' + cls(pa.get('has_gtm')) + '">' + yn(pa.get('has_gtm')) + '</span></li>'
            '<li>Meta Pixel: <span class="' + cls(pa.get('has_meta_pixel')) + '">' + yn(pa.get('has_meta_pixel')) + '</span></li>'
            '<li>Hotjar: <span class="' + cls(pa.get('has_hotjar')) + '">' + yn(pa.get('has_hotjar')) + '</span></li>'
            '<li>Service Worker: <span class="' + cls(pa.get('has_service_worker')) + '">' + yn(pa.get('has_service_worker')) + '</span></li>'
          '</ul></div>'
        '</div>'
        '<h4 style="margin-top:16px">Issues &amp; Recommendations</h4>'
        '<ul class="recs">' + recs_html + '</ul>'
        '</section>'
    )

CSS = """
  :root { --bg:#0b0f1a; --panel:#111827; --panel2:#0f172a; --border:#1f2937; --text:#e5e7eb; --muted:#9ca3af; --ok:#10b981; --warn:#f59e0b; --bad:#ef4444; }
  * { box-sizing:border-box }
  body { margin:0; font-family:-apple-system,Segoe UI,Roboto,sans-serif; background:var(--bg); color:var(--text); padding:40px 20px; }
  .wrap { max-width:1200px; margin:0 auto; }
  h1 { font-size:32px; margin:0 0 6px; }
  h1 .sub { font-size:15px; color:var(--muted); font-weight:400; }
  .summary { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:12px; margin:24px 0 40px; }
  .kpi { background:var(--panel); border:1px solid var(--border); border-radius:10px; padding:16px; text-align:center; }
  .kpi b { display:block; font-size:28px; margin-bottom:4px; }
  .kpi span { font-size:12px; color:var(--muted); text-transform:uppercase; letter-spacing:.08em; }
  table { width:100%; border-collapse:collapse; background:var(--panel); border-radius:10px; overflow:hidden; }
  th, td { padding:10px 14px; text-align:left; border-bottom:1px solid var(--border); font-size:14px; }
  th { background:var(--panel2); color:var(--muted); text-transform:uppercase; font-size:11px; letter-spacing:.08em; }
  td a { color:#93c5fd; text-decoration:none; font-size:12px; }
  .badge { display:inline-block; padding:3px 10px; border-radius:9999px; color:#fff; font-weight:700; font-size:13px; }
  .page-card { background:var(--panel); border:1px solid var(--border); border-radius:12px; padding:24px; margin:20px 0; }
  .page-card h3 { margin:0 0 12px; font-size:20px; }
  .page-card .url-line { font-weight:400; color:var(--muted); font-size:13px; margin-left:8px; }
  .score-row { display:flex; align-items:center; gap:20px; margin:12px 0 20px; flex-wrap:wrap; }
  .big-score { width:72px; height:72px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:32px; font-weight:800; color:#fff; }
  .sub-scores { display:flex; gap:16px; flex-wrap:wrap; }
  .sub-scores span { color:var(--muted); font-size:13px; }
  .sub-scores b { color:var(--text); font-size:18px; display:inline-block; margin-left:4px; }
  .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:14px; }
  .panel { background:var(--panel2); border:1px solid var(--border); border-radius:10px; padding:14px; }
  .panel h4 { margin:0 0 8px; font-size:13px; color:var(--muted); text-transform:uppercase; letter-spacing:.08em; }
  .panel ul { list-style:none; padding:0; margin:0; }
  .panel li { padding:4px 0; font-size:13px; border-bottom:1px solid var(--border); }
  .panel li:last-child { border-bottom:0; }
  .ok { color:var(--ok); font-weight:600; }
  .bad { color:var(--bad); font-weight:600; }
  code { background:rgba(255,255,255,.05); padding:2px 6px; border-radius:4px; font-size:12px; word-break:break-all; }
  .recs { list-style:none; padding:0; margin:8px 0 0; }
  .recs li { padding:10px 14px; margin-bottom:6px; border-radius:8px; font-size:13px; background:var(--panel2); border-left:3px solid var(--muted); }
  .recs li.sev-high { border-left-color:var(--bad); }
  .recs li.sev-medium { border-left-color:var(--warn); }
  .recs li.sev-low { border-left-color:var(--muted); }
  .recs li.ok-li { border-left-color:var(--ok); color:var(--ok); }
  .actionbox { background:linear-gradient(135deg,rgba(99,102,241,.15),rgba(139,92,246,.1)); border:1px solid rgba(139,92,246,.3); border-radius:12px; padding:20px; margin-top:32px; }
  .actionbox h3 { margin-top:0; }
  .actionbox ol li { margin-bottom:8px; }
  h2 { font-size:22px; margin:40px 0 12px; border-bottom:1px solid var(--border); padding-bottom:6px; }
"""

action_html = (
    '<div class="actionbox">'
    '<h3>Top actions to lift non-home pages to 100</h3>'
    '<p><strong>Diagnosis:</strong> Home page scores 100/100 because it carries GA4, Meta Pixel, and Organization schema.'
    ' Pricing/Services/About/Blog/Contact/Analytics pages each score 91-94, held back by 3 missing snippets.</p>'
    '<ol>'
      '<li><strong>Add GA4 gtag snippet</strong> to every non-home template (or move it to a shared footer include). +5 on <em>content</em>.</li>'
      '<li><strong>Add Meta Pixel snippet</strong> to every non-home template. +5 on <em>content</em>.</li>'
      '<li><strong>Add JSON-LD <code>Service</code> schema to pricing.html</strong> (each plan as an Offer) + <code>BreadcrumbList</code> site-wide. +15 on pricing SEO.</li>'
      '<li><strong>Add Twitter Card meta</strong> to any page missing it (pricing.html already has OG, just needs twitter:card, twitter:title, twitter:description).</li>'
      '<li><strong>Populate social profiles</strong> (Instagram, Facebook, LinkedIn) and link them in footer - auditor flags "No active social media profiles detected" on every page.</li>'
    '</ol>'
    '<p>All 5 fixes can be bundled into a single <code>includes/head-analytics.html</code> + <code>includes/footer-socials.html</code> include used by all pages.</p>'
    '</div>'
)

out_html = (
    '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">'
    '<meta name="viewport" content="width=device-width,initial-scale=1">'
    '<title>NetWebMedia Full Audit - ' + now + '</title>'
    '<style>' + CSS + '</style></head><body><div class="wrap">'
    '<h1>NetWebMedia - Website Audit <br><span class="sub">Generated ' + now + ' &middot; scope: 7 key pages</span></h1>'
    '<div class="summary">'
      '<div class="kpi"><b>' + f"{avg_overall:.0f}" + '</b><span>Overall avg</span></div>'
      '<div class="kpi"><b>' + f"{avg_seo:.0f}" + '</b><span>SEO</span></div>'
      '<div class="kpi"><b>' + f"{avg_perf:.0f}" + '</b><span>Performance</span></div>'
      '<div class="kpi"><b>' + f"{avg_mob:.0f}" + '</b><span>Mobile</span></div>'
      '<div class="kpi"><b>' + f"{avg_content:.0f}" + '</b><span>Content</span></div>'
      '<div class="kpi"><b>' + f"{avg_tech:.0f}" + '</b><span>Technical</span></div>'
    '</div>'
    '<h2>Overview</h2>'
    '<table><thead><tr><th>Page</th><th>Overall</th><th>SEO</th><th>Perf</th><th>Mob</th><th>Content</th><th>Tech</th><th>Load</th></tr></thead>'
    '<tbody>' + ''.join(rows_html) + '</tbody></table>'
    '<h2>Per-page detail</h2>' + ''.join(detail_html) +
    action_html +
    '</div></body></html>'
)

out_path = r'C:\Users\Usuario\Desktop\NetWebMedia\audit-report.html'
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(out_html)
print('WROTE', out_path, os.path.getsize(out_path), 'bytes')
