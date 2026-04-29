-- Multi-tenant isolation: add `user_id` column to all CRUD tables.
-- Portable (MySQL 5.7+) — uses information_schema check, not ADD COLUMN IF NOT EXISTS.
-- Run via: POST /api/?r=migrate&token=...&schema=tenancy
USE `webmed6_crm`;

-- Helper: add user_id column to a table only if it doesn't exist.
-- Repeat the pattern below for each table.

-- contacts
SET @c := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'contacts' AND column_name = 'user_id');
SET @s := IF(@c = 0, 'ALTER TABLE `contacts` ADD COLUMN `user_id` INT UNSIGNED NULL, ADD INDEX `idx_user_id` (`user_id`)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- deals
SET @c := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'deals' AND column_name = 'user_id');
SET @s := IF(@c = 0, 'ALTER TABLE `deals` ADD COLUMN `user_id` INT UNSIGNED NULL, ADD INDEX `idx_user_id` (`user_id`)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- events
SET @c := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'events' AND column_name = 'user_id');
SET @s := IF(@c = 0, 'ALTER TABLE `events` ADD COLUMN `user_id` INT UNSIGNED NULL, ADD INDEX `idx_user_id` (`user_id`)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- email_templates
SET @c := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'email_templates' AND column_name = 'user_id');
SET @s := IF(@c = 0, 'ALTER TABLE `email_templates` ADD COLUMN `user_id` INT UNSIGNED NULL, ADD INDEX `idx_user_id` (`user_id`)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- email_campaigns
SET @c := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'email_campaigns' AND column_name = 'user_id');
SET @s := IF(@c = 0, 'ALTER TABLE `email_campaigns` ADD COLUMN `user_id` INT UNSIGNED NULL, ADD INDEX `idx_user_id` (`user_id`)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- conversations
SET @c := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'conversations' AND column_name = 'user_id');
SET @s := IF(@c = 0, 'ALTER TABLE `conversations` ADD COLUMN `user_id` INT UNSIGNED NULL, ADD INDEX `idx_user_id` (`user_id`)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- Backfill existing rows to Carlos (user_id = 1, the superadmin).
-- New rows from this point forward will get the authenticated user's id at INSERT time.
UPDATE `contacts`        SET `user_id` = 1 WHERE `user_id` IS NULL;
UPDATE `deals`           SET `user_id` = 1 WHERE `user_id` IS NULL;
UPDATE `events`          SET `user_id` = 1 WHERE `user_id` IS NULL;
UPDATE `email_templates` SET `user_id` = 1 WHERE `user_id` IS NULL;
UPDATE `email_campaigns` SET `user_id` = 1 WHERE `user_id` IS NULL;
UPDATE `conversations`   SET `user_id` = 1 WHERE `user_id` IS NULL;

-- Note: messages inherit ownership from their conversation_id (no own column).
-- Note: invoices/subscriptions/social_* already have user_id (see schema_payments.sql / schema_social.sql).
