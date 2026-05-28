#!/usr/bin/env python3
"""
index_social_assets.py — NetWebMedia social asset indexer.

Walks every known location that holds social media assets (slides, photos,
videos, captions, content plans) and writes a single auto-generated markdown
register to the Obsidian vault under `Brand/Social Asset Register.md`.

Locations are spread across three mounted roots:
  - REPO_ROOT   = C:\\Users\\Usuario\\Desktop\\NetWebMedia
  - VAULT_ROOT  = D:\\Usuario\\Documents\\Obsidian Vault
  - NWM_ROOT    = D:\\Usuario\\Downloads\\NWM\\NWM

Override any root via CLI flag if running from a different mount (e.g. the
session sandbox uses /sessions/<id>/mnt/...).

Design rules
------------
- Idempotent: re-running overwrites the register, never appends.
- No deletes, no file moves — read-only scan.
- Output is markdown only — no JSON, no DB. Source of truth is the filesystem.
- Counts are by file extension family (image / vector / video / audio / doc).
- Each location section lists subfolders + top 5 most-recent files.
- Per-location include filters keep noisy folders (like _deploy/) on-topic.

Usage
-----
    python scripts/index_social_assets.py
    python scripts/index_social_assets.py --repo-root /path --vault-root /path --nwm-root /path
    python scripts/index_social_assets.py --dry-run     # print to stdout, do not write
"""

from __future__ import annotations

import argparse
import datetime as dt
import os
from pathlib import Path
from typing import Iterable, Optional

# ---------------------------------------------------------------------------
# Defaults — Carlos's Windows machine
# ---------------------------------------------------------------------------
DEFAULT_REPO_ROOT = r"C:\Users\Usuario\Desktop\NetWebMedia"
DEFAULT_VAULT_ROOT = r"D:\Usuario\Documents\Obsidian Vault"
DEFAULT_NWM_ROOT = r"D:\Usuario\Downloads\NWM\NWM"

REGISTER_RELATIVE = Path("Brand") / "Social Asset Register.md"

# ---------------------------------------------------------------------------
# Location catalog — edit this list when new asset folders appear.
# Each entry: (root_key, relative_path, label, category, filter_dict)
# filter_dict optional keys:
#   - name_contains: list[str] (case-insensitive substring match on filename)
#   - extensions:    list[str] (".md", ".png", etc.)
# Empty dict = include everything.
# ---------------------------------------------------------------------------
LOCATIONS = [
    ("repo", "assets/social",                            "Brand marks & profile assets",     "Brand",     {}),
    ("repo", "assets/social/carousels",                  "IG brand-intro carousels (a/b/c)", "Carousels", {}),
    ("repo", "assets/social/campaign/carousels",         "Campaign carousels (AEO/CMO)",     "Carousels", {}),
    ("repo", "assets/social/campaign/v2/character-refs", "UGC character references",         "Reference", {}),
    ("repo", "assets/social/higgsfield",                 "Higgsfield AI generations",        "Generated", {}),
    ("repo", "video-factory/out",                        "Final rendered MP4s (Remotion)",   "Video",     {}),
    ("repo", "social",                                   "Social hub markdown plans",        "Plans",     {}),
    ("repo", "content",                                  "Content scripts (markdown)",       "Plans",     {}),
    ("repo", "email-templates",                          "Email drip templates",             "Email",     {}),
    ("repo", "_deploy",                                  "Strategy / playbook docs",         "Plans", {
        "extensions": [".md"],
        "name_contains": ["social", "campaign", "reel", "case-study",
                          "content-pipeline", "phone-rollout",
                          "publishing-unblock", "mvp-expansion"],
    }),
    ("vault", "Campaigns",                               "Active campaign assets (vault)",   "Campaign",  {}),
    ("vault", "Brand",                                   "Brand notes",                      "Brand",     {}),
    ("nwm",   "youtube-assets",                          "YouTube channel branding",         "Brand",     {}),
    ("nwm",   "heygen-lipsync",                          "HeyGen lip-sync project files",    "Video",     {}),
]

ASSET_EXTS = {
    "image":  {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".tif", ".tiff"},
    "vector": {".svg", ".ai", ".eps", ".pdf"},
    "video":  {".mp4", ".mov", ".webm", ".mkv"},
    "audio":  {".mp3", ".wav", ".m4a", ".aac"},
    "doc":    {".md", ".html", ".txt", ".json"},
}

SKIP_DIRS = {"node_modules", ".git", ".venv", "__pycache__", "_backup", "dist"}


def _classify(ext: str) -> str:
    e = ext.lower()
    for cat, exts in ASSET_EXTS.items():
        if e in exts:
            return cat
    return "other"


def _iter_files(root: Path) -> Iterable[Path]:
    if not root.exists() or not root.is_dir():
        return
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            yield Path(dirpath) / fn


def _human_size(n: int) -> str:
    x = float(n)
    for unit in ("B", "KB", "MB", "GB"):
        if x < 1024:
            return f"{x:.0f} {unit}" if unit == "B" else f"{x:.1f} {unit}"
        x /= 1024
    return f"{x:.1f} TB"


def _passes_filter(fpath: Path, flt: dict) -> bool:
    if not flt:
        return True
    exts = flt.get("extensions")
    if exts and fpath.suffix.lower() not in {e.lower() for e in exts}:
        return False
    names = flt.get("name_contains")
    if names:
        low = fpath.name.lower()
        if not any(s.lower() in low for s in names):
            return False
    return True


