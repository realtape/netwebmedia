#!/usr/bin/env python3
"""
fix-langbar.py — normalize the language bar across all marketing pages.

Replaces variations of:
  <div class="top-bar">...lang-switch...Partner Login...</div>
with the canonical:
  <div class="lang-bar" id="lang-bar">
    <div class="container">
      <button class="lang-btn active" data-lang="en" id="lang-en">
        <img class="flag" src="..." /> English
      </button>
      <button class="lang-btn" data-lang="es" id="lang-es">
        <img class="flag" src="..." /> Español
      </button>
      <a href="/crm/" class="lang-client-login" data-i18n="nav_dashboard">🔐 Client Login</a>
    </div>
  </div>

Also removes duplicate Client Login links from .nav-ctas.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

CANONICAL_LANGBAR = '''<div class="lang-bar" id="lang-bar">
  <div class="container">
    <button class="lang-btn active" data-lang="en" id="lang-en">
      <img class="flag" src="https://flagcdn.com/w40/us.png" alt="EN" loading="lazy" width="20" height="15" /> English
    </button>
    <button class="lang-btn" data-lang="es" id="lang-es">
      <img class="flag" src="https://flagcdn.com/w40/es.png" alt="ES" loading="lazy" width="20" height="15" /> Español
    </button>
    <a href="/crm/" class="lang-client-login" data-i18n="nav_dashboard">&#128274; Client Login</a>
  </div>
</div>'''

# Match the entire <div class="top-bar">...</div> block (greedy but up to first closing div pair)
TOPBAR_RE = re.compile(
    r'<div class="top-bar">\s*<div class="container">.*?</div>\s*</div>',
    re.DOTALL
)

# Also match variant without the outer container wrapper
TOPBAR_RE2 = re.compile(
    r'<div class="top-bar">.*?</div>\s*</div>',
    re.DOTALL
)

# Duplicate Client Login inside nav-ctas — matches lang-client-login class variant too
DUP_LOGIN_RE = re.compile(
    r'\s*<a href="/crm/" class="lang-client-login"[^>]*>[^<]*</a>\s*\n?',
)

# Inside <div class="nav-ctas"> ... </div>, remove the login link
# We only want to remove from nav-ctas, not from lang-bar. To do this safely,
# we'll strip lang-client-login occurrences that come AFTER the navbar starts.

fixed_langbar = []
fixed_login = []

for fp in sorted(ROOT.glob("*.html")):
    orig = fp.read_text(encoding="utf-8", errors="ignore")
    text = orig

    # 1. Replace top-bar with canonical lang-bar
    new_text, n = TOPBAR_RE.subn(CANONICAL_LANGBAR, text)
    if n == 0:
        new_text, n = TOPBAR_RE2.subn(CANONICAL_LANGBAR, text)
    if n > 0:
        text = new_text
        fixed_langbar.append(fp.name)

    # 2. Remove duplicate lang-client-login from nav-ctas only
    # Split into before-navbar and navbar+after; clean up nav-ctas area
    nav_start = text.find('<div class="nav-ctas">')
    nav_end = text.find('</div>', nav_start) if nav_start > 0 else -1
    if nav_start > 0 and nav_end > 0:
        before = text[:nav_start]
        navctas = text[nav_start:nav_end + len('</div>')]
        after = text[nav_end + len('</div>'):]
        new_navctas = DUP_LOGIN_RE.sub('\n        ', navctas)
        if new_navctas != navctas:
            text = before + new_navctas + after
            fixed_login.append(fp.name)

    if text != orig:
        fp.write_text(text, encoding="utf-8")

print(f"[OK] Fixed lang-bar on {len(fixed_langbar)} pages:")
for f in fixed_langbar:
    print(f"  - {f}")
print()
print(f"[OK] Removed duplicate Client Login from {len(fixed_login)} pages:")
for f in fixed_login:
    print(f"  - {f}")
