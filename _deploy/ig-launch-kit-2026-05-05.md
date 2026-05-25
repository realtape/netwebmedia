# Instagram Launch Kit — paste-ready, dated 2026-05-05

> **Purpose:** Everything Carlos copy-pastes to brand the IG profile and publish the 3 ready brand-intro carousels. Closes the prep gap from the May audit.
> **Companion:** `_deploy/social-channel-activation.md` §1 has the long-form profile-setup walkthrough; this file is the action-ready short form + the captions that doc was missing.
> **Hands-on time:** 30 min total (10 profile, 5 export, 15 captions/posting).

---

## Launch sequence — 3 days, 1 carousel per morning

| Day | Date | What posts | Time |
|---|---|---|---|
| 1 | **Wed 2026-05-06** | Profile branded + Carousel A ("Who we are") | 10:00 AM ET |
| 2 | **Thu 2026-05-07** | Carousel B ("How NWM is different") | 10:00 AM ET |
| 3 | **Fri 2026-05-08** | Carousel C ("What is AEO?") | 10:00 AM ET |

After Friday, the grid has 3 evergreen brand-intro posts and the niche AEO campaign carousels can begin landing on a real-looking grid (per `social-content-pipeline.md` v2).

---

## Step 1 — Brand the profile (10 min, do once)

Open Instagram app → ☰ → Settings → Account → "Edit profile" and set exactly:

