"""
NetWebMedia USA — 50 States × 8 Niches.
Mirror of niches_regions.py but for USA with USD market stats.
"""

# ============================================================
# NICHE MARKET DATA — USA (USD, 2025 estimates)
# ============================================================
NICHE_MARKET_USA = {
    "tourism":          {"size_usd":"$1.2T","growth":"+4.8%","avg_ticket_usd":320,
        "key_stat_es":"65% de huéspedes millennials reservan solo si el hotel tiene Instagram activo",
        "key_stat_en":"65% of millennial guests book only if the hotel has an active Instagram presence",
        "uplift_range":"20-35%"},
    "restaurants":      {"size_usd":"$997B","growth":"+5.1%","avg_ticket_usd":38,
        "key_stat_es":"Restaurantes con fotos + menú en Google Business reciben 42% más llamadas",
        "key_stat_en":"Restaurants with Google Business photos + menu get 42% more calls than those without",
        "uplift_range":"15-28%"},
    "health":           {"size_usd":"$4.5T","growth":"+6.2%","avg_ticket_usd":240,
        "key_stat_es":"61% de pacientes en EE.UU. abandona la reserva si no puede auto-agendar online",
        "key_stat_en":"61% of US patients abandon booking if they can't self-schedule online",
        "uplift_range":"25-45%"},
    "beauty":           {"size_usd":"$98B","growth":"+8.4%","avg_ticket_usd":85,
        "key_stat_es":"Salones con booking online retienen 3× más clientes mes a mes",
        "key_stat_en":"Salons with online booking retain 3x more clients month-over-month",
        "uplift_range":"22-38%"},
    "smb":              {"size_usd":"$5.9T","growth":"+3.7%","avg_ticket_usd":480,
        "key_stat_es":"52% de pymes en EE.UU. aún no tiene sitio web moderno ni ficha de Google completa",
        "key_stat_en":"52% of US SMBs still lack a modern website or complete Google Business Profile",
        "uplift_range":"25-45%"},
    "law_firms":        {"size_usd":"$380B","growth":"+4.2%","avg_ticket_usd":3500,
        "key_stat_es":"Estudios con LinkedIn activo + casos de estudio cierran 2.3× más retainers",
        "key_stat_en":"Law firms with active LinkedIn + case studies close 2.3x more enterprise retainers",
        "uplift_range":"30-55%"},
    "real_estate":      {"size_usd":"$1.8T","growth":"+2.9%","avg_ticket_usd":8400,
        "key_stat_es":"Listings con tour 3D venden 31% más rápido y cierran 9% sobre precio lista",
        "key_stat_en":"Listings with 3D tours sell 31% faster and close 9% above asking",
        "uplift_range":"22-38%"},
    "local_specialist": {"size_usd":"$620B","growth":"+5.5%","avg_ticket_usd":420,
        "key_stat_es":"67% de búsquedas 'near me' convierten en 24h — Maps = trabajos",
        "key_stat_en":"67% of 'near me' searches convert within 24h — Maps presence = jobs",
        "uplift_range":"28-50%"},
}

