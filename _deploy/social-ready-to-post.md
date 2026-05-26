# Social — Ready to Post (Master Index)

> **Generated:** 2026-05-26 · **Owner:** Carlos hands
> **Brand:** Navy `#010F3B` · Orange `#FF671F` · Inter / Poppins
> **Active channels:** Instagram · Facebook · YouTube · WhatsApp Business (App, click-to-chat only) · Email · TikTok (pending)
> **Excluded (durable):** LinkedIn · X / Twitter

This is the single source-of-truth bundle for every social asset currently staged in the repo. Each row tells you: caption, hashtags, files on disk, target channel, and what (if anything) is blocking publication. Work top-down — Section A goes out today, Section B waits on reel re-acquisition, Section C waits on platform unlocks.

---

## TL;DR — what can ship today

| Bundle | Format | Channel | Slides/Items | Files | Status |
|---|---|---|---|---|---|
| **A1** AEO Starter carousel (EN) | IG carousel 4:5 | IG · FB | 7 | `assets/social/campaign/carousels/aeo_en/` | ✅ Ready |
| **A1** AEO Starter carousel (ES) | IG carousel 4:5 | IG · FB | 7 | `assets/social/campaign/carousels/aeo_es/` | ✅ Ready |
| **A2** CMO Growth carousel (EN) | IG carousel 4:5 | IG · FB | 7 | `assets/social/campaign/carousels/cmo_growth_en/` | ✅ Ready |
| **A2** CMO Growth carousel (ES) | IG carousel 4:5 | IG · FB | 7 | `assets/social/campaign/carousels/cmo_growth_es/` | ✅ Ready |
| **A3** CMO Scale carousel (EN) | IG carousel 4:5 | IG · FB | 7 | `assets/social/campaign/carousels/cmo_scale_en/` | ✅ Ready |
| **A3** CMO Scale carousel (ES) | IG carousel 4:5 | IG · FB | 7 | `assets/social/campaign/carousels/cmo_scale_es/` | ✅ Ready |
| **A4** Fractional-CMO 6-slide (EN) | IG carousel 4:5 | IG · FB | 6 | `assets/social/higgsfield/campaign-cmo-en/` | ✅ Ready |
| **A4** Fractional-CMO 6-slide (ES) | IG carousel 4:5 | IG · FB | 6 | `assets/social/higgsfield/campaign-cmo-es/` | ✅ Ready |
| **A5** Fractional-CMO 3-slide (EN) | IG carousel 4:5 | IG · FB | 3 | `assets/social/higgsfield/campaign-cmo-en-3slide/` | ✅ Ready |
| **A5** Fractional-CMO 3-slide (ES) | IG carousel 4:5 | IG · FB | 3 | `assets/social/higgsfield/campaign-cmo-es-3slide/` (caption ready, slide PNGs not on disk) | ⚠️ Regenerate slides |
| **A6** Brand-intro carousel A | IG carousel 1:1 | IG · FB | 5 | `assets/social/carousels/a-slide-{1..5}.png` | ✅ Ready |
| **A6** Brand-intro carousel B | IG carousel 1:1 | IG · FB | 5 | `assets/social/carousels/b-slide-{1..5}.png` | ✅ Ready |
| **A6** Brand-intro carousel C | IG carousel 1:1 | IG · FB | 5 | `assets/social/carousels/c-slide-{1..5}.png` | ✅ Ready |
| **A6** Brand-intro carousel D | IG carousel 1:1 | IG · FB | 6 | `assets/social/carousels/d-slide-{1..6}.png` | ✅ Ready |
| **A7** 14 niche posts (single-image) | IG/FB post | IG · FB | 14 captions | `social/niche-posts-14.md` | ✅ Ready (caption-only; pair with industry-page hero) |
| **B1** Service Reels 2026 (R2–R10) | IG Reel 9:16 | IG · FB · TT | 9 reels | thumbnails only on disk | ⚠️ Re-acquire mp4s (CloudFront 403) |
| **B2** MVP Expansion v2 (9 reels) | IG Reel 9:16 | IG · FB · TT | 9 reels | Remotion pipeline + per-reel themes wired; source clips + music pending | ⚠️ Drop clips + music → render |
| **B3** Standalone reels D/E/F | IG Reel 9:16 | IG · FB · TT | 3 reels | thumbnails only on disk | ⚠️ Re-acquire mp4s |
| **C1** WhatsApp Cloud broadcasts | WA template | WA | n/a | n/a | 🚫 Number on Business App, no Cloud API outbound |
| **C2** TikTok publishing | Reel via API | TT | 6 reels | n/a | 🚫 `TT_ACCESS_TOKEN` + domain verification pending |
| **C3** IG profile branding | profile fix | IG | n/a | n/a | 🚫 Display name still "Carlos Martinez"; per `social-content-pipeline.md` v2, fix before publishing carousels |

