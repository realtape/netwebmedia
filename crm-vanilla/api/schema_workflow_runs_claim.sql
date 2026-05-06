-- Workflow run concurrency claim token (race-condition fix).
-- Two cron processes firing within milliseconds were able to read the same
-- pending row and execute it twice, producing duplicate sends. We now claim
-- rows atomically by flipping their status to 'running' in one UPDATE and
-- tagging them with a per-cron token so each cron only executes its own.
--
-- Idempotent: migrate.php swallows 1060 (duplicate column).

ALTER TABLE `workflow_runs`
  ADD COLUMN `claim_token` VARCHAR(32) DEFAULT NULL AFTER `error`;

CREATE INDEX `idx_wr_claim` ON `workflow_runs` (`claim_token`);
