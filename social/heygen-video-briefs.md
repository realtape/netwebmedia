# HeyGen Video Briefs — 12 Reels (Weeks 8–10 IG + TikTok)

**Generator:** `heygen_avatar_generate.py` (root)
**Default avatar:** `c58d907a18d3426085da01a855034d82`
**Default voice (ES):** Narrator Mateo — `b02e8659016f4dbb8a92004cdf50ad04`
**Default voice (EN):** TBD — run `python heygen_avatar_generate.py --list-voices` to pick a clean EN voice; until selected, EN videos will use Mateo's voice (Spanish-accented EN, acceptable for cold-open hook reels).
**Dimensions:** 720×1280 (vertical 9:16 for Reels + TikTok)
**Background:** Navy `#010F3B` solid (set in script `BRAND_NAVY`)
**Output:** MP4 URL appended to [`heygen-renders-log.md`](heygen-renders-log.md) as each render completes.

**Why 12:** 2 Reels/wk × 3 weeks (Weeks 8, 9, 10) = 6 fresh + 6 rotation = 12 unique. Allocation matches [`posting-calendar.md`](posting-calendar.md) — see "Asset reuse matrix" in [`social-media-marketing-plan.md`](social-media-marketing-plan.md) §4.

**Cost note:** HeyGen credits will be consumed. Carlos approved full 12-render batch 2026-05-28. If credits exhaust mid-batch, the worker logs the failure to `heygen-renders-log.md` and stops — remaining renders carry over to next credit cycle.

---

## How to render one

```powershell
# From repo root
python heygen_avatar_generate.py `
  --script-file social\heygen\scripts\01-aeo-hook-en.txt `
  --title "NWM - AEO Hook EN" `
  --width 720 --height 1280
