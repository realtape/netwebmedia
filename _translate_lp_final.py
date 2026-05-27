#!/usr/bin/env python3
"""
Bilingual translation script for NetWebMedia landing pages.
Adds data-en/data-es attributes with Latin American Spanish (Chilean register).
Translation dictionary built from actual file content.
"""

import re
from pathlib import Path

# Comprehensive translation dictionary (Chilean/LATAM Spanish)
TRANSLATIONS = {
    # Tags/Guide types
    "Analytics Guide": "Guía de Análisis",
    "Brand Strategy Guide": "Guía de Estrategia de Marca",
    "Competitive Strategy Guide": "Guía de Estrategia Competitiva",
    "Content Strategy Guide": "Guía de Estrategia de Contenidos",
    "Marketing Ops Guide": "Guía de Operaciones de Marketing",
    "Marketing Analytics Guide": "Guía de Análisis de Marketing",
    "Email Marketing Guide": "Guía de Email Marketing",
    "Influencer Marketing Guide": "Guía de Marketing de Influencers",
    "CRO Guide": "Guía de Optimización de Conversión",
    "Content Marketing Guide": "Guía de Marketing de Contenidos",
    "Social Intelligence Guide": "Guía de Inteligencia Social",
    "AI Agents Guide": "Guía de Agentes IA",
    "B2B Marketing Guide": "Guía de Marketing B2B",
    "AI Tools Guide": "Guía de Herramientas IA",
    "Paid Media Guide": "Guía de Medios Pagados",
    "AI Creative Guide": "Guía de Creatividad con IA",
    "SEO & AEO Guide": "Guía de SEO & AEO",
    "AI Strategy Guide": "Guía de Estrategia IA",
    "Conversational AI Guide": "Guía de IA Conversacional",
    "SEO Strategy Guide": "Guía de Estrategia SEO",

    # H1 Titles
    "AI Attribution Modeling: From Last-Click to Revenue Truth": "Modelado de Atribución con IA: De Last-Click a la Verdad del Ingreso",
    "AI Brand Voice Enforcement: The System That Keeps AI On-Brand": "Control de Voz de Marca con IA: El Sistema que Mantiene IA en Marca",
    "AI Competitive Intelligence: The Real-Time Market Monitoring Playbook": "Inteligencia Competitiva con IA: Manual de Monitoreo de Mercado en Tiempo Real",
    "The AI Content Repurposing System: One Piece, Thirty Outputs": "El Sistema de Reutilización de Contenidos con IA: Una Pieza, Treinta Resultados",
    "AI CRM Data Hygiene: The Clean Data Playbook for AI Marketing": "Higiene de Datos CRM con IA: Manual de Datos Limpios para Marketing IA",
    "AI Customer Segmentation: Beyond Demographics to Predictive Behavior": "Segmentación de Clientes con IA: Más Allá de Demografía al Comportamiento Predictivo",
    "The AI Email Personalization Playbook: Beyond Merge Tags": "Manual de Personalización de Email con IA: Más Allá de Etiquetas de Fusión",
    "AI Influencer Marketing: The Data-Driven Creator Selection Playbook": "Marketing de Influencers con IA: Manual de Selección de Creadores Basado en Datos",
    "AI Landing Page Optimization: The Compounding Conversion Playbook": "Optimización de Páginas de Aterrizaje con IA: Manual de Conversión Compuesta",
    "AI Podcast Marketing: The B2B Show That Builds Pipeline": "Marketing de Podcasts con IA: El Show B2B que Construye Pipeline",
    "AI Social Listening: From Brand Monitoring to Strategic Signal Detection": "Escucha Social con IA: Del Monitoreo de Marca a la Detección de Señales Estratégicas",
    "Autonomous Marketing Agents: The 2026 Implementation Guide": "Agentes de Marketing Autónomos: Guía de Implementación 2026",
    "B2B Intent Data + AI: The Account Targeting Playbook": "Datos de Intención B2B + IA: Manual de Segmentación de Cuentas",
    "The Complete ChatGPT Enterprise Playbook for Marketing Teams": "Manual Completo de ChatGPT Enterprise para Equipos de Marketing",
    "The Gemini Ads Playbook: Winning with Google's AI-Powered Campaigns": "Manual de Gemini Ads: Ganando con Campañas Potenciadas por IA de Google",
    "GPT-4o Image Generation for Ad Creative: The Practitioner's Guide": "Generación de Imágenes GPT-4o para Creatividad Publicitaria: Guía del Profesional",
    "LLM SEO: The Complete Guide to AI Search Citation": "SEO con LLM: Guía Completa para Citas de Búsqueda IA",
    "The Multimodal AI Marketing Engine: Text, Image, and Voice Working Together": "El Motor de Marketing IA Multimodal: Texto, Imagen y Voz Trabajando Juntos",
    "OpenAI Realtime API: Building AI Customer Conversations That Convert": "API Realtime de OpenAI: Construyendo Conversaciones de Clientes IA que Convierten",
    "Programmatic SEO at AI Scale: The Quality-First Playbook": "SEO Programático a Escala IA: Manual Orientado a Calidad",
    "The Zero-Click Search Playbook: Winning When Nobody Clicks": "Manual de Búsqueda Zero-Click: Ganando Cuando Nadie Hace Clic",

    # Common sections
    "What's inside": "Qué encontrarás",
    "Get the full guide — free": "Obtén la guía completa — gratis",
    "Want this running inside your stack?": "¿Quieres esto funcionando en tu stack?",

    # Common subtitles
    "How to replace the attribution model that's been misdirecting your budget with one that reflects how customers actually buy": "Cómo reemplazar el modelo de atribución que ha estado desviando tu presupuesto con uno que refleja cómo los clientes realmente compran",
    "How to configure, govern, and audit AI tools so every output sounds like your brand — not a generic chatbot": "Cómo configurar, gobernar y auditar herramientas IA para que cada salida suene como tu marca — no como un chatbot genérico",
    "Stop using AI like a search engine — build a custom GPT infrastructure that actually runs your marketing ops": "Deja de usar IA como un motor de búsqueda — construye una infraestructura GPT personalizada que realmente dirija tus operaciones de marketing",

    # CTAs
    "↓ Download Free Guide (PDF)": "↓ Descargar Guía Gratis (PDF)",
    "↓ Download PDF Now": "↓ Descargar PDF Ahora",
    "Book a Free 30-Min Strategy Call →": "Agenda una Llamada de Estrategia Gratis 30 Min →",
    "Book a Free Strategy Call →": "Agenda una Llamada de Estrategia Gratis →",

    # Stats
    "Average pipeline increase for clients in their first 6 months": "Aumento promedio de pipeline para clientes en sus primeros 6 meses",
    "Average reduction in cost-per-lead after AI automation implementation": "Reducción promedio en costo por lead después de implementar automatización IA",
    "Typical time to first measurable ROI on AI marketing systems": "Tiempo típico para el primer ROI medible en sistemas de marketing IA",

    # Services
    "AI Marketing Automation": "Automatización de Marketing con IA",
    "AEO & AI-First SEO": "AEO y SEO Impulsado por IA",
    "Autonomous AI Agents": "Agentes IA Autónomos",
    "Paid Media + AI Creative": "Medios Pagados + Creatividad con IA",

    # Pitch paragraph
    "NetWebMedia builds AI marketing systems for US brands — from autonomous content engines to full-funnel AI automation. We don't just write guides. We implement what's in them.": "NetWebMedia construye sistemas de marketing IA para marcas estadounidenses — desde motores de contenido autónomos hasta automatización IA de funnel completo. No solo escribimos guías. Implementamos lo que hay en ellas.",

    # Footer
    "AI-powered marketing for growing brands.": "Marketing potenciado por IA para marcas en crecimiento.",

    # Meta info
    "13 pages · By Priya Patel · Free download": "13 páginas · Por Priya Patel · Descarga gratis",
    "14 pages · By Carlos Rivera · Free download": "14 páginas · Por Carlos Rivera · Descarga gratis",
    "15 pages": "15 páginas",
    "13 pages": "13 páginas",
    "14 pages": "14 páginas",
    "Free download": "Descarga gratis",
}

