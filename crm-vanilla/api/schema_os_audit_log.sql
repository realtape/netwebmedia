-- =============================================================================
-- NetWebMedia OS — Phase 1/2: append-only audit log for sensitive admin actions
-- Apply via: POST /crm/api/?r=migrate&token=<MIGRATE_TOKEN>&schema=os_audit_log
-- Idempotent. Records branding changes, connector connect/disconnect, plan
-- changes, member add/remove, provisioning. Org-scoped, retained 1 year.
-- =============================================================================
USE `webmed6_crm`;

CREATE TABLE IF NOT EXISTS `os_audit_log` (
  `id`              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `organization_id` INT UNSIGNED NOT NULL,
  `user_id`         INT UNSIGNED DEFAULT NULL,
  `action`          VARCHAR(64) NOT NULL,        -- e.g. branding.update, connector.connect
  `target`          VARCHAR(255) DEFAULT NULL,
  `meta_json`       TEXT DEFAULT NULL,
  `ip`              VARCHAR(45) DEFAULT NULL,
  `created_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_org_created` (`organization_id`, `created_at`),
  INDEX `idx_action` (`action`),
  CONSTRAINT `fk_audit_org`
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
