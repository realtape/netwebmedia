# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

This is the **netwebmedia.com production property** plus a collection of supporting apps and operating assets. It is NOT a single application — it is a flat-deployed multi-property monorepo:

1. **Marketing site** — flat HTML/CSS/JS at the repo root (`index.html`, `services.html`, `pricing.html`, etc.) plus `industries/`, `blog/`, `tutorials/`, `lp/`, `app/`. Served from cPanel/Apache at InMotion. **No build step** for the public site.
2. **`api-php/`** — PHP API (lead capture, audit handler, CRM endpoints) served at `netwebmedia.com/api/` (canonical) — the `/api-php/` path 301-redirects to `/api/`. Entry point: `api-php/index.php`.
3. **`crm-vanilla/`** — internal CRM app deployed to `netwebmedia.com/crm-vanilla/`. This is NetWebMedia's own CRM (do NOT replace with HubSpot — internal rule). **`crm-vanilla/js/data.js` is 100% mock/seed data** for UI development; real data comes from the live PHP API.
4. **`backend/`** — Django CRM backend (multi-tenant, DRF, Celery). Uses SQLite locally (`backend/db.sqlite3`). **Not deployed to InMotion** — separate property for future use.
5. **`mobile/`** — Capacitor 6 app (iOS + Android + web). Vite-built vanilla JS. Reuses existing `/api/` endpoints. Run separately from `mobile/`.
6. **`video-factory/`** — Remotion-based programmatic video renderer. Express server on `:3030`. PHP API calls it at `POST /api/video/render`.
7. **`_deploy/companies/`** — 680 generated per-company audit pages deployed to `netwebmedia.com/companies/**`.
8. **`plans/`** — internal strategy docs (`business-plan.html`, `marketing-plan.html`, `brand-book.html`, `execution-90day.html`, `index.html` hub). All are `noindex,nofollow`. Always incorporate these when reasoning about NetWebMedia direction.
9. **`.claude/agents/`** — 12 custom agents mirroring NetWebMedia's org chart (cmo, sales-director, engineering-lead, etc.). Delegate by role; see `.claude/AGENT-ROUTING.txt` for routing rules and Sonnet-vs-Haiku assignments.

**`app/` vs `crm-vanilla/`** — these are two separate things. `/app/` is a lightweight feature-stub shell for the public-facing customer dashboard (many routes point to `coming-soon.html`); it is NOT the internal CRM. `/crm-vanilla/` is the internal CRM used by the NetWebMedia team.

## Run locally

There is **no automated test suite or linter** in this repo. Smoke tests run in GitHub Actions post-deploy.

```bash
node server.js          # serves repo root at http://127.0.0.1:3000 (static file server, no build)
npm start               # alias for the above
```

Mobile app (Vite dev server, connects to production API by default):

```bash
cd mobile
npm install
npm run dev             # http://localhost:5173
npm run build           # outputs mobile/dist/
npm run sync            # build + cap sync (before opening native IDEs)
npm run ios             # build + sync + open Xcode (macOS only)
npm run android         # build + sync + open Android Studio
VITE_API_BASE=https://staging.netwebmedia.com/api npm run dev  # override API base
```

Video factory (Remotion renderer, requires Node ≥ 18):

```bash
cd video-factory
npm install
npm start               # Express renderer on :3030
npm run preview         # Remotion browser preview
```

Backend (Django CRM, optional, not deployed):

```bash
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python backend\manage.py migrate
.venv\Scripts\python backend\manage.py seed_crm_presets
.venv\Scripts\python backend\manage.py runserver
```

### Environment prerequisites

Before developing locally, ensure:
- **Node.js** ≥ 18 (required for video-factory; `node --version` to check)
- **Python** 3.9+ (for generators and Django backend)
- **PHP** 7.4+ (if running API handlers locally via built-in server)
- **MySQL** 5.7+ (for multi-tenant database access; optional if using remote InMotion DBs)
- **Git** (with auto-backup daemon disabled if you want cleaner commit history)

### Local database & credentials

Two MySQL databases (`webmed6_nwm` for public API, `webmed6_crm` for CRM) live on InMotion production. For local development:

**Option 1: Remote databases (recommended for most work)**
- Request SSH tunnel credentials or direct remote access from Carlos
- Use InMotion databases directly to avoid data sync issues
- Updates flow immediately across all dev environments

**Option 2: Local MySQL (for isolated testing)**
- Install MySQL 5.7+ locally
- Request database dumps from Carlos, or create empty schemas
- Use `localhost` in your config files
- Credentials: provided in a `.env.local` file (request from Carlos)

**For Django backend only:** SQLite (`backend/db.sqlite3`) is self-contained and requires no external database. Seed test data with:
```bash
python backend/manage.py seed_crm_presets
```

**For PHP API locally:** Two options:
1. Use built-in server (dev only): `php -S 127.0.0.1:8000 -t api-php/`
2. Use remote InMotion databases and test via production API endpoints

**Seeding test data:**
- **PHP API:** Edit `crm-vanilla/api/handlers/contacts.php` or call the seed endpoint (admin-only):
  ```
  curl -X POST http://127.0.0.1:3000/api/?r=seed \
    -H "X-Auth-Token: <admin-token>"
  ```
- **CRM:** Use the UI to create test resources, or manually insert rows via MySQL

### Mocking third-party APIs locally

Most integrations require credentials. To develop without live keys:

| Service | Local Mock Behavior | How to Test |
|---|---|---|
| **Email (Resend)** | Set `RESEND_API_KEY=dev` → returns fake `submission_id` | UI submit works; emails not sent |
| **Stripe** | Use test keys `sk_test_...` and `pk_test_...` | Test card: `4242 4242 4242 4242` (always succeeds) |
| **Twilio SMS** | Requires live credentials; no safe mock | Request sandbox credentials from Carlos |
| **Meta (WhatsApp/IG)** | Unset `WA_META_TOKEN` / `IG_GRAPH_TOKEN` → returns 503 "Setup required" | Safe for UI testing; no actual sends |
| **Video Factory** | Unset `remotion_render_url` → returns 503 "Not configured" | UI works; no video generation |

