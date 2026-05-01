-- Engine-bridge link table: maps each visual-builder `workflows` row to its
-- mirror row in `resources` (where the runtime engine in api-php/lib/workflows.php
-- reads from). The CRM handler upserts this on every workflows INSERT/UPDATE
-- and clears it on DELETE.
--
-- We chose a separate mapping table over an ALTER TABLE workflows ADD COLUMN
-- resource_id because MySQL's ADD COLUMN IF NOT EXISTS is 8.0.29+ only, and
-- the existing migrate.php splitter cannot handle a SET @x := IF(...)/EXECUTE
-- check pattern reliably (see CLAUDE.md migration rules — that pattern leaves
-- PDO cursors open). Plain DDL on a fresh table is the simplest idempotent path.
--
-- Idempotent: migrate.php swallows 1050 (table exists) / 1061 (dup key).
--
-- The actual JSON-shape backfill (translating workflows.steps_json into the
-- engine resources.data shape) is performed by the PHP endpoint
--   POST /crm-vanilla/api/?r=workflows&action=backfill_engine_mirror
-- because translation logic must match the dual-write path exactly and is
-- tested in PHP, not duplicated in SQL.
--
-- NOTE: Do NOT add a COMMENT clause containing a semicolon — migrate.php's
-- naive splitter would tear the statement in half (see CLAUDE.md migration rules).

CREATE TABLE IF NOT EXISTS `workflows_resource_link` (
  `workflow_id` INT NOT NULL PRIMARY KEY,
  `resource_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_wrl_resource` (`resource_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
