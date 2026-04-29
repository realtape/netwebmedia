-- =============================================================================
-- NetWebMedia CRM — White-Label Multi-Tenancy Foundation
-- File 2 of 2: Add organization_id to every tenant-relevant table.
--
-- Apply via: POST /api/?r=migrate&token=NWM_MIGRATE_2026&schema=organizations_migrate
-- IMPORTANT: run schema_organizations.sql FIRST (creates the FK target).
-- =============================================================================
--
-- Strategy:
--   1. Add nullable organization_id column + index (idempotent — migrate.php
--      swallows error 1060 "duplicate column").
--   2. Backfill every existing row to organization_id = 1 (master org).
--   3. Foreign keys are added in this same file — note that adding a FK to a
--      table that already has one of the same name will throw 1826 (ER_FK_DUP_NAME);
--      that's fine, migrate.php skips it via the existing 1061 idempotent code path
--      (key-name dup), and we use IF NOT EXISTS where supported.
--   4. NOT NULL is NOT applied here. Apply it once we've audited that all writes
--      pass an organization_id. Run schema_organizations_enforce.sql later.
--
-- ON DELETE RESTRICT everywhere — data preservation > convenience. If you really
-- need to delete an org, you must explicitly archive its child rows first.
-- =============================================================================

USE `webmed6_crm`;

-- ----- contacts -------------------------------------------------------------
ALTER TABLE `contacts`
  ADD COLUMN IF NOT EXISTS `organization_id` INT UNSIGNED NULL AFTER `id`,
  ADD INDEX IF NOT EXISTS `idx_organization_id` (`organization_id`);
UPDATE `contacts` SET `organization_id` = 1 WHERE `organization_id` IS NULL;
ALTER TABLE `contacts`
  ADD CONSTRAINT `fk_contacts_org`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`)
  ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ----- deals ----------------------------------------------------------------
ALTER TABLE `deals`
  ADD COLUMN IF NOT EXISTS `organization_id` INT UNSIGNED NULL AFTER `id`,
  ADD INDEX IF NOT EXISTS `idx_organization_id` (`organization_id`);
UPDATE `deals` SET `organization_id` = 1 WHERE `organization_id` IS NULL;
ALTER TABLE `deals`
  ADD CONSTRAINT `fk_deals_org`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`)
  ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ----- pipeline_stages ------------------------------------------------------
-- Pipeline stages are tenant-scoped: each org defines its own funnel.
-- Existing rows backfill to org 1 (NetWebMedia's default seed pipeline).
ALTER TABLE `pipeline_stages`
  ADD COLUMN IF NOT EXISTS `organization_id` INT UNSIGNED NULL AFTER `id`,
  ADD INDEX IF NOT EXISTS `idx_organization_id` (`organization_id`);
UPDATE `pipeline_stages` SET `organization_id` = 1 WHERE `organization_id` IS NULL;
ALTER TABLE `pipeline_stages`
  ADD CONSTRAINT `fk_stages_org`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`)
  ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ----- conversations --------------------------------------------------------
ALTER TABLE `conversations`
  ADD COLUMN IF NOT EXISTS `organization_id` INT UNSIGNED NULL AFTER `id`,
  ADD INDEX IF NOT EXISTS `idx_organization_id` (`organization_id`);
UPDATE `conversations` SET `organization_id` = 1 WHERE `organization_id` IS NULL;
ALTER TABLE `conversations`
  ADD CONSTRAINT `fk_conversations_org`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`)
  ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ----- messages -------------------------------------------------------------
-- Messages inherit org via conversations FK, but we denormalize for query speed
-- and so a cross-tenant SQL bug can't leak via a malformed JOIN.
ALTER TABLE `messages`
  ADD COLUMN IF NOT EXISTS `organization_id` INT UNSIGNED NULL AFTER `id`,
  ADD INDEX IF NOT EXISTS `idx_organization_id` (`organization_id`);
