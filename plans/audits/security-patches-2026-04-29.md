# Security patches — 2026-04-29

Pre-white-label hardening. Three pre-flight blockers landed before any external CRM AI customer can be onboarded.

## Files changed

| File | LOC delta | Purpose |
|---|---|---|
| `js/crm-dashboard.js` | ~60 modified, ~40 added | Wrap every interpolation with `escapeHtml`/`safeNum`/`safeColor`; replace inline `onclick` with delegated handlers |
| `js/analytics.js` | ~15 modified, ~12 added | Hoist a real `escapeHtml` helper; coerce score values; harden severity lookup |
| `api-php/lib/ratelimit.php` | new (60 LOC) | Shared file-backed sliding-window limiter |
| `api-php/routes/public.php` | +6 modified | Apply limiter to `/audit` (10/hr/IP) and `/newsletter/subscribe` (30/hr/IP) |
| `api-php/routes/ai.php` | +35 modified | Replace LIKE-with-addslashes lookup; reject wildcards; rate-limit public chat (20/hr per IP+agent); fall back to `JSON_EXTRACT` if column missing |
| `api-php/routes/resources.php` | +25 added | Sync `data.public_token` -> `public_token` column on POST/PUT for `ai_agent` |
| `api-php/migrate.php` | +35 added | Add `public_token` column + UNIQUE index + idempotent backfill |

## Bug 1 — Stored XSS in CRM dashboard

**Severity: critical.** Mock data masked the issue; first real contact named `<script>...` would have run JS in every operator's browser.

Before (`js/crm-dashboard.js`):
```js
<button class="btn btn-sm btn-danger" onclick="deleteRecord('contacts','${c.id}')">Delete</button>
```
A contact id of `', alert(1) //` breaks out of the JS string.

After:
```js
<button class="btn btn-sm btn-danger" data-action="delete" data-type="contacts" data-id="${escapeHtml(c.id)}">Delete</button>
```
Plus a delegated click handler in `setupEvents()` that reads from `dataset` (not parsed as JS).

Other fixes:
- Added top-level `escapeHtml`, `safeUrl`, `safeColor`, `safeNum` helpers.
- Wrapped every `${var}` in an `innerHTML` template that wasn't already wrapped — stats, pipeline cards, dashboard activity, leads, contacts, companies, deals table, leads table, task items, pipeline tabs, donut chart legend, bar chart, analytics KPIs, forecast table, company select options.
- Whitelisted `priority` and `kind` (activity icon) before injecting into class names.
- Whitelisted colors going into inline `style="background:...; color:..."` to `#hex`, `rgb()`, `rgba()`, or `var(--token)` — falls back to a default if the API returns garbage.
- `js/analytics.js`: same `escapeHtml`, coerced numeric scores via `safeNum` before injecting, switched the severity color lookup to `hasOwnProperty` to defeat prototype-key shenanigans.

## Bug 2 — Cross-tenant agent leak in `/api/public/agents/chat`

**Severity: critical** (cross-tenant data exposure).

Before (`api-php/routes/ai.php:133`):
```php
$agent = qOne("SELECT * FROM resources WHERE type = 'ai_agent' AND data LIKE ?",
  ['%"public_token":"' . addslashes($b['public_token']) . '"%']);
```
A `public_token` of `%` matches every agent in every org. `addslashes` escapes quotes, not LIKE wildcards.

After (defense in depth):
1. **Input validation** — reject any token that doesn't match `^[A-Za-z0-9_\-]+$` and length 1–128. Live the moment this deploys; closes the bug today.
2. **Indexed column lookup** — new `resources.public_token VARCHAR(64) UNIQUE`. Lookup uses `WHERE public_token = ?` (exact, parameterized).
3. **Fallback** — if the column doesn't exist on this install yet, fall back to `JSON_UNQUOTE(JSON_EXTRACT(data, '$.public_token')) = ?` (also exact match, no LIKE semantics). Code works pre- and post-migration.
4. **Write side** — `routes/resources.php` POST/PUT now mirrors `data.public_token` into the column for `type='ai_agent'`.

## Bug 3 — No rate limiting on public AI endpoints

**Severity: high** (direct Anthropic billing exposure).

New `api-php/lib/ratelimit.php` exposes `rate_limit_check($bucket, $maxReqs, $window, $key=null)`. On limit hit it sets `Retry-After` and emits 429 via `err()`.

| Endpoint | Limit | Bucket key |
|---|---|---|
| `POST /api/public/audit` | 10 / hr | IP |
| `POST /api/public/newsletter/subscribe` | 30 / hr | IP |
| `POST /api/public/agents/chat` | 20 / hr | IP + agent_id |

The limit on `/agents/chat` is keyed by IP+agent_id deliberately: a botnet can't burn one tenant's budget by hammering another tenant's agent from the same IP, and a single attacker with one IP can't multiply their per-tenant budget by switching tokens.

`/forms/submit`'s existing inline limiter is left in place — different code path, didn't want to mix scope.

## Manual steps for Carlos

**Run the migration once after deploy:**
```
GET https://netwebmedia.com/api-php/migrate.php?token=<first 16 chars of jwt_secret>
```
The migration is idempotent — safe to run on every deploy if you prefer. It adds the `public_token` column, the UNIQUE index, and backfills existing rows. Until you run it, the cross-tenant lookup falls back to `JSON_EXTRACT` — slightly slower (no index) but correct.

The rate limiter writes counters under `api-php/data/ratelimit/<bucket>/`. Folders are auto-created. No setup needed.

## Verification

- **Bug 1**: Insert a contact with `firstName = '<img src=x onerror=alert(1)>'`. Reload `/crm-vanilla/`. Should render as escaped text, not fire an alert. Repeat for company name, deal name, lead title, task title.
- **Bug 2**: `curl -X POST https://netwebmedia.com/api/public/agents/chat -d '{"public_token":"%","message":"hi"}'` -> expect HTTP 400 (`Invalid public_token`). With a valid token -> 200 and only the matching agent responds.
- **Bug 3**: Loop `curl -X POST .../api/public/audit ...` 11 times from the same IP -> first 10 succeed, 11th returns 429 with `Retry-After`. Same for newsletter (cap 30) and agents/chat (cap 20).

## Followup (not done in this patch)

- `/forms/submit`'s honeypot returns 200 — fine. But it executes the rate-limit write before the honeypot check, which means honeypot trips still cost a bucket entry. Low impact; flag for next pass.
- Other operator-facing JS (e.g. `js/cms.js`, `crm-vanilla/` if it has its own dashboard renderers) was out of scope but should get the same audit before white-label launch.
- Sentry should pick up 429s. Confirm a release-tagged event lands on the next deploy.
- The migration token (`first 16 chars of jwt_secret`) is OK but really should rotate after each run, or be replaced with a one-shot CLI-only invocation.
- Consider an `org_id` index on the new `public_token` column once we have multiple white-label tenants — currently UNIQUE globally, which is correct only if tokens are generated with enough entropy.
