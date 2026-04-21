# NWM CRM Launch Campaign — Operational Plan

**Campaign name:** `NWM CRM Launch — Carlos26`
**Launch date:** Wednesday, April 22, 2026
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

### DNS pre-flight checklist (must complete before Wave 1)

Current state as of 2026-04-20:
- SPF ✅ exists: `v=spf1 +a +mx include:relay.mailchannels.net include:_spf.google.com ~all`
- DKIM ❌ missing (Resend domain not verified)
- DMARC ❌ missing

#### Step 1 — Verify netwebmedia.com in Resend
1. Log in at **resend.com** → Domains → **Add Domain** → enter `netwebmedia.com`
2. Resend will display two DNS records. Add both at your DNS host (InMotion cPanel → Zone Editor):

| Type | Host | Value |
|------|------|-------|
| TXT | `resend._domainkey.netwebmedia.com` | (DKIM value shown by Resend — paste exactly) |
| TXT | `_dmarc.netwebmedia.com` | `v=DMARC1; p=quarantine; rua=mailto:hello@netwebmedia.com; adkim=r; aspf=r` |

3. Click **Verify** in Resend — propagation takes 5-30 min.

#### Step 2 — Update SPF to include Resend
In cPanel DNS, **edit** the existing TXT record for `netwebmedia.com` to add `include:amazonses.com`:

```
v=spf1 +a +mx include:relay.mailchannels.net include:_spf.google.com include:amazonses.com ~all
```

#### Step 3 — Confirm with MXToolbox
```
https://mxtoolbox.com/dmarc.aspx?domain=netwebmedia.com
https://mxtoolbox.com/spf.aspx?domain=netwebmedia.com
```
Both should pass before sending Wave 1.

#### Step 4 — Set RESEND_API_KEY on the server
In cPanel → File Manager → `crm-vanilla/api/config.local.php`, add:
```php
define('RESEND_API_KEY', 're_...');  // from resend.com → API Keys
```

---

## 4. List segmentation & send schedule — Month 1 (Resend Free, 100/day)

**Constraint:** Resend free plan = 100 emails/day, 3,000/month.  
**Total contacts:** ~3,400 → full list covered in ~34 days.  
**Month 1 goal:** Get the announcement email to every contact in priority order.  
**Drip sequence:** Starts Month 2 (upgrade to Resend Pro at $20/mo for 50K sends).

> ⚠️ **ACTION REQUIRED before April 22:** Extend `Carlos26` expiry in DB.  
> With 100/day the last contacts get the email on ~May 25 — the code must be valid then.  
> Remove the time limit and rely only on `max_uses = 500`:
> ```sql
> UPDATE coupons SET valid_until = NULL WHERE code = 'Carlos26';
> ```

### Day-by-day schedule (send at 10:00 local each day)

| Dates | Days | Emails | Segment | Cumulative |
|---|---|---|---|---|
| Apr 22 | 1 | 100 | Top leads — batch 1 (score 98+) | 100 |
| Apr 23 | 1 | 100 | Top leads — batch 2 (70) + USA high-intent start (30) | 200 |
| Apr 24 – May 1 | 8 | 800 | USA high-intent (`score ≥ 60`, `website != null`) | 1,000 |
| May 2 – May 5 | 4 | 400 | Chile active (opened email last 60 days) | 1,400 |
| May 6 – May 21 | 16 | 1,600 | USA broad (remaining USA contacts) | 3,000 |
| May 22 – May 27 | 6 | 400 | Chile broad (remaining Chile contacts) | 3,400 ✓ |

**All contacts reached by ~May 27.** Month 2 (June): upgrade to Pro and start the 5-email drip for everyone who opened/clicked.

---

## 5. Drip sequence — Month 2+ (requires Resend Pro, $20/mo)

Triggered per contact starting the day after they receive their announcement email.

| Delay | Type | Subject (EN) | Subject (ES) |
|---|---|---|---|
| +3 days | Demo | `See NWM CRM in 90 seconds (no signup)` | `NWM CRM en 90 segundos (sin registro)` |
| +7 days | Case study | `How {{company_example}} 3×'d pipeline in 30 days` | `Cómo {{company_example}} triplicó su pipeline en 30 días` |
| +10 days | FAQ | `Your questions about NWM CRM — answered` | `Tus preguntas sobre NWM CRM — respondidas` |
| +14 days | Last call | `Carlos26 — only X activations left` | `Carlos26 — quedan solo X activaciones` |

> Note: "Last call" copy changed from expiry-date to uses-remaining, since the time limit was removed.

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

## 9. Daily checklist — Month 1 (100/day send rhythm)

- [ ] 09:00 — check MP dashboard for overnight webhook failures
- [ ] 09:45 — queue today's 100-contact batch in CRM → Marketing → Campaign builder (filter by segment + offset)
- [ ] 10:00 — fire send; confirm Resend delivery report shows 100 queued
- [ ] 16:00 — respond to reply-to inbox (`hello@netwebmedia.com`)
- [ ] 17:00 — check unsubscribe rate in Resend dashboard; if >2% on a segment, pause and revise copy before next batch

**Weekly:** Check `coupons.uses_count` for Carlos26 — pause if approaching 500.

---

## 10. Post-launch

- Archive coupon (`UPDATE coupons SET active=0 WHERE code='Carlos26'`) — auto-happens via `valid_until`
- Export subscriber cohort: `SELECT * FROM subscriptions WHERE promo_code='Carlos26'` → feed into month-4 retention sequence
- Publish case study with actual MRR numbers on `/blog.html`
