<?php
/**
 * KB loader for the auto-reply system.
 * Source file: crm-vanilla/api/data/kb.json (single deployment, hardcoded path).
 * Redeploy: edit kb.json + git push -> deploy-site-root.yml uploads it; FPM picks it up
 * automatically because kb_load() keys its static cache by filemtime().
 * Clear cache: not needed in production. In tests, use opcache_reset() or rely on mtime bump.
 */

const KB_MAX_BYTES = 1048576;

/**
 * kb_load(): array — full decoded KB, empty array on parse/size failure.
 * Cache key is filemtime(); a fresh kb.json is picked up without an FPM restart.
 */
function kb_load(): array {
    static $cache = [];
    $path = __DIR__ . '/../data/kb.json';
    if (!is_file($path)) return [];
    $mtime = @filemtime($path);
    if ($mtime === false) return [];
    if (isset($cache[$mtime])) return $cache[$mtime];

    $size = @filesize($path);
    if ($size === false || $size > KB_MAX_BYTES) {
        error_log('kb_load: kb.json missing or exceeds size cap (' . (int)$size . ' bytes)');
        return $cache[$mtime] = [];
    }

    $raw = @file_get_contents($path);
    if ($raw === false) {
        error_log('kb_load: file_get_contents failed for kb.json');
        return $cache[$mtime] = [];
    }

    try {
        $decoded = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
    } catch (Throwable $e) {
        error_log('kb_load: JSON parse failed: ' . $e->getMessage());
        return $cache[$mtime] = [];
    }
    if (!is_array($decoded)) return $cache[$mtime] = [];
    return $cache[$mtime] = $decoded;
}

/**
 * kb_search(string $inboundText, string $lang='en'): array
 * Naive token-overlap ranking against topic.patterns. Returns top 5 as
 * [{topic_id, label, score, snippet, answer_en, answer_es, links}, ...].
 * Snippet is the answer in the requested language, truncated to 200 chars.
 */
function kb_search(string $inboundText, string $lang = 'en'): array {
    $kb = kb_load();
    $topics = $kb['topics'] ?? [];
    if (!$topics) return [];

    $tokens = kb_tokenize($inboundText);
    if (!$tokens) return [];
    $tokenSet = array_flip($tokens);

    $scored = [];
    foreach ($topics as $t) {
        if (empty($t['id']) || empty($t['patterns']) || !is_array($t['patterns'])) continue;
        $score = 0;
        foreach ($t['patterns'] as $p) {
            $pTokens = kb_tokenize((string)$p);
            foreach ($pTokens as $pt) {
                if (isset($tokenSet[$pt])) $score++;
            }
        }
        if ($score <= 0) continue;
        $answer = $lang === 'es' ? ((string)($t['answer_es'] ?? '')) : ((string)($t['answer_en'] ?? ''));
        $snippet = mb_substr($answer, 0, 200);
        $scored[] = [
            'topic_id'  => (string)$t['id'],
            'label'     => (string)($t['label'] ?? $t['id']),
            'score'     => $score,
            'snippet'   => $snippet,
            'answer_en' => (string)($t['answer_en'] ?? ''),
            'answer_es' => (string)($t['answer_es'] ?? ''),
            'links'     => is_array($t['links'] ?? null) ? $t['links'] : [],
            'auto_send_eligible' => !empty($t['auto_send_eligible']),
        ];
    }
    usort($scored, function ($a, $b) { return $b['score'] <=> $a['score']; });
    return array_slice($scored, 0, 5);
}

/** kb_voice(): voice block or empty array. */
function kb_voice(): array {
    $kb = kb_load();
    return is_array($kb['voice'] ?? null) ? $kb['voice'] : [];
}

/** kb_topic(string $id): topic row or null. */
function kb_topic(string $id): ?array {
    $kb = kb_load();
    foreach (($kb['topics'] ?? []) as $t) {
        if (($t['id'] ?? null) === $id) return $t;
    }
    return null;
}

/** kb_company_facts(): company_facts block or empty array. */
function kb_company_facts(): array {
    $kb = kb_load();
    return is_array($kb['company_facts'] ?? null) ? $kb['company_facts'] : [];
}

/** kb_pricing_facts(): pricing_facts block or empty array. */
function kb_pricing_facts(): array {
    $kb = kb_load();
    return is_array($kb['pricing_facts'] ?? null) ? $kb['pricing_facts'] : [];
}

/** kb_human_required_topics(): list of [{id, reason}, ...]. */
function kb_human_required_topics(): array {
    $kb = kb_load();
    return is_array($kb['human_required_topics'] ?? null) ? $kb['human_required_topics'] : [];
}

/** kb_blocked_tags(): list of contact tag strings that block auto-send. */
function kb_blocked_tags(): array {
    $kb = kb_load();
    $tags = $kb['auto_send_blocked_contact_tags'] ?? [];
    if (!is_array($tags)) return [];
    return array_values(array_map('strtolower', array_map('strval', $tags)));
}

/** kb_holding_reply(string $lang='en'): holding-reply string for the given lang. */
function kb_holding_reply(string $lang = 'en'): string {
    $kb = kb_load();
    $h = $kb['default_holding_reply'] ?? [];
    if (!is_array($h)) return '';
    $key = $lang === 'es' ? 'es' : 'en';
    return (string)($h[$key] ?? '');
}

/** kb_safety_rules(): list of safety-rule strings drafter must respect. */
function kb_safety_rules(): array {
    $kb = kb_load();
    return is_array($kb['drafter_safety_rules'] ?? null) ? $kb['drafter_safety_rules'] : [];
}

/**
 * Lowercase + strip non-alphanumeric, split on whitespace, drop tokens < 2 chars.
 * Used by kb_search() for both inbound text and pattern strings.
 */
function kb_tokenize(string $s): array {
    $s = mb_strtolower($s);
    $s = preg_replace('/[^\p{L}\p{N}\s]+/u', ' ', $s);
    $parts = preg_split('/\s+/u', trim((string)$s));
    if (!$parts) return [];
    $out = [];
    foreach ($parts as $p) {
        if (mb_strlen($p) >= 2) $out[] = $p;
    }
    return $out;
}
