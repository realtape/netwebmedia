<?php
/**
 * NetWebMedia OS — Encrypted connector token store  (Phase 3)
 * =============================================================================
 * Per-tenant OAuth tokens (Gmail/Calendar/Slack/HubSpot/Stripe) are encrypted
 * at rest with libsodium AEAD (sodium_crypto_secretbox: XSalsa20-Poly1305).
 * The 32-byte key lives in CONNECTOR_ENC_KEY (base64), injected from a GitHub
 * Secret into config.local.php at deploy. Plaintext tokens are only ever held
 * transiently in PHP memory at moment-of-use, never logged, never persisted.
 *
 * FAIL CLOSED: if CONNECTOR_ENC_KEY is unset, encryption is unavailable and the
 * connector layer reports itself disabled rather than storing plaintext.
 */

/** 32-byte raw key, or null if not configured. */
function os_connector_key(): ?string {
    if (!defined('CONNECTOR_ENC_KEY') || CONNECTOR_ENC_KEY === '') return null;
    $key = base64_decode((string)CONNECTOR_ENC_KEY, true);
    if ($key === false || strlen($key) !== SODIUM_CRYPTO_SECRETBOX_KEYBYTES) return null;
    return $key;
}

function os_connectors_available(): bool {
    return function_exists('sodium_crypto_secretbox') && os_connector_key() !== null;
}

/** Encrypt → nonce-prefixed binary blob. Throws if key missing. */
function os_connector_encrypt(string $plaintext): string {
    $key = os_connector_key();
    if ($key === null) throw new RuntimeException('CONNECTOR_ENC_KEY not configured');
    $nonce  = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
    $cipher = sodium_crypto_secretbox($plaintext, $nonce, $key);
    sodium_memzero($key);
    return $nonce . $cipher;
}

/** Decrypt a nonce-prefixed blob → plaintext, or null on failure. */
function os_connector_decrypt(?string $blob): ?string {
    if ($blob === null || $blob === '') return null;
    $key = os_connector_key();
    if ($key === null) return null;
    $nb = SODIUM_CRYPTO_SECRETBOX_NONCEBYTES;
    if (strlen($blob) <= $nb) return null;
    $nonce  = substr($blob, 0, $nb);
    $cipher = substr($blob, $nb);
    $plain  = sodium_crypto_secretbox_open($cipher, $nonce, $key);
    sodium_memzero($key);
    return $plain === false ? null : $plain;
}

/**
 * Upsert a connector for an org. Tokens are encrypted here.
 * $expiresAt: unix timestamp or null.
 */
function os_connector_upsert(PDO $db, int $orgId, string $provider, ?string $accessToken,
                             ?string $refreshToken, ?int $expiresAt, ?string $scopes, ?string $label): void {
    $accEnc = $accessToken  !== null ? os_connector_encrypt($accessToken)  : null;
    $refEnc = $refreshToken !== null ? os_connector_encrypt($refreshToken) : null;
    $exp = $expiresAt ? date('Y-m-d H:i:s', $expiresAt) : null;

    $stmt = $db->prepare(
        'INSERT INTO tenant_connectors
            (organization_id, provider, account_label, access_token_enc, refresh_token_enc, scopes, expires_at, status, last_refresh_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, "active", NOW())
         ON DUPLICATE KEY UPDATE
            account_label     = VALUES(account_label),
            access_token_enc  = VALUES(access_token_enc),
            refresh_token_enc = COALESCE(VALUES(refresh_token_enc), refresh_token_enc),
            scopes            = VALUES(scopes),
            expires_at        = VALUES(expires_at),
            status            = "active",
            last_error        = NULL,
            last_refresh_at   = NOW()'
    );
    // PDO can't bind a NULL into a BLOB param with a type hint cleanly across
    // drivers; pass binary strings directly (emulated prepares are off, so this
    // is a real bound param — binary-safe).
    $stmt->bindValue(1, $orgId, PDO::PARAM_INT);
    $stmt->bindValue(2, $provider);
    $stmt->bindValue(3, $label);
    $stmt->bindValue(4, $accEnc, $accEnc === null ? PDO::PARAM_NULL : PDO::PARAM_LOB);
    $stmt->bindValue(5, $refEnc, $refEnc === null ? PDO::PARAM_NULL : PDO::PARAM_LOB);
    $stmt->bindValue(6, $scopes);
    $stmt->bindValue(7, $exp);
    $stmt->execute();
}

/**
 * Fetch a connector with decrypted tokens for moment-of-use.
 * Returns ['provider','access_token','refresh_token','expires_at','status',...] or null.
 * NOTE: callers must never log the returned token fields.
 */
function os_connector_get(PDO $db, int $orgId, string $provider): ?array {
    $stmt = $db->prepare(
        'SELECT provider, account_label, access_token_enc, refresh_token_enc, scopes, expires_at, status
           FROM tenant_connectors WHERE organization_id = ? AND provider = ? LIMIT 1'
    );
    $stmt->execute([$orgId, $provider]);
    $row = $stmt->fetch();
    if (!$row) return null;
    return [
        'provider'      => $row['provider'],
        'account_label' => $row['account_label'],
        'access_token'  => os_connector_decrypt($row['access_token_enc']),
        'refresh_token' => os_connector_decrypt($row['refresh_token_enc']),
        'scopes'        => $row['scopes'],
        'expires_at'    => $row['expires_at'],
        'status'        => $row['status'],
    ];
}

/** Public-safe connector list for the UI (NO token material). */
function os_connectors_list(PDO $db, int $orgId): array {
    $stmt = $db->prepare(
        'SELECT provider, account_label, status, expires_at, last_refresh_at, created_at
           FROM tenant_connectors WHERE organization_id = ? ORDER BY provider'
    );
    $stmt->execute([$orgId]);
    return $stmt->fetchAll() ?: [];
}

function os_connector_disconnect(PDO $db, int $orgId, string $provider): void {
    $stmt = $db->prepare(
        'UPDATE tenant_connectors SET status = "revoked", access_token_enc = NULL, refresh_token_enc = NULL
          WHERE organization_id = ? AND provider = ?'
    );
    $stmt->execute([$orgId, $provider]);
}
