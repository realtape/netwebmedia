#!/usr/bin/env python3
"""
inject-niche-leadforms.py — idempotent patcher (NOT a regenerator).

Adds a self-contained, bilingual (EN/ES) lead-capture <section> wired to the
working /submit.php backend onto every niche subdomain example page that lacks
one. Each form carries the correct hidden source=<subdomain>-lp slug so
submit.php's per-subdomain thanks redirect + CRM attribution work.

It INSERTS a block before <div class="final-cta-wrap"> (niche pages) or before
<footer (the /industries/ catalog). It never rewrites existing markup, so the
AEO/FAQ schema and bilingual copy already on these pages are preserved.
Re-running is safe: pages already containing "nwm-leadform" are skipped.

Run from repo root:  python3 _deploy/inject-niche-leadforms.py
"""
import os, sys, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# path (relative to repo root) -> (source_slug, company_en, company_es, niche_en, niche_es)
# source_slug MUST equal the real subdomain in .htaccess so the post-submit
# redirect to {slug}.netwebmedia.com/thanks.html resolves.
PAGES = {
    # ── catalog ──
    "industries/index.html":                                  ("industries", "Business name", "Nombre del negocio", "business", "negocio"),
    # ── 14 niche hubs ──
    "industries/hospitality/index.html":                      ("hospitality", "Hotel / property name", "Nombre del hotel / propiedad", "hospitality business", "negocio de hospitalidad"),
    "industries/restaurants/index.html":                      ("restaurants", "Restaurant name", "Nombre del restaurante", "restaurant", "restaurante"),
    "industries/healthcare/index.html":                       ("healthcare", "Practice / clinic name", "Nombre de la clínica", "practice", "clínica"),
    "industries/beauty/index.html":                           ("beauty", "Business name", "Nombre del negocio", "beauty business", "negocio de belleza"),
    "industries/smb/index.html":                              ("smb", "Business name", "Nombre del negocio", "business", "negocio"),
    "industries/legal-services/index.html":                   ("legal-services", "Firm name", "Nombre del despacho", "law firm", "despacho"),
    "industries/real-estate/index.html":                      ("realestate", "Agency / brokerage name", "Nombre de la inmobiliaria", "real estate business", "inmobiliaria"),
    "industries/local-services/index.html":                   ("local", "Business name", "Nombre del negocio", "business", "negocio"),
    "industries/automotive/index.html":                       ("auto", "Business name", "Nombre del negocio", "automotive business", "negocio automotriz"),
    "industries/education/index.html":                        ("education", "School / institution name", "Nombre de la institución", "school", "institución"),
    "industries/events-weddings/index.html":                  ("events", "Business name", "Nombre del negocio", "events business", "negocio de eventos"),
    "industries/finance/index.html":                          ("finance", "Firm name", "Nombre de la firma", "firm", "firma"),
    "industries/home-services/index.html":                    ("home", "Company name", "Nombre de la empresa", "home services business", "empresa de servicios"),
    "industries/wine-agriculture/index.html":                 ("wine", "Winery / business name", "Nombre de la bodega / negocio", "winery", "bodega"),
    # ── 17 subcategory demos (ind-hero family, were CTA-only) ──
    "industries/hospitality/boutique/index.html":             ("boutique", "Property name", "Nombre de la propiedad", "boutique hotel", "hotel boutique"),
    "industries/hospitality/hotels/index.html":               ("hotels", "Hotel name", "Nombre del hotel", "hotel", "hotel"),
    "industries/hospitality/resorts/index.html":              ("resorts", "Resort name", "Nombre del resort", "resort", "resort"),
    "industries/healthcare/aesthetics/index.html":            ("aesthetics", "Clinic name", "Nombre de la clínica", "aesthetics clinic", "clínica estética"),
    "industries/healthcare/dental/index.html":                ("dental", "Practice name", "Nombre de la clínica dental", "dental practice", "clínica dental"),
    "industries/healthcare/vet/index.html":                   ("vet", "Clinic name", "Nombre de la clínica veterinaria", "veterinary clinic", "clínica veterinaria"),
    "industries/beauty/barbershops/index.html":               ("barbershops", "Barbershop name", "Nombre de la barbería", "barbershop", "barbería"),
    "industries/beauty/salons/index.html":                    ("salons", "Salon name", "Nombre del salón", "salon", "salón"),
    "industries/beauty/spas/index.html":                      ("spas", "Spa name", "Nombre del spa", "spa", "spa"),
    "industries/real-estate/agents/index.html":               ("agents", "Agency / team name", "Nombre de la agencia / equipo", "real estate agency", "agencia inmobiliaria"),
    "industries/real-estate/brokerages/index.html":           ("brokerages", "Brokerage name", "Nombre de la inmobiliaria", "brokerage", "inmobiliaria"),
    "industries/real-estate/property-management/index.html":  ("propertymanagement", "Company name", "Nombre de la empresa", "property management company", "administradora de propiedades"),
    "industries/restaurants/bars/index.html":                 ("bars", "Bar name", "Nombre del bar", "bar", "bar"),
    "industries/restaurants/catering/index.html":             ("catering", "Catering company", "Nombre del catering", "catering business", "negocio de catering"),
    "industries/home-services/contractors/index.html":        ("contractors", "Company name", "Nombre de la empresa", "contracting business", "empresa de construcción"),
    "industries/home-services/landscaping/index.html":        ("landscaping", "Company name", "Nombre de la empresa", "landscaping business", "empresa de jardinería"),
    "industries/home-services/plumbers/index.html":           ("plumbers", "Company name", "Nombre de la empresa", "plumbing business", "empresa de plomería"),
}

