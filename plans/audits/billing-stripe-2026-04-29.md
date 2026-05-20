# Billing — Stripe + Sentry DSN — 2026-04-29

US billing rail unlocked. Stripe runs in parallel with Mercado Pago; locale picks the rail.

## Stripe handler

**Files changed**

- `api-php/routes/billing.php` — added Stripe helpers, locale picker, `bl_stripe_checkout()`, `bl_stripe_webhook()`, schema columns, cancel-route Stripe branch.
- `api-php/lib/db.php` — `config()` now exposes a default `sentry_dsn` (Task 2).
- `crm-vanilla/api/config.php` — `SENTRY_DSN` constant default (Task 2).

**Endpoint**

`POST /api-php/api/billing/checkout` — unchanged URL. Body `{ plan_code, promo_code? }`. Optional `?currency=usd|clp` or `?rail=stripe|mp` query string overrides rail selection.

**Request → response shape (Stripe path)**

```json
{
  "subscription_id": 142,
  "flow": "stripe_subscription",
  "rail": "stripe",
  "session_id": "cs_test_a1b2...",
  "init_point": "https://checkout.stripe.com/c/pay/cs_test_a1b2...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_a1b2..."
}
```

`init_point` is preserved so the existing frontend redirect (`window.location = res.init_point`) keeps working with zero JS changes. `url` is added for clarity.

**Locale detection** (`bl_pick_rail()` in `billing.php`, deterministic, no IP DB):

1. `?currency=usd` → Stripe. `?currency=clp` → MP.
2. `?rail=stripe|mp` → that rail.
3. `CF-IPCountry` header in LatAm whitelist (CL, AR, PE, CO, MX, BR, UY, PY, BO, EC, VE, CR, GT, HN, SV, NI, PA, DO) → MP.
4. `Accept-Language` matches `es-{cl,ar,pe,...}` or `pt-br` → MP.
5. Otherwise: Stripe **if** `stripe_secret_key` present; else graceful fallback to MP.

**What Carlos must add to `config.local.php`** (server only, never committed; merged by `config()`):

```php
return [
  // ...existing keys...
  'stripe_secret_key'        => 'sk_live_...',     // or sk_test_... in dev
  'stripe_webhook_secret'    => 'whsec_...',       // from the webhook endpoint setup screen
  'stripe_price_cmo_starter' => 'price_xxxxx',     // monthly USD recurring
  'stripe_price_cmo_growth'  => 'price_xxxxx',
  'stripe_price_cmo_scale'   => 'price_xxxxx',
  // optional: per-plan IDs for any other plan_code we want on Stripe
  // 'stripe_price_crm_starter' => 'price_xxxxx', etc.
];
```

If `stripe_secret_key` is missing, the request silently falls through to the Mercado Pago path — no 503, no errors. If the key is present but the price ID for the requested plan isn't mapped, the handler returns **503 + "Stripe billing not yet configured — contact sales"** with a `detail` field naming the missing plan_code.

## Webhook

- **Route:** `POST /api-php/api/billing/stripe-webhook` (separate from the existing `/webhook` MP route).
- **Verification:** `bl_stripe_verify_signature()`. Reads `Stripe-Signature` header (`t=...,v1=...`), recomputes `HMAC-SHA256(t + "." + raw_body, webhook_secret)`, compares with `hash_equals` against every `v1=` element. 300-second tolerance window. Missing secret or invalid signature → row written to `billing_events` with topic `unverified_no_secret` / `invalid_signature` and request rejected.
- **Events handled:**
  - `checkout.session.completed` — flips subscription to `active`, stores `stripe_subscription_id` + `stripe_customer_id`, promotes user to `admin` (superadmin preserved).
  - `invoice.paid` — refreshes `current_period_end`, keeps subscription `active`.
  - `customer.subscription.deleted` — marks `cancelled`, suspends owning user (superadmin preserved).
- All events logged to `billing_events` regardless of type, so unhandled events are still inspectable.

## Sentry DSN

- Public DSN (`https://69fce09a20f1...@o4511302572441600.ingest.us.sentry.io/4511302588235776`) confirmed in `index.html:35` (`window.NWM_SENTRY_DSN`).
- `crm-vanilla/api/config.php` — `SENTRY_DSN` constant defined inline after the `IMPORT_CSV_TOKEN` block, override-safe with `defined()` guard.
- `api-php/lib/db.php` — `config()['sentry_dsn']` now falls back to the same DSN if neither the home file nor `config.local.php` provides one. `api-php/lib/sentry-vanilla.php` reads `$cfg['sentry_dsn']`, so PHP-side capture activates immediately on next deploy with no further config.
- No separate `api-php/config.php` file exists — config flows through `lib/db.php`'s `config()`.

## Migration path (local → live)

1. Carlos creates 3 Products in Stripe Dashboard (test mode first), each with one recurring monthly USD Price. Copy the `price_...` IDs.
2. On the cPanel server, edit `/home/webmed6/public_html/api-php/config.local.php` (or its deploy-time generator) to add the 5 keys above with `sk_test_*` first.
3. Deploy `billing.php` via the existing `deploy-site-root.yml` workflow. The schema migration is idempotent — first request triggers `ALTER TABLE` adds for `rail`, `stripe_*`, `currency` columns.
4. Test with `?currency=usd` from any IP: log in, hit `/api/billing/checkout`, complete with Stripe test card `4242 4242 4242 4242`. Confirm `subscriptions` row flips to `active` and user role flips to `admin` after webhook.
5. Register webhook in Stripe Dashboard pointing to `https://netwebmedia.com/api-php/api/billing/stripe-webhook` with events `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`. Paste the `whsec_...` into `config.local.php`.
6. Swap `sk_test_*` for `sk_live_*` and the live `whsec_*` once the dashboard is verified. Key prefix dictates mode — no code change needed.

## Risks Carlos should know

- **Test → live key swap is one-way per environment.** Test events never deliver to a webhook configured with the live secret and vice versa. Don't mix.
- **Dunning is on Stripe.** When a card fails, Stripe retries per the dashboard's smart-retry policy. We don't get notified until either `invoice.paid` or `customer.subscription.deleted` fires. If Carlos wants in-app dunning UX, we need to handle `invoice.payment_failed` too — not in this PR.
- **Refunds and proration are not exposed in our UI.** Cancel button calls `cancel_at_period_end=true`, so customers keep access until the cycle ends and we don't refund prorated amounts. Manual refunds via Stripe Dashboard only.
- **Promo codes:** the Stripe path currently ignores our internal `coupons` table and instead enables Stripe-native promotion codes (`allow_promotion_codes=true`). Carlos must recreate `Carlos26` (and any future codes) in Stripe Dashboard if he wants them honoured on the USD rail. The metadata field still records the user-entered string for traceability.
- **Webhook race:** if a customer redirects to `thanks.html` faster than Stripe delivers `checkout.session.completed`, the subscription row is briefly `pending`. The thanks page should poll `/api/billing/my-subscription` rather than assume `active`.
- **`bl_ensure_schema()` runs on every billing route hit.** That's 8 idempotent `ALTER TABLE` attempts per request. They short-circuit at the SQL parser level on duplicate-column errors so cost is negligible, but if we ever add billing routes on hot paths we should gate this behind a memoized flag.
- **No SDK = manual API version bumps.** We're using whatever Stripe API version the account defaults to. If Stripe ships a breaking change, the handler will need an explicit `Stripe-Version` header. Not urgent — defaults are stable for years.
