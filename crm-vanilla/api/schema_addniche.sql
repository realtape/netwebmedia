-- Add niche column to users. Plain ALTER; migrate.php tolerates "duplicate column" (1060).
USE `webmed6_crm`;

ALTER TABLE `users` ADD COLUMN `niche` VARCHAR(100) NULL DEFAULT NULL;
