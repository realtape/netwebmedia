#!/usr/bin/env python3
"""
build.py — Materialize per-post upload folders from inline POSTS data.

What it does:
  For each post in POSTS, creates:
    social/uploads/week-NN_<start>-<end>/YYYY-MM-DD_<day>_<HH-MM>_<channel>_<id>/
      ├── INSTRUCTIONS.md      (step-by-step for THIS upload)
      ├── caption.txt          (primary-language caption — paste this into MBS/TT)
      ├── caption-alt.txt      (secondary language, if both EN+ES exist)
      ├── hashtags.txt         (the hashtag stack — paste into FIRST COMMENT on IG)
      └── <asset files>        (copied from assets/social/* — drag these into uploader)

Plus:
  social/uploads/README.md     (top-level index, auto-regenerated)

How to use:
  cd <repo root>
  python social/uploads/_automation/build.py

  Re-run any time POSTS data below changes. Idempotent — old folders are
  removed and recreated (existing screenshots/logs in folders WILL be wiped,
  so don't store your proof-of-post screenshots inside upload folders).

Stdlib only. Python 3.8+.
"""

import os
import shutil
import sys
from datetime import date
from pathlib import Path


# ----------------------------------------------------------------------------
# Hashtag stacks (rotate to avoid IG suppression — see social/social-media-marketing-plan.md)
# ----------------------------------------------------------------------------

STACKS = {
    "A": "#AEO #AnswerEngineOptimization #AISearch #ChatGPTMarketing #SMBMarketing #FractionalCMO #AIMarketing #B2BMarketing",
    "B": "#AEOvsSEO #AISearch #MarketingStrategy #LocalSEO #SEO2026 #DigitalMarketing #SmallBusinessMarketing #MarketingAgency",
    "C": "#CaseStudy #MarketingROI #LeadGeneration #BusinessGrowth #SMBSuccess #MarketingResults #AEOResults #GrowthMarketing",
}


# ----------------------------------------------------------------------------
# POSTS — source of truth. Edit here, re-run script.
# Aligned with social/posting-calendar.md
# ----------------------------------------------------------------------------

