-- Migration: add notes, next_action, next_followup_date, source to deals table
-- Run via: POST /api/?r=migrate&token=NWM_MIGRATE_2026&schema=deals_v2
ALTER TABLE `deals` ADD COLUMN IF NOT EXISTS `notes` TEXT DEFAULT NULL;
ALTER TABLE `deals` ADD COLUMN IF NOT EXISTS `next_action` VARCHAR(500) DEFAULT NULL;
ALTER TABLE `deals` ADD COLUMN IF NOT EXISTS `next_followup_date` DATE DEFAULT NULL;
ALTER TABLE `deals` ADD COLUMN IF NOT EXISTS `source` VARCHAR(100) DEFAULT NULL;
