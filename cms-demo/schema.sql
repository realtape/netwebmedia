-- NetWebMedia CMS DEMO Database Schema + Seed Data
-- Target DB: webmed6_cmsdemo  (isolated from production webmed6_cms)

CREATE DATABASE IF NOT EXISTS `webmed6_cmsdemo` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `webmed6_cmsdemo`;

-- Pages
CREATE TABLE IF NOT EXISTS `pages` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `meta_description` VARCHAR(500) DEFAULT NULL,
  `content` MEDIUMTEXT DEFAULT NULL,
  `template` VARCHAR(100) DEFAULT 'default',
  `status` ENUM('draft','scheduled','published','archived') DEFAULT 'draft',
  `author` VARCHAR(100) DEFAULT NULL,
  `language` VARCHAR(8) DEFAULT 'en',
  `published_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_status` (`status`),
  INDEX `idx_lang` (`language`)
) ENGINE=InnoDB;

-- Blog posts
CREATE TABLE IF NOT EXISTS `posts` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `excerpt` VARCHAR(500) DEFAULT NULL,
  `body` MEDIUMTEXT DEFAULT NULL,
  `author` VARCHAR(100) DEFAULT NULL,
  `category` VARCHAR(100) DEFAULT NULL,
  `tags` VARCHAR(500) DEFAULT NULL,
  `status` ENUM('draft','scheduled','published','archived') DEFAULT 'draft',
  `featured_image` VARCHAR(500) DEFAULT NULL,
  `seo_score` INT UNSIGNED DEFAULT 0,
  `aeo_score` INT UNSIGNED DEFAULT 0,
  `published_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_status` (`status`),
  INDEX `idx_cat` (`category`)
) ENGINE=InnoDB;

-- Forms + submissions
CREATE TABLE IF NOT EXISTS `forms` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `schema_json` TEXT DEFAULT NULL,
  `submissions` INT UNSIGNED DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `form_submissions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `form_id` INT UNSIGNED NOT NULL,
  `data_json` TEXT DEFAULT NULL,
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Media library
CREATE TABLE IF NOT EXISTS `media` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `filename` VARCHAR(255) NOT NULL,
  `path` VARCHAR(500) NOT NULL,
  `mime` VARCHAR(100) DEFAULT NULL,
  `size_bytes` INT UNSIGNED DEFAULT 0,
  `alt_text` VARCHAR(500) DEFAULT NULL,
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Memberships
CREATE TABLE IF NOT EXISTS `members` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `name` VARCHAR(255) DEFAULT NULL,
  `plan` VARCHAR(100) DEFAULT 'free',
  `status` ENUM('active','trial','cancelled') DEFAULT 'active',
  `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- A/B tests
CREATE TABLE IF NOT EXISTS `ab_tests` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `page_url` VARCHAR(500) DEFAULT NULL,
  `variant_a` VARCHAR(255) DEFAULT NULL,
  `variant_b` VARCHAR(255) DEFAULT NULL,
  `visitors_a` INT UNSIGNED DEFAULT 0,
  `visitors_b` INT UNSIGNED DEFAULT 0,
  `cr_a` DECIMAL(5,2) DEFAULT 0.00,
  `cr_b` DECIMAL(5,2) DEFAULT 0.00,
  `status` ENUM('running','winner','completed','paused') DEFAULT 'running',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============ DEMO SEED DATA ============
INSERT INTO `pages` (`slug`,`title`,`meta_description`,`template`,`status`,`author`,`language`,`published_at`) VALUES
  ('home','Home — Demo Site','AI-powered growth for modern brands','landing','published','Demo','en','2026-04-01 10:00:00'),
  ('about','About Us','The demo company story','default','published','Demo','en','2026-04-05 09:30:00'),
  ('pricing','Pricing','3 simple plans, no surprises','landing','published','Demo','en','2026-04-07 14:15:00'),
  ('services-es','Servicios','Marketing con IA para marcas modernas','default','published','Demo','es','2026-04-09 11:00:00'),
  ('case-studies','Case Studies','How 12 brands grew with NWM','default','draft','Demo','en',NULL);

INSERT INTO `posts` (`slug`,`title`,`excerpt`,`author`,`category`,`tags`,`status`,`seo_score`,`aeo_score`,`published_at`) VALUES
  ('aeo-for-beginners','AEO for Beginners','How Answer Engines changed SEO forever','Demo','AEO','aeo,seo,ai','published',92,88,'2026-04-02 10:00:00'),
  ('ai-sdr-playbook','The AI SDR Playbook','6 plays that 3x our outbound','Demo','Sales','sdr,ai,outbound','published',85,82,'2026-04-06 10:00:00'),
  ('content-velocity','Content Velocity 2026','Publishing 3x faster with AI','Demo','Content','content,ai','scheduled',78,80,'2026-04-22 10:00:00'),
  ('measuring-aeo','Measuring AEO Impact','Before/after citation tracking','Demo','AEO','aeo,metrics','draft',0,0,NULL);

INSERT INTO `forms` (`name`,`schema_json`,`submissions`) VALUES
  ('Newsletter','{"fields":[{"name":"email","type":"email","required":true}]}',132),
  ('Contact','{"fields":[{"name":"name","type":"text"},{"name":"email","type":"email"},{"name":"message","type":"textarea"}]}',47),
  ('Demo Request','{"fields":[{"name":"name","type":"text"},{"name":"company","type":"text"},{"name":"email","type":"email"}]}',89);

INSERT INTO `members` (`email`,`name`,`plan`,`status`) VALUES
  ('maria@acmeretail.cl','Maria Torres','pro','active'),
  ('daniel@baristacafe.com','Daniel Reyes','free','trial'),
  ('pablo@techcorp.cl','Pablo Vargas','enterprise','active'),
  ('lucia@saasstartup.io','Lucia Fernandez','pro','active');

INSERT INTO `ab_tests` (`name`,`page_url`,`variant_a`,`variant_b`,`visitors_a`,`visitors_b`,`cr_a`,`cr_b`,`status`) VALUES
  ('Hero CTA copy','/','Get a free audit','Book my 15-min call',1842,1867,3.2,4.8,'winner'),
  ('Pricing table layout','/pricing','3-column','Side-by-side',920,915,2.1,2.4,'running'),
  ('Blog sidebar','/blog','Newsletter','Demo CTA',4230,4180,1.8,2.9,'completed');
