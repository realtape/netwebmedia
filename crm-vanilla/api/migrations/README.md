# CRM Migrations — Multi-Tenancy / Organizations

Two SQL files were added to lay the white-label foundation. **They MUST run in this order:**

1. `crm-vanilla/api/schema_organizations.sql` — creates `organizations` and `org_members`, seeds the master org (id=1, slug=`netwebmedia`) and adds Carlos as owner.
2. `crm-vanilla/api/schema_organizations_migrate.sql` — adds `organization_id` FK column to every tenant-relevant table, backfills existing rows to org 1, then attaches FK constraints.

Both files are idempotent (re-running them is safe) thanks to `IF NOT EXISTS` and `ON DUPLICATE KEY` plus the `migrate.php` swallowing of error codes 1060/1061/1050/1062.

---

## How to apply (production cPanel / InMotion)

The migrations are NOT auto-applied on deploy. Carlos triggers them by hand.

### Pre-flight

```bash
# Always take a logical backup first.
# Use cPanel → phpMyAdmin → Export → Quick → SQL → Save.
# Filename convention: webmed6_crm_pre_org_migration_YYYYMMDD_HHMM.sql
```

Verify the FTP deploy of the two new SQL files completed:

```bash
curl -fsS "https://netwebmedia.com/crm-vanilla/api/schema_organizations.sql" | head -5
curl -fsS "https://netwebmedia.com/crm-vanilla/api/schema_organizations_migrate.sql" | head -5
```

Both should return SQL, not 404.

### Step 1 — create `organizations` + `org_members`

```bash
curl -X POST \
  "https://netwebmedia.com/crm-vanilla/api/?r=migrate&token=NWM_MIGRATE_2026&schema=organizations" \
  -H "Origin: https://netwebmedia.com"
```

Expected response: `{"schema":"organizations","ran":N,"skipped":0,"errors":[]}`

**Verify** in phpMyAdmin:
- `SELECT * FROM organizations;` returns at least one row, slug=`netwebmedia`, plan=`master`.
- `SELECT * FROM org_members WHERE user_id = 1;` shows Carlos as owner of org 1.

### Step 2 — add `organization_id` columns + backfill

```bash
curl -X POST \
  "https://netwebmedia.com/crm-vanilla/api/?r=migrate&token=NWM_MIGRATE_2026&schema=organizations_migrate" \
  -H "Origin: https://netwebmedia.com"
```

Expected: `ran` > 0, possibly `skipped` > 0 (FKs already attached on a re-run is fine), `errors` empty.

**Verify**:

```sql
SELECT 'contacts'           AS t, COUNT(*) AS rows_total, SUM(organization_id IS NULL) AS missing FROM contacts
UNION ALL SELECT 'deals',           COUNT(*), SUM(organization_id IS NULL) FROM deals
UNION ALL SELECT 'pipeline_stages', COUNT(*), SUM(organization_id IS NULL) FROM pipeline_stages
UNION ALL SELECT 'conversations',   COUNT(*), SUM(organization_id IS NULL) FROM conversations
UNION ALL SELECT 'messages',        COUNT(*), SUM(organization_id IS NULL) FROM messages
UNION ALL SELECT 'events',          COUNT(*), SUM(organization_id IS NULL) FROM events
UNION ALL SELECT 'email_templates', COUNT(*), SUM(organization_id IS NULL) FROM email_templates
UNION ALL SELECT 'email_campaigns', COUNT(*), SUM(organization_id IS NULL) FROM email_campaigns
UNION ALL SELECT 'campaign_sends',  COUNT(*), SUM(organization_id IS NULL) FROM campaign_sends
UNION ALL SELECT 'unsubscribes',    COUNT(*), SUM(organization_id IS NULL) FROM unsubscribes
UNION ALL SELECT 'social_posts',    COUNT(*), SUM(organization_id IS NULL) FROM social_posts
UNION ALL SELECT 'invoices',        COUNT(*), SUM(organization_id IS NULL) FROM invoices
UNION ALL SELECT 'subscriptions',   COUNT(*), SUM(organization_id IS NULL) FROM subscriptions
UNION ALL SELECT 'leads',           COUNT(*), SUM(organization_id IS NULL) FROM leads;
```

