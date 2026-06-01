# NetWebMedia OS — V1 build complete (Phases 2–5) · status & go-live

**Status:** Full V1 built in the working tree / branch `nwm-os-phase1` — NOT deployed
**Date:** 2026-06-01
**Builds on:** [PHASE-1-FOUNDATION.md](./PHASE-1-FOUNDATION.md) · [ARCHITECTURE.md](./ARCHITECTURE.md)

The OS now exists end-to-end in code: branding, the agent-orchestration wedge, connectors, and billing. **Everything ships dark** — each feature returns a clean 503 until its secret is set, so deploying this changes nothing user-visible until you flip the switches in §3.

---

## 1. What was built (Phases 2–5)

### Schema (idempotent, auto-run on deploy)
`schema_os_connectors.sql`, `schema_os_branding_assets.sql`, `schema_os_agent_runs.sql`, `schema_os_human_tasks.sql`, `schema_os_audit_log.sql`, `schema_os_invoices.sql`.

### Backend (`crm-vanilla/api/`)
| File | Phase | What it does |
|---|---|---|
| [`lib/agent_dispatcher.php`](../../crm-vanilla/api/lib/agent_dispatcher.php) | 4 | The wedge. Self-contained agent catalog (6 default-on + 6 wired-off), model tiering, **per-org token-budget enforcement (R2)**, Anthropic call with prompt caching, cost accounting. |
| [`handlers/agent_run.php`](../../crm-vanilla/api/handlers/agent_run.php) | 4 | Org-scoped orchestrator: dispatch a skill, log every run to the cost ledger, catalog + history. |
| [`handlers/os_agents.php`](../../crm-vanilla/api/handlers/os_agents.php) | 4 | Per-tenant agent on/off toggles (admin). |
| [`lib/connector_store.php`](../../crm-vanilla/api/lib/connector_store.php) | 3 | libsodium-AEAD encrypted token store. **Fails closed** if `CONNECTOR_ENC_KEY` unset. |
| [`handlers/oauth_google.php`](../../crm-vanilla/api/handlers/oauth_google.php) · [`oauth_slack.php`](../../crm-vanilla/api/handlers/oauth_slack.php) | 3 | Gmail/Calendar + Slack OAuth (HMAC-signed state, org embedded). |
| [`handlers/os_connectors.php`](../../crm-vanilla/api/handlers/os_connectors.php) | 3 | List/disconnect (never exposes token material). |
| [`handlers/os_branding.php`](../../crm-vanilla/api/handlers/os_branding.php) | 2 | Per-tenant brand CSS (GET) + persist colors/name (POST, admin). |
| [`handlers/branding_asset.php`](../../crm-vanilla/api/handlers/branding_asset.php) | 2 | Logo upload with **SVG sanitization** + SHA-named storage + serving proxy. |
| [`handlers/stripe_webhook.php`](../../crm-vanilla/api/handlers/stripe_webhook.php) | 5 | Signature-verified billing state machine (the only thing that flips `os_enabled`/`billing_status`). Public route. |
| [`handlers/os_billing.php`](../../crm-vanilla/api/handlers/os_billing.php) | 5 | Billing summary + Stripe Checkout session (client_reference_id = org slug). |
| `index.php` / `config.php` / `whoami.php` / `os_selftest.php` | — | Routes registered; OS config constants added; `whoami` returns enabled-agents; **R1 self-test extended to the new tenant tables**. |

### Shell (`os/`)
`onboarding.html` (4-step wizard), `connectors.html`, `agents.html`, `billing.html`, `settings.html` + matching `os/js/*.js` + `os/css/pages.css`. Vanilla, CSP-safe, per-tenant themed, graceful empty states. **Verified locally: all pages 200, zero console errors.**

### Deploy
`deploy-site-root.yml` now injects the OS secrets into `config.local.php` (empty = disabled) and maps them from GitHub Secrets.

---

## 2. Deferred to V1.1 (deliberate)
- **`wf_crm.php` agent step-types** (`run_agent`, `send_via_connector`, `wait_for_human`). The command bar is the V1 agent path; wiring agents *into* the live workflow engine touches a production file and needs the pause/resume mechanic + a test. Clean fast-follow.
- Billing **portal session**, **annual** plan, connector **token auto-refresh** loop, **members** management endpoint, sub-client portals. All non-blocking for the first tenant.

---

## 3. Go-live checklist — the real-world actions (only you can do these)

Nothing below is done. The code is inert until each step is taken. Order matters.

1. **Deploy the branch.** Merge `nwm-os-phase1` → `main` (or push). Migrations auto-run; `/os/` goes live; everything still dark.
2. **Run the Phase-1 gate** (commands in [PHASE-1-FOUNDATION.md §2a](./PHASE-1-FOUNDATION.md)): provision `tester-acme`, confirm `os_selftest` → `{"pass":true}`.
3. **Agents (the wedge) — cheapest to light up.** Add GitHub Secret `ANTHROPIC_API_KEY` to the CRM config (already used by api-php; ensure it's mapped for crm-vanilla). Confirm current Anthropic model IDs in `ANTHROPIC_MODEL_STRATEGIC/_ROUTINE` (defaults `claude-sonnet-4-5` / `claude-haiku-4-5`). Then the command bar + `agents.html` work.
4. **Connectors.** Register a **Google Cloud OAuth app** (Gmail readonly + Calendar scopes, redirect `…/crm/api/?r=oauth_google&action=callback`) and a **Slack app**; set `GOOGLE_OAUTH_CLIENT_ID/_SECRET`, `SLACK_OAUTH_CLIENT_ID/_SECRET`, and generate `CONNECTOR_ENC_KEY` (`openssl rand -base64 32`).
5. **Billing.** Create the Stripe Product + the $2,490/mo Price (Stripe MCP); set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_MONTHLY`, and the webhook endpoint `…/crm/api/?r=stripe_webhook` → `STRIPE_WEBHOOK_SECRET`.
6. **Subdomain routing** (for branded tenant URLs): apply the `.htaccess` wildcard→`/os/` block from [PHASE-1-FOUNDATION.md §2e](./PHASE-1-FOUNDATION.md). Not needed while NWM is tenant-0 at `/os/`.
7. **Sign the design partner** (Jun 12 target) and run them through `onboarding.html`.

**CSP note:** V1 needs **no** new CSP origins — all external interactions are top-level redirects (Stripe Checkout, Google/Slack OAuth), not embedded resources. Add `js.stripe.com` only if you later switch to embedded Stripe Elements.
