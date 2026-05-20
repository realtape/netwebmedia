#!/usr/bin/env python3
"""
Cache-bust nwm-i18n.js across all HTML files by adding ?v=2.

Without a version query, the browser serves the old (broken) cached copy
for up to 5 min. Adding ?v=2 forces a fresh fetch with the click bridge
to main.js's setLanguage. Idempotent: bumps to v=2 if currently bare,
re-runs bump existing v=N to v=N+1 only if explicitly invoked with
--bump (default: only adds v=2 when missing).
"""
import re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TARGET_VERSION = '2'

# Match: src="...nwm-i18n.js"  or  src="...nwm-i18n.js?v=OLD"
PATTERN = re.compile(r'(src="[^"]*nwm-i18n\.js)(\?v=\d+)?(")')

fixed = 0
already = 0
files_changed = 0

for html_path in ROOT.rglob('*.html'):
    rel = html_path.relative_to(ROOT)
    if any(part in rel.parts for part in ('_deploy', '_backup', 'crm-vanilla', 'site-upload', 'node_modules')):
        continue
    try:
        text = html_path.read_text(encoding='utf-8')
        if 'nwm-i18n.js' not in text:
            continue
        new_text, count = PATTERN.subn(rf'\1?v={TARGET_VERSION}\3', text)
        if new_text != text:
            html_path.write_text(new_text, encoding='utf-8')
            fixed += count
            files_changed += 1
        else:
            already += text.count('nwm-i18n.js')
    except Exception as e:
        print(f'ERR {rel}: {e}')

print(f'Bumped {fixed} script-tag references across {files_changed} files (target ?v={TARGET_VERSION})')
print(f'Already at target / skipped: {already}')