**Recommended first-day shipment:** A5 EN + A5 ES (the 3-slide carousels) — they're the tightest, sharpest version of the AEO pitch, and the smallest paste-and-go unit.

---

## Section A — Post today

> **Pre-flight (do once per IG account):** Per `_deploy/social-content-pipeline.md` v2, the @netwebmedia IG profile must be branded before carousel publication — display name `NetWebMedia`, Navy/Orange avatar (`assets/social/avatar-1024.svg` exported to PNG), bio link to `https://netwebmedia.com`. After that the IG publish path is unblocked via the FB Page token (`FB_PAGE_TOKEN`) — run `crm-vanilla/api/?r=ig_publish&action=discover&token=<MIGRATE_TOKEN>` to verify, then `action=publish` for live.

---

### A1 · AEO Starter carousel (EN)

- **Format:** IG carousel, 4:5, 7 slides
- **Files:** `assets/social/campaign/carousels/aeo_en/aeo_en_slide_{1..7}.png`
- **Primary channel:** Instagram · cross-post to Facebook
- **Best window:** Mon/Wed 12:00 PM CLT

**Caption (paste as-is):**

```
Top-ranked pages now lose 58% of their clicks once AI Overviews appear (Ahrefs, Q1 2026 — 300K-keyword study).

If you ranked #1 for buyer queries in 2024, you're losing more than half of that traffic right now. Not "eventually." Right now.

AEO STARTER — $249/mo:
• AEO + AI citation strategy
• Monthly content + SEO roadmap
• NWM CRM included (46 modules)
• 90-day upgrade credit to Growth or Premium

The first 10 firms that move now will own AI citation in their category by 2027.

📊 Book a free AEO audit — link in bio.

#AnswerEngineOptimization #AEO #AImarketing #FractionalCMO #SmallBusinessMarketing #DigitalMarketing #ContentStrategy #SEOtips #AISearch #MarketingAgency #GrowthMarketing #ChileTech #LatamMarketing #BilingualMarketing #NetWebMedia
```

---

### A1 · AEO Starter carousel (ES)

- **Format:** IG carousel, 4:5, 7 slides
- **Files:** `assets/social/campaign/carousels/aeo_es/aeo_es_slide_{1..7}.png`
- **Primary channel:** Instagram · cross-post to Facebook

**Caption:**

```
Las páginas mejor rankeadas pierden 58% de sus clics cuando aparece AI Overviews (Ahrefs, Q1 2026 — estudio sobre 300K keywords).

Si rankeabas #1 para las búsquedas de tus compradores en 2024, ya estás perdiendo más de la mitad de ese tráfico. No "eventualmente." Ahora mismo.

AEO STARTER — US$249/mes:
• Estrategia AEO + citación en IA
• Roadmap mensual de contenido + SEO
• NWM CRM incluido (46 módulos)
• Crédito de 90 días para subir a Growth o Premium

Las primeras 10 empresas que se muevan ahora serán las citadas por la IA en su categoría en 2027.

📊 Agenda una auditoría AEO gratis — link en bio.

#AnswerEngineOptimization #AEO #MarketingIA #CMOFraccional #PyME #MarketingDigital #EstrategiaDeContenido #SEO #BusquedaIA #AgenciaDigital #ChileTech #LatamMarketing #MarketingBilingue #NetWebMedia
```

