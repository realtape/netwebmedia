#!/usr/bin/env python3
"""Build InMotion deploy zip with tutorials + demo sites.
Output: _deploy/netwebmedia-tutorials-deploy.zip
Contents are rooted at public_html/ — the extractor unzips straight into public_html.
"""
import os, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, '_deploy', 'netwebmedia-tutorials-deploy.zip')

INCLUDE = ['tutorials.html', 'tutorials', 'crm-demo', 'cms-demo']
SKIP_EXTS = {'.pyc', '.pyo'}
SKIP_NAMES = {'__pycache__', '.DS_Store', 'config.local.php', 'Thumbs.db'}

def should_skip(name):
    if name in SKIP_NAMES: return True
    _, ext = os.path.splitext(name)
    return ext in SKIP_EXTS

def add_path(zf, rel):
    full = os.path.join(ROOT, rel)
    if os.path.isfile(full):
        zf.write(full, rel.replace('\\', '/'))
        return 1
    count = 0
    for root, dirs, files in os.walk(full):
        dirs[:] = [d for d in dirs if not should_skip(d)]
        for name in files:
            if should_skip(name): continue
            p = os.path.join(root, name)
            arc = os.path.relpath(p, ROOT).replace('\\', '/')
            zf.write(p, arc)
            count += 1
    return count

if os.path.exists(OUT): os.remove(OUT)
total = 0
with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
    for item in INCLUDE:
        n = add_path(zf, item)
        print(f'  {item}: {n} files')
        total += n
    prov = '_deploy/_provision_demo_dbs.php'
    zf.write(os.path.join(ROOT, prov), prov)
    total += 1
    print(f'  {prov}: 1 file')

size_kb = os.path.getsize(OUT) / 1024
print(f'\ndone - {total} files, {size_kb:.1f} KB -> {OUT}')
