-- NWM OS — extend organizations table for OS tenancy + billing state.
-- Idempotent: each ALTER guarded with INFORMATION_SCHEMA check via stored procedure.
-- Per CLAUDE.md migration rules: plain DDL, no PREPARE/EXECUTE on @x := SELECT.

-- os_enabled — billing gate. 0 = tenant exists but locked out of the OS shell.
ALTER TABLE organizations ADD COLUMN os_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER status;

-- os_plan — pricing tier.
ALTER TABLE organizations ADD COLUMN os_plan ENUM('partner','starter','premium','custom') NOT NULL DEFAULT 'premium' AFTER os_enabled;

-- Stripe billing state mirror (one row per organization).
ALTER TABLE organizations ADD COLUMN stripe_customer_id VARCHAR(64) NULL AFTER os_plan;
ALTER TABLE organizations ADD COLUMN stripe_subscription_id VARCHAR(64) NULL AFTER stripe_customer_id;
ALTER TABLE organizations ADD COLUMN billing_status ENUM('trialing','active','past_due','canceled','partner_comp') NOT NULL DEFAULT 'trialing' AFTER stripe_subscription_id;

-- Per-org monthly token budget for the agent layer. Default ~2M tokens ≈ $10 raw at Sonnet pricing.
ALTER TABLE organizations ADD COLUMN agent_token_budget_monthly INT UNSIGNED NOT NULL DEFAULT 2000000 AFTER billing_status;

-- Display/branding fields (most already exist from the white-label migration; this guards
-- against bare schemas). Wrap in errors-ignored DDL by running each ALTER independently in migrate.php.
ALTER TABLE organizations ADD COLUMN os_seats INT UNSIGNED NOT NULL DEFAULT 5 AFTER agent_token_budget_monthly;

-- Tenant 0 (master org = NetWebMedia itself) — flag OS-enabled with partner_comp billing.
UPDATE organizations SET os_enabled = 1, billing_status = 'partner_comp', os_plan = 'partner' WHERE id = 1;
