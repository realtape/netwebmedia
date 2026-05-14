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
from datetime import date, datetime

# Minimum unique word count for a sitemap inclusion. SEO audit 2026-05-13: 339
# pages reported "not indexed" by GSC; root cause for industry subniche skeletons
# is sub-800-word boilerplate that Google rates as thin/duplicate. Exclude until
# each page has ≥800 words of distinct copy.
MIN_WORDS = 800

_WORD_STRIP_RE = re.compile(r"<script[^>]*>.*?</script>|<style[^>]*>.*?</style>|<[^>]+>", re.S)


def word_count(path):
    """Return rough word count of visible text in an HTML file (script/style stripped)."""
    try:
        with open(path, encoding="utf-8") as fh:
            html = fh.read()
    except (OSError, UnicodeDecodeError):
        return 0
    text = _WORD_STRIP_RE.sub(" ", html)
    return len(text.split())

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
BASE = "https://netwebmedia.com"
TODAY = date.today().strftime("%Y-%m-%d")


def file_mtime(path):
    """Return YYYY-MM-DD of file mtime; fall back to TODAY if missing/unreadable.

    AEO/SEO note: <lastmod> should reflect the page's actual last edit so search
    engines and AI crawlers prioritize fresh content. Stamping every URL with
    today's date defeats that signal and looks like a freshness-spam pattern.
    """
    try:
        return datetime.fromtimestamp(os.path.getmtime(path)).strftime("%Y-%m-%d")
    except (OSError, ValueError):
        return TODAY

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
    # Archive of pre-AEO-pivot site content — kept for reference, not crawled
    "_archive", "_lessons", "_ci",
}

EXCLUDE_FILES = {
    "login.html", "register.html", "desktop-login.html", "thanks.html",
    "diagnostic.html", "orgchart.html", "audit-report.html", "cart.html",
    "checkout.html", "dashboard.html", "netwebmedia-inbox.html",
    "pricing-onepager.html", "_base.html",
    # Internal authenticated / scratchpad surfaces
    "flowchart.html", "nwmai.html", "nwm-cms.html", "nwm-crm.html",
    "audit-thanks.html",
    # Internal noindex'd pages — must NOT appear in sitemap (Google penalizes
    # sitemaps that submit noindex'd URLs as a quality signal)
    "agents-flowchart.html", "emails.html",
    # Survey/thank-you pages — explicitly noindex'd, must not appear in sitemap
    "aeo-survey-thanks.html",
    # Internal / verification files
    "NetWebMedia_Business_Marketing_Plan_2026.html",
    "googlef707382bdfd91013.html",
    "meta-verification-worksheet.html",
    "social-carousel-preview.html",
    "form.html",
    "review.html",
}

# Files matching these patterns are 403'd by .htaccess — must NOT appear in
# the sitemap or Google will waste crawl budget hitting forbidden URLs.
# Also excludes:
#   - _audit_*.html: internal duplicate-page audit artifacts (canonical to real
#     pages; pollute sitemap and burn crawl budget on identical content).
#   - CUsers*.html: broken sitemap-generator artifacts where a Windows path
#     was mangled into a filename. These resolve to 404s in production.
#   - template-N.html: stub template files in industries/<niche>/ that are
#     not real content (sub-800-word skeletons). Excluded until promoted to
#     real subniche pages with unique copy + schema.
EXCLUDE_PATTERNS = (
    re.compile(r"^.+-prospects-report\.html$"),
    re.compile(r"^.+-digital-gaps\.html$"),
    re.compile(r"^_audit_.+\.html$"),
    re.compile(r"^C[Uu]sers.+\.html$"),
    re.compile(r"^template-\d+\.html$"),
)

