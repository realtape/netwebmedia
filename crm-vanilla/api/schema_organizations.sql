-- =============================================================================
-- NetWebMedia CRM — White-Label Multi-Tenancy Foundation
-- File 1 of 2: Core organization tables (run BEFORE schema_organizations_migrate.sql)
-- =============================================================================
--
-- Apply via: POST /api/?r=migrate&token=NWM_MIGRATE_2026&schema=organizations
-- This is the GoHighLevel pattern: master agency (NetWebMedia) owns sub-accounts
-- (client agencies / brands), each with isolated data and brandable surface.
--
-- Idempotent: every CREATE uses IF NOT EXISTS; the seed row uses ON DUPLICATE KEY.
-- Re-running this file is safe.
--
-- =============================================================================
USE `webmed6_crm`;

-- -----------------------------------------------------------------------------
-- organizations — every CRM row will eventually FK to one of these.
-- -----------------------------------------------------------------------------
-- plan semantics:
--   master = NetWebMedia itself (singleton, id=1, parent_org_id NULL)
--   agency = a sub-agency that owns its own client orgs (parent_org_id = 1)
--   client = an end-brand. parent_org_id = the agency that owns it (or 1 if NWM-direct)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `organizations` (
  `id`                       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `slug`                     VARCHAR(64)  NOT NULL,
  `display_name`             VARCHAR(255) NOT NULL,
  `parent_org_id`            INT UNSIGNED DEFAULT NULL,
  `plan`                     ENUM('master','agency','client') NOT NULL DEFAULT 'client',
  `branding_logo_url`        VARCHAR(500) DEFAULT NULL,
  `branding_primary_color`   VARCHAR(7)   DEFAULT '#010F3B',
  `branding_secondary_color` VARCHAR(7)   DEFAULT '#FF671F',
  `subdomain`                VARCHAR(128) DEFAULT NULL,
  `custom_domain`            VARCHAR(255) DEFAULT NULL,
  `sender_email`             VARCHAR(255) DEFAULT NULL,
  `status`                   ENUM('active','suspended','pending','archived') NOT NULL DEFAULT 'active',
  `created_at`               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`               TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_slug`           (`slug`),
  UNIQUE KEY `uk_subdomain`      (`subdomain`),
  UNIQUE KEY `uk_custom_domain`  (`custom_domain`),
  INDEX `idx_parent_org_id` (`parent_org_id`),
  INDEX `idx_status`        (`status`),
  INDEX `idx_plan`          (`plan`),
  CONSTRAINT `fk_org_parent`
    FOREIGN KEY (`parent_org_id`) REFERENCES `organizations`(`id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- org_members — many-to-many between users and organizations, with role.
-- -----------------------------------------------------------------------------
-- A user can belong to multiple orgs (Carlos belongs to master org #1 PLUS may
-- be granted admin on a client org for white-glove support).
-- Roles are PER ORG, not global. Cross-tenant queries require master-org membership.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `org_members` (
  `id`              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `organization_id` INT UNSIGNED NOT NULL,
  `user_id`         INT UNSIGNED NOT NULL,
  `role`            ENUM('owner','admin','member','viewer') NOT NULL DEFAULT 'member',
  `is_primary`      TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'flag the user-default org for header-less requests',
  `created_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_org_user` (`organization_id`, `user_id`),
  INDEX `idx_user`     (`user_id`),
  INDEX `idx_org_role` (`organization_id`, `role`),
  CONSTRAINT `fk_orgmember_org`
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_orgmember_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Seed the master org (NetWebMedia) at id=1. parent_org_id stays NULL.
-- -----------------------------------------------------------------------------
INSERT INTO `organizations`
  (`id`, `slug`, `display_name`, `parent_org_id`, `plan`,
   `branding_primary_color`, `branding_secondary_color`,
   `subdomain`, `sender_email`, `status`)
VALUES
  (1, 'netwebmedia', 'NetWebMedia', NULL, 'master',
   '#010F3B', '#FF671F',
   'app.netwebmedia.com', 'newsletter@netwebmedia.com', 'active')
ON DUPLICATE KEY UPDATE
  `display_name` = VALUES(`display_name`),
  `plan`         = 'master',
  `status`       = 'active';

-- -----------------------------------------------------------------------------
-- Seed Carlos as owner of the master org. user_id=1 from schema.sql seed.
-- ON DUPLICATE keeps re-runs safe.
-- -----------------------------------------------------------------------------
INSERT INTO `org_members` (`organization_id`, `user_id`, `role`, `is_primary`)
SELECT 1, u.id, 'owner', 1 FROM `users` u WHERE u.email = 'carlos@netwebmedia.com'
ON DUPLICATE KEY UPDATE `role` = 'owner', `is_primary` = 1;
