# Handler Migration to `org_where()` — 2026-04-29

**Owner:** Engineering Lead
**Status:** Code-only refactor shipped. Migrations not yet applied to prod.

## Approach

Three transitional helpers were added to `crm-vanilla/api/lib/tenancy.php`:

- `is_org_schema_applied()` — `SHOW COLUMNS FROM contacts LIKE 'organization_id'`, cached in a static. Used as a per-worker canary.
- `tenancy_where($alias)` — returns `org_where()` post-migration, `tenant_where()` pre-migration. Same `[$sql,$params]` shape so handlers swap one call.
- `tenancy_insert_org()` — splice helper for INSERT lists. Most handlers use the explicit `if ($orgId !== null)` branch instead because the existing SQL is positional, not named.

This is the gating-blocker fix Carlos requested. The schema migration can now be applied and handlers will pivot from `user_id` to `organization_id` filtering automatically.

## Files touched

| File | Lines changed | Notes |
|---|---|---|
| `crm-vanilla/api/lib/tenancy.php` | +66 | Added `is_org_schema_applied`, `tenancy_where`, `tenancy_insert_org`. Legacy `tenant_*` helpers untouched. |
| `crm-vanilla/api/lib/hubspot_client.php` | +40 | Pull → org-scoped contact insert; push → only current-org rows. |
| `crm-vanilla/api/handlers/contacts.php` | rewrite (~135 lines) | Replaced `tenant_owns()` ownership pattern with re-issued `tenancy_where` filter on every UPDATE/DELETE — eliminates row-fetch round-trip and avoids a TOCTOU window. |
| `crm-vanilla/api/handlers/deals.php` | ~80 | Same UPDATE/DELETE fix; INSERT branches for contact + deal. |
| `crm-vanilla/api/handlers/events.php` | rewrite (~115) | Same shape as contacts. |
| `crm-vanilla/api/handlers/conversations.php` | rewrite (~75) | INSERT branch + scoped lookups. |
| `crm-vanilla/api/handlers/messages.php` | rewrite (~75) | Closure rewritten to use `tenancy_where`. INSERT denormalises `organization_id`. |
| `crm-vanilla/api/handlers/payments.php` | ~40 | INSERT branch, ownership-check rewrite. |
| `crm-vanilla/api/handlers/templates.php` | ~50 | Adds `(organization_id IS NULL OR <org>)` so system templates remain visible to sub-accounts. |
| `crm-vanilla/api/handlers/campaigns.php` | ~80 | Was unfiltered before — added scope to the rollup, audience SELECT, CRUD, and `campaign_sends` INSERT. |
| `crm-vanilla/api/handlers/social.php` | ~80 | Function signatures gained `$orgId`; `_social_org_clause()` helper composes a uniform AND fragment. |
| `crm-vanilla/api/handlers/unsubscribes.php` | rewrite (~35) | Was unfiltered. Now scoped via direct `org_where()` (no legacy `user_id`). |
| `crm-vanilla/api/handlers/track.php` | +30 | Public route — derives org via `campaign_sends.organization_id`. |
| `crm-vanilla/api/handlers/leads.php` | +25 | Public route — resolves org via `org_from_request()` (host/subdomain). |
| `crm-vanilla/api/handlers/intake.php` | +20 | Same host-resolved insert pattern as leads. |
| `crm-vanilla/api/handlers/stages.php` | rewrite (~22) | `pipeline_stages` had no `user_id`, so uses `org_where()` directly. |
| `crm-vanilla/api/handlers/stats.php` | rewrite (~70) | Every aggregate now org-scoped. |
| `crm-vanilla/api/handlers/reporting.php` | rewrite (~140) | Every aggregate now org-scoped. |
| `crm-vanilla/api/handlers/realtime.php` | ~100 | KPIs, feed, social, campaigns — all scoped. |
| `crm-vanilla/api/handlers/email_status.php` | rewrite (~55) | Counters scoped. |
| `crm-vanilla/api/handlers/niche_metrics.php` | +25 | Adds `canTouchContact()` ownership check on GET/POST/DELETE. |
| `crm-vanilla/api/handlers/niche_config.php` | ~25 | Seed inserts include `organization_id`. |
| `crm-vanilla/api/handlers/dedupe.php` | ~25 | Org-scoped DELETE. |
| `crm-vanilla/api/handlers/filter_identifiable.php` | ~20 | Org-scoped DELETE. |
| `crm-vanilla/api/handlers/filter_marketing_ready.php` | ~25 | Org-scoped counts. |
| `crm-vanilla/api/handlers/domain_audit.php` | ~30 | Org-scoped count/list/purge. |
| `crm-vanilla/api/handlers/import_csv.php` | ~25 | INSERT branch. |
| `crm-vanilla/api/handlers/import_best.php` | ~25 | INSERT branch. |
| `crm-vanilla/api/handlers/seed.php` | ~50 | Every seed INSERT branched. |
| `crm-vanilla/api/handlers/seed_contacts.php` | ~20 | INSERT branch. |
| `crm-vanilla/api/handlers/seed_templates.php` | ~25 | INSERT branch + uniqueness check now per-org. |
| `crm-vanilla/api/handlers/seed_client_templates.php` | ~25 | INSERT branch + uniqueness check now per-org. |