# ============================================================
# PAIN POINTS — USA flavored (no Booking.com, no PedidosYa)
# ============================================================
PAINS_EN_USA = {
    "tourism": [
        "No online booking = guests choose OTAs (Booking/Expedia take 15-20% commission)",
        "Zero Instagram Reels = invisible to 70% of US travelers under 40",
        "No Meta Pixel = cannot retarget website visitors with warm ads",
        "No mobile-optimized check-in = 58% of guests rate friction below 4 stars",
        "No text-message concierge = lost upsells on F&B, spa, late checkout",
    ],
    "restaurants": [
        "No Google Business photos = 40% fewer calls than top-rated competitors",
        "No Instagram Stories = no daily specials reach, zero top-of-mind",
        "No online ordering = losing 20-30% revenue to DoorDash/UberEats commissions",
        "Menu not mobile-optimized = bounce rate over 70% on phones",
        "No reviews response strategy = 1-star complaints sink local SEO",
    ],
    "health": [
        "Gmail/Yahoo address signals small-time = lost high-ticket consultations",
        "No HIPAA-compliant intake form = manual admin burden, lost leads",
        "No self-scheduling widget = phone-tag loses 3 of 10 prospects",
        "Zero educational content on Instagram = no trust-building, no referrals",
        "No Meta Pixel = cannot build lookalike audiences from converted patients",
    ],
    "beauty": [
        "Wix/Squarespace free subdomain = looks amateur, kills premium pricing",
        "No before/after reels = Instagram growth stalls, no viral reach",
        "No online booking = stylist loses service revenue answering phone",
        "No loyalty/CRM = repeat bookings rely on memory, churn is invisible",
        "No TikTok presence = competitors capture under-30 demographic entirely",
    ],
    "smb": [
        "No professional website = lose 50% of foot traffic to online searchers",
        "No Google Business listing = invisible on Maps for local searches",
        "No email capture = 95% of first-time visitors never return",
        "No automated follow-up = losing repeat orders to organized competitors",
        "No basic analytics = operating blind on customer behavior & revenue",
    ],
    "law_firms": [
        "Gmail/Yahoo on letterhead = instantly downgrades perceived authority",
        "No case studies / portfolio = prospects cannot justify retainer fees",
        "Zero LinkedIn content = missing inbound from corporate decision-makers",
        "No intake questionnaire = administrative overhead on initial consultations",
        "No CRM pipeline visibility = referral handoffs fall through, win rates invisible",
    ],
    "real_estate": [
        "No property search with filters = bounce to Zillow/Redfin/Realtor.com",
        "No 3D tour / drone video = lower time-on-page, fewer qualified viewings",
        "No lead-capture forms tied to CRM = agents lose follow-up context",
        "No Instagram property reels = no reach to under-40 first-time buyers",
        "No retargeting = 98% of website visitors leave and never return",
    ],
    "local_specialist": [
        "No Google Maps presence = invisible for 'plumber near me' searches",
        "No online booking = losing jobs to competitors with 24/7 intake",
        "No customer photo gallery = prospects can't assess past work quality",
        "No review strategy = stuck at 3.8 stars vs competitors at 4.7",
        "No SMS automation = manual follow-up for every estimate request",
    ],
}

PAINS_ES_USA = {
    "tourism": [
        "Sin booking online = huéspedes eligen OTAs (Booking/Expedia cobran 15-20%)",
        "Cero Reels de Instagram = invisibles para el 70% de viajeros US <40 años",
        "Sin Meta Pixel = no se puede retargetear visitantes con ads cálidas",
        "Check-in sin optimizar móvil = 58% de huéspedes califican la fricción <4 estrellas",
        "Sin conserjería por SMS = se pierden upsells de F&B, spa, late checkout",
    ],
    "restaurants": [
        "Sin fotos en Google Business = 40% menos llamadas que competidores top",
        "Sin Stories de Instagram = no llega el dato del día, cero top-of-mind",
        "Sin pedidos online = se pierde 20-30% de ingresos a comisiones DoorDash/UberEats",
        "Menú no optimizado en móvil = bounce rate >70% en teléfonos",
        "Sin estrategia de respuesta a reseñas = las 1-estrella hunden el SEO local",
    ],
    "health": [
        "Email @gmail/@yahoo = señal de bajo perfil, se pierden consultas premium",
        "Sin formulario de intake HIPAA = carga administrativa + leads perdidos",
        "Sin widget de auto-agendamiento = el phone-tag pierde 3 de 10 prospectos",
        "Cero contenido educativo en IG = no se construye confianza, cero derivaciones",
        "Sin Meta Pixel = no se pueden armar audiencias lookalike de pacientes convertidos",
    ],
    "beauty": [
        "Subdominio gratis de Wix/Squarespace = se ve amateur, mata el pricing premium",
        "Sin Reels antes/después = crecimiento de IG estancado, cero viralidad",
        "Sin booking online = la estilista pierde servicios atendiendo el teléfono",
        "Sin fidelización/CRM = las recompras dependen de memoria, churn invisible",
        "Sin TikTok = competidores capturan el demográfico <30 completo",
    ],
    "smb": [
        "Sin sitio profesional = se pierde 50% del tráfico a buscadores online",
        "Sin ficha de Google Business = invisible en Maps para búsquedas locales",
        "Sin captura de email = 95% de visitantes nunca vuelve",
        "Sin follow-up automatizado = se pierden recompras con competidores organizados",
        "Sin analítica básica = operando a ciegas sobre comportamiento y revenue",
    ],
    "law_firms": [
        "Email @gmail/@yahoo en el letterhead = baja instantáneamente la autoridad",
        "Sin casos de estudio / portafolio = prospectos no justifican el retainer",
        "Cero contenido de LinkedIn = no hay inbound de tomadores corporativos",
        "Sin cuestionario de intake = sobrecarga administrativa en consultas iniciales",
        "Sin CRM visible = handoffs de referidos se pierden, tasas de cierre invisibles",
    ],
    "real_estate": [
        "Sin buscador de propiedades con filtros = bounce a Zillow/Redfin/Realtor",
        "Sin tour 3D / video con drone = menos tiempo en página, menos visitas",
        "Sin formularios conectados al CRM = agentes pierden contexto de follow-up",
        "Sin Reels de propiedades = cero alcance a primerizos <40 años",
        "Sin retargeting = 98% de visitantes se va y nunca vuelve",
    ],
    "local_specialist": [
        "Sin Google Maps = invisibles para 'plumber near me'",
        "Sin booking online = se pierden trabajos frente a competidores 24/7",
        "Sin galería de fotos = prospectos no pueden evaluar calidad del trabajo",
        "Sin estrategia de reseñas = estancados en 3.8★ vs competidores en 4.7★",
        "Sin automación SMS = follow-up manual por cada cotización",
    ],
}

