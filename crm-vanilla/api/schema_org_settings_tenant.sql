-- Per-organization scoping for org_settings (white-label isolation).
-- Previously the table was GLOBAL (UNIQUE(`key`)), so any tenant's settings save
-- overwrote every other tenant's. Re-key by (organization_id, `key`); existing
-- rows belong to org 1 (NWM master).
--
-- Idempotent: migrate.php swallows 1060 (dup column), 1061 (dup key), 1091
-- (DROP of an already-absent index). Safe to re-run on every deploy.

-- 1) Add organization_id. Existing rows default to org 1 (NWM master).
ALTER TABLE `org_settings`
  ADD COLUMN `organization_id` BIGINT UNSIGNED NOT NULL DEFAULT 1 AFTER `id`;

-- 2) Add the composite unique used by the INSERT ... ON DUPLICATE KEY UPDATE.
ALTER TABLE `org_settings`
  ADD UNIQUE KEY `uniq_org_key` (`organization_id`, `key`);

-- 3) Drop the legacy single-column unique on `key` (named `key` by the inline
--    UNIQUE) so two organizations can hold the same setting key. On a fresh DB
--    that index never existed -> 1091, swallowed.
ALTER TABLE `org_settings`
  DROP INDEX `key`;
