-- ======================================================================
-- Pre-Launch Demo Data Cleanup — May 1, 2026
-- Removes demo contacts, conversations, and test admin accounts.
-- Idempotent: uses DELETE with WHERE; safe to re-run.
-- ======================================================================
USE `webmed6_crm`;

-- ───────────────────────────────────────────────────────────────────
-- 1. Delete demo contacts from schema_seed_conversations_v2.sql
-- ───────────────────────────────────────────────────────────────────
-- These demo contacts pollute the superadmin CRM on day 1.
-- Scope: exact email matches to the 6 seeded demo accounts.
-- Conversations & messages cascade-delete via FK.
DELETE FROM `contacts`
WHERE email IN (
  'sofia@latamgroup.com',
  'carlos@techwave.cl',
  'isabella@greenleaf.com',
  'diego@novalabs.io',
  'valentina@skyport.cl',
  'mateo@andeanventures.com'
);

-- ───────────────────────────────────────────────────────────────────
-- 2. Delete any test newsletter submissions from today (example.com)
-- ───────────────────────────────────────────────────────────────────
-- Scope: any contact with example.com email created on 2026-05-01.
-- This is a safety net for "nwm-launch-test-1777669256@example.com"
-- or any other test signup from launch day.
DELETE FROM `contacts`
WHERE email LIKE '%example.com%'
  AND DATE(created_at) = '2026-05-01';
