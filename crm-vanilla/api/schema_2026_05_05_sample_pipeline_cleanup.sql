-- ======================================================================
-- Pipeline Sample Data Cleanup — May 5, 2026
-- Removes sample deals + their associated contacts that pollute the
-- Pipeline view (ConstructX, MediaPro, GlobalFin, TechStart, Acme Corp,
-- RetailHub, FoodChain, EduLearn, HealthNet — all attached to
-- admin@netwebmedia.com in the production CRM).
-- Idempotent: uses DELETE with WHERE; safe to re-run.
-- ======================================================================
USE `webmed6_crm`;

-- ───────────────────────────────────────────────────────────────────
-- 1. Delete sample deals by exact company match
-- ───────────────────────────────────────────────────────────────────
DELETE FROM `deals`
WHERE company IN (
  'ConstructX',
  'MediaPro',
  'GlobalFin',
  'TechStart',
  'Acme Corp',
  'RetailHub',
  'FoodChain',
  'EduLearn',
  'HealthNet'
);

-- ───────────────────────────────────────────────────────────────────
-- 2. Delete the sample contacts attached to those deals
-- ───────────────────────────────────────────────────────────────────
-- Scope: exact name matches. Uses name (not email) because these were
-- seeded with admin@netwebmedia.com placeholder — deleting by email
-- would also remove the legitimate admin account.
DELETE FROM `contacts`
WHERE name IN (
  'David Brown',
  'Lisa Park',
  'Emily Davis',
  'Mike Chen',
  'Sarah Johnson',
  'James Wilson',
  'Chris Taylor',
  'Rachel Kim',
  'Anna Martinez'
)
AND email = 'admin@netwebmedia.com';

-- ───────────────────────────────────────────────────────────────────
-- 3. Also catch any deal title that references the sample companies
-- ───────────────────────────────────────────────────────────────────
-- Defensive: the UI shows "ConstructX - Full Suite" style titles, so
-- the company column may not always be populated cleanly. Match titles
-- containing the canonical sample company names.
DELETE FROM `deals`
WHERE title LIKE 'ConstructX %'
   OR title LIKE 'MediaPro %'
   OR title LIKE 'GlobalFin %'
   OR title LIKE 'TechStart %'
   OR title LIKE 'Acme Corp %'
   OR title LIKE 'RetailHub %'
   OR title LIKE 'FoodChain %'
   OR title LIKE 'EduLearn %'
   OR title LIKE 'HealthNet %';
