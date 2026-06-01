---
name: project_selfserve_checkout_status
description: Self-serve $249 AEO Starter checkout is LIVE end-to-end on MercadoPago (PROD) as of 2026-05-29. Only a real completed-payment test remains to confirm webhook activation in practice.
metadata: 
  node_type: memory
  type: project
  originSessionId: fc56ecde-f921-4b0f-8719-fe48d7858325
---

As of 2026-05-29 the self-serve **$249/mo AEO Starter** checkout is wired end-to-end on **MercadoPago** and live:

- **pricing.html already had the checkout** (NOT a contact form — an earlier audit note got this wrong). The prominent `[data-plan="cmo_starter"]` button ("Start AEO Starter — $249/mo →") is the live CTA: unauthed → `register.html?plan=cmo_starter&next=/pricing.html?checkout=cmo_starter`; authed → POSTs `/api/billing/checkout` → MP `init_point`, with an error modal + auto-checkout-on-return.
- **The break was register.html** ignoring `?next=` (always → /app/) + dash/underscore mismatch. Fixed (commit 5aa2e3a3a): register.html normalizes the plan code (accepts `cmo_starter` + `cmo-starter`) and honors a same-site `?next=` (open-redirect-guarded), completing the pricing→register→pricing auto-checkout loop. Also exposes `NWMApi.billingCheckout()` in js/api-client.js (commit 25d867de1).
- **MercadoPago verified PROD-ready** via the admin `GET /api/billing/mp-probe` (run with the NWM-browser admin session token): `token_kind: PROD`, account **entrepoker@gmail.com** active (sell allowed, CLP/site MLC Chile), recurring **preapproval creation returns a valid `mercadopago.cl/subscriptions/checkout` init_point**, and the webhook signing secret is set (POST to `/api/billing/webhook` returns "Invalid signature", not "not configured"). So MP_ACCESS_TOKEN / MP_PUBLIC_KEY / MP_WEBHOOK_SECRET are all configured in production — no MP dashboard login was needed (that's a separate consumer login).

**Remaining (Carlos): one real completed-payment test.** The token is PROD, so a real signup→pay charges a real card. Recommended: register a fresh test account → pay $249 via register.html?plan=cmo_starter (or the pricing button) → confirm the user flips `pending_payment → active` (webhook) → refund. Do this before driving paid traffic. Note the MP account type is "personal" — works, but a dedicated business MP account may be worth considering for tax/compliance (Carlos's call). Related: [[project_cmo_premium_pricing]].
