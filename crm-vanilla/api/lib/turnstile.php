<?php
/**
 * Cloudflare Turnstile verification helper.
 *
 * Usage in handlers (intake, proposal, etc. — anything that fans out to a paid AI call):
 *   require_once __DIR__ . '/../lib/turnstile.php';
 *   turnstile_require($_POST['cf_turnstile_token'] ?? $_GET['cf_turnstile_token'] ?? '');
 *
 * Behavior:
 *   - If TURNSTILE_SECRET_KEY is unset/empty → verification is SKIPPED (graceful no-op).
 *     This preserves existing behavior on deploys before the secret is provisioned.
 *   - If the secret IS set → an empty/invalid token responds 403 + JSON error and exits.
 *   - Tokens are single-use; Cloudflare invalidates after first verification.
 *
 * To enable in prod:
 *   1. Get site key + secret key from Cloudflare dashboard (Turnstile section).
 *   2. Add `TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` to GitHub Secrets.
 *   3. Confirm `deploy-site-root.yml` writes both to config.local.php.
 *   4. Set `<meta name="nwm-turnstile-sitekey" content="<key>">` on pages with intake forms.
 */

function turnstile_verify(string $token): array {
    if (!defined('TURNSTILE_SECRET_KEY') || TURNSTILE_SECRET_KEY === '') {
        // Graceful no-op when secret unset — verification is opt-in via deploy.
        return ['ok' => true, 'skipped' => true, 'reason' => 'secret_not_configured'];
    }
    if ($token === '') {
        return ['ok' => false, 'reason' => 'missing_token'];
    }
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $payload = http_build_query([
        'secret'   => TURNSTILE_SECRET_KEY,
        'response' => $token,
        'remoteip' => $ip,
    ]);
    $ch = curl_init('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/x-www-form-urlencoded'],
        CURLOPT_TIMEOUT        => 5,
        CURLOPT_CONNECTTIMEOUT => 3,
    ]);
    $raw  = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($code !== 200 || !$raw) {
        // Fail-open on Cloudflare outage — better to take the lead than block legit users.
        // Logged so we can spot prolonged outages.
        error_log('[turnstile] siteverify HTTP ' . $code . ' — failing open');
        return ['ok' => true, 'skipped' => true, 'reason' => 'siteverify_unreachable'];
    }
    $data = json_decode($raw, true);
    if (!is_array($data) || !($data['success'] ?? false)) {
        return ['ok' => false, 'reason' => 'verification_failed', 'codes' => $data['error-codes'] ?? []];
    }
    return ['ok' => true, 'skipped' => false];
}

/**
 * Verify or fail with a 403 JSON response. Use in handlers that should NOT
 * proceed past this point if the user fails the challenge.
 */
function turnstile_require(string $token): void {
    $r = turnstile_verify($token);
    if (!$r['ok']) {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'ok'    => false,
            'error' => 'Bot challenge failed. Please refresh and try again.',
            'code'  => $r['reason'] ?? 'turnstile_failed',
        ]);
        exit;
    }
}
