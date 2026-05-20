"""Surgically stage ONLY the GA4 changes into git's index.
Leaves the working tree untouched. Skips untracked files.
"""
import subprocess, os, glob

ROOT = r'C:\Users\Usuario\Desktop\NetWebMedia'
GA_ID = 'G-V71R6PD7C0'
OLD_ID = 'G-NWMMEDIA01'

SNIPPET = '''  <!-- Google Analytics 4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-V71R6PD7C0"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', 'G-V71R6PD7C0', { anonymize_ip: true });
  </script>
'''

def run_out(cmd, stdin_bytes=None):
    return subprocess.run(cmd, cwd=ROOT, capture_output=True, input=stdin_bytes)

def head_content(path):
    r = run_out(['git', 'show', f'HEAD:{path}'])
    if r.returncode != 0:
        return None
    return r.stdout.decode('utf-8')

def stage_blob(rel_path, content):
    r = run_out(['git', 'hash-object', '-w', '--stdin'], stdin_bytes=content.encode('utf-8'))
    h = r.stdout.decode().strip()
    subprocess.run(['git', 'update-index', '--add', '--cacheinfo', f'100644,{h},{rel_path}'], cwd=ROOT, check=True)

# HEAD has NO GA anywhere yet. So all tracked files need full snippet injection
# before </head>. (The placeholder G-NWMMEDIA01 existed only in working-tree
# uncommitted state, not in HEAD.)
INJECT_FILES = [
    'index.html', 'services.html', 'about.html',
    'blog.html', 'contact.html', 'analytics.html',
    'cart.html', 'dashboard.html', 'desktop-login.html', 'diagnostic.html',
    'results.html', 'thanks.html',
]
# tracked blog posts (glob, then filter out untracked)
for p in sorted(glob.glob(os.path.join(ROOT, 'blog', '*.html'))):
    rel = os.path.relpath(p, ROOT).replace('\\', '/')
    if head_content(rel) is not None:
        INJECT_FILES.append(rel)
for p in sorted(glob.glob(os.path.join(ROOT, 'crm-vanilla', '*.html'))):
    rel = os.path.relpath(p, ROOT).replace('\\', '/')
    if head_content(rel) is not None:
        INJECT_FILES.append(rel)

staged, skipped = [], []

for rel in INJECT_FILES:
    head = head_content(rel)
    if head is None:
        skipped.append((rel, 'not tracked')); continue
    if 'googletagmanager.com/gtag' in head:
        skipped.append((rel, 'HEAD already has gtag')); continue
    if '</head>' not in head:
        skipped.append((rel, 'no </head>')); continue
    new = head.replace('</head>', SNIPPET + '</head>', 1)
    stage_blob(rel, new)
    staged.append(('inject', rel))

# Group C: new script file
script_path = os.path.join(ROOT, '_deploy', '_inject_ga4.py')
with open(script_path, 'r', encoding='utf-8') as f:
    stage_blob('_deploy/_inject_ga4.py', f.read())
staged.append(('new', '_deploy/_inject_ga4.py'))

print(f'Staged: {len(staged)}')
for kind, p in staged:
    print(f'  {kind:7} {p}')
print(f'\nSkipped: {len(skipped)}')
for p, r in skipped:
    print(f'  - {p}: {r}')
