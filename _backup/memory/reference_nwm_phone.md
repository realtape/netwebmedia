---
name: NetWebMedia phone number
description: Canonical NWM phone number — same line for voice + WhatsApp click-to-chat. Activated 2026-05-13. Hosted at Sonetel; renews annually around May 18.
type: reference
originSessionId: 37d1e772-d881-4a33-bcac-43099a28e2d6
---
NetWebMedia's direct line, activated 2026-05-13: **+1 (760) 334-8731**.

**Provider / management.** Sonetel VoIP US DID (Encinitas, CA — area code 760), managed at `app.sonetel.com/account-settings/phone-numbers` from "Carlos's workspace" (Regular plan). Inbound calls forward to Carlos Martinez. Expiration on file: **May 18, 2026** (annual renewal — check this before May 18 each year). Workspace balance shown 2026-05-13: 995 credits + $0.50 USD — keep topped up for outbound voice and to avoid auto-suspension at renewal.

**Why this matters for the codebase.** Because the number is Sonetel-hosted, two things follow:
1. If Sonetel renewal lapses, the number releases to the pool — at which point every reference in `whatsapp.html`, `contact.html`, `index.html` Org schema, `BRAND.md`, `email-templates/_base.html`, `kb.json`, `knowledge-base.php`, `llms.txt`, and `CLAUDE.md` becomes a dead pointer. Treat the Sonetel renewal as a hard infra dependency.
2. Sonetel numbers can register with WhatsApp (SMS + voice OTP both work) but it must be done explicitly via WhatsApp Business or Meta Cloud API — it isn't automatic from Sonetel. If `wa.me/17603348731` errors with "this number is not on WhatsApp," that's the cause. Re-verify via WhatsApp Business app.

| Use | Value |
|---|---|
| Display (US) | `+1 (760) 334-8731` |
| International display | `+1 760-334-8731` |
| `tel:` link | `tel:+17603348731` |
| WhatsApp click-to-chat | `https://wa.me/17603348731` |
| Schema.org telephone | `+1-760-334-8731` |
| E.164 (Meta/Twilio config) | `+17603348731` |

Same number serves voice and WhatsApp click-to-chat. Outbound WhatsApp broadcasts via Meta Cloud API (`wa_flush.php`, `WA_PHONE_ID`) still pending Meta business verification — target June 2026. When verification completes, this same number gets a Meta `phone_number_id` and broadcasts switch on without changing the public number.

CLAUDE.md routing rule still applies: direct `wa.me/17603348731` links live on `whatsapp.html` and `contact.html` only. Other public CTAs continue to point at `/whatsapp.html` (the canonical funnel surface).

Before 2026-05-13, NetWebMedia had no public phone number and the public chatbot KB explicitly told users "we don't offer phone support." That positioning has been updated to "async-first, but voice + WhatsApp on the same number when real-time is the right fit." Don't restore the old "no phone" claim.

Where it lives in the codebase: `whatsapp.html` (live CTA), `contact.html` (visible row + schema), `index.html` (schema), `BRAND.md` (§17 + §15), `email-templates/_base.html` (footer), `crm-vanilla/api/data/kb.json` (chatbot KB), `api-php/lib/knowledge-base.php` (public chatbot KB), `llms.txt` (AEO crawlers). External profiles (IG/FB/YT/TikTok/WhatsApp Business/GBP) are listed in `_deploy/social-media-phone-rollout.md` as paste-required manual updates.
