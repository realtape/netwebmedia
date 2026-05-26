# Multi-Tenancy Foundation — `crm-vanilla/`

**Date:** 2026-04-29
**Owner:** Engineering Lead
**Status:** Schema + helpers + REST endpoint shipped. Migrations NOT yet applied to prod.

## What shipped

| Path | Purpose |
|---|---|
| `crm-vanilla/api/schema_organizations.sql` | Creates `organizations` + `org_members`. Seeds master org (id=1) and Carlos as owner. |
| `crm-vanilla/api/schema_organizations_migrate.sql` | Adds `organization_id` to 18 tenant tables, backfills to org 1, attaches FKs. |
| `crm-vanilla/api/lib/tenancy.php` | Extended (additive) with org-scoped helpers: `org_from_request`, `current_org_id`, `is_master_org`, `require_org_access`, `org_where`, `org_owns`, `set_session_org`. Existing `tenant_*` helpers kept intact so the 30+ existing handlers don't break. |
| `crm-vanilla/api/handlers/organizations.php` | Full REST surface (list / create / get / update / suspend / member CRUD / org-switch). Wired into `index.php` router. |
| `crm-vanilla/api/migrations/README.md` | Apply order, smoke-test SQL, rollback plan. |

## Data-model decisions, with reasoning

1. **Hierarchy via `parent_org_id` self-FK, not a separate `agencies` table.** Agencies and clients share the same shape (branding, members, billing target). One table, one query, no UNION-of-everything reports. NetWebMedia is `parent_org_id IS NULL, plan='master'`. Sub-agencies point at the master; clients point at their agency (or the master if NWM-direct). Matches how GoHighLevel internally models it.

2. **`organization_id` denormalized onto `messages` and `campaign_sends`**, not just inherited via the parent FK. A buggy JOIN cannot leak rows across tenants if every table carries its own org column. The cost is one extra column and one backfill UPDATE — cheap insurance against a category of bug we don't want.

3. **`ON DELETE RESTRICT` everywhere.** Data preservation > convenience. Suspending an org is a soft state change (`status='suspended'`); hard delete is intentionally not implemented in the API.

4. **Master-org elevation is built into `org_role()`.** A master-org owner gets virtual `admin` rights on every sub-account for white-glove support. Avoids a per-org "is_support" flag and matches Carlos's actual ops needs.

5. **`org_members` is many-to-many**, not a single `users.organization_id`. Carlos is owner of master plus admin on a struggling client during onboarding — that needs a proper join table.

6. **Resolution order (header → session → subdomain → custom domain → primary membership)** lets us pivot rendering modes without breaking auth. The Chrome extension / API clients pass `X-Org-Slug`; the dashboard uses session; an end client lands on `acme.netwebmedia.com` and the subdomain wins.

7. **`org_where()` fails closed** — no resolvable org returns `WHERE 1=0`, never an empty WHERE that would dump everything. The hard rule is documented in a wide block-comment at the top of `tenancy.php` so it can't be missed.

8. **Migration is two-phase, not three.** Add+backfill+FK in one file. NOT NULL is deferred to a future `schema_organizations_enforce.sql` after we've audited every handler — running that today would break any handler that still INSERTs without an org.

## Migration order

1. Backup DB via cPanel phpMyAdmin export.
2. `POST /api/?r=migrate&token=…&schema=organizations`
3. `POST /api/?r=migrate&token=…&schema=organizations_migrate`
4. Run the verification SELECT in `migrations/README.md` — all `missing` columns must be 0.

Both files are idempotent; safe to re-run.

## Verification (after migration)