---

### A2 · CMO Growth carousel (EN)

- **Format:** IG carousel, 4:5, 7 slides
- **Files:** `assets/social/campaign/carousels/cmo_growth_en/cmo_growth_en_slide_{1..7}.png`

**Caption:**

```
900 million people use ChatGPT every week (OpenAI, Feb 27 2026 announcement).

Your buyers aren't all on Google anymore. They're across AI, organic, paid, social — and they expect you to show up consistently in all of them.

CMO GROWTH — $999/mo (most popular):
• Everything in AEO Starter +
• Paid ads management (Google + Meta)
• Social media content & posting
• Email marketing automation
• AI SDR + lead qualification

One operator. 12 AI agents. Same agency-grade output. Half the cost.

🚀 Book a strategy call — link in bio.

#FractionalCMO #AImarketing #PaidAds #EmailMarketing #SocialMediaMarketing #LeadGeneration #MarketingAutomation #SmallBusinessMarketing #B2BMarketing #ContentMarketing #GrowthMarketing #DigitalAgency #LatamMarketing #BilingualMarketing #NetWebMedia
```

---

### A2 · CMO Growth carousel (ES)

- **Files:** `assets/social/campaign/carousels/cmo_growth_es/cmo_growth_es_slide_{1..7}.png`

**Caption:**

```
900 millones de personas usan ChatGPT cada semana (OpenAI, 27 feb 2026).

Tus compradores ya no están solo en Google. Están en IA, orgánico, pago y redes — y esperan que aparezcas consistentemente en todos.

CMO GROWTH — US$999/mes (el más elegido):
• Todo lo de AEO Starter +
• Gestión de pauta (Google + Meta)
• Contenido y publicación en redes
• Automatización de email marketing
• SDR con IA + calificación de leads

Un operador. 12 agentes IA. Misma calidad de agencia. La mitad del costo.

🚀 Agenda una llamada estratégica — link en bio.

#CMOFraccional #MarketingIA #Pauta #EmailMarketing #RedesSociales #GeneracionDeLeads #AutomatizacionMarketing #PyME #MarketingB2B #MarketingDeContenido #AgenciaDigital #LatamMarketing #MarketingBilingue #NetWebMedia
```

---

### A3 · CMO Scale / Premium carousel (EN)

- **Files:** `assets/social/campaign/carousels/cmo_scale_en/cmo_scale_en_slide_{1..7}.png`

**Caption:**

```
70% of the pages cited in Google AI Overviews rotate every 2–3 months (Authoritas, Q1 2026).

AEO is not a project. It's a rolling 8-week race. The brands that get cited next quarter are the ones publishing, distributing, and measuring every week — not the ones that "did a content sprint last year."

CMO PREMIUM — $2,490/mo:
• Everything in CMO Growth +
• Video factory (16 reels/mo)
• Custom AI agents + voice AI
• White-glove onboarding
• Dedicated account strategist

For founders who want a true CMO function without a $300K salary line.

🎯 Book a 30-min fit call — link in bio.

#FractionalCMO #AImarketing #VideoMarketing #AIAgents #PremiumMarketing #B2BMarketing #ScaleUp #BusinessGrowth #MarketingStrategy #AnswerEngineOptimization #ContentVelocity #DigitalAgency #LatamMarketing #ExecutiveMarketing #NetWebMedia
```

---

### A3 · CMO Scale / Premium carousel (ES)

- **Files:** `assets/social/campaign/carousels/cmo_scale_es/cmo_scale_es_slide_{1..7}.png`

**Caption:**

```
70% de las páginas citadas en Google AI Overviews rotan cada 2–3 meses (Authoritas, Q1 2026).

AEO no es un proyecto. Es una carrera continua de 8 semanas. Las marcas que serán citadas el próximo trimestre son las que están publicando, distribuyendo y midiendo cada semana — no las que "hicieron un sprint de contenido el año pasado."

CMO PREMIUM — US$2.490/mes:
• Todo lo de CMO Growth +
• Fábrica de video (16 reels/mes)
• Agentes IA personalizados + voz IA
• Onboarding premium
• Estratega de cuenta dedicado

Para fundadores que quieren una función real de CMO sin sumar US$300K en salario.

🎯 Agenda una llamada de fit de 30 min — link en bio.

#CMOFraccional #MarketingIA #VideoMarketing #AgentesIA #MarketingPremium #MarketingB2B #ScaleUp #CrecimientoEmpresarial #EstrategiaMarketing #AEO #ContenidoEnSerie #AgenciaDigital #LatamMarketing #MarketingEjecutivo #NetWebMedia
```

