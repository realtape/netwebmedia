---
name: NetWebMedia phone numbers
description: Voice and WhatsApp are SEPARATE numbers as of 2026-05-25. Voice +1 (760) 334-8731 (Sonetel). WhatsApp +1 (442) 385-4585 (WhatsApp Business App).
type: reference
originSessionId: 37d1e772-d881-4a33-bcac-43099a28e2d6
---
**Split happened 2026-05-25:** voice and WhatsApp are now two different numbers. Do NOT collapse them back to "same number for both" — that was the pre-2026-05-25 setup.

## Voice line — +1 (760) 334-8731 (Sonetel)
Activated 2026-05-13. Sonetel VoIP US DID (Encinitas, CA — area code 760), managed at `app.sonetel.com/account-settings/phone-numbers` from "Carlos's workspace" (Regular plan). Inbound forwards to Carlos. Expiration on file: **May 18, 2026** (annual renewal — check before May 18 each year; if it lapses the number releases to the pool). This is the `tel:`/voice/schema.org number only — NOT the WhatsApp number anymore.

| Use | Value |
|---|---|
| Display (US) | `+1 (760) 334-8731` |
| `tel:` link | `tel:+17603348731` |
| Schema.org telephone | `+1-760-334-8731` |
| E.164 | `+17603348731` |

## WhatsApp line — +1 (442) 385-4585 (WhatsApp Business App)
Carlos's directive 2026-05-25: move WhatsApp off the Sonetel 760 number onto +1 (442) 385-4585 (442 = CA overlay; provider not confirmed). Registered on the **WhatsApp Business App**, NOT Cloud API — so **outbound broadcasts via `wa_flush.php` / Meta Cloud API are NOT available on this number** (the App can't do Cloud API, and the number is locked to the App). The old Sonetel/Meta WABA verification is now decoupled from the public WhatsApp number.

| Use | Value |
|---|---|
| Display (US) | `+1 (442) 385-4585` |
| WhatsApp click-to-chat | `https://wa.me/14423854585` |
| E.164 | `+14423854585` |

✅ **Confirmed live on WhatsApp 2026-05-25** — Carlos test-messaged +1 (442) 385-4585 and it delivered; `wa.me/14423854585` resolves to a real chat. (Earlier candidate +1 619 738-6150, a Zadarma VoIP, failed registration "not on WhatsApp" and was abandoned — don't resurrect it.) Note for future: registering a number on WhatsApp is on-device/OTP-only — Claude can't do it; and WhatsApp Desktop is screen-capture-protected (renders blank), so Claude can't read/drive it via computer-use.

## Shipped 2026-05-25 (commit f8cf7c3db, deployed + smoke-tested green)
Re-pointed WhatsApp → 442 and kept voice → 760 across: `whatsapp.html`, `contact.html`, `email-templates/_base.html`, `api-php/lib/knowledge-base.php`, `crm-vanilla/api/data/kb.json`, `llms.txt`, `BRAND.md`, `CLAUDE.md`, `_deploy/social-media-phone-rollout.md`. `index.html` + `contact.html` schema.org `telephone` stay on 760 (voice). CLAUDE.md routing rule still applies: direct `wa.me/14423854585` links live on `whatsapp.html` and `contact.html` only; other public CTAs route through `/whatsapp.html`.

**Still manual (paste-required, NOT done):** external profiles IG/FB/YT/TikTok/WhatsApp-Business/GBP — updated paste-blocks with the 442 number are in `_deploy/social-media-phone-rollout.md`.

Don't restore the old "we don't offer phone support" chatbot line (removed 2026-05-13).
