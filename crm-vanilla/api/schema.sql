-- NetWebMedia CRM Database Schema
CREATE DATABASE IF NOT EXISTS `webmed6_crm` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `webmed6_crm`;

-- Contacts table
CREATE TABLE IF NOT EXISTS `contacts` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `company` VARCHAR(255) DEFAULT NULL,
  `role` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('customer','prospect','lead','churned') DEFAULT 'lead',
  `value` DECIMAL(12,2) DEFAULT 0.00,
  `last_contact` DATE DEFAULT NULL,
  `avatar` VARCHAR(500) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_status` (`status`),
  INDEX `idx_company` (`company`)
) ENGINE=InnoDB;

-- Pipeline stages table
CREATE TABLE IF NOT EXISTS `pipeline_stages` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `sort_order` INT UNSIGNED DEFAULT 0,
  `color` VARCHAR(7) DEFAULT '#6c5ce7'
) ENGINE=InnoDB;

-- Deals table
CREATE TABLE IF NOT EXISTS `deals` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `company` VARCHAR(255) DEFAULT NULL,
  `value` DECIMAL(12,2) DEFAULT 0.00,
  `contact_id` INT UNSIGNED DEFAULT NULL,
  `stage_id` INT UNSIGNED DEFAULT NULL,
  `probability` INT UNSIGNED DEFAULT 0,
  `days_in_stage` INT UNSIGNED DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`stage_id`) REFERENCES `pipeline_stages`(`id`) ON DELETE SET NULL,
  INDEX `idx_stage` (`stage_id`)
) ENGINE=InnoDB;

-- Conversations table
CREATE TABLE IF NOT EXISTS `conversations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `contact_id` INT UNSIGNED DEFAULT NULL,
  `channel` ENUM('email','sms','whatsapp') DEFAULT 'email',
  `subject` VARCHAR(255) DEFAULT NULL,
  `unread` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE CASCADE,
  INDEX `idx_channel` (`channel`)
) ENGINE=InnoDB;

-- Messages table
CREATE TABLE IF NOT EXISTS `messages` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `conversation_id` INT UNSIGNED NOT NULL,
  `sender` ENUM('me','them') DEFAULT 'them',
  `body` TEXT NOT NULL,
  `sent_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Calendar events table
CREATE TABLE IF NOT EXISTS `events` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `event_date` DATE NOT NULL,
  `start_hour` DECIMAL(4,2) NOT NULL,
  `duration` DECIMAL(4,2) DEFAULT 1.00,
  `type` ENUM('meeting','call','training','task') DEFAULT 'meeting',
  `color` VARCHAR(7) DEFAULT '#6c5ce7',
  `contact_id` INT UNSIGNED DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE SET NULL,
  INDEX `idx_date` (`event_date`)
) ENGINE=InnoDB;

-- Seed default pipeline stages
INSERT INTO `pipeline_stages` (`name`, `sort_order`, `color`) VALUES
  ('New Lead', 1, '#6c5ce7'),
  ('Contacted', 2, '#0984e3'),
  ('Qualified', 3, '#00cec9'),
  ('Proposal Sent', 4, '#fdcb6e'),
  ('Negotiation', 5, '#e17055'),
  ('Closed Won', 6, '#00b894'),
  ('Closed Lost', 7, '#636e72');

-- Leads table (demo signups)
CREATE TABLE IF NOT EXISTS `leads` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `source` VARCHAR(100) DEFAULT 'demo_signup',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `last_login` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `login_count` INT UNSIGNED DEFAULT 0,
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB;
