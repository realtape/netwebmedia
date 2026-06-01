#!/usr/bin/env python3
"""
Bilingual translation script for NetWebMedia landing pages.
Adds data-en/data-es attributes with Latin American Spanish (Chilean register).
"""

import os
import re
from pathlib import Path

# Translation dictionary — key phrases from all 21 landing pages
TRANSLATIONS = {
    # Common hero elements
    "Analytics Guide": ("Analytics Guide", "Guía de Análisis"),
    "AI Tools Guide": ("AI Tools Guide", "Guía de Herramientas IA"),
    "Brand Strategy Guide": ("Brand Strategy Guide", "Guía de Estrategia de Marca"),
    "Content Strategy Guide": ("Content Strategy Guide", "Guía de Estrategia de Contenidos"),
    "Email Marketing Guide": ("Email Marketing Guide", "Guía de Email Marketing"),
    "Paid Ads Guide": ("Paid Ads Guide", "Guía de Publicidad"),
    "SEO Guide": ("SEO Guide", "Guía de SEO"),
    "Video Marketing Guide": ("Video Marketing Guide", "Guía de Video Marketing"),

    # Common H1/H2 titles (sampled from files)
    "AI Attribution Modeling: From Last-Click to Revenue Truth": ("AI Attribution Modeling: From Last-Click to Revenue Truth", "Modelado de Atribución con IA: De Last-Click a la Verdad del Ingreso"),
    "AI Brand Voice Enforcement: The System That Keeps AI On-Brand": ("AI Brand Voice Enforcement: The System That Keeps AI On-Brand", "Control de Voz de Marca con IA: El Sistema que Mantiene IA en Marca"),
    "The Complete ChatGPT Enterprise Playbook for Marketing Teams": ("The Complete ChatGPT Enterprise Playbook for Marketing Teams", "El Manual Completo de ChatGPT Enterprise para Equipos de Marketing"),

    # Common sections
    "What's inside": ("What's inside", "Qué encontrarás"),
    "Get the full guide — free": ("Get the full guide — free", "Obtén la guía completa — gratis"),
    "Want this running inside your stack?": ("Want this running inside your stack?", "¿Quieres esto funcionando en tu stack?"),

    # Common subtitles/descriptions
    "How to replace the attribution model that's been misdirecting your budget with one that reflects how customers actually buy":
    ("How to replace the attribution model that's been misdirecting your budget with one that reflects how customers actually buy",
     "Cómo reemplazar el modelo de atribución que ha estado desviando tu presupuesto con uno que refleja cómo los clientes realmente compran"),

    "How to configure, govern, and audit AI tools so every output sounds like your brand — not a generic chatbot":
    ("How to configure, govern, and audit AI tools so every output sounds like your brand — not a generic chatbot",
     "Cómo configurar, gobernar y auditar herramientas IA para que cada salida suene como tu marca — no como un chatbot genérico"),

    "Stop using AI like a search engine — build a custom GPT infrastructure that actually runs your marketing ops":
    ("Stop using AI like a search engine — build a custom GPT infrastructure that actually runs your marketing ops",
     "Deja de usar IA como un motor de búsqueda — construye una infraestructura GPT personalizada que realmente dirija tus operaciones de marketing"),

    # Common CTA texts
    "↓ Download Free Guide (PDF)": ("↓ Download Free Guide (PDF)", "↓ Descargar Guía Gratis (PDF)"),
    "↓ Download PDF Now": ("↓ Download PDF Now", "↓ Descargar PDF Ahora"),
    "Book a Free 30-Min Strategy Call →": ("Book a Free 30-Min Strategy Call →", "Agenda una Llamada de Estrategia Gratis 30 Min →"),
    "Book a Free Strategy Call →": ("Book a Free Strategy Call →", "Agenda una Llamada de Estrategia Gratis →"),

    # Stats labels
    "Average pipeline increase for clients in their first 6 months":
    ("Average pipeline increase for clients in their first 6 months",
     "Aumento promedio de pipeline para clientes en sus primeros 6 meses"),

    "Average reduction in cost-per-lead after AI automation implementation":
    ("Average reduction in cost-per-lead after AI automation implementation",
     "Reducción promedio en costo por lead después de implementar automatización IA"),

    "Typical time to first measurable ROI on AI marketing systems":
    ("Typical time to first measurable ROI on AI marketing systems",
     "Tiempo típico para el primer ROI medible en sistemas de marketing IA"),

    # Services
    "AI Marketing Automation": ("AI Marketing Automation", "Automatización de Marketing con IA"),
    "AEO & AI-First SEO": ("AEO & AI-First SEO", "AEO y SEO Impulsado por IA"),
    "Autonomous AI Agents": ("Autonomous AI Agents", "Agentes IA Autónomos"),
    "Paid Media + AI Creative": ("Paid Media + AI Creative", "Medios Pagados + Creatividad con IA"),

    # Footer/common
    "NetWebMedia builds AI marketing systems for US brands — from autonomous content engines to full-funnel AI automation. We don't just write guides. We implement what's in them.":
    ("NetWebMedia builds AI marketing systems for US brands — from autonomous content engines to full-funnel AI automation. We don't just write guides. We implement what's in them.",
     "NetWebMedia construye sistemas de marketing IA para marcas estadounidenses — desde motores de contenido autónomos hasta automatización IA de funnel completo. No solo escribimos guías. Implementamos lo que hay en ellas."),

    "AI-powered marketing for growing brands.": ("AI-powered marketing for growing brands.", "Marketing potenciado por IA para marcas en crecimiento."),

    # Meta tags
    "13 pages": ("13 pages", "13 páginas"),
    "14 pages": ("14 pages", "14 páginas"),
    "15 pages": ("15 pages", "15 páginas"),
    "Free download": ("Free download", "Descarga gratis"),
}

