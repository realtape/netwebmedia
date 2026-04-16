-- Email marketing schema (run once on top of schema.sql)
USE `webmed6_crm`;

-- Email templates (reusable subject + body with merge tags)
CREATE TABLE IF NOT EXISTS `email_templates` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(500) NOT NULL,
  `body_html` MEDIUMTEXT NOT NULL,
  `body_text` MEDIUMTEXT DEFAULT NULL,
  `from_name` VARCHAR(255) DEFAULT 'NetWebMedia',
  `from_email` VARCHAR(255) DEFAULT 'carlos@netwebmedia.com',
  `niche` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Email campaigns (one-off blast or sequence step)
CREATE TABLE IF NOT EXISTS `email_campaigns` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `template_id` INT UNSIGNED DEFAULT NULL,
  `subject` VARCHAR(500) DEFAULT NULL,
  `body_html` MEDIUMTEXT DEFAULT NULL,
  `from_name` VARCHAR(255) DEFAULT 'NetWebMedia',
  `from_email` VARCHAR(255) DEFAULT 'carlos@netwebmedia.com',
  `audience_filter` TEXT DEFAULT NULL,
  `status` ENUM('draft','scheduled','sending','sent','paused','failed') DEFAULT 'draft',
  `scheduled_at` DATETIME DEFAULT NULL,
  `sent_at` DATETIME DEFAULT NULL,
  `sent_count` INT UNSIGNED DEFAULT 0,
  `opened_count` INT UNSIGNED DEFAULT 0,
  `clicked_count` INT UNSIGNED DEFAULT 0,
  `bounced_count` INT UNSIGNED DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`template_id`) REFERENCES `email_templates`(`id`) ON DELETE SET NULL,
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB;

-- Per-recipient send tracking
CREATE TABLE IF NOT EXISTS `campaign_sends` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `campaign_id` INT UNSIGNED NOT NULL,
  `contact_id` INT UNSIGNED DEFAULT NULL,
  `email` VARCHAR(255) NOT NULL,
  `token` CHAR(32) NOT NULL UNIQUE,
  `provider_id` VARCHAR(128) DEFAULT NULL,
  `status` ENUM('queued','sent','opened','clicked','bounced','complained','failed','unsubscribed') DEFAULT 'queued',
  `sent_at` TIMESTAMP NULL DEFAULT NULL,
  `opened_at` TIMESTAMP NULL DEFAULT NULL,
  `clicked_at` TIMESTAMP NULL DEFAULT NULL,
  `error` TEXT DEFAULT NULL,
  FOREIGN KEY (`campaign_id`) REFERENCES `email_campaigns`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE SET NULL,
  INDEX `idx_email` (`email`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB;

-- Unsubscribe list (honored across ALL campaigns)
CREATE TABLE IF NOT EXISTS `unsubscribes` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `reason` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB;