POSTS = [
    # ============================================================
    # WEEK 5 — May 28 → Jun 1 (Tourism + Restaurants refresh)
    # ============================================================
    {
        "date": "2026-05-28", "day": "thu", "time": "19:00", "week": 5,
        "channel": "tiktok", "type": "reel",
        "asset_path": "assets/social/campaign/reel_aeo_en.mp4",
        "caption_en": "Your customers asked AI about your business this week. You weren't there.",
        "caption_es": "Tus clientes le preguntaron a la IA por tu negocio esta semana. No te encontró.",
        "primary": "en",
        "hashtags": "#AEO #SmallBusiness #FYP #MarketingTips",
        "notes": "Wk5 Thu — AEO hook EN (existing reel)",
    },
    {
        "date": "2026-05-29", "day": "fri", "time": "11:00", "week": 5,
        "channel": "ig-fb", "type": "carousel",
        "asset_glob": "assets/social/carousels/c-slide-*.png",
        "caption_en": "12 AI citations in 60 days. Anonymized client win — full breakdown ↓\n\nSave this if your buyer asks ChatGPT before they Google you. Free AEO Index check: link in bio.",
        "caption_es": "12 citas en IA en 60 días. Caso anónimo, desglose abajo ↓\n\nGuarda esto si tu cliente pregunta a ChatGPT antes de Google. Test AEO gratis: link en bio.",
        "primary": "en",
        "stack": "C",
        "notes": "Wk5 Fri — Carousel C (client-win)",
    },
    {
        "date": "2026-05-29", "day": "fri", "time": "16:00", "week": 5,
        "channel": "youtube-short", "type": "youtube",
        "title": "Why your law firm doesn't show up in ChatGPT (and the 3-step fix)",
        "notes": "Cut from this week's Mon long-form. Pin first comment with /aeo-index.html link.",
    },
    {
        "date": "2026-05-30", "day": "sat", "time": "18:00", "week": 5,
        "channel": "ig-fb", "type": "reel-substitute",
        "asset_path": "assets/social/ig-identity-card.png",
        "caption_en": "30-second AEO Index check at netwebmedia.com/aeo-index. Save the score. We'll show you how it doubles in 60 days.",
        "caption_es": "Test AEO gratis de 30 segundos en netwebmedia.com/aeo-index. Guarda el puntaje. Verás cómo se duplica en 60 días.",
        "primary": "en",
        "stack": "C",
        "notes": "Wk5 Sat — IG identity card (Reel #2 sub; HeyGen for Wk8+)",
    },
    {
        "date": "2026-06-01", "day": "mon", "time": "11:00", "week": 5,
        "channel": "ig-fb", "type": "carousel",
        "asset_glob": "assets/social/carousels/a-slide-*.png",
        "caption_en": "AEO has replaced SEO. Here's the 5-slide breakdown. Save it. Send it to your marketing team.",
        "caption_es": "AEO reemplazó al SEO. Resumen en 5 slides. Guárdalo. Mándaselo a tu equipo.",
        "primary": "en",
        "stack": "A",
        "notes": "Wk5 Mon — Carousel A (brand intro)",
    },
    {
        "date": "2026-06-01", "day": "mon", "time": "15:00", "week": 5,
        "channel": "youtube-long", "type": "youtube",
        "title": "Why AEO Beat SEO in 2026 — Full 12-min breakdown for SMBs",
        "notes": "Recorded Wed prior. First 100 chars of description = AI-Overviews bait. Custom thumbnail (navy + orange + face/number).",
    },
    {
        "date": "2026-06-01", "day": "mon", "time": "19:00", "week": 5,
        "channel": "tiktok", "type": "reel",
        "asset_path": "assets/social/campaign/reel_aeo_es.mp4",
        "caption_es": "Si la IA no te conoce, tu cliente tampoco. Esto es AEO en 30 segundos.",
        "primary": "es",
        "hashtags": "#AEO #PymeChile #MarketingDigital #FYP",
        "notes": "Wk5 Mon — AEO hook ES (existing reel)",
    },

    # ============================================================
    # WEEK 6 — Jun 2 → Jun 8 (Automotive + paid mid-cycle)
    # ============================================================
    {
        "date": "2026-06-02", "day": "tue", "time": "12:00", "week": 6,
        "channel": "ig-fb", "type": "reel",
        "asset_path": "assets/social/campaign/reel_growth_en.mp4",
        "caption_en": "$997 audit. 100% credited to your retainer. The math is obvious.",
        "caption_es": "Auditoría $997. 100% se acredita a tu retainer. La matemática es obvia.",
        "primary": "en",
        "stack": "A",
        "notes": "Wk6 Tue — Growth pitch reel",
    },
    {
        "date": "2026-06-03", "day": "wed", "time": "11:00", "week": 6,
        "channel": "ig-fb", "type": "carousel",
        "asset_glob": "assets/social/campaign/carousels/cmo_growth_en/*.png",
        "caption_en": "CMO Growth = $999/mo. Strategy + execution + reporting. One retainer. Swipe for what's included →",
        "caption_es": "CMO Growth = $999/mes. Estrategia + ejecución + reportes. Un solo retainer. Desliza para ver qué incluye →",
        "primary": "en",
        "stack": "B",
        "notes": "Wk6 Wed — 7-slide CMO Growth (EN)",
    },
    {
        "date": "2026-06-03", "day": "wed", "time": "16:30", "week": 6,
        "channel": "youtube-short", "type": "youtube",
        "title": "AEO vs Local SEO for restaurants — which one moves the needle first?",
    },
    {
        "date": "2026-06-04", "day": "thu", "time": "19:00", "week": 6,
        "channel": "tiktok", "type": "reel",
        "asset_path": "assets/social/campaign/reel_growth_es.mp4",
        "caption_es": "Una sola cuota. Estrategia, software y ejecución. CMO Growth desde $999. Link en bio.",
        "primary": "es",
        "hashtags": "#FractionalCMO #PymeMarketing #FYP #PymeChile",
        "notes": "Wk6 Thu — Growth pitch ES",
    },
    {
        "date": "2026-06-05", "day": "fri", "time": "11:00", "week": 6,
        "channel": "ig-fb", "type": "carousel",
        "asset_glob": "assets/social/campaign/carousels/cmo_scale_en/*.png",
        "caption_en": "Premium tier teaser — CMO Premium $2,490/mo when you're past validation. Multi-channel, ad spend included up to a tier. Swipe →",
        "caption_es": "Tier Premium — CMO Premium $2,490/mes cuando ya validaste. Multi-canal, ad spend incluido hasta cierto nivel. Desliza →",
        "primary": "en",
        "stack": "B",
        "notes": "Wk6 Fri — 7-slide CMO Scale/Premium teaser (EN)",
    },
    {
        "date": "2026-06-05", "day": "fri", "time": "16:00", "week": 6,
        "channel": "youtube-short", "type": "youtube",
        "title": "When to upgrade from $999 to $2,490 — 3 signals",
    },
    {
        "date": "2026-06-06", "day": "sat", "time": "18:00", "week": 6,
        "channel": "ig-fb", "type": "reel",
        "asset_path": "assets/social/campaign/reel_scale_en.mp4",
        "caption_en": "If you're past validation but stuck at $20k/mo MRR — that's the CMO Premium pivot. 6-week brief.",
        "caption_es": "Si ya validaste pero estás atascado en $20k/mes — ese es el pivote a CMO Premium. Brief de 6 semanas.",
        "primary": "en",
        "stack": "B",
        "notes": "Wk6 Sat — Scale/Premium reel EN",
    },
    {
        "date": "2026-06-08", "day": "mon", "time": "11:00", "week": 6,
        "channel": "ig-fb", "type": "carousel",
        "asset_glob": "assets/social/carousels/b-slide-*.png",
        "caption_en": "AEO vs Google Maps vs PPC — which one wins for your niche? 5-slide channel matrix ↓",
        "caption_es": "AEO vs Google Maps vs PPC — ¿cuál gana en tu nicho? Matriz de canales en 5 slides ↓",
        "primary": "en",
        "stack": "B",
        "notes": "Wk6 Mon — Carousel B (channel matrix)",
    },
    {
        "date": "2026-06-08", "day": "mon", "time": "15:00", "week": 6,
        "channel": "youtube-long", "type": "youtube",
        "title": "AEO vs Local SEO — Full Channel Decision Matrix",
    },
    {
        "date": "2026-06-08", "day": "mon", "time": "19:00", "week": 6,
        "channel": "tiktok", "type": "reel",
        "asset_path": "assets/social/campaign/reel_scale_es.mp4",
        "caption_es": "Tres señales de que ya pasaste de Growth a Premium. ¿Te suena alguna?",
        "primary": "es",
        "hashtags": "#FractionalCMO #ScaleUp #FYP",
        "notes": "Wk6 Mon — Scale pitch ES",
    },

    # ============================================================
    # WEEK 7 — Jun 9 → Jun 15 (Home services + WhatsApp launch)
    # ============================================================
    {
        "date": "2026-06-09", "day": "tue", "time": "12:00", "week": 7,
        "channel": "ig-fb", "type": "reel",
        "asset_path": "assets/social/campaign/reel_aeo_en.mp4",
        "caption_en": "Plumbers, electricians, landscapers — ChatGPT already recommends 3 of them per query. Are you the fourth?",
        "caption_es": "Plomeros, electricistas, paisajistas — ChatGPT ya recomienda 3 por consulta. ¿Eres el cuarto?",
        "primary": "en",
        "stack": "C",
        "notes": "Wk7 Tue — AEO hook reel, re-captioned for home services",
    },
    {
        "date": "2026-06-10", "day": "wed", "time": "11:00", "week": 7,
        "channel": "ig-fb", "type": "carousel",
        "asset_glob": "assets/social/campaign/carousels/aeo_en/*.png",
        "caption_en": "AEO in 7 slides — what it is, who wins, the 3-step starting move. Save + share with your team.",
        "caption_es": "AEO en 7 slides — qué es, quién gana, el movimiento inicial en 3 pasos. Guarda + comparte.",
        "primary": "en",
        "stack": "A",
        "notes": "Wk7 Wed — 7-slide AEO carousel (EN)",
    },
    {
        "date": "2026-06-10", "day": "wed", "time": "16:30", "week": 7,
        "channel": "youtube-short", "type": "youtube",
        "title": "The 3-step AEO move every SMB can ship in 7 days",
    },
    {
        "date": "2026-06-11", "day": "thu", "time": "19:00", "week": 7,
        "channel": "tiktok", "type": "reel",
        "asset_path": "assets/social/campaign/reel_aeo_es.mp4",
        "caption_es": "Si vendes servicios a domicilio, esto es tu canal. AEO + Google Maps. Aquí está el porqué.",
        "primary": "es",
        "hashtags": "#ServiciosLocales #PymeMarketing #FYP",
        "notes": "Wk7 Thu — AEO hook ES re-captioned for home services",
    },
    {
        "date": "2026-06-12", "day": "fri", "time": "11:00", "week": 7,
        "channel": "ig-fb", "type": "carousel",
        "asset_glob": "assets/social/carousels/c-slide-*.png",
        "caption_en": "Home services client — 4 new retainers in 90 days from AEO alone. Anonymized teardown ↓",
        "caption_es": "Cliente servicios a domicilio — 4 retainers nuevos en 90 días solo con AEO. Desglose anónimo ↓",
        "primary": "en",
        "stack": "C",
        "notes": "Wk7 Fri — Carousel C (client-win, home services)",
    },
    {
        "date": "2026-06-12", "day": "fri", "time": "16:00", "week": 7,
        "channel": "youtube-short", "type": "youtube",
        "title": "Anonymized client teardown — what we changed in 30 days",
    },
    {
        "date": "2026-06-13", "day": "sat", "time": "18:00", "week": 7,
        "channel": "ig-fb", "type": "reel-substitute",
        "asset_path": "assets/social/ig-aeo-stat.png",
        "caption_en": "1 stat. AEO traffic compounds 11x faster than paid social over 90 days. Source: our own audit data, n=24.",
        "caption_es": "1 dato. El tráfico AEO compone 11x más rápido que el social pagado en 90 días. Fuente: nuestras auditorías, n=24.",
        "primary": "en",
        "stack": "A",
        "notes": "Wk7 Sat — IG AEO stat card",
    },
    {
        "date": "2026-06-15", "day": "mon", "time": "11:00", "week": 7,
        "channel": "ig-fb", "type": "carousel",
        "asset_glob": "assets/social/carousels/a-slide-*.png",
        "caption_en": "AEO fundamentals, refreshed. Same 5 slides, new caption. Why? Because AI search just hit 14% of US informational queries.",
        "caption_es": "Fundamentos AEO, actualizados. Mismas 5 slides, nuevo caption. ¿Por qué? Porque la búsqueda con IA ya es el 14% de consultas informativas en US.",
        "primary": "en",
        "stack": "A",
        "notes": "Wk7 Mon — Carousel A rotated",
    },
    {
        "date": "2026-06-15", "day": "mon", "time": "15:00", "week": 7,
        "channel": "youtube-long", "type": "youtube",
        "title": "Home Services AEO — Full Playbook (12 min)",
    },
    {
        "date": "2026-06-15", "day": "mon", "time": "19:00", "week": 7,
        "channel": "tiktok", "type": "reel",
        "asset_path": "assets/social/campaign/reel_growth_en.mp4",
        "caption_en": "$997 → 100% retainer credit. Why most agencies won't structure their pricing this way.",
        "caption_es": "$997 → 100% crédito al retainer. Por qué la mayoría de agencias no se atreve a estructurar el precio así.",
        "primary": "en",
        "hashtags": "#FractionalCMO #SmallBusiness #FYP",
        "notes": "Wk7 Mon — Growth reel re-captioned",
    },

    # ============================================================
    # WEEK 8 — Jun 16 → Jun 22 (Wine + HeyGen renders enter rotation)
    # ============================================================
    {
        "date": "2026-06-16", "day": "tue", "time": "12:00", "week": 8,
        "channel": "ig-fb", "type": "reel",
        "asset_path": "assets/social/heygen/01-aeo-hook-en.mp4",
        "caption_en": "Your customers asked AI about your business this week. You weren't there. Free AEO Index check — link in bio.",
        "primary": "en",
        "stack": "A",
        "notes": "Wk8 Tue — HeyGen #1 (Carlos avatar, AEO hook EN)",
    },
    {
        "date": "2026-06-17", "day": "wed", "time": "11:00", "week": 8,
        "channel": "ig-fb", "type": "carousel",
        "asset_glob": "assets/social/carousels/b-slide-*.png",
        "caption_en": "Wine, vineyards, agritourism — AEO vs Maps vs paid. Which one earns the most cellar-door bookings? 5 slides ↓",
        "caption_es": "Viñas, bodegas, agroturismo — AEO vs Maps vs pagados. ¿Cuál genera más reservas? 5 slides ↓",
        "primary": "en",
        "stack": "B",
        "notes": "Wk8 Wed — Carousel B re-captioned for wine niche",
    },
    {
        "date": "2026-06-17", "day": "wed", "time": "16:30", "week": 8,
        "channel": "youtube-short", "type": "youtube",
        "title": "Wine + agritourism — AEO playbook in 60 seconds",
    },
    {
        "date": "2026-06-18", "day": "thu", "time": "19:00", "week": 8,
        "channel": "tiktok", "type": "reel",
        "asset_path": "assets/social/heygen/02-audit-teaser-en.mp4",
        "caption_en": "Free 30-second AEO Index. Score, then watch us double it in 60 days.",
        "primary": "en",
        "hashtags": "#AEO #SmallBusiness #FYP",
        "notes": "Wk8 Thu — HeyGen #2 (audit teaser EN)",
    },
    {
        "date": "2026-06-19", "day": "fri", "time": "11:00", "week": 8,
        "channel": "ig-fb", "type": "carousel",
        "asset_glob": "assets/social/carousels/c-slide-*.png",
        "caption_en": "Anonymized winery — 6 new tasting-room bookings/week after a 30-day AEO sprint. The exact 3 fixes ↓",
        "caption_es": "Viña anónima — 6 reservas nuevas/semana tras sprint AEO de 30 días. Las 3 correcciones exactas ↓",
        "primary": "en",
        "stack": "C",
        "notes": "Wk8 Fri — Carousel C (winery proof)",
    },
    {
        "date": "2026-06-19", "day": "fri", "time": "16:00", "week": 8,
        "channel": "youtube-short", "type": "youtube",
        "title": "3 AEO fixes any winery can ship in a weekend",
    },
    {
        "date": "2026-06-20", "day": "sat", "time": "18:00", "week": 8,
        "channel": "ig-fb", "type": "reel",
        "asset_path": "assets/social/heygen/03-client-win-en.mp4",
        "caption_en": "12 AI citations in 60 days. One retainer client. The teardown is up at netwebmedia.com.",
        "primary": "en",
        "stack": "C",
        "notes": "Wk8 Sat — HeyGen #3 (client win EN)",
    },
    {
        "date": "2026-06-22", "day": "mon", "time": "11:00", "week": 8,
        "channel": "ig-fb", "type": "carousel",
        "asset_glob": "assets/social/carousels/a-slide-*.png",
        "caption_en": "AEO fundamentals, week 8. Same 5 slides. New question for you: who in your industry just got cited that you didn't?",
        "caption_es": "Fundamentos AEO, semana 8. Mismas 5 slides. Nueva pregunta: ¿quién en tu industria ya fue citado y tú no?",
        "primary": "en",
        "stack": "A",
        "notes": "Wk8 Mon — Carousel A rotated",
    },
    {
        "date": "2026-06-22", "day": "mon", "time": "15:00", "week": 8,
        "channel": "youtube-long", "type": "youtube",
        "title": "Wineries & AEO — 12-min Playbook",
    },
    {
        "date": "2026-06-22", "day": "mon", "time": "19:00", "week": 8,
        "channel": "tiktok", "type": "reel",
        "asset_path": "assets/social/heygen/04-retainer-credit-en.mp4",
        "caption_en": "$997 audit. 100% credited to retainer. We're betting on you. Most agencies bet against you.",
        "primary": "en",
        "hashtags": "#FractionalCMO #SmallBusiness #FYP",
        "notes": "Wk8 Mon — HeyGen #4 (retainer credit EN)",
    },

    # ============================================================
    # WEEK 9 — Jun 23 → Jun 29 (Events + weddings, Spanish-led)
    # ============================================================
    {
        "date": "2026-06-23", "day": "tue", "time": "12:00", "week": 9,
        "channel": "ig-fb", "type": "reel",
        "asset_path": "assets/social/heygen/07-aeo-hook-es.mp4",
        "caption_es": "Tus clientes le preguntaron a la IA esta semana. No te encontró. Test AEO gratis — link en bio.",
        "primary": "es",
        "stack": "A",
        "notes": "Wk9 Tue — HeyGen #7 (AEO hook ES)",
    },
    {
        "date": "2026-06-24", "day": "wed", "time": "11:00", "week": 9,
        "channel": "ig-fb", "type": "carousel",
        "asset_glob": "assets/social/campaign/carousels/aeo_es/*.png",
        "caption_en": "AEO in 7 slides — Spanish-first edition. Save + share with your team.",
        "caption_es": "AEO en 7 slides — edición en español. Guarda + comparte.",
        "primary": "es",
        "stack": "A",
        "notes": "Wk9 Wed — 7-slide AEO ES",
    },
    {
        "date": "2026-06-24", "day": "wed", "time": "16:30", "week": 9,
        "channel": "youtube-short", "type": "youtube",
        "title": "Wedding planners — why your 'best of' lists matter for AI search",
    },
    {
        "date": "2026-06-25", "day": "thu", "time": "19:00", "week": 9,
        "channel": "tiktok", "type": "reel",
        "asset_path": "assets/social/heygen/08-audit-teaser-es.mp4",
        "caption_es": "Test AEO gratis. 30 segundos. Luego te mostramos cómo se duplica el puntaje en 60 días.",
        "primary": "es",
        "hashtags": "#AEO #PymeChile #FYP",
        "notes": "Wk9 Thu — HeyGen #8 (audit teaser ES)",
    },
    {
        "date": "2026-06-26", "day": "fri", "time": "11:00", "week": 9,
        "channel": "ig-fb", "type": "carousel",
        "asset_glob": "assets/social/campaign/carousels/cmo_growth_es/*.png",
        "caption_es": "CMO Growth $999/mes — qué incluye, qué no, y por qué no cobramos $5K.",
        "primary": "es",
        "stack": "B",
        "notes": "Wk9 Fri — 7-slide CMO Growth ES",
    },
    {
        "date": "2026-06-26", "day": "fri", "time": "16:00", "week": 9,
        "channel": "youtube-short", "type": "youtube",
        "title": "$999 vs $5K — why our pricing is structured this way",
    },
    {
        "date": "2026-06-27", "day": "sat", "time": "18:00", "week": 9,
        "channel": "ig-fb", "type": "reel",
        "asset_path": "assets/social/heygen/09-client-win-es.mp4",
        "caption_es": "12 citas en IA en 60 días. Caso real anonimizado. Desglose completo en netwebmedia.com.",
        "primary": "es",
        "stack": "C",
        "notes": "Wk9 Sat — HeyGen #9 (client win ES)",
    },
    {
        "date": "2026-06-29", "day": "mon", "time": "11:00", "week": 9,
        "channel": "ig-fb", "type": "carousel",
        "asset_glob": "assets/social/campaign/carousels/cmo_scale_es/*.png",
        "caption_es": "Tier Premium — $2,490/mes cuando ya validaste. Aquí está la diferencia con Growth →",
        "primary": "es",
        "stack": "B",
        "notes": "Wk9 Mon — 7-slide CMO Scale ES",
    },
    {
        "date": "2026-06-29", "day": "mon", "time": "15:00", "week": 9,
        "channel": "youtube-long", "type": "youtube",
        "title": "AEO para eventos y bodas — Playbook 12 minutos (Spanish)",
    },
    {
        "date": "2026-06-29", "day": "mon", "time": "19:00", "week": 9,
        "channel": "tiktok", "type": "reel",
        "asset_path": "assets/social/heygen/10-retainer-credit-es.mp4",
        "caption_es": "$997 auditoría. 100% crédito al retainer. Apostamos a tu favor. La mayoría apuesta en contra.",
        "primary": "es",
        "hashtags": "#FractionalCMO #PymeChile #FYP",
        "notes": "Wk9 Mon — HeyGen #10 (retainer credit ES)",
    },

    # ============================================================
    # WEEK 10 — Jun 30 → Jul 6 (Beauty + WhatsApp cycle 2)
    # ============================================================
    {
        "date": "2026-06-30", "day": "tue", "time": "12:00", "week": 10,
        "channel": "ig-fb", "type": "reel",
        "asset_path": "assets/social/heygen/05-niche-pivot-en.mp4",
        "caption_en": "Why law firms (and dentists, and realtors) are winning at AEO right now — 30-sec rundown.",
        "primary": "en",
        "stack": "A",
        "notes": "Wk10 Tue — HeyGen #5 (niche pivot EN)",
    },
    {
        "date": "2026-07-01", "day": "wed", "time": "11:00", "week": 10,
        "channel": "ig-fb", "type": "carousel",
        "asset_glob": "assets/social/carousels/b-slide-*.png",
        "caption_en": "Salons + spas — your IG game is strong. Your AEO game is zero. Here's the 5-slide fix.",
        "caption_es": "Salones + spas — el juego de IG es fuerte. El de AEO en cero. Aquí está la corrección en 5 slides.",
        "primary": "en",
        "stack": "B",
        "notes": "Wk10 Wed — Carousel B re-captioned for beauty",
    },
    {
        "date": "2026-07-01", "day": "wed", "time": "16:30", "week": 10,
        "channel": "youtube-short", "type": "youtube",
        "title": "Why beauty businesses lose AEO even with great IG",
    },
    {
        "date": "2026-07-02", "day": "thu", "time": "19:00", "week": 10,
        "channel": "tiktok", "type": "reel",
        "asset_path": "assets/social/heygen/06-tuesday-brief-en.mp4",
        "caption_en": "Every Tuesday 9 AM. One AEO move you can ship by Friday. Sub at netwebmedia.com/blog.",
        "primary": "en",
        "hashtags": "#AEO #FractionalCMO #FYP",
        "notes": "Wk10 Thu — HeyGen #6 (Tue Brief promo EN)",
    },
    {
        "date": "2026-07-03", "day": "fri", "time": "11:00", "week": 10,
        "channel": "ig-fb", "type": "carousel",
        "asset_glob": "assets/social/carousels/c-slide-*.png",
        "caption_en": "Anonymized salon — 18 new bookings/wk from AI search alone. The 3 fixes ↓",
        "caption_es": "Salón anónimo — 18 reservas/sem solo desde búsqueda con IA. Las 3 correcciones ↓",
        "primary": "en",
        "stack": "C",
        "notes": "Wk10 Fri — Carousel C (beauty proof)",
    },
    {
        "date": "2026-07-03", "day": "fri", "time": "16:00", "week": 10,
        "channel": "youtube-short", "type": "youtube",
        "title": "Salon AEO — 3 fixes that took 4 hours",
    },
    {
        "date": "2026-07-04", "day": "sat", "time": "18:00", "week": 10,
        "channel": "ig-fb", "type": "reel",
        "asset_path": "assets/social/heygen/11-niche-pivot-es.mp4",
        "caption_es": "Abogados, dentistas, inmobiliarias — están ganando con AEO ahora mismo. Esto es por qué.",
        "primary": "es",
        "stack": "A",
        "notes": "Wk10 Sat — HeyGen #11 (niche pivot ES)",
    },
    {
        "date": "2026-07-06", "day": "mon", "time": "11:00", "week": 10,
        "channel": "ig-fb", "type": "carousel",
        "asset_glob": "assets/social/carousels/a-slide-*.png",
        "caption_en": "AEO fundamentals — Week 10 close. 6-week recap on the blog. Q3 plan locks Jul 30.",
        "caption_es": "Fundamentos AEO — cierre semana 10. Resumen de 6 semanas en el blog. Plan Q3 se cierra 30 jul.",
        "primary": "en",
        "stack": "A",
        "notes": "Wk10 Mon — Carousel A rotated",
    },
    {
        "date": "2026-07-06", "day": "mon", "time": "15:00", "week": 10,
        "channel": "youtube-long", "type": "youtube",
        "title": "Beauty + AEO — 12-min Playbook",
    },
    {
        "date": "2026-07-06", "day": "mon", "time": "19:00", "week": 10,
        "channel": "tiktok", "type": "reel",
        "asset_path": "assets/social/heygen/12-tuesday-brief-es.mp4",
        "caption_es": "Todos los martes 9 AM. Una jugada AEO para enviar el viernes. Suscríbete en netwebmedia.com/blog.",
        "primary": "es",
        "hashtags": "#AEO #PymeChile #FYP",
        "notes": "Wk10 Mon — HeyGen #12 (Tue Brief promo ES)",
    },

    # ============================================================
    # WEEK 11 — Jul 7 → Jul 9 (partial — next cycle planning lock)
    # ============================================================
    {
        "date": "2026-07-07", "day": "tue", "time": "12:00", "week": 11,
        "channel": "ig-fb", "type": "reel",
        "asset_path": "assets/social/heygen/01-aeo-hook-en.mp4",
        "caption_en": "Mid-90-day check: where are you on AEO? Rotate this hook for week 11.",
        "primary": "en",
        "stack": "A",
        "notes": "Wk11 Tue — HeyGen #1 rotated (mid-90 check)",
    },
    {
        "date": "2026-07-08", "day": "wed", "time": "11:00", "week": 11,
        "channel": "ig-fb", "type": "carousel",
        "asset_glob": "assets/social/carousels/b-slide-*.png",
        "caption_en": "Mid-90 channel matrix refresh.",
        "primary": "en",
        "stack": "B",
        "notes": "Wk11 Wed — Carousel B rotated",
    },
    {
        "date": "2026-07-09", "day": "thu", "time": "19:00", "week": 11,
        "channel": "tiktok", "type": "reel",
        "asset_path": "assets/social/heygen/02-audit-teaser-en.mp4",
        "caption_en": "Free AEO Index — drop your URL, get a score.",
        "primary": "en",
        "hashtags": "#AEO #SmallBusiness #FYP",
        "notes": "Wk11 Thu — HeyGen #2 rotated",
    },
]