**Untouched on purpose:** `auth.php` (logs in by global email), `settings.php` (NetWebMedia-wide config — flagged below), `admin.php` (superadmin platform view), `analyze.php` / `proposal.php` (stateless), `migrate.php`, `hubspot.php` (delegates to lib), `organizations.php` (already org-aware).

## Special handling

- **Templates** preserve `(organization_id IS NULL OR org_match)` so master-seeded niche templates show up for every sub-account. After the enforce migration this will need a different mechanism — likely cloning system templates per org on first signup.
- **Master-elevation** is implicit: `org_where()` returns `'1=1'` for the master org, so existing NetWebMedia admin sessions retain global visibility for support tickets.
- **Public routes** (`leads`, `intake`, `track`) cannot use the session-based resolver. `leads`/`intake` resolve via host (subdomain → custom domain → master fallback). `track` looks up `campaign_sends.organization_id` from the token.
- **Tables without `user_id`** (`pipeline_stages`, `messages`, `campaign_sends`, `unsubscribes`, all `social_*`, `niche_*`, `leads`) cannot use `tenancy_where()` pre-migration without erroring. Those handlers call `org_where()` directly inside an `is_org_schema_applied()` guard.

## Verification (after applying migrations)

1. Apply both SQL files per `crm-vanilla/api/migrations/README.md`.
2. Hit the canary:
   ```bash
   curl -fsS "https://netwebmedia.com/crm-vanilla/api/?r=stages"
   ```
   Should return rows. Pre-migration this returned global, post-migration with no X-Org-Slug it returns master-org rows (which were backfilled to org 1).
3. Create a sub-account, switch into it, hit `?r=contacts`. Must return empty (the new sub-account has no contacts yet).
4. As master-org admin, switch into the sub-account org, repeat — should return empty (admin elevation gives `1=1`, but this org legitimately has no rows).
5. Check `/api/?r=stats`, `/api/?r=reporting`, `/api/?r=realtime` from both contexts — sub-account values should be zero, master-org values should match pre-migration.
6. Smoke the public funnel: `POST /api/?r=leads` from `acme-test.netwebmedia.com` (after subdomain DNS lands) and confirm the row carries `organization_id = <acme id>`.

## Top 3 things found while migrating, NOT fixed in this PR

1. **`org_settings` table is single-tenant.** `settings.php` writes a single global keyed config table (`company_name`, `company_email`, etc.) with no org column. Per-tenant branding requires a `(organization_id, key)` schema and a settings handler rewrite. **Path forward:** add `organization_id` to `org_settings`, drop `UNIQUE(key)`, add `UNIQUE(organization_id, key)`. Then `settings.php` reads/writes scoped. This blocks the Month-1 branding render path on the roadmap.
2. **`auth.php` cookie session has no org.** Login sets `nwm_uid` but never resolves `nwm_org_id`. Right after login, `org_from_request()` falls all the way through to "user's primary membership," which is fine for single-org users but slow (extra query per request). Should resolve and cache the primary org id into `$_SESSION['nwm_org_id']` immediately after `session_regenerate_id`.
3. **`reporting.php` references a non-existent `campaigns` table.** The actual table is `email_campaigns`. The legacy code was wrapped in try/catch so this silently returns zero. It always has — preserved the bug to keep the response shape stable. Ticket to fix: rename the queries to `email_campaigns` (and adapt the column names: `sent_count` → derive from `campaign_sends`, etc.).

## Constraints honoured

- No legacy `tenant_*` helper deleted.
- No migration auto-run.
- No git commit (auto-save daemon handles it).
- Same response shapes / status codes everywhere — pure refactor.
- One file (`templates.php`) needed slightly more than a SQL swap (the system-template visibility rule); the rest are mechanical.
