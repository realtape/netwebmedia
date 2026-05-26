"""Build a zip of pages that need to be uploaded to the live cPanel server
to finish installing GA4. Preserves directory structure for extraction
at public_html root.
"""
import zipfile, os, glob

ROOT = r'C:\Users\Usuario\Desktop\NetWebMedia'
OUT = os.path.join(ROOT, '_deploy', 'ga4_deploy.zip')

files = [
    'cart.html', 'dashboard.html', 'desktop-login.html', 'diagnostic.html',
    'login.html', 'register.html', 'results.html', 'thanks.html',
    'pricing-onepager.html', 'audit-report.html',
]
for p in sorted(glob.glob(os.path.join(ROOT, 'blog', '*.html'))):
    files.append(os.path.relpath(p, ROOT).replace('\\', '/'))
for p in sorted(glob.glob(os.path.join(ROOT, 'crm-vanilla', '*.html'))):
    files.append(os.path.relpath(p, ROOT).replace('\\', '/'))

included = []
skipped = []
with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z:
    for rel in files:
        full = os.path.join(ROOT, rel.replace('/', os.sep))
        if not os.path.exists(full):
            skipped.append((rel, 'missing')); continue
        with open(full, 'r', encoding='utf-8') as f:
            if 'G-V71R6PD7C0' not in f.read():
                skipped.append((rel, 'no GA')); continue
        z.write(full, arcname=rel)
        included.append(rel)

size = os.path.getsize(OUT)
print(f'Zip: {OUT}')
print(f'Size: {size/1024:.1f} KB')
print(f'Included: {len(included)} files')
for r in included[:5]:
    print(f'  + {r}')
if len(included) > 5:
    print(f'  ... and {len(included)-5} more')
if skipped:
    print(f'\nSkipped: {len(skipped)}')
    for r, why in skipped:
        print(f'  - {r}: {why}')
