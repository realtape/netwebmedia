-- Multi-tenant isolation: add `user_id` column to all CRUD tables.
-- Plain ALTER TABLE statements; migrate.php ignores "duplicate column" (1060) errors so this is idempotent.
USE `webmed6_crm`;

ALTER TABLE `contacts`        ADD COLUMN `user_id` INT UNSIGNED NULL, ADD INDEX `idx_user_id` (`user_id`);
ALTER TABLE `deals`           ADD COLUMN `user_id` INT UNSIGNED NULL, ADD INDEX `idx_user_id` (`user_id`);
ALTER TABLE `events`          ADD COLUMN `user_id` INT UNSIGNED NULL, ADD INDEX `idx_user_id` (`user_id`);
ALTER TABLE `email_templates` ADD COLUMN `user_id` INT UNSIGNED NULL, ADD INDEX `idx_user_id` (`user_id`);
ALTER TABLE `email_campaigns` ADD COLUMN `user_id` INT UNSIGNED NULL, ADD INDEX `idx_user_id` (`user_id`);
ALTER TABLE `conversations`   ADD COLUMN `user_id` INT UNSIGNED NULL, ADD INDEX `idx_user_id` (`user_id`);

-- Backfill existing rows to Carlos (user_id = 1, the superadmin).
UPDATE `contacts`        SET `user_id` = 1 WHERE `user_id` IS NULL;
UPDATE `deals`           SET `user_id` = 1 WHERE `user_id` IS NULL;
UPDATE `events`          SET `user_id` = 1 WHERE `user_id` IS NULL;
UPDATE `email_templates` SET `user_id` = 1 WHERE `user_id` IS NULL;
UPDATE `email_campaigns` SET `user_id` = 1 WHERE `user_id` IS NULL;
UPDATE `conversations`   SET `user_id` = 1 WHERE `user_id` IS NULL;