# ----------------------------------------------------------------------------
# Channel-specific upload instructions
# ----------------------------------------------------------------------------

INSTRUCTIONS_BY_CHANNEL = {
    "tiktok": """
## Where to upload

**TikTok** — open https://www.tiktok.com/upload on desktop (NWM Chrome profile).

## Steps

1. Drag `{asset_filename}` into the upload box.
2. Paste `caption.txt` contents into the caption field (TikTok caps at ~100 chars; we kept under).
3. Append hashtags from `hashtags.txt` directly in the caption (TikTok shows hashtags inline, not in first comment).
4. Set audience: "Everyone". No duets/stitches restriction.
5. Schedule to {date} at {time} America/Santiago (CLT). TikTok allows scheduling up to 10 days ahead.
6. Publish.

## After it fires

- Reply to first 5 comments within 60 min — TikTok promotes engaging creators.
- Screenshot the live post and save to `social/posting-log.md` (create if missing).
""",
    "ig-fb": """
## Where to upload

**Meta Business Suite Scheduler** — open https://business.facebook.com/latest/posts/scheduled_posts and click "Create post."

## Steps

1. Pick destination: **Instagram + Facebook** (mirrored).
2. Drag the asset(s) into the upload box:
   - For carousel posts: drag ALL slide PNGs in order (1, 2, 3, ...).
   - For Reel posts: drag the single MP4.
3. Paste the primary caption from `caption.txt` into the caption field.
4. **DO NOT** include hashtags in the caption — IG ranks better with hashtags in the first comment.
5. Schedule to {date} at {time} America/Santiago (CLT). MBS allows scheduling up to 75 days ahead.
6. Save / Schedule the post.
7. After it publishes, immediately go to the post → tap comment → paste `hashtags.txt` contents as the **first comment**.

## After it fires

- Reply to any DM / comment within the first 2 hours — IG correlates early replies with reach.
- Reshare to Story if the post hits >25 saves or >5 comments.
- Screenshot and log in `social/posting-log.md`.
""",
    "youtube-short": """
## Where to upload

**YouTube Studio** — open https://studio.youtube.com/ → Create → Upload videos.

## This is a Short

1. Title: see `INSTRUCTIONS.md` body below — copy the exact title.
2. Title MUST be <= 60 chars and ends with a question (or strong hook).
3. Upload your video (this folder is intentionally empty for assets — cut the Short from this week's long-form recording).
4. Schedule publish to {date} at {time} America/Santiago (CLT).
5. Set as "Made for kids: No". Tags: AEO, fractional CMO, AI search.

## After it fires

- Pin a first comment with a link to /aeo-index.html or /pricing.html.
- If watch-through is >40% at 24h, queue a follow-up Short on the same topic.
""",
    "youtube-long": """
## Where to upload

**YouTube Studio** — open https://studio.youtube.com/ → Create → Upload videos.

## This is a long-form

1. Title: copy exactly from the INSTRUCTIONS body below. Format: "<Question buyers ask AI> | NetWebMedia"
2. First 100 chars of description matter most for AI Overviews citation — front-load the key terms.
3. Custom thumbnail required: navy bg + orange accent + your face OR a giant number.
4. Schedule publish to {date} at {time} America/Santiago (CLT).
5. Add chapters in description (timestamps).
6. End screen: subscribe + linked playlist.

## After it fires

- Pin a first comment with /aeo-index.html link.
- Tag the corresponding industry hub in description.
- Cut 2 Shorts from this video on Wed (for Wed 16:30 and Fri 16:00 slots).
""",
}


