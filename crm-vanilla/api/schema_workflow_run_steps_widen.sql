-- Widen workflow_run_steps.result so multi-provider mail-failure errors aren't
-- truncated mid-sentence. The 200-char cap was masking the SMTP error during
-- pre-launch diagnosis (SES not configured | Resend 429 | <truncated>).
-- Idempotent: migrate.php tolerates the no-op if the column already wider.

ALTER TABLE `workflow_run_steps` MODIFY COLUMN `result` VARCHAR(500) NOT NULL;
