-- Seed org_members to ensure admin user can access master org
-- Links user_id=1 (default admin) to organization_id=1 with admin role
-- This ensures authenticated admin users see all master org data via fallback org resolution

INSERT IGNORE INTO org_members (user_id, organization_id, role, is_primary, created_at)
VALUES (1, 1, 'admin', 1, NOW());