# ============================================================
# 50 STATES — each mapped to 6 most-relevant niches + 1-3 cities
# Niche order reflects each state's economic profile.
# ============================================================
STATES = {
    "alabama":        {"name":"Alabama","code":"AL","economy":"Auto manufacturing, aerospace, forestry, Gulf tourism","niches":["smb","restaurants","local_specialist","health","real_estate","beauty"],"cities":["birmingham","montgomery","mobile"]},
    "alaska":         {"name":"Alaska","code":"AK","economy":"Oil & gas, fishing, eco-tourism, cruise port","niches":["tourism","local_specialist","restaurants","smb","health","law_firms"],"cities":["anchorage","fairbanks","juneau"]},
    "arizona":        {"name":"Arizona","code":"AZ","economy":"Tech (Phoenix), tourism (Grand Canyon/Sedona), retirees, real estate","niches":["real_estate","tourism","health","restaurants","law_firms","beauty"],"cities":["phoenix","tucson","scottsdale"]},
    "arkansas":       {"name":"Arkansas","code":"AR","economy":"Walmart HQ, poultry, rice, timber","niches":["smb","restaurants","local_specialist","health","real_estate","law_firms"],"cities":["little-rock","fayetteville","bentonville"]},
    "california":     {"name":"California","code":"CA","economy":"Tech, entertainment, agriculture, tourism — 1st US economy","niches":["real_estate","law_firms","tourism","health","restaurants","beauty"],"cities":["los-angeles","san-francisco","san-diego"]},
    "colorado":       {"name":"Colorado","code":"CO","economy":"Tech (Denver/Boulder), outdoor tourism, cannabis, energy","niches":["tourism","real_estate","restaurants","health","law_firms","beauty"],"cities":["denver","colorado-springs","boulder"]},
    "connecticut":    {"name":"Connecticut","code":"CT","economy":"Insurance, finance, pharma, education","niches":["law_firms","real_estate","health","restaurants","smb","beauty"],"cities":["hartford","new-haven","stamford"]},
    "delaware":       {"name":"Delaware","code":"DE","economy":"Corporate law, banking, chemicals, beach tourism","niches":["law_firms","real_estate","tourism","health","restaurants","smb"],"cities":["wilmington","dover","newark"]},
    "florida":        {"name":"Florida","code":"FL","economy":"Tourism (Orlando/Miami), real estate, retirees, aerospace","niches":["tourism","real_estate","restaurants","health","beauty","law_firms"],"cities":["miami","orlando","tampa"]},
    "georgia":        {"name":"Georgia","code":"GA","economy":"Film industry, logistics (Atlanta airport), agriculture","niches":["real_estate","restaurants","law_firms","health","beauty","smb"],"cities":["atlanta","savannah","augusta"]},
    "hawaii":         {"name":"Hawaii","code":"HI","economy":"Tourism, military, agriculture (sugar/pineapple)","niches":["tourism","restaurants","beauty","health","local_specialist","real_estate"],"cities":["honolulu","hilo","kailua"]},
    "idaho":          {"name":"Idaho","code":"ID","economy":"Agriculture (potatoes), tech (Boise), outdoor tourism","niches":["local_specialist","smb","tourism","real_estate","restaurants","health"],"cities":["boise","idaho-falls","coeur-dalene"]},
    "illinois":       {"name":"Illinois","code":"IL","economy":"Finance (Chicago), manufacturing, agriculture","niches":["law_firms","real_estate","restaurants","health","beauty","smb"],"cities":["chicago","aurora","naperville"]},
    "indiana":        {"name":"Indiana","code":"IN","economy":"Auto manufacturing, pharma (Eli Lilly), agriculture","niches":["smb","local_specialist","restaurants","health","real_estate","law_firms"],"cities":["indianapolis","fort-wayne","evansville"]},
    "iowa":           {"name":"Iowa","code":"IA","economy":"Agriculture (corn/soy), insurance, biofuels","niches":["smb","local_specialist","restaurants","health","real_estate","law_firms"],"cities":["des-moines","cedar-rapids","davenport"]},
    "kansas":         {"name":"Kansas","code":"KS","economy":"Agriculture, aerospace (Wichita), energy","niches":["smb","local_specialist","restaurants","health","real_estate","law_firms"],"cities":["wichita","overland-park","kansas-city"]},
    "kentucky":       {"name":"Kentucky","code":"KY","economy":"Bourbon, horses, coal, auto manufacturing","niches":["tourism","restaurants","local_specialist","smb","health","real_estate"],"cities":["louisville","lexington","bowling-green"]},
    "louisiana":      {"name":"Louisiana","code":"LA","economy":"Oil & gas, seafood, tourism (New Orleans), shipping","niches":["restaurants","tourism","local_specialist","health","law_firms","beauty"],"cities":["new-orleans","baton-rouge","shreveport"]},
    "maine":          {"name":"Maine","code":"ME","economy":"Fishing, tourism, forestry, small manufacturing","niches":["tourism","restaurants","local_specialist","smb","real_estate","health"],"cities":["portland","bangor","augusta"]},
    "maryland":       {"name":"Maryland","code":"MD","economy":"Federal government, biotech, ports (Baltimore)","niches":["health","law_firms","real_estate","restaurants","beauty","smb"],"cities":["baltimore","annapolis","rockville"]},
    "massachusetts":  {"name":"Massachusetts","code":"MA","economy":"Biotech, universities, finance (Boston), healthcare","niches":["health","law_firms","real_estate","restaurants","beauty","smb"],"cities":["boston","worcester","cambridge"]},
    "michigan":       {"name":"Michigan","code":"MI","economy":"Auto (Detroit), Great Lakes tourism, agriculture","niches":["local_specialist","smb","restaurants","real_estate","health","law_firms"],"cities":["detroit","grand-rapids","ann-arbor"]},
    "minnesota":      {"name":"Minnesota","code":"MN","economy":"Healthcare (Mayo Clinic), agriculture, tech","niches":["health","smb","restaurants","real_estate","law_firms","beauty"],"cities":["minneapolis","saint-paul","rochester"]},
    "mississippi":    {"name":"Mississippi","code":"MS","economy":"Agriculture, casinos, shipbuilding, forestry","niches":["smb","restaurants","local_specialist","health","tourism","real_estate"],"cities":["jackson","gulfport","biloxi"]},
    "missouri":       {"name":"Missouri","code":"MO","economy":"Agriculture, aerospace (Boeing), beer (Budweiser), logistics","niches":["smb","restaurants","real_estate","health","local_specialist","law_firms"],"cities":["saint-louis","kansas-city","springfield"]},
    "montana":        {"name":"Montana","code":"MT","economy":"Ranching, mining, outdoor tourism (Glacier/Yellowstone)","niches":["tourism","local_specialist","smb","restaurants","real_estate","health"],"cities":["billings","bozeman","missoula"]},
    "nebraska":       {"name":"Nebraska","code":"NE","economy":"Cattle, corn, insurance (Berkshire), logistics","niches":["smb","local_specialist","restaurants","health","real_estate","law_firms"],"cities":["omaha","lincoln","grand-island"]},
    "nevada":         {"name":"Nevada","code":"NV","economy":"Casinos (Vegas/Reno), mining, logistics, tourism","niches":["tourism","restaurants","beauty","real_estate","law_firms","health"],"cities":["las-vegas","reno","henderson"]},
    "new_hampshire":  {"name":"New Hampshire","code":"NH","economy":"Tourism, tech, no sales tax draws retail","niches":["tourism","restaurants","real_estate","smb","health","local_specialist"],"cities":["manchester","nashua","concord"]},
    "new_jersey":     {"name":"New Jersey","code":"NJ","economy":"Pharma, finance, ports, dense suburbs of NYC","niches":["health","real_estate","law_firms","restaurants","beauty","smb"],"cities":["newark","jersey-city","paterson"]},
    "new_mexico":     {"name":"New Mexico","code":"NM","economy":"Oil & gas, film, Native tourism, federal labs","niches":["tourism","restaurants","smb","local_specialist","health","real_estate"],"cities":["albuquerque","santa-fe","las-cruces"]},
    "new_york":       {"name":"New York","code":"NY","economy":"Finance (NYC), media, real estate, tourism","niches":["real_estate","law_firms","restaurants","health","beauty","tourism"],"cities":["new-york","buffalo","rochester"]},
    "north_carolina": {"name":"North Carolina","code":"NC","economy":"Banking (Charlotte), tech (RDU), tobacco, furniture","niches":["real_estate","health","restaurants","law_firms","beauty","smb"],"cities":["charlotte","raleigh","greensboro"]},
    "north_dakota":   {"name":"North Dakota","code":"ND","economy":"Oil shale (Bakken), agriculture, wind energy","niches":["smb","local_specialist","restaurants","health","real_estate","law_firms"],"cities":["fargo","bismarck","grand-forks"]},
    "ohio":           {"name":"Ohio","code":"OH","economy":"Auto manufacturing, healthcare (Cleveland Clinic), logistics","niches":["health","smb","restaurants","real_estate","local_specialist","law_firms"],"cities":["columbus","cleveland","cincinnati"]},
    "oklahoma":       {"name":"Oklahoma","code":"OK","economy":"Oil & gas, aerospace, cattle, Native casinos","niches":["smb","restaurants","local_specialist","health","real_estate","law_firms"],"cities":["oklahoma-city","tulsa","norman"]},
    "oregon":         {"name":"Oregon","code":"OR","economy":"Tech (Intel/Nike), forestry, wine, outdoor","niches":["restaurants","tourism","real_estate","health","beauty","smb"],"cities":["portland","eugene","salem"]},
    "pennsylvania":   {"name":"Pennsylvania","code":"PA","economy":"Healthcare, steel, energy (fracking), finance","niches":["health","law_firms","restaurants","real_estate","smb","beauty"],"cities":["philadelphia","pittsburgh","harrisburg"]},
    "rhode_island":   {"name":"Rhode Island","code":"RI","economy":"Healthcare, tourism, defense, education","niches":["restaurants","health","real_estate","tourism","law_firms","beauty"],"cities":["providence","warwick","cranston"]},
    "south_carolina": {"name":"South Carolina","code":"SC","economy":"BMW plant, tourism (Charleston/Myrtle), agriculture","niches":["tourism","real_estate","restaurants","health","beauty","smb"],"cities":["charleston","columbia","myrtle-beach"]},
    "south_dakota":   {"name":"South Dakota","code":"SD","economy":"Agriculture, tourism (Mount Rushmore), finance","niches":["smb","tourism","restaurants","health","real_estate","local_specialist"],"cities":["sioux-falls","rapid-city","aberdeen"]},
    "tennessee":      {"name":"Tennessee","code":"TN","economy":"Country music (Nashville), healthcare (HCA), whiskey","niches":["restaurants","tourism","health","real_estate","law_firms","beauty"],"cities":["nashville","memphis","knoxville"]},
    "texas":          {"name":"Texas","code":"TX","economy":"Oil & gas, tech (Austin), ranching, medical (Houston)","niches":["real_estate","health","restaurants","law_firms","beauty","local_specialist"],"cities":["houston","dallas","austin"]},
    "utah":           {"name":"Utah","code":"UT","economy":"Tech (Silicon Slopes), tourism (Zion/Arches), finance","niches":["tourism","real_estate","restaurants","health","smb","beauty"],"cities":["salt-lake-city","provo","saint-george"]},
    "vermont":        {"name":"Vermont","code":"VT","economy":"Maple syrup, tourism (skiing/foliage), craft beer, dairy","niches":["tourism","restaurants","local_specialist","smb","real_estate","health"],"cities":["burlington","montpelier","rutland"]},
    "virginia":       {"name":"Virginia","code":"VA","economy":"Federal government, defense, data centers, wine","niches":["law_firms","real_estate","health","restaurants","beauty","smb"],"cities":["virginia-beach","richmond","arlington"]},
    "washington":     {"name":"Washington","code":"WA","economy":"Tech (Microsoft/Amazon), aerospace (Boeing), coffee, wine","niches":["real_estate","restaurants","tourism","health","beauty","law_firms"],"cities":["seattle","spokane","tacoma"]},
    "west_virginia":  {"name":"West Virginia","code":"WV","economy":"Coal, natural gas, outdoor tourism, chemicals","niches":["smb","local_specialist","restaurants","tourism","health","real_estate"],"cities":["charleston","huntington","morgantown"]},
    "wisconsin":      {"name":"Wisconsin","code":"WI","economy":"Dairy, manufacturing (Harley), tourism, agriculture","niches":["restaurants","smb","local_specialist","health","real_estate","tourism"],"cities":["milwaukee","madison","green-bay"]},
    "wyoming":        {"name":"Wyoming","code":"WY","economy":"Coal/natural gas, tourism (Yellowstone/Grand Teton), ranching","niches":["tourism","local_specialist","smb","restaurants","real_estate","health"],"cities":["cheyenne","casper","jackson"]},
}

