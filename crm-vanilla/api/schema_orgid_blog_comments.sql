-- Multi-tenant: add organization_id to blog_comments.
-- Idempotent — migrate.php swallows 1060 (dup column) / 1061 (dup key).
-- All existing rows get DEFAULT 1 (NWM master org). Future white-label
-- tenants with their own public blog will need a host/subdomain resolver
-- in api-php/routes/comments.php to override the hardcoded 1.

ALTER TABLE `blog_comments`
  ADD COLUMN `organization_id` BIGINT UNSIGNED NOT NULL DEFAULT 1 AFTER `id`;

ALTER TABLE `blog_comments`
  ADD INDEX `idx_blog_comments_org` (`organization_id`);
