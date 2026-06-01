-- =============================================================================
-- NetWebMedia OS — Phase 1 Foundation
-- Extend `organizations` with the OS / billing / agent-budget columns.
--
-- Apply via: POST /crm/api/?r=migrate&token=<MIGRATE_TOKEN>&schema=os_orgs_extend
-- (auto-run on every deploy by deploy-site-root.yml — schema_*.sql glob).
--
-- IDEMPOTENT BY DESIGN. Each ALTER is its own statement so migrate.php can
-- swallow code 1060 (dup column) / 1061 (dup key) independently on re-run.
-- Plain DDL only — no PREPARE/EXECUTE (per CLAUDE.md migration rules).
-- Stays portable across MySQL 5.7 / 8.0 (no compound `ADD COLUMN IF NOT EXISTS`).
-- =============================================================================
USE `webmed6_crm`;

-- ----- OS enablement + plan -------------------------------------------------
-- os_enabled is the hard provisioning gate. A freshly-provisioned org is 0
-- (created but dark) until billing flips it on (Stripe webhook / partner_comp).
ALTER TABLE `organizations` ADD COLUMN `os_enabled` TINYINT(1) NOT NULL DEFAULT 0 AFTER `status`;
ALTER TABLE `organizations` ADD COLUMN `os_plan` ENUM('partner','starter','premium','custom') NOT NULL DEFAULT 'premium' AFTER `os_enabled`;
ALTER TABLE `organizations` ADD COLUMN `os_seats` INT UNSIGNED NOT NULL DEFAULT 5 AFTER `os_plan`;

-- ----- Stripe billing mirror ------------------------------------------------
ALTER TABLE `organizations` ADD COLUMN `stripe_customer_id` VARCHAR(64) DEFAULT NULL AFTER `os_seats`;
ALTER TABLE `organizations` ADD COLUMN `stripe_subscription_id` VARCHAR(64) DEFAULT NULL AFTER `stripe_customer_id`;
ALTER TABLE `organizations` ADD COLUMN `billing_status` ENUM('trialing','active','past_due','canceled','partner_comp') NOT NULL DEFAULT 'trialing' AFTER `stripe_subscription_id`;

-- ----- Agent orchestration guardrail (R2 — cost overrun) --------------------
-- Per-org monthly token soft-cap. agent_dispatcher.php (Phase 4) enforces it;
-- over-budget returns HTTP 402. Default ~2M tokens (~$10 raw at Sonnet pricing).
ALTER TABLE `organizations` ADD COLUMN `agent_token_budget_monthly` INT UNSIGNED NOT NULL DEFAULT 2000000 AFTER `billing_status`;

-- os_agents_enabled: JSON array of agent slugs that are "on" for this tenant.
-- NULL = use the default-on roster (the 6 marketed agents). JSON has no DEFAULT
-- clause on MySQL 5.7, so the column is nullable with no default by design.
ALTER TABLE `organizations` ADD COLUMN `os_agents_enabled` JSON DEFAULT NULL AFTER `agent_token_budget_monthly`;

-- Index the billing status — the provisioning gate and the dunning sweep both
-- filter on it.
ALTER TABLE `organizations` ADD INDEX `idx_billing_status` (`billing_status`);
ALTER TABLE `organizations` ADD INDEX `idx_os_enabled` (`os_enabled`);

-- ----- Seed: NWM (master, id=1) is tenant-0 — always on, comped -------------
-- NetWebMedia dogfoods the OS. The master org is permanently enabled and is
-- billed as partner_comp (it never pays itself). Idempotent UPDATE.
UPDATE `organizations`
   SET `os_enabled` = 1,
       `os_plan` = 'premium',
       `billing_status` = 'partner_comp'
 WHERE `id` = 1;
