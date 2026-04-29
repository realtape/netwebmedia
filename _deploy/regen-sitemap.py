"""Regenerate sitemap.xml — strips .venv, dev dirs, internal files.

Output URLs match production canonicals (see plans/audit-2026-04-29.md):
  - Top-level pages keep .html (e.g. /services.html), matching <link rel=canonical>.
  - Nested directory pages (industries/*/index.html, blog/index.html) emit the
    folder URL (/industries/legal-services/) since Apache serves index.html.
  - Site root /index.html emits / (just the apex).

Excludes 403'd internal pages (prospects-report, digital-gaps, etc.) so Google
doesn't waste crawl budget on URLs the .htaccess will reject.
"""
import os
import re
from datetime import date

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
BASE = "https://netwebmedia.com"
TODAY = date.today().strftime("%Y-%m-%d")

EXCLUDE_DIRS = {
    ".venv", "node_modules", ".git", "_backup", "_cron", "_deploy",
    "Netwebmedia-antigravity-copy-work", "site-upload", "crm-vanilla",
    "backend", "api", "api-php", "assets", "css", "js", "pdf",
    "proposals", "deliverables", "email-templates", "campaigns",
    "video-factory", "social", "n8n-templates", "app", "docs",
    "tools", "audits", "lp", "community-alert-app", "poker-news",
    "templates-site", "guides", "plans",
    # Private rendering / asset working dirs — not public marketing pages
    "hyperframes", "livery-editor", "mobile", "reports", "content",
    "_dev", "Netwebmedia-antigravity-copy-work",
    # Internal authenticated UI — not public pages
    "cms", "crm",
}

EXCLUDE_FILES = {
    "login.html", "register.html", "desktop-login.html", "thanks.html",
    "diagnostic.html", "orgchart.html", "audit-report.html", "cart.html",
    "checkout.html", "dashboard.html", "netwebmedia-inbox.html",
    "pricing-onepager.html", "_base.html",
    # Internal authenticated / scratchpad surfaces
    "flowchart.html", "nwmai.html", "nwm-cms.html", "nwm-crm.html",
    "audit-thanks.html",
    # Internal / verification files
    "NetWebMedia_Business_Marketing_Plan_2026.html",
    "googlef707382bdfd91013.html",
}

# Files matching these patterns are 403'd by .htaccess — must NOT appear in
# the sitemap or Google will waste crawl budget hitting forbidden URLs.
EXCLUDE_PATTERNS = (
    re.compile(r"^.+-prospects-report\.html$"),
    re.compile(r"^.+-digital-gaps\.html$"),
)

PRIORITY_MAP = {
    "/":                        ("1.0",  "weekly"),
    "/index.html":              ("1.0",  "weekly"),
    "/pricing.html":            ("0.95", "weekly"),
    "/contact.html":            ("0.95", "weekly"),
    "/services.html":           ("0.95", "weekly"),
    "/about.html":              ("0.7",  "monthly"),
    "/results.html":            ("0.8",  "monthly"),
    "/faq.html":                ("0.8",  "monthly"),
    "/partners.html":           ("0.8",  "monthly"),
    "/blog.html":               ("0.7",  "monthly"),
    "/tutorials.html":          ("0.7",  "monthly"),
    "/compare.html":            ("0.7",  "monthly"),
    "/vs-hubspot.html":         ("0.7",  "monthly"),
    "/vs-gohighlevel.html":     ("0.7",  "monthly"),
    "/nwm-crm.html":            ("0.8",  "monthly"),
    "/nwm-cms.html":            ("0.8",  "monthly"),
    "/email-marketing.html":    ("0.8",  "monthly"),
    "/analytics.html":          ("0.7",  "monthly"),
    "/knowledge-base.html":     ("0.7",  "monthly"),
    "/catalogue.html":          ("0.85", "weekly"),
    "/nwmai.html":              ("0.7",  "monthly"),
}


def get_priority(rel):
    if rel in PRIORITY_MAP:
        return PRIORITY_MAP[rel]
    if rel.startswith("/blog/"):
        return ("0.75", "monthly")
    if rel.startswith("/tutorials/"):
        return ("0.8",  "monthly")
    if rel.startswith("/crm-demo/") or rel.startswith("/cms-demo/"):
        return ("0.7",  "monthly")
    if rel.startswith("/industries/"):
        return ("0.85", "monthly")
    return ("0.6", "monthly")


urls = []

for dirpath, dirnames, filenames in os.walk(ROOT):
    # Prune excluded dirs in-place so os.walk skips them entirely
    dirnames[:] = [
        d for d in dirnames
        if d not in EXCLUDE_DIRS and not d.startswith(".")
    ]

    for fname in filenames:
        if not fname.endswith(".html"):
            continue
        if fname in EXCLUDE_FILES:
            continue
        if any(p.match(fname) for p in EXCLUDE_PATTERNS):
            continue
        full = os.path.join(dirpath, fname)
        rel = full[len(ROOT):].replace("\\", "/")
        if not rel.startswith("/"):
            rel = "/" + rel
        # Safety: skip anything that slipped through with excluded dir names
        parts = rel.split("/")
        if any(p in EXCLUDE_DIRS for p in parts):
            continue

        # Map index.html → folder URL (Apache serves index.html as folder root):
        #   /index.html → /
        #   /industries/legal-services/index.html → /industries/legal-services/
        #   /blog/index.html → /blog/   (also covered by blog.html separately)
        if fname == "index.html":
            rel = rel[: -len("index.html")]  # keep trailing slash

        priority, changefreq = get_priority(rel)
        urls.append((rel, priority, changefreq))

urls.sort(key=lambda x: x[0])

lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
]
for rel, priority, changefreq in urls:
    loc = BASE + rel
    lines += [
        "  <url>",
        f"    <loc>{loc}</loc>",
        f"    <lastmod>{TODAY}</lastmod>",
        f"    <changefreq>{changefreq}</changefreq>",
        f"    <priority>{priority}</priority>",
        "  </url>",
    ]
lines.append("</urlset>")

out_path = os.path.join(ROOT, "sitemap.xml")
with open(out_path, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")

print(f"sitemap.xml written — {len(urls)} URLs")