| Field | Set to |
|---|---|
| Profile photo | Export `assets/social/avatar-1024.svg` to PNG (open in browser, right-click → "Save as image" or use the carousel-preview page's export button) |
| Name | **NetWebMedia** |
| Username | `netwebmedia` (already set, don't change) |
| Bio (148 chars) | paste the EN block ↓ |
| Link in bio | `https://netwebmedia.com` |
| Category | Marketing Agency *(Settings → Account → Switch to Professional → Business → "Marketing Agency")* |
| Contact options | Email: `hello@netwebmedia.com` |

### Bio — paste exactly

**English (default):**
```
AI-native fractional CMO for SMBs.
AEO strategy + content + execution.
ChatGPT-cited brands across 14 verticals.
🇺🇸🇨🇱
```

**Spanish (alternate, if Carlos prefers ES default):**
```
CMO fraccional AI-native para PyMEs.
Estrategia AEO + contenido + ejecución.
Marcas citadas en ChatGPT en 14 verticales.
🇨🇱🇺🇸
```

---

## Step 2 — Export the 15 carousel slides to PNG (5 min, do once)

The 15 SVGs at `assets/social/carousels/{a,b,c}-slide-{1..5}.svg` are 1080×1080 — exactly Instagram's carousel size.

**Easiest path:** open `social-carousel-preview.html` (lives at the repo root, noindex'd). It renders all 15 slides in a grid and has a single button **"Export all 15 as PNG (1080×1080)"** that downloads them in one shot via the Canvas API. Zero npm needed.

If you want them one-by-one: each SVG opens in any browser → right-click → "Save as image" → choose PNG.

You'll end up with 15 PNGs named `a-slide-1.png` through `c-slide-5.png`. Keep them in named order — IG carousel order matters.

---

## Step 3 — Caption + post Carousel A ("Who we are")

Upload all 5 A-slides as a single carousel post. Paste this caption.

### EN caption (default — toggle to ES via reply-comment if helpful)

```
Most marketing agencies still bill like it's 2018: 40 people, 6-week deliverables, $20k/mo retainers. We don't.

NetWebMedia is one senior operator + 12 AI agents. Same agency-grade output. Half the cost. Direct line to the founder on every call.

What we do specifically: AEO — Answer Engine Optimization. We get SMBs cited by ChatGPT, Claude, Perplexity, and Google AI Overviews. Buyers ask AI now. The brands cited in those answers get the calls.

14 verticals. SMBs only. No enterprise.

Free AEO audit on your site (worth $997, credited 100% toward your first month if we work together) — link in bio.

#AEO #AnswerEngineOptimization #FractionalCMO #AIMarketing #SMBMarketing #ChatGPTSEO #PerplexitySEO #ContentMarketing #DigitalMarketing #BilingualMarketing
```

### ES caption (paste as a reply-comment under your own post for ES audience)

```
La mayoría de las agencias todavía facturan como en 2018: 40 personas, deliverables a 6 semanas, retainers de $20k/mes. Nosotros no.

NetWebMedia somos un operador senior + 12 agentes AI. Mismo output de agencia. Mitad de costo. Línea directa con el fundador en cada llamada.

Qué hacemos: AEO — Answer Engine Optimization. Hacemos que las PyMEs sean citadas por ChatGPT, Claude, Perplexity y Google AI Overviews. Los compradores le preguntan a la IA ahora. Las marcas citadas en esas respuestas reciben las llamadas.

14 verticales. Solo PyMEs. Sin enterprise.

Auditoría AEO gratis en tu sitio (vale $997, 100% acreditada al primer mes si trabajamos juntos) — link en bio.

#AEO #MarketingAI #CMOFraccional #MarketingDigital #PyMEs #ChatGPT
```

---

## Step 4 — Caption + post Carousel B ("How NWM is different")

### EN caption

```
The agency model is broken. Here's why we built NetWebMedia differently.

Old model: 40-person agency, 6-week timelines, account managers, "let me check with the team," $20k/mo to start.

New model: 1 senior operator (me) + 12 AI agents that handle execution at machine speed.

What you save: half the cost. No middle layer.
What you get: direct line to the founder on every call. Bilingual EN/ES. WhatsApp during business hours.

This isn't "we're scrappy." It's "the org chart was the bottleneck — so we removed it."

Book a 20-minute strategy call (no pitch, just a real conversation about your AI visibility) — link in bio.

#FractionalCMO #AIAgents #LeanMarketing #SMBGrowth #AEO #AIMarketing #FounderLed #BilingualBusiness #StartupMarketing #MarketingStrategy
```

### ES caption

```
El modelo de agencia está roto. Por eso construimos NetWebMedia diferente.

Modelo viejo: agencia de 40 personas, plazos de 6 semanas, account managers, "déjame consultar con el equipo," $20k/mes para empezar.

Modelo nuevo: 1 operador senior (yo) + 12 agentes AI que ejecutan a velocidad de máquina.

Qué ahorras: mitad del costo. Sin capa intermedia.
Qué obtienes: línea directa con el fundador en cada llamada. Bilingüe EN/ES. WhatsApp en horario laboral.

Esto no es "somos scrappy." Es "el organigrama era el cuello de botella — así que lo eliminamos."

Reserva una llamada de 20 minutos (sin pitch, solo una conversación real sobre tu visibilidad en IA) — link en bio.

#CMOFraccional #AgentesAI #MarketingPyME #AEO #MarketingAI #BilingueEnEspanol
```

---

## Step 5 — Caption + post Carousel C ("What is AEO?")

### EN caption

```
SEO is over. AEO is starting.

18% of all search is now AI (ChatGPT, Claude, Perplexity, Google AI Overviews) — and growing 40% YoY. The brands cited in those AI answers get the calls. The brands that aren't, don't.

Three things actually move the needle for AEO:

1️⃣ Schema markup (FAQPage, Service, Organization) — tells AI engines how to cite you. Most sites have none.
2️⃣ Reviews at scale — 200+ recent beats 80 reviews by 3.2x for AI citation rate. Google Local Pack feeds AI summaries.
3️⃣ Content depth in your specific vertical — generic "we do plumbing" loses; "Emergency plumbing in [city]: cost ranges, response time benchmarks, what to ask before hiring" wins.

We do this for SMBs across 14 verticals: law, hotels, restaurants, healthcare, beauty, automotive, real estate, and more.

Free AEO audit on your site shows what ChatGPT, Claude, and Perplexity see today — link in bio.

#AEO #AnswerEngineOptimization #SEO2026 #ChatGPTSEO #PerplexitySEO #GoogleAIOverviews #ContentMarketing #LocalSEO #SchemaMarkup #AIMarketing
```

### ES caption

```
El SEO terminó. El AEO empieza.

18% de las búsquedas son IA ahora (ChatGPT, Claude, Perplexity, Google AI Overviews) — y crece 40% al año. Las marcas citadas en esas respuestas IA reciben las llamadas. Las que no, no.

Tres cosas que realmente mueven la aguja para AEO:

1️⃣ Schema markup (FAQPage, Service, Organization) — le dice a los motores IA cómo citarte. La mayoría de sitios no tiene nada.
2️⃣ Reseñas a escala — 200+ recientes le ganan a 80 reseñas por 3.2x en tasa de citación AI. Google Local Pack alimenta los resúmenes IA.
3️⃣ Profundidad de contenido en tu vertical específico — genérico "hacemos plomería" pierde; "Plomería de emergencia en [ciudad]: rangos de costos, tiempos de respuesta, qué preguntar antes de contratar" gana.

Lo hacemos para PyMEs en 14 verticales: legal, hoteles, restaurantes, salud, belleza, automotriz, bienes raíces, y más.

Auditoría AEO gratis en tu sitio muestra lo que ChatGPT, Claude y Perplexity ven hoy — link en bio.

#AEO #SEO2026 #ChatGPTSEO #MarketingAI #SchemaMarkup #PyMEs #MarketingDigital
```

---

## Hashtag rotation — for future niche carousels

When the law-firm AEO campaign carousel ships next week, append the niche-specific hashtags below to the general AEO block:

| Niche | Hashtag block |
|---|---|
| Law firms | `#LawFirmMarketing #AttorneyMarketing #LegalSEO #LawyerMarketing` |
| Tourism / hospitality | `#HotelMarketing #BoutiqueHotel #VacationRental #HospitalityMarketing` |
| Restaurants | `#RestaurantMarketing #LocalRestaurant #FoodAndBeverage #RestaurantSEO` |
| Healthcare | `#HealthcareMarketing #MedicalSEO #DentalMarketing #PracticeGrowth` |
| Beauty | `#SalonMarketing #SpaMarketing #BeautyBusiness #MedSpaMarketing` |
| Real estate | `#RealEstateMarketing #RealtorMarketing #PropertyMarketing #BrokerageMarketing` |
| Automotive | `#AutoDealerMarketing #DealershipMarketing #AutomotiveSEO` |
| Education | `#SchoolMarketing #EducationMarketing #TutorMarketing` |
| Events / weddings | `#WeddingPlannerMarketing #EventVenueMarketing #EventsBusiness` |
| Finance | `#AccountantMarketing #CPAMarketing #FinancialAdvisorMarketing` |
| Home services | `#PlumberMarketing #ContractorMarketing #HomeServicesMarketing #LocalServicesSEO` |
| Wine / agriculture | `#WineryMarketing #VineyardMarketing #AgribusinessMarketing` |
| Local specialist | `#SmallBusinessMarketing #BoutiqueMarketing #GymMarketing` |
| SMB | `#SMBMarketing #SmallBusinessGrowth #LocalBusinessMarketing` |

Cap total hashtags per post at **15** (Instagram's optimal-engagement window in 2026 per Later/Buffer benchmarks).

---

## Day-1 checklist (Wed May 6)

- [ ] Profile photo uploaded (avatar PNG)
- [ ] Name = "NetWebMedia"
- [ ] Bio EN pasted (148 chars)
- [ ] Link in bio = `https://netwebmedia.com`
- [ ] Switched to Professional / Marketing Agency
- [ ] Email contact added
- [ ] All 15 carousel slides exported as PNG
- [ ] Carousel A posted with EN caption at 10:00 AM ET
- [ ] ES caption posted as the first reply-comment under Carousel A
- [ ] Verify in incognito browser: `https://www.instagram.com/netwebmedia/` shows new branding + 1 post

Once that's confirmed live, repeat steps for B (Thu) and C (Fri). After Friday, the grid has 3 evergreen brand-intro posts and any niche AEO campaign carousels can begin landing on a real grid.

---

## What's NOT in this kit (deliberately)

- Story content, Reels, IGTV — `social-content-pipeline.md` v2 covers those
- WhatsApp Business broadcast launch — gated on Meta WABA verification (target June 2026)
- Stories + highlight reels — Phase 2 once the grid has 6+ posts
- TikTok — slated Q3 2026 per master plan
- LinkedIn / X — permanently excluded by Carlos (2026-04-20 / 2026-05-01)

---

**File:** `_deploy/ig-launch-kit-2026-05-05.md`
**Created:** 2026-05-05
**Owner:** Carlos (manual posting); content-strategist agent (caption variants if needed)
**Source slides:** `assets/social/carousels/{a,b,c}-slide-{1..5}.svg` (15 files, 1080×1080)
**Source preview tool:** `social-carousel-preview.html` (export-all-as-PNG button)
