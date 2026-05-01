-- CRM-native workflow run queue (webmed6_crm).
-- Idempotent: safe to re-run on every deploy.

CREATE TABLE IF NOT EXISTS `workflow_runs` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `workflow_id`  BIGINT UNSIGNED NOT NULL,
  `user_id`      BIGINT UNSIGNED DEFAULT NULL,
  `org_id`       BIGINT UNSIGNED DEFAULT NULL,
  `status`       ENUM('pending','running','waiting','completed','failed') NOT NULL DEFAULT 'pending',
  `step_index`   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `context_json` MEDIUMTEXT DEFAULT NULL COMMENT 'JSON: contact_id, email, name, lang, …',
  `next_run_at`  DATETIME DEFAULT NULL COMMENT 'NULL = run immediately; set by wait steps',
  `error`        TEXT DEFAULT NULL,
  `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_wr_status_next` (`status`, `next_run_at`),
  INDEX `idx_wr_workflow`    (`workflow_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
