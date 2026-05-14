#!/usr/bin/env python3
"""
Strict non-human cleanup for NetWebMedia lead CSVs.

Drops rows where:
  - email is empty / "Not found" / "N/A" / fails regex
  - email local-part is a non-human role (noreply, postmaster, webmaster,
    abuse, mailer-daemon, do-not-reply, bounce, unsubscribe, root, daemon,
    nobody)
  - email domain is example/test/localhost
  - BOTH name and website are empty (no way to qualify)
Then dedupes by lowercased email and writes <stem>_cleaned.csv next to each
input. Writes a markdown report at _leads/CLEANUP_REPORT.md.

Per CLAUDE.md / Carlos rule (2026-05-14): info@ / contacto@ / ventas@ /
reservas@ ARE kept — those are SMB owner inboxes, not non-human accounts.

Run:  python3 _deploy/clean_leads.py
"""
from __future__ import annotations
import csv
import re
import sys
from pathlib import Path
from typing import Iterable

REPO = Path(__file__).resolve().parent.parent

INPUT_FILES = [
    REPO / "_leads/leads.csv",
    REPO / "api-php/data/all_leads.csv",
    REPO / "api-php/data/all_leads_5x.csv",
    REPO / "api-php/data/usa_best_200.csv",
    REPO / "api-php/data/usa_best_prospects.csv",
    REPO / "api-php/data/usa_5x.csv",
    REPO / "api-php/data/chile_best_prospects.csv",
    REPO / "api-php/data/santiago_leads.csv",
    REPO / "api-php/data/antofagasta_leads.csv",
    REPO / "api-php/data/arica_leads.csv",
    REPO / "api-php/data/chillán_leads.csv",
    REPO / "api-php/data/concepción_leads.csv",
    REPO / "api-php/data/copiapó_leads.csv",
    REPO / "api-php/data/coyhaique_leads.csv",
    REPO / "api-php/data/iquique_leads.csv",
    REPO / "api-php/data/la-serena_leads.csv",
    REPO / "api-php/data/osorno_leads.csv",
    REPO / "api-php/data/puerto-montt_leads.csv",
    REPO / "api-php/data/punta-arenas_leads.csv",
    REPO / "api-php/data/rancagua_leads.csv",
    REPO / "api-php/data/talca_leads.csv",
    REPO / "api-php/data/temuco_leads.csv",
    REPO / "api-php/data/valdivia_leads.csv",
    REPO / "api-php/data/valparaíso_leads.csv",
]

NON_HUMAN_LOCALS = {
    "noreply", "no-reply", "do-not-reply", "donotreply",
    "postmaster", "webmaster", "mailer-daemon", "mailerdaemon",
    "abuse", "bounce", "bounces", "unsubscribe",
    "root", "daemon", "nobody", "null", "void",
}
JUNK_DOMAINS = {"example.com", "example.org", "test.com", "localhost", "domain.com", "email.com", "yourdomain.com"}
JUNK_EMAIL_VALUES = {"", "not found", "n/a", "na", "none", "null", "-", "tbd", "unknown"}
EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$")


def is_acceptable_email(email: str) -> tuple[bool, str]:
    """Return (ok, reason_if_not). 'reason' is the discard bucket."""
    e = (email or "").strip().strip('"').strip("'").lower()
    if e in JUNK_EMAIL_VALUES:
        return False, "empty_or_placeholder"
    if not EMAIL_RE.match(e):
        return False, "malformed"
    local, _, domain = e.partition("@")
    if domain in JUNK_DOMAINS:
        return False, "junk_domain"
    if local in NON_HUMAN_LOCALS:
        return False, "non_human_local"
    return True, ""


def find_columns(headers: list[str]) -> dict[str, int]:
    """Map canonical field name -> column index."""
    norm = [(h or "").lstrip("﻿").strip().lower() for h in headers]
    idx = {}
    for canonical in ("email", "name", "company", "website", "phone", "city", "country", "niche"):
        if canonical in norm:
            idx[canonical] = norm.index(canonical)
    return idx