`missing` MUST be 0 for every row. If anything is non-zero, do NOT proceed to enforce NOT NULL — investigate first.

### Step 3 — smoke test the API

```bash
# After logging into the CRM (so the session cookie is set), this must list at
# least the master org with you as owner:
curl -b cookies.txt "https://netwebmedia.com/crm-vanilla/api/?r=organizations"
```

---

## Rollback

The migration is additive. To roll back:

### Roll back step 2 (drop `organization_id` columns)

This loses no data — the rows still have their `user_id`, original PKs, and content. Only the org column goes away.

```sql
USE webmed6_crm;

-- Drop FK constraints first (constraint names from schema_organizations_migrate.sql).
ALTER TABLE contacts             DROP FOREIGN KEY fk_contacts_org,             DROP COLUMN organization_id;
ALTER TABLE deals                DROP FOREIGN KEY fk_deals_org,                DROP COLUMN organization_id;
ALTER TABLE pipeline_stages      DROP FOREIGN KEY fk_stages_org,               DROP COLUMN organization_id;
ALTER TABLE conversations        DROP FOREIGN KEY fk_conversations_org,        DROP COLUMN organization_id;
ALTER TABLE messages             DROP FOREIGN KEY fk_messages_org,             DROP COLUMN organization_id;
ALTER TABLE events               DROP FOREIGN KEY fk_events_org,               DROP COLUMN organization_id;
ALTER TABLE email_templates      DROP FOREIGN KEY fk_email_templates_org,      DROP COLUMN organization_id;
ALTER TABLE email_campaigns      DROP FOREIGN KEY fk_email_campaigns_org,      DROP COLUMN organization_id;
ALTER TABLE campaign_sends       DROP FOREIGN KEY fk_campaign_sends_org,       DROP COLUMN organization_id;
ALTER TABLE unsubscribes         DROP FOREIGN KEY fk_unsubscribes_org,         DROP COLUMN organization_id;
ALTER TABLE social_posts         DROP FOREIGN KEY fk_social_posts_org,         DROP COLUMN organization_id;
ALTER TABLE social_credentials   DROP FOREIGN KEY fk_social_credentials_org,   DROP COLUMN organization_id;
ALTER TABLE social_scheduled     DROP FOREIGN KEY fk_social_scheduled_org,     DROP COLUMN organization_id;
ALTER TABLE invoices             DROP FOREIGN KEY fk_invoices_org,             DROP COLUMN organization_id;
ALTER TABLE subscriptions        DROP FOREIGN KEY fk_subscriptions_org,        DROP COLUMN organization_id;
ALTER TABLE niche_pipeline_stages DROP FOREIGN KEY fk_niche_pipeline_stages_org, DROP COLUMN organization_id;
ALTER TABLE niche_custom_fields  DROP FOREIGN KEY fk_niche_custom_fields_org,  DROP COLUMN organization_id;
ALTER TABLE leads                DROP FOREIGN KEY fk_leads_org,                DROP COLUMN organization_id;
```

### Roll back step 1 (drop `organizations` + `org_members`)

```sql
DROP TABLE IF EXISTS org_members;
DROP TABLE IF EXISTS organizations;
```

If any FK on a CRM table is still pointing at `organizations`, MySQL will refuse the drop. Run the step-2 rollback first.

### Worst case — restore from the pre-migration phpMyAdmin export.

---

## Future migrations

Once every handler reads/writes via `org_where()` from `lib/tenancy.php`, add a `schema_organizations_enforce.sql` to flip the FK columns to `NOT NULL`. Don't do this until the audit is clean.
