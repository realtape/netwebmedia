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
