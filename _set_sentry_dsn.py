#!/usr/bin/env python3
"""
One-shot: replace the empty Sentry DSN on all pages that have the loader.
Each page must initialize NWM_SENTRY_DSN BEFORE nwm-sentry.js runs.
"""
import os, re

ROOT = os.path.dirname(__file__)
DSN = "https://69fce09a20f1958bd2f1b9e601ba9a46@o4511302572441600.ingest.us.sentry.io/4511302588235776"

# Match the empty-DSN line we shipped previously.
# Two variants exist: index.html (now already updated) and the propagated form
# with the `|| ''` defensive fallback.
PATTERNS = [
    (re.compile(r"window\.NWM_SENTRY_DSN\s*=\s*''\s*;"), f"window.NWM_SENTRY_DSN = '{DSN}';"),
    (re.compile(r"window\.NWM_SENTRY_DSN\s*=\s*window\.NWM_SENTRY_DSN\s*\|\|\s*''\s*;"),
     f"window.NWM_SENTRY_DSN = window.NWM_SENTRY_DSN || '{DSN}';"),
]

def process(path):
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        html = f.read()
    if 'NWM_SENTRY_DSN' not in html or DSN in html:
        return False
    new = html
    for pat, repl in PATTERNS:
        new = pat.sub(repl, new)
    if new == html:
        return None
    with open(path, "w", encoding="utf-8") as f:
        f.write(new)
    return True

def main():
    updated, already, manual = 0, 0, []
    for root, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        for fname in files:
            if not fname.endswith('.html'):
                continue
            path = os.path.join(root, fname)
            r = process(path)
            rel = os.path.relpath(path, ROOT)
            if r is True:
                print(f"  + {rel}")
                updated += 1
            elif r is False:
                already += 1
            else:
                manual.append(rel)
    print(f"\nUpdated: {updated}  Already had DSN: {already}  Manual review: {len(manual)}")
    for m in manual[:10]:
        print(f"  ? {m}")

if __name__ == "__main__":
    main()
