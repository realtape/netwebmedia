-- Courses system schema
-- Stores course metadata, lessons, enrollments, and student progress

-- Courses table
CREATE TABLE IF NOT EXISTS `courses` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `tagline` TEXT DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `icon` VARCHAR(50) DEFAULT NULL,
  `color` VARCHAR(7) DEFAULT '#6c5ce7',
  `level` ENUM('Beginner','Intermediate','Advanced','All levels') DEFAULT 'Intermediate',
  `status` ENUM('draft','published','archived') DEFAULT 'draft',
  `tutorial_url` VARCHAR(500) DEFAULT NULL,
  `order_index` INT UNSIGNED DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_status` (`status`),
  INDEX `idx_slug` (`slug`)
) ENGINE=InnoDB;

-- Lessons table
CREATE TABLE IF NOT EXISTS `lessons` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `course_id` INT UNSIGNED NOT NULL,
  `order_index` INT UNSIGNED DEFAULT 0,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `content` LONGTEXT DEFAULT NULL,
  `duration_minutes` INT UNSIGNED DEFAULT 0,
  `video_url` VARCHAR(500) DEFAULT NULL,
  `type` ENUM('video','text','quiz','assignment') DEFAULT 'video',
  `status` ENUM('draft','published','archived') DEFAULT 'draft',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE,
  INDEX `idx_course` (`course_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB;

-- Course enrollments table
CREATE TABLE IF NOT EXISTS `course_enrollments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `course_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `enrolled_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `completed_at` TIMESTAMP DEFAULT NULL,
  `status` ENUM('active','completed','dropped') DEFAULT 'active',
  `progress_percent` INT UNSIGNED DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_enrollment` (`course_id`, `user_id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB;

-- Lesson completions table
CREATE TABLE IF NOT EXISTS `lesson_completions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `lesson_id` INT UNSIGNED NOT NULL,
  `enrollment_id` INT UNSIGNED NOT NULL,
  `completed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `time_spent_minutes` INT UNSIGNED DEFAULT 0,
  `score` INT UNSIGNED DEFAULT NULL COMMENT 'For quiz lessons: 0-100 score',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`enrollment_id`) REFERENCES `course_enrollments`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_completion` (`lesson_id`, `enrollment_id`),
  INDEX `idx_enrollment` (`enrollment_id`)
) ENGINE=InnoDB;

-- Seed the 15 core NetWebMedia courses
INSERT INTO `courses` (`slug`, `name`, `tagline`, `description`, `icon`, `color`, `level`, `status`, `tutorial_url`, `order_index`) VALUES
  ('nwm-crm', 'NetWeb CRM Masterclass', 'Master every module — Sales, Marketing, Service, CMS, AI Agents, Ops, Partner', 'Comprehensive guide to all CRM modules and features for end-to-end business operations', '📇', '#6c5ce7', 'All levels', 'published', '/tutorials/nwm-crm.html', 1),
  ('nwm-cms', 'NetWeb CMS for Marketers', 'Pages, blog, memberships, LMS, community — ship in hours, not weeks', 'Build and publish content-driven sites without touching code', '🌐', '#00cec9', 'Beginner', 'published', '/tutorials/nwm-cms.html', 2),
  ('ai-automate', 'AI Automations in 2026', 'Build agents, workflows, and triggers that run the company while you sleep', 'Set up autonomous AI systems for marketing, sales, and support', '⚡', '#a29bfe', 'Intermediate', 'published', '/tutorials/ai-automate.html', 3),
  ('ai-chat-agents', 'AI Chat Agents', 'Design, train, and deploy chat agents that actually convert — across SMS, WhatsApp, web', 'Deploy conversational AI across every customer touchpoint', '🤖', '#22d3ee', 'Intermediate', 'published', '/tutorials/ai-chat-agents.html', 4),
  ('ai-seo', 'AI SEO + AEO', 'Rank in Google, ChatGPT, Perplexity, Gemini — the modern answer-engine playbook', 'Master search visibility across traditional and AI-powered search platforms', '🔍', '#00b894', 'All levels', 'published', '/tutorials/ai-seo.html', 5),
  ('email-marketing', 'Lifecycle Email Marketing', 'Behavioral triggers, bilingual nurture flows, and revenue attribution that stands up', 'Build automated email sequences that drive sustainable revenue', '💌', '#e17055', 'Intermediate', 'published', '/tutorials/email-marketing.html', 6),
  ('paid-ads', 'Paid Ads at Creative Scale', '40 ad variants a week on Meta, Google, TikTok — the only way to win in 2026', 'Master multi-channel paid advertising with rapid experimentation', '🎯', '#fd79a8', 'Advanced', 'published', '/tutorials/paid-ads.html', 7),
  ('social-media', 'Social Media That Drives Revenue', 'Organic + paid + UGC + influencer — turn followers into customers, not vanity metrics', 'Build a complete social strategy that converts followers to revenue', '📱', '#fdcb6e', 'All levels', 'published', '/tutorials/social-media.html', 8),
  ('video-factory', 'AI Video Factory', 'Script, shoot, edit, publish — 30+ short-form videos/week with an AI-first pipeline', 'Create high-volume video content with AI production tools', '🎬', '#8b5cf6', 'Intermediate', 'published', '/tutorials/video-factory.html', 9),
  ('websites', 'High-Conversion Websites', 'From Shopify to headless — engineer sites that compound revenue month over month', 'Build and optimize websites that maximize conversion rates', '🖥️', '#0984e3', 'All levels', 'published', '/tutorials/websites.html', 10),
  ('fractional-cmo', 'Fractional CMO Playbook', 'Strategy, forecasting, and operator rhythms for growth-stage founders', 'Think like a CMO: strategy, planning, and execution frameworks', '🧠', '#d63031', 'Advanced', 'published', '/tutorials/fractional-cmo.html', 11),
  ('analyzer', 'Growth Analyzer Deep-Dive', 'Run the 8-dimension diagnostic, read the signal, build the 90-day plan', 'Master the growth diagnostic and strategic planning process', '📊', '#74b9ff', 'Beginner', 'published', '/tutorials/analyzer.html', 12),
  ('whatsapp-automation', 'WhatsApp Business Automation Mastery', '100% automated WhatsApp — templates, flows, broadcasts, CRM sync, zero manual replies', 'Set up fully automated WhatsApp messaging at scale', '💬', '#25d366', 'Intermediate', 'published', '/tutorials/whatsapp-automation.html', 13),
  ('chatbot-automation', 'AI Chatbot Automation — Full Deployment', 'Design, build, and deploy chatbots that qualify leads and close deals across every platform', 'Deploy intelligent chatbots across all customer channels', '🤖', '#22d3ee', 'Intermediate', 'published', '/tutorials/chatbot-automation.html', 14),
  ('sms-automation', 'SMS & Multi-Platform Messaging Automation', 'Compliance, keyword triggers, drip sequences, two-way automation across SMS, IG, FB, and more', 'Master multi-channel messaging automation with compliance', '📲', '#a29bfe', 'Intermediate', 'published', '/tutorials/sms-automation.html', 15);