CITY_TO_STATE = {}
for sk, s in STATES.items():
    for c in s["cities"]:
        CITY_TO_STATE[c] = sk

# ============================================================
# BUSINESS NAME FRAGMENTS per niche (US flavor)
# ============================================================
NAME_PARTS = {
    "tourism": {
        "prefix": ["Summit","Pine Ridge","Blue Ridge","Lakeside","Coastal","Oceanview","Sunrise","Harbor","Cascade","Grand","Heritage","Eagle","Sunset","Mountain","Lakeview","Aspen","Cypress","Redwood","Silver","Crystal","Timber","Wildwood","Horizon","Bayfront","Stonebridge"],
        "suffix": ["Lodge","Inn","Resort","Retreat","Cabins","Hotel","Suites","Getaway","Bed & Breakfast","Villas","Hideaway","Ranch","Outfitters","Tours","Adventures"],
    },
    "restaurants": {
        "prefix": ["Red Barn","Blue Door","Copper","Iron Skillet","Oak","Birch","Maple","Harvest","Stonefire","Brickhouse","Hickory","Cedar","Pine","Sage","Citrus","Mesa","Market","Prairie","Wagon","Rustic","Golden","Silver","Olive","Pepper","Tavern"],
        "suffix": ["Kitchen","Grill","Bistro","Table","Pizzeria","Smokehouse","Alehouse","Cafe","Diner","Eatery","Steakhouse","Public House","Roadhouse","Brasserie"],
    },
    "health": {
        "prefix": ["Summit","Riverside","Valley","Prairie","Cedar","Lakeshore","Westbrook","Northgate","Southpoint","Parkview","Crestview","Harborview","Pinewood","Grandview","Evergreen","Bayside","Hillside","Mercy","Heritage"],
        "suffix": ["Dental","Family Medicine","Pediatrics","Urgent Care","Medical Group","Health Partners","Clinic","Dermatology","Orthodontics","Chiropractic","Wellness","Smiles Dental","Physical Therapy","Med Spa"],
    },
    "beauty": {
        "prefix": ["Luxe","Glow","Radiance","Bliss","Essence","Serenity","Polished","Vivid","Opal","Willow","Velvet","Pearl","Orchid","Sage","Ivory","Noir","Halo","Muse","Lotus","Amber"],
        "suffix": ["Salon","Spa","Studio","Beauty Bar","Nails","Hair Lounge","Aesthetics","Med Spa","Barber Co.","Brow Bar","Lash Lounge","Wellness","Boutique"],
    },
    "smb": {
        "prefix": ["Bluebird","Cornerstone","Oakwood","Main Street","Evergreen","Northside","Southside","Redleaf","Hilltop","Greenway","Millbrook","Ironwood","Brookside","Riverstone","Copper Creek","Fox Run","Parkside","Heritage"],
        "suffix": ["Hardware","Bookkeeping","Print Shop","Signs","Supply Co.","Provisions","Trading Co.","Mercantile","Workshop","Studio","Services","Solutions","Outfitters","Depot"],
    },
    "law_firms": {
        "prefix": ["Harrison","Whitaker","Goldstein","Morgan","Pierce","Brennan","Sullivan","O'Connor","Blackwell","Ashford","Kensington","Sinclair","Hawthorne","Coleman","Rutherford","Caldwell","Montgomery","Bennett"],
        "suffix": ["Law","Legal","Law Group","Attorneys","& Associates","Law Office","& Partners","Law Firm","PLLC","Legal Services","& Co., Attorneys at Law"],
    },
    "real_estate": {
        "prefix": ["Premier","Prestige","Landmark","Signature","Coastal","Heritage","Summit","Beacon","Pinnacle","Legacy","Cornerstone","Keystone","Metro","Urban","Skyline","Lakefront","Harbor","Ridge","Golden Gate"],
        "suffix": ["Realty","Homes","Properties","Real Estate","Realty Group","Property Partners","Estates","Realty Co.","Home Team","Realty Partners","Real Estate Group"],
    },
    "local_specialist": {
        "prefix": ["All-Pro","Reliable","Precision","ProFix","Quick","Handy","First Choice","Apex","Elite","Premier","Direct","Blue Line","Redline","Ironclad","Swift","AAA","Guardian","Pioneer"],
        "suffix": ["Plumbing","HVAC","Electric","Roofing","Heating & Air","Garage Doors","Pest Control","Locksmith","Carpet Care","Painting","Landscaping","Handyman","Services","Pro"],
    },
}