def _scan_location(root: Path, rel: str, flt: Optional[dict] = None) -> dict:
    full = root / rel
    out = {
        "path": str(full),
        "exists": full.exists(),
        "total_files": 0,
        "total_bytes": 0,
        "by_category": {},
        "subfolders": [],
        "recent": [],
    }
    if not out["exists"]:
        return out

    cat_counts: dict = {}
    files: list = []
    subfolders: set = set()

    for fpath in _iter_files(full):
        if not _passes_filter(fpath, flt or {}):
            continue
        try:
            st = fpath.stat()
        except OSError:
            continue
        cat = _classify(fpath.suffix)
        cat_counts[cat] = cat_counts.get(cat, 0) + 1
        out["total_files"] += 1
        out["total_bytes"] += st.st_size
        files.append((st.st_mtime, fpath, st.st_size))
        try:
            rel_parent = fpath.parent.relative_to(full)
            if rel_parent.parts:
                subfolders.add(rel_parent.parts[0])
        except ValueError:
            pass

    out["by_category"] = cat_counts
    out["subfolders"] = sorted(subfolders)
    files.sort(reverse=True)
    out["recent"] = [
        {
            "name": p.name,
            "rel": str(p.relative_to(full)) if full in p.parents or p == full else p.name,
            "size": sz,
            "mtime": dt.datetime.fromtimestamp(mt).strftime("%Y-%m-%d %H:%M"),
        }
        for mt, p, sz in files[:5]
    ]
    return out


def render_register(roots: dict, scans: list) -> str:
    now = dt.datetime.now().strftime("%Y-%m-%d %H:%M")
    total_files = sum(s["total_files"] for _, s in scans)
    total_bytes = sum(s["total_bytes"] for _, s in scans)

    L = []
    L.append("---")
    L.append("tags: [brand, social, asset-library, auto-generated]")
    L.append(f"updated: {now}")
    L.append("source: scripts/index_social_assets.py")
    L.append("---")
    L.append("")
    L.append("# Social Asset Register (auto-generated)")
    L.append("")
    L.append("> Do not hand-edit. Re-run `python scripts/index_social_assets.py` to refresh. "
             "Curated context lives in [[Social Media Asset Library]].")
    L.append("")
    L.append("## Summary / Resumen")
    L.append("")
    L.append(f"- **Locations scanned:** {len(scans)}")
    L.append(f"- **Total files:** {total_files:,}")
    L.append(f"- **Total size:** {_human_size(total_bytes)}")
    L.append(f"- **Generated:** {now}")
    L.append("")
    L.append("**Roots:**")
    for k, v in roots.items():
        L.append(f"- `{k}` -> `{v}`")
    L.append("")

    L.append("## Inventory by location")
    L.append("")
    L.append("| # | Location | Label | Category | Files | Size |")
    L.append("|---|---|---|---|---:|---:|")
    for i, (entry, scan) in enumerate(scans, start=1):
        root_key, rel, label, category, _flt = entry
        if not scan["exists"]:
            L.append(f"| {i} | `{root_key}:{rel}` | {label} | {category} | _missing_ | - |")
            continue
        L.append(f"| {i} | `{root_key}:{rel}` | {label} | {category} | "
                 f"{scan['total_files']:,} | {_human_size(scan['total_bytes'])} |")
    L.append("")

    L.append("## Per-location detail")
    L.append("")
    for i, (entry, scan) in enumerate(scans, start=1):
        root_key, rel, label, category, _flt = entry
        L.append(f"### {i}. {label}")
        L.append("")
        L.append(f"- **Root:** `{root_key}`")
        L.append(f"- **Path:** `{scan['path']}`")
        L.append(f"- **Category:** {category}")
        if not scan["exists"]:
            L.append("- **Status:** path not found on this machine")
            L.append("")
            continue
        L.append(f"- **Files:** {scan['total_files']:,}  -  **Size:** {_human_size(scan['total_bytes'])}")
        if scan["by_category"]:
            bc = ", ".join(f"{k}: {v}" for k, v in sorted(scan["by_category"].items(), key=lambda x: -x[1]))
            L.append(f"- **By type:** {bc}")
        if scan["subfolders"]:
            sub = ", ".join(f"`{s}`" for s in scan["subfolders"][:20])
            more = "" if len(scan["subfolders"]) <= 20 else f" (+{len(scan['subfolders']) - 20} more)"
            L.append(f"- **Subfolders:** {sub}{more}")
        if scan["recent"]:
            L.append("- **Most recent 5:**")
            for r in scan["recent"]:
                L.append(f"  - `{r['rel']}` - {_human_size(r['size'])} - {r['mtime']}")
        L.append("")

    L.append("---")
    L.append("")
    L.append("_Re-run whenever you add a campaign, render a batch, or before a quarterly review._")
    L.append("")
    return "\n".join(L)


def main() -> int:
    p = argparse.ArgumentParser(description="Index NetWebMedia social assets.")
    p.add_argument("--repo-root",  default=DEFAULT_REPO_ROOT)
    p.add_argument("--vault-root", default=DEFAULT_VAULT_ROOT)
    p.add_argument("--nwm-root",   default=DEFAULT_NWM_ROOT)
    p.add_argument("--out",        default=None)
    p.add_argument("--dry-run",    action="store_true")
    args = p.parse_args()

    roots = {
        "repo":  Path(args.repo_root).resolve(),
        "vault": Path(args.vault_root).resolve(),
        "nwm":   Path(args.nwm_root).resolve(),
    }

    scans = []
    for entry in LOCATIONS:
        root_key, rel, label, category, flt = entry
        root = roots[root_key]
        scans.append((entry, _scan_location(root, rel, flt)))

    md = render_register(roots, scans)

    if args.dry_run:
        print(md)
        return 0

    out_path = Path(args.out) if args.out else roots["vault"] / REGISTER_RELATIVE
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(md, encoding="utf-8")
    total = sum(s["total_files"] for _, s in scans)
    print(f"Wrote {out_path} - {total:,} files indexed across {len(scans)} locations.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
