-- Ensure carlos@netwebmedia.com exists as superadmin owner of the platform.
-- Idempotent: INSERT IGNORE then UPDATE so re-runs are safe.
-- Password: NetWebAdmin2026!  (bcrypt $2b$10$, validated by PHP password_verify)
-- Rotated 2026-05-28 from NWM2026!. Each deploy reaffirms this hash so post-deploy
-- password drift is prevented. Rotate hash here when password changes.

INSERT IGNORE INTO users (email, password_hash, name, role, status)
VALUES ('carlos@netwebmedia.com', '$2b$10$57qRpqcFZVEvoCoPr3JbCO1UOHpUREEY3lMvNauif21c.G5XoCcRm', 'Carlos Martinez', 'superadmin', 'active');

UPDATE users
SET role = 'superadmin',
    status = 'active',
    password_hash = '$2b$10$57qRpqcFZVEvoCoPr3JbCO1UOHpUREEY3lMvNauif21c.G5XoCcRm'
WHERE email = 'carlos@netwebmedia.com';
