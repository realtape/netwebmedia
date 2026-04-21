#!/usr/bin/env python3
"""
update-nav.py
  1. Adds "Courses" link to the main marketing nav (before Contact)
  2. Adds 3 new messaging tutorials to the Help dropdown
  3. Bumps ?v=2 → ?v=3 on all css/js asset references (cache-bust)
  4. Prints a per-file summary.
"""
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent  # NetWebMedia/

# ── Patterns to find ──────────────────────────────────────────
# 1. Add Courses link just before Contact link in nav-links
CONTACT_PATTERN = re.compile(
    r'(<a href="contact\.html" data-i18n="nav_contact">Contact</a>)'
)
CONTACT_REPLACEMENT = (
    '<a href="/catalogue.html" style="color:#25d366;font-weight:600">Courses</a>\n'
    r'    \1'
)

# Also handle /contact.html variant
CONTACT_PATTERN2 = re.compile(
    r'(<a href="/contact\.html"[^>]*>(?:<span[^>]*>)?Contact(?:</span>)?</a>)'
)

# 2. Add 3 new tutorials to Help dropdown — insert after Analyzer line
ANALYZER_PATTERN = re.compile(
    r'(<a href="/tutorials/analyzer\.html">Analyzer</a>)'
)
ANALYZER_REPLACEMENT = (
    r'\1\n'
    '        <a href="/tutorials/whatsapp-automation.html" style="color:#25d366">WhatsApp Automation</a>\n'
    '        <a href="/tutorials/chatbot-automation.html" style="color:#22d3ee">AI Chatbot Automation</a>\n'
    '        <a href="/tutorials/sms-automation.html" style="color:#a29bfe">SMS & Messaging</a>'
)

# 3. Cache-bust: ?v=2 → ?v=3  (css and js)
CACHE_PATTERN = re.compile(r'\?v=2\b')
CACHE_REPLACEMENT = '?v=3'

# ── Files to process ─────────────────────────────────────────
HTML_FILES = list(ROOT.glob("*.html")) + list(ROOT.glob("tutorials/*.html"))

updated = []
skipped = []

for fpath in sorted(HTML_FILES):
    try:
        original = fpath.read_text(encoding="utf-8")
    except Exception as e:
        print(f"  [skip] {fpath.name}: {e}")
        continue

    text = original

    # 1. Add Courses link (only if not already present)
    if '/catalogue.html' not in text:
        new_text = CONTACT_PATTERN.sub(CONTACT_REPLACEMENT, text)
        if new_text != text:
            text = new_text
        # Don't add twice via second pattern if first matched

    # 2. Add messaging tutorials to dropdown (only if not already present)
    if 'whatsapp-automation.html' not in text:
        text = ANALYZER_PATTERN.sub(ANALYZER_REPLACEMENT, text)

    # 3. Bump cache version
    text = CACHE_PATTERN.sub(CACHE_REPLACEMENT, text)

    if text != original:
        fpath.write_text(text, encoding="utf-8")
        updated.append(fpath.name)
    else:
        skipped.append(fpath.name)

print(f"\n✅ Updated {len(updated)} files:")
for f in updated:
    print(f"   {f}")

if skipped:
    print(f"\n⏭  Skipped (no change needed): {len(skipped)} files")