---

### A4 · Fractional-CMO 6-slide carousel (EN)

- **Files:** `assets/social/higgsfield/campaign-cmo-en/cmo_en_slide_{1..6}.png`
- **Caption source:** `assets/social/higgsfield/campaign-cmo-en/caption.txt`

**Caption:**

```
The shift is here.

25% of Google searches now show AI Overviews (Semrush, 2026).
Gartner: traditional search volume drops 25% by 2026.
ChatGPT: 883M monthly users (Jan 2026).

Your buyers are already asking AI, not Google. The brands cited in those answers win the call.

NetWebMedia is an AI-native Fractional CMO for SMBs. One senior operator, 12 AI agents. Bilingual EN/ES. Direct line to the founder.

$997 AEO Migration Audit, 100% credited toward your first 3 months on any retainer.

Book at netwebmedia.com

Sources: Semrush AI Overviews tracking Q1 2026 · Gartner forecast via HubSpot, 2026 · OpenAI / industry tracking January 2026.

#AnswerEngineOptimization #FractionalCMO #AImarketing #SmallBusiness #MarketingAgency
```

---

### A4 · Fractional-CMO 6-slide carousel (ES)

- **Files:** `assets/social/higgsfield/campaign-cmo-es/cmo_es_slide_{1..6}.png`
- **Caption source:** `assets/social/higgsfield/campaign-cmo-es/caption.txt`

**Caption:**

```
El cambio está aquí.

25% de las búsquedas en Google ya muestran AI Overviews (Semrush, 2026).
Gartner: el volumen de búsqueda tradicional caerá 25% para 2026.
ChatGPT: 883M de usuarios mensuales (ene 2026).

Tus compradores ya le preguntan a la IA, no a Google. Las marcas citadas en esas respuestas ganan la llamada.

NetWebMedia es un CMO Fraccional AI-native para PyMEs. Un operador senior, 12 agentes IA. Bilingüe ES/EN. Línea directa al fundador.

Auditoría de Migración AEO de $997, 100% acreditados a tus primeros 3 meses en cualquier retainer.

Agenda en netwebmedia.com

Fuentes: Semrush AI Overviews tracking Q1 2026 · Gartner forecast vía HubSpot, 2026 · OpenAI / industria, enero 2026.

#AnswerEngineOptimization #CMOFraccional #MarketingIA #PyME #AgenciaDigital
```

---

### A5 · Fractional-CMO 3-slide carousel (EN) — recommended first post

- **Files:** `assets/social/higgsfield/campaign-cmo-en-3slide/cmo3_en_slide_{1..3}.png`
- **Caption source:** `assets/social/higgsfield/campaign-cmo-en-3slide/caption.txt`

**Caption:**

```
25% of Google searches now show AI Overviews (Semrush, 2026).

Your buyers are asking AI, not Google. The brands cited in those answers win the call.

NetWebMedia is an AI-native Fractional CMO for SMBs. One senior operator + 12 AI agents. Bilingual EN/ES. Direct line to the founder.

$997 AEO Migration Audit, 100% credited toward your first 3 months on any retainer.

DM us or book at netwebmedia.com

#AnswerEngineOptimization #FractionalCMO #AImarketing #SmallBusiness #MarketingAgency
```

---

### A5 · Fractional-CMO 3-slide carousel (ES)

- **Files:** `assets/social/higgsfield/campaign-cmo-es-3slide/` (slides remote per MANIFEST — verify local PNGs; if missing, regenerate via `scripts/composite_nwm_logo.py` from EN versions with text swap)

**Caption:**