def find_en_text(html):
    """Extract English text from an HTML file."""
    texts = set()
    # Find all text in tags
    for match in re.finditer(r'>([^<]+)</', html):
        text = match.group(1).strip()
        if text and len(text) > 2 and not text.startswith('javascript'):
            texts.add(text)
    return texts

def get_spanish_translation(english_text):
    """Get Spanish translation, with sensible fallbacks."""
    if english_text in TRANSLATIONS:
        return TRANSLATIONS[english_text][1]

    # Fallback translations for common patterns
    fallbacks = {
        "Services": "Servicios",
        "About": "Nosotros",
        "Results": "Resultados",
        "Blog": "Blog",
        "Contact": "Contacto",
        "Dashboard": "Panel",
        "Get a Free Audit": "Obtén una Auditoría Gratis",
        "Free download": "Descarga gratis",
        "©": "©",
        "All rights reserved.": "Todos los derechos reservados.",
    }
    return fallbacks.get(english_text, english_text)

def add_bilingual_attributes(html_content):
    """
    Add data-en/data-es attributes to all translatable elements.
    Preserves HTML structure and only adds attributes to visible text content.
    """
    # Define patterns: (regex, attribute_type)
    # We'll process common user-visible text elements

    patterns = [
        # Tags (guide type labels)
        (r'(<div class="tag">)([^<]+)(</div>)', 'tag'),
        # Headings
        (r'(<h1[^>]*>)([^<]+)(</h1>)', 'h1'),
        (r'(<h2[^>]*>)([^<]+)(</h2>)', 'h2'),
        (r'(<h3[^>]*>)([^<]+)(</h3>)', 'h3'),
        (r'(<h4[^>]*>)([^<]+)(</h4>)', 'h4'),
        # Paragraphs with specific classes
        (r'(<p class="lp-subtitle"[^>]*>)([^<]+)(</p>)', 'p-lp-subtitle'),
        (r'(<p class="lp-inside-sub"[^>]*>)([^<]+)(</p>)', 'p-lp-inside-sub'),
        (r'(<p class="lp-meta"[^>]*>)([^<]+)(</p>)', 'p-lp-meta'),
        # List items
        (r'(<li>)([^<]+)(</li>)', 'li'),
        # Stat labels
        (r'(<div class="lp-stat-label">)([^<]+)(</div>)', 'div-stat-label'),
        # Buttons/CTAs (text content only, not attributes)
        (r'(<a[^>]*class="[^"]*lp-download-btn[^"]*"[^>]*>)↓ ([^<]+)(\s*</a>)', 'a-download'),
        (r'(<button[^>]*class="[^"]*lp-download-btn[^"]*"[^>]*>)↓ ([^<]+)(</button>)', 'button-download'),
        (r'(<a[^>]*class="[^"]*btn-primary[^"]*"[^>]*>)([^<]+)(</a>)', 'a-btn-primary'),
        # Regular paragraphs (careful not to catch all)
        (r'(<p>)([^<]+)(</p>)', 'p-regular'),
    ]

    result = html_content

    for pattern, ptype in patterns:
        def replacer(match):
            if ptype.startswith('a-download') or ptype.startswith('button-download'):
                # Special case: download buttons have "↓ text"
                prefix, text, suffix = match.group(1), match.group(2), match.group(3)
            else:
                prefix, text, suffix = match.group(1), match.group(2), match.group(3)

            # Skip if already has data-en/data-es
            if 'data-en=' in prefix or 'data-es=' in prefix:
                return match.group(0)

            text_clean = text.strip()
            if not text_clean or len(text_clean) < 2:
                return match.group(0)

            spanish = get_spanish_translation(text_clean)

            # Insert attributes before closing > of opening tag
            prefix_insert = prefix.rstrip('>') + f' data-en="{text_clean}" data-es="{spanish}">'
            return prefix_insert + text + suffix

        result = re.sub(pattern, replacer, result, flags=re.MULTILINE)

    return result

def process_lp_file(filepath):
    """Process a single LP file."""
    content = Path(filepath).read_text(encoding='utf-8')
    translated = add_bilingual_attributes(content)
    Path(filepath).write_text(translated, encoding='utf-8')
    print(f"✓ {Path(filepath).name}")

# Main execution
if __name__ == '__main__':
    lp_dir = Path('lp')
    if not lp_dir.exists():
        print("Error: lp/ directory not found")
        exit(1)

    # Skip redirect file
    skip_files = {'hubspot-ai-marketing-features.html'}

    files = sorted([f for f in lp_dir.glob('*.html') if f.name not in skip_files])

    print(f"Processing {len(files)} landing pages...")
    for lp_file in files:
        process_lp_file(lp_file)

    print(f"\nDone! {len(files)} files updated with bilingual attributes.")
