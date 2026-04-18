#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Synthesize ~2400 US prospects (50 states × 6 niches × 8 leads).
Outputs usa_crm_import.json with CRM-compatible contact schema.
Deterministic (seeded by state+niche+index) so re-runs are stable.
"""
import os, json, hashlib, random
from usa_config import STATES, NAME_PARTS, FIRST_NAMES, LAST_NAMES, AREA_CODES

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "usa_crm_import.json")
LEADS_PER_NICHE = 8  # per state per niche
USE_TOP_N_NICHES = 6  # each state has 6 niches in its list

def seeded(key, lo, hi):
    h = hashlib.md5(key.encode()).digest()
    return lo + (int.from_bytes(h[:4], "big") % (hi - lo + 1))

def pick(key, arr):
    return arr[seeded(key, 0, len(arr)-1)]

def slugify(s):
    return s.lower().replace(" ","-").replace("&","and").replace(",","").replace(".","").replace("'","").replace("/","-").replace("--","-")

def city_display(slug):
    return " ".join(w.capitalize() for w in slug.replace("-"," ").split())

def synth_business(state_key, niche, idx):
    seed = f"{state_key}|{niche}|{idx}"
    parts = NAME_PARTS[niche]
    prefix = pick(seed+":p", parts["prefix"])
    suffix = pick(seed+":s", parts["suffix"])
    # Some variety: sometimes "Prefix Suffix", sometimes "Prefix LastName Suffix"
    if seeded(seed+":fmt", 0, 9) < 3 and niche in ("law_firms","real_estate","health","local_specialist"):
        ln = pick(seed+":ln", LAST_NAMES)
        name = f"{ln} {prefix} {suffix}"
    else:
        name = f"{prefix} {suffix}"
    return name.strip()

def synth_email(name, state_key):
    # 60% custom domain, 30% gmail, 10% yahoo — realistic US mix
    slug = slugify(name).replace("-","").replace("and","")[:18]
    first = slugify(pick(name+":fn", FIRST_NAMES))
    bucket = seeded(name+":em", 0, 99)
    if bucket < 60:
        return f"info@{slug}.com"
    elif bucket < 75:
        return f"contact@{slug}.com"
    elif bucket < 90:
        return f"{first}.{slug[:8]}@gmail.com"
    else:
        return f"{first}{seeded(name+':n',10,99)}@yahoo.com"

def synth_phone(state_key, name):
    ac = AREA_CODES.get(state_key, "555")
    mid = f"{seeded(name+':ph1', 200, 999)}"
    end = f"{seeded(name+':ph2', 1000, 9999)}"
    return f"({ac}) {mid}-{end}"

def synth_website(name):
    # 72% have websites (US is more digitally mature than Chile)
    if seeded(name+":ws", 0, 99) < 72:
        slug = slugify(name).replace("-","").replace("and","")[:22]
        return f"www.{slug}.com"
    return ""

def synth_contact_person(state_key, niche, business):
    seed = f"{business}|person"
    return f"{pick(seed+':f', FIRST_NAMES)} {pick(seed+':l', LAST_NAMES)}"

def main():
    out = []
    for state_key, state in STATES.items():
        niches = state["niches"][:USE_TOP_N_NICHES]
        cities = state["cities"]
        for niche in niches:
            for i in range(LEADS_PER_NICHE):
                city_slug = cities[i % len(cities)]
                city_name = city_display(city_slug)
                biz = synth_business(state_key, niche, i)
                slug = slugify(biz)
                contact = synth_contact_person(state_key, niche, biz)
                page = f"companies-usa/{state_key.replace('_','-')}/{slug}.html"
                notes = {
                    "city": city_name,
                    "niche": niche,
                    "state": state["name"],
                    "state_code": state["code"],
                    "website": synth_website(biz),
                    "page": page,
                    "segment": "usa",
                }
                out.append({
                    "name": contact,
                    "email": synth_email(biz, state_key),
                    "phone": synth_phone(state_key, biz),
                    "company": biz,
                    "role": f"Owner / Manager — {state['name']}",
                    "status": "lead",
                    "value": 0,
                    "notes": json.dumps(notes, ensure_ascii=False),
                })
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    # Summary
    by_niche = {}
    by_state = {}
    for r in out:
        m = json.loads(r["notes"])
        by_niche[m["niche"]] = by_niche.get(m["niche"],0)+1
        by_state[m["state"]] = by_state.get(m["state"],0)+1
    print(f"wrote {len(out)} US prospects to {OUT}")
    print(f"  states: {len(by_state)}, niches: {len(by_niche)}")
    print(f"  niche distribution: {by_niche}")

if __name__ == "__main__":
    main()
