# NetWebMedia OS — Phase 1 Foundation · build status & pre-work

**Status:** Scaffold built in the working tree — NOT committed, NOT deployed
**Date:** 2026-06-01 (W1)
**Owner:** Claude (build) · gated items need Carlos's OK
**Parent plan:** [V1-PLAN.md](./V1-PLAN.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) §12 Phase 1

This is the "yes we can move from vanilla to production" proof-in-code. It wires a thin OS shell + provisioning + the cross-tenant guardrail onto the existing, production-tested org-tenancy layer in [`crm-vanilla/api/lib/tenancy.php`](../../crm-vanilla/api/lib/tenancy.php). Nothing here is outward-facing yet.

---

## 1. What shipped in the working tree

| File | What it is |
|---|---|
| [`crm-vanilla/api/schema_os_orgs_extend.sql`](../../crm-vanilla/api/schema_os_orgs_extend.sql) | Idempotent ALTERs: adds `os_enabled`, `os_plan`, `os_seats`, `stripe_customer_id`, `stripe_subscription_id`, `billing_status`, `agent_token_budget_monthly`, `os_agents_enabled` to `organizations`. Seeds NWM (id=1) as `partner_comp`, always-on. Auto-runs on deploy via the `schema_*.sql` glob. |
| [`crm-vanilla/api/handlers/os_provision.php`](../../crm-vanilla/api/handlers/os_provision.php) | Master-only, `MIGRATE_TOKEN`-gated. Creates/updates an agency org. `pin_org_to_master()` so it can't be re-scoped. Idempotent on `slug`. |
| [`crm-vanilla/api/handlers/whoami.php`](../../crm-vanilla/api/handlers/whoami.php) | Shell-boot endpoint. Returns `{org, user, features, is_master}`. Read-only GET. |
| [`crm-vanilla/api/handlers/os_selftest.php`](../../crm-vanilla/api/handlers/os_selftest.php) | **R1 guardrail.** Token-gated, side-effect-free. Proves `WHERE organization_id = ?` isolates rows, that an unscoped query leaks (clause is load-bearing), and that `org_where()` composes onto the real `contacts` table. Returns `{pass, failures, checks}`; non-200 if any check fails. |
| [`crm-vanilla/api/index.php`](../../crm-vanilla/api/index.php) | Registered `whoami` / `os_provision` / `os_selftest`; added the two token routes to `$token_write_routes`. |
| [`os/index.html`](../../os/index.html), [`os/css/styles.css`](../../os/css/styles.css), [`os/js/api-client.js`](../../os/js/api-client.js), [`os/js/app.js`](../../os/js/app.js) | The `/os/` shell skeleton: boots from `whoami`, themes per-tenant via CSS vars (CSP-safe — no inline scripts/styles), renders sidebar + command bar + widget grid. Degrades gracefully when the API is unreachable. |
| [`.github/workflows/deploy-site-root.yml`](../../.github/workflows/deploy-site-root.yml) | Added `os/**` to `on.push.paths` **and** `os` to the staging `for d in` loop (both required or `/os/` 404s). |

**Verified locally (2026-06-01):** `/os/` boots, sidebar (8 items) + 4 widget cards render, brand var `#010F3B` applied, graceful "preview mode" fallback fires when `whoami` is unreachable, **zero console errors**. PHP not lintable locally (not on PATH) — handlers reviewed against the `migrate.php` / `workflows.php` idioms.

---

## 2. Gated on Carlos's OK — nothing below has been done

These are the outward-facing / paid / production-routing actions. Each is ready; none is executed.

### 2a. Deploy + provision the test tenant (the Phase 1 verification gate)
1. Commit the files above to a branch (not `main`) → open for review, or push to `main` to deploy.
2. On deploy, `schema_os_orgs_extend.sql` auto-runs.
3. Provision the test tenant:
   ```bash
   curl -s -X POST -A "Mozilla/5.0" -H "Origin: https://netwebmedia.com" \
     -H "Content-Type: application/json" \
     "https://netwebmedia.com/crm/api/?r=os_provision&token=<MIGRATE_TOKEN>" \
     -d '{"slug":"tester-acme","display_name":"Acme Digital","os_plan":"premium"}'
   ```
4. Run the isolation guardrail (expect `{"pass":true}`):
   ```bash
   curl -s -X POST -A "Mozilla/5.0" -H "Origin: https://netwebmedia.com" \
     "https://netwebmedia.com/crm/api/?r=os_selftest&token=<MIGRATE_TOKEN>"
   ```

### 2b. Wire `os_selftest` into CI (recommended — makes R1 fail the deploy)
Add a post-deploy step to `deploy-site-root.yml` (after the migrate step) that curls `?r=os_selftest` and `exit 1`s if `pass` isn't `true`. **Held for your OK** because it changes the pipeline's pass/fail behavior.

### 2c. Stripe objects (real money — David's W1 pre-work)
Create in the NWM Stripe account (via the Stripe MCP) — drafted, not created:
- Product **"NetWebMedia OS"**
- Price `os_premium_monthly` → **$2,490/mo**
- Price `os_partner_comp` → **$0/mo** (design partner SKU)
- (Defer `os_premium_annual` $24,900 + `os_custom_monthly` to V1.1)

### 2d. GitHub Secrets to add (David's W1 pre-work)
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CONNECTOR_ENC_KEY` (base64 32 bytes, generate once), `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `SLACK_OAUTH_CLIENT_ID`, `SLACK_OAUTH_CLIENT_SECRET`.

### 2e. `.htaccess` — wildcard subdomain → `/os/` (production routing change — HOLD)
The block below routes any *unmatched* subdomain to `/os/`. It changes routing for the whole `*.netwebmedia.com` wildcard, so it should be reviewed + curl-tested before it ships. **Not applied** to the live `.htaccess`.
```apache
RewriteCond %{HTTP_HOST} ^([a-z0-9-]+)\.netwebmedia\.com$ [NC]
RewriteCond %{REQUEST_URI} !^/(api|crm|cms|industries|companies|app|blog|tutorials|lp|guides|whatsapp|whatsapp-updates|social|superadmin|os|assets|css|js|images|fonts|\.well-known)
RewriteRule ^(.*)$ /os/$1 [L]
```

### 2f. CSP additions (Phase 4–5, when agents/Stripe land — flagged, not changed)
When the agent + billing layers ship, the `Content-Security-Policy` header in root `.htaccess` needs: `api.anthropic.com`, `js.stripe.com` + `api.stripe.com`, `accounts.google.com`, `slack.com`. CSP is live → **verify with curl before merging** (silent breakage otherwise).

---

## 3. ~~Open flag~~ RESOLVED — outreach drafts vs. locked DPA terms
The W1 outreach drafts ([outreach-drafts-2026-06-01.md](./outreach-drafts-2026-06-01.md)) previously promised **"weekly direct calls with Carlos."** V1-PLAN §4 **Tension F** locked the opposite: **one focused boot-camp week (W6)**, then Isabel (CS) async + monthly Carlos QBR.

**Resolved 2026-06-01:** all four "weekly calls/access" promises (offer summary + the three Touch-3 closes) rewritten to "a dedicated onboarding boot-camp week with Carlos, then dedicated customer success + monthly QBRs." The line that disparaged a "success manager" was also corrected — the locked model makes a dedicated CS lead (Isabel) the primary W7+ contact, so the copy now embraces it. Drafts now match the DPA terms Sofia revises in W1. (Still DRAFTS ONLY — never sent.)