-- Seed sample lessons for the first course (NetWeb CRM Masterclass)
INSERT INTO `lessons` (`course_id`, `order_index`, `title`, `description`, `duration_minutes`, `type`, `status`)
SELECT id, 1, 'Module 1: Dashboard Fundamentals', 'Learn to navigate the CRM dashboard and understand key metrics', 25, 'video', 'published' FROM courses WHERE slug = 'nwm-crm'
UNION ALL
SELECT id, 2, 'Module 2: Contact Management Mastery', 'Deep dive into creating, organizing, and segmenting your contact database', 30, 'video', 'published' FROM courses WHERE slug = 'nwm-crm'
UNION ALL
SELECT id, 3, 'Module 3: Sales Pipeline Setup', 'Configure your sales pipeline, stages, and deal tracking', 20, 'video', 'published' FROM courses WHERE slug = 'nwm-crm'
UNION ALL
SELECT id, 4, 'Module 4: Marketing Automation', 'Automate email sequences, campaigns, and drip workflows', 35, 'video', 'published' FROM courses WHERE slug = 'nwm-crm'
UNION ALL
SELECT id, 5, 'Module 5: Service & Support', 'Set up ticket management and customer support workflows', 25, 'video', 'published' FROM courses WHERE slug = 'nwm-crm'
UNION ALL
SELECT id, 6, 'Module 6: AI Agent Configuration', 'Train and deploy AI agents for customer interactions', 30, 'video', 'published' FROM courses WHERE slug = 'nwm-crm'
UNION ALL
SELECT id, 7, 'Module 7: Reporting & Analytics', 'Build custom reports and dashboards for decision-making', 20, 'video', 'published' FROM courses WHERE slug = 'nwm-crm'
UNION ALL
SELECT id, 8, 'Module 8: Team Management & Permissions', 'Configure roles, permissions, and team collaboration', 15, 'video', 'published' FROM courses WHERE slug = 'nwm-crm'
UNION ALL
SELECT id, 9, 'Module 9: Integration Ecosystem', 'Connect your CRM with external tools and services', 25, 'video', 'published' FROM courses WHERE slug = 'nwm-crm'
UNION ALL
SELECT id, 10, 'Module 10: Advanced Workflows', 'Build complex automation workflows and triggers', 40, 'video', 'published' FROM courses WHERE slug = 'nwm-crm';