def clean_file(path: Path, report: list[str]) -> dict[str, int]:
    if not path.exists():
        report.append(f"- **{path.name}** — missing, skipped")
        return {}

    stats = {"in": 0, "kept": 0, "no_email": 0, "non_human_local": 0,
             "junk_domain": 0, "malformed": 0, "empty_or_placeholder": 0,
             "no_name_no_site": 0, "dup_email": 0}

    out_path = path.with_name(path.stem + "_cleaned.csv")
    seen_emails: set[str] = set()

    with path.open("r", encoding="utf-8-sig", newline="") as f_in, \
         out_path.open("w", encoding="utf-8", newline="") as f_out:
        reader = csv.reader(f_in)
        try:
            headers = next(reader)
        except StopIteration:
            report.append(f"- **{path.name}** — empty file, skipped")
            return stats
        cols = find_columns(headers)
        if "email" not in cols:
            report.append(f"- **{path.name}** — no `email` column, skipped (cols: {headers[:6]})")
            return stats

        writer = csv.writer(f_out)
        writer.writerow(headers)

        e_idx = cols["email"]
        n_idx = cols.get("name", -1)
        w_idx = cols.get("website", -1)
        c_idx = cols.get("company", -1)

        for row in reader:
            stats["in"] += 1
            if len(row) <= e_idx:
                stats["malformed"] += 1
                continue
            email = row[e_idx]
            ok, reason = is_acceptable_email(email)
            if not ok:
                stats[reason if reason in stats else "no_email"] += 1
                continue
            name = row[n_idx].strip() if n_idx >= 0 and n_idx < len(row) else ""
            company = row[c_idx].strip() if c_idx >= 0 and c_idx < len(row) else ""
            website = row[w_idx].strip() if w_idx >= 0 and w_idx < len(row) else ""
            # Accept if EITHER a contact identity (name or company) OR a website is present
            if not (name or company) and not website:
                stats["no_name_no_site"] += 1
                continue
            email_lc = email.strip().lower()
            if email_lc in seen_emails:
                stats["dup_email"] += 1
                continue
            seen_emails.add(email_lc)
            row[e_idx] = email_lc
            writer.writerow(row)
            stats["kept"] += 1

    pct = (stats["kept"] / stats["in"] * 100) if stats["in"] else 0.0
    report.append(
        f"- **{path.relative_to(REPO)}** — in: {stats['in']:,} → kept: {stats['kept']:,} ({pct:.1f}%)  "
        f"\n  · dropped: dup={stats['dup_email']:,}, "
        f"no-name+no-site={stats['no_name_no_site']:,}, "
        f"empty/placeholder={stats['empty_or_placeholder']:,}, "
        f"malformed={stats['malformed']:,}, "
        f"non-human={stats['non_human_local']:,}, "
        f"junk-domain={stats['junk_domain']:,}"
    )
    return stats


def main() -> int:
    report: list[str] = [
        "# Lead List Cleanup Report",
        "",
        f"_Run: 2026-05-14 (branch `claude/clean-contact-lists-dnVuC`)_",
        "",
        "## Rules applied (strict non-human only)",
        "",
        "**Dropped:**",
        "- Empty email, `Not found`, `N/A`, malformed addresses",
        "- Non-human locals: noreply, no-reply, do-not-reply, postmaster, webmaster, "
        "  mailer-daemon, abuse, bounce, unsubscribe, root, daemon, nobody",
        "- Junk domains: example.com, test.com, localhost, yourdomain.com",
        "- Rows missing **both** a name/company **and** a website",
        "- Duplicate emails (first occurrence wins, case-insensitive)",
        "",
        "**Kept (Carlos rule, 2026-05-14):**",
        "- Role-based SMB inboxes: `info@`, `contacto@`, `contact@`, `ventas@`, "
        "  `sales@`, `reservas@`, `hello@`, `admin@`, `support@` — these are the "
        "  legitimate way to reach the 14-niche SMB target base.",
        "",
        "Output: `<stem>_cleaned.csv` written next to each source. Originals untouched.",
        "",
        "## Per-file results",
        "",
    ]
    totals = {"in": 0, "kept": 0}
    for path in INPUT_FILES:
        stats = clean_file(path, report)
        totals["in"] += stats.get("in", 0)
        totals["kept"] += stats.get("kept", 0)

    pct = (totals["kept"] / totals["in"] * 100) if totals["in"] else 0.0
    report.insert(4, "")
    report.insert(4, f"**Totals:** {totals['in']:,} rows in → **{totals['kept']:,} kept** ({pct:.1f}%)")

    (REPO / "_leads/CLEANUP_REPORT.md").write_text("\n".join(report) + "\n", encoding="utf-8")
    print(f"Wrote _leads/CLEANUP_REPORT.md — totals: {totals['in']:,} → {totals['kept']:,}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
