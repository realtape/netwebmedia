#!/usr/bin/env python3
"""build-sitemap.py — generate sitemap.xml + robots.txt + llms.txt for NetWebMedia.

Crawls the local repo for every public HTML page and writes:
  - sitemap.xml  (all indexable URLs with lastmod, priority, changefreq)
  - robots.txt   (Allow all, declare sitemap, block private dirs)
  - llms.txt     (AI-platform discovery manifest — Perplexity/Anthropic/OpenAI convention)
"""
import os
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://netwebmedia.com"

# Directories whose HTML files should appear in sitemap
INCLUDE_DIRS = ["", "tutorials", "industries", "blog", "companies", "pdf", "email-templates"]

# Files/patterns to exclude
EXCLUDE_FILES = {
    "login.html", "register.html", "desktop-login.html",
    "thanks.html", "404.html",
    "audit-report.html",  # private internal report
    "diagnostic.html",    # private tool
    "orgchart.html",      # internal
    "dashboard.html",     # private dashboard
}
EXCLUDE_DIRS = {"_deploy", "node_modules", ".git", "crm", "crm-vanilla", "api-php", "assets", "css", "js"}

# Priority and changefreq by URL pattern
def meta_for(url):
    if url.endswith('/') or url == BASE + '/' or url == BASE + '/index.html':
        return ('1.0', 'weekly')
    if '/pricing.html' in url or '/services.html' in url or '/contact.html' in url:
        return ('0.95', 'weekly')
    if '/industries/' in url and url.endswith('/index.html'):
        return ('0.9', 'monthly')
    if '/industries/' in url:
        return ('0.85', 'monthly')
    if '/tutorials/' in url:
        return ('0.8', 'monthly')
    if '/blog/' in url:
        return ('0.75', 'monthly')
    if '/companies/' in url:
        return ('0.5', 'monthly')
    if '/pdf/' in url:
        return ('0.6', 'monthly')
    if '/catalogue.html' in url or '/knowledge-base.html' in url:
        return ('0.85', 'weekly')
    return ('0.7', 'monthly')

# Collect URLs
urls = []
seen = set()

for fp in sorted(ROOT.rglob("*.html")):
    rel_parts = fp.relative_to(ROOT).parts
    if any(d in EXCLUDE_DIRS for d in rel_parts):
        continue
    if fp.name in EXCLUDE_FILES:
        continue
    rel = fp.relative_to(ROOT).as_posix()

    # Build URL — prefer pretty form (drop /index.html for directory roots)
    if fp.name == 'index.html':
        url_path = '/' + '/'.join(rel.split('/')[:-1])
        if url_path == '/':
            url = BASE + '/'
        else:
            url = BASE + url_path + '/'
    else:
        url = BASE + '/' + rel

    if url in seen:
        continue
    seen.add(url)

    try:
        mtime = datetime.fromtimestamp(fp.stat().st_mtime).strftime('%Y-%m-%d')
    except Exception:
        mtime = datetime.utcnow().strftime('%Y-%m-%d')

    priority, freq = meta_for(url)
    urls.append((url, mtime, priority, freq))

