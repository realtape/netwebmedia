<?php
/**
 * SSRF guard for outbound HTTP fetches.
 * Blocks private/loopback/link-local IPs and non-http(s) schemes.
 *
 * Usage:
 *   require_once __DIR__ . '/../lib/url_guard.php';
 *   $url = url_guard_or_fail($_GET['url'] ?? '');
 */

function _url_guard_is_blocked_ip(string $ip): bool {
    if (!filter_var($ip, FILTER_VALIDATE_IP)) return true;

    // Block loopback, private, link-local, broadcast, reserved.
    $flags = FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE;
    if (!filter_var($ip, FILTER_VALIDATE_IP, $flags)) return true;

    // Belt and suspenders for known SSRF targets that some PHP versions miss.
    if ($ip === '127.0.0.1' || $ip === '0.0.0.0' || $ip === '::1') return true;
    if (preg_match('/^169\.254\./', $ip)) return true;     // AWS/Azure metadata
    if (preg_match('/^10\./', $ip)) return true;
    if (preg_match('/^192\.168\./', $ip)) return true;
    if (preg_match('/^172\.(1[6-9]|2\d|3[01])\./', $ip)) return true;
    if (stripos($ip, 'fc') === 0 || stripos($ip, 'fd') === 0) return true; // ULA
    if (stripos($ip, 'fe80:') === 0) return true; // link-local

    return false;
}

function url_guard_or_fail(string $url): string {
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        jsonError('Valid URL required', 400);
    }
    $parts = parse_url($url);
    $scheme = strtolower($parts['scheme'] ?? '');
    if ($scheme !== 'http' && $scheme !== 'https') {
        jsonError('Only http/https URLs are allowed', 400);
    }
    $host = $parts['host'] ?? '';
    if (!$host) jsonError('URL host missing', 400);

    // Block direct IP literals.
    if (filter_var($host, FILTER_VALIDATE_IP)) {
        if (_url_guard_is_blocked_ip($host)) jsonError('Target IP is not permitted', 400);
        return $url;
    }

    // Block obvious local hostnames pre-resolution.
    $hostLower = strtolower($host);
    if ($hostLower === 'localhost' || $hostLower === 'localhost.localdomain'
        || str_ends_with($hostLower, '.local') || str_ends_with($hostLower, '.internal')
        || $hostLower === 'metadata.google.internal') {
        jsonError('Target host is not permitted', 400);
    }

    // Resolve DNS and reject if any address resolves to a blocked range.
    $ips = @gethostbynamel($host);
    if (!$ips) jsonError('Cannot resolve target host', 400);
    foreach ($ips as $ip) {
        if (_url_guard_is_blocked_ip($ip)) jsonError('Target IP is not permitted', 400);
    }

    return $url;
}
