"""
NetWebMedia - 10 Niches x 16 Chilean Regions mapping.
Used by generate_company_pages.py and crm_import.py.
"""

# ============================================================
# 10 MARKET NICHES (expanded from the original 4)
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
    "retail": {
        "name": "Retail & E-commerce",
        "icon": "🛍️",
        "keywords": ["tienda", "store", "boutique", "shop", "librer", "ferreter", "óptica", "optic", "joyer", "zapater", "retail", "mercad", "almacén"],
        "pain_points": [
            "No e-commerce = competitors on MercadoLibre/Falabella eat market share",
            "No product feed = cannot run Google Shopping or Meta Advantage+ ads",
            "No email capture popup = 95% of first-time visitors never come back",
            "Zero Reels = Instagram account stuck under 2K followers forever",
            "No abandoned-cart automation = leaving 10-15% recovered revenue on table",
        ],
        "services": ["AI Website", "Paid Ads", "CRM", "AI Automations", "Social Media"],
    },
    "real_estate": {
        "name": "Real Estate & Property",
        "icon": "🏡",
        "keywords": ["inmobiliar", "propiedades", "bienes raíces", "corredor", "real estate", "arrendamientos", "venta de casas", "corretaje"],
        "pain_points": [
            "No property search with filters = bounce to Portal Inmobiliario / Yapo",
            "No 3D tour / drone video = lower time-on-page, fewer qualified viewings",
            "No lead-capture forms tied to CRM = agents lose follow-up context",
            "No Instagram property reels = no reach to under-45 first-time buyers",
            "No retargeting = 98% of website visitors leave and never return",
        ],
        "services": ["AI Website", "CRM", "Paid Ads", "AI SDR", "Social Media"],
    },
    "automotive": {
        "name": "Automotive Services",
        "icon": "🚗",
        "keywords": ["automotri", "mecánic", "taller", "lubricent", "llantas", "neumátic", "desabolladur", "pintura", "autos", "vehículos", "rent a car", "autorent"],
        "pain_points": [
            "No service-booking widget = phone-only, loses after-hours leads",
            "No before/after video of repairs = no trust-building content feed",
            "No Google review campaign = stuck under 4.3 stars vs competitors at 4.8",
            "No local SEO for 'taller [city]' = page 2, effectively invisible",
            "No CRM/reminder SMS = no service-due repeat business",
        ],
        "services": ["AI Website", "AI Booking Agent", "CRM", "AI SEO", "Voice AI"],
    },
    "fitness": {
        "name": "Fitness & Sports",
        "icon": "🏋️",
        "keywords": ["gym", "gimnasio", "fitness", "crossfit", "yoga", "pilates", "personal trainer", "entrenador", "box", "deportes", "natación", "tenis"],
        "pain_points": [
            "No class-schedule + signup widget = losing new-member conversions",
            "No Reels of workouts = Instagram doesn't reach beyond existing members",
            "No FB retargeting after 'free trial' page view = single-touch funnel",
            "No CRM tracking member churn signals = 5-7% monthly attrition unnoticed",
            "No referral program automation = organic growth flatlines",
        ],
        "services": ["AI Website", "AI Booking Agent", "Social Media", "Paid Ads", "CRM"],
    },
    "education": {
        "name": "Education & Training",
        "icon": "🎓",
        "keywords": ["colegio", "escuela", "instituto", "academ", "curso", "capacitación", "educación", "universidad", "training", "clase", "idiom", "preuniv"],
        "pain_points": [
            "No lead magnet (e.g. syllabus PDF) = no email list to nurture",
            "No testimonial videos = trust gap vs established competitors",
            "No FB Pixel = cannot build lookalikes of enrolled students",
            "No cohort-launch ad funnel = enrollments depend on word of mouth",
            "No LinkedIn presence for corporate-training arm = leaving B2B money",
        ],
        "services": ["AI Website", "Paid Ads", "CRM", "AI SDR", "AI Automations"],
    },
    "professional": {
        "name": "Professional Services",
        "icon": "💼",
        "keywords": ["contador", "abogado", "lawyer", "consultor", "arquitect", "ingenier", "notar", "corredor", "asesor", "consulting", "contabilid", "legal"],
        "pain_points": [
            "Gmail address on business cards = instantly downgrades perceived fee",
            "No case studies / portfolio = prospects cannot justify high retainers",
            "No LinkedIn content = no inbound from decision-makers",
            "No intake form + auto-qualifier = partners waste hours on tire-kickers",
            "No CRM pipeline = referrals slip through cracks, win rate invisible",
        ],
        "services": ["AI Website", "AI SDR", "CRM", "AI SEO", "AI Automations"],
    },
}

NICHE_ORDER = ["tourism", "restaurants", "health", "beauty", "retail", "real_estate", "automotive", "fitness", "education", "professional"]


