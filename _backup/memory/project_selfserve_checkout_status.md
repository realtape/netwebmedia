---
name: project_selfserve_checkout_status
description: "Self-serve $249 AEO Starter checkout is WIRED + deployed but NOT publicly exposed — the pricing CTA still goes to the contact form, pending a MercadoPago end-to-end test"
metadata: 
  node_type: memory
  type: project
  originSessionId: fc56ecde-f921-4b0f-8719-fe48d7858325
---

As of 2026-05-29 (commit 25d867de1), the self-serve Mercado Pago checkout for AEO Starter ($249/mo) is built and live in code but **not exposed to the public yet**:

- Front-end wiring shipped: `register.html?plan=cmo-starter` shows checkout-intent copy and, after signup, calls `NWMApi.billingCheckout('cmo_starter')` → `POST /api/billing/checkout` → redirects to the MP `init_point`. `js/api-client.js` now exposes `billingCheckout()`/`billingPlans()`.
- Backend already existed and is production-grade: `api-php/routes/billing.php` (`cmo_starter` plan, MP preapproval for amounts under CLP 350k, signed webhook flips `users.status` pending_payment → active, coupons, Meta CAPI).
- **The public `pricing.html` AEO Starter CTA STILL points to `contact.html?plan=cmo-starter&intent=sales`** (a form). It was deliberately NOT flipped to `register.html?plan=cmo-starter`.

**Why not flipped:** taking real money can't be verified from the dev environment. Gate before go-live: (1) `GET /api/billing/mp-probe` (admin X-Auth-Token) to confirm token is TEST vs PROD + site_id MLC; (2) one end-to-end test purchase via register.html?plan=cmo-starter → MP → back; (3) confirm the webhook flipped the test user's status → active.

**How to apply / flip live:** once the MP test passes, change the pricing.html Starter primary CTA href to `/register.html?plan=cmo-starter` (keep "Talk to sales" as secondary). One-line change. The i18n gotcha: register.html copy must be set via `data-en`/`data-es` attributes (nwm-i18n.js re-applies them and clobbers raw textContent). Related: [[project_cmo_premium_pricing]].
