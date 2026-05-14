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

Idempotent: rerunning normalizes to the canonical state — exactly one
<meta name="robots" content="noindex,nofollow"> + canonical pointing at
the winner. Safe to re-run after the original 2026-05-14 pass, which left
a conflicting <meta name="robots" content="index, follow"> tag in place.
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


# Match any <meta name="robots" content="..." /> tag (with or without trailing
# slash, any whitespace, any directive). Used to STRIP existing tags before we
# write the canonical noindex,nofollow — prevents the conflicting-tag situation
# where a loser has both `index, follow` and `noindex,nofollow` (Google honors
# the most-restrictive directive, so it works, but it's a code smell + signals
# inconsistency to crawlers).
_ROBOTS_META_RE = re.compile(
    r'\s*<meta\s+name="robots"\s+content="[^"]*"\s*/?>\s*\n?',
    re.I,
)


def has_canonical(html: str) -> re.Match | None:
    return re.search(r'<link\s+rel="canonical"\s+href="[^"]*"\s*/?>', html, re.I)


def patch_loser(path: Path, winner_url: str) -> str:
    """Returns: 'patched', 'already-correct', or 'no-canonical-anchor'.

    Normalizes the page to exactly one robots meta (noindex,nofollow) plus a
    canonical pointing at the winner. Strips any pre-existing robots tags so
    rerunning the script produces a stable, single-tag result.
    """
    html = path.read_text(encoding="utf-8")
    canonical_match = has_canonical(html)
    if not canonical_match:
        return "no-canonical-anchor"

    # Strip every existing robots meta tag so we don't end up with duplicates.
    cleaned = _ROBOTS_META_RE.sub("\n  ", html)

    # Re-locate the canonical in the cleaned HTML (the strip may have shifted
    # offsets if a robots tag sat above the canonical).
    canonical_match = has_canonical(cleaned)
    if not canonical_match:
        return "no-canonical-anchor"

    new_canonical = f'<link rel="canonical" href="{winner_url}" />'
    noindex_meta = '<meta name="robots" content="noindex,nofollow" />'
    replacement = f"{new_canonical}\n  {noindex_meta}"
    html_new = cleaned[:canonical_match.start()] + replacement + cleaned[canonical_match.end():]

    if html_new == html:
        return "already-correct"
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
                print(f"  patched: {loser.name} -> canonical {winner.name}")
            elif result == "already-correct":
                losers_skipped += 1
                # Silent skip — common path on re-runs, no need to spam stdout
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
