-- One-time cleanup: hard-delete chain-import junk rows where the contact name is
-- identical to the company name AND the row has no usable email AND status='lead'.
-- Pattern came from USA imports of chain stores (7-Eleven, Walmart, Starbucks, etc.)
-- where person contact data was missing and the chain brand name landed in both
-- the `name` and `company` columns with an empty `email`.
--
-- Idempotent: re-runs are no-ops because matching rows no longer exist after the
-- first successful execution.
--
-- FK behaviour on the contacts row delete (verified in schema.sql + schema_email.sql):
--   deals.contact_id           → ON DELETE SET NULL  (deal rows survive)
--   conversations.contact_id   → ON DELETE CASCADE   (none expected for unemailable junk)
--   events.contact_id          → ON DELETE SET NULL
--   email_campaigns.contact_id → ON DELETE SET NULL

USE `webmed6_crm`;

-- Audit log for one-time data-cleanup migrations. Records the pre-delete count
-- so we can see, after the fact, how many rows each cleanup migration pruned.
CREATE TABLE IF NOT EXISTS `cleanup_log` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `migration` VARCHAR(120) NOT NULL,
  `rows_affected` INT UNSIGNED NOT NULL DEFAULT 0,
  `ran_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_migration` (`migration`)
) ENGINE=InnoDB COMMENT='Audit log for one-time data-cleanup migrations';

-- Stamp the predicate count BEFORE the delete so each migration run leaves an
-- audit row reflecting what it removed on that run (first run: real count; subsequent
-- runs: 0).
INSERT INTO `cleanup_log` (`migration`, `rows_affected`)
SELECT 'dedupe_chain_imports', COUNT(*)
FROM `contacts`
WHERE TRIM(LOWER(`name`)) = TRIM(LOWER(COALESCE(`company`, '')))
  AND (`email` IS NULL OR TRIM(`email`) = '' OR `email` NOT LIKE '%@%')
  AND `status` = 'lead';

-- Conservative predicate: name === company (after trim+lowercase) AND no usable
-- email AND status still 'lead' (untouched by any pipeline movement). A row that
-- satisfies all three is junk by construction — no person identified, not
-- contactable, never engaged.
DELETE FROM `contacts`
WHERE TRIM(LOWER(`name`)) = TRIM(LOWER(COALESCE(`company`, '')))
  AND (`email` IS NULL OR TRIM(`email`) = '' OR `email` NOT LIKE '%@%')
  AND `status` = 'lead';
