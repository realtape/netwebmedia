-- =============================================================================
-- Org-security patch — 2026-04-29
-- Companion to plans/audits/tenancy-patches-2026-04-29.md
-- =============================================================================
--
-- Schema deltas that pair with the cross-tenant write patches in
-- crm-vanilla/api/handlers/. The PHP code already works without these (it
-- uses MAX(invoice_num)+1 over the existing varchar column), but the index
-- below makes per-org invoice numbering cheap as volume grows.
--
-- Apply via:
--   POST /api/?r=migrate&token=NWM_MIGRATE_2026&schema=org_security_patch
--
-- Idempotent. The migrate runner splits on `;` and skips ER_DUP_KEYNAME
-- (1061) — re-runs are safe.
-- =============================================================================

USE `webmed6_crm`;

-- Per-org invoice numbering (audit H4): composite index makes
-- "MAX(SUBSTRING_INDEX(invoice_num,'-',-1)) WHERE organization_id = ?" a fast
-- index-range scan instead of a full table scan.
ALTER TABLE `invoices`
    ADD KEY `idx_org_invoice_num` (`organization_id`, `invoice_num`);

-- (Optional, NOT applied here — left for a later migration once
-- ON-DELETE / cascade behaviour is reviewed.)
--   ALTER TABLE messages
--     ADD CONSTRAINT fk_messages_conv_org
--     FOREIGN KEY (organization_id) REFERENCES organizations(id);
--
-- A FK is the database-level guarantee that messages.organization_id can never
-- be set to a value that isn't a real org. The PHP patch in messages.php now
-- derives organization_id from the parent conversation row (audit H3), so the
-- FK is belt-and-braces.
