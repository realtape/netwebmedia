"""
NetWebMedia - 10 Niches x 16 Chilean Regions mapping.
Used by generate_company_pages.py and crm_import.py.
"""

# ============================================================
# 6 MARKET NICHES (focused on SMB + professional services)
# ============================================================
NICHES = {
    "tourism": {
        "name": "Tourism & Hospitality",
        "icon": "🏔️",
        "keywords": ["hotel", "lodge", "cabin", "cabaña", "hostal", "hostel", "tour", "trek", "rafting", "fly", "fishing", "excursion", "turismo", "guía", "aventura", "ski", "termas", "camping"],
        "pain_points": [
            "No online booking = guests choose OTAs (Booking.com takes 15-18% commission)",
            "Zero Instagram Reels = invisible to 70% of Chilean travelers under 35",
            "No Meta Pixel = cannot retarget website visitors with warm ads",
            "English-only or Spanish-only site excludes half of inbound tourism market",
            "No WhatsApp Business = losing leads that expect sub-5-minute replies",
        ],
        "services": ["AI Booking Agent", "AI Website", "Paid Ads", "Social Media", "AI SEO"],
    },
    "restaurants": {
        "name": "Restaurants & Gastronomy",
        "icon": "🍽️",
        "keywords": ["restaurant", "restaurante", "café", "cafe", "bistro", "pizzería", "pizza", "sushi", "bar", "cocina", "gastronom", "parrilla", "picada", "marisquer", "panader"],
        "pain_points": [
            "No Google Business Profile photos = 40% fewer calls than competitors",
            "No Instagram Stories = no daily specials reach, zero top-of-mind",
            "No online ordering = losing 20-30% incremental revenue to PedidosYa/Uber Eats fees",
            "Menu not on website = bounce rate over 70% on mobile",
            "No reviews response strategy = 1-star complaints sink local SEO",
        ],
        "services": ["AI Website", "Social Media", "Google Business Optimization", "Paid Ads", "AI SEO"],
    },
    "health": {
        "name": "Health & Medical",
        "icon": "⚕️",
        "keywords": ["clínic", "clinic", "medical", "médic", "dental", "dentist", "odontolog", "kinesiolog", "psicolog", "nutric", "veterinar", "farmac", "laborator", "hospital", "salud", "terapia"],
        "pain_points": [
            "Gmail/Hotmail address signals small-time = lost high-ticket consultations",
            "No HIPAA-style patient intake form = manual admin burden, lost leads",
            "Zero educational content on Instagram = no trust-building, no referrals",
            "No appointment booking widget = phone-tag loses 3/10 prospects",
            "No FB Pixel = cannot build lookalike audiences from converted patients",
        ],
        "services": ["AI Website", "AI Booking Agent", "CRM", "Social Media", "Voice AI"],
    },
    "beauty": {
        "name": "Beauty & Wellness",
        "icon": "💅",
        "keywords": ["salon", "salón", "peluquer", "estética", "spa", "barber", "manicure", "cejas", "depilac", "masaje", "estetic", "uñas", "maquillaje", "belleza"],
        "pain_points": [
            "Wix/Squarespace free subdomain = looks amateur, kills premium pricing",
            "No before/after reels = Instagram growth stalls, no viral reach",
            "No online booking = stylist takes calls, loses service revenue while scheduling",
            "No loyalty/CRM = repeat bookings rely on memory, churn is invisible",
            "No TikTok presence = competitors capture under-30 demographic entirely",
        ],
        "services": ["AI Website", "AI Booking Agent", "Social Media", "CRM", "Paid Ads"],
    },
    "smb": {
        "name": "Small/Medium Business Services",
        "icon": "🏪",
        "keywords": ["tienda", "store", "boutique", "shop", "ferret", "óptica", "optic", "joyer", "zapater", "retail", "almacén", "negocio", "comercio", "emprendimiento", "pyme", "small business"],
        "pain_points": [
            "No professional website = lose 50% of foot traffic to online searchers",
            "No Google Business listing = invisible on Maps, lose local search traffic",
            "No email capture = 95% of first-time website visitors never return",
            "No automated follow-up = losing repeat orders to better-organized competitors",
            "No basic analytics = operating blind on customer behavior & revenue sources",
        ],
        "services": ["AI Website", "Google Business Optimization", "CRM", "Social Media", "Paid Ads"],
    },
    "law_firms": {
        "name": "Law Firms & Legal Services",
        "icon": "⚖️",
        "keywords": ["abogad", "lawyer", "legal", "derech", "jurídic", "notari", "notary", "consultor legal", "asesoría", "litigio", "contrato", "compliance"],
        "pain_points": [
            "Gmail/Yahoo address on letterhead = instantly downgrades perceived authority",
            "No case studies / portfolio = prospects cannot justify retainer fees",
            "Zero LinkedIn content = missing inbound from corporate decision-makers",
            "No intake questionnaire = administrative overhead on initial consultations",
            "No CRM pipeline visibility = referral handoffs fall through, win rates invisible",
        ],
        "services": ["AI Website", "CRM", "AI SDR", "AI Automations", "LinkedIn Strategy"],
    },
    "real_estate": {
        "name": "Real Estate & Property",
        "icon": "🏡",
        "keywords": ["inmobiliar", "propiedades", "bienes raíces", "corredor", "real estate", "arrendamiento", "venta", "corretaje", "propiedad"],
        "pain_points": [
            "No property search with filters = bounce to Portal Inmobiliario / Yapo",
            "No 3D tour / drone video = lower time-on-page, fewer qualified viewings",
            "No lead-capture forms tied to CRM = agents lose follow-up context",
            "No Instagram property reels = no reach to under-45 first-time buyers",
            "No retargeting = 98% of website visitors leave and never return",
        ],
        "services": ["AI Website", "CRM", "Paid Ads", "Virtual Tours", "Social Media"],
    },
    "local_specialist": {
        "name": "Local Specialist Services",
        "icon": "🔧",
        "keywords": ["plumber", "electrician", "hvac", "calefac", "fontaner", "electricista", "maestro", "servicios", "reparación", "mantenimiento", "contratista", "pest control", "plagas"],
        "pain_points": [
            "No Google Maps presence = invisible for 'plumber near me' searches",
            "No online booking = losing jobs to competitors who accept 2am emergency calls",
            "No customer photo gallery = prospects can't assess quality of past work",
            "No review strategy = stuck at 3.8 stars vs competitors at 4.7",
            "No SMS/WhatsApp automation = manual follow-ups for every estimate request",
        ],
        "services": ["Google Maps Optimization", "AI Booking Agent", "CRM", "Social Media", "AI Automations"],
    },
}

