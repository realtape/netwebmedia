-- Configure master organization to resolve from netwebmedia.com
-- Ensures org_from_request() matches the host when users access netwebmedia.com/crm-vanilla/
-- This allows authenticated users to resolve org_id=1 and see all master org data

-- Master org must exist and be active
INSERT IGNORE INTO organizations (id, name, slug, subdomain, status)
VALUES (1, 'NetWebMedia', 'netwebmedia', 'netwebmedia.com', 'active');

-- Update master org subdomain to netwebmedia.com so host-based resolution works
UPDATE organizations SET subdomain='netwebmedia.com' WHERE id=1 AND status='active';