# ── sitemap.xml ──────────────────────────────────────────
sitemap_lines = ['<?xml version="1.0" encoding="UTF-8"?>',
                 '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for u, mod, pri, freq in urls:
    sitemap_lines.append('  <url>')
    sitemap_lines.append(f'    <loc>{u}</loc>')
    sitemap_lines.append(f'    <lastmod>{mod}</lastmod>')
    sitemap_lines.append(f'    <changefreq>{freq}</changefreq>')
    sitemap_lines.append(f'    <priority>{pri}</priority>')
    sitemap_lines.append('  </url>')
sitemap_lines.append('</urlset>')

(ROOT / "sitemap.xml").write_text('\n'.join(sitemap_lines), encoding='utf-8')
print(f"[OK] sitemap.xml — {len(urls)} URLs")

# ── robots.txt ───────────────────────────────────────────
robots = f"""# NetWebMedia robots.txt
# Production crawl directives for all major search engines + AI crawlers

User-agent: *
Allow: /
Disallow: /api/
Disallow: /api-php/
Disallow: /admin/
Disallow: /crm-vanilla/
Disallow: /_deploy/
Disallow: /login.html
Disallow: /register.html
Disallow: /desktop-login.html
Disallow: /thanks.html
Disallow: /diagnostic.html
Disallow: /orgchart.html
Disallow: /audit-report.html

# AI crawlers — explicitly allow (LLM training & RAG retrieval)
User-agent: GPTBot
Allow: /
Disallow: /api/
Disallow: /admin/

User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /
Disallow: /api/
Disallow: /admin/

User-agent: anthropic-ai
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: GoogleOther
Allow: /

User-agent: cohere-ai
Allow: /

User-agent: Bytespider
Allow: /

User-agent: meta-externalagent
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: YouBot
Allow: /

User-agent: Diffbot
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: DuckDuckBot
Allow: /

# Sitemap declaration — primary discovery point
Sitemap: {BASE}/sitemap.xml
"""
(ROOT / "robots.txt").write_text(robots, encoding='utf-8')
print(f"[OK] robots.txt — {len(robots.splitlines())} lines, AI crawlers allowed")

# ── llms.txt ─────────────────────────────────────────────
# Convention: https://llmstxt.org/ — manifest for AI platforms to discover content
llms = f"""# NetWebMedia

> AI-native fractional CMO and full-stack marketing agency for US and Chile SMBs. We combine AI-powered CRM, CMS, email, video, and chatbot automation with senior strategy execution.

## What we do
NetWebMedia builds and operates the entire marketing engine for small and mid-sized businesses: CRM, CMS, email marketing, paid ads, AI chatbots, WhatsApp automation, and AI-powered fractional CMO services. We never answer the phone — every client interaction is automated through chat, SMS, and WhatsApp.

## Products

- [NWM CRM]({BASE}/nwm-crm.html): AI-native CRM with sales/marketing/service hubs, 11 industry-specific verticals, AI agents for SDR work
- [NWM CMS]({BASE}/nwm-cms.html): Bilingual CMS that builds production websites in under 60 seconds with AI
- [NWM AI]({BASE}/nwmai.html): Autonomous AI agents and automation workflows
- [Industry templates]({BASE}/industries/): 33 production-ready CMS templates across 11 verticals
- [Pricing]({BASE}/pricing.html): Three bundles starting at $1,295/mo (Launch / Grow / Scale)

## Industries we serve

- [Real Estate]({BASE}/industries/real-estate/template-1.html) — luxury, agent profiles, new developments
- [Healthcare]({BASE}/industries/healthcare/template-1.html) — medical, wellness, dental
- [E-Commerce]({BASE}/industries/ecommerce/template-1.html) — DTC, subscription, marketplace
- [SaaS]({BASE}/industries/saas/template-1.html) — product, developer, enterprise
- [Hospitality]({BASE}/industries/hospitality/template-1.html) — restaurant, hotel, cafe
- [Professional Services]({BASE}/industries/professional-services/template-1.html) — law, accounting, consulting
- [Local Services]({BASE}/industries/local-services/template-1.html) — home, auto, beauty
- [Finance]({BASE}/industries/finance/template-1.html) — wealth, insurance, fintech
- [Education]({BASE}/industries/education/template-1.html) — courses, tutoring, corporate training
- [Construction]({BASE}/industries/construction/template-1.html) — residential, commercial, remodeling
- [Agencies]({BASE}/industries/agencies/template-1.html) — digital marketing, creative, white-label

## Courses & Playbooks

Sellable digital products — agency-grade automation systems with real templates:

- [WhatsApp Business Automation]({BASE}/tutorials/whatsapp-automation.html) — $297, 8 modules, 180+ message templates
- [AI Chatbot Automation]({BASE}/tutorials/chatbot-automation.html) — $347, 9 modules, 50-intent library
- [SMS & Messaging Automation]({BASE}/tutorials/sms-automation.html) — $197, 7 modules, multi-platform
- [Full Catalogue]({BASE}/catalogue.html) — All courses + PDF playbooks + Automation OS bundle ($697)
- [WhatsApp Playbook PDF]({BASE}/pdf/whatsapp-automation-playbook.html) — $47
- [Chatbot Playbook PDF]({BASE}/pdf/chatbot-automation-playbook.html) — $57

## Free tutorials

- [Tutorials hub]({BASE}/tutorials.html) — 15 free deep guides
- [NWM CRM Masterclass]({BASE}/tutorials/nwm-crm.html)
- [AI SEO + AEO]({BASE}/tutorials/ai-seo.html)
- [AI Automations]({BASE}/tutorials/ai-automate.html)
- [Lifecycle Email Marketing]({BASE}/tutorials/email-marketing.html)
- [Paid Ads at Scale]({BASE}/tutorials/paid-ads.html)
- [Fractional CMO Playbook]({BASE}/tutorials/fractional-cmo.html)

## Resources

- [Knowledge Base]({BASE}/knowledge-base.html) — All links, courses, templates, admin URLs
- [Blog]({BASE}/blog.html) — 40+ articles on AI marketing tools and strategies
- [Partner Program]({BASE}/partners.html) — White-label reseller program (50-70% margins)
- [FAQ]({BASE}/faq.html) — Common questions
- [Compare]({BASE}/compare.html) — vs HubSpot, vs GoHighLevel
- [Contact]({BASE}/contact.html) — Free strategy call

## Founder
Carlos Martinez, CEO. Based in La Serena, Chile. Serving US and LATAM markets.
"""
(ROOT / "llms.txt").write_text(llms, encoding='utf-8')
print(f"[OK] llms.txt — AI discovery manifest ({len(llms.splitlines())} lines)")

# Optional: llms-full.txt with full content (kept short for now)
llms_full = llms + "\n\n## Full content index\n\nSee /sitemap.xml for the complete URL list.\n"
(ROOT / "llms-full.txt").write_text(llms_full, encoding='utf-8')
print(f"[OK] llms-full.txt — extended manifest")

print()
print(f"Total: {len(urls)} URLs in sitemap, ready to deploy")