# First/last name pools for US
FIRST_NAMES = ["James","Mary","Robert","Jennifer","Michael","Linda","William","Elizabeth","David","Barbara","Richard","Susan","Joseph","Jessica","Thomas","Sarah","Charles","Karen","Christopher","Nancy","Daniel","Lisa","Matthew","Betty","Anthony","Margaret","Mark","Sandra","Donald","Ashley","Steven","Kimberly","Paul","Emily","Andrew","Donna","Kenneth","Carol","George","Michelle","Joshua","Amanda","Kevin","Melissa","Brian","Deborah","Timothy","Stephanie","Ronald","Rebecca"]
LAST_NAMES = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez","Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson","Walker","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores","Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell","Carter","Roberts"]

# Area codes by state (first 3-digit prefix; not exhaustive but plausible)
AREA_CODES = {
    "alabama":"205","alaska":"907","arizona":"602","arkansas":"501","california":"310","colorado":"303",
    "connecticut":"203","delaware":"302","florida":"305","georgia":"404","hawaii":"808","idaho":"208",
    "illinois":"312","indiana":"317","iowa":"515","kansas":"316","kentucky":"502","louisiana":"504",
    "maine":"207","maryland":"410","massachusetts":"617","michigan":"313","minnesota":"612","mississippi":"601",
    "missouri":"314","montana":"406","nebraska":"402","nevada":"702","new_hampshire":"603","new_jersey":"201",
    "new_mexico":"505","new_york":"212","north_carolina":"704","north_dakota":"701","ohio":"614","oklahoma":"405",
    "oregon":"503","pennsylvania":"215","rhode_island":"401","south_carolina":"803","south_dakota":"605",
    "tennessee":"615","texas":"713","utah":"801","vermont":"802","virginia":"804","washington":"206",
    "west_virginia":"304","wisconsin":"414","wyoming":"307",
}
