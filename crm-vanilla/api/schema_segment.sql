-- Migration: add segment column to contacts + backfill from notes JSON
-- Run once via: POST /api/?r=migrate&token=NWM_MIGRATE_2026&schema=segment

-- Add segment column (idempotent via IF NOT EXISTS for MySQL 8+ / MariaDB)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS segment VARCHAR(50) DEFAULT NULL;

-- Add index for fast filtering
ALTER TABLE contacts ADD INDEX IF NOT EXISTS idx_segment (segment);

-- Backfill: extract $.segment from the notes JSON field
UPDATE contacts
SET segment = JSON_UNQUOTE(JSON_EXTRACT(notes, '$.segment'))
WHERE notes IS NOT NULL
  AND notes != ''
  AND notes LIKE '%"segment"%'
  AND segment IS NULL;
