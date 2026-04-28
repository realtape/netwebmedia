-- Migration: add notes, next_action, next_followup_date, source to deals table
-- Run via: POST /api/?r=migrate&token=NWM_MIGRATE_2026&schema=deals_v2
ALTER TABLE `deals` ADD COLUMN IF NOT EXISTS `notes` TEXT DEFAULT NULL;
ALTER TABLE `deals` ADD COLUMN IF NOT EXISTS `next_action` VARCHAR(500) DEFAULT NULL;
ALTER TABLE `deals` ADD COLUMN IF NOT EXISTS `next_followup_date` DATE DEFAULT NULL;
ALTER TABLE `deals` ADD COLUMN IF NOT EXISTS `source` VARCHAR(100) DEFAULT NULL;

-- Backfill: Chile cold-email campaign deals have "Tier" in the title
UPDATE `deals` SET `source` = 'cold_email_chile'
WHERE `source` IS NULL
AND (`title` LIKE '%Tier 1 outreach%'
  OR `title` LIKE '%Tier 2 nurture%'
  OR `title` LIKE '%Tier 2/3%'
  OR `title` LIKE '%Tier 3%'
  OR `title` LIKE '%outreach%'
  OR `title` LIKE '%nurture%');
