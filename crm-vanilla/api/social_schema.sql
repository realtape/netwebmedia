-- Social Media Integration Schema
-- Run after schema.sql

CREATE TABLE IF NOT EXISTS `social_credentials` (
  `id`              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id`         INT UNSIGNED NOT NULL DEFAULT 0,
  `provider`        ENUM('facebook','instagram','linkedin','youtube','tiktok') NOT NULL,
  `credentials_enc` TEXT NOT NULL,
  `connected_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `last_sync_at`    TIMESTAMP NULL DEFAULT NULL,
  `post_count`      INT UNSIGNED DEFAULT 0,
  UNIQUE KEY `uk_user_provider` (`user_id`, `provider`),
  INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `social_posts` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id`        INT UNSIGNED NOT NULL DEFAULT 0,
  `provider`       ENUM('facebook','instagram','linkedin','youtube','tiktok') NOT NULL,
  `platform_id`    VARCHAR(255) NOT NULL,
  `caption`        TEXT DEFAULT NULL,
  `media_url`      VARCHAR(2048) DEFAULT NULL,
  `thumbnail_url`  VARCHAR(2048) DEFAULT NULL,
  `post_type`      VARCHAR(50) DEFAULT 'post',
  `likes_count`    INT UNSIGNED DEFAULT 0,
  `comments_count` INT UNSIGNED DEFAULT 0,
  `shares_count`   INT UNSIGNED DEFAULT 0,
  `views_count`    INT UNSIGNED DEFAULT 0,
  `reach_count`    INT UNSIGNED DEFAULT 0,
  `permalink`      VARCHAR(2048) DEFAULT NULL,
  `published_at`   DATETIME DEFAULT NULL,
  `cached_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_provider_post` (`user_id`, `provider`, `platform_id`),
  INDEX `idx_user_provider` (`user_id`, `provider`),
  INDEX `idx_published` (`published_at`)
) ENGINE=InnoDB;
