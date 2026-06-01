# Engineering Audit — netwebmedia.com (deep)
**Date:** 2026-04-29 · **Auditor:** engineering-lead (Claude) · **Method:** static read of `api-php/`, `crm-vanilla/`, `backend/`, `js/`, `css/`, workflows. No live request capture beyond the existing 04-29 surface audit.

---

## Executive verdict

**The codebase is a working MVP, not a white-label CRM platform.** The PHP API is competent for a single-tenant marketing site with lead capture and AI chat. But the data model (single-table EAV with `org_id` hard-coded to `1`), zero tenant provisioning, and the fact that `crm-vanilla/` ships **mock data** in `js/data.js` mean we cannot honestly sell a white-label CRM today. Three weeks of focused work would close the gap.

---

## Frontend findings

**JS quality.** `js/main.js` (832 LOC) is clean vanilla; Sentry uses `defer`, GA4 uses `async` — correct hygiene. The Meta Pixel block (`index.html:48-59`) is dead code: `window.NWM_META_PIXEL_ID` is never set, so zero pixel events fire (also flagged in 04-29 surface audit).

**XSS surface — biggest debt in the repo.** `js/crm-dashboard.js` has 25+ unescaped `innerHTML = ` interpolations of contact/deal/lead data (e.g. `tbody.innerHTML = list.map(c => \`...${c.name}...\`)`). Today it's "safe" only because the data is mock. The instant a real contact named `<script>` lands in the DB, it executes in every CRM operator's browser. `js/analytics.js` has the same pattern on audit results.

**CSS.** `css/styles.css` is 1,903 lines, single file — fine for current surface. Legacy root `styles.css` (537 lines) is dead weight; delete it. Inline `style=` is heavy in `index.html` — readable but blocks future CSP `style-src` tightening.

**Forms.** Newsletter form posts to `/api/public/newsletter/subscribe`. Backend validates via `FILTER_VALIDATE_EMAIL` and dedupes by JSON path. Honest. **But:** `/api/public/forms/submit` has a 10/hr/IP file-backed rate limiter; `/api/public/newsletter/subscribe` does **not** share it. A bot can mass-enroll arbitrary emails into the welcome sequence and turn NetWebMedia into a free spam relay.

**Accessibility.** Did not run axe — not covered.

---

## Backend findings — `api-php/`

**Auth.** DB-stored sessions (random 64-char tokens, 30-day TTL), bcrypt hashing, `httpOnly + Secure + SameSite=Lax` cookie, `X-Auth-Token` header fallback. Correct and unremarkable in a good way. JWT secret is reused for cron tokens (first 16 chars of `jwt_secret`) — couples two unrelated concerns; rotate one, break the other.

**The `resources` table is the load-bearing decision.** One MySQL table with `(id, org_id, type, slug, title, status, data JSON, owner_id, ...)` stores contacts, deals, blog posts, forms, AI agents, landing pages — everything. Searches use `JSON_EXTRACT(data, '$.email')` against unindexed JSON.

- **Pros:** Schema-free, one CRUD route covers all types.
- **Cons:** Zero referential integrity (a `deal` references `contact_id` only inside JSON — orphans inevitable). `JSON_EXTRACT` + `LIKE` on unindexed JSON **does not scale past ~50k rows/type**. Reporting becomes full table scans. Multi-tenancy is per-query `org_id = ?` filtering — one missed clause = cross-tenant leak.

Fine for ~10 paying customers. **Will not** carry a white-label CRM with hundreds of orgs holding 10k+ contacts each. Plan: extract `contacts`, `deals`, `email_sequence_queue` to typed tables before that scale.

**SQL injection / tenant leakage.** All ~12k LOC use parameterized PDO prepares — clean. `routes/resources.php` correctly filters `org_id` everywhere. **One real bug** at `routes/ai.php:133`:

```php
$agent = qOne("SELECT * FROM resources WHERE type = 'ai_agent' AND data LIKE ?",
  ['%"public_token":"' . addslashes($b['public_token']) . '"%']);
```

`addslashes` is the wrong escape for `LIKE`. Parameterization blocks SQL injection, but `%` and `_` in user-supplied `public_token` become wildcards — a token of `%` matches **every agent across every org**. **Severity: high.** Move `public_token` to a dedicated indexed column or filter post-query.

**Public exposure.** Rate-limited: `/forms/submit` (10/hr/IP file), `/chat` (20/24h/IP DB). **Not rate-limited:** `/newsletter/subscribe`, `/audit` (calls Claude on every hit — direct cost exposure), `/agents/chat` (Claude + the `public_token` bug above), `/email/preview` (renders arbitrary template HTML).

**Email sequences.** `lib/email-sequences.php` auto-creates schema on first call (good for ops, bad under migration contention). Queue table indexed on `(status, send_at)`. Enrollment cancels prior duplicates. Cron processes 25/batch. **Missing:** no bounce/complaint webhook ties back to `email_opt_in` — hard bounces keep sending until manual unsubscribe.

**Cron.** Three GitHub Actions workflows trigger automation/sequences/HubSpot. If GH Actions has an outage, all sequences pause silently. No backup cPanel cron. Single point of failure, five-minute fix.

---

## Backend findings — `backend/` (Django)

**Status: shelf-ware.** Two commits touching it, `db.sqlite3` present, apps `accounts/common/crm/organizations` with migrations, **no `settings.py`** in `backend/config/` (only `__pycache__`). No deploy workflow references it.

