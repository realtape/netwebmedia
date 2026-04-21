#!/usr/bin/env python3
"""audit-links.py — find broken internal links across all HTML pages.

Accounts for:
  /app/<route>      maps to  crm/out/<route>/index.html  (Next.js static export)
  /crm/<page>.html  maps to  crm-vanilla/<page>.html     (legacy vanilla CRM)
  /<page>.html      maps to  <page>.html                 (root marketing pages)
  /industries/<ind>/ maps to industries/<ind>/index.html
"""
import re
import os
from pathlib import Path

LINK_RE = re.compile(r'href="([^"#?]+)(?:[?#][^"]*)?"')

def resolve(href):
    """Check if an internal href maps to an existing local file."""
    if href.startswith(('http://', 'https://', 'mailto:', 'tel:', '#', 'javascript:', 'data:')):
        return True  # skip externals
    path = href.lstrip('/').split('?')[0].split('#')[0]
    if not path:
        return True  # root / same page
    # Map /app/* to crm/out/*
    if path.startswith('app/'):
        rel = path[len('app/'):]
        candidates = [
            f'crm/out/{rel}',
            f'crm/out/{rel}/index.html',
            f'crm/out/{rel}.html',
            f'crm/out/{rel.rstrip("/")}/index.html',
        ]
    # Map /crm/* to crm-vanilla/* (except some that might be handled by app)
    elif path.startswith('crm/'):
        rel = path[len('crm/'):]
        candidates = [
            f'crm-vanilla/{rel}',
            f'crm-vanilla/{rel}.html',
            f'crm-vanilla/{rel}/index.html' if rel else 'crm-vanilla/index.html',
            f'crm-vanilla/{rel.rstrip("/")}/index.html' if rel else 'crm-vanilla/index.html',
        ]
    else:
        candidates = [
            path,
            path + 'index.html' if path.endswith('/') else path + '/index.html',
            path + '.html',
        ]
    return any(Path(c).exists() for c in candidates)

broken = {}
for fp in sorted(Path('.').glob('*.html')):
    try:
        txt = fp.read_text(encoding='utf-8', errors='ignore')
    except:
        continue
    for href in set(LINK_RE.findall(txt)):
        if not resolve(href):
            # Filter obvious JS template strings (single quote + plus)
            if "' + " in href or " + '" in href or href.startswith("'"):
                continue
            broken.setdefault(fp.name, set()).add(href)

if not broken:
    print('[OK] No broken internal links across any HTML page.')
else:
    total = sum(len(v) for v in broken.values())
    print(f'[FOUND] {total} broken links across {len(broken)} files:\n')
    for f, links in sorted(broken.items()):
        print(f'{f}:')
        for l in sorted(links):
            print(f'  ! {l}')
        print()
