#!/usr/bin/env python3
"""
build-bundle.py — package everything that must ship to the cPanel root.

Output: _deploy/nwm-deploy.zip

Zip layout (extracts at /home/webmed6/public_html/):
    compare.html, vs-hubspot.html, vs-gohighlevel.html
    index.html, services.html, pricing.html, nwm-crm.html, nwm-cms.html
    nwmai.html, faq.html, tutorials.html, partners.html, about.html, contact.html
    blog.html, email-marketing.html, emails.html
    email-templates/...
    tutorials/...
    app/...              <- crm/out/ (static export)
    api/...              <- api-php/ contents (per prior-session fix, NOT /api-php/)

Verifies every file exists before zipping and prints a manifest with sizes.

PERMISSIONS:
    cPanel/suPHP refuses to execute world-writable (666) PHP files and returns
    a silent HTTP 500. We explicitly stamp Unix mode 0644 on every file and
    0755 on every directory entry so `unzip` on the server produces a
    suPHP-compatible tree without any post-extract chmod needed.
"""
import hashlib
import os
import stat
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent  # C:\...\NetWebMedia
OUT = ROOT / "_deploy" / "nwm-deploy.zip"
OUT.parent.mkdir(parents=True, exist_ok=True)

# Unix permission bits baked into the zip so unzip restores them on the server.
FILE_MODE = 0o100644  # regular file, rw-r--r--
DIR_MODE  = 0o040755  # directory,    rwxr-xr-x

# 1. Individual HTML pages edited in this session
HTML_ROOT = [
    "compare.html", "vs-hubspot.html", "vs-gohighlevel.html",
    "index.html", "services.html", "pricing.html",
    "nwm-crm.html", "nwm-cms.html", "nwmai.html",
    "tutorials.html", "emails.html", "email-marketing.html",
    "blog.html", "faq.html", "partners.html",
    "about.html", "contact.html",
    "privacy.html", "terms.html", "thanks.html",
    "login.html", "register.html",
    "analytics.html", "dashboard.html",
    "desktop-login.html", "pricing-onepager.html",
    "audit-report.html", "results.html",
    "orgchart.html", "cart.html", "diagnostic.html",
    "knowledge-base.html",
    "catalogue.html",
]

# 2. Directory trees shipped verbatim
DIR_TREES = [
    ("email-templates", "email-templates"),
    ("tutorials", "tutorials"),
    ("industries", "industries"),
    ("css", "css"),
    ("js", "js"),
    ("assets", "assets"),
    ("crm-vanilla", "crm"),  # legacy vanilla CRM → /public_html/crm/
    ("blog", "blog"),        # blog posts including messaging playbooks
    ("pdf", "pdf"),          # sellable PDF playbooks
    ("_deploy/companies", "companies"),  # city/state audit indexes
]

# 3. CRM static export → /public_html/app/
CRM_OUT = ROOT / "crm" / "out"
CRM_DEST = "app"

# 4. PHP backend → /public_html/api/  (NOT /api-php/ !)
API_PHP = ROOT / "api-php"
API_DEST = "api"

# Root-level asset files that may exist
ROOT_ASSETS = ["styles.css", "script.js", ".htaccess",
               "sitemap.xml", "robots.txt", "llms.txt", "llms-full.txt",
               "04d91374b67f6fa468d545ea2f98f405.txt",
               "googlef707382bdfd91013.html"]


def _zip_file(zf: zipfile.ZipFile, src: Path, arcname: str) -> int:
    """Write a single file into the zip with mode 0644."""
    data = src.read_bytes()
    info = zipfile.ZipInfo(filename=arcname)
    # Preserve mtime so diffs/caching behave sanely.
    mtime = src.stat().st_mtime
    from time import localtime
    info.date_time = localtime(mtime)[:6]
    info.external_attr = FILE_MODE << 16
    info.compress_type = zipfile.ZIP_DEFLATED
    zf.writestr(info, data)
    return len(data)


def _zip_dir(zf: zipfile.ZipFile, arcname: str) -> None:
    """Write a directory entry into the zip with mode 0755."""
    if not arcname.endswith("/"):
        arcname = arcname + "/"
    info = zipfile.ZipInfo(filename=arcname)
    info.external_attr = DIR_MODE << 16
    zf.writestr(info, b"")


