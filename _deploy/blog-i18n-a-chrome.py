#!/usr/bin/env python3
"""
Blog i18n — Option A: UI chrome only (no API, pure string replacement).

Targets repeated boilerplate across all 268 blog posts:
  - Nav links (Services, About, Results, Contact)
  - Nav CTA button (Get a Free Audit)
  - Mobile menu (same links + CTA)
  - Footer h4 section headers + footer links + tagline + copyright
  - Article back links
  - Share section header
  - Standard CTA buttons (Book a Free Strategy Call, Request Free AI Audit, etc.)

Skips posts that are already in Spanish (detected by Spanish nav text).
Idempotent: replacement strings won't match if data-en is already present.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BLOG_DIR = ROOT / 'blog'

# ---------------------------------------------------------------------------
# Replacement table: (old_string, new_string)
# Order matters — more specific first to avoid partial matches.
# ---------------------------------------------------------------------------
REPLACEMENTS = [

    # ── Nav links ──────────────────────────────────────────────────────────
    # blog.html may have class="active" — handle both
    ('<a href="../blog.html" class="active">Blog</a>',
     '<a href="../blog.html" class="active" data-en="Blog" data-es="Blog">Blog</a>'),
    ('<a href="../blog.html">Blog</a>',
     '<a href="../blog.html" data-en="Blog" data-es="Blog">Blog</a>'),

    ('<a href="../services.html">Services</a>',
     '<a href="../services.html" data-en="Services" data-es="Servicios">Services</a>'),
    ('<a href="../about.html">About</a>',
     '<a href="../about.html" data-en="About" data-es="Nosotros">About</a>'),
    ('<a href="../results.html">Results</a>',
     '<a href="../results.html" data-en="Results" data-es="Resultados">Results</a>'),
    ('<a href="../contact.html">Contact</a>',
     '<a href="../contact.html" data-en="Contact" data-es="Contacto">Contact</a>'),

    # ── Nav CTA buttons ───────────────────────────────────────────────────
    ('<a href="../contact.html" class="btn-nav-solid">Get a Free Audit</a>',
     '<a href="../contact.html" class="btn-nav-solid" data-en="Get a Free Audit" data-es="Auditoría Gratuita">Get a Free Audit</a>'),

    # Mobile menu CTA (different tag order)
    ('<a href="../contact.html" class="btn-primary">Get a Free Audit</a>',
     '<a href="../contact.html" class="btn-primary" data-en="Get a Free Audit" data-es="Auditoría Gratuita">Get a Free Audit</a>'),

    # ── Footer h4 section headers ─────────────────────────────────────────
    ('<h4>Services</h4>',
     '<h4 data-en="Services" data-es="Servicios">Services</h4>'),
    ('<h4>Company</h4>',
     '<h4 data-en="Company" data-es="Empresa">Company</h4>'),

    # ── Footer nav items (inside <li>) ────────────────────────────────────
    ('<li><a href="../about.html">About</a></li>',
     '<li><a href="../about.html" data-en="About" data-es="Nosotros">About</a></li>'),
    ('<li><a href="../results.html">Results</a></li>',
     '<li><a href="../results.html" data-en="Results" data-es="Resultados">Results</a></li>'),
    ('<li><a href="../blog.html">Blog</a></li>',
     '<li><a href="../blog.html" data-en="Blog" data-es="Blog">Blog</a></li>'),
    ('<li><a href="../contact.html">Contact</a></li>',
     '<li><a href="../contact.html" data-en="Contact" data-es="Contacto">Contact</a></li>'),
    ('<li><a href="../services.html#ai-automations">AI Automations</a></li>',
     '<li><a href="../services.html#ai-automations" data-en="AI Automations" data-es="Automatizaciones IA">AI Automations</a></li>'),
    ('<li><a href="../services.html#ai-agents">AI Agents</a></li>',
     '<li><a href="../services.html#ai-agents" data-en="AI Agents" data-es="Agentes IA">AI Agents</a></li>'),
    ('<li><a href="../services.html#ai-seo">AI SEO</a></li>',
     '<li><a href="../services.html#ai-seo" data-en="AI SEO" data-es="AEO &amp; SEO">AI SEO</a></li>'),
    ('<li><a href="../services.html#paid-ads">Paid Ads</a></li>',
     '<li><a href="../services.html#paid-ads" data-en="Paid Ads" data-es="Pauta Pagada">Paid Ads</a></li>'),

    # ── Footer tagline + copyright ────────────────────────────────────────
    ('<p>The world\'s most advanced AI marketing agency.</p>',
     '<p data-en="The world\'s most advanced AI marketing agency." data-es="La agencia de marketing IA más avanzada del mundo.">The world\'s most advanced AI marketing agency.</p>'),
    ('<p>© 2026 NetWebMedia. All rights reserved.</p>',
     '<p data-en="© 2026 NetWebMedia. All rights reserved." data-es="© 2026 NetWebMedia. Todos los derechos reservados.">© 2026 NetWebMedia. All rights reserved.</p>'),

    # ── Article back links ────────────────────────────────────────────────
    ('<a class="article-back" href="../blog.html">← All articles</a>',
     '<a class="article-back" href="../blog.html" data-en="← All articles" data-es="← Todos los artículos">← All articles</a>'),
    ('<a class="article-back" href="../blog.html">← All Articles</a>',
     '<a class="article-back" href="../blog.html" data-en="← All Articles" data-es="← Todos los artículos">← All Articles</a>'),
    ('<a class="article-back" href="../blog.html">← Back to all articles</a>',
     '<a class="article-back" href="../blog.html" data-en="← Back to all articles" data-es="← Volver a todos los artículos">← Back to all articles</a>'),

    # Inline style variant
    ('<a href="../blog.html" style="color:#FF671F;font-size:14px;text-decoration:none;">← All Articles</a>',
     '<a href="../blog.html" style="color:#FF671F;font-size:14px;text-decoration:none;" data-en="← All Articles" data-es="← Todos los artículos">← All Articles</a>'),

    # ── Share section header ──────────────────────────────────────────────
    ('<p style="font-family:\'Poppins\',sans-serif;font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1.2px;margin:0 0 14px;">Share this article</p>',
     '<p style="font-family:\'Poppins\',sans-serif;font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1.2px;margin:0 0 14px;" data-en="Share this article" data-es="Compartir este artículo">Share this article</p>'),

    # ── Standard CTA article-cta-box buttons ─────────────────────────────
    ('<a class="btn-primary" href="../contact.html">Book a Free Strategy Call →</a>',
     '<a class="btn-primary" href="../contact.html" data-en="Book a Free Strategy Call →" data-es="Agenda una Llamada Estratégica Gratis →">Book a Free Strategy Call →</a>'),
    ('<a class="btn-primary" href="../contact.html">Request Free AI Audit →</a>',
     '<a class="btn-primary" href="../contact.html" data-en="Request Free AI Audit →" data-es="Solicitar Auditoría IA Gratuita →">Request Free AI Audit →</a>'),
    ('<a class="btn-primary" href="../contact.html">Book a Free Audit →</a>',
     '<a class="btn-primary" href="../contact.html" data-en="Book a Free Audit →" data-es="Agenda una Auditoría Gratuita →">Book a Free Audit →</a>'),
    ('<a class="btn-primary" href="../contact.html">Book Your Strategy Call →</a>',
     '<a class="btn-primary" href="../contact.html" data-en="Book Your Strategy Call →" data-es="Agenda tu Llamada Estratégica →">Book Your Strategy Call →</a>'),

    # Skip link
    ('<a class="skip-link" href="#main">Skip to main content</a>',
     '<a class="skip-link" href="#main" data-en="Skip to main content" data-es="Saltar al contenido principal">Skip to main content</a>'),
]

# Spanish indicator strings — skip posts that are natively Spanish
SPANISH_INDICATORS = ['Servicios</a>', 'Nosotros</a>', 'data-es="Todos los artículos"',
                      'Caso de Estudio', 'caso-aeo', 'fractional-cmo-vs-agencia']

fixed_files = 0
fixed_replacements = 0
skipped_spanish = 0
errors = []

for html_path in sorted(BLOG_DIR.glob('*.html')):
    try:
        text = html_path.read_text(encoding='utf-8')

        # Skip natively Spanish posts
        if any(s in text for s in SPANISH_INDICATORS):
            skipped_spanish += 1
            continue

        new_text = text
        count = 0
        for old, new in REPLACEMENTS:
            if old in new_text:
                new_text = new_text.replace(old, new)
                count += new_text.count(new) - text.count(new) if new in text else 0
                # Simpler: count replacements
        # Re-count accurately
        replacements_made = sum(1 for old, new in REPLACEMENTS if old in text and new not in text)

        if new_text != text:
            html_path.write_text(new_text, encoding='utf-8')
            fixed_files += 1
            fixed_replacements += replacements_made

    except Exception as e:
        errors.append((html_path.name, str(e)))

print(f'Files modified: {fixed_files}')
print(f'Skipped (native Spanish): {skipped_spanish}')
print(f'Errors: {len(errors)}')
for name, err in errors:
    print(f'  ERR {name}: {err}')