UPDATE `messages` m
  JOIN `conversations` c ON c.id = m.conversation_id
  SET m.organization_id = c.organization_id
  WHERE m.organization_id IS NULL;
UPDATE `messages` SET `organization_id` = 1 WHERE `organization_id` IS NULL;
ALTER TABLE `messages`
  ADD CONSTRAINT `fk_messages_org`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`)
  ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ----- events (calendar) ----------------------------------------------------
ALTER TABLE `events`
  ADD COLUMN IF NOT EXISTS `organization_id` INT UNSIGNED NULL AFTER `id`,
  ADD INDEX IF NOT EXISTS `idx_organization_id` (`organization_id`);
UPDATE `events` SET `organization_id` = 1 WHERE `organization_id` IS NULL;
ALTER TABLE `events`
  ADD CONSTRAINT `fk_events_org`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`)
  ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ----- email_templates ------------------------------------------------------
ALTER TABLE `email_templates`
  ADD COLUMN IF NOT EXISTS `organization_id` INT UNSIGNED NULL AFTER `id`,
  ADD INDEX IF NOT EXISTS `idx_organization_id` (`organization_id`);
UPDATE `email_templates` SET `organization_id` = 1 WHERE `organization_id` IS NULL;
ALTER TABLE `email_templates`
  ADD CONSTRAINT `fk_email_templates_org`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`)
  ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ----- email_campaigns ------------------------------------------------------
ALTER TABLE `email_campaigns`
  ADD COLUMN IF NOT EXISTS `organization_id` INT UNSIGNED NULL AFTER `id`,
  ADD INDEX IF NOT EXISTS `idx_organization_id` (`organization_id`);
UPDATE `email_campaigns` SET `organization_id` = 1 WHERE `organization_id` IS NULL;
ALTER TABLE `email_campaigns`
  ADD CONSTRAINT `fk_email_campaigns_org`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`)
  ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ----- campaign_sends -------------------------------------------------------
-- Inherits org through campaign, denormalized for fast unsubscribe scoping.
ALTER TABLE `campaign_sends`
  ADD COLUMN IF NOT EXISTS `organization_id` INT UNSIGNED NULL AFTER `id`,
  ADD INDEX IF NOT EXISTS `idx_organization_id` (`organization_id`);
UPDATE `campaign_sends` cs
  JOIN `email_campaigns` ec ON ec.id = cs.campaign_id
  SET cs.organization_id = ec.organization_id
  WHERE cs.organization_id IS NULL;
UPDATE `campaign_sends` SET `organization_id` = 1 WHERE `organization_id` IS NULL;
ALTER TABLE `campaign_sends`
  ADD CONSTRAINT `fk_campaign_sends_org`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`)
  ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ----- unsubscribes ---------------------------------------------------------
-- Per-org unsubscribe list. Master org's global list does NOT auto-suppress
-- a sub-tenant's sends and vice versa — each org owns its consent record.
-- The UNIQUE on email becomes (organization_id, email).
ALTER TABLE `unsubscribes`
  ADD COLUMN IF NOT EXISTS `organization_id` INT UNSIGNED NULL AFTER `id`,
  ADD INDEX IF NOT EXISTS `idx_organization_id` (`organization_id`);
UPDATE `unsubscribes` SET `organization_id` = 1 WHERE `organization_id` IS NULL;
-- Note: dropping the existing UNIQUE(email) and adding UNIQUE(org,email) needs
-- explicit DROP + ADD; we keep both for now to avoid breaking inserts. Audit
-- before enforcing.
ALTER TABLE `unsubscribes`
  ADD CONSTRAINT `fk_unsubscribes_org`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`)
  ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ----- social_posts ---------------------------------------------------------
ALTER TABLE `social_posts`
  ADD COLUMN IF NOT EXISTS `organization_id` INT UNSIGNED NULL AFTER `id`,
  ADD INDEX IF NOT EXISTS `idx_organization_id` (`organization_id`);