```
El 25% de las búsquedas en Google ya muestran respuestas de IA (Semrush, 2026).

Tus clientes le preguntan a la IA, no a Google. Las marcas citadas en esas respuestas se llevan la llamada.

NetWebMedia es un CMO Fraccional nativo de IA para PYMES. Un operador senior + 12 agentes IA. Bilingüe EN/ES. Línea directa con el fundador.

US$997 Auditoría de Migración AEO, 100% acreditable a tus primeros 3 meses con cualquier retainer.

Escríbenos o reserva en netwebmedia.com

#AnswerEngineOptimization #CMOFraccional #MarketingIA #PyME #AgenciaDigital
```

---

### A6 · Brand-intro carousels (A / B / C / D)

The four original brand-intro decks at `assets/social/carousels/` are 1:1 (1080×1080) and pre-date the 4:5 MVP carousels. Use as **profile pin** or first-week introduction posts. PNGs are pre-rendered.

| Deck | Slides | Angle | Files |
|---|---|---|---|
| A | 5 | Who we are / what we do | `assets/social/carousels/a-slide-{1..5}.png` |
| B | 5 | The AI-search shift | `assets/social/carousels/b-slide-{1..5}.png` |
| C | 5 | One operator + 12 AI agents | `assets/social/carousels/c-slide-{1..5}.png` |
| D | 6 | $997 audit offer | `assets/social/carousels/d-slide-{1..6}.png` |

**Caption template (adapt per deck):**

```
We're @netwebmedia — an AI-native Fractional CMO for SMBs.

One senior operator. 12 AI agents. Bilingual EN/ES. Direct line to the founder.

Free $997 AEO Migration Audit on every kickoff — 100% credited to your first 3 months.

Follow for the AI-search playbook for small business: AEO, content velocity, paid + organic, and the dashboards we build for clients.

🔗 netwebmedia.com

#FractionalCMO #AImarketing #AnswerEngineOptimization #SmallBusinessMarketing #BilingualMarketing #NetWebMedia
```

---

### A7 · 14 niche-specific single-image posts

- **Source:** `social/niche-posts-14.md` (148 lines, EN captions)
- **Format:** Single-image IG/FB post. Pair each caption with the matching industry hero image — pull from `industries/<niche>/` or use the avatar `assets/social/avatar-1024.svg` as fallback.
- **Cadence:** 1 niche/day across 14 days, rotating to land before the matching industry blog post.

Niches covered (mapped to the 14-niche CRM enum):

1. tourism · 2. restaurants · 3. health · 4. beauty · 5. smb · 6. law_firms · 7. real_estate · 8. local_specialist · 9. automotive · 10. education · 11. events_weddings · 12. financial_services · 13. home_services · 14. wine_agriculture

Each caption ends with a CTA to the niche subdomain (e.g. `hospitality.netwebmedia.com`, `restaurants.netwebmedia.com`). Verify the subdomain is mapped in `.htaccess` before linking (39 subdomains live as of CLAUDE.md).

---

## Section B — Reels (blocked on assets)

### B1 · Service Reels 2026 (R2–R10) — schedule lapsed

9 reels (10s each, 9:16, Kling 3.0 Pro, audio on) covering AI Content, Multi-Platform Strategy, SEO/AEO, Lead Gen, Analytics, Video, Email, Social Scheduling, Paid Ads. Captions + hashtags + posting times are fully locked in `assets/social/higgsfield/service-reels-2026/CAPTIONS-AND-SCHEDULE.md`.

**Blocker:** the CloudFront URLs in `MANIFEST.json` now return `HTTP/2 403 host_not_allowed` — Higgsfield's CDN rejects out-of-domain hotlinks. Only `.mp4.jpg` thumbnails are on disk. The original render jobs are still in Higgsfield workspace `4df1d4d6-02bb-48f8-a91e-30eb0ec3aa56` and can be re-acquired via the Higgsfield MCP (`job_display` → download). Schedule was May 12 → May 26 (today); needs a fresh schedule after re-acquisition.

**Action to unblock:** ask for "Re-acquire missing reel mp4s" (Higgsfield credits ≈ 0 if jobs still cached, otherwise per-clip).

