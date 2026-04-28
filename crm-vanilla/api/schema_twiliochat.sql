-- Migration: Twilio + Chat support
-- Run via: POST /api/?r=migrate&token=NWM_MIGRATE_2026&schema=twilio_chat

ALTER TABLE `conversations`
  ADD COLUMN IF NOT EXISTS `phone`       VARCHAR(50)  DEFAULT NULL AFTER `subject`,
  ADD COLUMN IF NOT EXISTS `external_id` VARCHAR(100) DEFAULT NULL AFTER `phone`;

-- Widen channel ENUM to include 'chat'
ALTER TABLE `conversations`
  MODIFY COLUMN `channel` ENUM('email','sms','whatsapp','chat') DEFAULT 'email';

-- Index for fast webhook lookups
ALTER TABLE `conversations`
  ADD INDEX IF NOT EXISTS `idx_phone_channel` (`phone`, `channel`);
