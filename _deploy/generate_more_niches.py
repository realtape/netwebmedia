#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate 40 prospects each for 6 additional niches:
Automotive, Education, Home Services, Wine & Agriculture, Financial Services, Events & Weddings.
"""
import json
import os
import random
import unicodedata
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
random.seed(123)

CITIES = [
    "santiago", "valparaíso", "concepción", "antofagasta", "iquique",
    "la-serena", "rancagua", "temuco", "puerto-montt", "arica",
    "copiapó", "talca", "chillán", "osorno", "valdivia",
    "punta-arenas", "coyhaique"
]

CITY_ADJ = {
    "santiago": "Santiago", "valparaíso": "Porteña", "concepción": "Penquista",
    "antofagasta": "del Norte", "iquique": "Iquique", "la-serena": "Serena",
    "rancagua": "Rancagua", "temuco": "Temuco", "puerto-montt": "Puerto Montt",
    "arica": "Arica", "copiapó": "Copiapó", "talca": "Talca", "chillán": "Chillán",
    "osorno": "Osorno", "valdivia": "Valdivia", "punta-arenas": "Austral",
    "coyhaique": "Coyhaique"
}

SURNAMES = [
    "González", "Muñoz", "Rojas", "Díaz", "Pérez", "Soto", "Contreras", "Silva",
    "Martínez", "Sepúlveda", "Morales", "Rodríguez", "López", "Fuentes", "Hernández",
    "Torres", "Araya", "Flores", "Espinoza", "Valenzuela", "Castillo", "Tapia",
    "Reyes", "Gutiérrez", "Castro", "Álvarez", "Vásquez", "Riquelme", "Pizarro",
    "Vera", "Henríquez", "Cortés", "Carrasco", "Vargas", "Campos", "Sánchez",
]

NEW_NICHES = {
    "automotive": {
        "display": "Automotive",
        "patterns": [
            "Automotriz {surname}", "Concesionaria {city_adj}", "Taller Mecánico {surname}",
            "Neumáticos {city_adj}", "Lavado {surname}", "Repuestos {surname}",
            "Rent a Car {city_adj}", "Autocenter {surname}", "Motos {city_adj}",
            "Desabolladuría {surname}", "Pintura Automotriz {city_adj}", "Vulcanización {surname}",
        ],
        "email_prefixes": ["ventas", "contacto", "servicio", "taller", "repuestos"],
    },
    "education": {
        "display": "Education",
        "patterns": [
            "Colegio {city_adj}", "Instituto {surname}", "Jardín Infantil {surname}",
            "Academia {city_adj}", "Preuniversitario {surname}", "Escuela {city_adj}",
            "Centro Tutorial {surname}", "Idiomas {city_adj}", "Autoescuela {surname}",
            "Liceo {city_adj}", "Instituto Profesional {surname}", "Centro Educacional {city_adj}",
        ],
        "email_prefixes": ["admisiones", "contacto", "matriculas", "info", "secretaria"],
    },
    "home_services": {
        "display": "Home Services & Construction",
        "patterns": [
            "Constructora {surname}", "Arquitectos {surname} y Cía", "Gasfitería {city_adj}",
            "Electricidad {surname}", "Pintores {city_adj}", "Remodelaciones {surname}",
            "Carpintería {city_adj}", "Climatización {surname}", "Jardinería {city_adj}",
            "Techumbres {surname}", "Muebles a Medida {surname}", "Cerrajería {city_adj}",
            "Ingeniería {surname}", "Obras {city_adj}",
        ],
        "email_prefixes": ["contacto", "cotizaciones", "obras", "presupuestos", "proyectos"],
    },
    "wine_agriculture": {
        "display": "Wine & Agriculture",
        "patterns": [
            "Viña {surname}", "Bodega {city_adj}", "Agrícola {surname}",
            "Viñedos {city_adj}", "Frutícola {surname}", "Lácteos {city_adj}",
            "Viña {surname} y Cía", "Agro {city_adj}", "Exportadora {surname}",
            "Fundo {surname}", "Olivícola {city_adj}", "Hortícola {surname}",
        ],
        "email_prefixes": ["contacto", "ventas", "turismo", "exportacion", "info"],
    },
    "financial_services": {
        "display": "Financial Services",
        "patterns": [
            "Contadores {surname}", "Seguros {city_adj}", "Asesoría Tributaria {surname}",
            "{surname} Contadores Auditores", "Corredora de Seguros {city_adj}",
            "Consultora Financiera {surname}", "Auditores {surname} y Asociados",
            "Asesorías Contables {city_adj}", "Inversiones {surname}", "Seguros Generales {surname}",
        ],
        "email_prefixes": ["contacto", "info", "contadores", "asesorias", "seguros"],
    },
    "events_weddings": {
        "display": "Events & Weddings",
        "patterns": [
            "Eventos {city_adj}", "Banquetería {surname}", "Fotografía {surname}",
            "Wedding Planner {city_adj}", "Centro de Eventos {surname}", "Catering {city_adj}",
            "Producciones {surname}", "Decoración Eventos {city_adj}", "DJ {surname}",
            "Casa de Fiesta {city_adj}", "Jardín de Eventos {surname}", "Video Producciones {surname}",
        ],
        "email_prefixes": ["contacto", "eventos", "reservas", "info", "cotizaciones"],
    },
}


def slugify(t):
    t = unicodedata.normalize('NFKD', t).encode('ascii', 'ignore').decode('ascii')
    t = t.lower()
    t = ''.join(c if c.isalnum() or c == ' ' else '' for c in t)
    return t.replace(' ', '-')


def generate(niche_key, city):
    cfg = NEW_NICHES[niche_key]
    s1 = random.choice(SURNAMES)
    s2 = random.choice(SURNAMES)
    ca = CITY_ADJ.get(city, city.title())
    pattern = random.choice(cfg["patterns"])
    name = pattern.format(surname=s1, surname2=s2, city_adj=ca)
    slug = slugify(name).replace('-', '')[:22]
    prefix = random.choice(cfg["email_prefixes"])
    tld = random.choice(["cl", "com.cl", "com"])
    email = f"{prefix}@{slug}.{tld}"
    website = f"www.{slug}.cl"
    phone = f"+569{random.randint(40000000, 99999999)}"
    display = cfg["display"]
    return {
        "name": name, "email": email, "phone": phone, "company": name,
        "role": f"{display} — {city.replace('-', ' ').title()}",
        "status": "lead", "value": 0,
        "niche_key": niche_key, "niche": display, "city": city,
        "website": website,
        "notes": json.dumps({
            "city": city, "niche": niche_key, "website": website,
            "page": f"companies/{city}/{slugify(name)}.html",
            "vertical": display, "source": "generated"
        }, ensure_ascii=False)
    }


def distribute(total, santiago_share=0.35):
    s_count = int(total * santiago_share)
    rem = total - s_count
    others = [c for c in CITIES if c != "santiago"]
    per = rem // len(others)
    leftover = rem - (per * len(others))
    dist = {"santiago": s_count}
    for i, c in enumerate(others):
        dist[c] = per + (1 if i < leftover else 0)
    return dist


def main():
    new_records = []
    TARGET = 40

    for niche_key in NEW_NICHES.keys():
        print(f"Generating {TARGET} for {niche_key}...")
        dist = distribute(TARGET)
        seen = set()
        niche_records = []
        for city, count in dist.items():
            for _ in range(count):
                p = generate(niche_key, city)
                if p['name'] not in seen:
                    seen.add(p['name'])
                    niche_records.append(p)

        attempts = 0
        while len(niche_records) < TARGET and attempts < 200:
            c = random.choice(CITIES)
            p = generate(niche_key, c)
            if p['name'] not in seen:
                seen.add(p['name'])
                niche_records.append(p)
            attempts += 1

        new_records.extend(niche_records[:TARGET])
        print(f"  {len(niche_records[:TARGET])} unique")

    print(f"\nTotal new: {len(new_records)}")

    with open(os.path.join(HERE, "crm_import.json"), "r", encoding="utf-8") as f:
        existing = json.load(f)

    combined = existing + new_records
    print(f"Existing: {len(existing)} + New: {len(new_records)} = Total: {len(combined)}")

    with open(os.path.join(HERE, "crm_import.json"), "w", encoding="utf-8") as f:
        json.dump(combined, f, indent=2, ensure_ascii=False)

    by_niche = defaultdict(int)
    by_city = defaultdict(int)
    for r in combined:
        by_niche[r['niche_key']] += 1
        by_city[r['city']] += 1

    print("\nBy Niche:")
    for niche in sorted(by_niche.keys(), key=lambda x: -by_niche[x]):
        print(f"  {niche:25s}: {by_niche[niche]:>4}")

    print("\nBy Region:")
    for city in sorted(by_city.keys(), key=lambda x: -by_city[x]):
        print(f"  {city:25s}: {by_city[city]:>4}")

    print(f"\nTOTAL: {len(combined)}")


if __name__ == "__main__":
    main()
