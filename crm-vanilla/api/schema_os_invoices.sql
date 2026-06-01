-- =============================================================================
-- NetWebMedia OS — Phase 5: Stripe invoice mirror for the OS subscription
-- Apply via: POST /crm/api/?r=migrate&token=<MIGRATE_TOKEN>&schema=os_invoices
-- Idempotent. Mirrors Stripe invoices so the billing UI can show history
-- without a live Stripe round-trip on every page load.
-- =============================================================================
USE `webmed6_crm`;

CREATE TABLE IF NOT EXISTS `org_invoices` (
  `id`                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `organization_id`    INT UNSIGNED NOT NULL,
  `stripe_invoice_id`  VARCHAR(64) NOT NULL,
  `amount_cents`       INT UNSIGNED NOT NULL DEFAULT 0,
  `currency`           VARCHAR(8) NOT NULL DEFAULT 'usd',
  `status`             VARCHAR(32) NOT NULL DEFAULT 'open',  -- paid|open|void|uncollectible
  `hosted_invoice_url` VARCHAR(500) DEFAULT NULL,
  `period_start`       DATETIME DEFAULT NULL,
  `period_end`         DATETIME DEFAULT NULL,
  `created_at`         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_stripe_invoice` (`stripe_invoice_id`),
  INDEX `idx_org` (`organization_id`),
  CONSTRAINT `fk_invoices_org_os`
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
