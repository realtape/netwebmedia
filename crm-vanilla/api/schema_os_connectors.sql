-- =============================================================================
-- NetWebMedia OS — Phase 3: per-tenant connector OAuth tokens
-- Apply via: POST /crm/api/?r=migrate&token=<MIGRATE_TOKEN>&schema=os_connectors
-- Idempotent (CREATE TABLE IF NOT EXISTS). Tokens are libsodium-AEAD-encrypted
-- at rest by connector_store.php — these columns hold ciphertext, never plaintext.
-- =============================================================================
USE `webmed6_crm`;

CREATE TABLE IF NOT EXISTS `tenant_connectors` (
  `id`                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `organization_id`   INT UNSIGNED NOT NULL,
  `provider`          ENUM('gmail','gcal','slack','hubspot','stripe') NOT NULL,
  `account_label`     VARCHAR(255) DEFAULT NULL,
  `access_token_enc`  BLOB DEFAULT NULL,        -- AEAD ciphertext (nonce-prefixed)
  `refresh_token_enc` BLOB DEFAULT NULL,
  `scopes`            TEXT DEFAULT NULL,
  `expires_at`        DATETIME DEFAULT NULL,
  `status`            ENUM('active','revoked','error') NOT NULL DEFAULT 'active',
  `last_refresh_at`   DATETIME DEFAULT NULL,
  `last_error`        VARCHAR(255) DEFAULT NULL,
  `created_at`        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_org_provider` (`organization_id`, `provider`),
  INDEX `idx_org`    (`organization_id`),
  INDEX `idx_status` (`status`),
  CONSTRAINT `fk_connectors_org`
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
