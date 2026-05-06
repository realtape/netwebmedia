-- Per-step execution audit trail. One row per step executed by the engine.
-- Lets tenants debug "why did my workflow not send?" without grepping PHP error logs.
-- Idempotent: safe to re-run on every deploy.

CREATE TABLE IF NOT EXISTS `workflow_run_steps` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `run_id`     BIGINT UNSIGNED NOT NULL,
  `step_index` SMALLINT UNSIGNED NOT NULL,
  `step_type`  VARCHAR(50) NOT NULL,
  `result`     VARCHAR(200) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_wrs_run`     (`run_id`),
  INDEX `idx_wrs_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