# ----------------------------------------------------------------------------
# Build logic
# ----------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parents[3]
UPLOADS_DIR = REPO_ROOT / "social" / "uploads"


def week_bounds(week):
    """Return (start_date_str, end_date_str) for a given campaign week."""
    bounds = {
        5: ("may-28", "jun-01"),
        6: ("jun-02", "jun-08"),
        7: ("jun-09", "jun-15"),
        8: ("jun-16", "jun-22"),
        9: ("jun-23", "jun-29"),
        10: ("jun-30", "jul-06"),
        11: ("jul-07", "jul-13"),
    }
    return bounds.get(week, ("unknown", "unknown"))


def slugify_time(t):
    return t.replace(":", "-")


def channel_slug(c):
    return c  # already clean


def folder_name(p, idx):
    return f"{p['date']}_{p['day']}_{slugify_time(p['time'])}_{channel_slug(p['channel'])}_{idx:03d}"


def hashtags_text(p):
    if "stack" in p:
        return STACKS[p["stack"]]
    if "hashtags" in p:
        return p["hashtags"]
    return ""


def primary_caption_text(p):
    primary = p.get("primary", "en")
    if primary == "es":
        return p.get("caption_es") or p.get("caption_en") or ""
    return p.get("caption_en") or p.get("caption_es") or ""