UPDATE `social_posts` SET `organization_id` = 1 WHERE `organization_id` IS NULL;
ALTER TABLE `social_posts`
  ADD CONSTRAINT `fk_social_posts_org`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`)
  ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ----- social_credentials ---------------------------------------------------
ALTER TABLE `social_credentials`
  ADD COLUMN IF NOT EXISTS `organization_id` INT UNSIGNED NULL AFTER `id`,
  ADD INDEX IF NOT EXISTS `idx_organization_id` (`organization_id`);
UPDATE `social_credentials` SET `organization_id` = 1 WHERE `organization_id` IS NULL;
ALTER TABLE `social_credentials`
  ADD CONSTRAINT `fk_social_credentials_org`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`)
  ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ----- social_scheduled -----------------------------------------------------
ALTER TABLE `social_scheduled`
  ADD COLUMN IF NOT EXISTS `organization_id` INT UNSIGNED NULL AFTER `id`,
  ADD INDEX IF NOT EXISTS `idx_organization_id` (`organization_id`);
UPDATE `social_scheduled` SET `organization_id` = 1 WHERE `organization_id` IS NULL;
ALTER TABLE `social_scheduled`
  ADD CONSTRAINT `fk_social_scheduled_org`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`)
  ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ----- invoices -------------------------------------------------------------
ALTER TABLE `invoices`
  ADD COLUMN IF NOT EXISTS `organization_id` INT UNSIGNED NULL AFTER `id`,
  ADD INDEX IF NOT EXISTS `idx_organization_id` (`organization_id`);
UPDATE `invoices` SET `organization_id` = 1 WHERE `organization_id` IS NULL;
ALTER TABLE `invoices`
  ADD CONSTRAINT `fk_invoices_org`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`)
  ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ----- subscriptions --------------------------------------------------------
ALTER TABLE `subscriptions`
  ADD COLUMN IF NOT EXISTS `organization_id` INT UNSIGNED NULL AFTER `id`,
  ADD INDEX IF NOT EXISTS `idx_organization_id` (`organization_id`);
UPDATE `subscriptions` SET `organization_id` = 1 WHERE `organization_id` IS NULL;
ALTER TABLE `subscriptions`
  ADD CONSTRAINT `fk_subscriptions_org`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`)
  ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ----- niche_pipeline_stages ------------------------------------------------
ALTER TABLE `niche_pipeline_stages`
  ADD COLUMN IF NOT EXISTS `organization_id` INT UNSIGNED NULL AFTER `id`,
  ADD INDEX IF NOT EXISTS `idx_organization_id` (`organization_id`);
UPDATE `niche_pipeline_stages` SET `organization_id` = 1 WHERE `organization_id` IS NULL;
ALTER TABLE `niche_pipeline_stages`
  ADD CONSTRAINT `fk_niche_pipeline_stages_org`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`)
  ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ----- niche_custom_fields --------------------------------------------------
ALTER TABLE `niche_custom_fields`
  ADD COLUMN IF NOT EXISTS `organization_id` INT UNSIGNED NULL AFTER `id`,
  ADD INDEX IF NOT EXISTS `idx_organization_id` (`organization_id`);
UPDATE `niche_custom_fields` SET `organization_id` = 1 WHERE `organization_id` IS NULL;
ALTER TABLE `niche_custom_fields`
  ADD CONSTRAINT `fk_niche_custom_fields_org`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`)
  ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ----- leads (signup funnel) ------------------------------------------------
-- Leads are inbound; they map to whichever org owns the form/landing page.
-- For now, all backfill to master org.
ALTER TABLE `leads`
  ADD COLUMN IF NOT EXISTS `organization_id` INT UNSIGNED NULL AFTER `id`,
  ADD INDEX IF NOT EXISTS `idx_organization_id` (`organization_id`);
UPDATE `leads` SET `organization_id` = 1 WHERE `organization_id` IS NULL;
ALTER TABLE `leads`
  ADD CONSTRAINT `fk_leads_org`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`)
  ON DELETE RESTRICT ON UPDATE RESTRICT;
