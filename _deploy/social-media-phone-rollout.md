# Social Media Phone Rollout — Voice +1 (760) 334-8731 · WhatsApp +1 (619) 738-6150

**Created:** 2026-05-13 · **Updated:** 2026-05-25 (WhatsApp split onto a separate Zadarma number)
**Owner:** Carlos
**Status:** Site + email + chatbot updated automatically. Social profiles below are manual — paste each block into the listed field. **The WhatsApp number changed — re-paste every WhatsApp field.**

---

## Canonical formats

**Voice line (Sonetel) — +1 (760) 334-8731**

| Use | String |
|---|---|
| Display (US format) | `+1 (760) 334-8731` |
| International display | `+1 760-334-8731` |
| `tel:` link | `tel:+17603348731` |
| Schema.org telephone | `+1-760-334-8731` |
| E.164 | `+17603348731` |

**WhatsApp line (Zadarma, WhatsApp Business app) — +1 (619) 738-6150**

| Use | String |
|---|---|
| Display (US format) | `+1 (619) 738-6150` |
| International display | `+1 619-738-6150` |
| WhatsApp click-to-chat | `https://wa.me/16197386150` |
| E.164 | `+16197386150` |

---

## Instagram — @netwebmedia

**Where:** Edit profile → Bio + Contact options.

**Bio (paste in `Bio` field, 150 char max):**

```
AI-native fractional CMO · US + LATAM SMBs
WhatsApp +1 (619) 738-6150 · hello@netwebmedia.com
$249/mo → ↓
```

**Contact options:** add "Call" with the voice number +1 (760) 334-8731, "Text" → leave default, "Email" → hello@netwebmedia.com.

**Action button:** "WhatsApp" (under Edit profile → Action buttons). Paste `https://wa.me/16197386150`.

---

## Facebook — facebook.com/profile.php?id=61573687500626

**Where:** About → Contact and basic info → Edit.

**Phone number:** `+1 760-334-8731` (voice line; Facebook prefers no parens here).
**Type:** Mobile.
**Visibility:** Public.

**About → Short description:**

```
AI-native fractional CMO for $1M–$20M US + LATAM SMBs. Strategy, software, execution in one retainer from $249/mo. Bilingual EN/ES. Voice +1 (760) 334-8731 · WhatsApp +1 (619) 738-6150.
```

**Page CTA button:** set to "Send WhatsApp Message" → `https://wa.me/16197386150`.

---

## YouTube — @netwebmedia

**Where:** YouTube Studio → Customization → Basic info → Description.

**Append to channel description:**

```
📞 Voice: +1 (760) 334-8731 · WhatsApp: +1 (619) 738-6150
✉️ hello@netwebmedia.com
🌐 netwebmedia.com
```

**Where:** Customization → Basic info → Links → Add link.
- Title: `WhatsApp`
- URL: `https://wa.me/16197386150`

---

## TikTok — @netwebmedia

**Where:** Profile → Edit profile → Bio (80 char max).

**Bio option A (80 chars exact):**

```
AI fractional CMO · $249/mo
WhatsApp +1 619-738-6150
netwebmedia.com
```

**Bio option B (more energetic):**

```
Get cited by ChatGPT.
WA +1 619-738-6150 · netwebmedia.com
```

**Email field:** hello@netwebmedia.com.
**Website field:** https://netwebmedia.com (TikTok requires 1,000 followers for clickable bio links — keep as text until then).

---

## WhatsApp Business app — Profile

**Where:** WhatsApp Business → Settings → Business profile.

**Business name:** NetWebMedia
**Category:** Marketing & advertising service
**Description (256 char max):**

```
AI-native fractional CMO for $1M–$20M US + LATAM SMBs. Strategy, software, and execution in one retainer from $249/mo. Bilingual EN/ES. Async-first via WhatsApp, chat, email. AEO specialists — get cited by ChatGPT, Perplexity, Google AI Overviews.
```

**Address:** leave blank (remote-first).
**Email:** hello@netwebmedia.com
**Website:** https://netwebmedia.com
**Greeting message (auto):**

```
Hi 👋 thanks for reaching NetWebMedia. Carlos reads every inbound personally — reply within one business day, usually same-hour during America/Santiago business hours. What can we help with: pricing, a free AEO audit, or partner program?
```

---

## Google Business Profile (if created)

**Phone:** `+1 760-334-8731` (voice)
**Primary phone:** yes.
**Additional phone:** WhatsApp +1 (619) 738-6150 — note in description.
**Short name:** netwebmedia

---

## What was NOT updated automatically (paste-required — WhatsApp number changed, re-do these)

- [ ] Instagram bio + action button
- [ ] Facebook About + CTA button
- [ ] YouTube channel description + links section
- [ ] TikTok bio + email field
- [ ] WhatsApp Business profile description + greeting message
- [ ] Google Business Profile (if active)
- [ ] Email signature in Carlos's personal Gmail (hello@netwebmedia.com)

## What WAS updated automatically (shipped 2026-05-25)

- ✅ `whatsapp.html` — wa.me + heading now point to +1 (619) 738-6150; "Call" button stays on the 760 voice line
- ✅ `contact.html` — phone row split into voice (760) + WhatsApp (619); Organization schema telephone stays 760
- ✅ `index.html` — Organization schema telephone stays 760 (voice; unchanged)
- ✅ `BRAND.md` — governance + localization checklist split into voice/WhatsApp
- ✅ `email-templates/_base.html` — footer WhatsApp link → 619, voice tel → 760
- ✅ `crm-vanilla/api/data/kb.json` — chatbot answers split the two numbers (EN/ES)
- ✅ `api-php/lib/knowledge-base.php` — public chatbot splits voice (760) + WhatsApp (619)
- ✅ `llms.txt` — AEO crawlers see voice + WhatsApp as separate numbers
- ✅ `CLAUDE.md` — phone section rewritten for the split

---

## Notes

- **WhatsApp is now on the Business App (Zadarma number, +1 619-738-6150), not Cloud API.** Inbound click-to-chat via `wa.me/16197386150` works today. **Outbound broadcasts (`wa_flush.php` → Meta Cloud API, `WA_PHONE_ID`) are NOT available on this number** — the WhatsApp Business App cannot use Cloud API, and the number is locked to the App. If outbound broadcasting becomes a priority, that needs a Cloud API number + Meta business verification (a separate decision).
- **Voice line** stays on the Sonetel number +1 (760) 334-8731. `tel:` links open the system dialer on mobile and FaceTime/Skype/Teams on desktop.
- **Routing to `/whatsapp.html`** stays the canonical CTA pattern across the site. Direct `wa.me/16197386150` links live on `whatsapp.html` and `contact.html` only — that's per the CLAUDE.md rule and stays intact.
