#!/usr/bin/env python3
"""One-time FB vanity-slug fix.
Replaces `facebook.com/netwebmedia` (which 301s) with `facebook.com/net.webmedia/`
(the actual current vanity per Carlos's FB page).

Run from repo root: python _deploy/_fix-fb-vanity.py
"""
import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = [
    "about.html", "aeo-index.html", "aeo-methodology.html", "analytics.html",
    "blog.html", "cart.html", "case-studies.html", "faq.html", "index.html",
    "pricing.html", "privacy.html", "results.html", "services.html",
    "social/index.html", "terms.html", "thanks.html",
]

OLD = "facebook.com/netwebmedia"
NEW = "facebook.com/net.webmedia/"

# Word-boundary check: only replace when followed by a quote, space, or angle
# bracket — never when followed by another letter (would catch "/netwebmediaX").
SAFE_NEXT_CHARS = ['"', "'", " ", "<", ")", "/", "\n", "\r"]

def patch(path):
    full = os.path.join(REPO, path)
    if not os.path.isfile(full):
        return False, "missing"
    with open(full, "r", encoding="utf-8") as fh:
        content = fh.read()
    if OLD not in content:
        return False, "no match"
    # Walk through every occurrence and only replace safe ones
    out = []
    i = 0
    n_replaced = 0
    while i < len(content):
        idx = content.find(OLD, i)
        if idx == -1:
            out.append(content[i:])
            break
        out.append(content[i:idx])
        end = idx + len(OLD)
        next_char = content[end] if end < len(content) else ""
        # Skip if followed by another path segment letter (avoid corrupting things like /netwebmedia2 if it ever existed)
        if next_char in SAFE_NEXT_CHARS or end == len(content):
            # Don't double-replace if already followed by /
            if next_char == "/":
                # Already correct shape — leave it alone (replace OLD literal but keep next /)
                out.append(NEW.rstrip("/"))
            else:
                out.append(NEW)
            n_replaced += 1
        else:
            out.append(OLD)
        i = end
    new_content = "".join(out)
    if new_content == content:
        return False, "no safe match"
    with open(full, "w", encoding="utf-8") as fh:
        fh.write(new_content)
    return True, f"{n_replaced} replacement(s)"


def main():
    total = 0
    for p in FILES:
        ok, msg = patch(p)
        marker = "OK " if ok else "-- "
        print(f"{marker} {p}: {msg}")
        if ok:
            total += 1
    print(f"\nDone. {total}/{len(FILES)} files patched.")


if __name__ == "__main__":
    main()
