-- Reports storage for centralized tracking
-- Idempotent: uses CREATE TABLE IF NOT EXISTS, handles duplicates via IGNORE

CREATE TABLE IF NOT EXISTS `reports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `report_type` ENUM('finance','sales','data','project','customer-success','marketing','operations','executive') NOT NULL,
  `report_name` VARCHAR(255) NOT NULL,
  `owner` VARCHAR(100) NOT NULL,
  `period_start` DATE NOT NULL,
  `period_end` DATE NOT NULL,
  `status` ENUM('draft','final','archived') DEFAULT 'draft',
  `rag_status` ENUM('green','amber','red') DEFAULT 'green',
  `summary` TEXT,
  `metrics_json` LONGTEXT COMMENT 'JSON blob: {metric_name: value, ...}',
  `findings_json` LONGTEXT COMMENT 'JSON blob: [{title, description, severity}, ...]',
  `recommendations_json` LONGTEXT COMMENT 'JSON blob: [{action, owner, deadline}, ...]',
  `open_questions_json` LONGTEXT COMMENT 'JSON blob: [{question, required_by}, ...]',
  `related_client_id` INT,
  `related_project_id` INT,
  `file_path` VARCHAR(500) COMMENT 'Path in reports/ directory',
  `user_id` INT COMMENT 'Tenancy: agent/owner who created it',
  `generated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `next_review_date` DATE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY `unique_report` (`report_type`, `report_name`, `period_start`, `period_end`),
  KEY `by_owner` (`owner`, `generated_at` DESC),
  KEY `by_type` (`report_type`, `generated_at` DESC),
  KEY `by_status` (`status`),
  KEY `by_rag` (`rag_status`),
  KEY `by_client` (`related_client_id`),
  KEY `by_project` (`related_project_id`),
  KEY `by_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Report versions / archive table (optional, for audit trail)
CREATE TABLE IF NOT EXISTS `report_versions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `report_id` INT NOT NULL,
  `version_number` INT DEFAULT 1,
  `status` ENUM('draft','final','archived'),
  `rag_status` ENUM('green','amber','red'),
  `summary` TEXT,
  `metrics_json` LONGTEXT,
  `findings_json` LONGTEXT,
  `recommendations_json` LONGTEXT,
  `open_questions_json` LONGTEXT,
  `archived_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE CASCADE,
  KEY `by_report` (`report_id`, `version_number` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