# ============================================================
# 16 CHILEAN REGIONS -> 6 MOST RELEVANT NICHES EACH
# Based on regional economy (INE 2024, SUBDERE, SERNATUR data)
# ============================================================
REGIONS = {
    "arica_parinacota": {
        "name": "Arica y Parinacota",
        "code": "XV",
        "economy": "Border commerce with Peru/Bolivia, beach tourism, agro-export",
        "niches": ["tourism", "retail", "restaurants", "health", "automotive", "professional"],
        "cities": ["arica"],
    },
    "tarapaca": {
        "name": "Tarapacá",
        "code": "I",
        "economy": "Copper mining (Collahuasi), ZOFRI duty-free zone, port logistics",
        "niches": ["retail", "professional", "automotive", "restaurants", "health", "real_estate"],
        "cities": ["iquique"],
    },
    "antofagasta": {
        "name": "Antofagasta",
        "code": "II",
        "economy": "Copper mining (Escondida, BHP), lithium, high-income service hub",
        "niches": ["professional", "real_estate", "automotive", "restaurants", "health", "beauty"],
        "cities": ["antofagasta"],
    },
    "atacama": {
        "name": "Atacama",
        "code": "III",
        "economy": "Copper/iron mining, astro-tourism, agro (grapes, olives)",
        "niches": ["tourism", "professional", "automotive", "restaurants", "retail", "health"],
        "cities": ["copiapo"],
    },
    "coquimbo": {
        "name": "Coquimbo",
        "code": "IV",
        "economy": "Pisco, observatories, beach tourism, agri-export",
        "niches": ["tourism", "restaurants", "real_estate", "beauty", "health", "retail"],
        "cities": ["la-serena"],
    },
    "valparaiso": {
        "name": "Valparaíso",
        "code": "V",
        "economy": "Chile's main port, tourism (Viña/Valpo), universities, cruise ships",
        "niches": ["tourism", "restaurants", "education", "real_estate", "beauty", "retail"],
        "cities": ["valparaiso"],
    },
    "metropolitana": {
        "name": "Metropolitana de Santiago",
        "code": "RM",
        "economy": "Capital, 40% of GDP, corporate HQs, full retail/services depth",
        "niches": ["professional", "real_estate", "restaurants", "health", "beauty", "retail"],
        "cities": ["santiago"],
    },
    "ohiggins": {
        "name": "Libertador Bernardo O'Higgins",
        "code": "VI",
        "economy": "Wine, fruit export, copper (El Teniente), agro-industry",
        "niches": ["automotive", "restaurants", "retail", "professional", "health", "real_estate"],
        "cities": ["rancagua"],
    },
    "maule": {
        "name": "Maule",
        "code": "VII",
        "economy": "Wine (Colchagua/Maule valleys), cherries, forestry",
        "niches": ["tourism", "restaurants", "retail", "automotive", "health", "professional"],
        "cities": ["talca"],
    },
    "nuble": {
        "name": "Ñuble",
        "code": "XVI",
        "economy": "Agro-forestry, wine, livestock, regional services",
        "niches": ["restaurants", "retail", "health", "education", "beauty", "automotive"],
        "cities": ["chillan"],
    },
    "biobio": {
        "name": "Biobío",
        "code": "VIII",
        "economy": "Forestry/pulp (CMPC, Arauco), steel, universities, second urban region",
        "niches": ["education", "professional", "health", "restaurants", "real_estate", "retail"],
        "cities": ["concepcion"],
    },
    "araucania": {
        "name": "La Araucanía",
        "code": "IX",
        "economy": "Lakes & volcanoes tourism, Mapuche agro-tourism, forestry",
        "niches": ["tourism", "restaurants", "health", "education", "retail", "beauty"],
        "cities": ["temuco"],
    },
    "los_rios": {
        "name": "Los Ríos",
        "code": "XIV",
        "economy": "Dairy, salmon, cerveza artesanal, river tourism, UACh university",
        "niches": ["tourism", "restaurants", "education", "health", "beauty", "retail"],
        "cities": ["valdivia"],
    },
    "los_lagos": {
        "name": "Los Lagos",
        "code": "X",
        "economy": "Salmon farming (#2 globally), Chiloé tourism, dairy, Puerto Montt port",
        "niches": ["tourism", "restaurants", "health", "real_estate", "professional", "retail"],
        "cities": ["puerto-montt", "osorno"],
    },
    "aysen": {
        "name": "Aysén del General Carlos Ibáñez",
        "code": "XI",
        "economy": "Patagonian tourism, fly-fishing, salmon, trekking, low density",
        "niches": ["tourism", "restaurants", "health", "retail", "automotive", "beauty"],
        "cities": ["coyhaique"],
    },
    "magallanes": {
        "name": "Magallanes y Antártica Chilena",
        "code": "XII",
        "economy": "Torres del Paine tourism, Antarctica gateway, oil/gas, sheep",
        "niches": ["tourism", "restaurants", "real_estate", "health", "professional", "retail"],
        "cities": ["punta-arenas"],
    },
}

# City -> region quick lookup
CITY_TO_REGION = {}
for rk, r in REGIONS.items():
    for c in r["cities"]:
        CITY_TO_REGION[c] = rk


def classify_niche(name: str, vertical: str = "") -> str:
    """Classify a business into one of the 10 niches based on name + original vertical."""
    text = (name + " " + vertical).lower()

    # Original vertical mapping first (more reliable)
    v = vertical.lower()
    if "tourism" in v or "turismo" in v: base = "tourism"
    elif "restaurant" in v or "food" in v or "gastro" in v: base = "restaurants"
    elif "health" in v or "salud" in v or "medical" in v: base = "health"
    elif "beauty" in v or "belleza" in v or "wellness" in v: base = "beauty"
    else: base = None

    # Override by keyword match (catches cross-vertical misclassifications)
    for nk in NICHE_ORDER:
        for kw in NICHES[nk]["keywords"]:
            if kw in text:
                return nk
    return base or "professional"
