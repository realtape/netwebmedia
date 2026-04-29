<?php
/**
 * Simple file-based IP rate limiter.
 * Works on shared hosting without APCu or Redis.
 *
 * Usage:
 *   require_once __DIR__ . '/../lib/rate_limit.php';
 *   rate_limit('analyze', 10, 300);   // 10 hits per 5 minutes
 */

function rate_limit(string $key, int $maxHits, int $windowSec): void {
    $ip     = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $safeIp = preg_replace('/[^a-f0-9:.]/', '_', $ip);
    $file   = sys_get_temp_dir() . '/nwm_rl_' . $key . '_' . $safeIp . '.json';

    $now  = time();
    $hits = [];

    if (file_exists($file)) {
        $raw = @file_get_contents($file);
        if ($raw) {
            $hits = json_decode($raw, true) ?: [];
        }
    }

    // Drop timestamps outside the window
    $hits = array_values(array_filter($hits, fn($t) => ($now - $t) < $windowSec));

    if (count($hits) >= $maxHits) {
        $retryAfter = $windowSec - ($now - ($hits[0] ?? $now));
        header('Retry-After: ' . max(1, $retryAfter));
        http_response_code(429);
        header('Content-Type: application/json');
        echo json_encode([
            'error'       => 'Too many requests. Please wait and try again.',
            'retry_after' => max(1, $retryAfter),
        ]);
        exit;
    }

    $hits[] = $now;
    @file_put_contents($file, json_encode($hits), LOCK_EX);
}
