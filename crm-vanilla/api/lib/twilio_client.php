<?php
/**
 * Minimal Twilio REST helper — no SDK dependency.
 *
 * twilio_send($to, $body, $channel)
 *   $channel: 'sms' | 'whatsapp'
 *   Returns the Twilio MessageSid on success, false on failure.
 */

function twilio_send(string $to, string $body, string $channel = 'sms'): string|false {
    if (!defined('TWILIO_ACCOUNT_SID') || TWILIO_ACCOUNT_SID === '') return false;
    if (!defined('TWILIO_AUTH_TOKEN')  || TWILIO_AUTH_TOKEN  === '') return false;

    $from = ($channel === 'whatsapp')
        ? 'whatsapp:' . (defined('TWILIO_FROM_WHATSAPP') ? TWILIO_FROM_WHATSAPP : '')
        : (defined('TWILIO_FROM_SMS') ? TWILIO_FROM_SMS : '');

    $toAddr = ($channel === 'whatsapp') ? 'whatsapp:' . $to : $to;

    $url = 'https://api.twilio.com/2010-04-01/Accounts/' . TWILIO_ACCOUNT_SID . '/Messages.json';

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_USERPWD        => TWILIO_ACCOUNT_SID . ':' . TWILIO_AUTH_TOKEN,
        CURLOPT_POSTFIELDS     => http_build_query(['From' => $from, 'To' => $toAddr, 'Body' => $body]),
        CURLOPT_TIMEOUT        => 15,
    ]);
    $raw  = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($code === 201) {
        $resp = json_decode($raw, true);
        return $resp['sid'] ?? false;
    }
    return false;
}

/**
 * Validate that a POST came from Twilio by checking X-Twilio-Signature.
 * Call before processing any webhook. Returns true if valid or if AUTH_TOKEN not set.
 */
function twilio_validate_signature(): bool {
    if (!defined('TWILIO_AUTH_TOKEN') || TWILIO_AUTH_TOKEN === '') return true;

    $sig  = $_SERVER['HTTP_X_TWILIO_SIGNATURE'] ?? '';
    $url  = (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
    $params = $_POST;
    ksort($params);
    $str = $url . implode('', array_map(fn($k, $v) => $k . $v, array_keys($params), $params));
    $expected = base64_encode(hash_hmac('sha1', $str, TWILIO_AUTH_TOKEN, true));
    return hash_equals($expected, $sig);
}