For development, request a `.env.local` file from Carlos with safe test credentials for each service.

## Deploy — InMotion only, never Vercel/Netlify

netwebmedia.com and **all subdomains** ship via **GitHub Actions FTPS → cPanel at InMotion**. There is no other host. Three workflows in `.github/workflows/`, each scoped to a different cPanel directory and a different FTP user:

| Workflow | Triggers on | Deploys to | FTP secret |
|---|---|---|---|
| `deploy-site-root.yml` | root `*.html`, `css/`, `js/`, `industries/`, `app/`, `blog/`, `tutorials/`, `api-php/`, `.htaccess` | `/public_html/` | `CPANEL_FTP_ROOT_USER` |
| `deploy-crm.yml` | `crm-vanilla/**` | `/public_html/crm-vanilla/` | `CPANEL_FTP_USER` |
| `deploy-companies.yml` | `_deploy/companies/**` | `/public_html/companies/` | `CPANEL_FTP_USER` |

**`deploy-crm.yml` is deprecated** (as of 2026-04-25) — `deploy-site-root.yml` now handles `crm-vanilla/`. The old workflow is kept as a manual `workflow_dispatch` fallback only.

**The two FTP users are scoped to different directories** — `CPANEL_FTP_USER` is chrooted to `/public_html/companies/` and physically cannot write site-root files. That's why `deploy-site-root.yml` uses a separate user.

Deploys are **incremental sync by hash** (`SamKirkland/FTP-Deploy-Action`) — safe to re-run. Use FTPS **explicit** mode on port 21 (not implicit/990) — this is required by InMotion cPanel.

`deploy-site-root.yml` supports a `dry_run` input flag via `workflow_dispatch` — when true, skips all FTP writes (useful for testing CI logic).

**Adding a new top-level directory requires TWO updates** in `deploy-site-root.yml` — burned us when shipping `/social/`:
1. Add the path under `on.push.paths` (line ~87) so the workflow even triggers.
2. Add the directory name to the staging-step allowlist loop (line ~155: `for d in css js assets ... industries app livery-editor social; do`). Without this, the workflow runs but `_stage/` doesn't include the new dir, so it never gets uploaded via FTPS.

Symptom of forgetting (2): deploy succeeds, returns 200 on every URL except the new one which 404s. Root cause is the missing line in the `for d in` loop, not anything content-related.

### Config generation at deploy time

`deploy-site-root.yml` generates `api-php/config.local.php` and `crm-vanilla/api/config.local.php` on the fly from GitHub Secrets using Python string interpolation. It also auto-runs any `crm-vanilla/api/schema_*.sql` migrations via HTTP POST to `/crm-vanilla/api/?r=migrate` after each deploy.

### Migration system — idempotent by design, no version tracking

Drop a new `crm-vanilla/api/schema_<name>.sql` file → it auto-runs on the next deploy. Rules:

- **Migrations must be idempotent** — they run on every deploy. No tracking table.
- **Use plain `ALTER TABLE` / `CREATE TABLE` / `INSERT IGNORE`.** Do NOT use `SET @x := (SELECT ... FROM information_schema)` + `PREPARE/EXECUTE` patterns — they leave PDO cursors open and fail mid-batch with "Cannot execute queries while other unbuffered queries are active." (We enable `MYSQL_ATTR_USE_BUFFERED_QUERY` in `crm-vanilla/api/config.php` as a defense, but the SET pattern still breaks under emulated prepares — just write plain DDL.)
- **`migrate.php` swallows expected idempotency errors** by substring match: codes `1060` (dup column), `1061` (dup key), `1050` (table exists), `1062` (dup entry), `1826` (dup FK name), and `errno: 121` (InnoDB FK name clash via 1005). It returns `{ran, skipped, errors}` JSON; the CI step fails if `"ran"` isn't present.
- **mod_security on InMotion 406-blocks bare curl UAs.** The CI migrate step in `deploy-site-root.yml` MUST send full Chrome `User-Agent` + `Origin: https://netwebmedia.com` + `Referer: https://netwebmedia.com/crm-vanilla/` headers. Don't simplify the curl call.
- **Statement splitter is naive — no semicolons inside string literals.** `migrate.php` splits on raw `;`. Any `COMMENT 'foo; bar'` or string literal containing `;` will be torn in half and fail with a 1064 syntax error. Rephrase the literal (use `(`/`)` or `,` instead of `;`) — don't add escape parsing to the splitter.
- **Maintenance tokens** (`MIGRATE_TOKEN`, `SEED_TOKEN`, `DEDUPE_TOKEN`, `IMPORT_BEST_TOKEN`, `IMPORT_CSV_TOKEN`) flow GitHub Secrets → `crm-vanilla/api/config.local.php` `define()`s on every deploy. If the secret is unset the historic default in `config.php` is preserved. Rotating a token = update the secret and redeploy; producer (CI curl) and consumer (PHP `define`) both read from the same source.

### GitHub Secrets explained

All secrets flow from GitHub Actions → `config.local.php` → your deployed app. Required secrets:

| Secret | Purpose | How to Obtain |
|---|---|---|
| `JWT_SECRET` | Signing auth tokens, user sessions | Generate: `openssl rand -hex 32` |
| `DB_PASSWORD` | MySQL connection for both databases | Request from Carlos |
| `RESEND_API_KEY` | Email delivery (Resend) | Create account at resend.io, copy API key |
| `ANTHROPIC_API_KEY` | Claude API calls (CRM AI features) | Copy from Anthropic account console |
| `HUBSPOT_TOKEN` | HubSpot CRM integration (public API) | Generate in HubSpot → Settings → API keys |
| `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_WEBHOOK_SECRET` | Mercado Pago billing integration | MercadoPago dashboard → Credentials |
| `STRIPE_SECRET_KEY`, `STRIPE_PUBLIC_KEY` | Stripe payments (optional, not yet live) | Stripe dashboard → API keys (test/live) |
| `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_FROM` | Twilio SMS (WhatsApp sandbox) | Twilio console → Credentials |
| `WA_VERIFY_TOKEN`, `WA_META_TOKEN`, `WA_PHONE_ID`, `WA_META_APP_SECRET` | WhatsApp Business API | Meta Business Platform → Apps → WhatsApp |
| `CPANEL_FTP_ROOT_USER`, `CPANEL_FTP_ROOT_PASSWORD`, `CPANEL_FTP_USER`, `CPANEL_FTP_PASSWORD` | Deploy via FTPS to InMotion | InMotion cPanel → FTP Accounts |

