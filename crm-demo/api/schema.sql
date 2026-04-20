-- NetWebMedia CRM DEMO Database Schema + Seed Data
-- Target DB: webmed6_crmdemo  (isolated from production webmed6_crm)
-- Resettable — nightly cron can TRUNCATE and re-run from the INSERT block.

CREATE DATABASE IF NOT EXISTS `webmed6_crmdemo` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `webmed6_crmdemo`;

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

CREATE TABLE IF NOT EXISTS `pipeline_stages` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `sort_order` INT UNSIGNED DEFAULT 0,
  `color` VARCHAR(7) DEFAULT '#6c5ce7'
) ENGINE=InnoDB;

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

CREATE TABLE IF NOT EXISTS `messages` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `conversation_id` INT UNSIGNED NOT NULL,
  `sender` ENUM('me','them') DEFAULT 'them',
  `body` TEXT NOT NULL,
  `sent_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

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

CREATE TABLE IF NOT EXISTS `leads` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `company` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `source` VARCHAR(100) DEFAULT 'demo_signup',
  `hubspot_id` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `last_login` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `login_count` INT UNSIGNED DEFAULT 0,
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `company` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `role` ENUM('user','admin','superadmin') DEFAULT 'user',
  `plan` ENUM('starter','professional','enterprise') DEFAULT 'starter',
  `status` ENUM('active','suspended','cancelled','pending_payment') DEFAULT 'pending_payment',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `last_login` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB;

-- ============ DEMO SEED DATA ============
INSERT INTO `pipeline_stages` (`id`,`name`,`sort_order`,`color`) VALUES
  (1,'New Lead',1,'#6c5ce7'),(2,'Contacted',2,'#0984e3'),(3,'Qualified',3,'#00cec9'),
  (4,'Proposal Sent',4,'#fdcb6e'),(5,'Negotiation',5,'#e17055'),
  (6,'Closed Won',6,'#00b894'),(7,'Closed Lost',7,'#636e72')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `contacts` (`id`,`name`,`email`,`phone`,`company`,`role`,`status`,`value`,`last_contact`,`notes`) VALUES
  (1,'Maria Torres','maria@acmeretail.cl','+56 9 5555 0101','Acme Retail','Marketing Director','customer',24000,'2026-04-18','Paying client — renews Oct'),
  (2,'Daniel Reyes','daniel@baristacafe.com','+56 9 5555 0102','Barista Café','Owner','prospect',3600,'2026-04-15','Demo scheduled for Monday'),
  (3,'Sofia Lopez','sofia@boutiquelab.com','+56 9 5555 0103','Boutique Lab','Founder','lead',0,'2026-04-12','From Instagram DM'),
  (4,'Pablo Vargas','pablo@techcorp.cl','+56 9 5555 0104','TechCorp Chile','CMO','customer',48000,'2026-04-19','Enterprise — expansion Q3'),
  (5,'Lucia Fernandez','lucia@saasstartup.io','+56 9 5555 0105','SaaS Startup','Head of Growth','prospect',12000,'2026-04-17','Wants AI SDR trial'),
  (6,'Javier Mendez','javier@fitnesscircle.com','+56 9 5555 0106','Fitness Circle','Owner','lead',0,'2026-04-10','Referral from Maria'),
  (7,'Carmen Rojas','carmen@clinicadental.cl','+56 9 5555 0107','Clinica Dental','Practice Manager','customer',9600,'2026-04-16','Happy — asked for reviews mgmt'),
  (8,'Miguel Herrera','miguel@constructora.cl','+56 9 5555 0108','Constructora HR','Marketing Lead','prospect',18000,'2026-04-14','Evaluating vs HubSpot'),
  (9,'Elena Castillo','elena@restaurantgrupo.com','+56 9 5555 0109','Restaurant Grupo','Operations','lead',0,'2026-04-11','Landing page inquiry'),
  (10,'Raul Morales','raul@lawfirm.cl','+56 9 5555 0110','Morales & Asoc.','Managing Partner','customer',36000,'2026-04-19','Compliance-heavy'),
  (11,'Ana Silva','ana@ecommerceshop.cl','+56 9 5555 0111','Shop Online CL','Founder','churned',0,'2026-03-10','Churned — price'),
  (12,'Roberto Diaz','roberto@realestate.cl','+56 9 5555 0112','RealEstate CL','Broker','prospect',7200,'2026-04-13','Wants IG automation');

INSERT INTO `deals` (`id`,`title`,`company`,`value`,`contact_id`,`stage_id`,`probability`,`days_in_stage`) VALUES
  (1,'Acme Retail — Growth Renewal','Acme Retail',24000,1,5,80,4),
  (2,'Barista Café — CMO Starter','Barista Café',3600,2,4,60,2),
  (3,'Boutique Lab — Ads + Site','Boutique Lab',6000,3,2,25,1),
  (4,'TechCorp — Enterprise Expansion','TechCorp Chile',48000,4,6,100,0),
  (5,'SaaS Startup — AI SDR Pilot','SaaS Startup',12000,5,4,70,3),
  (6,'Clinica Dental — Reviews Add-on','Clinica Dental',2400,7,3,50,5),
  (7,'Constructora HR — Assessment','Constructora HR',1500,8,3,40,2),
  (8,'Restaurant Grupo — Website','Restaurant Grupo',4800,9,1,10,1),
  (9,'Morales & Asoc. — CMO Pro','Morales & Asoc.',36000,10,6,100,0),
  (10,'RealEstate CL — Social Ads','RealEstate CL',7200,12,2,30,3);

INSERT INTO `conversations` (`id`,`contact_id`,`channel`,`subject`,`unread`) VALUES
  (1,2,'email','Demo prep — Monday 3pm',1),(2,5,'email','AI SDR trial — next steps',0),
  (3,3,'whatsapp','Quick question about pricing',1),(4,4,'email','Q3 expansion review',0),
  (5,8,'email','Comparing vs HubSpot',1),(6,1,'sms','Invoice reminder',0);

INSERT INTO `messages` (`conversation_id`,`sender`,`body`) VALUES
  (1,'them','Hola, confirmo demo Monday 3pm. ¿Puedes enviar agenda?'),
  (1,'me','Hola Daniel — agenda adjunta. Hablamos entonces.'),
  (2,'me','Pablo, adjunto el plan para el piloto AI SDR.'),
  (2,'them','Recibido. Firmamos esta semana.'),
  (3,'them','¿Cuánto cuesta el paquete CMO Starter?'),
  (4,'me','Confirmado Q3 +20% retainer.'),
  (5,'them','Why NWM over HubSpot for us?'),
  (6,'me','Invoice #2026-042 due Friday.');

INSERT INTO `events` (`title`,`event_date`,`start_hour`,`duration`,`type`,`contact_id`) VALUES
  ('Demo — Barista Café','2026-04-21',15.00,0.50,'call',2),
  ('QBR — TechCorp','2026-04-22',10.00,1.00,'meeting',4),
  ('Onboarding — SaaS Startup','2026-04-23',14.00,1.50,'training',5),
  ('Proposal review — Morales','2026-04-24',11.00,0.75,'meeting',10);

INSERT INTO `users` (`name`,`email`,`password_hash`,`company`,`role`,`plan`,`status`) VALUES
  ('Demo User','demo@netwebmedia.com','$2y$10$abcdefghijklmnopqrstuOYX5yGw.6eTzyDfRKhJbPAlPJhJoqbqK','NetWebMedia Demo','superadmin','enterprise','active')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `status`='active';
