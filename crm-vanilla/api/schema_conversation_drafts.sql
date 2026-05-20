-- conversation_drafts: rows queued by the AI drafter, awaiting auto-send or human approval
-- Idempotent. App-layer FK enforcement (no DB FKs — InnoDB tablespace history bit us before).
-- Tenancy column: organization_id (canonical) + user_id (legacy fallback).

CREATE TABLE IF NOT EXISTS conversation_drafts (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id   BIGINT UNSIGNED NULL,
  user_id           INT UNSIGNED NULL,
  conversation_id   BIGINT UNSIGNED NOT NULL,
  message_id        BIGINT UNSIGNED NULL,
  channel           ENUM('email','sms','whatsapp','ig_dm') NOT NULL,
  draft_body        MEDIUMTEXT NOT NULL,
  draft_subject     VARCHAR(300) NULL,
  confidence        DECIMAL(4,3) NOT NULL DEFAULT 0,
  topic             VARCHAR(80) NULL,
  status            ENUM('pending_approval','approved','auto_sent','sent','rejected','edited_sent','expired','shadow') NOT NULL DEFAULT 'pending_approval',
  shadow_mode       TINYINT(1) NOT NULL DEFAULT 0,
  source            ENUM('ai','holding','human_override') NOT NULL DEFAULT 'ai',
  approval_channel  ENUM('whatsapp','crm','none') NULL,
  approver_user_id  INT UNSIGNED NULL,
  edited_body       MEDIUMTEXT NULL,
  audit_blob        MEDIUMTEXT NULL,
  expires_at        DATETIME NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  approved_at       DATETIME NULL,
  sent_at           DATETIME NULL,
  INDEX idx_cd_conv      (conversation_id),
  INDEX idx_cd_status    (status, expires_at),
  INDEX idx_cd_org       (organization_id),
  INDEX idx_cd_pending   (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
