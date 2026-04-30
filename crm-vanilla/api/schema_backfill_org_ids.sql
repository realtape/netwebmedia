-- Backfill real contacts with organization_id = NULL to organization_id = 1
-- Ensures pre-migration data (real contacts/conversations) is visible in the master org
-- This is safe: ORG_MASTER_ID (1) sees all rows; these records belong there by default

-- Backfill contacts with NULL organization_id to master org (1)
UPDATE contacts SET organization_id = 1 WHERE organization_id IS NULL;

-- Backfill conversations with NULL organization_id to master org (1)
UPDATE conversations SET organization_id = 1 WHERE organization_id IS NULL;

-- Backfill messages with NULL organization_id to master org (1)
UPDATE messages SET organization_id = 1 WHERE organization_id IS NULL;
