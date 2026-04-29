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

Required GitHub Actions secrets: `JWT_SECRET`, `DB_PASSWORD`, `RESEND_API_KEY`, `ANTHROPIC_API_KEY`, `HUBSPOT_TOKEN`, `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_WEBHOOK_SECRET`, `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_FROM`, `WA_VERIFY_TOKEN`, `WA_META_TOKEN`, `WA_PHONE_ID`, `WA_META_APP_SECRET`, `CPANEL_FTP_ROOT_USER`, `CPANEL_FTP_ROOT_PASSWORD`, `CPANEL_FTP_USER`, `CPANEL_FTP_PASSWORD`.

Other workflows: `psi-baseline.yml` (PageSpeed snapshots), `uptime-smoke.yml`, `indexnow-ping.yml`, `generate-blog-queue.yml`, `publish-blogs-scheduled.yml`, `generate-guide-pdfs.yml`, `twilio-register-webhook.yml`.

## PHP API architecture

The API uses a **single generic `resources` table** as an EAV store — every entity (contacts, deals, forms, blog posts, templates, landing pages, etc.) is a row differentiated by the `type` column. JSON blob in `data` holds entity-specific fields. This means:

- `GET /api/resources/contact` — lists contacts
- `GET /api/resources/deal` — lists deals
- `POST /api/resources/form` — creates a form
- Any `type` string works; no schema migration needed for new entity types

**Auth:** uses `X-Auth-Token: <token>` header (NOT `Authorization: Bearer`). Token is returned on login and stored as `nwm_token` cookie/localStorage. Admin credentials are seeded by `api-php/migrate.php` (run once via `GET /api/migrate.php?token=<first-16-chars-of-jwt_secret>`).

**Public routes** (`/api/public/*`) require no auth: form submission, newsletter subscribe, blog list, audit, stats, prospect chatbot.

**Cron route** (`GET /api/cron`) processes the `email_sequence_queue` table — send next batch of drip emails. Must be called by an external scheduler (e.g. cPanel cron job every 5 min).

**Rate limiting** is file-based — `/api/data/ratelimit/<ip-hash>.json` (api-php) and `crm-vanilla/storage/ratelimit/` (CRM). Uses `flock(LOCK_EX)` for atomicity + probabilistic GC. Survives PHP-FPM restarts; no Redis needed. Web access to the storage dir is blocked by `.htaccess`.

**Honeypot behavior:** Bot submissions get a silent 200 with fake `submission_id: 0` (not 403) to prevent bot adaptation.

**Multi-tenant isolation** in `crm-vanilla/api/`: every owned table (`contacts`, `deals`, `events`, `email_templates`, `email_campaigns`, `conversations`) carries a nullable `user_id` column. Handlers MUST filter via the `tenant_where()` / `tenant_owns()` helpers in `crm-vanilla/api/lib/tenancy.php`. Legacy rows (`user_id IS NULL`) are visible to all tenants by design — backfilled rows belong to user 1 (Carlos).

**SSRF defense** for any handler that fetches user-supplied URLs (e.g. `analyze`, `proposal`): use `url_guard()` from `crm-vanilla/api/lib/url_guard.php`. It DNS-resolves and rejects loopback, private, link-local, and AWS-metadata (169.254.169.254) ranges. Never disable curl SSL verification — production CA bundle works fine on InMotion.

**CSRF defense:** `crm-vanilla/api/index.php` enforces a same-origin `Origin`/`Referer` check on all state-changing requests, plus session cookies are `SameSite=Strict`. Auth tokens are hash_equals-compared.

### API route modules (`api-php/routes/`)

22 route files, each handling a business domain:
- **Core:** `auth.php`, `resources.php` (EAV CRUD), `public.php`
- **CRM entities:** `contacts.php`, `deals.php`, `campaigns.php`, `comments.php`
- **Comms:** `whatsapp.php`, `social.php`, `ai.php`, `nwmai.php`, `public-chat.php`
- **Integrations:** `hubspot.php`, `vapi.php` (voice), `heygen.php` (video synthesis), `billing.php`
- **Content/ops:** `content.php`, `recipes.php`, `video.php`, `audit.php`, `abtests.php`, `workflows.php`, `cmo.php`

`crm-vanilla/api/` uses **query-string routing** (`?r=resource&id=123`) instead of path-based routing — this is intentional ModSecurity evasion for the CRM's internal API.

## CRM vanilla JS architecture (`crm-vanilla/`)

Vanilla JS SPA with a custom route dispatcher in `crm-vanilla/js/app.js`. No framework, no build step.

- **Session storage:** `nwm_token` and `nwm_user` in `localStorage`. The shared API client at `app/js/api-client.js` auto-redirects 401s to login unless `noRedirectOn401` is passed.
- **Feature modules:** `contacts.js`, `conversations.js`, `pipeline.js`, `marketing.js`, `calendar.js`, `reporting.js`, `automation.js`, `payments.js`, `documents.js`, `courses.js`, `sites.js`, `settings.js` — one file per CRM section.
- **Data layer:** `crm-vanilla/js/data.js` is mock seed data only. Real data flows through the EAV `resources` table via `/crm-vanilla/api/`.

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

## Generators — Python and Node scripts at root and in `_deploy/`

Many static HTML pages are generated, not hand-written:

- `build_industry_pages.py` — generates `industries/<niche>/index.html`
- `build_landing_pages.py`, `build_subcategory_pages.py` — landing pages
- `_add_schema.py` — adds JSON-LD schema blocks (FAQ/Article/Org)
- `_deploy/generate_company_pages.py`, `generate_usa_audits.py` — the 680 company pages
- `_deploy/build-sitemap.py`, `regen-sitemap.py` — `sitemap.xml`

If you're editing one industry page by hand and the change should apply to all 14, edit the **generator template** instead and rerun, or your change will be overwritten next regenerate.

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

A local `auto-save` script periodically commits and pushes WIP as `backup: auto-save <timestamp>`. They fragment history. Before/after a substantive change, consolidate with `git reset --soft <pre-backup-sha>` + a single named commit + `git push --force-with-lease`. Never reset/force-push without `--force-with-lease`, and never on `main` without checking the run queue first.

## Operational notes

- **Don't `git add -A` blindly** — `_deploy/`, `_backup/`, `site-upload/`, and `*.zip` archives accumulate large generated artifacts. Stage specific files.
- **`_deploy/` is a junk drawer** of historical deploy bundles, ad-hoc PHP probe scripts (`_billchk.php`, `_probe.php`, etc.), generated audit JSON, and one-off Python utilities. Treat it as scratch space; do not refactor.
- **Desktop is OFF-LIMITS as a save location** for new files — always create organized folder structures within the repo or appropriate working directories.
- **When changing dates anywhere** (campaign calendar, plan docs, scheduled posts), also sync Google Calendar (`carlos@netwebmedia.com`, timezone `America/Santiago`). NWM tasks follow `NWM - <Area> - <Task>` naming.

## Agents — when to use which

See `.claude/AGENT-ROUTING.txt` for the full table. Short version:

- **Strategic / complex** (Sonnet): `cmo`, `engineering-lead`, `carlos-ceo-assistant`
- **Routine work** (Haiku, ~⅓ the tokens): `finance-controller`, `operations-manager`, `customer-success`, `sales-director`, `project-manager`, `data-analyst`, `content-strategist`, `creative-director`, `product-manager`
- **Batch requests to one agent** instead of multiple round-trips — saves 30–40% tokens.
