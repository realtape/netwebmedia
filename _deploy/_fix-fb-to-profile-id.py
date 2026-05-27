#!/usr/bin/env python3
"""Replace stale `facebook.com/net.webmedia/` links with the real Page's
canonical profile.php URL. The `net.webmedia` slug is an unrelated stale
profile, NOT Carlos's NetWebmedia Business Page (Page ID 100026159352754).
The Page itself is on the New Pages experience and has no vanity username
yet — username request pending via Meta support.

Run from repo root: python _deploy/_fix-fb-to-profile-id.py
"""
import os

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGETS = [
    ("https://www.facebook.com/net.webmedia/",
     "https://www.facebook.com/profile.php?id=100026159352754"),
    ("https://facebook.com/net.webmedia/",
     "https://www.facebook.com/profile.php?id=100026159352754"),
]

FILES = [
    "about.html", "aeo-agency.html", "aeo-index.html", "aeo-methodology.html",
    "analytics.html", "blog.html", "cart.html", "case-studies.html",
    "contact.html", "faq.html", "index.html", "pricing.html", "privacy.html",
    "results.html", "services.html", "social/index.html", "terms.html",
    "thanks.html",
]


def patch(path):
    full = os.path.join(REPO, path)
    if not os.path.isfile(full):
        return False, "missing"
    with open(full, "r", encoding="utf-8") as fh:
        content = fh.read()
    new_content = content
    n = 0
    for old, new in TARGETS:
        count = new_content.count(old)
        if count:
            new_content = new_content.replace(old, new)
            n += count
    if new_content == content:
        return False, "no match"
    with open(full, "w", encoding="utf-8") as fh:
        fh.write(new_content)
    return True, f"{n} replacement(s)"


def main():
    total_files = 0
    total_repl = 0
    for p in FILES:
        ok, msg = patch(p)
        marker = "OK " if ok else "-- "
        print(f"{marker} {p}: {msg}")
        if ok:
            total_files += 1
            total_repl += int(msg.split()[0])
    print(f"\nDone. {total_files}/{len(FILES)} files patched, {total_repl} total replacements.")


if __name__ == "__main__":
    main()