```

Or use the batch wrapper that ships 1 video at a time (`Generar_Video_HeyGen.bat`) — but it uses the default Spanish script. For the 12 here, point `--script-file` at the right file under `social/heygen/scripts/`.

**Script files are created alongside this doc on first render run.** Each file = exactly one render = one ~25-second video.

---

## 1. AEO Hook (EN) — `01-aeo-hook-en.txt`

**Allocation:** Week 8 Tue IG Reel + (rotation) Week 11 Tue
**Hook bank ref:** #1
**Duration target:** ≤ 25 sec @ normal speed

> Your customers asked AI about your business this week. They asked ChatGPT. They asked Perplexity. They asked Google's AI overview. And you weren't there. Your competitors were. We fix that. NetWebMedia — AI-native fractional CMO. Free AEO check at netwebmedia.com/aeo-index.

---

## 2. Audit Teaser (EN) — `02-audit-teaser-en.txt`

**Allocation:** Week 8 Thu TikTok + Week 11 Thu rotation
**Hook bank ref:** #17

> Thirty seconds. That's all it takes to find out if AI knows your business exists. The free AEO Index check at netwebmedia.com/aeo-index. Drop your URL. We score you across ChatGPT, Perplexity, and Google AI Overviews. Then we show you how to double that score in sixty days. Free.

---

## 3. Client Win (EN) — `03-client-win-en.txt`

**Allocation:** Week 8 Sat IG Reel
**Hook bank ref:** #13

> One client. Law firm. Sixty days. Twelve new AI citations across ChatGPT, Perplexity, and Google AI Overviews. Four new retainer clients from those citations alone. That's the math. That's why we charge what we charge. NetWebMedia. AI-native fractional CMO. Audit at $997 — credited to your retainer.

---

## 4. Retainer Credit Anchor (EN) — `04-retainer-credit-en.txt`

**Allocation:** Week 8 Mon TikTok
**Hook bank ref:** #14

> Most agencies charge five thousand a month and bury the fee. We charge nine ninety-nine. Audit is nine ninety-seven. One hundred percent of that audit credits to your first month. We bet on you. They bet against you. The math is obvious. netwebmedia.com.

---

## 5. Niche Pivot (EN) — `05-niche-pivot-en.txt`

**Allocation:** Week 10 Tue IG Reel
**Hook bank ref:** custom (from plan §3 hook bank line 18 inspiration)

> Law firms. Dentists. Realtors. Wineries. Salons. Plumbers. They're all winning at AEO right now — and you're not. Why? Because they figured out one thing: ChatGPT recommends three vendors per query. If you're not one of those three, you don't exist. We make sure you do. netwebmedia.com.

---

## 6. Tuesday Brief Promo (EN) — `06-tuesday-brief-en.txt`

**Allocation:** Week 10 Thu TikTok
**Hook bank ref:** #18

> Every Tuesday at nine AM. One AEO move you can ship by Friday. No fluff. No filler. Just the move. Subscribe at netwebmedia.com slash blog. Free. We'll never sell your email. We'll just help you get cited by ChatGPT.

---

## 7. AEO Hook (ES) — `07-aeo-hook-es.txt`

**Allocation:** Week 9 Tue IG Reel
**Voice:** Narrator Mateo (default)

> Tus clientes le preguntaron a la inteligencia artificial por tu negocio esta semana. Le preguntaron a ChatGPT. A Perplexity. A Google. Y no te encontró. A tu competencia sí. Eso lo arreglamos. NetWebMedia — CMO fraccional con IA. Test gratis en netwebmedia.com barra aeo-index.

---

## 8. Audit Teaser (ES) — `08-audit-teaser-es.txt`

**Allocation:** Week 9 Thu TikTok

> Treinta segundos. Eso es todo lo que necesitas para saber si la inteligencia artificial conoce tu negocio. Test AEO gratis en netwebmedia.com barra aeo-index. Ponemos tu URL. Te damos un puntaje en ChatGPT, Perplexity y Google. Y luego te mostramos cómo duplicarlo en sesenta días. Gratis.

---

## 9. Client Win (ES) — `09-client-win-es.txt`

**Allocation:** Week 9 Sat IG Reel

> Un cliente. Estudio legal. Sesenta días. Doce citas nuevas en ChatGPT, Perplexity y Google. Cuatro retainers nuevos solo por esas citas. Esa es la matemática. Por eso cobramos lo que cobramos. NetWebMedia. CMO fraccional con IA. Auditoría a nueve noventa y siete — se acredita al retainer.

---

## 10. Retainer Credit Anchor (ES) — `10-retainer-credit-es.txt`

**Allocation:** Week 9 Mon TikTok

> La mayoría de las agencias cobra cinco mil al mes y esconde la cuota. Nosotros cobramos nueve noventa y nueve. La auditoría es nueve noventa y siete. El cien por ciento se acredita a tu primer mes. Apostamos a tu favor. Ellos apuestan en contra. La matemática es obvia. netwebmedia punto com.

---

## 11. Niche Pivot (ES) — `11-niche-pivot-es.txt`

**Allocation:** Week 10 Sat IG Reel

> Abogados. Dentistas. Inmobiliarias. Viñas. Salones. Plomeros. Todos están ganando con AEO ahora — y tú no. ¿Por qué? Porque descubrieron una cosa: ChatGPT recomienda tres opciones por consulta. Si no eres una de esas tres, no existes. Nosotros nos aseguramos de que sí. netwebmedia.com.

---

## 12. Tuesday Brief Promo (ES) — `12-tuesday-brief-es.txt`

**Allocation:** Week 10 Mon TikTok

> Todos los martes a las nueve de la mañana. Una jugada AEO para enviar el viernes. Sin relleno. Solo la jugada. Suscríbete en netwebmedia.com barra blog. Es gratis. Nunca vendemos tu email. Solo te ayudamos a aparecer en ChatGPT.

---

## Cost monitoring

After each render completes, the log appends:
- Render number (1–12)
- Submitted timestamp
- Completed timestamp (or "failed" + reason)
- MP4 URL
- Approximate credit cost (HeyGen typically 1 credit per ~15 sec of video)

If a render fails with "insufficient credits": stop the batch, message Carlos before continuing.

---

*Carlos Martinez / CMO — 2026-05-28*
