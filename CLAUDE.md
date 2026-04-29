# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

This is the **netwebmedia.com production property** plus a collection of supporting apps and operating assets. It is NOT a single application — it is a flat-deployed multi-property monorepo:

1. **Marketing site** — flat HTML/CSS/JS at the repo root (`index.html`, `services.html`, `pricing.html`, etc.) plus `industries/`, `blog/`, `tutorials/`, `lp/`, `app/`. Served from cPanel/Apache at InMotion. **No build step** for the public site.
2. **`api-php/`** — PHP API (lead capture, audit handler, CRM endpoints) served at `netwebmedia.com/api/` (canonical) — the `/api-php/` path 301-redirects to `/api/`. Entry point: `api-php/index.php`.
3. **`crm-vanilla/`** — separate flat-HTML CRM app deployed to `netwebmedia.com/crm-vanilla/`. This is NetWebMedia's own CRM (do NOT replace with HubSpot — internal rule). **`crm-vanilla/js/data.js` is 100% mock/seed data** for UI development; real data comes from the live PHP API.
4. **`backend/`** — Django CRM backend (multi-tenant, DRF, Celery). Uses SQLite locally (`backend/db.sqlite3`). **Not deployed to InMotion** — separate property for future use.
5. **`mobile/`** — Capacitor 6 app (iOS + Android + web). Vite-built vanilla JS. Reuses existing `/api/` endpoints. Run separately from `mobile/`.
6. **`video-factory/`** — Remotion-based programmatic video renderer. Express server on `:3030`. PHP API calls it at `POST /api/video/render`.
7. **`_deploy/companies/`** — 680 generated per-company audit pages deployed to `netwebmedia.com/companies/**`.
8. **`plans/`** — canonical strategy docs (`business-plan.html`, `marketing-plan.html`, `brand-book.html`, `execution-90day.html`, `index.html` hub). Always incorporate these when reasoning about NetWebMedia direction.
9. **`.claude/agents/`** — 12 custom agents mirroring NetWebMedia's org chart (cmo, sales-director, engineering-lead, etc.). Delegate by role; see `.claude/AGENT-ROUTING.txt` for routing rules and Sonnet-vs-Haiku assignments.

## Run locally

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

**The two FTP users are scoped to different directories** — `CPANEL_FTP_USER` is chrooted to `/public_html/companies/` and physically cannot write site-root files. That's why `deploy-site-root.yml` uses a separate user. See header comments in each workflow for one-time setup.

Deploys are **incremental sync by hash** (`SamKirkland/FTP-Deploy-Action`) — safe to re-run.

Other workflows: `psi-baseline.yml` (PageSpeed snapshots), `uptime-smoke.yml`, `indexnow-ping.yml`, `generate-blog-queue.yml`, `publish-blogs-scheduled.yml`, `generate-guide-pdfs.yml`, `twilio-register-webhook.yml`.

## PHP API architecture

The API uses a **single generic `resources` table** as an EAV store — every entity (contacts, deals, forms, blog posts, templates, landing pages, etc.) is a row differentiated by the `type` column. JSON blob in `data` holds entity-specific fields. This means:

- `GET /api/resources/contact` — lists contacts
- `GET /api/resources/deal` — lists deals
- `POST /api/resources/form` — creates a form
- Any `type` string works; no schema migration needed for new entity types

**Auth:** uses `X-Auth-Token: <token>` header (NOT `Authorization: Bearer`). Token is returned on login and stored as `nwm_token` cookie. Admin credentials are seeded by `api-php/migrate.php` (run once via `GET /api/migrate.php?token=<first-16-chars-of-jwt_secret>`).

**Public routes** (`/api/public/*`) require no auth: form submission, newsletter subscribe, blog list, audit, stats, prospect chatbot.

**Cron route** (`GET /api/cron`) processes the `email_sequence_queue` table — send next batch of drip emails. Must be called by an external scheduler (e.g. cPanel cron job every 5 min).

## Email sequences

Drip email system: `email-templates/sequences.json` defines sequence timing, `email-templates/niche-sequences.json` for industry-specific variants, and `email-templates/*.html` are the message templates (using `_base.html` layout).

Available sequences: `welcome`, `audit_followup`, `partner_application` (+ niche sequences per the 14 CRM niches). Contacts are enrolled via `seq_enroll()` in `api-php/lib/email-sequences.php`. Preview any template at `GET /api/public/email/preview?id=welcome-1&lang=es`.

## URL routing rules — non-obvious, will trip you up

netwebmedia.com is **flat HTML on Apache**, not a framework router. Rules:

- **Top-level pages have NO extension and NO trailing slash** in canonical URLs (e.g. `/services` not `/services.html` and not `/services/`). Apache rewrites in `.htaccess` handle this.
- **Nested pages keep `.html`** (e.g. `/blog/some-post.html`).
- **Canonical host is non-www** (`netwebmedia.com`, not `www.netwebmedia.com`).
- **Internal-only pages are blocked publicly via `.htaccess`** — `diagnostic.html`, `flowchart.html`, `orgchart.html`, `dashboard.html`, `desktop-login.html`, `nwmai.html`, `audit-report.html`, `*-prospects-report.html`, `*-digital-gaps.html`, `NetWebMedia_Business_Marketing_Plan_2026.html`. Don't link to them from public nav.

When linking between pages, match this convention or you'll generate broken canonicals.

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
