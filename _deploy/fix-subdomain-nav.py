"""One-shot sweep: replace subdomain nav links with root paths.

Rationale (SEO audit 2026-05-13): industry pages have <link rel=canonical> pointing
to the root path, but internal nav and cross-link lists use https://<sub>.netwebmedia.com
URLs. This sends conflicting signals to Google ("subdomain is canonical" vs HTML's
"root is canonical"), bleeding link equity. Fix: make all internal links use root paths.

Subdomains themselves still resolve (wildcard CNAME) — this is purely a link-equity
consolidation, not a URL retirement. External backlinks to subdomain URLs still work
because Apache serves the same /industries/<niche>/ file.

Idempotent — safe to rerun.
"""
import os
import re
import sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))

SUBDOMAIN_MAP = {
    "hospitality":  "/industries/hospitality/",
    "restaurants":  "/industries/restaurants/",
    "healthcare":   "/industries/healthcare/",
    "beauty":       "/industries/beauty/",
    "smb":          "/industries/smb/",
    "legal":        "/industries/legal-services/",
    "realestate":   "/industries/real-estate/",
    "local":        "/industries/local-services/",
    "auto":         "/industries/automotive/",
    "education":    "/industries/education/",
    "events":       "/industries/events-weddings/",
    "finance":      "/industries/finance/",
    "home":         "/industries/home-services/",
    "wine":         "/industries/wine-agriculture/",
}

# Files to skip — Chilean prospect dumps are noindex'd, never indexed publicly.
SKIP_PATTERNS = (
    re.compile(r"-prospects-report\.html$"),
    re.compile(r"-digital-gaps\.html$"),
)

SKIP_DIRS = {
    ".venv", "node_modules", ".git", "_backup", "_cron", "site-upload",
    "Netwebmedia-antigravity-copy-work", "crm-vanilla", "backend", "api",
    "api-php", "video-factory", "n8n-templates", "mobile", "hyperframes",
    "_archive", "_lessons", "_ci", "_dev",
}


def build_pattern():
    """Compile a single regex matching any of the 14 subdomain URLs."""
    keys = "|".join(re.escape(k) for k in SUBDOMAIN_MAP.keys())
    # Match https://<sub>.netwebmedia.com optionally followed by /path
    return re.compile(rf"https://({keys})\.netwebmedia\.com(/[^\s\"'<>]*)?")


def replace_func(m):
    sub = m.group(1)
    rest = m.group(2) or ""
    base = SUBDOMAIN_MAP[sub]
    # If subdomain URL had an additional path beyond /, keep it joined
    if rest and rest != "/":
        # base already ends in "/"; trim leading "/" from rest to avoid double slash
        return "https://netwebmedia.com" + base + rest.lstrip("/")
    return "https://netwebmedia.com" + base


def main():
    pat = build_pattern()
    edited = 0
    scanned = 0
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith(".")]
        for fname in filenames:
            if not (fname.endswith(".html") or fname.endswith(".py")):
                continue
            if any(p.search(fname) for p in SKIP_PATTERNS):
                continue
            full = os.path.join(dirpath, fname)
            try:
                with open(full, "r", encoding="utf-8") as fh:
                    content = fh.read()
            except (UnicodeDecodeError, OSError):
                continue
            scanned += 1
            new_content = pat.sub(replace_func, content)
            if new_content != content:
                with open(full, "w", encoding="utf-8") as fh:
                    fh.write(new_content)
                edited += 1
                rel = full[len(ROOT)+1:]
                print(f"  edited: {rel}")
    print(f"\nScanned {scanned} files, edited {edited}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
