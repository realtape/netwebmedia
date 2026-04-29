-- Idempotent: add `niche` column to users table.
-- Portable across MySQL 5.7 (no ADD COLUMN IF NOT EXISTS) and 8.0+.
USE `webmed6_crm`;

SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE()
               AND table_name = 'users'
               AND column_name = 'niche');
SET @sql := IF(@col = 0,
    'ALTER TABLE `users` ADD COLUMN `niche` VARCHAR(100) NULL DEFAULT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
