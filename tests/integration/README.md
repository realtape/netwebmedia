# NetWebMedia Integration Tests

End-to-end tests that run against a real environment (default: production at
`https://netwebmedia.com`) and exercise complete user journeys through real
HTTP endpoints. No mocks. No stubs. No PHP-FPM emulation. If a test passes,
the actual production chain works.

## Why these tests exist

On 2026-05-11 a full production-checkout walkthrough surfaced three bugs
that had been live for days/weeks, undetected because there was no
integration coverage of the billing chain:

| # | Bug | Symptom | Fix commit |
|---|---|---|---|
| 1 | Missing `promo_code` columns on `subscriptions` table | Every paid checkout returned HTTP 500 | `8d454cea3` |
| 2 | `pricing.html` button used `data-plan="cmo_standard"` but catalog has no such plan | "Start Standard $1,490" button returned HTTP 400 "Unknown plan" | `7611959c9` |
| 3 | `/api/billing/cancel` + `/api/billing/my-subscription` scoped only by `org_id` | Any user in a shared org could view + cancel another user's subscription | `3da64f69b` |

None of these would have been caught by unit tests. All three are caught by
this suite.

## What runs

[`billing-flow.test.js`](./billing-flow.test.js) — 15 sequential tests covering:

1. **Catalog integrity** — `/api/billing/plans` returns the expected shape +
   includes `cmo_starter` and `cmo_growth` at the right prices (catches Bug #2)
2. **Auth enforcement** — checkout without a token returns 401
3. **Unknown plan handling** — checkout with `cmo_standard` returns 400
   (regression guard for Bug #2)
4. **Preapproval flow** — `cmo_starter` ($249, CLP ≤ 350k) → MP preapproval
   init_point (regression guard for Bug #1)
5. **Checkout Pro flow** — `cmo_growth` ($999, CLP > 350k) → MP preference
   init_point with the documented "one-time charge" note
6. **State queries** — `/api/billing/my-subscription` reflects the just-
   created subscription
7. **Cancel chain** — cancel cmo_growth (most recent) → my-subscription
   reverts to cmo_starter → cancel cmo_starter → my-subscription is null
8. **Tight scoping** — after cancelling our own subs, `my-subscription` is
   `null` (NOT another user's sub) and a third cancel attempt returns 404
   (regression guard for Bug #3)
9. **Teardown** — final state is clean (no orphaned subs)

## When it runs

- **Nightly** at 04:00 UTC (= 00:00 Chile / 21:00 PT) via GitHub Actions cron
- **On every PR** that touches `api-php/routes/billing.php`,
  `api-php/routes/auth.php`, `pricing.html`, the static fallback JSON, or the
  test itself
- **Manually** via `workflow_dispatch` (Actions tab → "Run workflow")

Workflow definition: [`.github/workflows/billing-integration-test.yml`](../../.github/workflows/billing-integration-test.yml)

## How to run locally

```bash
# Against production (default)
NIGHTLY_TEST_EMAIL="nightly-integration-test@netwebmedia.com" \
NIGHTLY_TEST_PASSWORD="••••••••••••" \
node --test --test-reporter=spec tests/integration/billing-flow.test.js

# Against staging (when staging exists)
ORIGIN=https://staging.netwebmedia.com \
NIGHTLY_TEST_EMAIL="..." \
NIGHTLY_TEST_PASSWORD="..." \
node --test --test-reporter=spec tests/integration/billing-flow.test.js
```

The script will:
1. Try to login as the test user
2. If login returns 401, automatically register the user (first run)
3. Cancel any leftover subs from a previous run (idempotent)
4. Run the 15 assertions
5. Cancel everything it created (teardown — no state accumulates)

## Required GitHub Secrets

| Secret | Purpose | Required |
|---|---|---|
| `NIGHTLY_TEST_EMAIL` | Persistent test user email (e.g. `nightly-integration-test@netwebmedia.com`) | **Yes** |
| `NIGHTLY_TEST_PASSWORD` | Its password | **Yes** |
| `SLACK_OPS_WEBHOOK` | Incoming webhook URL for `#nwm-ops` channel | Optional — for nightly failure alerts |

Set these at: **Settings → Secrets and variables → Actions → New repository secret**

## Cost of running

- ~30 API calls per run (plans, auth, checkout × 2, my-sub × ~5, cancel × ~3)
- ~12 seconds total wall time
- Creates 2 real MP preapprovals + cancels them — zero monetary impact
  (preapprovals must be authorized by a buyer before any charge happens; the
  test never authorizes)
- Adds 0 rows to `webmed6_nwm.users` after the first run (user is persistent)
- Adds 2 rows to `webmed6_nwm.subscriptions` per run, both immediately flipped
  to `status='cancelled'` by the teardown. Garbage-collected naturally.

## Catching new bugs

To extend the test:
1. Add a new `test('NN. description', async () => { … })` block to
   `billing-flow.test.js`. Tests run in source order.
2. Use the `api()` helper for HTTP calls — it sets the right headers
   (mod_security on production 406-blocks bare curl/node user-agents).
3. Always cancel any subscription you create — `cancelAllOurSubs(TOKEN)`
   is safe to call repeatedly (idempotent on 404).
4. PR triggers re-run automatically. Watch the run in the PR conversation.

## What this suite does NOT cover

- Webhook delivery (`/api/billing/webhook`) — would need a real MP IPN POST
  with a valid signature
- Subscription status transitions (`pending` → `active`) — that happens via
  the webhook after a buyer authorizes the preapproval
- Cross-user concurrency (two users hitting checkout simultaneously)
- MP-side errors (network failures to mercadopago.cl, MP rate limits)
- Annual pre-pay flow
- Coupon application (`promo_code` field on checkout)
- The post-checkout `/crm/?billing=return` landing handler in the CRM frontend

These are good follow-ups when the suite has been running stable for a few weeks.
