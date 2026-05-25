-- Per-contact niche KPI values.
-- One row per contact + kpi_key + recorded_date (monthly snapshots).
CREATE TABLE IF NOT EXISTS niche_kpi_values (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  contact_id    INT UNSIGNED NOT NULL,
  niche         VARCHAR(100) NOT NULL,
  kpi_key       VARCHAR(100) NOT NULL,
  value_num     DECIMAL(15,4) NULL COMMENT 'Numeric value (%, count, CLP, etc.)',
  value_text    VARCHAR(500)  NULL COMMENT 'Text value when numeric is not applicable',
  recorded_date DATE          NOT NULL,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_contact_kpi_date (contact_id, kpi_key, recorded_date),
  INDEX idx_contact  (contact_id),
  INDEX idx_niche_kpi (niche, kpi_key),
  INDEX idx_date     (recorded_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