BLOCK = '''  <!-- nwm-leadform: niche lead capture wired to /submit.php (added 2026-05-22) -->
  <section class="section nwm-leadform" id="get-plan" style="max-width:1080px;margin:0 auto;padding:60px 20px">
    <style>
      .nwm-leadform .nlf-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:stretch;background:var(--bg-card);border:1px solid var(--border-glass);border-radius:var(--radius-lg);padding:42px}
      @media(max-width:760px){.nwm-leadform .nlf-grid{grid-template-columns:1fr;padding:28px;gap:26px}}
      .nwm-leadform .nlf-copy .eyebrow{display:inline-block;background:var(--nwm-orange);color:#fff;padding:5px 14px;border-radius:var(--radius-pill);font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin-bottom:16px}
      .nwm-leadform .nlf-copy h2{font-size:clamp(25px,3.4vw,34px);font-weight:800;font-family:var(--font-display);line-height:1.14;margin:0 0 14px;color:#fff}
      .nwm-leadform .nlf-copy p{font-size:16px;color:var(--text-secondary);line-height:1.6;margin:0 0 20px}
      .nwm-leadform .nlf-copy ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px}
      .nwm-leadform .nlf-copy li{font-size:14px;color:var(--text-secondary);padding-left:24px;position:relative;line-height:1.5}
      .nwm-leadform .nlf-copy li::before{content:"\\2713";position:absolute;left:0;color:var(--nwm-orange);font-weight:800}
      .nwm-leadform .nlf-form{display:flex;flex-direction:column;gap:11px;justify-content:center}
      .nwm-leadform .nlf-form input,.nwm-leadform .nlf-form textarea{width:100%;box-sizing:border-box;background:rgba(255,255,255,.04);border:1px solid var(--border-glass);border-radius:var(--radius-md);padding:13px 15px;color:#fff;font-size:15px;font-family:inherit}
      .nwm-leadform .nlf-form input::placeholder,.nwm-leadform .nlf-form textarea::placeholder{color:var(--text-muted)}
      .nwm-leadform .nlf-form input:focus,.nwm-leadform .nlf-form textarea:focus{outline:none;border-color:var(--nwm-orange)}
      .nwm-leadform .nlf-form textarea{min-height:80px;resize:vertical}
      .nwm-leadform .nlf-form button{background:var(--gradient-btn);color:#fff;border:none;padding:15px;border-radius:var(--radius-pill);font-weight:700;font-size:16px;cursor:pointer;transition:var(--transition)}
      .nwm-leadform .nlf-form button:hover{transform:translateY(-2px);box-shadow:var(--shadow-glow)}
      .nwm-leadform .nlf-fine{font-size:12px;color:var(--text-muted);margin:8px 0 0;text-align:center;line-height:1.5}
    </style>
    <div class="nlf-grid">
      <div class="nlf-copy">
        <span class="eyebrow" data-en="Free 48-Hour Audit" data-es="Auditoría Gratis 48h">Free 48-Hour Audit</span>
        <h2 data-en="See exactly where your {NICHE_EN} is losing visibility &amp; revenue." data-es="Descubre dónde tu {NICHE_ES} está perdiendo visibilidad e ingresos.">See exactly where your {NICHE_EN} is losing visibility &amp; revenue.</h2>
        <p data-en="Tell us a little about your business. Claude + a NetWebMedia strategist build a personalized growth plan and send it to your WhatsApp within 48 hours — free." data-es="Cuéntanos un poco sobre tu negocio. Claude + un estratega de NetWebMedia construyen un plan de crecimiento personalizado y te lo envían por WhatsApp en 48 horas — gratis.">Tell us a little about your business. Claude + a NetWebMedia strategist build a personalized growth plan and send it to your WhatsApp within 48 hours — free.</p>
        <ul>
          <li data-en="AEO + SEO + paid + AI-SDR gap analysis" data-es="Análisis de brechas AEO + SEO + paid + SDR IA">AEO + SEO + paid + AI-SDR gap analysis</li>
          <li data-en="No calls, no meetings — we reply on WhatsApp" data-es="Sin llamadas, sin reuniones — respondemos por WhatsApp">No calls, no meetings — we reply on WhatsApp</li>
          <li data-en="Written plan in 48 hours · 100% free" data-es="Plan escrito en 48 horas · 100% gratis">Written plan in 48 hours · 100% free</li>
        </ul>
      </div>
      <form class="nlf-form" action="https://netwebmedia.com/submit.php" method="POST">
        <input type="hidden" name="source" value="{SLUG}-lp">
        <input type="text" name="website_url" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;height:0;width:0;opacity:0">
        <input type="text" name="name" required data-en-placeholder="Full name" data-es-placeholder="Nombre completo" placeholder="Full name">
        <input type="email" name="email" required data-en-placeholder="Work email" data-es-placeholder="Email de trabajo" placeholder="Work email">
        <input type="tel" name="phone" required data-en-placeholder="WhatsApp (with country code)" data-es-placeholder="WhatsApp (con código de país)" placeholder="WhatsApp (with country code)">
        <input type="text" name="company" required data-en-placeholder="{COMPANY_EN}" data-es-placeholder="{COMPANY_ES}" placeholder="{COMPANY_EN}">
        <input type="url" name="website" data-en-placeholder="Website (optional)" data-es-placeholder="Sitio web (opcional)" placeholder="Website (optional)">
        <textarea name="message" data-en-placeholder="Biggest marketing challenge right now?" data-es-placeholder="¿Tu mayor reto de marketing ahora?" placeholder="Biggest marketing challenge right now?"></textarea>
        <button type="submit" data-en="Get My Free Plan →" data-es="Quiero Mi Plan Gratis →">Get My Free Plan →</button>
        <p class="nlf-fine" data-en="We reply on WhatsApp — no calls, no meetings. Your info stays private." data-es="Respondemos por WhatsApp — sin llamadas, sin reuniones. Tu información se mantiene privada.">We reply on WhatsApp — no calls, no meetings. Your info stays private.</p>
      </form>
    </div>
  </section>

'''

