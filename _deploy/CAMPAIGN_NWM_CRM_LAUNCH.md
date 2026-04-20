# NWM CRM Launch Campaign — Operational Plan

**Campaign name:** `NWM CRM Launch — Carlos26`
**Launch date:** Today
**Duration:** 7 days (launch window) + 14-day extension if under-subscribed
**Target:** 500 activations of `Carlos26` → realistically 80–120 paid signups

---

## 1. Offer

- **Promo code:** `Carlos26`
- **Discount:** 50% off for the first 3 billing cycles
- **Applies to:** `cmo_starter`, `cmo_growth`, `cmo_scale`, `crm_starter`, `crm_pro`, `crm_agency`
- **Max uses:** 500 (then code auto-deactivates)
- **Expires:** 7 days after launch (auto via `coupons.valid_until`)
- **Stacking:** Does not combine with other discounts or annual pre-pay

**Effective pricing with Carlos26:**
| Plan | Regular /mo | With Carlos26 (3 mo) | Setup |
|---|---|---|---|
| CMO Starter | $249 | $124 | $249 |
| CMO Growth ⭐ | $999 | $499 | $999 |
| CMO Scale | $1,999 | $999 | $1,999 |

---

## 2. Infrastructure (built today)

- **Coupon system:** `coupons` table in CRM DB + `bl_coupon_lookup/applies/apply_discount` helpers in `api-php/routes/billing.php`
- **Coupon endpoint:** `GET /api/billing/validate-coupon?code=Carlos26&plan=cmo_growth` (public, returns `{valid, discount_pct, discount_cycles}`)
- **Checkout:** `POST /api/billing/checkout` now accepts `promo_code` — applies the discount to MP `transaction_amount` (preapproval) AND to the one-time Checkout Pro flow (setup + first month)
- **Subscriptions table:** now records `promo_code`, `discount_pct`, `discount_cycles` for each signup
- **Uses counter:** `coupons.uses_count` auto-increments on successful checkout
- **Unsubscribe:** already wired — `unsubscribes` table is auto-excluded from every campaign send (`crm-vanilla/api/handlers/campaigns.php`)

---

## 3. Sender identity

- **From name:** `Carlos @ NetWebMedia`
- **From email:** `hello@netwebmedia.com`
- **Reply-to:** `hello@netwebmedia.com`
- **SPF / DKIM / DMARC:** verify before first send (`https://mxtoolbox.com/dmarc.aspx?domain=netwebmedia.com`)

---

## 4. List segmentation & waves

We will send to our **~3,400 existing contacts** (2,400 USA + ~1,000 Chile) in waves to protect deliverability.

| Wave | Segment | Size | When |
|---|---|---|---|
| 1 — Top leads | `segment=top_leads` (170 scored 98+) | 170 | Day 0, 10:00 local |
| 2 — USA high-intent | USA contacts with `website!=null` and `score>=60` | ~800 | Day 1, 10:00 |
| 3 — Chile active | Chile contacts opened email in last 60 days | ~400 | Day 2, 10:00 |
| 4 — USA broad | Remaining USA contacts | ~1,600 | Day 3–4, spread 500/day |
| 5 — Chile broad | Remaining Chile contacts | ~600 | Day 5, 10:00 |

**Daily cap:** 500 sends/day max from `hello@netwebmedia.com` during launch week to maintain domain reputation.

---

## 5. Drip sequence (per wave)

| Day | Type | Subject (EN) | Subject (ES) |
|---|---|---|---|
| 0  | Announce | `NWM CRM is live — 50% off for launch week` | `NWM CRM ya está en vivo — 50% de descuento esta semana` |
| 3  | Demo | `See NWM CRM in 90 seconds (no signup)` | `NWM CRM en 90 segundos (sin registro)` |
| 7  | Case study | `How {{company_example}} 3×'d pipeline in 30 days` | `Cómo {{company_example}} triplicó su pipeline en 30 días` |
| 10 | FAQ | `Your questions about NWM CRM — answered` | `Tus preguntas sobre NWM CRM — respondidas` |
| 14 | Last call | `Carlos26 expires in 24 hours` | `Carlos26 expira en 24 horas` |

