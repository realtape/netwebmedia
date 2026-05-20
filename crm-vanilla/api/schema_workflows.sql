-- Workflow automation schema (visual sequence builder).
-- Idempotent: migrate.php swallows 1050 (table exists) / 1061 (dup key) / 1060 (dup col).
-- Each row stores the multi-step automation as a single JSON blob in steps_json.
-- The PHP handler validates structure on write; runtime engine reads it and
-- enqueues actions per step.
--
-- NOTE: Do NOT add a COMMENT clause containing a semicolon — migrate.php's
-- naive splitter would tear the statement in half (see CLAUDE.md migration rules).

CREATE TABLE IF NOT EXISTS `workflows` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `organization_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `user_id` INT UNSIGNED DEFAULT NULL,
  `name` VARCHAR(200) NOT NULL,
  `trigger_type` VARCHAR(50) NOT NULL DEFAULT 'manual',
  `trigger_filter` VARCHAR(200) DEFAULT NULL,
  `steps_json` TEXT NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `last_run_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_wf_org` (`organization_id`),
  INDEX `idx_wf_user` (`user_id`),
  INDEX `idx_wf_trigger` (`trigger_type`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