NICHE_ORDER = ["tourism", "restaurants", "health", "beauty", "smb", "law_firms", "real_estate", "local_specialist"]


# ============================================================
# 16 CHILEAN REGIONS -> 6 MOST RELEVANT NICHES EACH
# Based on regional economy (INE 2024, SUBDERE, SERNATUR data)
# ============================================================
REGIONS = {
    "arica_parinacota": {
        "name": "Arica y Parinacota",
        "code": "XV",
        "economy": "Border commerce with Peru/Bolivia, beach tourism, agro-export",
        "niches": ["tourism", "smb", "restaurants", "health", "local_specialist", "beauty"],
        "cities": ["arica"],
    },
    "tarapaca": {
        "name": "Tarapacá",
        "code": "I",
        "economy": "Copper mining (Collahuasi), ZOFRI duty-free zone, port logistics",
        "niches": ["smb", "law_firms", "restaurants", "restaurants", "health", "real_estate"],
        "cities": ["iquique"],
    },
    "antofagasta": {
        "name": "Antofagasta",
        "code": "II",
        "economy": "Copper mining (Escondida, BHP), lithium, high-income service hub",
        "niches": ["law_firms", "real_estate", "local_specialist", "restaurants", "health", "beauty"],
        "cities": ["antofagasta"],
    },
    "atacama": {
        "name": "Atacama",
        "code": "III",
        "economy": "Copper/iron mining, astro-tourism, agro (grapes, olives)",
        "niches": ["tourism", "law_firms", "local_specialist", "restaurants", "smb", "health"],
        "cities": ["copiapo"],
    },
    "coquimbo": {
        "name": "Coquimbo",
        "code": "IV",
        "economy": "Pisco, observatories, beach tourism, agri-export",
        "niches": ["tourism", "restaurants", "real_estate", "beauty", "health", "smb"],
        "cities": ["la-serena"],
    },
    "valparaiso": {
        "name": "Valparaíso",
        "code": "V",
        "economy": "Chile's main port, tourism (Viña/Valpo), universities, cruise ships",
        "niches": ["tourism", "restaurants", "law_firms", "real_estate", "beauty", "smb"],
        "cities": ["valparaiso"],
    },
    "metropolitana": {
        "name": "Metropolitana de Santiago",
        "code": "RM",
        "economy": "Capital, 40% of GDP, corporate HQs, full retail/services depth",
        "niches": ["law_firms", "real_estate", "restaurants", "health", "beauty", "smb"],
        "cities": ["santiago"],
    },
    "ohiggins": {
        "name": "Libertador Bernardo O'Higgins",
        "code": "VI",
        "economy": "Wine, fruit export, copper (El Teniente), agro-industry",
        "niches": ["local_specialist", "restaurants", "smb", "law_firms", "health", "real_estate"],
        "cities": ["rancagua"],
    },
    "maule": {
        "name": "Maule",
        "code": "VII",
        "economy": "Wine (Colchagua/Maule valleys), cherries, forestry",
        "niches": ["tourism", "restaurants", "smb", "local_specialist", "health", "law_firms"],
        "cities": ["talca"],
    },
    "nuble": {
        "name": "Ñuble",
        "code": "XVI",
        "economy": "Agro-forestry, wine, livestock, regional services",
        "niches": ["restaurants", "smb", "health", "local_specialist", "beauty", "law_firms"],
        "cities": ["chillan"],
    },
    "biobio": {
        "name": "Biobío",
        "code": "VIII",
        "economy": "Forestry/pulp (CMPC, Arauco), steel, universities, second urban region",
        "niches": ["law_firms", "smb", "health", "restaurants", "real_estate", "local_specialist"],
        "cities": ["concepcion"],
    },
    "araucania": {
        "name": "La Araucanía",
        "code": "IX",
        "economy": "Lakes & volcanoes tourism, Mapuche agro-tourism, forestry",
        "niches": ["tourism", "restaurants", "health", "smb", "local_specialist", "beauty"],
        "cities": ["temuco"],
    },
    "los_rios": {
        "name": "Los Ríos",
        "code": "XIV",
        "economy": "Dairy, salmon, cerveza artesanal, river tourism, UACh university",
        "niches": ["tourism", "restaurants", "law_firms", "health", "beauty", "smb"],
        "cities": ["valdivia"],
    },
    "los_lagos": {
        "name": "Los Lagos",
        "code": "X",
        "economy": "Salmon farming (#2 globally), Chiloé tourism, dairy, Puerto Montt port",
        "niches": ["tourism", "restaurants", "health", "real_estate", "local_specialist", "smb"],
        "cities": ["puerto-montt", "osorno"],
    },
    "aysen": {
        "name": "Aysén del General Carlos Ibáñez",
        "code": "XI",
        "economy": "Patagonian tourism, fly-fishing, salmon, trekking, low density",
        "niches": ["tourism", "restaurants", "health", "smb", "local_specialist", "beauty"],
        "cities": ["coyhaique"],
    },
    "magallanes": {
        "name": "Magallanes y Antártica Chilena",
        "code": "XII",
        "economy": "Torres del Paine tourism, Antarctica gateway, oil/gas, sheep",
        "niches": ["tourism", "restaurants", "real_estate", "health", "law_firms", "smb"],
        "cities": ["punta-arenas"],
    },
}

# City -> region quick lookup
CITY_TO_REGION = {}
for rk, r in REGIONS.items():
    for c in r["cities"]:
        CITY_TO_REGION[c] = rk


def classify_niche(name: str, vertical: str = "") -> str:
    """Classify a business into one of the 8 niches based on name + original vertical."""
    text = (name + " " + vertical).lower()

    # Original vertical mapping first (more reliable)
    v = vertical.lower()
    if "tourism" in v or "turismo" in v: base = "tourism"
    elif "restaurant" in v or "food" in v or "gastro" in v: base = "restaurants"
    elif "health" in v or "salud" in v or "medical" in v: base = "health"
    elif "beauty" in v or "belleza" in v or "wellness" in v: base = "beauty"
    elif "legal" in v or "abogad" in v or "law" in v: base = "law_firms"
    elif "real estate" in v or "inmobil" in v or "propiedad" in v: base = "real_estate"
    else: base = None

    # Override by keyword match (catches cross-vertical misclassifications)
    for nk in NICHE_ORDER:
        for kw in NICHES[nk]["keywords"]:
            if kw in text:
                return nk
    return base or "smb"
