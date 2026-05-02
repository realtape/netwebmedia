-- auto_reply_config: per-tenant runtime configuration for the auto-reply system.
-- shadow_mode_enabled defaults to 1 (ON) so auto-send is OFF until explicitly flipped.
-- Idempotent. Default row for organization_id=1 (Carlos's master org) seeded.

CREATE TABLE IF NOT EXISTS auto_reply_config (
  organization_id      BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  shadow_mode_enabled  TINYINT(1) NOT NULL DEFAULT 1,
  confidence_threshold DECIMAL(4,3) NOT NULL DEFAULT 0.850,
  allowlist_topics     TEXT NULL,
  denylist_topics      TEXT NULL,
  holding_reply_en     TEXT NULL,
  holding_reply_es     TEXT NULL,
  failsafe_minutes     SMALLINT UNSIGNED NOT NULL DEFAULT 4,
  scratch_json         TEXT NULL,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO auto_reply_config (organization_id, shadow_mode_enabled, holding_reply_en, holding_reply_es)
VALUES (1, 1, 'Got your message — Carlos will respond within the hour.', 'Recibido — Carlos responde en la próxima hora.');