### B2 · MVP Expansion v2 (9 reels) — pipeline built, awaiting assets

22 source clips (3 character portraits + 19 video clips at 73 MB) were rendered 2026-05-12 per `_deploy/social-reels-mvp-expansion-2026-05/BRIEF.md`. Only the 3 character-ref portraits remain on disk (`assets/social/campaign/v2/character-refs/`). The 19 mp4 clips referenced in the BRIEF are gone — likely cleaned out before commit.

**Programmatic post-production now wired up.** Replaces the prior "open in DaVinci" step with a Remotion pipeline that ships nine visually distinct reels (per-reel tertiary accent + motif + transition) all anchored in Navy `#010F3B` + Orange `#FF671F`:

| # | Package | Tertiary | Motif | Transition out (sample) |
|---|---|---|---|---|
| 1A Hook | AEO Starter | Amber `#FFB23F` | Skeptic squint · text drop · phone-glow | zoom-punch |
| 2A Demo | AEO Starter | Amber + Crimson `#FF3B3B` | Schema markup wipes · error→fix | light-flash |
| 3A Proof | AEO Starter | Amber + Mint `#5EE6A8` | Number counter · line-chart climb | scale-zoom |
| 4B Hook | CMO Growth | Cyan `#22D3EE` | Tab-close kinetic · single dashboard | glitch-slide |
| 5B Demo | CMO Growth | Cyan | Whiteboard list · calendar stagger | matrix-wipe |
| 6B Proof | CMO Growth | Cyan + Lime `#A8E22D` | Arrow 0→47 · email-preview push | parallax-pan |
| 7C Hook | CMO Scale | Gold `#FFC857` | Window light push-in · cinematic fade | cinema-fade |
| 8C Demo | CMO Scale | Gold + Platinum `#C0D6F0` | KPI card stack · workflow nodes | depth-stack |
| 9C Proof | CMO Scale | Gold + Revenue-green `#3FE07A` | Logo wall · revenue chart | momentum-blur |

**Files:**
- Composition: `video-factory/src/compositions/MvpReel.tsx`
- Per-reel data + themes: `video-factory/src/data/mvp-reels.ts`
- Render script: `video-factory/scripts/render-mvp-reels.sh` (does pre-flight + renders all 9 to `video-factory/out/`)
- Music brief: `_deploy/social-reels-mvp-expansion-2026-05/MUSIC-BRIEF.md`

**Remaining blockers before render:**
1. Re-acquire 19 source clips from Higgsfield workspace `4df1d4d6-…` (job IDs in `BRIEF.md`) → drop in `video-factory/public/clips/`.
2. License + drop 3 royalty-free music beds (one per package — see `MUSIC-BRIEF.md`) → `video-factory/public/music/`.
3. PNG-export the brand marks (`assets/nwm-logo.svg` → `video-factory/public/nwm-logo.png`, `assets/nwm-logo-horizontal.svg` → `video-factory/public/nwm-logo-horizontal.png`).
4. (Optional) Voice-over — Carlos records 9 EN scripts; without VO the captions carry the script and music + ambient fill the audio.
5. Meta verification per CLAUDE.md — HOLD on publish until confirmed.

**Render command (once 1–3 land):**
```bash
cd video-factory && npm install && ./scripts/render-mvp-reels.sh
```

### B3 · Standalone reels D / E / F (EN)

3 individual reels with captions ready:
- D — "1 operator. 12 AI agents." (operator-agents)
- E — "$997 AEO Migration Audit" (audit-offer)
- F — "3 questions buyers ask AI about your business" (three-questions)

Captions: `assets/social/higgsfield/reel-{d,e,f}-*-en/caption.txt`. mp4s remote. Same re-acquire path as B1.

---

## Section C — Platform unlocks needed

### C1 · WhatsApp outbound broadcasts