def alt_caption_text(p):
    primary = p.get("primary", "en")
    if primary == "es":
        return p.get("caption_en") or ""
    return p.get("caption_es") or ""


def resolve_assets(p):
    """Return list of absolute Paths to copy."""
    paths = []
    if "asset_path" in p:
        abs_p = REPO_ROOT / p["asset_path"]
        if abs_p.exists():
            paths.append(abs_p)
        else:
            print(f"  WARN: missing asset {p['asset_path']}", file=sys.stderr)
    if "asset_glob" in p:
        glob_parts = p["asset_glob"].split("/")
        parent = REPO_ROOT.joinpath(*glob_parts[:-1])
        pattern = glob_parts[-1]
        if parent.exists():
            matched = sorted(parent.glob(pattern))
            if not matched:
                print(f"  WARN: glob {p['asset_glob']} matched 0 files", file=sys.stderr)
            paths.extend(matched)
        else:
            print(f"  WARN: glob parent dir missing {parent}", file=sys.stderr)
    return paths


def write_instructions(folder, p, asset_filenames):
    template = INSTRUCTIONS_BY_CHANNEL.get(p["channel"], "")
    asset_filename = asset_filenames[0] if asset_filenames else "(no asset — see notes)"
    body = template.format(
        asset_filename=asset_filename,
        date=p["date"],
        time=p["time"],
    )

    lines = [
        f"# {p['date']} {p['day'].upper()} {p['time']} — {p['channel'].upper()}",
        "",
        f"**Week {p['week']}** · {p.get('notes', '')}",
        "",
    ]
    if p.get("title"):
        lines.append(f"## YouTube title")
        lines.append("")
        lines.append(f"> {p['title']}")
        lines.append("")
    lines.append("---")
    lines.append("")
    lines.append(body.strip())
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## Files in this folder")
    lines.append("")
    if asset_filenames:
        for f in asset_filenames:
            lines.append(f"- `{f}` — drag this into the uploader")
    else:
        lines.append("- (no asset files — content is record-on-Wed video)")
    lines.append("- `caption.txt` — primary caption (copy-paste)")
    if alt_caption_text(p):
        lines.append("- `caption-alt.txt` — secondary-language caption")
    lines.append("- `hashtags.txt` — hashtag stack (paste into FIRST COMMENT on IG)")
    lines.append("")
    lines.append(f"**Source data:** [social/uploads/_automation/build.py](../../_automation/build.py)")
    lines.append("")

    (folder / "INSTRUCTIONS.md").write_text("\n".join(lines), encoding="utf-8")