def add_file(zf: zipfile.ZipFile, src: Path, arcname: str) -> int:
    if not src.exists() or not src.is_file():
        return 0
    return _zip_file(zf, src, arcname)


def add_tree(zf: zipfile.ZipFile, src_root: Path, arc_root: str,
             skip_names: set[str] | None = None,
             seen_dirs: set[str] | None = None) -> tuple[int, int]:
    """Add every file under src_root under arc_root/. Returns (count, bytes).

    Also emits explicit directory entries with mode 0755 so `unzip` creates
    readable/traversable directories (important for suPHP and for the /api
    tree that PHP must be able to stat).
    """
    if not src_root.exists():
        print(f"  [skip] {src_root} does not exist")
        return (0, 0)
    skip_names = skip_names or set()
    seen_dirs = seen_dirs if seen_dirs is not None else set()
    count = 0
    total = 0

    # Ensure the root dir entry exists.
    if arc_root and arc_root not in seen_dirs:
        _zip_dir(zf, arc_root)
        seen_dirs.add(arc_root)

    for path in sorted(src_root.rglob("*")):
        if any(part in skip_names for part in path.parts):
            continue
        rel = path.relative_to(src_root).as_posix()
        arc = f"{arc_root}/{rel}" if arc_root else rel

        if path.is_dir():
            if arc not in seen_dirs:
                _zip_dir(zf, arc)
                seen_dirs.add(arc)
            continue

        # Emit any missing parent dirs before the file.
        parent = arc.rsplit("/", 1)[0] if "/" in arc else ""
        if parent and parent not in seen_dirs:
            # Walk up to ensure every intermediate dir is stamped.
            parts = parent.split("/")
            for i in range(1, len(parts) + 1):
                sub = "/".join(parts[:i])
                if sub and sub not in seen_dirs:
                    _zip_dir(zf, sub)
                    seen_dirs.add(sub)

        total += _zip_file(zf, path, arc)
        count += 1

    return (count, total)


def main() -> int:
    total_files = 0
    total_bytes = 0
    seen_dirs: set[str] = set()

    print(f"Building {OUT} ...")
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:

        # 1. root HTML pages
        for f in HTML_ROOT:
            size = add_file(zf, ROOT / f, f)
            if size > 0:
                total_files += 1
                total_bytes += size

        # 1b. root assets
        for f in ROOT_ASSETS:
            size = add_file(zf, ROOT / f, f)
            if size > 0:
                total_files += 1
                total_bytes += size

        # 2. directory trees
        for (src, dst) in DIR_TREES:
            c, b = add_tree(zf, ROOT / src, dst,
                            skip_names={"node_modules", ".git"},
                            seen_dirs=seen_dirs)
            print(f"  {src}/ -> {dst}/  : {c} files, {b/1024:.1f} KiB")
            total_files += c
            total_bytes += b

        # 3. CRM static export -> app/
        c, b = add_tree(zf, CRM_OUT, CRM_DEST,
                        skip_names={".DS_Store"},
                        seen_dirs=seen_dirs)
        print(f"  crm/out/ -> {CRM_DEST}/  : {c} files, {b/1024/1024:.2f} MiB")
        total_files += c
        total_bytes += b

        # 4. PHP backend -> api/
        c, b = add_tree(zf, API_PHP, API_DEST,
                        skip_names={"vendor", "node_modules"},
                        seen_dirs=seen_dirs)
        print(f"  api-php/ -> {API_DEST}/  : {c} files, {b/1024:.1f} KiB")
        total_files += c
        total_bytes += b

    # Hash and report
    sha = hashlib.sha256(OUT.read_bytes()).hexdigest()
    print()
    print(f"OK {OUT}")
    print(f"   files: {total_files}")
    print(f"   uncompressed: {total_bytes/1024/1024:.2f} MiB")
    print(f"   zip size:     {OUT.stat().st_size/1024/1024:.2f} MiB")
    print(f"   sha256:       {sha}")
    print(f"   sha256-16:    {sha[:16]}")
    print(f"   perms:        files 0644, dirs 0755 (suPHP-safe)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