PRIORITY_MAP = {
    "/":                        ("1.0",  "weekly"),
    "/index.html":              ("1.0",  "weekly"),
    "/pricing.html":            ("0.95", "weekly"),
    "/contact.html":            ("0.95", "weekly"),
    "/services.html":           ("0.95", "weekly"),
    "/about.html":              ("0.9",  "monthly"),
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
    "/aeo-index.html":          ("0.85", "weekly"),
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
        # Thin-content exclusion (≥800 words required for industry subniche pages).
        # The 14 niche HUBS at /industries/<niche>/index.html stay in even if thin
        # (commercial intent + audit acknowledges they need expansion). Only the
        # /industries/<niche>/<subniche>/index.html depth gets the word-count gate.
        rel_parts = rel.replace("\\", "/").lstrip("/").split("/")
        is_industry_subniche = (
            len(rel_parts) == 4
            and rel_parts[0] == "industries"
            and rel_parts[3] == "index.html"
        )
        if is_industry_subniche and word_count(full) < MIN_WORDS:
            continue
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
        # Use the source file's mtime so each URL carries its real last-edit
        # date — `full` is the actual file path on disk, including index.html
        # for folder-canonical URLs (we already mapped rel above).
        lastmod = file_mtime(full)
        urls.append((rel, priority, changefreq, lastmod))

urls.sort(key=lambda x: x[0])


def atomic_write(path, content):
    """Write content to path atomically via a .tmp file + os.replace.

    Prevents a partial-write window where a reader (Google's crawler hitting
    the FTP-deployed file, or a parallel process) could see a half-written
    XML document. os.replace is atomic on POSIX and Windows when source and
    target are on the same filesystem (always true here -- repo root).
    """
    tmp_path = path + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as fh:
        fh.write(content)
    os.replace(tmp_path, path)


def write_urlset(path, url_list):
    """Write a sitemap urlset file (atomic)."""
    out_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for rel, priority, changefreq, lastmod in url_list:
        loc = BASE + rel
        out_lines += [
            "  <url>",
            f"    <loc>{loc}</loc>",
            f"    <lastmod>{lastmod}</lastmod>",
            f"    <changefreq>{changefreq}</changefreq>",
            f"    <priority>{priority}</priority>",
            "  </url>",
        ]
    out_lines.append("</urlset>")
    atomic_write(path, "\n".join(out_lines) + "\n")


def latest_lastmod(url_list, fallback=TODAY):
    """Return the maximum <lastmod> across a url_list, or fallback if empty.

    The sitemap index's <lastmod> should reflect when the child sitemap's
    contents actually changed, NOT today's date. Always-TODAY signals false
    freshness and (per Google's docs) can trigger unnecessary re-crawls of
    unchanged URLs.
    """
    if not url_list:
        return fallback
    return max(u[3] for u in url_list)  # u[3] is lastmod (YYYY-MM-DD string)


# Full sitemap — every URL.
# Children MUST be written before the index so the index never references a
# file that doesn't exist on disk (mitigates the crash-safety race where the
# process dies between writing children and index, leaving stale references).
write_urlset(os.path.join(ROOT, "sitemap.xml"), urls)
print(f"sitemap.xml written -- {len(urls)} URLs")

# Priority sitemap — top-value URLs only (priority >= 0.85).
#
# Why a separate file:
#   Google allocates crawl budget partly at the sitemap level. A young domain
#   (10mo old, 13/178 pages indexed as of 2026-05-12) gets a slow drip across
#   a 500-URL sitemap. A focused sitemap of the 30-50 highest-priority URLs
#   submitted separately gives those pages a fresh-budget signal.
#
# Submit this file separately in Google Search Console alongside sitemap.xml.
# The site index (sitemap-index.xml) references both so Google sees the
# relationship.
priority_urls = [u for u in urls if float(u[1]) >= 0.85]
write_urlset(os.path.join(ROOT, "sitemap-priority.xml"), priority_urls)
print(f"sitemap-priority.xml written -- {len(priority_urls)} URLs (priority >= 0.85)")

# Sitemap index — master that references both child sitemaps.
# Submitting sitemap-index.xml is equivalent to submitting both children;
# Google's crawler picks up both. This is the canonical pattern for sites
# that want to publish multiple sitemaps.
#
# <lastmod> for each child is derived from the latest URL <lastmod> inside
# that child (not stamped with TODAY). This way the index only signals
# freshness when something actually changed, avoiding the "freshness-spam"
# pattern flagged elsewhere in this file.
index_lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    "  <sitemap>",
    f"    <loc>{BASE}/sitemap-priority.xml</loc>",
    f"    <lastmod>{latest_lastmod(priority_urls)}</lastmod>",
    "  </sitemap>",
    "  <sitemap>",
    f"    <loc>{BASE}/sitemap.xml</loc>",
    f"    <lastmod>{latest_lastmod(urls)}</lastmod>",
    "  </sitemap>",
    "</sitemapindex>",
]
# Atomic write so the FTP-deployed index is never half-written; and so a
# reader that hits this file mid-rebuild gets either the previous version
# or the new version, never a truncated one.
atomic_write(os.path.join(ROOT, "sitemap-index.xml"), "\n".join(index_lines) + "\n")
print("sitemap-index.xml written -- master index referencing both sitemaps")
