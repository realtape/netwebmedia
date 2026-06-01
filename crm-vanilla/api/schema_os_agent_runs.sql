-- NWM OS — agent invocation audit + cost ledger.
-- Every call to the dispatcher writes one row here. Used for per-org budget
-- enforcement (sum input_tokens+output_tokens for current month vs.
-- organizations.agent_token_budget_monthly) and the agent-runs widget.

CREATE TABLE IF NOT EXISTS agent_runs (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  organization_id INT UNSIGNED NOT NULL,
  user_id         INT UNSIGNED NULL,
  agent_slug      VARCHAR(40) NOT NULL,
  skill_slug      VARCHAR(64) NULL,
  trigger_source  ENUM('command_bar','workflow','schedule','api') NOT NULL DEFAULT 'command_bar',
  status          ENUM('queued','running','done','error') NOT NULL DEFAULT 'queued',
  model           VARCHAR(40) NULL,
  input_tokens    INT UNSIGNED NOT NULL DEFAULT 0,
  output_tokens   INT UNSIGNED NOT NULL DEFAULT 0,
  cost_usd_cents  INT UNSIGNED NOT NULL DEFAULT 0,
  input_blob      MEDIUMTEXT NULL,
  output_blob     MEDIUMTEXT NULL,
  error           TEXT NULL,
  started_at      DATETIME NULL,
  finished_at     DATETIME NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_org_created (organization_id, created_at DESC),
  KEY idx_org_agent (organization_id, agent_slug),
  KEY idx_status_started (status, started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