Links in every email:
- Primary CTA → `https://netwebmedia.com/nwm-crm.html?promo=Carlos26&utm_source=email&utm_campaign=nwm_crm_launch&utm_content={{day}}`
- Unsubscribe → `{{unsubscribe_url}}` (auto-injected by CRM footer template)

---

## 6. Targeting copy — niche-pain hooks

Pulled from existing `email_sequences_8niches.json`. The Day 3 "Demo" email will use the niche-specific pain-point opener per contact:

- **Restaurants** → "No online ordering = 40% revenue leak to DoorDash."
- **Law Firms** → "Gmail on your letterhead is quietly downgrading your retainer fees."
- **Health** → "Patients are calling to book — 60% hang up when voicemail answers."
- **Real Estate** → "Your listings have no 3D tours. Zillow's do."
- **Beauty** → "Free Wix subdomain = lost bookings. Let AI generate your real site."
- **Tourism** → "OTAs take 18% of every booking. Your own site takes 3%."
- **SMB** → "Invisible on Google Maps? That's 3 of 10 local leads gone."
- **Local Specialist** → "You're closed at 9 PM. Your competitor's AI agent isn't."

---

## 7. Expected metrics (target vs. realistic)

| Metric | Target | Realistic (based on prior USA wave) |
|---|---|---|
| Delivery rate | >97% | 95–98% |
| Open rate | >35% | 28–47% |
| Click rate | >8% | 4–10% |
| Landing page conversion (CTA → checkout) | >4% | 2–5% |
| Checkout → paid | >25% | 18–32% |
| **Total paid activations (Carlos26)** | 120 | **80–120** |

MRR impact if 100 activations land on the Growth tier average: 100 × $499 = **$49,900 MRR** (during discount window) → $99,900 MRR after month 4.

---

## 8. Access-control lockdown (TO DO before first send)

The current CRM grants role='user' on signup and lets them in. For the launch we need:

**Required change in `crm-vanilla/api/handlers/auth.php` signup flow:**
- New signups → `status='pending_payment'` (add this to the enum)
- On MP webhook confirming payment → flip to `status='active'` + `role='admin'` (scoped to their own org)
- Every protected handler checks `status='active'` before serving data; returns HTTP 402 Payment Required if not

**Carlos stays `role='superadmin'`** — unchanged, can read any org for support.

**Files to modify (flagged for the follow-up session):**
1. `crm-vanilla/api/schema.sql` — add `'pending_payment'` to `users.status` enum
2. `crm-vanilla/api/handlers/auth.php` — signup writes `pending_payment`, login still works but returns a `requires_payment=true` flag
3. `crm-vanilla/api/lib/guard.php` (new) — middleware that checks status before serving any `/api/contacts`, `/api/deals`, `/api/campaigns` endpoints
4. `api-php/routes/billing.php` — on webhook `status='authorized'`, look up `users.id` and `UPDATE users SET status='active', role='admin' WHERE id=?`

**Not touched this session** because it requires coordinated testing — commit to a branch separately.

---

## 9. Daily checklist during launch week

- [ ] 09:00 — check MP dashboard for overnight webhook failures
- [ ] 09:30 — send that day's wave (launch from `/crm/marketing.html` → Campaign builder)
- [ ] 10:00 — monitor `/api/billing/validate-coupon` usage via `coupons.uses_count`
- [ ] 16:00 — respond to reply-to inbox (`hello@netwebmedia.com`)
- [ ] 17:00 — check unsubscribe rate; if >2% pause the next wave and re-copy

---

## 10. Post-launch

- Archive coupon (`UPDATE coupons SET active=0 WHERE code='Carlos26'`) — auto-happens via `valid_until`
- Export subscriber cohort: `SELECT * FROM subscriptions WHERE promo_code='Carlos26'` → feed into month-4 retention sequence
- Publish case study with actual MRR numbers on `/blog.html`
