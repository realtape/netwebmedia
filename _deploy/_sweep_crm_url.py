"""One-shot sweep: /crm-vanilla/ -> /crm/ in HTML files outside the crm-vanilla directory."""
import os, sys

ROOT = r'C:\Users\Usuario\Desktop\NetWebMedia'
EXCLUDE_DIRS = {'_deploy/email_review', 'node_modules', '_backup', 'site-upload',
                'crm-vanilla', '.git', 'mobile/dist', '_archive', 'video-factory/node_modules'}

changed = []
total = 0
for dp, dns, fns in os.walk(ROOT):
    rel = os.path.relpath(dp, ROOT).replace(os.sep, '/')
    if rel == '.':
        rel = ''
    if any(rel == d or rel.startswith(d + '/') for d in EXCLUDE_DIRS):
        dns[:] = []
        continue
    for fn in fns:
        if not fn.lower().endswith('.html'):
            continue
        p = os.path.join(dp, fn)
        try:
            with open(p, 'r', encoding='utf-8') as f:
                txt = f.read()
        except Exception as e:
            print('READ_ERR', p, e)
            continue
        if '/crm-vanilla/' not in txt:
            continue
        n = txt.count('/crm-vanilla/')
        new = txt.replace('/crm-vanilla/', '/crm/')
        with open(p, 'w', encoding='utf-8') as f:
            f.write(new)
        total += n
        changed.append((p, n))

print(f'Files changed: {len(changed)}')
print(f'Total subs: {total}')
for p, n in changed:
    print(f'  {n}x  {os.path.relpath(p, ROOT)}')
