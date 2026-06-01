<?php
/**
 * Meta WhatsApp Cloud API client — reusable standalone module.
 *
 * Provides wa_meta_send() for both direct (text) and template-based sends.
 * Reads WA_PHONE_ID and WA_META_TOKEN from PHP constants (config.local.php)
 * with getenv() fallback for CLI/test contexts.
 *
 * Used by:
 *   - crm-vanilla/api/handlers/wa_flush.php   (batch opt-in welcome sends)
 *   - crm-vanilla/api/lib/wf_crm.php          (send_whatsapp workflow step)
 */

/**
 * Send a WhatsApp message via the Meta Cloud API.
 *
 * @param string     $phone     E.164 or any digit string — non-digits are stripped before sending.
 * @param string     $body      Plain-text body for direct text sends; ignored when $template is set.
 * @param array|null $template  Template descriptor, or null for a direct text message.
 *                              When set: ['name' => string, 'lang' => string, 'components' => array]
 *                              `components` follows the Meta template component schema exactly.
 * @return array{success: bool, message_id: string|null, error: string|null, error_code: int|null}
 */
function wa_meta_send(string $phone, string $body, ?array $template = null): array {
    $waPhoneId = defined('WA_PHONE_ID')   ? WA_PHONE_ID   : (getenv('WA_PHONE_ID')   ?: '');
    $waToken   = defined('WA_META_TOKEN') ? WA_META_TOKEN : (getenv('WA_META_TOKEN') ?: '');

    if (!$waPhoneId || !$waToken) {
        return [
            'success'    => false,
            'message_id' => null,
            'error'      => 'WA_PHONE_ID or WA_META_TOKEN not configured',
            'error_code' => null,
        ];
    }

    $to = preg_replace('/[^\d]/', '', $phone);
    if (strlen($to) < 7) {
        return [
            'success'    => false,
            'message_id' => null,
            'error'      => 'Invalid phone number: ' . $phone,
            'error_code' => null,
        ];
    }

    if ($template !== null) {
        $payload = [
            'messaging_product' => 'whatsapp',
            'to'                => $to,
            'type'              => 'template',
            'template'          => [
                'name'       => $template['name'],
                'language'   => ['code' => $template['lang'] ?? 'en'],
                'components' => $template['components'] ?? [],
            ],
        ];
    } else {
        $payload = [
            'messaging_product' => 'whatsapp',
            'to'                => $to,
            'type'              => 'text',
            'text'              => ['body' => $body],
        ];
    }

    $url = 'https://graph.facebook.com/v20.0/' . urlencode($waPhoneId) . '/messages';
    $ch  = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $waToken,
            'Content-Type: application/json',
        ],
        CURLOPT_TIMEOUT        => 12,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $resp     = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr  = curl_error($ch);
    curl_close($ch);

    if ($curlErr) {
        return ['success' => false, 'message_id' => null, 'error' => 'curl: ' . $curlErr, 'error_code' => null];
    }

    $decoded = is_string($resp) ? @json_decode($resp, true) : null;

    if ($httpCode >= 200 && $httpCode < 300) {
        return [
            'success'    => true,
            'message_id' => $decoded['messages'][0]['id'] ?? null,
            'error'      => null,
            'error_code' => null,
        ];
    }

    return [
        'success'    => false,
        'message_id' => null,
        'error'      => $decoded['error']['message'] ?? (is_string($resp) ? substr($resp, 0, 240) : 'unknown error'),
        'error_code' => isset($decoded['error']['code']) ? (int)$decoded['error']['code'] : null,
    ];
}
