#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate BILINGUAL (EN/ES) deep audit pages for every US prospect.
Fork of generate_deep_audits.py adapted for USA:
  - USD market stats, US-flavored pain points
  - State-keyed URLs: /companies-usa/{state-slug}/{business-slug}.html
  - Default language = EN (US primary market)
"""
import os, json, sys, html as _html, hashlib, math
from urllib.parse import urlparse
from usa_config import (
    STATES, NICHE_MARKET_USA, PAINS_EN_USA, PAINS_ES_USA
)
# Reuse unchanged helpers from the Chile generator
from generate_deep_audits import (
    NICHE_NAMES_EN, NICHE_NAMES_ES, SVC_ES, IMPACT_ES, SERVICE_PRICES,
    svg_gauge, svg_radar, svg_bars, svg_donut_platforms, svg_comparison, svg_funnel,
    synth_scores, synth_platforms, synth_funnel, CSS, esc, seeded, safe_fs,
    NICHES,  # from niches_regions — services list per niche
)

ROOT = os.path.dirname(os.path.abspath(__file__))
USA_JSON = os.path.join(ROOT, "usa_crm_import.json")

# Override synth_funnel to use USA market data
def synth_funnel_usa(niche_key, overall):
    m = NICHE_MARKET_USA[niche_key]; avg_ticket = m["avg_ticket_usd"]
    impressions = max(800, overall*80)
    visits = int(impressions*0.22)
    leads = max(4, int(visits*0.028))
    customers = max(1, int(leads*0.24))
    revenue = customers*avg_ticket
    p_imp = int(impressions*3.4); p_vis = int(p_imp*0.36)
    p_leads = int(p_vis*0.062); p_cust = int(p_leads*0.32); p_rev = p_cust*avg_ticket
    data = [
        ("Monthly Impressions","Impresiones Mensuales",impressions,p_imp),
        ("Website Visits","Visitas al Sitio",visits,p_vis),
        ("Qualified Leads","Leads Calificados",leads,p_leads),
        ("New Customers","Clientes Nuevos",customers,p_cust),
        ("Revenue (USD)","Ingresos (USD)",revenue,p_rev),
    ]
    return data, revenue, p_rev

# Lang switch with default = EN
LANG_SWITCH_EN = '''<div class="lang-switch">
  <button data-setlang="en" class="active">EN</button>
  <button data-setlang="es">ES</button>
</div>
<script>
(function(){
  var html=document.documentElement, k='nwm_lang';
  var saved=localStorage.getItem(k)||'en';
  html.setAttribute('lang', saved);
  document.querySelectorAll('.lang-switch button').forEach(function(b){
    if(b.dataset.setlang===saved)b.classList.add('active');else b.classList.remove('active');
    b.addEventListener('click',function(){
      var l=b.dataset.setlang; html.setAttribute('lang',l); localStorage.setItem(k,l);
      document.querySelectorAll('.lang-switch button').forEach(function(x){x.classList.toggle('active',x.dataset.setlang===l)});
    });
  });
  var io=('IntersectionObserver' in window)?new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in-view'); io.unobserve(e.target);} });
  },{threshold:0.12,rootMargin:'0px 0px -40px 0px'}):null;
  document.querySelectorAll('section').forEach(function(s){ if(io) io.observe(s); else s.classList.add('in-view'); });
  document.querySelectorAll('.nwm-count').forEach(function(t){
    var target=parseInt(t.getAttribute('data-target')||'0',10); var d=1200; var s=performance.now();
    t.textContent='0';
    function step(now){ var p=Math.min(1,(now-s)/d); var v=Math.round(target*(1-Math.pow(1-p,3))); t.textContent=v; if(p<1) requestAnimationFrame(step);}
    requestAnimationFrame(step);
  });
})();
</script>'''

TPL = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{name} — Digital Audit / Auditoría Digital | NetWebMedia</title>
<meta name="description" content="{name} · {city}, {state_code} · {niche_en} / {niche_es} — NetWebMedia.">
<style>{css}</style>
</head>
<body>
{lang_switch}
<div class="container">
  <p><a href="../index.html" class="back"><span data-lang="en">← All {state_name} prospects</span><span data-lang="es">← Todos los prospectos de {state_name}</span></a></p>

  <header class="hero">
    <div>
      <div class="crumbs">{state_name} · {city} · <span data-lang="en">{niche_en}</span><span data-lang="es">{niche_es}</span></div>
      <h1>{name}</h1>
      <div class="meta"><span data-lang="en">Deep Digital Audit · prepared by NetWebMedia · April 2026</span><span data-lang="es">Auditoría Digital Profunda · preparada por NetWebMedia · Abril 2026</span></div>
      <div class="chips">
        <span class="chip"><span data-lang="en">{w_chip_en}</span><span data-lang="es">{w_chip_es}</span></span>
        <span class="chip"><span data-lang="en">{e_chip_en}</span><span data-lang="es">{e_chip_es}</span></span>
        <span class="chip" data-lang="en">{niche_en}</span><span class="chip" data-lang="es">{niche_es}</span>
        <span class="chip"><span data-lang="en">Market: {market_size}</span><span data-lang="es">Mercado: {market_size}</span></span>
        <span class="chip"><span data-lang="en">{gap_count} gaps detected</span><span data-lang="es">{gap_count} brechas detectadas</span></span>
      </div>
    </div>
    <div class="gauge-wrap">
      {gauge}
      <div style="font-size:11px;margin-top:4px;opacity:.9;text-transform:uppercase;letter-spacing:.5px"><span data-lang="en">Digital Maturity</span><span data-lang="es">Madurez Digital</span></div>
    </div>
  </header>

  <section>
    <h2><span data-lang="en">Executive summary</span><span data-lang="es">Resumen ejecutivo</span></h2>
    <div class="highlight">
      <span data-lang="en"><strong>{name}</strong> scores <strong>{overall}/100</strong> on overall digital maturity — <strong>{gap_vs_niche_en}</strong> vs the {niche_en} niche average of <strong>55/100</strong>. At current conversion levels we estimate <strong>~${current_rev:,}/month</strong> in attributable online revenue. A standard NetWebMedia engagement unlocks an additional <strong>${gain:,}/month</strong> within 90 days ({uplift_pct}% lift, matching the {uplift_range} range seen across {niche_en} in the US 2025).</span>
      <span data-lang="es"><strong>{name}</strong> obtiene <strong>{overall}/100</strong> en madurez digital — <strong>{gap_vs_niche_es}</strong> vs el promedio del rubro {niche_es} de <strong>55/100</strong>. Estimamos <strong>~${current_rev:,}/mes</strong> de ingresos atribuibles online. Una activación NetWebMedia desbloquea <strong>${gain:,}/mes</strong> adicionales en 90 días (lift del {uplift_pct}%, dentro del rango {uplift_range} del rubro en EE.UU. 2025).</span>
    </div>
    <div class="stat-row">
      <div class="stat"><div class="n">{overall}/100</div><div class="l"><span data-lang="en">Digital score</span><span data-lang="es">Puntaje digital</span></div></div>
      <div class="stat"><div class="n">{gap_count}</div><div class="l"><span data-lang="en">Actionable gaps</span><span data-lang="es">Brechas accionables</span></div></div>
      <div class="stat"><div class="n">${gain:,}</div><div class="l"><span data-lang="en">Est. monthly uplift</span><span data-lang="es">Uplift mensual est.</span></div></div>
      <div class="stat"><div class="n">{uplift_pct}%</div><div class="l"><span data-lang="en">Revenue lift 90d</span><span data-lang="es">Lift a 90 días</span></div></div>
    </div>
  </section>

  <section>
    <h2><span data-lang="en">Business snapshot</span><span data-lang="es">Snapshot del negocio</span></h2>
    <div class="grid">
      <div class="cell {w_cls}"><div class="lbl"><span data-lang="en">Website</span><span data-lang="es">Sitio web</span></div><div class="val">{website}</div><div class="hint"><span data-lang="en">{w_hint_en}</span><span data-lang="es">{w_hint_es}</span></div></div>
      <div class="cell {e_cls}"><div class="lbl">Email</div><div class="val">{email}</div><div class="hint"><span data-lang="en">{e_hint_en}</span><span data-lang="es">{e_hint_es}</span></div></div>
      <div class="cell"><div class="lbl"><span data-lang="en">Phone</span><span data-lang="es">Teléfono</span></div><div class="val">{phone}</div><div class="hint"><span data-lang="en">Primary outbound channel</span><span data-lang="es">Canal primario de contacto</span></div></div>
      <div class="cell"><div class="lbl"><span data-lang="en">City</span><span data-lang="es">Ciudad</span></div><div class="val">{city}, {state_code}</div><div class="hint">{state_name}</div></div>
      <div class="cell"><div class="lbl"><span data-lang="en">Niche</span><span data-lang="es">Rubro</span></div><div class="val"><span data-lang="en">{niche_en}</span><span data-lang="es">{niche_es}</span></div><div class="hint">{market_size} · {market_growth} YoY</div></div>
      <div class="cell"><div class="lbl"><span data-lang="en">Avg. ticket</span><span data-lang="es">Ticket promedio</span></div><div class="val">${avg_ticket}</div><div class="hint"><span data-lang="en">Niche benchmark</span><span data-lang="es">Benchmark del rubro</span></div></div>
    </div>
  </section>

  <section>
    <h2><span data-lang="en">Digital maturity — 6-axis breakdown</span><span data-lang="es">Madurez digital — desglose 6 ejes</span></h2>
    <p class="sub"><span data-lang="en">Orange = {name} · Dashed blue = niche avg</span><span data-lang="es">Naranjo = {name} · Azul punteado = promedio del rubro</span></p>
    <div class="two-col"><div>{radar}</div><div>{bars}</div></div>
  </section>

  <section>
    <h2><span data-lang="en">Social media footprint</span><span data-lang="es">Huella en redes sociales</span></h2>
    <p class="sub"><span data-lang="en">Audience-reach score per platform (0 = absent, 100 = dominant)</span><span data-lang="es">Alcance por plataforma (0 = ausente, 100 = dominante)</span></p>
    {platform_bars}
  </section>

  <section>
    <h2><span data-lang="en">Benchmark vs market</span><span data-lang="es">Benchmark vs mercado</span></h2>
    <p class="sub"><span data-lang="en">Where {name} stands against {niche_en} peers in {state_name}</span><span data-lang="es">Dónde está {name} frente a pares de {niche_es} en {state_name}</span></p>
    <div class="two-col">
      <div>{comparison}</div>
      <div>
        <div class="highlight"><strong><span data-lang="en">Market context:</span><span data-lang="es">Contexto de mercado:</span></strong> <span data-lang="en">{key_stat_en}</span><span data-lang="es">{key_stat_es}</span></div>
        <div class="opportunity">
          <div class="opp now"><div class="l"><span data-lang="en">This business</span><span data-lang="es">Este negocio</span></div><div class="n">{overall}</div><div class="d"><span data-lang="en">Current score</span><span data-lang="es">Puntaje actual</span></div></div>
          <div class="opp mid"><div class="l"><span data-lang="en">Niche avg</span><span data-lang="es">Promedio rubro</span></div><div class="n">55</div><div class="d"><span data-lang="en">{niche_en}</span><span data-lang="es">{niche_es}</span></div></div>
          <div class="opp top"><div class="l">Top 10%</div><div class="n">82</div><div class="d"><span data-lang="en">Leaders</span><span data-lang="es">Líderes</span></div></div>
        </div>
      </div>
    </div>
  </section>

  <section>
    <h2><span data-lang="en">Revenue funnel — projected transformation</span><span data-lang="es">Embudo de ingresos — transformación proyectada</span></h2>
    <p class="sub"><span data-lang="en">Current monthly performance vs 90-day projection with NetWebMedia stack</span><span data-lang="es">Performance mensual actual vs proyección a 90 días con stack NetWebMedia</span></p>
    {funnel}
    <div class="stat-row" style="margin-top:18px">
      <div class="stat"><div class="n">${current_rev:,}</div><div class="l"><span data-lang="en">Current monthly</span><span data-lang="es">Mensual actual</span></div></div>
      <div class="stat"><div class="n">${projected_rev:,}</div><div class="l"><span data-lang="en">Projected 90d</span><span data-lang="es">Proyectado 90d</span></div></div>
      <div class="stat"><div class="n">${gain:,}</div><div class="l"><span data-lang="en">Monthly gain</span><span data-lang="es">Ganancia mensual</span></div></div>
      <div class="stat"><div class="n">${annual_gain:,}</div><div class="l"><span data-lang="en">Annualized uplift</span><span data-lang="es">Uplift anual</span></div></div>
    </div>
  </section>

  <section>
    <h2><span data-lang="en">Pain points with severity</span><span data-lang="es">Dolores con severidad</span></h2>
    <p class="sub"><span data-lang="en">Ranked by revenue impact for {niche_en} in the US 2025</span><span data-lang="es">Ordenados por impacto en revenue para {niche_es} en EE.UU. 2025</span></p>
    <ul class="issues">{pain_items}</ul>
  </section>

  <section>
    <h2><span data-lang="en">90-day transformation roadmap</span><span data-lang="es">Roadmap de 90 días</span></h2>
    <p class="sub"><span data-lang="en">Phased rollout — sequenced for quickest revenue impact</span><span data-lang="es">Despliegue por fases — secuenciado para impacto rápido</span></p>
    <div class="roadmap">
      <div class="phase">
        <div class="days"><span data-lang="en">Days 0–30</span><span data-lang="es">Días 0–30</span></div>
        <h3><span data-lang="en">Foundation</span><span data-lang="es">Base</span></h3>
        <ul>
          <li><span data-lang="en">AI-generated bilingual website (EN/ES) live</span><span data-lang="es">Sitio bilingüe (EN/ES) generado con IA en producción</span></li>
          <li><span data-lang="en">Google Business Profile optimized with 40+ photos</span><span data-lang="es">Ficha Google Business optimizada con 40+ fotos</span></li>
          <li><span data-lang="en">Meta Pixel + GA4 installed, conversion events wired</span><span data-lang="es">Meta Pixel + GA4 instalados, eventos de conversión</span></li>
          <li><span data-lang="en">SMS/WhatsApp Business + auto-reply in place</span><span data-lang="es">SMS/WhatsApp Business + auto-respuesta activa</span></li>
          <li><span data-lang="en">CRM contact import + lead-capture form live</span><span data-lang="es">Import de contactos al CRM + formulario de captura</span></li>
        </ul>
      </div>
      <div class="phase">
        <div class="days"><span data-lang="en">Days 31–60</span><span data-lang="es">Días 31–60</span></div>
        <h3><span data-lang="en">Acceleration</span><span data-lang="es">Aceleración</span></h3>
        <ul>
          <li><span data-lang="en">Paid ads (Google + Meta) launched with retargeting</span><span data-lang="es">Ads pagadas (Google + Meta) con retargeting</span></li>
          <li><span data-lang="en">AI Booking Agent handles FAQ + reservations 24/7</span><span data-lang="es">Agente de reservas IA atiende FAQ 24/7</span></li>
          <li><span data-lang="en">Instagram Reels cadence (3/week) + TikTok launch</span><span data-lang="es">Cadencia de Reels (3/semana) + TikTok</span></li>
          <li><span data-lang="en">Email drip sequence (5 touches) active for leads</span><span data-lang="es">Drip de email (5 toques) activo para leads</span></li>
          <li><span data-lang="en">Review automation lifts Google stars 3.8 → 4.6</span><span data-lang="es">Automación de reseñas sube Google 3.8 → 4.6</span></li>
        </ul>
      </div>
      <div class="phase">
        <div class="days"><span data-lang="en">Days 61–90</span><span data-lang="es">Días 61–90</span></div>
        <h3><span data-lang="en">Compounding</span><span data-lang="es">Compounding</span></h3>
        <ul>
          <li><span data-lang="en">AI SEO program ranks for 20+ {city} keywords</span><span data-lang="es">Programa SEO IA posiciona 20+ keywords de {city}</span></li>
          <li><span data-lang="en">Lookalike audiences from converted customers built</span><span data-lang="es">Audiencias lookalike de clientes convertidos</span></li>
          <li><span data-lang="en">A/B test on landing page lifts conversion +18%</span><span data-lang="es">A/B test en landing eleva conversión +18%</span></li>
          <li><span data-lang="en">Monthly dashboard: pipeline, CAC, LTV, ROAS</span><span data-lang="es">Dashboard: pipeline, CAC, LTV, ROAS</span></li>
          <li><span data-lang="en">Playbook handed off — compounding growth</span><span data-lang="es">Playbook entregado — crecimiento compuesto</span></li>
        </ul>
      </div>
    </div>
  </section>

  <section>
    <h2><span data-lang="en">Recommended services — matched to gaps</span><span data-lang="es">Servicios recomendados — matched a las brechas</span></h2>
    <p class="sub"><span data-lang="en">Sequenced by impact-to-effort ratio · prices in USD/month</span><span data-lang="es">Ordenados por ratio impacto-esfuerzo · precios en USD/mes</span></p>
    <div class="services-grid">{service_cards}</div>
  </section>

  <div class="pitch">
    <h2><span data-lang="en">Next step for {name}</span><span data-lang="es">Siguiente paso para {name}</span></h2>
    <p style="font-size:15px;opacity:.95;max-width:640px;margin:0 auto">
      <span data-lang="en">A 20-minute strategy call is all it takes to validate this audit, customize the {niche_en} playbook, and quote a Growth retainer scoped to your revenue goals.</span>
      <span data-lang="es">Un call de 20 minutos basta para validar esta auditoría, personalizar el playbook {niche_es} y cotizar un retainer de crecimiento.</span>
    </p>
    <p style="margin-top:16px;font-size:14px;opacity:.85">
      <span data-lang="en">Typical engagement: <strong style="color:#FFB770">$997/mo Growth</strong> (AI Website + Social + CRM + Ads) · <strong style="color:#FFB770">$497/mo Starter</strong> (social + CRM only) · Fractional CMO at <strong style="color:#FFB770">$1,997/mo</strong>.</span>
      <span data-lang="es">Engagement típico: <strong style="color:#FFB770">$997/mes Growth</strong> (Sitio IA + Redes + CRM + Ads) · <strong style="color:#FFB770">$497/mes Starter</strong> · CMO Fraccional a <strong style="color:#FFB770">$1,997/mes</strong>.</span>
    </p>
    <a class="cta" href="https://netwebmedia.com/contact"><span data-lang="en">Book a 20-minute strategy call →</span><span data-lang="es">Agendar call de 20 min →</span></a>
  </div>

  <p style="text-align:center;color:#999;font-size:12px;margin-top:28px">
    <span data-lang="en">Audit by NetWebMedia · netwebmedia.com · Data: US Census 2024, SBA, BLS, Statista 2025, internal dataset</span>
    <span data-lang="es">Auditoría por NetWebMedia · netwebmedia.com · Fuentes: US Census 2024, SBA, BLS, Statista 2025, dataset interno</span>
  </p>
</div>
</body>
</html>
"""

