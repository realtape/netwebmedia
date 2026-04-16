#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate 40 realistic Chilean prospects each for the 4 missing niches:
- SMB (small/medium business)
- Law Firms
- Real Estate
- Local Specialist

Distributes across 17 regions with Santiago (Metropolitana) priority.
Outputs to crm_import.json (appends to existing).
"""
import json
import os
import random
import unicodedata
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))

# Chilean-specific business name templates per niche
NICHE_TEMPLATES = {
    "smb": {
        "name_patterns": [
            "Ferretería {surname}", "Imprenta {city_adj}", "Taller {surname}",
            "Distribuidora {surname} y Cía", "Librería {city_adj}", "Papelería {surname}",
            "Electrónica {surname}", "Muebles {city_adj}", "Textiles {surname}",
            "Repuestos {city_adj}", "Tornería {surname}", "Serigrafía {city_adj}",
            "Vidriería {surname}", "Vulcanización {surname}", "Pinturas {city_adj}",
            "Cerrajería {surname}", "Panadería {city_adj}", "Carpintería {surname}",
        ],
        "domains": ["cl", "com", "com.cl"],
        "email_prefixes": ["contacto", "ventas", "info", "hola", "administracion"],
    },
    "law_firms": {
        "name_patterns": [
            "Estudio Jurídico {surname}", "Abogados {surname} & Asociados",
            "{surname} Abogados", "Bufete {surname}", "Consultora Legal {surname}",
            "{surname} y Cía Abogados", "Legal {city_adj}", "Abogados {city_adj}",
            "Corporación Jurídica {surname}", "Estudio {surname} & {surname2}",
        ],
        "domains": ["cl", "com.cl", "legal.cl"],
        "email_prefixes": ["contacto", "info", "estudio", "secretaria", "abogados"],
    },
    "real_estate": {
        "name_patterns": [
            "Inmobiliaria {surname}", "Propiedades {city_adj}", "Corretaje {surname}",
            "{surname} Propiedades", "Inmobiliaria {city_adj}", "Corredora {surname}",
            "Bienes Raíces {surname}", "Inversiones Inmobiliarias {surname}",
            "Propiedades & Inversiones {surname}", "Arriendos {city_adj}",
        ],
        "domains": ["cl", "com", "com.cl", "propiedades.cl"],
        "email_prefixes": ["contacto", "ventas", "arriendos", "propiedades", "info"],
    },
    "local_specialist": {
        "name_patterns": [
            "Veterinaria {surname}", "Gimnasio {city_adj}", "Academia {surname}",
            "Colegio {city_adj}", "Jardín Infantil {surname}", "Lavandería {city_adj}",
            "Óptica {surname}", "Farmacia {city_adj}", "Autoescuela {surname}",
            "Centro Tutorial {city_adj}", "Estudio Fotográfico {surname}",
            "Clínica Dental {surname}", "Centro Médico {city_adj}", "Spa {surname}",
        ],
        "domains": ["cl", "com", "com.cl"],
        "email_prefixes": ["contacto", "info", "reservas", "hola", "atencion"],
    },
}

# Chilean surnames (common)
CHILEAN_SURNAMES = [
    "González", "Muñoz", "Rojas", "Díaz", "Pérez", "Soto", "Contreras", "Silva",
    "Martínez", "Sepúlveda", "Morales", "Rodríguez", "López", "Fuentes", "Hernández",
    "Torres", "Araya", "Flores", "Espinoza", "Valenzuela", "Castillo", "Tapia",
    "Reyes", "Gutiérrez", "Castro", "Álvarez", "Vásquez", "Riquelme", "Pizarro",
    "Vera", "Henríquez", "Cortés", "Carrasco", "Vargas", "Campos", "Sánchez",
    "Garrido", "Alarcón", "Ramírez", "Gallardo", "Lagos", "Méndez", "Bravo",
]

# Regions/cities for distribution
CITIES = [
    "santiago", "valparaiso", "concepcion", "antofagasta", "iquique",
    "la-serena", "rancagua", "temuco", "puerto-montt", "arica",
    "copiapo", "talca", "chillan", "osorno", "valdivia",
    "punta-arenas", "coyhaique"
]

CITY_ADJECTIVES = {
    "santiago": "Santiago", "valparaiso": "Porteña", "concepcion": "Penquista",
    "antofagasta": "Antofagasta", "iquique": "Iquique", "la-serena": "Serena",
    "rancagua": "Rancagua", "temuco": "Temuco", "puerto-montt": "Puerto Montt",
    "arica": "Arica", "copiapo": "Copiapó", "talca": "Talca", "chillan": "Chillán",
    "osorno": "Osorno", "valdivia": "Valdivia", "punta-arenas": "Austral",
    "coyhaique": "Coyhaique",
}

NICHE_DISPLAY = {
    "smb": "Small/Medium Business",
    "law_firms": "Law Firms",
    "real_estate": "Real Estate",
    "local_specialist": "Local Specialist",
}

def slugify(text):
    """Convert text to URL-safe slug."""
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
    text = text.lower()
    text = ''.join(c if c.isalnum() or c == ' ' else '' for c in text)
    return text.replace(' ', '-')

def make_email(name, niche):
    """Generate a plausible email for a business."""
    slug = slugify(name).replace('-', '')[:20]
    prefix = random.choice(NICHE_TEMPLATES[niche]["email_prefixes"])
    domain_tld = random.choice(NICHE_TEMPLATES[niche]["domains"])
    return f"{prefix}@{slug}.{domain_tld}"

def make_website(name):
    """Generate a plausible website URL."""
    slug = slugify(name).replace('-', '')[:25]
    return f"www.{slug}.cl"

def make_phone():
    """Generate a plausible Chilean phone."""
    return f"+569{random.randint(40000000, 99999999)}"

def generate_prospect(niche, city):
    """Generate a single realistic prospect."""
    templates = NICHE_TEMPLATES[niche]
    surname1 = random.choice(CHILEAN_SURNAMES)
    surname2 = random.choice(CHILEAN_SURNAMES)
    city_adj = CITY_ADJECTIVES.get(city, city.title())

    pattern = random.choice(templates["name_patterns"])
    name = pattern.format(surname=surname1, surname2=surname2, city_adj=city_adj)

    email = make_email(name, niche)
    website = make_website(name)
    phone = make_phone()
    niche_display = NICHE_DISPLAY[niche]

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "company": name,
        "role": f"{niche_display} — {city.replace('-', ' ').title()}",
        "status": "lead",
        "value": 0,
        "niche_key": niche,
        "niche": niche_display,
        "city": city,
        "website": website,
        "notes": json.dumps({
            "city": city,
            "niche": niche,
            "website": website,
            "page": f"companies/{city}/{slugify(name)}.html",
            "vertical": niche_display,
            "source": "generated"
        }, ensure_ascii=False)
    }

def distribute_across_regions(total, santiago_share=0.35):
    """Distribute N prospects across cities with Santiago priority."""
    santiago_count = int(total * santiago_share)
    remaining = total - santiago_count
    other_cities = [c for c in CITIES if c != "santiago"]
    per_city = remaining // len(other_cities)
    leftover = remaining - (per_city * len(other_cities))

    distribution = {"santiago": santiago_count}
    for i, city in enumerate(other_cities):
        distribution[city] = per_city + (1 if i < leftover else 0)
    return distribution

def main():
    random.seed(42)  # Reproducible

    new_prospects = []

    # 40 per niche = 160 total new prospects
    NICHES_TO_GENERATE = ["smb", "law_firms", "real_estate", "local_specialist"]
    TARGET_PER_NICHE = 40

    for niche in NICHES_TO_GENERATE:
        print(f"Generating {TARGET_PER_NICHE} prospects for {niche}...")
        distribution = distribute_across_regions(TARGET_PER_NICHE)

        niche_prospects = []
        for city, count in distribution.items():
            for _ in range(count):
                prospect = generate_prospect(niche, city)
                niche_prospects.append(prospect)

        # Dedupe by name within niche
        seen = set()
        unique = []
        for p in niche_prospects:
            if p['name'] not in seen:
                seen.add(p['name'])
                unique.append(p)

        # Top up if we lost some to dedup
        while len(unique) < TARGET_PER_NICHE:
            city = random.choice(CITIES)
            p = generate_prospect(niche, city)
            if p['name'] not in seen:
                seen.add(p['name'])
                unique.append(p)

        new_prospects.extend(unique[:TARGET_PER_NICHE])
        print(f"  Generated {len(unique[:TARGET_PER_NICHE])} unique {niche} prospects")

    # Load existing crm_import.json
    crm_path = os.path.join(HERE, "crm_import.json")
    with open(crm_path, 'r', encoding='utf-8') as f:
        existing = json.load(f)

    print(f"\nExisting records: {len(existing)}")
    print(f"Adding new records: {len(new_prospects)}")

    combined = existing + new_prospects

    with open(crm_path, 'w', encoding='utf-8') as f:
        json.dump(combined, f, indent=2, ensure_ascii=False)

    print(f"Total records now: {len(combined)}")
    print(f"Wrote {crm_path}")

    # Verify distribution
    by_niche = defaultdict(int)
    by_city = defaultdict(int)
    for r in combined:
        by_niche[r['niche_key']] += 1
        by_city[r['city']] += 1

    print(f"\n{'Niche':<20} {'Count':>6}")
    print("-" * 30)
    for niche in sorted(by_niche.keys()):
        print(f"{niche:<20} {by_niche[niche]:>6}")

    print(f"\n{'Region':<20} {'Count':>6}")
    print("-" * 30)
    for city in sorted(by_city.keys()):
        print(f"{city:<20} {by_city[city]:>6}")

    print(f"\nTOTAL: {len(combined)}")

if __name__ == "__main__":
    main()
