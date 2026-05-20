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
        || substr($hostLower, -6) === '.local' || substr($hostLower, -9) === '.internal'
        || $hostLower === 'metadata.google.internal') {
        jsonError('Target host is not permitted', 400);
    }

    // Resolve DNS and reject if any address resolves to a blocked range.
    $ips = @gethostbynamel($host);
    if (!$ips) jsonError('Cannot resolve target host', 400);
    foreach ($ips as $ip) {
        if (_url_guard_is_blocked_ip($ip)) jsonError('Target IP is not permitted', 400);
    }

    // Pin the first safe IP so callers can prevent DNS rebinding via CURLOPT_RESOLVE.
    if (!isset($GLOBALS['_nwm_url_guard_safe_ip'])) $GLOBALS['_nwm_url_guard_safe_ip'] = [];
    $GLOBALS['_nwm_url_guard_safe_ip'][$host] = $ips[0];

    return $url;
}

/**
 * Returns CURLOPT_RESOLVE entries that pin $url's host to the IP already
 * validated by url_guard_or_fail(). Pass the result directly as the value
 * for CURLOPT_RESOLVE on the curl handle to close the DNS-rebinding window.
 *
 * Usage:
 *   $url = url_guard_or_fail($raw);
 *   $ch = curl_init($url);
 *   curl_setopt($ch, CURLOPT_RESOLVE, url_guard_curlopt_resolve($url));
 */
function url_guard_curlopt_resolve(string $url): array {
    $host = parse_url($url, PHP_URL_HOST) ?: '';
    // IP-literal URLs don't need pinning; only hostname URLs were cached.
    if (!$host || filter_var($host, FILTER_VALIDATE_IP)) return [];
    $ip = $GLOBALS['_nwm_url_guard_safe_ip'][$host] ?? '';
    if (!$ip) return [];
    return ["{$host}:80:{$ip}", "{$host}:443:{$ip}"];
}

// Resolve a (possibly relative) redirect target against the URL it came from.
function _url_guard_resolve_url(string $base, string $next): string {
    $next = trim($next);
    if ($next === '') return $base;
    if (preg_match('#^https?://#i', $next)) return $next;
    $p = parse_url($base);
    if (empty($p['scheme']) || empty($p['host'])) return $next;
    $origin = $p['scheme'] . '://' . $p['host'] . (isset($p['port']) ? ':' . $p['port'] : '');
    if (strpos($next, '//') === 0) return $p['scheme'] . ':' . $next;
    if ($next[0] === '/') return $origin . $next;
    $dir = isset($p['path']) ? preg_replace('#/[^/]*$#', '/', $p['path']) : '/';
    if ($dir === '' || $dir[0] !== '/') $dir = '/' . $dir;
    return $origin . $dir . $next;
}

/**
 * SSRF-safe outbound fetch. The initial URL AND every redirect hop are run
 * through url_guard_or_fail() (which hard-fails the request on a private/
 * loopback/link-local/metadata target), DNS is pinned per hop via
 * CURLOPT_RESOLVE to close the rebinding window, redirects are followed
 * manually so each Location is re-validated, protocols are restricted to
 * http/https, and TLS peer verification is always on.
 *
 * Mirrors the hardened api-php/routes/audit.php aud_fetch_url() pattern.
 * Do NOT replace this with CURLOPT_FOLLOWLOCATION => true — that bypasses
 * the per-hop guard and reintroduces redirect-based SSRF.
 *
 * @return array{ok:bool, body:string, status:int, info:array, t_ms:int, final_url:string, err:string}
 */
function url_guard_safe_fetch(string $url, array $opts = []): array {
    $maxRedirects = 5;
    $hop = 0;
    $current = $url;
    $timeout = $opts['timeout'] ?? 15;
    $ua = $opts['user_agent'] ?? 'NetWebMediaAnalyzer/1.0 (+https://netwebmedia.com)';

    while (true) {
        // err()s out (jsonError + exit) if this hop targets a blocked address.
        url_guard_or_fail($current);

        $ch = curl_init($current);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER  => true,
            CURLOPT_FOLLOWLOCATION  => 0,                 // followed manually + re-guarded
            CURLOPT_TIMEOUT         => $timeout,
            CURLOPT_CONNECTTIMEOUT  => 7,
            CURLOPT_SSL_VERIFYPEER  => true,
            CURLOPT_SSL_VERIFYHOST  => 2,
            CURLOPT_PROTOCOLS       => CURLPROTO_HTTP | CURLPROTO_HTTPS,
            CURLOPT_REDIR_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS,
            CURLOPT_RESOLVE         => url_guard_curlopt_resolve($current),
            CURLOPT_USERAGENT       => $ua,
            CURLOPT_HEADER          => 1,
            CURLOPT_ENCODING        => '',
        ]);
        $t0 = microtime(true);
        $raw = curl_exec($ch);
        $t_ms = (int) ((microtime(true) - $t0) * 1000);
        $info = curl_getinfo($ch);
        $err = curl_error($ch);
        curl_close($ch);
        if ($raw === false) {
            return ['ok' => false, 'body' => '', 'status' => 0, 'info' => $info,
                    't_ms' => $t_ms, 'final_url' => $current, 'err' => $err];
        }

        $headerSize = $info['header_size'];
        $headers = substr($raw, 0, $headerSize);
        $body = substr($raw, $headerSize);
        $code = (int) $info['http_code'];

        if ($code >= 300 && $code < 400 && $hop < $maxRedirects
            && preg_match('/^\s*location:\s*(.+?)\s*$/im', $headers, $lm)) {
            $current = _url_guard_resolve_url($current, $lm[1]);
            $hop++;
            continue; // top of loop re-guards $current
        }

        return ['ok' => true, 'body' => $body, 'status' => $code, 'info' => $info,
                't_ms' => $t_ms, 'final_url' => $current, 'err' => ''];
    }
}
