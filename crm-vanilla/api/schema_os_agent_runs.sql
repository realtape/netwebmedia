-- =============================================================================
-- NetWebMedia OS — Phase 4: agent invocation log (the audit trail for AI staff)
-- Apply via: POST /crm/api/?r=migrate&token=<MIGRATE_TOKEN>&schema=os_agent_runs
-- Idempotent. One row per agent_run. Doubles as the per-org cost ledger that the
-- monthly token budget (organizations.agent_token_budget_monthly) is enforced against.
-- =============================================================================
USE `webmed6_crm`;

CREATE TABLE IF NOT EXISTS `agent_runs` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `organization_id` INT UNSIGNED NOT NULL,
  `user_id`        INT UNSIGNED DEFAULT NULL,
  `agent_slug`     VARCHAR(64)  NOT NULL,
  `skill_slug`     VARCHAR(64)  NOT NULL,
  `model`          VARCHAR(48)  DEFAULT NULL,
  `input_tokens`   INT UNSIGNED NOT NULL DEFAULT 0,
  `output_tokens`  INT UNSIGNED NOT NULL DEFAULT 0,
  `cost_usd_cents` INT UNSIGNED NOT NULL DEFAULT 0,
  `status`         ENUM('queued','running','done','error') NOT NULL DEFAULT 'queued',
  `trigger`        ENUM('command_bar','workflow','schedule','api') NOT NULL DEFAULT 'command_bar',
  `input_blob`     MEDIUMTEXT DEFAULT NULL,
  `output_blob`    MEDIUMTEXT DEFAULT NULL,
  `error`          TEXT DEFAULT NULL,
  `started_at`     DATETIME DEFAULT NULL,
  `finished_at`    DATETIME DEFAULT NULL,
  `created_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_org_created` (`organization_id`, `created_at`),
  INDEX `idx_org_status`  (`organization_id`, `status`),
  INDEX `idx_org_month`   (`organization_id`, `created_at`, `output_tokens`),
  CONSTRAINT `fk_agent_runs_org`
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