Current public number `+1 (442) 385-4585` is registered on the WhatsApp Business **App** — Cloud API outbound (broadcasts via `wa_flush.php`) is not available on this number. Per CLAUDE.md (2026-05-25) the Sonetel/Meta WABA verification is decoupled from this number. Keep capturing opt-ins via `/whatsapp-updates.html`; replace v1 WhatsApp broadcasts with email follow-ups in the warm-prospect sequence until WABA is re-provisioned on a different number.

### C2 · TikTok publishing

`crm-vanilla/api/handlers/tt_publish.php` is code-complete with 6 reels catalogued (AEO/Growth/Scale × EN/ES). Blockers:
- `TT_ACCESS_TOKEN` not yet set (TikTok Developer Portal → Content Posting API approval is 2–4 weeks).
- Domain verification at `URL Prefix Configuration` not yet complete — else `PULL_FROM_URL` returns `url_ownership_unverified`.

### C3 · IG profile branding

Per `_deploy/social-content-pipeline.md` v2 (2026-05-01), `@netwebmedia` IG profile display name still reads "Carlos Martinez" with no indexed posts. **Fix before any A-section publication:**
- Display name → `NetWebMedia`
- Avatar → export `assets/social/avatar-1024.svg` to 1024×1024 PNG, upload
- Header (where supported) → `assets/social/header-1500x500.svg`
- Bio link → `https://netwebmedia.com`

Once branding lands, run `curl -s "https://netwebmedia.com/crm-vanilla/api/?r=ig_publish&action=discover&token=<MIGRATE_TOKEN>"` (with Origin/Referer headers per `_deploy/social-publishing-unblock-2026-05-11.md`) to confirm the FB Page token can read the IG account before live publish.

---

## Posting checklist (per asset)

- [ ] Verify file is on disk at the path listed
- [ ] (IG only) Confirm profile branding done (§C3)
- [ ] Copy caption from this file as-is
- [ ] Append/swap hashtags per channel (IG = 15 max; FB = 5–10; TT = 3–5)
- [ ] Set location: Santiago, Chile (where geo-tagging is supported)
- [ ] Cross-post toggle: IG → FB Page (`/netwebmedia`)
- [ ] First-comment hook: link to `netwebmedia.com` or relevant industry subdomain
- [ ] Save to `social_post` resource in CMS (`/cms/social.html`) for tracking

## Recommended order (first week)

| Day | Asset | Channel | Why |
|---|---|---|---|
| 1 | A5 EN | IG + FB | Tightest opener, fastest read |
| 2 | A4 EN | IG + FB | Expanded version for new followers |
| 3 | A1 EN (AEO Starter) | IG + FB | Lead with the entry-tier offer |
| 4 | A5 ES | IG + FB | Mirror to ES audience |
| 5 | A2 EN (CMO Growth) | IG + FB | Most-popular package |
| 6 | A6 deck A | IG + FB | Brand-intro pinned post |
| 7 | A1 ES | IG + FB | Close the week bilingual |

Subsequent weeks: rotate A2/A3/A4/A6 ES, then drop A7 niche posts daily (M–Su × 2 weeks = 14 niches).

---

## Source files referenced

- `assets/social/campaign/carousels/{aeo,cmo_growth,cmo_scale}_{en,es}/` — 42 MVP carousel slides
- `assets/social/higgsfield/campaign-cmo-{en,es}/` — 6-slide carousel + caption
- `assets/social/higgsfield/campaign-cmo-{en,es}-3slide/` — 3-slide carousel + caption
- `assets/social/carousels/{a,b,c,d}-slide-*.png` — brand-intro decks (older)
- `social/niche-posts-14.md` — 14 niche captions
- `assets/social/higgsfield/service-reels-2026/{CAPTIONS-AND-SCHEDULE.md,MANIFEST.json}` — Service Reels (mp4s remote)
- `_deploy/social-reels-mvp-expansion-2026-05/BRIEF.md` — MVP v2 reels (assembly pending)
- `_deploy/social-publishing-unblock-2026-05-11.md` — handler unblock runbook
- `_deploy/social-content-pipeline.md` — v2 channel reality (IG profile prereq, X dropped, WA fallback)
- `crm-vanilla/api/handlers/{ig,fb,tt}_publish.php` — programmatic publishing handlers