```bash
# Login first, then:
curl -b cookies.txt "https://netwebmedia.com/crm-vanilla/api/?r=organizations"
# → must return at least the netwebmedia master org with my_role=owner

# Create a test sub-account:
curl -b cookies.txt -H "Content-Type: application/json" \
  -X POST "https://netwebmedia.com/crm-vanilla/api/?r=organizations" \
  -d '{"slug":"acme-test","display_name":"ACME Test","plan":"client"}'

# Switch into it:
curl -b cookies.txt -H "Content-Type: application/json" \
  -X POST "https://netwebmedia.com/crm-vanilla/api/?r=organizations&sub=switch" \
  -d '{"organization_id":<new id>}'

# Now list contacts — should be empty (no contacts in that org yet),
# proving the org filter is doing its job:
curl -b cookies.txt "https://netwebmedia.com/crm-vanilla/api/?r=contacts"
```

The third call returning the master-org contact list would be a critical bug — it means handlers haven't been upgraded yet. See "still to build" #1.

## Top 3 things still to build before first white-label customer

1. **Migrate every handler to `org_where()`.** Existing handlers (contacts, deals, conversations, etc.) still scope by `tenant_where()` (user_id), which is a per-user filter, not a per-org filter. A sub-account user logging in today would see master-org data because the user_id check passes for legacy NULLs. The fix is mechanical but ~30 files. **This is the gating blocker.**
2. **Org-switcher UI in `crm-vanilla/admin.html`** + a new `subaccounts.html` page for master-org owners to list / create / suspend sub-accounts. Backend is done; frontend needs ~half a day.
3. **Per-tenant branding render path.** `js/app.js` needs to fetch the active org's `branding_*` fields on boot, inject CSS variables (`--brand-primary`, `--brand-secondary`), swap the logo. Without this, sub-accounts see NetWebMedia's navy-and-orange — which defeats the whole white-label pitch.

## 6-month roadmap to "credible white-label CRM AI agency"

- **Month 1 — handler migration + branding render.** Items 1-3 above. Define a per-org primary pipeline. Ship to one friendly client.
- **Month 2 — subdomain SSL + custom-domain automation.** cPanel's AutoSSL handles `*.netwebmedia.com`, but each `acme.netwebmedia.com` needs a DNS A-record per onboard. Either provision via cPanel API on org create, or front everything with Cloudflare and let CF handle wildcard SSL. Custom domains (`crm.acme.com`) need CNAME verification + Let's Encrypt issuance — pick a static-IP InMotion plan or proxy through Cloudflare.
- **Month 3 — Stripe Connect for per-tenant billing.** Each sub-agency gets its own connected account; NetWebMedia takes a platform fee on every charge. Replaces the current single-merchant `subscriptions` table with `stripe_account_id` per org.
- **Month 4 — white-label email-from-domain DNS.** Each org provides a sender domain (`mg.acme.com`); we verify SPF / DKIM / DMARC and store status on the org. Without this, every sub-account's outbound email comes from `newsletter@netwebmedia.com` and trips spam filters. Likely on Postmark or AWS SES with per-tenant message streams.
- **Month 5 — per-tenant Claude integration.** Bring-your-own Anthropic key per org (encrypted at rest), or charge a markup on metered usage against NetWebMedia's master key. Audit log per call. Tie cost directly to plan tier.
- **Month 6 — usage metering + billing automation.** Contact count, AI tokens, email sends per org → daily aggregation → Stripe usage records. Plus self-service plan upgrades and a tenant audit log. Sales can now sell the platform without engineering being in the loop for every onboard.

## Risks

- **Cross-tenant leak window.** Until step 1 of the roadmap lands, the org column exists but isn't enforced. Anyone given login on a fake sub-account could still query the master org via legacy handlers. Mitigation: do not provision real sub-accounts until handlers are migrated.
- **FK-name collisions on re-run.** The migration script uses named constraints. MySQL doesn't support `IF NOT EXISTS` on `ADD CONSTRAINT` until 8.0.29+; older MariaDB will throw 1826 on re-run. `migrate.php` swallows 1061 (dup-key-name) — confirm InMotion's MariaDB version maps duplicate-FK to that code, otherwise add 1826 to the idempotent list.
- **`unsubscribes.email` UNIQUE.** Currently a global UNIQUE; per-org it should be `(organization_id, email)`. Migration left both keys in place; flip-the-key cleanup is queued for the enforce step.
