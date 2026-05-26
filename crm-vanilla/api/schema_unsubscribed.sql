-- Add unsubscribed_at column to contacts table
USE `webmed6_crm`;

ALTER TABLE `contacts`
ADD COLUMN `unsubscribed_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'When the contact unsubscribed (NULL if subscribed)',
ADD INDEX `idx_unsubscribed_at` (`unsubscribed_at`);
