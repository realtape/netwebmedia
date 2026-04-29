-- Payments tables (run once via: POST /api/?r=migrate&token=...&schema=payments)
USE `webmed6_crm`;

CREATE TABLE IF NOT EXISTS `invoices` (
    `id`            INT AUTO_INCREMENT PRIMARY KEY,
    `user_id`       INT UNSIGNED NULL,
    `invoice_num`   VARCHAR(32)  NOT NULL DEFAULT '',
    `contact_id`    INT          NULL,
    `client_name`   VARCHAR(255) NOT NULL DEFAULT '',
    `company`       VARCHAR(255) NOT NULL DEFAULT '',
    `amount`        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `status`        ENUM('draft','pending','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
    `invoice_date`  DATE         NOT NULL DEFAULT (CURDATE()),
    `due_date`      DATE         NULL,
    `notes`         TEXT         NULL,
    `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_status` (`status`),
    KEY `idx_contact` (`contact_id`),
    KEY `idx_user` (`user_id`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `subscriptions` (
    `id`            INT AUTO_INCREMENT PRIMARY KEY,
    `user_id`       INT UNSIGNED NULL,
    `contact_id`    INT          NULL,
    `client_name`   VARCHAR(255) NOT NULL DEFAULT '',
    `plan`          VARCHAR(100) NOT NULL DEFAULT 'Starter',
    `amount`        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `interval_type` ENUM('monthly','annual','one-time') NOT NULL DEFAULT 'monthly',
    `status`        ENUM('active','past_due','cancelled','paused') NOT NULL DEFAULT 'active',
    `next_bill_date` DATE        NULL,
    `created_at`    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY `idx_user` (`user_id`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
