<?php
/**
 * Session helpers for the superadmin panel.
 *
 * Uses a dedicated session name (sa_session) so it never mixes with the
 * CRM sessions on app.netwebmedia.com — cookies are domain-scoped by the
 * browser to admin.netwebmedia.com.
 */

function sa_start(): void {
    if (session_status() !== PHP_SESSION_NONE) return;
    session_name('sa_session');
    session_set_cookie_params([
        'lifetime' => 8 * 3600,   // 8-hour admin sessions
        'path'     => '/',
        'secure'   => true,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
}

function sa_user(): ?array {
    sa_start();
    $u = $_SESSION['sa_user'] ?? null;
    if (!is_array($u) || ($u['role'] ?? '') !== 'superadmin') return null;
    return $u;
}

function sa_require(): array {
    $user = sa_user();
    if (!$user) {
        if (str_contains($_SERVER['REQUEST_URI'] ?? '', '/api/')) {
            http_response_code(401);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['error' => 'Unauthorized']);
        } else {
            header('Location: /login.php');
        }
        exit;
    }
    return $user;
}

function sa_json(array $data, int $code = 200): never {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function sa_error(string $msg, int $code = 400): never {
    sa_json(['error' => $msg], $code);
}
