<?php
/**
 * SSRF guard for outbound HTTP fetches (api-php side).
 *
 * Ported from crm-vanilla/api/lib/url_guard.php. The only difference is the
 * error sink: api-php uses err()/json_out() from lib/response.php instead of
 * the CRM's jsonError(). Keep the two copies behaviourally in sync.
 *
 * Blocks private/loopback/link-local IPs and non-http(s) schemes, resolves
 * DNS, and exposes a CURLOPT_RESOLVE pin to close the DNS-rebinding window.
 *
 * Usage:
 *   require_once __DIR__ . '/url_guard.php';
 *   url_guard_or_fail($url);                 // err()s out on a blocked target
 *   curl_setopt($ch, CURLOPT_RESOLVE, url_guard_curlopt_resolve($url));
 */

require_once __DIR__ . '/response.php';

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
        err('Valid URL required', 400);
    }
    $parts = parse_url($url);
    $scheme = strtolower($parts['scheme'] ?? '');
    if ($scheme !== 'http' && $scheme !== 'https') {
        err('Only http/https URLs are allowed', 400);
    }
    $host = $parts['host'] ?? '';
    if (!$host) err('URL host missing', 400);

    // Block direct IP literals.
    if (filter_var($host, FILTER_VALIDATE_IP)) {
        if (_url_guard_is_blocked_ip($host)) err('Target IP is not permitted', 400);
        return $url;
    }

    // Block obvious local hostnames pre-resolution.
    $hostLower = strtolower($host);
    if ($hostLower === 'localhost' || $hostLower === 'localhost.localdomain'
        || substr($hostLower, -6) === '.local' || substr($hostLower, -9) === '.internal'
        || $hostLower === 'metadata.google.internal') {
        err('Target host is not permitted', 400);
    }

    // Resolve DNS and reject if any address resolves to a blocked range.
    $ips = @gethostbynamel($host);
    if (!$ips) err('Cannot resolve target host', 400);
    foreach ($ips as $ip) {
        if (_url_guard_is_blocked_ip($ip)) err('Target IP is not permitted', 400);
    }

    // Pin the first safe IP so callers can prevent DNS rebinding via CURLOPT_RESOLVE.
    if (!isset($GLOBALS['_nwm_url_guard_safe_ip'])) $GLOBALS['_nwm_url_guard_safe_ip'] = [];
    $GLOBALS['_nwm_url_guard_safe_ip'][$host] = $ips[0];

    return $url;
}

/**
 * Returns CURLOPT_RESOLVE entries that pin $url's host to the IP already
 * validated by url_guard_or_fail(). Closes the DNS-rebinding window.
 */
function url_guard_curlopt_resolve(string $url): array {
    $host = parse_url($url, PHP_URL_HOST) ?: '';
    // IP-literal URLs don't need pinning; only hostname URLs were cached.
    if (!$host || filter_var($host, FILTER_VALIDATE_IP)) return [];
    $ip = $GLOBALS['_nwm_url_guard_safe_ip'][$host] ?? '';
    if (!$ip) return [];
    return ["{$host}:80:{$ip}", "{$host}:443:{$ip}"];
}
