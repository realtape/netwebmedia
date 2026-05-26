-- Add plan-gating and type classification to email_templates.
-- requires_plan NULL  = visible to all (demo + paid).
-- requires_plan set   = visible only to accounts on that plan or higher.
-- template_type       = 'nwm_outbound' (NWM sales to prospects) | 'client_transactional' | 'client_marketing'
ALTER TABLE email_templates
  ADD COLUMN IF NOT EXISTS requires_plan  ENUM('starter','professional','enterprise') NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS template_type  VARCHAR(50) NOT NULL DEFAULT 'nwm_outbound';

-- Back-fill existing templates as NWM outbound (visible to all)
UPDATE email_templates
SET template_type = 'nwm_outbound', requires_plan = NULL
WHERE template_type = 'nwm_outbound' OR template_type IS NULL OR template_type = '';