**Note:** If a secret is unset, the fallback default in `config.php` is used (if one exists). For development, most of these can be mocked — see "Mocking third-party APIs" above.

Other workflows: `cron-workflows.yml` (CRM workflow engine heartbeat, runs every 5 min via GH Actions schedule — no cPanel cron needed), `psi-baseline.yml` (PageSpeed snapshots), `uptime-smoke.yml`, `indexnow-ping.yml`, `generate-blog-queue.yml`, `publish-blogs-scheduled.yml`, `generate-guide-pdfs.yml`, `twilio-register-webhook.yml`.

## PHP API architecture

The API uses a **single generic `resources` table** as an EAV store — every entity (contacts, deals, forms, blog posts, templates, landing pages, etc.) is a row differentiated by the `type` column. JSON blob in `data` holds entity-specific fields. This means:

- `GET /api/resources/contact` — lists contacts
- `GET /api/resources/deal` — lists deals
- `POST /api/resources/form` — creates a form
- Any `type` string works; no schema migration needed for new entity types

**Auth:** uses `X-Auth-Token: <token>` header (NOT `Authorization: Bearer`). Token is returned on login and stored as `nwm_token` cookie/localStorage. Admin credentials are seeded by `api-php/migrate.php` (run once via `GET /api/migrate.php?token=<first-16-chars-of-jwt_secret>`).

