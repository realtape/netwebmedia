-- =============================================================================
-- NetWebMedia OS — Phase 2: per-tenant branding assets (logos / favicons)
-- Apply via: POST /crm/api/?r=migrate&token=<MIGRATE_TOKEN>&schema=os_branding_assets
-- Idempotent. Files are stored on disk under storage/branding/<org>/<sha>.ext
-- (web-blocked) and served via a PHP proxy; this table is the registry.
-- =============================================================================
USE `webmed6_crm`;

CREATE TABLE IF NOT EXISTS `tenant_branding_assets` (
  `id`              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `organization_id` INT UNSIGNED NOT NULL,
  `kind`            ENUM('logo_dark','logo_light','favicon','email_header') NOT NULL,
  `filename`        VARCHAR(255) NOT NULL,
  `mime`            VARCHAR(100) NOT NULL,
  `byte_size`       INT UNSIGNED NOT NULL DEFAULT 0,
  `sha256`          CHAR(64) NOT NULL,
  `created_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_org_kind` (`organization_id`, `kind`),
  INDEX `idx_org` (`organization_id`),
  CONSTRAINT `fk_branding_org`
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
