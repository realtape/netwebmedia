"""Dedup near-duplicate blog clusters by adding noindex,nofollow + canonical to losers.

Discovered via the 2026-05-13 indexing audit: Google flagged 339 of 434 known URLs
as "Discovered — currently not indexed." Major contributor: 48 blog clusters where
3-5 near-duplicate posts compete for the same query family (e.g. 5 versions of
mortgage-broker-seo-lead-generation, 4 of bridal-shop-digital-marketing).

Strategy (chosen 2026-05-14 by Carlos):
  - Per cluster, the post with the longest word count wins (proxy for depth).
  - Losers get <meta name="robots" content="noindex,nofollow"> AND
    <link rel="canonical" href="https://netwebmedia.com/blog/<winner>" />.
  - Sitemap generator (regen-sitemap.py) already excludes anything that has
    a noindex meta tag in its content (via blog noindex scan added separately).
  - Losers stay live so any backlinks keep working — this is the conservative
    reversible path. To revert, delete the noindex line and restore canonical.

Idempotent: rerunning is a no-op if losers are already marked.
"""
import os
import re
from pathlib import Path

BLOG = Path(__file__).resolve().parent.parent / "blog"
BASE = "https://netwebmedia.com"

# Cluster key = first 4 hyphen-tokens of filename (matches indexing-audit grouping)
def cluster_key(fname: str) -> str:
    base = fname.removesuffix(".html")
    return "-".join(base.split("-")[:4])


def word_count(path: Path) -> int:
    return len(path.read_text(encoding="utf-8", errors="ignore").split())


def is_already_noindex(html: str) -> bool:
    return bool(re.search(r'<meta\s+name="robots"\s+content="[^"]*noindex', html, re.I))


def has_canonical(html: str) -> re.Match | None:
    return re.search(r'<link\s+rel="canonical"\s+href="[^"]*"\s*/?>', html, re.I)


def patch_loser(path: Path, winner_url: str) -> str:
    """Returns: 'patched', 'already-noindex', or 'no-canonical-anchor'."""
    html = path.read_text(encoding="utf-8")
    if is_already_noindex(html):
        return "already-noindex"
    canonical_match = has_canonical(html)
    if not canonical_match:
        return "no-canonical-anchor"
    # Replace canonical to point to winner; insert noindex meta right after.
    new_canonical = f'<link rel="canonical" href="{winner_url}" />'
    noindex_meta = '<meta name="robots" content="noindex,nofollow" />'
    replacement = f"{new_canonical}\n  {noindex_meta}"
    html_new = html[:canonical_match.start()] + replacement + html[canonical_match.end():]
    path.write_text(html_new, encoding="utf-8")
    return "patched"


def main():
    files = sorted(p for p in BLOG.glob("*.html") if p.name != "index.html")
    clusters: dict[str, list[Path]] = {}
    for p in files:
        clusters.setdefault(cluster_key(p.name), []).append(p)

    losers_patched = 0
    losers_skipped = 0
    winners = []
    for key, posts in sorted(clusters.items()):
        if len(posts) < 2:
            continue
        # Winner = highest word count (deepest content)
        ranked = sorted(posts, key=word_count, reverse=True)
        winner = ranked[0]
        losers = ranked[1:]
        winner_url = f"{BASE}/blog/{winner.name}"
        winners.append((key, winner.name, len(losers)))
        for loser in losers:
            result = patch_loser(loser, winner_url)
            if result == "patched":
                losers_patched += 1
                print(f"  noindex'd: {loser.name} -> canonical {winner.name}")
            else:
                losers_skipped += 1
                print(f"  skipped ({result}): {loser.name}")

    print()
    print(f"Clusters processed: {len(winners)}")
    print(f"Winners (kept indexable): {len(winners)}")
    print(f"Losers patched: {losers_patched}")
    print(f"Losers skipped: {losers_skipped}")


if __name__ == "__main__":
    main()
