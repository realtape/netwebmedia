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
 * Non-exiting predicate form of url_guard_or_fail(). Same checks, but
 * returns false instead of err()/exit, and still pins the safe IP on pass.
 * Use from non-API flows (e.g. the HTML audit page) that must degrade
 * gracefully instead of emitting a JSON error and exiting.
 */
function url_guard_is_safe_url(string $url): bool {
    if (!filter_var($url, FILTER_VALIDATE_URL)) return false;
    $parts = parse_url($url);
    $scheme = strtolower($parts['scheme'] ?? '');
    if ($scheme !== 'http' && $scheme !== 'https') return false;
    $host = $parts['host'] ?? '';
    if (!$host) return false;

    if (filter_var($host, FILTER_VALIDATE_IP)) {
        return !_url_guard_is_blocked_ip($host);
    }

    $hostLower = strtolower($host);
    if ($hostLower === 'localhost' || $hostLower === 'localhost.localdomain'
        || substr($hostLower, -6) === '.local' || substr($hostLower, -9) === '.internal'
        || $hostLower === 'metadata.google.internal') {
        return false;
    }

    $ips = @gethostbynamel($host);
    if (!$ips) return false;
    foreach ($ips as $ip) {
        if (_url_guard_is_blocked_ip($ip)) return false;
    }

    if (!isset($GLOBALS['_nwm_url_guard_safe_ip'])) $GLOBALS['_nwm_url_guard_safe_ip'] = [];
    $GLOBALS['_nwm_url_guard_safe_ip'][$host] = $ips[0];
    return true;
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
 * SSRF-safe outbound fetch, GRACEFUL variant. Every hop (initial + each
 * redirect Location) is re-checked with url_guard_is_safe_url(); a blocked
 * hop returns ['ok'=>false] instead of exiting. TLS peer verification is
 * always on, DNS is pinned per hop, redirects are followed manually.
 *
 * NOTE: behaviourally parallel to crm-vanilla's url_guard_safe_fetch(), but
 * that copy hard-fails via jsonError() because its callers are JSON APIs;
 * this copy degrades gracefully because the audit HTML page has its own
 * unreachable-result path. Keep the SSRF checks themselves in sync.
 *
 * @return array{ok:bool, body:string, status:int, info:array, final_url:string, t_ms:int, error:string}
 */
function url_guard_safe_fetch(string $url, array $opts = []): array {
    $maxRedirects = $opts['max_redirects'] ?? 5;
    $hop = 0;
    $current = $url;
    $timeout = $opts['timeout'] ?? 12;
    $connect = $opts['connect_timeout'] ?? 5;
    $ua = $opts['user_agent'] ?? 'NetWebMediaAuditBot/2.1 (+https://netwebmedia.com/audit)';
    $headers = $opts['headers'] ?? [];
    $nobody = $opts['nobody'] ?? false;
    $fail = ['ok' => false, 'body' => '', 'status' => 0, 'info' => [],
             'final_url' => $current, 't_ms' => 0, 'error' => 'blocked or unreachable'];

    while (true) {
        if (!url_guard_is_safe_url($current)) {
            $fail['final_url'] = $current;
            $fail['error'] = 'SSRF guard blocked target';
            return $fail;
        }
        $ch = curl_init($current);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER  => true,
            CURLOPT_NOBODY          => $nobody,
            CURLOPT_FOLLOWLOCATION  => 0,                 // followed manually + re-guarded
            CURLOPT_TIMEOUT         => $timeout,
            CURLOPT_CONNECTTIMEOUT  => $connect,
            CURLOPT_SSL_VERIFYPEER  => true,
            CURLOPT_SSL_VERIFYHOST  => 2,
            CURLOPT_PROTOCOLS       => CURLPROTO_HTTP | CURLPROTO_HTTPS,
            CURLOPT_REDIR_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS,
            CURLOPT_RESOLVE         => url_guard_curlopt_resolve($current),
            CURLOPT_USERAGENT       => $ua,
            CURLOPT_HTTPHEADER      => $headers,
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
                    'final_url' => $current, 't_ms' => $t_ms, 'error' => $err];
        }
        $headerSize = $info['header_size'] ?? 0;
        $rawHeaders = substr($raw, 0, $headerSize);
        $body = substr($raw, $headerSize);
        $code = (int) ($info['http_code'] ?? 0);

        if ($code >= 300 && $code < 400 && $hop < $maxRedirects
            && preg_match('/^\s*location:\s*(.+?)\s*$/im', $rawHeaders, $lm)) {
            $current = _url_guard_resolve_url($current, $lm[1]);
            $hop++;
            continue; // top of loop re-guards $current
        }
        return ['ok' => true, 'body' => $body, 'status' => $code, 'info' => $info,
                'final_url' => $current, 't_ms' => $t_ms, 'error' => ''];
    }
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
