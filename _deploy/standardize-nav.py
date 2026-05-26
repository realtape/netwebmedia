#!/usr/bin/env python3
"""
standardize-nav.py
  Enforces one consistent nav across the whole marketing site:
  About - Services - Partners - Blog - Q&A - Help - Contact - Get a Free Audit

  1. On pages that already have the marketing nav: remove top-level "Courses"
     link and add it inside the Help dropdown instead.
  2. On pages with minimal/custom nav (catalogue, knowledge-base, thanks):
     replace the nav block with the standard one.
  3. Bump ?v=3 -> ?v=4 for cache-bust.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Pages that should NEVER have the main marketing nav
NO_NAV_PAGES = {"login.html", "register.html", "desktop-login.html",
                "pricing-onepager.html", "orgchart.html", "audit-report.html"}

# Pages that currently have a custom/different nav -> replace fully
REPLACE_NAV_PAGES = {"catalogue.html", "knowledge-base.html", "thanks.html",
                     "dashboard.html", "diagnostic.html"}

STANDARD_NAV = '''<!-- ── Navbar ───────────────────────────────────────────── -->
<nav class="navbar has-lang-bar" id="navbar">
  <div class="container">
    <div class="navbar-inner">
      <a href="/index.html" class="nav-logo">
        <img src="/assets/nwm-logo-horizontal.svg" alt="NetWebMedia" class="logo-lockup" style="height:52px">
      </a>
      <div class="nav-links">
    <a href="/about.html" data-i18n="nav_about">About</a>
    <div class="nav-item">
      <a href="/services.html" data-i18n="nav_services">Services</a>
      <div class="nav-dropdown">
        <a href="/services.html#fractional-cmo" style="color:#FF671F;font-weight:700">&#9733; Fractional CMO</a>
        <a href="/services.html#ai-automations">AI Automations</a>
        <a href="/services.html#ai-agents">AI Agents</a>
        <a href="/services.html#paid-ads">Paid Ads</a>
        <a href="/services.html#ai-seo">AI SEO &amp; Content</a>
        <a href="/services.html#social">Social Media</a>
        <a href="/email-marketing.html">Email Marketing</a>
      </div>
    </div>
    <a href="/partners.html" style="color:#6366f1;font-weight:600">Partners</a>
    <a href="/blog.html" data-i18n="nav_blog">Blog</a>
    <a href="/faq.html">Q&amp;A</a>
    <div class="nav-item">
      <a href="/tutorials.html" style="color:#22d3ee;font-weight:600">Help</a>
      <div class="nav-dropdown">
        <a href="/tutorials.html"><strong>All Tutorials</strong></a>
        <a href="/catalogue.html" style="color:#25d366;font-weight:700">&#128218; Courses &amp; Playbooks &rarr;</a>
        <a href="/tutorials/nwm-crm.html">NWM CRM</a>
        <a href="/tutorials/nwm-cms.html">NWM CMS</a>
        <a href="/tutorials/ai-automate.html">AI Automations</a>
        <a href="/tutorials/ai-chat-agents.html">AI Chat Agents</a>
        <a href="/tutorials/ai-seo.html">AI SEO</a>
        <a href="/tutorials/email-marketing.html">Email Marketing</a>
        <a href="/tutorials/paid-ads.html">Paid Ads</a>
        <a href="/tutorials/social-media.html">Social Media</a>
        <a href="/tutorials/video-factory.html">Video Factory</a>
        <a href="/tutorials/websites.html">Websites</a>
        <a href="/tutorials/fractional-cmo.html">Fractional CMO</a>
        <a href="/tutorials/analyzer.html">Analyzer</a>
        <a href="/tutorials/whatsapp-automation.html" style="color:#25d366">WhatsApp Automation</a>
        <a href="/tutorials/chatbot-automation.html" style="color:#22d3ee">AI Chatbot Automation</a>
        <a href="/tutorials/sms-automation.html" style="color:#a29bfe">SMS &amp; Messaging</a>
      </div>
    </div>
    <a href="/contact.html" data-i18n="nav_contact">Contact</a>
  </div>
      <div class="nav-ctas">
        <a href="/cart.html" class="nav-cart" aria-label="View cart">&#128722;<span class="nav-cart-count" aria-hidden="true">0</span></a>
        <a href="/contact.html" class="btn-nav-solid" data-i18n="nav_cta">Get a Free Audit</a>
      </div>
      <button class="hamburger" id="hamburger" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</nav>
'''

# Regex for the Courses top-level link in the nav (to be removed)
COURSES_LINK_RE = re.compile(
    r'\s*<a href="/catalogue\.html"[^>]*>Courses</a>\s*\n?'
)

# Regex for adding the Catalogue link inside Help dropdown, right after "All Tutorials"
ALL_TUTORIALS_RE = re.compile(
    r'(<a href="/tutorials\.html"><strong>All Tutorials</strong></a>)'
)
ALL_TUTORIALS_REPL = (
    r'\1\n'
    '        <a href="/catalogue.html" style="color:#25d366;font-weight:700">&#128218; Courses &amp; Playbooks &rarr;</a>'
)

# Cache-bust
CACHE_RE = re.compile(r'\?v=3\b')
CACHE_REPL = '?v=4'

# Nav block regex (to swap for pages with custom nav)
NAV_BLOCK_RE = re.compile(
    r'(?:<!--[^\n]*Navbar[^\n]*-->\n)?<nav[^>]*(?:navbar|nav-wrapper)[^>]*>.*?</nav>\n?',
    re.DOTALL | re.IGNORECASE
)

updated = []
replaced_nav = []
skipped = []

for fp in sorted(ROOT.glob("*.html")):
    if fp.name in NO_NAV_PAGES:
        skipped.append(fp.name + " (no-nav page)")
        continue

    orig = fp.read_text(encoding="utf-8", errors="ignore")
    text = orig

    if fp.name in REPLACE_NAV_PAGES:
        # Fully replace the nav block with the standard one
        new_text, n = NAV_BLOCK_RE.subn(STANDARD_NAV, text, count=1)
        if n > 0:
            text = new_text
            replaced_nav.append(fp.name)
        else:
            # No existing nav block found — inject right after <body>
            text = re.sub(r'(<body[^>]*>)', r'\1\n' + STANDARD_NAV, text, count=1)
            replaced_nav.append(fp.name + " (injected)")
    else:
        # 1. Remove top-level Courses link
        text = COURSES_LINK_RE.sub('', text)
        # 2. Add Courses to Help dropdown (if not already there)
        if 'Courses &amp; Playbooks' not in text and 'Courses & Playbooks' not in text:
            text = ALL_TUTORIALS_RE.sub(ALL_TUTORIALS_REPL, text)

    # 3. Cache-bust
    text = CACHE_RE.sub(CACHE_REPL, text)

    if text != orig:
        fp.write_text(text, encoding="utf-8")
        updated.append(fp.name)

# Also bump cache on tutorials/*
for fp in sorted((ROOT / "tutorials").glob("*.html")):
    orig = fp.read_text(encoding="utf-8", errors="ignore")
    text = CACHE_RE.sub(CACHE_REPL, orig)
    if text != orig:
        fp.write_text(text, encoding="utf-8")
        updated.append("tutorials/" + fp.name)

print("[OK] Updated files:", len(updated))
for f in updated[:40]:
    print("  -", f)
if len(updated) > 40:
    print("  ... and", len(updated) - 40, "more")
print()
print("[OK] Replaced full nav on:", len(replaced_nav))
for f in replaced_nav:
    print("  *", f)
print()
print("[OK] Skipped (no nav expected):", len(skipped))
for f in skipped:
    print("  ~", f)
