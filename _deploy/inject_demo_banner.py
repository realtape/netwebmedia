#!/usr/bin/env python3
"""Inject <script src="js/demo-banner.js"> into every crm-demo/ and cms-demo/ HTML file.
Idempotent — skips files that already have the banner tag."""
import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TAG = '<script src="js/demo-banner.js"></script>'

def inject(folder):
    count = 0
    for name in os.listdir(folder):
        if not name.endswith('.html'): continue
        path = os.path.join(folder, name)
        with open(path, 'r', encoding='utf-8') as f:
            html = f.read()
        if 'demo-banner.js' in html:
            continue
        # Insert right before </head> (preferred) or at top of body as fallback.
        if '</head>' in html:
            html = html.replace('</head>', f'  {TAG}\n</head>', 1)
        elif '<body' in html:
            html = re.sub(r'(<body[^>]*>)', r'\1\n' + TAG, html, count=1)
        else:
            continue
        with open(path, 'w', encoding='utf-8') as f:
            f.write(html)
        count += 1
        print(f'  injected: {name}')
    return count

for sub in ('crm-demo', 'cms-demo'):
    folder = os.path.join(ROOT, sub)
    print(f'== {sub} ==')
    n = inject(folder)
    print(f'  total injected: {n}')
print('done')
