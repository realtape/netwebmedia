-- Niche-specific pipeline stages
-- Each niche has its own ordered stages with color + probability
CREATE TABLE IF NOT EXISTS niche_pipeline_stages (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  niche       VARCHAR(100) NOT NULL,
  name        VARCHAR(255) NOT NULL,
  sort_order  INT          DEFAULT 0,
  color       VARCHAR(7)   DEFAULT '#6366f1',
  probability INT          DEFAULT 0,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_niche (niche)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Niche-specific custom field definitions
-- Values stored in contacts.notes JSON keyed by field_key
CREATE TABLE IF NOT EXISTS niche_custom_fields (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  niche       VARCHAR(100) NOT NULL,
  field_key   VARCHAR(100) NOT NULL,
  field_label VARCHAR(255) NOT NULL,
  field_type  ENUM('text','number','select','date','boolean','url') DEFAULT 'text',
  required    TINYINT(1)   DEFAULT 0,
  options     JSON         NULL COMMENT 'Array of strings for select fields',
  sort_order  INT          DEFAULT 0,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_niche_field (niche, field_key),
  INDEX idx_niche (niche)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