FCTA_ANCHOR = '<div class="final-cta-wrap">'

def build_block(slug, c_en, c_es, n_en, n_es):
    return (BLOCK
            .replace("{SLUG}", slug)
            .replace("{COMPANY_EN}", c_en)
            .replace("{COMPANY_ES}", c_es)
            .replace("{NICHE_EN}", n_en)
            .replace("{NICHE_ES}", n_es))

def main():
    done, skipped, missing, noanchor = [], [], [], []
    for rel, params in PAGES.items():
        path = os.path.join(ROOT, rel)
        if not os.path.isfile(path):
            missing.append(rel); continue
        with open(path, "r", encoding="utf-8") as f:
            html = f.read()
        if "nwm-leadform" in html:
            skipped.append(rel); continue
        block = build_block(*params)
        if FCTA_ANCHOR in html:
            html = html.replace(FCTA_ANCHOR, block + "  " + FCTA_ANCHOR, 1)
        else:
            m = re.search(r'\n\s*<footer', html)
            if not m:
                noanchor.append(rel); continue
            idx = m.start()
            html = html[:idx] + "\n" + block + html[idx:]
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        done.append(rel)

    print(f"Injected:  {len(done)}")
    for r in done:     print("  +", r)
    if skipped:  print(f"Skipped (already had form): {len(skipped)}");  [print("  =", r) for r in skipped]
    if missing:  print(f"MISSING files: {len(missing)}");               [print("  ?", r) for r in missing]
    if noanchor: print(f"NO ANCHOR (manual): {len(noanchor)}");         [print("  !", r) for r in noanchor]
    return 1 if (missing or noanchor) else 0

if __name__ == "__main__":
    sys.exit(main())
