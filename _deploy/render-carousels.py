#!/usr/bin/env python3
"""
Render 15 Instagram carousel slides as 1080x1080 SVGs.

Three carousels (A, B, C) × 5 slides each, designed to seed the @netwebmedia
profile with brand-consistent evergreen content BEFORE the May 4 campaign
runs. See _deploy/social-channel-activation.md §1 for context.

Output: assets/social/carousels/{a,b,c}-slide-{1..5}.svg

Run: python3 _deploy/render-carousels.py
"""
from pathlib import Path
import textwrap
import html

OUT_DIR = Path(__file__).parent.parent / "assets" / "social" / "carousels"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ─── Slide content ────────────────────────────────────────────────────────────
# Each tuple: (carousel_letter, slide_number, eyebrow, headline_lines, body_lines)
# headline_lines: 1–2 strings, big display text
# body_lines: 2–3 strings, medium body text
SLIDES = [
    # Carousel A — "Who we are"
    ("a", 1, "WHO WE ARE",
     ["AI-native fractional", "CMO."],
     ["Strategy, content, and execution.",
      "1 senior operator + 12 AI agents.",
      "Same agency-grade output. Half the cost."]),
    ("a", 2, "WHAT WE DO",
     ["We get SMBs cited", "in ChatGPT."],
     ["AEO strategy, schema, content, outreach.",
      "Tracked monthly across Claude, GPT,",
      "Perplexity, and Google AI Overviews."]),
    ("a", 3, "WHO IT'S FOR",
     ["14 verticals.", "SMBs only."],
     ["Law firms. Hotels. Restaurants.",
      "Healthcare. Beauty. Automotive. More.",
      "No enterprise. No ad-agency bloat."]),
    ("a", 4, "TRACK RECORD",
     ["60 days to first", "ChatGPT citation."],
     ["340% average ROI.",
      "4.4x conversion vs traditional agency.",
      "+22% bookings on a 12-property chain."]),
    ("a", 5, "GET STARTED",
     ["Free AEO audit.", "$997 included."],
     ["100% credited toward your first",
      "retainer month if you decide",
      "to work with us."]),

    # Carousel B — "How NWM is different"
    ("b", 1, "THE PROBLEM",
     ["Agencies are", "bloated."],
     ["40 people. 6 weeks per deliverable.",
      "$20k/mo retainers.",
      "“Let me check with the team.”"]),
    ("b", 2, "OUR MODEL",
     ["1 senior operator.", "12 AI agents."],
     ["I (Carlos) set strategy.",
      "Talk to every client. Own every outcome.",
      "AI agents handle execution at speed."]),
    ("b", 3, "WHAT YOU SAVE",
     ["Faster. Cheaper.", "No middle layer."],
     ["Same agency-grade output.",
      "Half the cost.",
      "No account managers. No handoffs."]),
    ("b", 4, "WHAT YOU GET",
     ["Direct line to", "the founder."],
     ["Every client works with me from",
      "first call to last invoice.",
      "Bilingual EN/ES. WhatsApp business hours."]),
    ("b", 5, "GET ON A CALL",
     ["Book a 20-min", "strategy call."],
     ["No pitch. Just a real conversation",
      "about your AI visibility.",
      "netwebmedia.com/contact"]),

    # Carousel C — "What is AEO?"
    ("c", 1, "THE SHIFT",
     ["SEO is over.", "AEO is starting."],
     ["Buyers ask ChatGPT, not Google.",
      "The brands cited in those answers",
      "get the calls."]),
    ("c", 2, "THE NUMBERS",
     ["18% of search", "is AI now."],
     ["Growing 40% YoY.",
      "Google AI Overviews + Claude +",
      "Perplexity eat the top of every funnel."]),
    ("c", 3, "WHAT CHANGES",
     ["Schema beats", "backlinks."],
     ["FAQPage. Service. Organization markup.",
      "Tells AI engines how to cite you.",
      "Most sites have none of it."]),
    ("c", 4, "WHAT STILL MATTERS",
     ["Reviews still", "drive AI."],
     ["Google Local Pack feeds AI summaries.",
      "200+ recent reviews dominate.",
      "Under 100 = invisible to AI search."]),
    ("c", 5, "START FREE",
     ["Free AEO audit", "on your site."],
     ["We'll show you exactly what",
      "ChatGPT, Claude, and Perplexity",
      "see today."]),
]

