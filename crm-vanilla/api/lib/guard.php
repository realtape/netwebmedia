<?php
/**
 * Payment gate middleware.
 *
 * Call require_guard() at the top of any handler that needs an active subscription.
 * Demo users (no PHP session) pass through freely — they see seed/demo data.
 * Users who registered but haven't paid (status='pending_payment') get HTTP 402.
 *
 * Usage:
 *   require_once __DIR__ . '/../lib/guard.php';
 *   require_guard();           // dies with 402/403/401 if not allowed
 *   $u = guard_user();         // returns current user array, or null for demo/guest
 */

function _guard_session_start(): void {
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params([
            'lifetime' => 60 * 60 * 24 * 30,
            'path'     => '/',
            'secure'   => true,
            'httponly' => true,
            'samesite' => 'Strict',
        ]);
        session_start();
    }
}

function guard_user(): ?array {
    _guard_session_start();
    $uid = $_SESSION['nwm_uid'] ?? null;

    // Fallback: accept the nwm_token cookie/header issued by the main site's
    // /api/auth/login endpoint and validate it against the shared sessions table.
    // This lets users logged in via /login.html reach their CRM data without a
    // separate CRM login step.
    if (!$uid) {
        $token = $_COOKIE['nwm_token'] ?? ($_SERVER['HTTP_X_AUTH_TOKEN'] ?? '');
        if ($token && strlen($token) >= 32) {
            try {
                $db   = getDB();
                $stmt = $db->prepare(
                    'SELECT user_id FROM sessions WHERE token = ? AND expires_at > NOW() LIMIT 1'
                );
                $stmt->execute([$token]);
                $row = $stmt->fetch();
                if ($row) {
                    $uid = (int)$row['user_id'];
                    $_SESSION['nwm_uid'] = $uid;
                }
            } catch (\Exception $e) { /* sessions table missing — fall through to guest */ }
        }
    }

    if (!$uid) return null;

    static $cache = [];
    if (isset($cache[$uid])) return $cache[$uid];

    $db  = getDB();
    $stmt = $db->prepare(
        'SELECT id, name, email, company, role, plan, niche, status FROM users WHERE id = ? LIMIT 1'
    );
    $stmt->execute([(int)$uid]);
    $u = $stmt->fetch() ?: null;
    return $cache[$uid] = $u;
}

function require_guard(): array {
    $user = guard_user();

    // No session = demo / unauthenticated guest — let them through.
    // They only see the seed data already in the DB; no org-specific records.
    if (!$user) {
        // Return a synthetic guest record so handlers can type-hint array.
        return ['id' => 0, 'role' => 'guest', 'status' => 'demo'];
    }

    if ($user['status'] === 'pending_payment') {
        http_response_code(402);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'error'            => 'Payment required to access this resource.',
            'requires_payment' => true,
            'checkout_url'     => '/pricing.html',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (in_array($user['status'], ['suspended', 'cancelled'], true)) {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'error' => 'Account suspended. Contact support@netwebmedia.com.',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    return $user;
}
