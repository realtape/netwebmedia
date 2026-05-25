#!/usr/bin/env python3
"""
Fixes Bug 2: industry pages have data-en/data-es content but no toggle UI.

Root cause: industry pages omit the <div class="nav-lang"></div> placeholder
and the assets/nwm-i18n.js script that injects the actual button into it.

For every HTML file under industries/ that has class="has-lang-bar" but no
class="nav-lang", inject:
  1. <div class="nav-lang"></div> as the FIRST child of <div class="nav-ctas">
  2. <script src="/assets/nwm-i18n.js" defer></script> right before </head>
"""
import re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NAV_CTAS_RE = re.compile(r'(<div class="nav-ctas">)(\s*)', re.IGNORECASE)
HEAD_CLOSE_RE = re.compile(r'(</head>)', re.IGNORECASE)

NAV_LANG_INSERT = r'\1\n        <div class="nav-lang"></div>\2'
SCRIPT_TAG = '<script src="/assets/nwm-i18n.js" defer></script>\n'

fixed = []
skipped = []
errors = []

for html_path in ROOT.glob('industries/**/*.html'):
    try:
        text = html_path.read_text(encoding='utf-8')
        has_lang_bar = 'has-lang-bar' in text
        already_has_navlang = 'class="nav-lang"' in text
        already_has_i18n = 'nwm-i18n.js' in text

        if not has_lang_bar:
            skipped.append((html_path, 'no has-lang-bar'))
            continue
        if already_has_navlang and already_has_i18n:
            skipped.append((html_path, 'already fixed'))
            continue

        new_text = text
        changes = []

        if not already_has_navlang:
            new_text, count = NAV_CTAS_RE.subn(NAV_LANG_INSERT, new_text, count=1)
            if count == 1:
                changes.append('nav-lang div')
            else:
                errors.append((html_path, 'no <div class="nav-ctas"> found'))
                continue

        if not already_has_i18n:
            new_text, count = HEAD_CLOSE_RE.subn(f'  {SCRIPT_TAG}\\1', new_text, count=1)
            if count == 1:
                changes.append('nwm-i18n.js')
            else:
                errors.append((html_path, 'no </head> found'))
                continue

        if new_text != text:
            html_path.write_text(new_text, encoding='utf-8')
            fixed.append((html_path, changes))
    except Exception as e:
        errors.append((html_path, str(e)))

print(f'Fixed: {len(fixed)} files')
for p, ch in fixed[:20]:
    print(f'  {p.relative_to(ROOT)}  [{", ".join(ch)}]')
if len(fixed) > 20:
    print(f'  ... and {len(fixed)-20} more')
print(f'Skipped: {len(skipped)} files')
print(f'Errors: {len(errors)}')
for p, e in errors:
    print(f'  ERR {p.relative_to(ROOT)}: {e}')
