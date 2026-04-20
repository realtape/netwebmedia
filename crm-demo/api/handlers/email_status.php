<?php
/**
 * Diagnostic: reports email subsystem readiness WITHOUT exposing secrets.
 * GET /api/?r=email_status
 */
$resendConfigured = defined('RESEND_API_KEY') && RESEND_API_KEY !== '' && strpos(RESEND_API_KEY, 're_') === 0;
$db = getDB();

$tplCount = (int)$db->query("SELECT COUNT(*) FROM email_templates")->fetchColumn();
$campCount = (int)$db->query("SELECT COUNT(*) FROM email_campaigns")->fetchColumn();
$sendCount = (int)$db->query("SELECT COUNT(*) FROM campaign_sends")->fetchColumn();
$unsubCount = (int)$db->query("SELECT COUNT(*) FROM unsubscribes")->fetchColumn();

// Lightweight Resend ping: GET /domains (fails fast if key invalid) — only if configured
$resendDomainStatus = null;
if ($resendConfigured) {
    $ch = curl_init('https://api.resend.com/domains');
    curl_setopt_array($ch, [
        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . RESEND_API_KEY],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_CONNECTTIMEOUT => 4,
    ]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $data = json_decode($resp, true);
    if ($code === 200 && isset($data['data'])) {
        $domains = [];
        foreach ($data['data'] as $d) {
            $domains[] = [
                'name'   => $d['name'] ?? '?',
                'status' => $d['status'] ?? '?',
                'region' => $d['region'] ?? '?',
            ];
        }
        $resendDomainStatus = ['ok' => true, 'domains' => $domains];
    } else {
        $resendDomainStatus = ['ok' => false, 'http' => $code, 'err' => $data['message'] ?? substr((string)$resp, 0, 200)];
    }
}

jsonResponse([
    'resend_api_key_present' => $resendConfigured,
    'templates'  => $tplCount,
    'campaigns'  => $campCount,
    'sends'      => $sendCount,
    'unsubs'     => $unsubCount,
    'resend_domain_status' => $resendDomainStatus,
    'expected_sender' => 'NetWebMedia <newsletter@netwebmedia.com>',
]);
