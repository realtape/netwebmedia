<?php
/**
 * Diagnostic + filter for marketing readiness:
 *
 *   - Email-marketing ready  = identifiable biz + first-name parseable + email
 *                              domain has MX record (best-effort)
 *   - WhatsApp ready          = identifiable biz + valid phone digits
 *                              normalizable to E.164 (10 digits US, 8-9 Chile mobile)
 *
 * GET  /api/?r=filter_marketing_ready&token=NWM_FILTER_ID_2026
 *      → returns counts only (read-only diagnostic, never writes)
 *      → optional &check_mx=1&sample=200 will MX-validate a sample of 200
 *        random domains and report % live (slow — uses checkdnsrr)
 *
 * NOTE: This handler is intentionally read-only. Use it before any bulk
 * email or WhatsApp send to know what your real reachable universe is.
 */
if ($method !== 'GET') jsonError('Use GET (read-only)', 405);

$TOKEN = defined('FILTER_ID_TOKEN') ? FILTER_ID_TOKEN : 'NWM_FILTER_ID_2026';
if (!hash_equals($TOKEN, (string)($_GET['token'] ?? ''))) jsonError('Invalid token', 403);

$db = getDB();
$total = (int)$db->query("SELECT COUNT(*) FROM contacts")->fetchColumn();

/* ── 1. Email-marketing ready ─────────────────────────────────────────────
 *    Identifiable business contacts with a parseable first name.
 *    (Identifiable filter has already been run, so we just need name parse.)
 */
$emailReady = (int)$db->query("
    SELECT COUNT(*) FROM contacts
    WHERE email IS NOT NULL AND email LIKE '%@%'
      AND company IS NOT NULL AND TRIM(company) <> ''
      AND name IS NOT NULL AND TRIM(name) <> ''
      AND CHAR_LENGTH(SUBSTRING_INDEX(TRIM(name),' ',1)) >= 2
")->fetchColumn();

/* ── 2. WhatsApp ready ────────────────────────────────────────────────────
 *    Phone has at least 8 digits (after stripping non-digits).
 *    Country can be inferred from segment (usa_* → +1, chile_* → +56).
 */
$waReady = (int)$db->query("
    SELECT COUNT(*) FROM contacts
    WHERE phone IS NOT NULL
      AND CHAR_LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '')) >= 8
      AND segment IS NOT NULL
")->fetchColumn();

/* USA breakdown */
$waUsa = (int)$db->query("
    SELECT COUNT(*) FROM contacts
    WHERE segment LIKE 'usa%'
      AND CHAR_LENGTH(REGEXP_REPLACE(IFNULL(phone,''), '[^0-9]', '')) BETWEEN 10 AND 11
")->fetchColumn();

$waChile = (int)$db->query("
    SELECT COUNT(*) FROM contacts
    WHERE segment LIKE 'chile%'
      AND CHAR_LENGTH(REGEXP_REPLACE(IFNULL(phone,''), '[^0-9]', '')) >= 8
")->fetchColumn();

/* ── 3. Optional: MX record sampling ─────────────────────────────────────
 *    For a sample of N random distinct email domains, check if MX exists.
 *    Cheap proxy for "can this domain receive mail at all".
 */
$mxResult = null;
if (!empty($_GET['check_mx'])) {
    $sampleSize = max(10, min(500, (int)($_GET['sample'] ?? 200)));
    $rows = $db->query("
        SELECT DISTINCT LOWER(SUBSTRING_INDEX(email,'@',-1)) AS d
        FROM contacts
        WHERE email LIKE '%@%'
        ORDER BY RAND()
        LIMIT $sampleSize
    ")->fetchAll(PDO::FETCH_COLUMN);

    $live = 0; $dead = 0;
    foreach ($rows as $domain) {
        if (!$domain) { $dead++; continue; }
        if (checkdnsrr($domain, 'MX') || checkdnsrr($domain, 'A')) $live++;
        else $dead++;
    }
    $mxResult = [
        'sample_size'    => count($rows),
        'domains_live'   => $live,
        'domains_dead'   => $dead,
        'live_pct'       => count($rows) ? round(100*$live/count($rows), 1) : 0,
        'projected_reachable' => count($rows) ? (int)round($total * ($live/count($rows))) : 0,
    ];
}

jsonResponse([
    'total_contacts'        => $total,
    'email_marketing_ready' => $emailReady,
    'whatsapp_ready'        => $waReady,
    'whatsapp_usa'          => $waUsa,
    'whatsapp_chile'        => $waChile,
    'mx_sample'             => $mxResult,
    'note'                  => 'WhatsApp cold messaging requires opt-in under Meta policy. Use email-first; reserve WhatsApp for replies + opted-in customers.',
]);