def build_post(folder, p, idx):
    if folder.exists():
        shutil.rmtree(folder)
    folder.mkdir(parents=True, exist_ok=True)

    asset_paths = resolve_assets(p)
    asset_filenames = []
    for src in asset_paths:
        dest = folder / src.name
        shutil.copy2(src, dest)
        asset_filenames.append(src.name)

    primary = primary_caption_text(p)
    if primary:
        (folder / "caption.txt").write_text(primary, encoding="utf-8")

    alt = alt_caption_text(p)
    if alt:
        (folder / "caption-alt.txt").write_text(alt, encoding="utf-8")

    htxt = hashtags_text(p)
    if htxt:
        (folder / "hashtags.txt").write_text(htxt, encoding="utf-8")

    write_instructions(folder, p, asset_filenames)


def build_week_youtube_summary(week_dir, week_num, week_posts):
    yt_posts = [p for p in week_posts if p["channel"] in ("youtube-long", "youtube-short")]
    if not yt_posts:
        return
    lines = [f"# YouTube — Week {week_num}", ""]
    for p in yt_posts:
        lines.append(f"## {p['date']} {p['day'].upper()} {p['time']} — {p['channel']}")
        lines.append("")
        lines.append(f"**Title:** {p.get('title', '(TBD)')}")
        lines.append("")
        if p.get("notes"):
            lines.append(f"_{p['notes']}_")
            lines.append("")
        lines.append("---")
        lines.append("")
    (week_dir / "_youtube.md").write_text("\n".join(lines), encoding="utf-8")


