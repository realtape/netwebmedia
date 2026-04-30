-- Ensure carlos@netwebmedia.com exists as superadmin owner of the platform.
-- Idempotent: INSERT IGNORE then UPDATE so re-runs are safe.
-- Password: NWM2026!  (bcrypt $2b$10$, validated by PHP password_verify)

INSERT IGNORE INTO users (email, password_hash, name, role, status, org_id)
VALUES ('carlos@netwebmedia.com', '$2b$10$zzTeiFuCJiRDXPGFEZT8peRI9V6TAFGPBgVsflRq2G8rGhxdIwc/u', 'Carlos Martinez', 'superadmin', 'active', 1);

UPDATE users
SET role = 'superadmin',
    status = 'active',
    password_hash = '$2b$10$zzTeiFuCJiRDXPGFEZT8peRI9V6TAFGPBgVsflRq2G8rGhxdIwc/u'
WHERE email = 'carlos@netwebmedia.com';
