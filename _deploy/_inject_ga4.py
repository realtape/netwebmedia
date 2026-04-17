"""Inject GA4 snippet (G-V71R6PD7C0) into every target HTML file
that does not already have a gtag/googletagmanager reference.

Scope: root HTML pages, blog/*.html, crm-vanilla/*.html.
Skips: _deploy/, site-upload/, Netwebmedia-antigravity-copy-work/.
"""
import os, glob

ROOT = r'C:\Users\Usuario\Desktop\NetWebMedia'
GA_ID = 'G-V71R6PD7C0'

SNIPPET = f'''  <!-- Google Analytics 4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id={GA_ID}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){{ dataLayer.push(arguments); }}
    gtag('js', new Date());
    gtag('config', '{GA_ID}', {{ anonymize_ip: true }});
  </script>
'''

ROOT_PAGES = [
    'cart.html', 'dashboard.html', 'desktop-login.html', 'diagnostic.html',
    'login.html', 'register.html', 'results.html', 'thanks.html',
    'pricing-onepager.html', 'audit-report.html',
]

targets = []
for p in ROOT_PAGES:
    targets.append(os.path.join(ROOT, p))
targets += sorted(glob.glob(os.path.join(ROOT, 'blog', '*.html')))
targets += sorted(glob.glob(os.path.join(ROOT, 'crm-vanilla', '*.html')))

patched, skipped = [], []
for path in targets:
    rel = os.path.relpath(path, ROOT)
    if not os.path.exists(path):
        skipped.append((rel, 'missing'))
        continue
    with open(path, 'r', encoding='utf-8') as f:
        src = f.read()
    if 'googletagmanager.com/gtag' in src or "gtag('config'" in src:
        skipped.append((rel, 'already has GA'))
        continue
    if '</head>' not in src:
        skipped.append((rel, 'no </head>'))
        continue
    new_src = src.replace('</head>', SNIPPET + '</head>', 1)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_src)
    patched.append(rel)

print(f'Patched: {len(patched)}')
for p in patched:
    print(f'  + {p}')
print(f'\nSkipped: {len(skipped)}')
for p, r in skipped:
    print(f'  - {p}: {r}')