def build_readme():
    today = date.today()
    lines = [
        "# Social Uploads — Drag-and-drop ready",
        "",
        f"**Last built:** {today.isoformat()}",
        "",
        "Open the next-upcoming folder, follow `INSTRUCTIONS.md`, drag the asset(s) into the uploader, paste `caption.txt` and `hashtags.txt`. Done.",
        "",
        "## Quick start",
        "",
        "- Double-click `OPEN-NEXT.bat` to open the next upcoming post folder in Explorer.",
        "- Or browse the weeks below — folders sort chronologically.",
        "",
        "## What's in each post folder",
        "",
        "- `INSTRUCTIONS.md` — channel-specific upload steps (TikTok / IG+FB / YouTube)",
        "- `caption.txt` — the primary-language caption (copy + paste)",
        "- `caption-alt.txt` — the other language, if both EN and ES exist for this post",
        "- `hashtags.txt` — hashtag stack to paste into the FIRST COMMENT on IG",
        "- The asset file(s) — drag these into the uploader",
        "",
    ]

    by_week = {}
    for p in POSTS:
        by_week.setdefault(p["week"], []).append(p)

    today_iso = today.isoformat()
    upcoming = []
    for p in POSTS:
        if p["date"] >= today_iso:
            upcoming.append(p)
        if len(upcoming) >= 5:
            break

    if upcoming:
        lines.append("## Next 5 upcoming")
        lines.append("")
        for p in upcoming:
            wstart, wend = week_bounds(p["week"])
            folder_label = folder_name(p, POSTS.index(p) + 1)
            lines.append(f"- **{p['date']} {p['day']} {p['time']}** · {p['channel']} · [{folder_label}/](week-{p['week']:02d}_{wstart}-{wend}/{folder_label}/) — {p['notes']}")
        lines.append("")

    lines.append("## All weeks")
    lines.append("")
    for wk in sorted(by_week.keys()):
        wstart, wend = week_bounds(wk)
        wfolder = f"week-{wk:02d}_{wstart}-{wend}"
        count = len(by_week[wk])
        lines.append(f"- [Week {wk} — {wstart} → {wend}]({wfolder}/) ({count} posts)")
    lines.append("")
    lines.append("## Re-run the build")
    lines.append("")
    lines.append("Source of truth is the `POSTS` list at the top of [_automation/build.py](_automation/build.py).")
    lines.append("To change captions, dates, or assets: edit that list and re-run:")
    lines.append("")
    lines.append("```")
    lines.append("python social/uploads/_automation/build.py")
    lines.append("```")
    lines.append("")
    lines.append("The script is idempotent. **Don't store proof-of-post screenshots inside upload folders** — they'll get wiped on next build. Put them in `social/posting-log.md` instead.")
    lines.append("")

    (UPLOADS_DIR / "README.md").write_text("\n".join(lines), encoding="utf-8")


def main():
    print(f"Building uploads at {UPLOADS_DIR}")
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    by_week = {}
    for p in POSTS:
        by_week.setdefault(p["week"], []).append(p)

    total = 0
    for wk, posts in sorted(by_week.items()):
        wstart, wend = week_bounds(wk)
        week_dir = UPLOADS_DIR / f"week-{wk:02d}_{wstart}-{wend}"
        # Wipe and rebuild week folder
        if week_dir.exists():
            shutil.rmtree(week_dir)
        week_dir.mkdir(parents=True, exist_ok=True)

        for p in posts:
            idx = POSTS.index(p) + 1
            fn = folder_name(p, idx)
            folder = week_dir / fn
            print(f"  Week {wk}: {fn}")
            build_post(folder, p, idx)
            total += 1

        build_week_youtube_summary(week_dir, wk, posts)

    build_readme()
    print(f"\nBuilt {total} post folders across {len(by_week)} weeks.")
    print(f"Top-level index: {UPLOADS_DIR / 'README.md'}")


if __name__ == "__main__":
    main()
