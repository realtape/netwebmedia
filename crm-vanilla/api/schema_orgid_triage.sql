-- AI Triage column on conversations
-- Stores the JSON result returned by the Claude triage call (see handlers/ai_triage.php).
-- Idempotent: ADD COLUMN will fail with 1060 on re-runs, which migrate.php swallows.
-- Note: no semicolons inside string literals (migrate.php splits naively on ;).
ALTER TABLE `conversations`
  ADD COLUMN `triage_json` TEXT NULL DEFAULT NULL AFTER `unread`;

ALTER TABLE `conversations`
  ADD COLUMN `triage_at` DATETIME NULL DEFAULT NULL AFTER `triage_json`;
