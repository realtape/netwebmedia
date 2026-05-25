<?php
/**
 * File-based IP rate limiter — flock-protected, in app-owned storage.
 *
 * Usage:
 *   require_once __DIR__ . '/../lib/rate_limit.php';
 *   rate_limit('analyze', 10, 300);   // 10 hits per 5 minutes
 */

function _rl_dir(): string {
    // App-owned dir, not /tmp (which is shared with cPanel siblings on InMotion).
    $dir = __DIR__ . '/../../storage/ratelimit';
    if (!is_dir($dir)) @mkdir($dir, 0775, true);
    return $dir;
}

function _rl_gc(string $dir, int $maxAgeSec = 3600): void {
    // Cheap probabilistic GC — runs ~1% of requests.
    if (mt_rand(0, 99) !== 0) return;
    $cutoff = time() - $maxAgeSec;
    foreach (glob($dir . '/nwm_rl_*.json') ?: [] as $f) {
        if (@filemtime($f) < $cutoff) @unlink($f);
    }
}

function rate_limit(string $key, int $maxHits, int $windowSec): void {
    $ip     = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $safeIp = preg_replace('/[^a-f0-9:.]/', '_', $ip);
    $safeKey= preg_replace('/[^a-z0-9_]/', '', strtolower($key));
    $dir    = _rl_dir();
    $file   = $dir . '/nwm_rl_' . $safeKey . '_' . $safeIp . '.json';

    _rl_gc($dir, max(3600, $windowSec * 2));

    $now  = time();
    $fp   = @fopen($file, 'c+');
    if (!$fp) {
        // If we can't open the file, fail open rather than block legitimate traffic.
        return;
    }

    try {
        if (!flock($fp, LOCK_EX)) {
            return; // fail open if we can't lock
        }

        $raw  = stream_get_contents($fp);
        $hits = $raw ? (json_decode($raw, true) ?: []) : [];

        // Drop timestamps outside the window
        $hits = array_values(array_filter(
            $hits,
            function ($t) use ($now, $windowSec) { return ($now - (int)$t) < $windowSec; }
        ));

        if (count($hits) >= $maxHits) {
            $retryAfter = max(1, $windowSec - ($now - (int)($hits[0] ?? $now)));
            flock($fp, LOCK_UN);
            fclose($fp);
            header('Retry-After: ' . $retryAfter);
            http_response_code(429);
            header('Content-Type: application/json');
            echo json_encode([
                'error'       => 'Too many requests. Please wait and try again.',
                'retry_after' => $retryAfter,
            ]);
            exit;
        }

        $hits[] = $now;

        // Atomic-ish overwrite under our exclusive lock.
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($hits));
        fflush($fp);
    } finally {
        @flock($fp, LOCK_UN);
        @fclose($fp);
    }
}
