# Social Media Phone Rollout — +1 (760) 334-8731

**Created:** 2026-05-13
**Owner:** Carlos
**Status:** Site + email + chatbot updated automatically. Social profiles below are manual — paste each block into the listed field.

---

## Canonical formats

| Use | String |
|---|---|
| Display (US format) | `+1 (760) 334-8731` |
| International display | `+1 760-334-8731` |
| `tel:` link | `tel:+17603348731` |
| WhatsApp click-to-chat | `https://wa.me/17603348731` |
| Schema.org telephone | `+1-760-334-8731` |
| E.164 (Meta, Twilio, etc.) | `+17603348731` |

---

## Instagram — @netwebmedia

**Where:** Edit profile → Bio + Contact options.

**Bio (paste in `Bio` field, 150 char max):**

```
AI-native fractional CMO · US + LATAM SMBs
WhatsApp +1 (760) 334-8731 · hello@netwebmedia.com
$249/mo → ↓
```

**Contact options:** add "Call" with the number, "Text" → leave default, "Email" → hello@netwebmedia.com.

**Action button:** "WhatsApp" (under Edit profile → Action buttons). Paste `https://wa.me/17603348731`.

---

## Facebook — facebook.com/profile.php?id=61573687500626

**Where:** About → Contact and basic info → Edit.

**Phone number:** `+1 760-334-8731` (Facebook prefers no parens here).
**Type:** Mobile.
**Visibility:** Public.

**About → Short description:**

```
AI-native fractional CMO for $1M–$20M US + LATAM SMBs. Strategy, software, execution in one retainer from $249/mo. Bilingual EN/ES. WhatsApp + voice: +1 (760) 334-8731.
```

**Page CTA button:** set to "Send WhatsApp Message" → `https://wa.me/17603348731`.

---

## YouTube — @netwebmedia

**Where:** YouTube Studio → Customization → Basic info → Description.

**Append to channel description:**

```
📞 Direct line: +1 (760) 334-8731 (voice + WhatsApp click-to-chat)
✉️ hello@netwebmedia.com
🌐 netwebmedia.com
```

**Where:** Customization → Basic info → Links → Add link.
- Title: `WhatsApp`
- URL: `https://wa.me/17603348731`

---

## TikTok — @netwebmedia

**Where:** Profile → Edit profile → Bio (80 char max).

**Bio option A (80 chars exact):**

```
AI fractional CMO · $249/mo
WhatsApp +1 760-334-8731
netwebmedia.com
```

**Bio option B (more energetic):**

```
Get cited by ChatGPT.
WA +1 760-334-8731 · netwebmedia.com
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

**Phone:** `+1 760-334-8731`
**Primary phone:** yes.
**Additional phone:** WhatsApp same number — note in description.
**Short name:** netwebmedia

---

## What was NOT updated automatically (paste-required)

- [ ] Instagram bio + action button
- [ ] Facebook About + CTA button
- [ ] YouTube channel description + links section
- [ ] TikTok bio + email field
- [ ] WhatsApp Business profile description + greeting message
- [ ] Google Business Profile (if active)
- [ ] Email signature in Carlos's personal Gmail (hello@netwebmedia.com)

## What WAS updated automatically (already shipped)

- ✅ `whatsapp.html` — active wa.me + tel CTA replacing the "pending Meta" banner
- ✅ `contact.html` — phone row in contact column + Organization schema telephone
- ✅ `index.html` — Organization schema telephone for AEO/Google
- ✅ `BRAND.md` — phone added to governance and localization checklist
- ✅ `email-templates/_base.html` — phone + WhatsApp in every email footer
- ✅ `crm-vanilla/api/data/kb.json` — chatbot answers with phone in EN/ES
- ✅ `api-php/lib/knowledge-base.php` — public chatbot stops saying "no phone"
- ✅ `llms.txt` — AEO crawlers see the phone in the company facts block

---

## Notes

- **WABA outbound broadcasts** (the `wa_flush.php` send pipeline that needs `WA_PHONE_ID`) still depend on Meta business verification — target June 2026. The number above works for inbound click-to-chat *today* via wa.me. Once Meta verification clears, this same number gets the WABA `phone_number_id` and outbound broadcasts switch on without a number change.
- **`tel:` links** open the system dialer on mobile and FaceTime/Skype/Teams on desktop. Voice routing for the line is configured separately (whoever hosts the number — Twilio, OpenPhone, Google Voice, etc.).
- **Routing to `/whatsapp.html`** stays the canonical CTA pattern in CTAs across the site. Direct `wa.me/17603348731` links live on `whatsapp.html` and `contact.html` only — that's per the CLAUDE.md rule and stays intact.
