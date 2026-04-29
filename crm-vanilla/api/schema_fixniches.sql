-- Fix niche column in email_templates: replace full labels with canonical keys.
-- Safe to re-run (idempotent — already-correct rows are unaffected).
UPDATE email_templates SET niche = 'tourism'           WHERE niche = 'Tourism & Hospitality';
UPDATE email_templates SET niche = 'restaurants'       WHERE niche = 'Restaurants & Gastronomy';
UPDATE email_templates SET niche = 'health'            WHERE niche = 'Health & Medical';
UPDATE email_templates SET niche = 'beauty'            WHERE niche = 'Beauty & Wellness';
UPDATE email_templates SET niche = 'smb'               WHERE niche = 'Small/Medium Business Services';
UPDATE email_templates SET niche = 'law_firms'         WHERE niche = 'Law Firms & Legal Services';
UPDATE email_templates SET niche = 'real_estate'       WHERE niche = 'Real Estate & Property';
UPDATE email_templates SET niche = 'local_specialist'  WHERE niche = 'Local Specialist Services';
UPDATE email_templates SET niche = 'automotive'        WHERE niche = 'Automotive';
UPDATE email_templates SET niche = 'education'         WHERE niche = 'Education';
UPDATE email_templates SET niche = 'events_weddings'   WHERE niche = 'Events & Weddings';
UPDATE email_templates SET niche = 'financial_services' WHERE niche = 'Financial Services';
UPDATE email_templates SET niche = 'home_services'     WHERE niche = 'Home Services';
UPDATE email_templates SET niche = 'wine_agriculture'  WHERE niche = 'Wine & Agriculture';