def render(contact, notes):
    name = contact.get("company","") or contact.get("name","")
    niche_key = notes.get("niche") or "smb"
    niche_en = NICHE_NAMES_EN.get(niche_key, "Small Business")
    niche_es = NICHE_NAMES_ES.get(niche_key, "Pymes")
    market = NICHE_MARKET_USA[niche_key]

    city = notes.get("city") or ""
    state_key = None
    state_name = notes.get("state") or ""
    state_code = notes.get("state_code") or ""
    # Find state_key by matching state name
    for sk, s in STATES.items():
        if s["name"] == state_name: state_key = sk; break

    website = notes.get("website") or ""
    email = contact.get("email") or ""
    phone = contact.get("phone") or "—"

    scores_en, scores_es, overall = synth_scores(name, website, email)
    platforms = synth_platforms(name)
    funnel_data, current_rev, projected_rev = synth_funnel_usa(niche_key, overall)
    gain = projected_rev - current_rev
    annual_gain = gain * 12
    uplift_pct = min(round(((projected_rev-current_rev)/max(1,current_rev))*100), 450)

    if overall < 55:
        gap_vs_niche_en = f"{55-overall} points below"
        gap_vs_niche_es = f"{55-overall} pts bajo"
    else:
        gap_vs_niche_en = f"{overall-55} points above"
        gap_vs_niche_es = f"{overall-55} pts sobre"

    gap_count = 5

    # Pain items
    pains_en = PAINS_EN_USA[niche_key]
    pains_es = PAINS_ES_USA[niche_key]
    sev_label_en = ["CRITICAL","HIGH","MEDIUM","MEDIUM","LOW"]
    sev_label_es = ["CRÍTICO","ALTO","MEDIO","MEDIO","BAJO"]
    sev_cls = ["","","med","med","low"]
    pain_items_html = ""
    for i in range(5):
        pain_items_html += (
          f'<li><span><span data-lang="en">{esc(pains_en[i])}</span><span data-lang="es">{esc(pains_es[i])}</span></span>'
          f'<span class="sev {sev_cls[i]}"><span data-lang="en">{sev_label_en[i]}</span><span data-lang="es">{sev_label_es[i]}</span></span></li>'
        )

    # Service cards
    service_cards = ""
    for svc in NICHES[niche_key]["services"]:
        info = SERVICE_PRICES.get(svc, {"price":197,"setup":297,"impact":"High"})
        svc_es = SVC_ES.get(svc, svc)
        imp_es = IMPACT_ES.get(info["impact"], info["impact"])
        service_cards += (
          f'<div class="svc">'
          f'<div class="n"><span data-lang="en">{esc(svc)}</span><span data-lang="es">{esc(svc_es)}</span></div>'
          f'<div class="p">${info["price"]}<span>/<span data-lang="en">mo</span><span data-lang="es">mes</span></span></div>'
          f'<div class="i"><span data-lang="en">Impact: {esc(info["impact"])}</span><span data-lang="es">Impacto: {esc(imp_es)}</span></div>'
          f'<div class="setup"><span data-lang="en">One-time setup: ${info["setup"]}</span><span data-lang="es">Setup único: ${info["setup"]}</span></div>'
          f'</div>'
        )

    bars_en = [(k, v, "#FF6B00") for k, v in scores_en.items()]
    bars_es = [(k, v, "#FF6B00") for k, v in scores_es.items()]

    w_cls = "good" if website else "bad"
    w_hint_en = "Active domain on file" if website else "No web presence detected"
    w_hint_es = "Dominio activo" if website else "Sin presencia web detectada"
    w_chip_en = "Website found" if website else "No website"
    w_chip_es = "Web encontrada" if website else "Sin web"

    is_free = email and any(x in email.lower() for x in ["gmail","hotmail","yahoo","outlook"])
    if is_free:
        e_cls = "warn"
        e_hint_en = "Free webmail — trust signal below custom domain"
        e_hint_es = "Webmail gratuito — señal de confianza baja"
    elif email and "@" in email:
        e_cls = "good"
        e_hint_en = "Custom domain email — solid trust signal"
        e_hint_es = "Email de dominio propio — señal de confianza sólida"
    else:
        e_cls = "bad"
        e_hint_en = "No email discoverable — outreach friction"
        e_hint_es = "Sin email detectable — fricción para outreach"
    e_chip_en = "Email on file" if email else "No email"
    e_chip_es = "Email en archivo" if email else "Sin email"

    return TPL.format(
        css=CSS, lang_switch=LANG_SWITCH_EN,
        name=esc(name), city=esc(city), state_name=esc(state_name), state_code=esc(state_code),
        niche_en=esc(niche_en), niche_es=esc(niche_es),
        website=esc(website) if website else ("No website"),
        email=esc(email) if email else ("Not found"),
        phone=esc(phone),
        w_chip_en=w_chip_en, w_chip_es=w_chip_es,
        e_chip_en=e_chip_en, e_chip_es=e_chip_es,
        market_size=market["size_usd"], market_growth=market["growth"],
        avg_ticket=market["avg_ticket_usd"],
        key_stat_en=esc(market["key_stat_en"]), key_stat_es=esc(market["key_stat_es"]),
        uplift_range=market["uplift_range"],
        gap_count=gap_count, overall=overall,
        gap_vs_niche_en=gap_vs_niche_en, gap_vs_niche_es=gap_vs_niche_es,
        current_rev=current_rev, projected_rev=projected_rev, gain=gain, annual_gain=annual_gain,
        uplift_pct=uplift_pct,
        gauge=svg_gauge(overall, 200),
        radar=svg_radar(scores_en, scores_es, 340),
        bars=svg_bars(bars_en, bars_es),
        platform_bars=svg_donut_platforms(platforms),
        comparison=svg_comparison(overall),
        funnel=svg_funnel(funnel_data, funnel_data),
        pain_items=pain_items_html, service_cards=service_cards,
        w_cls=w_cls, e_cls=e_cls,
        w_hint_en=w_hint_en, w_hint_es=w_hint_es,
        e_hint_en=e_hint_en, e_hint_es=e_hint_es,
    )

def path_from_page(page):
    path = page.lstrip("/")
    if not path.startswith("companies-usa/"): return ""
    return path[len("companies-usa/"):]

def main():
    with open(USA_JSON, "r", encoding="utf-8") as f:
        contacts = json.load(f)
    root = os.path.join(ROOT, "companies-usa")
    wrote = errs = skipped = 0
    for c in contacts:
        try: notes = json.loads(c.get("notes") or "{}")
        except: notes = {}
        page = notes.get("page") or ""
        if not page: skipped += 1; continue
        rel = path_from_page(page)
        if not rel: skipped += 1; continue
        fp = os.path.join(root, safe_fs(rel).replace("/", os.sep))
        try:
            os.makedirs(os.path.dirname(fp), exist_ok=True)
            with open(fp, "w", encoding="utf-8") as fh: fh.write(render(c, notes))
            wrote += 1
        except Exception as e:
            errs += 1
            if errs <= 5: print(f"[err] {c.get('company') or c.get('name')}: {e}")
    print(f"wrote={wrote} skipped={skipped} errors={errs} total={len(contacts)}")

if __name__ == "__main__":
    main()
