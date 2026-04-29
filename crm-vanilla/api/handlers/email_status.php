<?php
/**
 * Diagnostic: reports email subsystem readiness WITHOUT exposing secrets.
 * GET /api/?r=email_status
 */
require_once __DIR__ . '/../lib/tenancy.php';

$resendConfigured = defined('RESEND_API_KEY') && RESEND_API_KEY !== '' && strpos(RESEND_API_KEY, 're_') === 0;
$db = getDB();

// Org-scope each count post-migration; pre-migration it remains a global view.
// email_templates / email_campaigns gained user_id earlier so tenancy_where()
// would compose; we use org_where() directly here because campaign_sends and
// unsubscribes have no user_id and we want the same scope across all four.
$ow = ''; $owp = [];
if (is_org_schema_applied()) { [$ow, $owp] = org_where(); }
$whr = $ow ? ' WHERE ' . $ow : '';

$run = function (string $sql) use ($db, $owp) {
    $st = $db->prepare($sql);
    $st->execute($owp);
    return $st;
};

$tplCount   = (int)$run("SELECT COUNT(*) FROM email_templates" . $whr)->fetchColumn();
$campCount  = (int)$run("SELECT COUNT(*) FROM email_campaigns" . $whr)->fetchColumn();
$sendCount  = (int)$run("SELECT COUNT(*) FROM campaign_sends" . $whr)->fetchColumn();
$unsubCount = (int)$run("SELECT COUNT(*) FROM unsubscribes"  . $whr)->fetchColumn();

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
