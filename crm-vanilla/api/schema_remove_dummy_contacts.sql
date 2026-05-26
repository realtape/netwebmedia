-- Remove dummy/sample contacts that were seeded for display purposes only.
-- Idempotent: safe to run on every deploy (DELETE WHERE is a no-op if rows are gone).
-- Real contacts (Chile campaign leads, owner) are NOT in this list.
DELETE FROM contacts WHERE email IN (
    'gerencia@rinconcriollo.cl',
    'admin@clinicadentalmoderna.cl',
    'contacto@costaverdepropiedades.cl',
    'ventas@autopremium.cl',
    'marketing@colegiosanignacio.cl'
);