**Verdict: kill it or commit to it.** Maintaining a Django CRM you don't deploy is cognitive overhead — every engineer asks "which is real?" If you want true multi-tenant, Django's `Organization`/`Membership` + DRF + Celery is the right architecture and dramatically better than the PHP EAV at scale. You cannot run two CRM backends in parallel.

---

## `crm-vanilla/` reality check

`crm-vanilla/js/data.js` is **mock data** — Sarah Chen, Marcus Johnson, hardcoded $24,500 deals. The `crm-vanilla/api/` PHP handlers (37 files) are real and hit MySQL using a normalized `contacts/deals/pipeline_stages/messages` schema — **completely separate from `api-php/`'s `resources` table**. Two production databases with no shared tenancy. A signup in `api-php` is invisible to `crm-vanilla`. **This is the central architectural problem. Pick one.**

---

## `mobile/` and `video-factory/`

`mobile/` is a Capacitor + Vite shell (`api.js`, `router.js`, `screens/`) — looks like a thin wrapper over the same `/api/` endpoints. No iOS/Android build artifacts checked in, no App Store ID set (commented out at `index.html:32`). Aspirational, not shipping.

`video-factory/` is Remotion (`compositions/`, `index.tsx`, `server.js`). Standalone — not wired to the main API. Status unknown without running it.

---

## Multi-tenant / white-label readiness

| Capability | Status |
|---|---|
| `org_id` column on `users` and `resources` | Present, hard-coded `org_id = 1` in 7+ places (newsletter subscribe, public form auto-create) |
| Org-scoped queries in `resources` route | Yes, correct |
| Org provisioning on signup | **No** — every signup goes to `org_id = 1` (single shared tenant) |
| Per-org subdomain routing (`client.netwebmedia.com`) | **No** — would require Apache vhost + `.htaccess` rewrite + tenant-from-host middleware |
| Per-org branding (logo, colors, sender email) | **No** — sender is hardcoded `admin@netwebmedia.com` from `parse_url(base_url)` |
| Per-org Claude API key / billing isolation | **No** — single shared `anthropic_api_key` from server config |
| White-label domain SSL automation | **No** |
| Client onboarding automation | **No** — manual; the `seed-automations.php` script seeds NetWebMedia's own data |

**Reality:** the marketing copy on `index.html` ("Rebill all 41 modules at your own markup under your domain, your logo, your SSL, your email — Stripe Connect auto-invoices your clients") is currently aspirational. We can sell *managed services on top of our CRM*, not white-label CRM-as-a-product.

---

## Tech-stack gaps

1. **Zero automated tests.** No PHPUnit, no Jest, no Cypress, no `tests/` in `api-php/`. For a CRM holding PII this is the single largest risk.
2. **No staging.** Workflows push straight to production InMotion. No `staging.netwebmedia.com`. Rollback = redeploy previous commit — fine for static HTML, dangerous for `migrate.php`.
3. **Backups undocumented.** `crm-vanilla/backup-status.json` is written by an auto-save commit loop polluting git history. DB backups are presumably JetBackup but neither codified nor monitored.
4. **No API-side observability.** Sentry is JS-only. PHP errors go to `error_log` with no aggregation. We cannot see API 500 rates without SSH.
5. **`migrate.php` is HTTP-reachable**, auth'd by "first 16 chars of jwt_secret" — leak the JWT once and migration access leaks with it. Should be CLI-only or IP-allowlisted.

---

## Top 5 priorities (impact ÷ effort)

1. **Escape `innerHTML` in `crm-vanilla` and `js/analytics.js`.** Stored XSS waiting on first real customer. ~4 hours. Add a `escapeHtml()` helper and wrap every `${var}` interpolation. **Impact: critical.**
2. **Fix the `LIKE` wildcard bug in `routes/ai.php:133`.** Move `public_token` to a dedicated indexed column, or filter in PHP. ~1 hour. **Impact: high (cross-tenant leak).**
3. **Add rate limit to `/api/public/audit`, `/api/public/newsletter/subscribe`, `/api/public/agents/chat`.** Reuse the file-backed limiter from `routes/public.php:18`. ~2 hours. **Impact: high (cost + abuse).**
4. **Decide: kill `backend/` or kill `api-php/`'s `resources` table.** You cannot ship white-label CRM on the EAV pattern. Either commit to Django and migrate `api-php/` route-by-route, or extract `contacts`/`deals` from `resources` into typed PHP tables. Two-week project. **Impact: existential for white-label sale.**
5. **Add a backup cron on cPanel calling `/api/cron/automation` every 10 min.** GitHub Actions can drop. ~30 min. **Impact: medium-high (revenue if sequences pause silently).**

---

## What I did NOT cover

- Live request profiling, PageSpeed Insights run, real Lighthouse scores
- `crm-vanilla/api/` handler-by-handler security review (37 files, deferred)
- `lib/audit-engine.php` (1,496 LOC) and `lib/knowledge-base.php` (2,098 LOC) — only spot-read
- `routes/billing.php` (763 LOC) — MercadoPago webhook, signature verification not audited
- `routes/whatsapp.php` (538 LOC) — Twilio webhook signature verification not audited
- `mobile/` Capacitor build pipeline and `video-factory/` Remotion runtime
- DB index health, slow query log, actual table sizes in production
- CSP/HSTS effective values (covered by 04-29 surface audit)
- `.htaccess` rewrite correctness (covered by 04-29 surface audit)
