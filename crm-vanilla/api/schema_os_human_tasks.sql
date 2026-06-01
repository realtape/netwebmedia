-- =============================================================================
-- NetWebMedia OS — Phase 4: human-in-the-loop tasks (wait_for_human step)
-- Apply via: POST /crm/api/?r=migrate&token=<MIGRATE_TOKEN>&schema=os_human_tasks
-- Idempotent. A workflow's `wait_for_human` step inserts a row here and pauses
-- until it's approved/rejected from the OS shell.
-- =============================================================================
USE `webmed6_crm`;

CREATE TABLE IF NOT EXISTS `human_tasks` (
  `id`              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `organization_id` INT UNSIGNED NOT NULL,
  `workflow_run_id` INT UNSIGNED DEFAULT NULL,
  `title`           VARCHAR(255) NOT NULL,
  `body`            TEXT DEFAULT NULL,
  `payload_json`    MEDIUMTEXT DEFAULT NULL,
  `status`          ENUM('pending','approved','rejected','expired') NOT NULL DEFAULT 'pending',
  `assigned_user_id` INT UNSIGNED DEFAULT NULL,
  `resolved_by`     INT UNSIGNED DEFAULT NULL,
  `created_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `resolved_at`     DATETIME DEFAULT NULL,
  INDEX `idx_org_status` (`organization_id`, `status`),
  INDEX `idx_run` (`workflow_run_id`),
  CONSTRAINT `fk_human_tasks_org`
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
