-- ======================================================================
-- Pre-Launch Demo Data Cleanup for API-PHP — May 1, 2026
-- Removes demo user accounts seeded by migrate.php
-- Idempotent: uses DELETE with WHERE; safe to re-run.
-- ======================================================================
USE `webmed6_nwm`;

-- ───────────────────────────────────────────────────────────────────
-- Delete demo user accounts from api-php/migrate.php seed
-- ───────────────────────────────────────────────────────────────────
-- These were inserted as default seed users for initial API setup.
-- Should be removed before launch to keep production clean.
DELETE FROM `users`
WHERE email IN ('admin@netwebmedia.com', 'demo@netwebmedia.com');
