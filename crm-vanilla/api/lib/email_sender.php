<?php
/**
 * Resend email sender + merge-tag engine.
 * Docs: https://resend.com/docs/api-reference/emails/send-email
 */

function mergeTags(string $template, array $vars): string {
    // Replace {{name}}, {{company}}, {{city}}, {{email}}, {{niche}}, {{page_url}}, {{unsubscribe_url}}
    foreach ($vars as $k => $v) {
        $template = str_replace('{{' . $k . '}}', (string)$v, $template);
    }
    return $template;
}

function buildContactVars(array $contact, string $siteBase, string $token): array {
    // Notes may contain JSON metadata with city/niche/website
    $meta = [];
    if (!empty($contact['notes'])) {
        $decoded = json_decode($contact['notes'], true);
        if (is_array($decoded)) $meta = $decoded;
    }
    $city = $meta['city'] ?? '';
    $niche = $meta['niche'] ?? $contact['role'] ?? '';
    $slug = $meta['page'] ?? '';
    $pageUrl = $slug ? ($siteBase . '/' . ltrim($slug, '/')) : $siteBase;
    return [
        'name'            => $contact['name'] ?? '',
        'first_name'      => strtok($contact['name'] ?? '', ' '),
        'company'         => $contact['company'] ?? $contact['name'] ?? '',
        'email'           => $contact['email'] ?? '',
        'city'            => $city,
        'niche'           => $niche,
        'page_url'        => $pageUrl,
        'website'         => $meta['website'] ?? '',
        'unsubscribe_url' => $siteBase . '/companies/crm-vanilla/api/index.php?r=track&a=unsub&t=' . $token,
    ];
}

/**
 * Send one email via Resend.
 * Returns ['id' => 'resend_id'] on success, throws RuntimeException on failure.
 */
function resendSend(array $opts): array {
    $apiKey = defined('RESEND_API_KEY') ? RESEND_API_KEY : '';
    if (!$apiKey) throw new RuntimeException('RESEND_API_KEY not configured');

    $payload = [
        'from'    => ($opts['from_name'] ?? 'NetWebMedia') . ' <' . ($opts['from_email'] ?? 'carlos@netwebmedia.com') . '>',
        'to'      => [$opts['to']],
        'subject' => $opts['subject'],
        'html'    => $opts['html'],
    ];
    if (!empty($opts['text']))       $payload['text']     = $opts['text'];
    if (!empty($opts['reply_to']))   $payload['reply_to'] = $opts['reply_to'];
    if (!empty($opts['headers']))    $payload['headers']  = $opts['headers'];

    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_CONNECTTIMEOUT => 5,
    ]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);

    if ($err) throw new RuntimeException("cURL error: $err");
    $data = json_decode($resp, true);
    if ($code >= 400) {
        $msg = $data['message'] ?? $data['error'] ?? $resp;
        throw new RuntimeException("Resend API error ($code): $msg");
    }
    return $data ?: [];
}

/**
 * Inject open-tracking pixel and rewrite links for click tracking.
 */
function instrumentTracking(string $html, string $siteBase, string $token): string {
    $base = $siteBase . '/companies/crm-vanilla/api/index.php?r=track';
    // Rewrite <a href> for click tracking (skip mailto/tel/anchors and already-tracked)
    $html = preg_replace_callback(
        '#<a\s+([^>]*?)href=(["\'])([^"\']+)\2([^>]*)>#i',
        function ($m) use ($base, $token) {
            $url = $m[3];
            if (preg_match('#^(mailto:|tel:|#|javascript:)#i', $url)) return $m[0];
            if (strpos($url, 'r=track') !== false) return $m[0];
            $tracked = $base . '&a=click&t=' . $token . '&u=' . urlencode($url);
            return '<a ' . $m[1] . 'href="' . $tracked . '"' . $m[4] . '>';
        },
        $html
    );
    // Open pixel
    $pixel = '<img src="' . $base . '&a=open&t=' . $token . '" width="1" height="1" style="display:none" alt="">';
    if (stripos($html, '</body>') !== false) {
        $html = str_ireplace('</body>', $pixel . '</body>', $html);
    } else {
        $html .= $pixel;
    }
    // Unsubscribe footer (if not already present)
    if (stripos($html, 'unsubscribe') === false) {
        $unsubUrl = $base . '&a=unsub&t=' . $token;
        $html .= '<div style="margin-top:40px;padding-top:20px;border-top:1px solid #eee;font-size:11px;color:#888;text-align:center;font-family:sans-serif">'
              . 'NetWebMedia · Santiago, Chile · <a href="' . $unsubUrl . '" style="color:#888">Unsubscribe</a></div>';
    }
    return $html;
}