# ─── SVG template ─────────────────────────────────────────────────────────────
TEMPLATE = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <title>NetWebMedia carousel slide {carousel_upper}-{slide_num} ({eyebrow_lower})</title>
  <desc>Instagram carousel slide. 1080x1080. Navy {bg_color} background, Orange {accent} accent. Brand: NetWebMedia.</desc>
  <defs>
    <radialGradient id="bgGlow{uid}" cx="20%" cy="15%" r="70%">
      <stop offset="0%" stop-color="#02206b" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#02206b" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="bgGlow2_{uid}" cx="80%" cy="85%" r="60%">
      <stop offset="0%" stop-color="#0d1f5c" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#0d1f5c" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="orangeRule{uid}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FF671F"/>
      <stop offset="100%" stop-color="#ff8c4a"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="1080" height="1080" fill="#010F3B"/>
  <rect width="1080" height="1080" fill="url(#bgGlow{uid})"/>
  <rect width="1080" height="1080" fill="url(#bgGlow2_{uid})"/>

  <!-- Top brand bar -->
  <rect x="60" y="60" width="64" height="6" fill="url(#orangeRule{uid})"/>
  <text x="140" y="80" font-family="'Poppins','Inter',system-ui,-apple-system,sans-serif" font-weight="800" font-size="22" fill="#fff" letter-spacing="0.5">NetWebMedia</text>

  <!-- Slide counter -->
  <text x="1020" y="80" text-anchor="end" font-family="'Inter',system-ui,sans-serif" font-weight="600" font-size="18" fill="#8892b0">{slide_num}/5</text>

  <!-- Eyebrow -->
  <text x="60" y="430" font-family="'Inter',system-ui,sans-serif" font-weight="700" font-size="22" fill="#FF671F" letter-spacing="6">{eyebrow}</text>

  <!-- Headline -->
{headline_svg}

  <!-- Body -->
  <text font-family="'Inter',system-ui,sans-serif" font-weight="400" font-size="32" fill="#c8d3e8">
{body_svg}
  </text>

  <!-- Footer -->
  <line x1="60" y1="990" x2="1020" y2="990" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
  <text x="60" y="1030" font-family="'Inter',system-ui,sans-serif" font-weight="700" font-size="22" fill="#FF671F">netwebmedia.com</text>
  <text x="1020" y="1030" text-anchor="end" font-family="'Inter',system-ui,sans-serif" font-weight="500" font-size="20" fill="#8892b0">@netwebmedia</text>
</svg>
"""

def render_headline(lines):
    """Render 1 or 2 headline lines as SVG <text> elements."""
    base_y = 540 if len(lines) == 1 else 540
    line_h = 110
    if len(lines) == 1:
        return f'  <text x="60" y="{base_y}" font-family="\'Poppins\',\'Inter\',system-ui,sans-serif" font-weight="800" font-size="92" fill="#ffffff" letter-spacing="-2">{html.escape(lines[0])}</text>'
    out = []
    for i, line in enumerate(lines):
        y = base_y + i * line_h
        out.append(f'  <text x="60" y="{y}" font-family="\'Poppins\',\'Inter\',system-ui,sans-serif" font-weight="800" font-size="92" fill="#ffffff" letter-spacing="-2">{html.escape(line)}</text>')
    return "\n".join(out)

def render_body(lines):
    """Render body lines as <tspan> children of a <text> element."""
    base_y = 800
    line_h = 48
    out = []
    for i, line in enumerate(lines):
        y = base_y + i * line_h
        out.append(f'    <tspan x="60" y="{y}">{html.escape(line)}</tspan>')
    return "\n".join(out)

def render_slide(carousel, num, eyebrow, headline, body):
    uid = f"{carousel}{num}"
    return TEMPLATE.format(
        carousel_upper=carousel.upper(),
        slide_num=num,
        eyebrow=eyebrow,
        eyebrow_lower=eyebrow.lower(),
        uid=uid,
        bg_color="#010F3B",
        accent="#FF671F",
        headline_svg=render_headline(headline),
        body_svg=render_body(body),
    )

def main():
    written = []
    for carousel, num, eyebrow, headline, body in SLIDES:
        path = OUT_DIR / f"{carousel}-slide-{num}.svg"
        path.write_text(render_slide(carousel, num, eyebrow, headline, body), encoding="utf-8")
        written.append(path.name)
    print(f"Wrote {len(written)} slide SVGs to {OUT_DIR}")
    for name in written:
        print(f"  {name}")

if __name__ == "__main__":
    main()