**Public routes** (`/api/public/*`) require no auth: form submission, newsletter subscribe, **whatsapp/subscribe** (opt-in capture for the WABA broadcast list — stores `pending_double_opt_in` with literal consent text per Meta's WABA legal requirement; optionally also enrolls the contact in the welcome email sequence if email is provided), blog list, audit, stats, prospect chatbot.

**Cron route** (`GET /api/cron`) processes the `email_sequence_queue` table — send next batch of drip emails. Must be called by an external scheduler (e.g. cPanel cron job every 5 min).

**Rate limiting** is file-based — `/api/data/ratelimit/<ip-hash>.json` (api-php) and `crm-vanilla/storage/ratelimit/` (CRM). Uses `flock(LOCK_EX)` for atomicity + probabilistic GC. Survives PHP-FPM restarts; no Redis needed. Web access to the storage dir is blocked by `.htaccess`.

**Honeypot behavior:** Bot submissions get a silent 200 with fake `submission_id: 0` (not 403) to prevent bot adaptation.

**Multi-tenant isolation** in `crm-vanilla/api/`: every owned table (`contacts`, `deals`, `events`, `email_templates`, `email_campaigns`, `conversations`) carries a nullable `user_id` column. Handlers MUST filter via the `tenant_where()` / `tenant_owns()` helpers in `crm-vanilla/api/lib/tenancy.php`. Legacy rows (`user_id IS NULL`) are visible to all tenants by design — backfilled rows belong to user 1 (Carlos).

**SSRF defense** for any handler that fetches user-supplied URLs (e.g. `analyze`, `proposal`): use `url_guard()` from `crm-vanilla/api/lib/url_guard.php`. It DNS-resolves and rejects loopback, private, link-local, and AWS-metadata (169.254.169.254) ranges. Never disable curl SSL verification — production CA bundle works fine on InMotion.

**CSRF defense:** `crm-vanilla/api/index.php` enforces a same-origin `Origin`/`Referer` check on all state-changing requests, plus session cookies are `SameSite=Strict`. Auth tokens are hash_equals-compared.

### Frontend-Backend API contract

Understanding how frontend and backend communicate:

**CRM API request format:**
```
GET /crm-vanilla/api/?r=contacts&id=123&limit=50
POST /crm-vanilla/api/?r=contacts
  X-Auth-Token: <token>
  Content-Type: application/json
  { "name": "John Doe", "email": "john@example.com" }
```

**Response format (all endpoints):**
```json
{
  "success": true,
  "data": [ { "id": 1, "name": "John", "type": "contact" } ],
  "error": null,
  "pagination": { "limit": 50, "offset": 0, "total": 152 }
}
```

**JSON blob validation:** Handlers expect `data`, `steps_json`, etc. to be pre-validated before storage. Example in `workflows.php`:
```php
function workflows_normalize_steps($rawSteps) {
  $decoded = json_decode($rawSteps, true);
  // Validate each step has required fields: type, config
  // Re-encode to JSON for storage
  return json_encode($decoded);
}
```

Never store user-supplied JSON directly; validate shape first.

**Error responses (non-200):**
- `400 Bad Request` — missing required fields, invalid enum value
- `401 Unauthorized` — missing or invalid token
- `403 Forbidden` — token valid but user lacks permission (tenancy violation)
- `404 Not Found` — resource doesn't exist
- `409 Conflict` — duplicate key, constraint violation (idempotent)
- `500 Internal Server Error` — unhandled exception

### Workflow runtime engine

**Critical architecture note — two separate databases.** `api-php` connects to `webmed6_nwm`; `crm-vanilla/api` connects to `webmed6_crm`. Do NOT attempt to cross-include functions or read across databases from within a single handler. They run as separate PHP contexts with different PDO connections.

The visual workflow builder (`crm-vanilla/js/automation.js` → `crm-vanilla/api/handlers/workflows.php`) and the CRM-native runtime engine (`crm-vanilla/api/lib/wf_crm.php`) **both operate entirely in `webmed6_crm`**. `api-php/lib/workflows.php` is a separate engine for `webmed6_nwm` resources — not used for CRM-builder workflows.

**CRM workflow tables (all in `webmed6_crm`):**
- `workflows` — visual builder rows: `id, organization_id, user_id, name, trigger_type, trigger_filter, steps_json, status, last_run_at`. Tenant-scoped via `tenancy_where()`. Source of truth.
- `workflow_runs` — run queue: `id, workflow_id, user_id, org_id, status (pending/running/waiting/completed/failed), step_index, context_json, next_run_at, error`. Created by `schema_workflow_runs.sql`.
- `resources WHERE type='workflow'` + `workflows_resource_link` — mirror for UI visibility only (kept in sync by `workflows_upsert_engine_mirror()`). The engine does NOT read these; it reads `workflows` directly.

**CRM-native engine (`crm-vanilla/api/lib/wf_crm.php`):**
- `wf_crm_trigger($type, $match, $ctx, $uid, $orgId)` — find active workflows matching the trigger, insert `workflow_runs` rows. Called from CRM events.
- `wf_crm_run_pending($db)` — advance all pending/waiting runs whose `next_run_at` has passed. Call from the cron endpoint.
- `wf_crm_advance($run, $db)` — execute the next step for one run, update `step_index` / `status`. Recurses for non-wait steps.
- `wf_crm_run_now($workflowId, $ctx, $db)` — admin: enqueue + synchronously advance a specific workflow.

**Step types supported:** `send_email`, `wait` (sets `next_run_at`), `tag` / `add_tag`, `untag` / `remove_tag`, `update_field`, `move_stage`, `create_task`, `webhook`, `send_whatsapp`, `if` (conditional branch), `notify_team`, `log`.

**Trigger wiring (CRM events that fire `wf_crm_trigger`):**

| Event | Trigger type | Handler |
|---|---|---|
| CRM contact created | `contact_created` | `crm-vanilla/api/handlers/contacts.php` POST |
| Deal created / stage changed | `deal_stage` | `crm-vanilla/api/handlers/deals.php` POST + PUT |
| Tag added to contact | `tag_added` | cascades from `wf_crm_advance` tag steps |
| Tag removed | `tag_removed` | cascades from `wf_crm_advance` untag steps |
| Manual admin fire | `manual` | `run_now` action in workflows handler |

**Cron requirement.** No `wait` step advances without an external scheduler. The primary scheduler is **`.github/workflows/cron-workflows.yml`** — a GitHub Actions scheduled workflow that runs `*/5 * * * *` and POSTs to the cron endpoint using `secrets.MIGRATE_TOKEN`. No cPanel cron job is needed. If you ever need a fallback cPanel job:
```
*/5 * * * * curl -s -A "Mozilla/5.0" "https://netwebmedia.com/crm-vanilla/api/?r=cron_workflows&token=<MIGRATE_TOKEN>" > /dev/null
```
`MIGRATE_TOKEN` is the `secrets.MIGRATE_TOKEN` GitHub Actions secret (written into `crm-vanilla/api/config.local.php` as `define('MIGRATE_TOKEN', ...)` on every deploy by `deploy-site-root.yml`). The fallback default (when secret is unset) is `NWM_MIGRATE_2026` — do NOT rely on this in production. The handler (`crm-vanilla/api/handlers/cron_workflows.php`) validates with `hash_equals()` then calls `wf_crm_run_pending()`.

**Note:** `api-php/lib/workflows.php` + `/api/cron/automation` are a *separate* engine for `webmed6_nwm` resources (newsletter drip sequences, api-php public forms). They are unrelated to CRM builder workflows. `wf_bridge.php` has been deleted — all call sites use `wf_crm_trigger()` directly.

**Run-now.** `POST /crm-vanilla/api/?r=workflows&id=N&action=run_now` (admin session required) bypasses trigger matching and fires the specific workflow immediately via `wf_crm_run_now()`.

**Backfill mirror.** `POST /crm-vanilla/api/?r=workflows&action=backfill_engine_mirror` (admin) rewrites all `resources` mirrors for UI visibility. Idempotent. Does NOT affect execution — the engine reads `workflows` directly.

### API route modules (`api-php/routes/`)

22 route files, each handling a business domain:
- **Core:** `auth.php`, `resources.php` (EAV CRUD), `public.php`
- **CRM entities:** `contacts.php`, `deals.php`, `campaigns.php`, `comments.php`
- **Comms:** `whatsapp.php`, `social.php`, `ai.php`, `nwmai.php`, `public-chat.php`
- **Integrations:** `hubspot.php`, `vapi.php` (voice), `heygen.php` (video synthesis), `billing.php`
- **Content/ops:** `content.php`, `recipes.php`, `video.php`, `audit.php`, `abtests.php`, `workflows.php`, `cmo.php`

`crm-vanilla/api/` uses **query-string routing** (`?r=resource&id=123`) instead of path-based routing — this is intentional ModSecurity evasion for the CRM's internal API.

### Adding a new CRM route handler

Pattern (see `crm-vanilla/api/handlers/workflows.php` for the canonical reference — most recent addition as of 2026-05):

1. Lazy `CREATE TABLE IF NOT EXISTS` at the top of the handler — mirrors the `schema_*.sql` file exactly so the route works even on a fresh DB before migrations run.
2. Pull tenancy via `[$tWhere, $tParams] = tenancy_where()` and append it to every SELECT/UPDATE/DELETE.
3. On INSERT, call `require_org_access_for_write('member')` to block X-Org-Slug cross-org writes (matches `campaigns.php` pattern).
4. Define `$ALLOWED_*` enum allowlists at the top; validate every enum-typed input field against them.
5. For JSON-blob columns (`steps_json`, `data`, etc.), write a `<handler>_normalize_*()` function that decodes, validates per-type, and re-encodes — never store raw user JSON.

## Common development workflows

### Testing a new CRM route handler

1. Create the handler in `crm-vanilla/api/handlers/myfeature.php`
2. Test via curl or Postman:
   ```bash
   curl -X POST http://127.0.0.1:3000/crm-vanilla/api/?r=myfeature \
     -H "X-Auth-Token: <token>" \
     -H "Content-Type: application/json" \
     -d '{"name": "Test"}'
   ```
3. Verify tenancy filtering by creating as user 1, then re-authenticating as user 2 and confirming the record is hidden
4. Check database directly: `SELECT * FROM myfeature_table WHERE user_id = ?`

### Debugging a workflow engine issue

1. Check the `workflow_runs` table for the run status:
   ```sql
   SELECT id, status, step_index, error, next_run_at 
   FROM workflow_runs 
   WHERE workflow_id = <id> 
   ORDER BY id DESC LIMIT 5;
   ```
2. Manually advance a run for debugging:
   ```bash
   curl -X POST "https://netwebmedia.com/crm-vanilla/api/?r=workflows&id=<workflow_id>&action=run_now" \
     -H "X-Auth-Token: <admin-token>"
   ```
3. Check CRM logs at `crm-vanilla/storage/logs/` for step execution details

### Previewing email templates

Preview any email template (live):
```
https://netwebmedia.com/api/public/email/preview?id=welcome-1&lang=es
```

To test locally:
1. Edit template HTML in `email-templates/welcome-1.html`
2. Reload the preview URL to see changes
3. Use the lang toggle (`?lang=es`) to test bilingual copy

### Testing a Video Factory template

1. Register template in `video-factory/src/index.tsx`
2. Run preview server:
   ```bash
   cd video-factory
   npm run preview
   ```
3. Edit composition in `src/compositions/MyTemplate.tsx` and hot-reload works automatically
4. Render video via API:
   ```bash
   curl -X POST https://netwebmedia.com/api/video/render \
     -d '{"template": "my-template", "fields": {...}}'
   ```

## Code conventions

### PHP API handlers

- **Query-string routing:** All routes go through `?r=handler_name` (not path-based)
- **Tenancy isolation:** Every query must filter by `user_id` using `tenancy_where()` helper
  ```php
  [$tWhere, $tParams] = tenancy_where();
  $stmt = $db->prepare("SELECT * FROM contacts WHERE $tWhere AND name LIKE ?");
  ```
- **Enum validation:** Define allowlists at handler top, validate all enum inputs:
  ```php
  $ALLOWED_STATUSES = ['pending', 'completed', 'failed'];
  if (!in_array($_POST['status'], $ALLOWED_STATUSES)) {
    die(json_encode(['error' => 'Invalid status']));
  }
  ```
- **JSON blob validation:** Never store raw user JSON; normalize first:
  ```php
  function normalize_workflow_steps($raw) {
    $steps = json_decode($raw, true);
    // Validate structure
    return json_encode($steps);
  }
  ```

### JavaScript in CRM vanilla

- **XSS prevention:** All user-controlled strings going into `innerHTML` MUST use `CRM_APP.esc()`:
  ```javascript
  // WRONG: innerHtml = user.name;
  // RIGHT:
  element.innerHTML = CRM_APP.esc(user.name);
  ```
- **API calls:** Use the shared client in `app/js/api-client.js` (auto-handles 401 redirects)
  ```javascript
  NWMApi.call('POST', '/crm-vanilla/api/?r=contacts', 
    { name: 'John' })
    .then(resp => console.log(resp.data))
  ```
- **Module structure:** One feature file per sidebar entry (e.g., `contacts.js`, `automation.js`)

### SQL & migrations

- **Idempotent migrations:** All `schema_*.sql` must run safely on every deploy
  ```sql
  CREATE TABLE IF NOT EXISTS workflows (...)
  ALTER TABLE contacts ADD COLUMN status VARCHAR(50) DEFAULT 'active' /* idempotent */
  INSERT IGNORE INTO settings VALUES (...)
  ```
- **No set variables or prepared statements in migrations:** They break the statement splitter
  ```sql
  -- WRONG: SET @x := (SELECT ... FROM information_schema)
  -- RIGHT: plain ALTER TABLE / CREATE TABLE / INSERT
  ```

## Feature flags & configuration

**Runtime configuration** (no rebuild needed):

- GitHub Actions Secrets → `config.local.php` `define()`s on every deploy
- Per-environment toggles in `crm-vanilla/api/handlers/` for feature flags
- Use environment variables for local overrides (e.g., `VITE_API_BASE=https://staging.netwebmedia.com/api npm run dev`)

**How to add a feature flag:**
1. Add to GitHub Secrets (e.g., `FEATURE_WORKFLOWS_ENABLED`)
2. It auto-flows to `config.local.php` via `deploy-site-root.yml`
3. Check in handler: `if (defined('FEATURE_WORKFLOWS_ENABLED') && FEATURE_WORKFLOWS_ENABLED) { ... }`
4. For frontend, expose via API endpoint and read into JavaScript

## Troubleshooting common issues

### "Cannot execute queries while other unbuffered queries are active"

**Cause:** Migration or handler uses `SET @x := (SELECT ...)` + `PREPARE/EXECUTE`  
**Fix:** Use plain DDL instead — `ALTER TABLE`, `CREATE TABLE`, `INSERT IGNORE`

### CSS/JS changes not appearing after deploy

**Cause:** 5-minute caching on static assets  
**Fix:** Wait 5 minutes, or hard-refresh browser (`Ctrl+Shift+R`), or check CloudFlare cache

### New top-level directory 404s after deploy

**Cause:** Forgot to add directory to `for d in ...` loop in `deploy-site-root.yml`  
**Fix:** See "Adding a new top-level directory" section above — update both `on.push.paths` AND the staging loop

### Migration fails with 1064 syntax error

**Cause:** Semicolon inside string literal (e.g., `COMMENT 'foo; bar'`)  
**Fix:** Replace `;` with `,` or `()` in the string literal

### Workflow runs stuck in "waiting" state

**Cause:** GitHub Actions cron not firing, or `MIGRATE_TOKEN` mismatch  
**Fix:** Check `.github/workflows/cron-workflows.yml` is enabled; verify `MIGRATE_TOKEN` secret matches `config.local.php`

### WhatsApp API returns 503 "Setup required"

**Cause:** Missing `WA_META_TOKEN` or `WA_PHONE_ID` in secrets  
**Fix:** Safe for dev (UI still works). Request credentials from Carlos for live testing.

### Local API can't reach database

**Cause:** Wrong credentials, network isolation, or MySQL not running  
**Fix:** 
1. Test MySQL locally: `mysql -u root -p -h 127.0.0.1 webmed6_crm`
2. Or use remote InMotion DB with SSH tunnel
3. Verify `DB_PASSWORD` in `.env.local` is correct

## CRM vanilla JS architecture (`crm-vanilla/`)

Vanilla JS SPA with a custom route dispatcher in `crm-vanilla/js/app.js`. No framework, no build step.

- **Session storage:** `nwm_token` and `nwm_user` in `localStorage`. The shared API client at `app/js/api-client.js` auto-redirects 401s to login unless `noRedirectOn401` is passed.
- **Feature modules:** `contacts.js`, `conversations.js`, `pipeline.js`, `marketing.js`, `calendar.js`, `reporting.js`, `automation.js`, `payments.js`, `documents.js`, `courses.js`, `sites.js`, `settings.js` — one file per CRM section.
- **Data layer:** `crm-vanilla/js/data.js` is mock seed data only. Real data flows through the EAV `resources` table via `/crm-vanilla/api/`.
- **CRM handlers** in `crm-vanilla/api/handlers/` (query-string routing via `?r=<name>`) are separate from the public `api-php/routes/`. New CRM features go here. Recent additions (2026-05):
  - `workflows.php` — visual workflow builder CRUD (canonical CRUD reference)
  - `wa_flush.php` — admin handler for the WhatsApp opt-in pipeline. Actions: `count`, `list`, `mark`, `send`. The `send` action calls Meta Cloud API and returns 503 with a setup message if `WA_PHONE_ID` / `WA_META_TOKEN` are unset. Backed by the public `POST /api/public/whatsapp/subscribe` endpoint in `api-php/routes/public.php` — that endpoint stores subscribers as `pending_double_opt_in` until WABA verification completes; `wa_flush` then graduates them to `confirmed` via the welcome template.
  - `ig_publish.php` — Instagram Graph API stub. Actions: `status`, `spec`, `publish`. The `publish` action does the 3-step Meta flow (upload children → create CAROUSEL container → media_publish). Pre-flight verifies all 5 image URLs are reachable. 503 with setup message if `IG_BUSINESS_ACCOUNT_ID` / `IG_GRAPH_TOKEN` unset. Carousel definitions match `assets/social/carousels/{a,b,c}-slide-{1..5}.png`.
  - Admin UI module `crm-vanilla/whatsapp-subs.html` + `js/whatsapp-subs.js` consumes `wa_flush` for button-driven opt-in management (filterable table, mark actions, dry-run/live flush). Admin-only sidebar entry under "WhatsApp Subs".

## Email sequences

Drip email system: `email-templates/sequences.json` defines sequence timing, `email-templates/niche-sequences.json` for industry-specific variants, and `email-templates/*.html` are the message templates (using `_base.html` layout).

Available sequences: `welcome`, `audit_followup`, `partner_application` (+ niche sequences per the 14 CRM niches). Contacts are enrolled via `seq_enroll()` in `api-php/lib/email-sequences.php`. Preview any template at `GET /api/public/email/preview?id=welcome-1&lang=es`.

## URL routing rules — non-obvious, will trip you up

netwebmedia.com is **flat HTML on Apache**, not a framework router. Rules:

- **Top-level pages: `.html` is canonical.** `/services`, `/pricing`, `/about`, etc. **301 redirect to `.html`** (e.g. `/services` → `/services.html`). On-page `<link rel=canonical>` declares the `.html` URL. Sitemap entries match. Internal links can use either form (the redirect is fine), but prefer `.html` when generating new links to avoid the extra hop.
- **Nested directory pages: folder URL with trailing slash is canonical.** `/industries/legal-services/` (Apache serves `index.html`). Avoid linking to `/industries/legal-services/index.html` directly.
- **Nested file pages keep `.html`** (e.g. `/blog/some-post.html`).
- **Canonical host is non-www.** `www.netwebmedia.com` 301s to `netwebmedia.com` (enforced in `.htaccess` — don't remove that block or you reintroduce duplicate-content). HTTPS is enforced via HSTS preload.
- **Internal-only pages are blocked publicly via `.htaccess`** — `diagnostic.html`, `flowchart.html`, `orgchart.html`, `dashboard.html`, `desktop-login.html`, `nwmai.html`, `audit-report.html`, `*-prospects-report.html`, `*-digital-gaps.html`, `NetWebMedia_Business_Marketing_Plan_2026.html`. Don't link to them from public nav. The sitemap regen script (`_deploy/regen-sitemap.py`) excludes these patterns — don't add them back.
- **Unshipped `/app/<slug>` routes** fall through to `/app/coming-soon.html` — this is intentional; don't add 404 handling.
- **`register.html` is plan-aware**: `?plan=free` toggles the free-tier badge, perks list, heading copy, and CTA text, and forwards `plan` to `NWMApi.register()`. `pricing.html` "Free CRM" CTA links here — keep this contract intact when changing pricing.
- **Apache per-directory `.htaccess` overrides parent `RewriteRule`s** — burned us once. Apache's default behavior is that a child `.htaccess` `RewriteEngine On` block REPLACES (not inherits) the parent's rules unless `RewriteOptions Inherit` is set. The `/api-php/ → /api/` 301 redirect MUST live inside `api-php/.htaccess` (which is the directory the request lands in), NOT just the root `.htaccess` — the root rule never fires for requests resolving into `api-php/`. Use `RewriteCond %{THE_REQUEST} \s/api-php/(.*?)\sHTTP` + `RewriteRule ^ /api/%1 [R=301,L]` inside the per-dir file. Same gotcha applies any time a subdirectory has its own `.htaccess` and you want a parent rule to fire — verify with curl first.
- **`/whatsapp.html` is the canonical "contact us via WhatsApp" landing**, NOT a direct `wa.me/...` link. The Twilio sandbox `wa.me/14155238886` is dead — every public CTA across 28 files was swept (2026-05-01) to point at `/whatsapp.html`, which has intent-aware copy via `?topic=` and offers email + WhatsApp-list + contact-form fallbacks. Don't add new direct `wa.me/` links anywhere — go through `/whatsapp.html` (or `/whatsapp-updates.html` for opt-in) until WABA verification completes.

When linking between pages, match this convention or you'll generate broken canonicals.

### Subdomain routing

`.htaccess` maps **39 industry subdomains** to `/industries/` folder paths via a single cPanel wildcard (`*.netwebmedia.com → /public_html/`). Examples: `hotels.netwebmedia.com → /industries/hospitality/hotels/`, `app.netwebmedia.com → /crm-vanilla/`, `companies.netwebmedia.com → /companies/`. `staging.netwebmedia.com` returns 503 (not yet provisioned). Never add subdomains without updating `.htaccess` and registering the wildcard in cPanel DNS.

Mobile deep-linking: `.well-known/apple-app-site-association` must be served as `application/json` with status 200 and **no redirects** — `.htaccess` enforces this with explicit headers. Don't add redirect rules that would catch `.well-known/` paths.

### CSP and caching

**CSP is live** (not Report-Only) as of 2026-04-28 — adding new inline scripts or external origins will break pages silently. Check the `Content-Security-Policy` header in `.htaccess` before adding third-party scripts.

**Caching strategy** affects how quickly deploys propagate: HTML is never cached (0s), CSS/JS cached 5 min with revalidation, images/fonts 1 year immutable. After a deploy, CSS/JS changes may take up to 5 min to reach users.

## CSS canonical file — `css/styles.css`, NOT root `styles.css`

The repo has a legacy `styles.css` at the root **and** the canonical `css/styles.css`. **`css/styles.css` is the one in production.** Edit that one. The root `styles.css` exists for backwards compat with old caches; ignore unless explicitly asked.

Same pattern: `js/main.js` and friends in `js/` are canonical; some legacy `script.js` lives at root.

## Bilingual (EN / ES)

Many pages have an English original and a Spanish twin via `data-en` / `data-es` attributes (toggled by `js/main.js`'s lang bar). When changing copy on a page that has bilingual attributes, **update both `data-en` and `data-es`** or the lang switch will regress.

Some properties (industry pages, certain LPs) instead use parallel files with an `-en` suffix. Check the file before editing.

## Industry / niche taxonomy — exactly 14, fixed

NetWebMedia's CRM and content target **exactly 14 niches** (do not add, rename, or split):
`tourism, restaurants, health, beauty, smb, law_firms, real_estate, local_specialist, automotive, education, events_weddings, financial_services, home_services, wine_agriculture`

`industries/` page slugs map to these but use display names (e.g. `legal-services` for `law_firms`). When generating new industry pages, copy an existing one as a template — the layout and schema/AEO blocks need to match.

## Brand — Gulf Oil palette

- Navy `#010F3B` + Orange `#FF671F` + Inter / Poppins
- Source of truth: `BRAND.md` (root) and `plans/brand-book.html`
- Don't introduce new colors or fonts without checking the brand book
- Social profile assets: `assets/social/avatar-1024.svg` (square brand mark) + `assets/social/header-1500x500.svg` (X/FB/LinkedIn-safe header). Export to PNG before uploading to platforms.

## Social channels — what's in, what's permanently out

NetWebMedia's social mix as of 2026-05-01 — these exclusions are durable, do NOT propose adding excluded channels without an explicit Carlos go-ahead:

| Channel | State |
|---|---|
| Instagram `@netwebmedia` | In the mix; profile branding kit at `_deploy/social-channel-activation.md` §1; 3 brand-intro carousels rendered as 15 SVGs in `assets/social/carousels/` |
| YouTube `@netwebmedia` | Live |
| Facebook `/netwebmedia` | Live |
| TikTok `@netwebmedia` | Account claimed, content slated Q3 2026 |
| WhatsApp Business | In Meta verification (target June 2026); opt-ins capturing now via `/whatsapp-updates.html` |
| Email broadcasts | Live via `email_sequence_queue` cron |
| **LinkedIn** | **Excluded by choice** (Carlos, 2026-04-20) |
| **X / Twitter** | **Excluded by choice** (Carlos, 2026-05-01) — `@netwebmedia` stays unclaimed; email covers the data-led, thread-style content X would have hosted |

The `/social/` hub page reflects this state. The `_deploy/social-content-pipeline.md` v2 is the channel-specific playbook (3 emails + 3 follow-ups + 3 IG carousels per cluster cycle). The `_deploy/social-channel-activation.md` is the manual-tasks kit Carlos executes.

### Carousel asset pipeline

15 Instagram carousel slides at 1080×1080 live in `assets/social/carousels/{a,b,c}-slide-{1..5}.svg`. Regenerate by editing `_deploy/render-carousels.py` (Python templating script — slide content is in the `SLIDES` list at the top) and running `python3 _deploy/render-carousels.py`. The internal preview page at `/social-carousel-preview.html` (noindex) shows all 15 in a grid with a one-click "Export all 15 as PNG (1080×1080)" button that uses the Canvas API — zero npm deps. Carlos uses this to generate uploads for Instagram.

## Generators — Python and Node scripts at root and in `_deploy/`

Many static HTML pages are generated, not hand-written:

- `build_industry_pages.py` — generates `industries/<niche>/index.html`
- `build_landing_pages.py`, `build_subcategory_pages.py` — landing pages
- `_add_schema.py` — adds JSON-LD schema blocks (FAQ/Article/Org)
- `_deploy/generate_company_pages.py`, `generate_usa_audits.py` — the 680 company pages
- `_deploy/build-sitemap.py`, `regen-sitemap.py` — `sitemap.xml`

If you're editing one industry page by hand and the change should apply to all 14, edit the **generator template** instead and rerun, or your change will be overwritten next regenerate.

## AEO content cluster pattern

When building out a niche, the canonical pattern is:

1. **Industry hub**: `industries/<niche>/index.html` — add a "Resources" section with cards linking to the cluster posts, plus a 5-question FAQ + `FAQPage` JSON-LD.
2. **Two pillar blog posts** per niche, both ~1,800–1,950 words:
   - `blog/<niche>-aeo-strategy-2026.html` — schema-heavy (e.g. `LodgingBusiness`, `Restaurant`, `MedicalOrganization`); targets the "how to get cited by AI" query family.
   - `blog/<niche>-local-seo-vs-aeo.html` (or `aeo-vs-google-maps`) — channel decision matrix.
3. **Sitemap update**: add new posts at priority `0.75`, changefreq `monthly`, current `lastmod`.
4. **Schema rule**: every post needs `Article` + `FAQPage`; industry-specific schema (`MedicalOrganization`, `Physician`, etc.) goes on the post that names that entity.

Niches with full clusters as of 2026-05: `law_firms`, `tourism` (hospitality), `restaurants`, `health` (healthcare). Remaining 10 niches are pending — replicate the pattern, don't invent new structures.

## Mobile app — Capacitor 6 (`mobile/`)

Vanilla JS (not React), Vite-built. There is **no `vite.config.ts`** checked in — build uses Capacitor + Vite defaults. Entry point: `src/main.js` → auth check → routes to login or shell.

- Use `Capacitor.isNativePlatform()` to gate native APIs — all native code must have a web fallback.
- Splash screen is navy `#010F3B`, 800ms display, no spinner (Capacitor config).
- Status bar: Dark style with navy background on iOS/Android.
- Push notifications configured with badge + sound + alert.
- Build output goes to `mobile/dist/` — this is what Capacitor syncs to native projects.

## Video factory — adding templates

Templates live in `video-factory/src/compositions/`. To add one:
1. Create `src/compositions/MyTemplate.tsx` exporting a React component + Props type.
2. Register it in `src/index.tsx` with `<Composition id="my-template" ...>`.
3. Add field spec to `vid_templates()` in `api-php/routes/video.php`.

The render pipeline: CRM UI → `POST /api/video/render` → `video-factory/server.js :3030/render` → Remotion → MP4 on disk, served from `/video-out/*.mp4`. Requires `remotion_render_url` set in `/home/webmed6/.netwebmedia-config.php`.

## Internal AI rule

NetWebMedia uses **Claude Pro Max / Anthropic API** internally — never reference ChatGPT as an internal tool. ChatGPT, Perplexity, and Google AI Overviews are **AEO targets** (we want to be cited there), not internal infrastructure.

## Observability

Sentry is wired in `js/nwm-sentry.js` and loaded sitewide. The Sentry org/project is `netwebmedia`. When debugging production issues, check Sentry first.

GA4 is wired across pages; lead capture also writes through `api-php/` to the CRM.

## XSS hygiene in `crm-vanilla/`

The CRM is vanilla JS with lots of `innerHTML` for templating. Any user-controlled string going into `innerHTML` MUST be routed through `CRM_APP.esc()` (defined in `crm-vanilla/js/app.js`) — it HTML-escapes via a textNode write. Already retrofitted across `conversations.js`, `calendar.js`, `reporting.js`; apply the same pattern when touching other modules.

## Auto-backup commits — consolidate before pushing

A local `auto-save` daemon periodically commits and pushes WIP as `backup: auto-save <timestamp>`. **It will commit your in-flight work mid-stream** — before staging a batch, run `git log --oneline -5` and check whether the daemon already captured some of your files. If so, only stage what's NOT already in the auto-save commits; don't try to amend them.

**Consolidating fragmented history:**
```bash
# Find the SHA before auto-save commits started
git log --oneline | grep -v "backup: auto-save" | head -1
# e.g., abc1234

# Reset soft to that commit (keeps your changes staged)
git reset --soft abc1234

# Create a single clean commit
git commit -m "Your clean message"

# Push (force-with-lease is safe if no one else pushed)
git push --force-with-lease
```

Never use `--force` without `--force-with-lease`, and never on `main` without checking the run queue first.

## Operational notes

- **Don't `git add -A` blindly** — `_deploy/`, `_backup/`, `site-upload/`, and `*.zip` archives accumulate large generated artifacts. Stage specific files.
- **`_deploy/` contains two kinds of files** — be careful when cleaning:
  - *Generated artifacts* (HTML bundles, audit JSON, ad-hoc PHP probes like `_billchk.php`/`_probe.php`, one-off Python utilities) — junk drawer, scratch space, do not refactor.
  - *Operational framework docs* (`*.md`, e.g. `case-study-program.md`, `social-content-pipeline.md`) — intentional, version-controlled playbooks that Carlos uses. Don't delete or refactor them.
- **Desktop is OFF-LIMITS as a save location** for new files — always create organized folder structures within the repo or appropriate working directories.
- **When changing dates anywhere** (campaign calendar, plan docs, scheduled posts), also sync Google Calendar (`carlos@netwebmedia.com`, timezone `America/Santiago`). NWM tasks follow `NWM - <Area> - <Task>` naming.

## Agents — when to use which

See `.claude/AGENT-ROUTING.txt` for the full table. Short version:

- **Strategic / complex** (Sonnet): `cmo`, `engineering-lead`, `carlos-ceo-assistant`
- **Routine work** (Haiku, ~⅓ the tokens): `finance-controller`, `operations-manager`, `customer-success`, `sales-director`, `project-manager`, `data-analyst`, `content-strategist`, `creative-director`, `product-manager`
- **Batch requests to one agent** instead of multiple round-trips — saves 30–40% tokens.