def escape_attr(text):
    """Escape text for use in HTML attributes."""
    return text.replace('"', '&quot;')

def add_bilingual_attributes(html_content):
    """Add data-en/data-es attributes to translatable elements."""
    result = html_content

    # Process in order of most specific to least specific
    # Process headings first
    for pattern in [
        r'(<h1>)([^<]+)(</h1>)',
        r'(<h2>)([^<]+)(</h2>)',
        r'(<h3>)([^<]+)(</h3>)',
        r'(<h4>)([^<]+)(</h4>)',
    ]:
        def replacer_heading(match):
            open_tag, text, close_tag = match.group(1), match.group(2), match.group(3)
            text_clean = text.strip()

            # Skip if too short or already has attributes
            if len(text_clean) < 2 or 'data-en=' in open_tag:
                return match.group(0)

            spanish = TRANSLATIONS.get(text_clean, text_clean)
            if spanish == text_clean:  # No translation found
                return match.group(0)

            return f'{open_tag[:-1]} data-en="{escape_attr(text_clean)}" data-es="{escape_attr(spanish)}">{text}{close_tag}'

        result = re.sub(pattern, replacer_heading, result, flags=re.MULTILINE)

    # Process divs with class="tag"
    def replacer_tag(match):
        open_tag, text, close_tag = match.group(1), match.group(2), match.group(3)
        text_clean = text.strip()
        if len(text_clean) < 2 or 'data-en=' in open_tag:
            return match.group(0)
        spanish = TRANSLATIONS.get(text_clean, text_clean)
        if spanish == text_clean:
            return match.group(0)
        return f'{open_tag[:-1]} data-en="{escape_attr(text_clean)}" data-es="{escape_attr(spanish)}">{text}{close_tag}'

    result = re.sub(r'(<div class="tag">)([^<]+)(</div>)', replacer_tag, result)

    # Process paragraphs with specific classes
    for cls in ['lp-subtitle', 'lp-inside-sub', 'lp-meta']:
        pattern = f'(<p class="{cls}"[^>]*>)([^<]+)(</p>)'
        def replacer_p(match):
            open_tag, text, close_tag = match.group(1), match.group(2), match.group(3)
            text_clean = text.strip()
            if len(text_clean) < 2 or 'data-en=' in open_tag:
                return match.group(0)
            spanish = TRANSLATIONS.get(text_clean, text_clean)
            if spanish == text_clean:
                return match.group(0)
            return f'{open_tag[:-1]} data-en="{escape_attr(text_clean)}" data-es="{escape_attr(spanish)}">{text}{close_tag}'
        result = re.sub(pattern, replacer_p, result)

    # Process list items
    def replacer_li(match):
        open_tag, text, close_tag = match.group(1), match.group(2), match.group(3)
        text_clean = text.strip()
        if len(text_clean) < 2 or 'data-en=' in open_tag:
            return match.group(0)
        spanish = TRANSLATIONS.get(text_clean, text_clean)
        if spanish == text_clean:
            return match.group(0)
        return f'{open_tag[:-1]} data-en="{escape_attr(text_clean)}" data-es="{escape_attr(spanish)}">{text}{close_tag}'

    result = re.sub(r'(<li>)([^<]+)(</li>)', replacer_li, result)

    # Process stat labels
    def replacer_stat(match):
        open_tag, text, close_tag = match.group(1), match.group(2), match.group(3)
        text_clean = text.strip()
        if len(text_clean) < 2 or 'data-en=' in open_tag:
            return match.group(0)
        spanish = TRANSLATIONS.get(text_clean, text_clean)
        if spanish == text_clean:
            return match.group(0)
        return f'{open_tag[:-1]} data-en="{escape_attr(text_clean)}" data-es="{escape_attr(spanish)}">{text}{close_tag}'

    result = re.sub(r'(<div class="lp-stat-label">)([^<]+)(</div>)', replacer_stat, result)

    # Process download buttons with ↓ prefix
    def replacer_btn(match):
        open_tag, text, close_tag = match.group(1), match.group(2), match.group(3)
        full_text = f"↓ {text}"
        text_clean = full_text.strip()
        if len(text_clean) < 2 or 'data-en=' in open_tag:
            return match.group(0)
        spanish = TRANSLATIONS.get(text_clean, None)
        if not spanish:
            spanish = TRANSLATIONS.get(text.strip(), text.strip())
        return f'{open_tag[:-1]} data-en="{escape_attr(text_clean)}" data-es="{escape_attr(spanish)}">{full_text}{close_tag}'

    result = re.sub(r'(class="[^"]*lp-download-btn[^"]*"[^>]*>)↓ ([^<]+)(</[ab]>)', replacer_btn, result)

    # Process primary buttons
    def replacer_primary(match):
        open_tag, text, close_tag = match.group(1), match.group(2), match.group(3)
        text_clean = text.strip()
        if len(text_clean) < 2 or 'data-en=' in open_tag:
            return match.group(0)
        spanish = TRANSLATIONS.get(text_clean, text_clean)
        if spanish == text_clean:
            return match.group(0)
        return f'{open_tag[:-1]} data-en="{escape_attr(text_clean)}" data-es="{escape_attr(spanish)}">{text}{close_tag}'

    result = re.sub(r'(class="[^"]*btn-primary[^"]*"[^>]*>)([^<]+)(</a>)', replacer_primary, result)

    return result

def process_files():
    """Process all LP files."""
    lp_dir = Path('lp')
    skip_files = {'hubspot-ai-marketing-features.html'}

    files = sorted([f for f in lp_dir.glob('*.html') if f.name not in skip_files])

    print(f"Processing {len(files)} landing pages...\n")
    count = 0

    for lp_file in files:
        content = lp_file.read_text(encoding='utf-8')
        translated = add_bilingual_attributes(content)

        # Count pairs added (rough estimate)
        pairs = len(re.findall(r'data-en=', translated)) - len(re.findall(r'data-en=', content))

        lp_file.write_text(translated, encoding='utf-8')
        print(f"[OK] {lp_file.name:<45} +{pairs} pairs")
        count += 1

    print(f"\nDone! {count} files updated with bilingual attributes.")

if __name__ == '__main__':
    process_files()
