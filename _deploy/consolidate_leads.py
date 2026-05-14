#!/usr/bin/env python3
"""
Consolidate cleaned lead CSVs into master files with cross-file dedup.

Reads every *_cleaned.csv produced by clean_leads.py and produces:
  _leads/master_usa_cleaned.csv     — USA-only (from usa_* sources + leads.csv US rows)
  _leads/master_chile_cleaned.csv   — Chile-only
  _leads/master_all_cleaned.csv     — global merge, dedupe by email

Canonical output schema:
  email, name, company, phone, website, city, state, country, niche, source

Run AFTER clean_leads.py.
"""
from __future__ import annotations
import csv
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

USA_SOURCES = [
    REPO / "api-php/data/usa_best_200_cleaned.csv",
    REPO / "api-php/data/usa_best_prospects_cleaned.csv",
    REPO / "api-php/data/usa_5x_cleaned.csv",
]
CHILE_SOURCES = [
    REPO / "api-php/data/all_leads_cleaned.csv",
    REPO / "api-php/data/all_leads_5x_cleaned.csv",
    REPO / "api-php/data/chile_best_prospects_cleaned.csv",
    REPO / "api-php/data/santiago_leads_cleaned.csv",
    REPO / "api-php/data/antofagasta_leads_cleaned.csv",
    REPO / "api-php/data/arica_leads_cleaned.csv",
    REPO / "api-php/data/chillán_leads_cleaned.csv",
    REPO / "api-php/data/concepción_leads_cleaned.csv",
    REPO / "api-php/data/copiapó_leads_cleaned.csv",
    REPO / "api-php/data/coyhaique_leads_cleaned.csv",
    REPO / "api-php/data/iquique_leads_cleaned.csv",
    REPO / "api-php/data/la-serena_leads_cleaned.csv",
    REPO / "api-php/data/osorno_leads_cleaned.csv",
    REPO / "api-php/data/puerto-montt_leads_cleaned.csv",
    REPO / "api-php/data/punta-arenas_leads_cleaned.csv",
    REPO / "api-php/data/rancagua_leads_cleaned.csv",
    REPO / "api-php/data/talca_leads_cleaned.csv",
    REPO / "api-php/data/temuco_leads_cleaned.csv",
    REPO / "api-php/data/valdivia_leads_cleaned.csv",
    REPO / "api-php/data/valparaíso_leads_cleaned.csv",
]
MIXED_SOURCES = [REPO / "_leads/leads_cleaned.csv"]  # has `country` column; we split US/non-US

CANONICAL = ["email", "name", "company", "phone", "website", "city", "state", "country", "niche", "source"]


def lookup(row: list[str], headers: list[str], *names: str) -> str:
    norm = [h.lstrip("﻿").strip().lower() for h in headers]
    for n in names:
        if n in norm:
            i = norm.index(n)
            if i < len(row):
                return (row[i] or "").strip()
    return ""


def iter_normalized(path: Path, default_country: str = "", default_source: str = ""):
    if not path.exists():
        return
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)
        headers = next(reader, None)
        if not headers:
            return
        src_label = default_source or path.stem.replace("_cleaned", "")
        for row in reader:
            if not row:
                continue
            email = lookup(row, headers, "email").lower()
            if not email:
                continue
            country = lookup(row, headers, "country") or default_country
            yield {
                "email": email,
                "name": lookup(row, headers, "name"),
                "company": lookup(row, headers, "company"),
                "phone": lookup(row, headers, "phone"),
                "website": lookup(row, headers, "website"),
                "city": lookup(row, headers, "city"),
                "state": lookup(row, headers, "state"),
                "country": country,
                "niche": lookup(row, headers, "niche", "niche_key"),
                "source": src_label,
            }


def write_master(path: Path, rows) -> int:
    seen: set[str] = set()
    n = 0
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=CANONICAL)
        w.writeheader()
        for r in rows:
            if r["email"] in seen:
                continue
            seen.add(r["email"])
            w.writerow(r)
            n += 1
    return n


def main() -> int:
    # USA master: cleaned usa_* + US-country rows from leads_cleaned.csv
    def usa_stream():
        for p in USA_SOURCES:
            yield from iter_normalized(p, default_country="US")
        for r in iter_normalized(REPO / "_leads/leads_cleaned.csv"):
            if (r["country"] or "").upper() in ("US", "USA", "UNITED STATES"):
                yield r

    # Chile master
    def chile_stream():
        for p in CHILE_SOURCES:
            yield from iter_normalized(p, default_country="CL")
        for r in iter_normalized(REPO / "_leads/leads_cleaned.csv"):
            if (r["country"] or "").upper() in ("CL", "CHILE"):
                yield r

    # All master: every cleaned file, dedupe by email
    def all_stream():
        for p in USA_SOURCES + CHILE_SOURCES + MIXED_SOURCES:
            default_c = "US" if "usa" in p.stem else ("CL" if any(c in p.stem for c in ("chile", "santiago", "antofagasta", "arica", "chillán", "concepción", "copiapó", "coyhaique", "iquique", "la-serena", "osorno", "puerto-montt", "punta-arenas", "rancagua", "talca", "temuco", "valdivia", "valparaíso", "all_leads")) else "")
            yield from iter_normalized(p, default_country=default_c)

    counts = {
        "master_usa_cleaned.csv": write_master(REPO / "_leads/master_usa_cleaned.csv", usa_stream()),
        "master_chile_cleaned.csv": write_master(REPO / "_leads/master_chile_cleaned.csv", chile_stream()),
        "master_all_cleaned.csv": write_master(REPO / "_leads/master_all_cleaned.csv", all_stream()),
    }
    for name, n in counts.items():
        print(f"_leads/{name}: {n:,} unique rows")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
