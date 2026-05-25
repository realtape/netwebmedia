-- Add tags column to contacts for workflow engine tag steps.
-- Idempotent: error 1060 (dup column) is swallowed by migrate.php.

ALTER TABLE `contacts` ADD COLUMN `tags` TEXT DEFAULT NULL COMMENT 'Comma-separated tag list managed by workflow engine';
ALTER TABLE `contacts` ADD COLUMN `segment` VARCHAR(100) DEFAULT NULL COMMENT 'Segment / niche identifier (e.g. usa_ca, law_firms)';
ALTER TABLE `contacts` ADD COLUMN `organization_id` BIGINT UNSIGNED DEFAULT NULL COMMENT 'Multi-tenant org ID';
ALTER TABLE `contacts` ADD COLUMN `user_id` INT UNSIGNED DEFAULT NULL COMMENT 'Owning CRM user';
