-- Password reset tokens for the CRM forgot-password flow.
-- Idempotent: runs on every deploy via ?r=migrate. Plain DDL only (no SET/PREPARE).
-- Raw token lives only in the emailed link; we store sha256(token) here.
CREATE TABLE IF NOT EXISTS password_resets (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  email       VARCHAR(255) NOT NULL,
  token_hash  CHAR(64) NOT NULL,
  expires_at  DATETIME NOT NULL,
  used_at     DATETIME DEFAULT NULL,
  ip          VARCHAR(45) DEFAULT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY ix_token   (token_hash),
  KEY ix_email   (email),
  KEY ix_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
