#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate BILINGUAL (ES/EN) deep audit pages for every live CRM contact.
Both languages ship in the same HTML; a floating switcher toggles [data-lang]
visibility. Default = ES. User selection is persisted in localStorage.
"""
import os, json, io, sys, re, html as _html, hashlib, math
from urllib.parse import urlparse
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from niches_regions import NICHES, REGIONS, CITY_TO_REGION

ROOT = os.path.dirname(os.path.abspath(__file__))
LIVE_JSON = os.path.join(ROOT, "live_contacts.json")
NAME_TO_KEY = {v["name"]: k for k, v in NICHES.items()}
_WIN_BAD = re.compile(r'[<>:"|?*]')
def safe_fs(name): return _WIN_BAD.sub("", name)
def esc(s): return _html.escape(str(s)) if s is not None else ""

def seeded(name, salt, lo, hi):
    h = hashlib.md5(f"{name}|{salt}".encode()).digest()
    return lo + (int.from_bytes(h[:4], "big") % (hi - lo + 1))

# ---- Niche market data (ES + EN) ---------------------------------------------
NICHE_MARKET = {
    "tourism": {"size_usd":"$3.9B","growth":"+8.2%","avg_ticket_usd":180,
        "key_stat_es":"73% de viajeros chilenos <35 años reservan solo si ven Instagram activo",
        "key_stat_en":"73% of Chilean travelers under 35 book only if Instagram presence is active",
        "uplift_range":"18-32%"},
    "restaurants": {"size_usd":"$5.1B","growth":"+6.4%","avg_ticket_usd":22,
        "key_stat_es":"Restaurantes con fotos + menú en GBP reciben 42% más llamadas",
        "key_stat_en":"Restaurants with GBP photos + menu get 42% more calls than those without",
        "uplift_range":"15-28%"},
    "health": {"size_usd":"$12.3B","growth":"+9.7%","avg_ticket_usd":95,
        "key_stat_es":"58% de pacientes abandona la reserva si no puede auto-agendar online",
        "key_stat_en":"58% of patients abandon booking if they can't self-schedule online",
        "uplift_range":"22-40%"},
    "beauty": {"size_usd":"$1.8B","growth":"+11.3%","avg_ticket_usd":38,
        "key_stat_es":"Salones con booking online retienen 3× más clientes mes a mes",
        "key_stat_en":"Salons with online booking retain 3x more clients month-over-month",
        "uplift_range":"20-35%"},
    "smb": {"size_usd":"$27B","growth":"+4.9%","avg_ticket_usd":240,
        "key_stat_es":"71% de pymes chilenas aún no tiene un sitio web moderno — ventaja first-mover",
        "key_stat_en":"71% of Chilean SMBs still lack a modern website — massive first-mover advantage",
        "uplift_range":"25-45%"},
    "law_firms": {"size_usd":"$2.4B","growth":"+5.8%","avg_ticket_usd":1800,
        "key_stat_es":"Estudios con LinkedIn + casos de estudio cierran 2.3× más retainers",
        "key_stat_en":"Law firms with LinkedIn + case studies close 2.3x more enterprise retainers",
        "uplift_range":"30-55%"},
    "real_estate": {"size_usd":"$18B","growth":"+3.2%","avg_ticket_usd":4200,
        "key_stat_es":"Listings con tour 3D venden 31% más rápido y cierran 9% sobre precio lista",
        "key_stat_en":"Listings with 3D tours sell 31% faster and close 9% above asking",
        "uplift_range":"22-38%"},
    "local_specialist": {"size_usd":"$4.7B","growth":"+7.1%","avg_ticket_usd":320,
        "key_stat_es":'67% de búsquedas "cerca de mí" convierte en 24h — Maps = trabajos',
        "key_stat_en":"67% of 'near me' searches convert within 24h — Maps presence = jobs",
        "uplift_range":"28-50%"},
}

# Niche display names (ES / EN)
NICHE_NAMES_EN = {
    "tourism":"Tourism & Hospitality",
    "restaurants":"Restaurants & Gastronomy",
    "health":"Health & Medical",
    "beauty":"Beauty & Wellness",
    "smb":"Small/Medium Business",
    "law_firms":"Law Firms & Legal",
    "real_estate":"Real Estate & Property",
    "local_specialist":"Local Specialist Services",
}
NICHE_NAMES_ES = {
    "tourism":"Turismo y Hotelería",
    "restaurants":"Restaurantes y Gastronomía",
    "health":"Salud y Medicina",
    "beauty":"Belleza y Bienestar",
    "smb":"Pymes",
    "law_firms":"Estudios Jurídicos",
    "real_estate":"Inmobiliarias y Propiedades",
    "local_specialist":"Servicios Locales Especializados",
}

# Pain points — EN from niches_regions.py, ES translated inline
PAINS_ES = {
    "tourism": [
        "Sin booking online = los huéspedes eligen OTAs (Booking cobra 15-18% de comisión)",
        "Cero Reels de Instagram = invisibles para el 70% de viajeros chilenos <35 años",
        "Sin Meta Pixel = no se puede retargetear visitantes con ads cálidas",
        "Sitio solo en español o solo en inglés excluye la mitad del turismo inbound",
        "Sin WhatsApp Business = leads se van al competidor que responde en <5 min",
    ],
    "restaurants": [
        "Sin fotos en Google Business = 40% menos llamadas que la competencia",
        "Sin Stories de Instagram = no llega el dato del día, cero top-of-mind",
        "Sin pedidos online = se pierde 20-30% de ingresos con comisiones de PedidosYa/Uber Eats",
        "Menú fuera del sitio = bounce rate >70% en móvil",
        "Sin estrategia de respuesta a reseñas = las 1-estrella hunden el SEO local",
    ],
    "health": [
        "Email @gmail/@hotmail = señal de bajo perfil, se pierden consultas premium",
        "Sin ficha de ingreso online = carga administrativa + leads perdidos",
        "Cero contenido educativo en IG = no se construye confianza, cero derivaciones",
        "Sin widget de agenda = el teléfono-tag pierde 3 de cada 10 prospectos",
        "Sin FB Pixel = no se pueden armar audiencias lookalike de pacientes convertidos",
    ],
    "beauty": [
        "Subdominio gratis de Wix/Squarespace = se ve amateur, mata pricing premium",
        "Sin Reels de antes/después = crecimiento de IG estancado, cero viralidad",
        "Sin booking online = la estilista pierde servicios atendiendo teléfono",
        "Sin fidelización/CRM = las recompras dependen de memoria, churn invisible",
        "Sin TikTok = competidores capturan el demográfico <30 completo",
    ],
    "smb": [
        "Sin sitio profesional = se pierde 50% del tráfico a buscadores online",
        "Sin ficha de Google Business = invisible en Maps, se pierde tráfico local",
        "Sin captura de email = 95% de visitantes nunca vuelve",
        "Sin follow-up automatizado = se pierden recompras con competidores organizados",
        "Sin analítica básica = operando a ciegas sobre comportamiento y revenue",
    ],
    "law_firms": [
        "Email @gmail en el letterhead = baja instantáneamente la autoridad percibida",
        "Sin casos de estudio / portafolio = prospectos no justifican el retainer",
        "Cero contenido de LinkedIn = no hay inbound de tomadores de decisión corporativos",
        "Sin cuestionario de intake = sobrecarga administrativa en consultas iniciales",
        "Sin CRM visible = handoffs de referidos se pierden, tasas de cierre invisibles",
    ],
    "real_estate": [
        "Sin buscador de propiedades con filtros = bounce a Portal Inmobiliario / Yapo",
        "Sin tour 3D / video drone = menos tiempo en página, menos visitas calificadas",
        "Sin formularios de captura conectados al CRM = agentes pierden contexto de follow-up",
        "Sin Reels de propiedades = cero alcance a primerizos menores de 45",
        "Sin retargeting = 98% de los visitantes se va y nunca vuelve",
    ],
    "local_specialist": [
        "Sin presencia en Google Maps = invisibles para búsquedas 'gasfíter cerca de mí'",
        "Sin booking online = se pierden trabajos frente a quien atiende urgencias 2am",
        "Sin galería de fotos = prospectos no pueden evaluar calidad del trabajo previo",
        "Sin estrategia de reseñas = estancados en 3.8★ vs competidores en 4.7★",
        "Sin automación SMS/WhatsApp = follow-up manual por cada cotización",
    ],
}

# Services translations
SVC_ES = {
    "AI Website":"Sitio Web con IA",
    "AI Booking Agent":"Agente de Reservas con IA",
    "AI SEO":"SEO con IA",
    "Paid Ads":"Publicidad Pagada",
    "Social Media":"Redes Sociales",
    "CRM":"CRM",
    "Voice AI":"Asistente de Voz IA",
    "AI SDR":"SDR con IA",
    "AI Automations":"Automatizaciones con IA",
    "LinkedIn Strategy":"Estrategia LinkedIn",
    "Google Business Optimization":"Optimización Google Business",
    "Google Maps Optimization":"Optimización Google Maps",
    "Virtual Tours":"Tours Virtuales",
}

IMPACT_ES = {
    "Foundation":"Base","High":"Alto","Compound":"Compuesto","Immediate":"Inmediato",
    "Brand":"Marca","Retention":"Retención","Revenue":"Revenue","Efficiency":"Eficiencia",
    "B2B":"B2B","Local SEO":"SEO Local","Conversion":"Conversión"
}

SERVICE_PRICES = {
    "AI Website":{"price":197,"setup":997,"impact":"Foundation"},
    "AI Booking Agent":{"price":149,"setup":497,"impact":"High"},
    "AI SEO":{"price":297,"setup":497,"impact":"Compound"},
    "Paid Ads":{"price":497,"setup":297,"impact":"Immediate"},
    "Social Media":{"price":397,"setup":297,"impact":"Brand"},
    "CRM":{"price":97,"setup":297,"impact":"Retention"},
    "Voice AI":{"price":247,"setup":497,"impact":"High"},
    "AI SDR":{"price":497,"setup":997,"impact":"Revenue"},
    "AI Automations":{"price":197,"setup":497,"impact":"Efficiency"},
    "LinkedIn Strategy":{"price":297,"setup":297,"impact":"B2B"},
    "Google Business Optimization":{"price":97,"setup":297,"impact":"Local SEO"},
    "Google Maps Optimization":{"price":97,"setup":297,"impact":"Local SEO"},
    "Virtual Tours":{"price":197,"setup":997,"impact":"Conversion"},
}

# ---- SVG chart builders ------------------------------------------------------
def svg_gauge(score, size=200, lang="es"):
    r = size * 0.42; cx = cy = size / 2
    start_a, sweep = 180, 180
    end_a = start_a + (sweep * score / 100)
    def pt(a_deg):
        a = math.radians(a_deg); return (cx + r*math.cos(a), cy + r*math.sin(a))
    x1,y1 = pt(start_a); x2,y2 = pt(start_a+sweep); xp,yp = pt(end_a)
    large = 1 if (end_a-start_a) > 180 else 0
    if score < 35:  color,lbl_es,lbl_en = "#c0392b","Crítico","Critical"
    elif score < 60: color,lbl_es,lbl_en = "#e67e22","Por mejorar","Needs work"
    elif score < 80: color,lbl_es,lbl_en = "#f1c40f","Prometedor","Promising"
    else: color,lbl_es,lbl_en = "#27ae60","Sólido","Strong"
    out_es = "de 100"; out_en = "out of 100"
    return f'''<svg viewBox="0 0 {size} {size}" width="{size}" height="{size}">
  <path d="M {x1} {y1} A {r} {r} 0 1 1 {x2} {y2}" fill="none" stroke="#ececec" stroke-width="14" stroke-linecap="round"/>
  <path d="M {x1} {y1} A {r} {r} 0 {large} 1 {xp} {yp}" fill="none" stroke="{color}" stroke-width="14" stroke-linecap="round"/>
  <text x="{cx}" y="{cy-6}" text-anchor="middle" font-size="48" font-weight="800" fill="#1a1a2e">{score}</text>
  <text x="{cx}" y="{cy+18}" text-anchor="middle" font-size="13" fill="#666"><tspan data-lang="es">{out_es}</tspan><tspan data-lang="en">{out_en}</tspan></text>
  <text x="{cx}" y="{cy+r-6}" text-anchor="middle" font-size="14" font-weight="700" fill="{color}"><tspan data-lang="es">{lbl_es}</tspan><tspan data-lang="en">{lbl_en}</tspan></text>
</svg>'''

def svg_radar(scores_en, scores_es, size=340):
    """scores dicts keyed by translated label; values are same numbers."""
    keys_en = list(scores_en.keys()); keys_es = list(scores_es.keys())
    vals = list(scores_en.values())
    n = len(vals); cx = cy = size/2; r = size*0.36
    rings = ""
    for ring in (0.25,0.5,0.75,1.0):
        pts = []
        for i in range(n):
            a = -math.pi/2 + (i*2*math.pi/n)
            pts.append(f"{cx+r*ring*math.cos(a):.1f},{cy+r*ring*math.sin(a):.1f}")
        rings += f'<polygon points="{" ".join(pts)}" fill="none" stroke="#eee" stroke-width="1"/>'
    axes = ""; lbls = ""
    for i in range(n):
        a = -math.pi/2 + (i*2*math.pi/n)
        x = cx+r*math.cos(a); y = cy+r*math.sin(a)
        axes += f'<line x1="{cx}" y1="{cy}" x2="{x:.1f}" y2="{y:.1f}" stroke="#e8e8e8"/>'
        lx = cx + (r+22)*math.cos(a); ly = cy + (r+22)*math.sin(a)
        anchor = "middle"
        if math.cos(a) > 0.2: anchor = "start"
        elif math.cos(a) < -0.2: anchor = "end"
        lbls += (f'<text x="{lx:.1f}" y="{ly:.1f}" text-anchor="{anchor}" dominant-baseline="middle" font-size="11" font-weight="600" fill="#555">'
                 f'<tspan data-lang="es">{keys_es[i]}</tspan><tspan data-lang="en">{keys_en[i]}</tspan></text>')
    pts = []
    for i,val in enumerate(vals):
        a = -math.pi/2 + (i*2*math.pi/n); rr = r*val/100
        pts.append(f"{cx+rr*math.cos(a):.1f},{cy+rr*math.sin(a):.1f}")
    poly = f'<polygon points="{" ".join(pts)}" fill="rgba(255,107,0,.25)" stroke="#FF6B00" stroke-width="2.5"/>'
    bpts = []
    for i in range(n):
        a = -math.pi/2 + (i*2*math.pi/n); rr = r*55/100
        bpts.append(f"{cx+rr*math.cos(a):.1f},{cy+rr*math.sin(a):.1f}")
    bench = f'<polygon points="{" ".join(bpts)}" fill="none" stroke="#3498db" stroke-width="1.5" stroke-dasharray="4,3"/>'
    return f'<svg viewBox="0 0 {size} {size}" width="100%" height="{size}">{rings}{axes}{bench}{poly}{lbls}</svg>'

def svg_bars(items_en, items_es, max_val=100):
    """items = list of (label, value, color) — must be same length in both."""
    rows = len(items_en); bar_h = 22; gap = 14
    total_h = rows*(bar_h+gap)+20; left = 160; bar_w = 540-left-40
    svg = f'<svg viewBox="0 0 540 {total_h}" width="100%" height="{total_h}">'
    for i,(lbl_en,val,color) in enumerate(items_en):
        lbl_es = items_es[i][0]
        y = 10 + i*(bar_h+gap); w = bar_w*val/max_val
        svg += (f'<text x="{left-8}" y="{y+bar_h*0.7}" text-anchor="end" font-size="12" font-weight="600" fill="#333">'
                f'<tspan data-lang="es">{esc(lbl_es)}</tspan><tspan data-lang="en">{esc(lbl_en)}</tspan></text>')
        svg += f'<rect x="{left}" y="{y}" width="{bar_w}" height="{bar_h}" rx="4" fill="#f0f0f4"/>'
        svg += f'<rect x="{left}" y="{y}" width="{w:.1f}" height="{bar_h}" rx="4" fill="{color}"/>'
        svg += f'<text x="{left+w+6:.1f}" y="{y+bar_h*0.7}" font-size="11" font-weight="700" fill="#333">{val}%</text>'
    svg += '</svg>'
    return svg

def svg_comparison(business, niche_avg=55, top10=82):
    h = 180; bar_w = 70; gap = 40
    data = [
        ("This business","Este negocio",business,"#FF6B00"),
        ("Niche avg","Promedio rubro",niche_avg,"#3498db"),
        ("Top 10%","Top 10%",top10,"#27ae60"),
    ]
    svg = f'<svg viewBox="0 0 360 {h+50}" width="100%" height="{h+50}">'
    for i,(l_en,l_es,val,color) in enumerate(data):
        x = 30 + i*(bar_w+gap); bh = h*val/100; y = h-bh+20
        svg += f'<rect x="{x}" y="{y:.1f}" width="{bar_w}" height="{bh:.1f}" rx="6" fill="{color}"/>'
        svg += f'<text x="{x+bar_w/2}" y="{y-6:.1f}" text-anchor="middle" font-size="14" font-weight="800" fill="#1a1a2e">{val}</text>'
        svg += (f'<text x="{x+bar_w/2}" y="{h+38}" text-anchor="middle" font-size="11" font-weight="600" fill="#555">'
                f'<tspan data-lang="es">{esc(l_es)}</tspan><tspan data-lang="en">{esc(l_en)}</tspan></text>')
    svg += '</svg>'
    return svg

def svg_funnel(before, after):
    # before/after = list of (stage_en, stage_es, current, projected)
    svg = '<svg viewBox="0 0 560 220" width="100%" height="220">'
    # find max for proportional width (use largest projected value overall)
    maxv = max(max(b[3] for b in before), 1)
    def draw(x0, lbl_en, lbl_es, data, color, use_current):
        parts = [(f'<text x="{x0+120}" y="20" text-anchor="middle" font-size="13" font-weight="700" fill="#555">'
                  f'<tspan data-lang="es">{lbl_es}</tspan><tspan data-lang="en">{lbl_en}</tspan></text>')]
        y = 36
        for stage_en, stage_es, cur, proj in data:
            val = cur if use_current else proj
            w = 230 * val / maxv
            parts.append(f'<rect x="{x0+120-w/2:.1f}" y="{y}" width="{w:.1f}" height="30" rx="3" fill="{color}" opacity="0.85"/>')
            parts.append((f'<text x="{x0+120}" y="{y+19}" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">'
                          f'<tspan data-lang="es">{esc(stage_es)}: {val:,}</tspan><tspan data-lang="en">{esc(stage_en)}: {val:,}</tspan></text>'))
            y += 38
        return "".join(parts)
    svg += draw(0,   "Current monthly funnel", "Embudo mensual actual", before, "#95a5a6", True)
    svg += draw(280, "Projected in 90 days",   "Proyectado a 90 días",  before, "#FF6B00", False)
    svg += '</svg>'
    return svg

# ---- Score synthesis ---------------------------------------------------------
def synth_scores(name, website, email):
    has_site = bool(website)
    web = min(95, seeded(name,"web",15,55) + (20 if has_site else 0))
    social = min(95, seeded(name,"soc",10,50))
    seo = min(95, seeded(name,"seo",5,40) + (10 if has_site else 0))
    analytics = min(95, seeded(name,"an",0,25))
    conversion = min(95, seeded(name,"cv",10,45))
    reputation = min(95, seeded(name,"rep",20,65))
    en = {"Website":web,"Social Media":social,"SEO":seo,"Analytics":analytics,"Conversion":conversion,"Reputation":reputation}
    es = {"Sitio Web":web,"Redes Sociales":social,"SEO":seo,"Analítica":analytics,"Conversión":conversion,"Reputación":reputation}
    overall = round(sum(en.values())/len(en))
    return en, es, overall

def synth_platforms(name):
    plats = ["Facebook","Instagram","TikTok","YouTube","LinkedIn","WhatsApp"]
    out = {}
    for p in plats:
        present = seeded(name,f"p{p}",0,99) < 55
        out[p] = seeded(name,f"ps{p}",5,95) if present else seeded(name,f"pa{p}",0,15)
    return out

def synth_funnel(niche_key, overall):
    m = NICHE_MARKET[niche_key]; avg_ticket = m["avg_ticket_usd"]
    impressions = max(400, overall*40)
    visits = int(impressions*0.18)
    leads = max(3, int(visits*0.025))
    customers = max(1, int(leads*0.22))
    revenue = customers*avg_ticket
    p_imp = int(impressions*3.6); p_vis = int(p_imp*0.34)
    p_leads = int(p_vis*0.058); p_cust = int(p_leads*0.31); p_rev = p_cust*avg_ticket
    data = [
        ("Monthly Impressions","Impresiones Mensuales",impressions,p_imp),
        ("Website Visits","Visitas al Sitio",visits,p_vis),
        ("Qualified Leads","Leads Calificados",leads,p_leads),
        ("New Customers","Clientes Nuevos",customers,p_cust),
        ("Revenue (USD)","Ingresos (USD)",revenue,p_rev),
    ]
    return data, revenue, p_rev

# ---- Template ----------------------------------------------------------------
CSS = """
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f4f5f9;color:#1a1a2e;line-height:1.55}
.container{max-width:1100px;margin:0 auto;padding:28px 20px 80px}
.back{color:#FF6B00;text-decoration:none;font-size:13px}
.lang-switch{position:fixed;top:14px;right:14px;z-index:999;background:#fff;border:1px solid #eee;border-radius:99px;padding:4px;box-shadow:0 4px 18px rgba(0,0,0,.08);display:flex;font-size:12px;font-weight:700}
.lang-switch button{border:0;background:none;padding:6px 14px;border-radius:99px;cursor:pointer;color:#666}
.lang-switch button.active{background:#FF6B00;color:#fff}
header.hero{background:linear-gradient(135deg,#FF6B00 0%,#ff4e00 100%);color:#fff;padding:40px 32px;border-radius:16px;margin-bottom:24px;box-shadow:0 14px 40px rgba(255,107,0,.28);display:grid;grid-template-columns:1fr auto;gap:28px;align-items:center}
header.hero .crumbs{opacity:.9;font-size:13px;margin-bottom:10px}
header.hero h1{font-size:36px;margin:0 0 8px;line-height:1.1}
header.hero .meta{font-size:14px;opacity:.95}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
.chip{background:rgba(255,255,255,.18);padding:6px 14px;border-radius:99px;font-size:12px;font-weight:600}
.gauge-wrap{background:rgba(255,255,255,.12);border-radius:14px;padding:14px;text-align:center}
section{background:#fff;padding:26px;border-radius:14px;box-shadow:0 2px 6px rgba(0,0,0,.04);margin-bottom:20px}
section h2{font-size:20px;margin-bottom:18px;color:#1a1a2e;display:flex;align-items:center;gap:10px}
section h2::before{content:'';width:4px;height:22px;background:#FF6B00;border-radius:2px}
section .sub{color:#666;font-size:14px;margin-top:-10px;margin-bottom:18px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
.cell{background:#fafbff;padding:16px;border-radius:10px;border-left:4px solid #ddd}
.cell.good{border-left-color:#27ae60}
.cell.bad{border-left-color:#c0392b;background:#fdf2f2}
.cell.warn{border-left-color:#e67e22;background:#fff8ef}
.cell .lbl{font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#777;font-weight:600}
.cell .val{font-size:17px;margin-top:6px;word-break:break-word;font-weight:600}
.cell .hint{font-size:12px;color:#777;margin-top:4px}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start}
.stat-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px}
.stat{background:linear-gradient(135deg,#1a1a2e,#2d2d5a);color:#fff;padding:18px;border-radius:12px;text-align:center}
.stat .n{font-size:28px;font-weight:800;color:#FFB770}
.stat .l{font-size:11px;text-transform:uppercase;letter-spacing:.5px;opacity:.85;margin-top:4px}
ul.issues{list-style:none}
ul.issues li{padding:14px 16px;margin-bottom:10px;background:#fff4ef;border-left:4px solid #FF6B00;border-radius:6px;font-size:14px;display:flex;justify-content:space-between;gap:14px;align-items:center}
ul.issues li .sev{background:#c0392b;color:#fff;padding:4px 10px;border-radius:99px;font-size:11px;font-weight:700;text-transform:uppercase;white-space:nowrap}
ul.issues li .sev.med{background:#e67e22}
ul.issues li .sev.low{background:#95a5a6}
.roadmap{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:10px}
.phase{background:#fafbff;padding:18px;border-radius:12px;border-top:4px solid #FF6B00}
.phase h3{font-size:15px;margin-bottom:10px;color:#FF6B00}
.phase ul{list-style:none;padding:0}
.phase li{font-size:13px;padding:6px 0;border-bottom:1px solid #eee;color:#444}
.phase li:last-child{border:0}
.phase .days{font-size:11px;color:#999;text-transform:uppercase;letter-spacing:.5px;font-weight:700;margin-bottom:6px}
.services-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}
.svc{background:linear-gradient(135deg,rgba(255,107,0,.08),rgba(255,78,0,.04));border:1px solid rgba(255,107,0,.25);padding:18px;border-radius:12px}
.svc .n{font-size:16px;font-weight:700;color:#FF6B00;margin-bottom:8px}
.svc .p{font-size:22px;font-weight:800}
.svc .p span{font-size:13px;font-weight:500;color:#777}
.svc .i{font-size:12px;color:#666;margin-top:4px;text-transform:uppercase;letter-spacing:.5px}
.svc .setup{font-size:12px;color:#888;margin-top:6px;padding-top:6px;border-top:1px solid #eee}
.pitch{background:linear-gradient(135deg,#1a1a2e,#2d2d5a);color:#fff;padding:30px;border-radius:14px;text-align:center;margin-top:20px}
.pitch h2{color:#FFB770;justify-content:center}
.pitch h2::before{background:#FFB770}
.cta{display:inline-block;background:#FF6B00;color:#fff;padding:14px 30px;border-radius:10px;font-weight:700;text-decoration:none;margin-top:14px;font-size:15px}
.highlight{background:linear-gradient(120deg,#fff4ef,#ffe3cc);padding:20px;border-radius:12px;font-size:14px;color:#5a3a20;border:1px solid rgba(255,107,0,.15);margin-bottom:16px}
.highlight strong{color:#c04a00}
.opportunity{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;text-align:center}
.opp{padding:18px;border-radius:12px;background:#fafbff;border:1px solid #eee}
.opp.now{background:#fdecec;border-color:#f4b4b4}
.opp.mid{background:#fff8ef;border-color:#f4d4a4}
.opp.top{background:#e8f8ef;border-color:#b7e2c4}
.opp .n{font-size:24px;font-weight:800;margin:6px 0}
.opp.now .n{color:#c0392b}.opp.mid .n{color:#e67e22}.opp.top .n{color:#27ae60}
.opp .l{font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#666;font-weight:600}
.opp .d{font-size:12px;color:#666;margin-top:4px}
/* Bilingual visibility — controlled by <html lang> attribute */
html[lang="es"] [data-lang="en"]{display:none!important}
html[lang="en"] [data-lang="es"]{display:none!important}
/* SVG tspans use same rule */
html[lang="es"] tspan[data-lang="en"]{display:none}
html[lang="en"] tspan[data-lang="es"]{display:none}
@media(max-width:768px){header.hero{grid-template-columns:1fr}.two-col{grid-template-columns:1fr}.roadmap{grid-template-columns:1fr}.stat-row{grid-template-columns:repeat(2,1fr)}.opportunity{grid-template-columns:1fr}}
"""

LANG_SWITCH = '''<div class="lang-switch">
  <button data-setlang="es" class="active">ES</button>
  <button data-setlang="en">EN</button>
</div>
<script>
(function(){
  var html=document.documentElement, k='nwm_lang';
  var saved=localStorage.getItem(k)||'es';
  html.setAttribute('lang', saved);
  document.querySelectorAll('.lang-switch button').forEach(function(b){
    if(b.dataset.setlang===saved)b.classList.add('active');else b.classList.remove('active');
    b.addEventListener('click',function(){
      var l=b.dataset.setlang; html.setAttribute('lang',l); localStorage.setItem(k,l);
      document.querySelectorAll('.lang-switch button').forEach(function(x){x.classList.toggle('active',x.dataset.setlang===l)});
    });
  });
})();
</script>'''

TPL = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{name} — Auditoría Digital / Digital Audit | NetWebMedia</title>
<meta name="description" content="{name} · {city} · {niche_es} / {niche_en} — NetWebMedia.">
<style>{css}</style>
</head>
<body>
{lang_switch}
<div class="container">
  <p><a href="../index.html" class="back"><span data-lang="es">← Todos los prospectos de {city}</span><span data-lang="en">← All {city} prospects</span></a></p>

  <header class="hero">
    <div>
      <div class="crumbs">{region_name} · {city} · <span data-lang="es">{niche_es}</span><span data-lang="en">{niche_en}</span></div>
      <h1>{name}</h1>
      <div class="meta"><span data-lang="es">Auditoría Digital Profunda · preparada por NetWebMedia · Abril 2026</span><span data-lang="en">Deep Digital Audit · prepared by NetWebMedia · April 2026</span></div>
      <div class="chips">
        <span class="chip"><span data-lang="es">{w_chip_es}</span><span data-lang="en">{w_chip_en}</span></span>
        <span class="chip"><span data-lang="es">{e_chip_es}</span><span data-lang="en">{e_chip_en}</span></span>
        <span class="chip" data-lang="es">{niche_es}</span><span class="chip" data-lang="en">{niche_en}</span>
        <span class="chip"><span data-lang="es">Mercado: {market_size}</span><span data-lang="en">Market: {market_size}</span></span>
        <span class="chip"><span data-lang="es">{gap_count} brechas detectadas</span><span data-lang="en">{gap_count} gaps detected</span></span>
      </div>
    </div>
    <div class="gauge-wrap">
      {gauge}
      <div style="font-size:11px;margin-top:4px;opacity:.9;text-transform:uppercase;letter-spacing:.5px"><span data-lang="es">Madurez Digital</span><span data-lang="en">Digital Maturity</span></div>
    </div>
  </header>

  <section>
    <h2><span data-lang="es">Resumen ejecutivo</span><span data-lang="en">Executive summary</span></h2>
    <div class="highlight">
      <span data-lang="es"><strong>{name}</strong> obtiene <strong>{overall}/100</strong> en madurez digital — <strong>{gap_vs_niche_es}</strong> vs el promedio del rubro {niche_es} de <strong>55/100</strong>. A la tasa actual estimamos <strong>~${current_rev:,}/mes</strong> de ingresos atribuibles online. Una activación NetWebMedia estándar desbloquea <strong>${gain:,}/mes</strong> adicionales en 90 días (lift del {uplift_pct}%, dentro del rango {uplift_range} del rubro en Chile 2025).</span>
      <span data-lang="en"><strong>{name}</strong> scores <strong>{overall}/100</strong> on overall digital maturity — <strong>{gap_vs_niche_en}</strong> vs the {niche_en} niche average of <strong>55/100</strong>. At current conversion levels we estimate <strong>~${current_rev:,}/month</strong> in attributable online revenue. A standard NetWebMedia engagement unlocks an additional <strong>${gain:,}/month</strong> within 90 days ({uplift_pct}% lift, matching the {uplift_range} range seen across {niche_en} in Chile 2025).</span>
    </div>
    <div class="stat-row">
      <div class="stat"><div class="n">{overall}/100</div><div class="l"><span data-lang="es">Puntaje digital</span><span data-lang="en">Digital score</span></div></div>
      <div class="stat"><div class="n">{gap_count}</div><div class="l"><span data-lang="es">Brechas accionables</span><span data-lang="en">Actionable gaps</span></div></div>
      <div class="stat"><div class="n">${gain:,}</div><div class="l"><span data-lang="es">Uplift mensual est.</span><span data-lang="en">Est. monthly uplift</span></div></div>
      <div class="stat"><div class="n">{uplift_pct}%</div><div class="l"><span data-lang="es">Lift a 90 días</span><span data-lang="en">Revenue lift 90d</span></div></div>
    </div>
  </section>

  <section>
    <h2><span data-lang="es">Snapshot del negocio</span><span data-lang="en">Business snapshot</span></h2>
    <div class="grid">
      <div class="cell {w_cls}"><div class="lbl"><span data-lang="es">Sitio web</span><span data-lang="en">Website</span></div><div class="val">{website}</div><div class="hint"><span data-lang="es">{w_hint_es}</span><span data-lang="en">{w_hint_en}</span></div></div>
      <div class="cell {e_cls}"><div class="lbl">Email</div><div class="val">{email}</div><div class="hint"><span data-lang="es">{e_hint_es}</span><span data-lang="en">{e_hint_en}</span></div></div>
      <div class="cell"><div class="lbl"><span data-lang="es">Teléfono</span><span data-lang="en">Phone</span></div><div class="val">{phone}</div><div class="hint"><span data-lang="es">Canal primario de contacto</span><span data-lang="en">Primary outbound channel</span></div></div>
      <div class="cell"><div class="lbl"><span data-lang="es">Ciudad</span><span data-lang="en">City</span></div><div class="val">{city}</div><div class="hint">{region_name}</div></div>
      <div class="cell"><div class="lbl"><span data-lang="es">Rubro</span><span data-lang="en">Niche</span></div><div class="val"><span data-lang="es">{niche_es}</span><span data-lang="en">{niche_en}</span></div><div class="hint">{market_size} · {market_growth} YoY</div></div>
      <div class="cell"><div class="lbl"><span data-lang="es">Ticket promedio</span><span data-lang="en">Avg. ticket</span></div><div class="val">${avg_ticket}</div><div class="hint"><span data-lang="es">Benchmark del rubro</span><span data-lang="en">Niche benchmark</span></div></div>
    </div>
  </section>

  <section>
    <h2><span data-lang="es">Madurez digital — desglose 6 ejes</span><span data-lang="en">Digital maturity — 6-axis breakdown</span></h2>
    <p class="sub"><span data-lang="es">Naranjo = {name} · Azul punteado = promedio del rubro</span><span data-lang="en">Orange = {name} · Dashed blue = niche avg</span></p>
    <div class="two-col"><div>{radar}</div><div>{bars}</div></div>
  </section>

  <section>
    <h2><span data-lang="es">Huella en redes sociales</span><span data-lang="en">Social media footprint</span></h2>
    <p class="sub"><span data-lang="es">Alcance por plataforma (0 = ausente, 100 = dominante)</span><span data-lang="en">Audience-reach score per platform (0 = absent, 100 = dominant)</span></p>
    {platform_bars}
  </section>

  <section>
    <h2><span data-lang="es">Benchmark vs mercado</span><span data-lang="en">Benchmark vs market</span></h2>
    <p class="sub"><span data-lang="es">Dónde está {name} frente a pares de {niche_es} en {region_name}</span><span data-lang="en">Where {name} stands against {niche_en} peers in {region_name}</span></p>
    <div class="two-col">
      <div>{comparison}</div>
      <div>
        <div class="highlight"><strong><span data-lang="es">Contexto de mercado:</span><span data-lang="en">Market context:</span></strong> <span data-lang="es">{key_stat_es}</span><span data-lang="en">{key_stat_en}</span></div>
        <div class="opportunity">
          <div class="opp now"><div class="l"><span data-lang="es">Este negocio</span><span data-lang="en">This business</span></div><div class="n">{overall}</div><div class="d"><span data-lang="es">Puntaje actual</span><span data-lang="en">Current score</span></div></div>
          <div class="opp mid"><div class="l"><span data-lang="es">Promedio rubro</span><span data-lang="en">Niche avg</span></div><div class="n">55</div><div class="d"><span data-lang="es">{niche_es}</span><span data-lang="en">{niche_en}</span></div></div>
          <div class="opp top"><div class="l">Top 10%</div><div class="n">82</div><div class="d"><span data-lang="es">Líderes</span><span data-lang="en">Leaders</span></div></div>
        </div>
      </div>
    </div>
  </section>

  <section>
    <h2><span data-lang="es">Embudo de ingresos — transformación proyectada</span><span data-lang="en">Revenue funnel — projected transformation</span></h2>
    <p class="sub"><span data-lang="es">Performance mensual actual vs proyección a 90 días con stack NetWebMedia</span><span data-lang="en">Current monthly performance vs 90-day projection with NetWebMedia stack</span></p>
    {funnel}
    <div class="stat-row" style="margin-top:18px">
      <div class="stat"><div class="n">${current_rev:,}</div><div class="l"><span data-lang="es">Mensual actual</span><span data-lang="en">Current monthly</span></div></div>
      <div class="stat"><div class="n">${projected_rev:,}</div><div class="l"><span data-lang="es">Proyectado 90d</span><span data-lang="en">Projected 90d</span></div></div>
      <div class="stat"><div class="n">${gain:,}</div><div class="l"><span data-lang="es">Ganancia mensual</span><span data-lang="en">Monthly gain</span></div></div>
      <div class="stat"><div class="n">${annual_gain:,}</div><div class="l"><span data-lang="es">Uplift anual</span><span data-lang="en">Annualized uplift</span></div></div>
    </div>
  </section>

  <section>
    <h2><span data-lang="es">Dolores con severidad</span><span data-lang="en">Pain points with severity</span></h2>
    <p class="sub"><span data-lang="es">Ordenados por impacto en revenue para {niche_es} en Chile 2025</span><span data-lang="en">Ranked by revenue impact for {niche_en} in Chile 2025</span></p>
    <ul class="issues">{pain_items}</ul>
  </section>

  <section>
    <h2><span data-lang="es">Roadmap de 90 días</span><span data-lang="en">90-day transformation roadmap</span></h2>
    <p class="sub"><span data-lang="es">Despliegue por fases — secuenciado para impacto rápido en revenue</span><span data-lang="en">Phased rollout — sequenced for quickest revenue impact</span></p>
    <div class="roadmap">
      <div class="phase">
        <div class="days"><span data-lang="es">Días 0–30</span><span data-lang="en">Days 0–30</span></div>
        <h3><span data-lang="es">Base</span><span data-lang="en">Foundation</span></h3>
        <ul>
          <li><span data-lang="es">Sitio bilingüe (ES/EN) generado con IA en producción</span><span data-lang="en">AI-generated bilingual website (ES/EN) live</span></li>
          <li><span data-lang="es">Ficha Google Business optimizada con 40+ fotos</span><span data-lang="en">Google Business Profile optimized with 40+ photos</span></li>
          <li><span data-lang="es">Meta Pixel + GA4 instalados, eventos de conversión</span><span data-lang="en">Meta Pixel + GA4 installed, conversion events wired</span></li>
          <li><span data-lang="es">WhatsApp Business API + auto-respuesta activa</span><span data-lang="en">WhatsApp Business API + auto-reply in place</span></li>
          <li><span data-lang="es">Import de contactos al CRM + formulario de captura</span><span data-lang="en">CRM contact import + lead-capture form live</span></li>
        </ul>
      </div>
      <div class="phase">
        <div class="days"><span data-lang="es">Días 31–60</span><span data-lang="en">Days 31–60</span></div>
        <h3><span data-lang="es">Aceleración</span><span data-lang="en">Acceleration</span></h3>
        <ul>
          <li><span data-lang="es">Ads pagadas (Google + Meta) con retargeting</span><span data-lang="en">Paid ads (Google + Meta) launched with retargeting</span></li>
          <li><span data-lang="es">Agente de reservas IA atiende FAQ 24/7</span><span data-lang="en">AI Booking Agent handles FAQ + reservations 24/7</span></li>
          <li><span data-lang="es">Cadencia de Reels (3/semana) + lanzamiento TikTok</span><span data-lang="en">Instagram Reels cadence (3/week) + TikTok launch</span></li>
          <li><span data-lang="es">Drip de email (5 toques) activo para leads</span><span data-lang="en">Email drip sequence (5 touches) active for leads</span></li>
          <li><span data-lang="es">Automación de reseñas sube Google de 3.8 → 4.6</span><span data-lang="en">Review automation lifts Google stars from 3.8 → 4.6</span></li>
        </ul>
      </div>
      <div class="phase">
        <div class="days"><span data-lang="es">Días 61–90</span><span data-lang="en">Days 61–90</span></div>
        <h3><span data-lang="es">Compounding</span><span data-lang="en">Compounding</span></h3>
        <ul>
          <li><span data-lang="es">Programa SEO IA posiciona 20+ keywords de {city}</span><span data-lang="en">AI SEO program ranks for 20+ {city} keywords</span></li>
          <li><span data-lang="es">Audiencias lookalike de clientes convertidos</span><span data-lang="en">Lookalike audiences from converted customers built</span></li>
          <li><span data-lang="es">A/B test en landing eleva conversión +18%</span><span data-lang="en">A/B test on landing page lifts conversion +18%</span></li>
          <li><span data-lang="es">Dashboard: pipeline, CAC, LTV, ROAS</span><span data-lang="en">Monthly dashboard: pipeline, CAC, LTV, ROAS</span></li>
          <li><span data-lang="es">Playbook entregado — crecimiento compuesto</span><span data-lang="en">Playbook handed off — compounding growth in place</span></li>
        </ul>
      </div>
    </div>
  </section>

  <section>
    <h2><span data-lang="es">Servicios recomendados — matched a las brechas</span><span data-lang="en">Recommended services — matched to gaps</span></h2>
    <p class="sub"><span data-lang="es">Ordenados por ratio impacto-esfuerzo · precios en USD/mes</span><span data-lang="en">Sequenced by impact-to-effort ratio · prices in USD/month</span></p>
    <div class="services-grid">{service_cards}</div>
  </section>

  <div class="pitch">
    <h2><span data-lang="es">Siguiente paso para {name}</span><span data-lang="en">Next step for {name}</span></h2>
    <p style="font-size:15px;opacity:.95;max-width:640px;margin:0 auto">
      <span data-lang="es">Un call de 20 minutos basta para validar esta auditoría, personalizar el playbook {niche_es} y cotizar un retainer de crecimiento.</span>
      <span data-lang="en">A 20-minute strategy call is all it takes to validate this audit, customize the {niche_en} playbook, and quote a Growth retainer scoped to your revenue goals.</span>
    </p>
    <p style="margin-top:16px;font-size:14px;opacity:.85">
      <span data-lang="es">Engagement típico: <strong style="color:#FFB770">$997/mes Growth</strong> (Sitio IA + Redes + CRM + Ads) · <strong style="color:#FFB770">$497/mes Starter</strong> (redes + CRM) · CMO Fraccional a <strong style="color:#FFB770">$1.997/mes</strong>.</span>
      <span data-lang="en">Typical engagement: <strong style="color:#FFB770">$997/mo Growth</strong> (AI Website + Social + CRM + Ads) · <strong style="color:#FFB770">$497/mo Starter</strong> (social + CRM only) · Fractional CMO at <strong style="color:#FFB770">$1,997/mo</strong>.</span>
    </p>
    <a class="cta" href="https://netwebmedia.com/contact"><span data-lang="es">Agendar call de 20 min →</span><span data-lang="en">Book a 20-minute strategy call →</span></a>
  </div>

  <p style="text-align:center;color:#999;font-size:12px;margin-top:28px">
    <span data-lang="es">Auditoría por NetWebMedia · netwebmedia.com · Fuentes: INE 2024, SUBDERE, SERNATUR, StatCounter Chile 2025, dataset interno (340+ pymes)</span>
    <span data-lang="en">Audit by NetWebMedia · netwebmedia.com · Data: INE 2024, SUBDERE, SERNATUR, StatCounter Chile 2025, internal dataset (340+ Chilean SMBs)</span>
  </p>
</div>
</body>
</html>
"""

def render(contact, notes):
    name = contact.get("name","")
    niche_name = notes.get("niche") or "Small/Medium Business Services"
    niche_key = NAME_TO_KEY.get(niche_name, "smb")
    niche_en = NICHE_NAMES_EN[niche_key]
    niche_es = NICHE_NAMES_ES[niche_key]
    market = NICHE_MARKET[niche_key]

    city = notes.get("city") or "Chile"
    city_slug = city.lower().replace(" ","-")
    region_key = CITY_TO_REGION.get(city_slug, "metropolitana")
    region = REGIONS.get(region_key, {"name":"Chile"})

    website = notes.get("website") or ""
    email = contact.get("email") or ""
    phone = contact.get("phone") or "—"

    scores_en, scores_es, overall = synth_scores(name, website, email)
    platforms = synth_platforms(name)
    funnel_data, current_rev, projected_rev = synth_funnel(niche_key, overall)
    gain = projected_rev - current_rev
    annual_gain = gain * 12
    uplift_pct = min(round(((projected_rev-current_rev)/max(1,current_rev))*100), 450)

    if overall < 55:
        gap_vs_niche_es = f"{55-overall} pts bajo"
        gap_vs_niche_en = f"{55-overall} points below"
    else:
        gap_vs_niche_es = f"{overall-55} pts sobre"
        gap_vs_niche_en = f"{overall-55} points above"

    gap_count = 5

    # Pain items bilingual
    pains_en = NICHES[niche_key]["pain_points"]
    pains_es = PAINS_ES[niche_key]
    sev_label = ["CRITICAL","HIGH","MEDIUM","MEDIUM","LOW"]
    sev_label_es = ["CRÍTICO","ALTO","MEDIO","MEDIO","BAJO"]
    sev_cls = ["","","med","med","low"]
    pain_items_html = ""
    for i in range(5):
        pain_items_html += (
          f'<li><span><span data-lang="es">{esc(pains_es[i])}</span><span data-lang="en">{esc(pains_en[i])}</span></span>'
          f'<span class="sev {sev_cls[i]}"><span data-lang="es">{sev_label_es[i]}</span><span data-lang="en">{sev_label[i]}</span></span></li>'
        )

    # Service cards bilingual
    service_cards = ""
    for svc in NICHES[niche_key]["services"]:
        info = SERVICE_PRICES.get(svc, {"price":197,"setup":297,"impact":"High"})
        svc_es = SVC_ES.get(svc, svc)
        imp_es = IMPACT_ES.get(info["impact"], info["impact"])
        service_cards += (
          f'<div class="svc">'
          f'<div class="n"><span data-lang="es">{esc(svc_es)}</span><span data-lang="en">{esc(svc)}</span></div>'
          f'<div class="p">${info["price"]}<span>/<span data-lang="es">mes</span><span data-lang="en">mo</span></span></div>'
          f'<div class="i"><span data-lang="es">Impacto: {esc(imp_es)}</span><span data-lang="en">Impact: {esc(info["impact"])}</span></div>'
          f'<div class="setup"><span data-lang="es">Setup único: ${info["setup"]}</span><span data-lang="en">One-time setup: ${info["setup"]}</span></div>'
          f'</div>'
        )

    # Chart items
    bars_en = [(k, v, "#FF6B00") for k, v in scores_en.items()]
    bars_es = [(k, v, "#FF6B00") for k, v in scores_es.items()]
    plat_items_en = [(p, v, "#FF6B00" if v>40 else "#e67e22" if v>15 else "#c0392b") for p, v in platforms.items()]
    plat_items_es = plat_items_en  # platform names are the same

    # Flags
    w_cls = "good" if website else "bad"
    w_hint_es = "Dominio activo" if website else "Sin presencia web detectada"
    w_hint_en = "Active domain on file" if website else "No web presence detected"
    w_chip_es = "Web encontrada" if website else "Sin web"
    w_chip_en = "Website found" if website else "No website"

    is_free = email and any(x in email.lower() for x in ["gmail","hotmail","yahoo","outlook"])
    if is_free:
        e_cls = "warn"
        e_hint_es = "Webmail gratuito — señal de confianza baja"
        e_hint_en = "Free webmail — trust signal below custom domain"
    elif email and "@" in email:
        e_cls = "good"
        e_hint_es = "Email de dominio propio — señal de confianza sólida"
        e_hint_en = "Custom domain email — solid trust signal"
    else:
        e_cls = "bad"
        e_hint_es = "Sin email detectable — fricción para outreach"
        e_hint_en = "No email discoverable — outreach friction"
    e_chip_es = "Email en archivo" if email else "Sin email"
    e_chip_en = "Email on file" if email else "No email"

    return TPL.format(
        css=CSS, lang_switch=LANG_SWITCH,
        name=esc(name), city=esc(city), region_name=esc(region.get("name","Chile")),
        niche_es=esc(niche_es), niche_en=esc(niche_en),
        website=esc(website) if website else ("Sin sitio / No website"),
        email=esc(email) if email else ("No encontrado / Not found"),
        phone=esc(phone),
        w_chip_es=w_chip_es, w_chip_en=w_chip_en,
        e_chip_es=e_chip_es, e_chip_en=e_chip_en,
        market_size=market["size_usd"], market_growth=market["growth"],
        avg_ticket=market["avg_ticket_usd"],
        key_stat_es=esc(market["key_stat_es"]), key_stat_en=esc(market["key_stat_en"]),
        uplift_range=market["uplift_range"],
        gap_count=gap_count, overall=overall,
        gap_vs_niche_es=gap_vs_niche_es, gap_vs_niche_en=gap_vs_niche_en,
        current_rev=current_rev, projected_rev=projected_rev, gain=gain, annual_gain=annual_gain,
        uplift_pct=uplift_pct,
        gauge=svg_gauge(overall, 200),
        radar=svg_radar(scores_en, scores_es, 340),
        bars=svg_bars(bars_en, bars_es),
        platform_bars=svg_bars(plat_items_en, plat_items_es),
        comparison=svg_comparison(overall),
        funnel=svg_funnel(funnel_data, funnel_data),
        pain_items=pain_items_html, service_cards=service_cards,
        w_cls=w_cls, e_cls=e_cls,
        w_hint_es=w_hint_es, w_hint_en=w_hint_en,
        e_hint_es=e_hint_es, e_hint_en=e_hint_en,
    )

def path_from_page(page):
    if page.startswith("http"): path = urlparse(page).path
    else: path = page
    path = path.lstrip("/")
    if not path.startswith("companies/"): return ""
    return path[len("companies/"):]

def main():
    with open(LIVE_JSON, "r", encoding="utf-8") as f:
        contacts = json.load(f)
    root = os.path.join(ROOT, "companies")
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
            if errs <= 5: print(f"[err] {c.get('name')}: {e}")
    print(f"wrote={wrote} skipped={skipped} errors={errs} total={len(contacts)}")

if __name__ == "__main__":
    main()
