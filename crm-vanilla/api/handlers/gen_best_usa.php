<?php
/**
 * Generate best USA contact list by niche priority.
 *
 * Niche priority for NetWebMedia (highest LTV first):
 *   1 financial_services   6 events_weddings  11 home_services
 *   2 law_firms            7 smb              12 wine_agriculture
 *   3 real_estate          8 tourism          13 automotive
 *   4 health               9 beauty           14 education
 *   5 restaurants         10 local_specialist  15 (anything else)
 *
 * GET /api/?r=gen_best_usa&token=NWM_GEN_BEST_2026
 *   → Dry-run: returns niche breakdown + count. No DB writes.
 *
 * GET /api/?r=gen_best_usa&token=NWM_GEN_BEST_2026&run=1[&limit=30000]
 *   → Tags top N identifiable USA contacts with segment='usa_best_30k'.
 *     Clears previous usa_best_30k tags first (clean slate per run).
 *     Returns: tagged count + niche breakdown.
 *
 * GET /api/?r=gen_best_usa&token=NWM_GEN_BEST_2026&format=csv[&limit=30000]
 *   → Streams top N contacts as a downloadable CSV (runs live SELECT, no DB write).
 */
if ($method !== 'GET') jsonError('Use GET', 405);
if (!hash_equals(GEN_BEST_TOKEN, (string)($_GET['token'] ?? ''))) jsonError('Invalid token', 403);
require_once __DIR__ . '/../lib/tenancy.php';
pin_org_to_master();

set_time_limit(300);

$db     = getDB();
$limit  = max(1000, min(60000, (int)($_GET['limit'] ?? 30000)));
$run    = !empty($_GET['run']);
$csv    = (($_GET['format'] ?? '') === 'csv');

// Free consumer domains to exclude (identifiable-business filter)
$freeDomains = [
    'gmail.com','googlemail.com',
    'yahoo.com','yahoo.com.mx','yahoo.com.ar','yahoo.es','ymail.com',
    'hotmail.com','hotmail.es','hotmail.cl','hotmail.co.uk',
    'outlook.com','outlook.es',
    'live.com','live.cl','live.com.ar',
    'icloud.com','me.com','mac.com',
    'aol.com','msn.com',
];
$fdPH = implode(',', array_fill(0, count($freeDomains), '?'));

// Niche priority via JSON_EXTRACT on the notes column
$nicheCase = "
    CASE COALESCE(JSON_UNQUOTE(JSON_EXTRACT(notes, '$.niche_key')), 'unknown')
        WHEN 'financial_services' THEN 1
        WHEN 'law_firms'          THEN 2
        WHEN 'real_estate'        THEN 3
        WHEN 'health'             THEN 4
        WHEN 'restaurants'        THEN 5
        WHEN 'events_weddings'    THEN 6
        WHEN 'smb'                THEN 7
        WHEN 'tourism'            THEN 8
        WHEN 'beauty'             THEN 9
        WHEN 'local_specialist'   THEN 10
        WHEN 'home_services'      THEN 11
        WHEN 'wine_agriculture'   THEN 12
        WHEN 'automotive'         THEN 13
        WHEN 'education'          THEN 14
        ELSE 15
    END";

// Base WHERE clause: USA segment + identifiable business quality filter
$baseWhere = "
    segment LIKE 'usa%'
    AND segment != 'usa_best_30k'
    AND email IS NOT NULL AND TRIM(email) != '' AND email LIKE '%@%'
    AND company IS NOT NULL AND TRIM(company) != ''
    AND LOWER(SUBSTRING_INDEX(TRIM(email),'@',-1)) NOT IN ($fdPH)
";

// ── CSV export ────────────────────────────────────────────────────────────────
if ($csv) {
    $stmt = $db->prepare("
        SELECT
            name, email, phone, company,
            COALESCE(JSON_UNQUOTE(JSON_EXTRACT(notes, '$.niche_key')), '') AS niche,
            COALESCE(JSON_UNQUOTE(JSON_EXTRACT(notes, '$.niche')),     '') AS niche_label,
            COALESCE(JSON_UNQUOTE(JSON_EXTRACT(notes, '$.state')),     '') AS state,
            COALESCE(JSON_UNQUOTE(JSON_EXTRACT(notes, '$.city')),      '') AS city,
            COALESCE(JSON_UNQUOTE(JSON_EXTRACT(notes, '$.website')),   '') AS website,
            segment
        FROM contacts
        WHERE $baseWhere
        ORDER BY $nicheCase ASC, id ASC
        LIMIT ?
    ");
    $stmt->execute(array_merge($freeDomains, [$limit]));

    // Stream CSV directly to the browser
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="usa_best_' . $limit . '_' . date('Ymd') . '.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['name','email','phone','company','niche','niche_label','state','city','website','segment']);
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        fputcsv($out, $row);
    }
    fclose($out);
    exit;
}

// ── Count breakdown by niche (dry-run or pre-tag) ────────────────────────────
$countStmt = $db->prepare("
    SELECT
        COALESCE(JSON_UNQUOTE(JSON_EXTRACT(notes, '$.niche_key')), 'unknown') AS niche,
        COUNT(*) AS cnt
    FROM contacts
    WHERE $baseWhere
    GROUP BY niche
    ORDER BY MIN($nicheCase) ASC, cnt DESC
");
$countStmt->execute($freeDomains);
$nicheCounts = [];
$totalIdentifiable = 0;
while ($r = $countStmt->fetch(PDO::FETCH_ASSOC)) {
    $nicheCounts[$r['niche']] = (int)$r['cnt'];
    $totalIdentifiable += (int)$r['cnt'];
}

// Running total to show what fits in the limit (in priority order)
$cumulCount = 0;
$nicheInLimit = [];
foreach ($nicheCounts as $niche => $cnt) {
    $take = min($cnt, $limit - $cumulCount);
    if ($take <= 0) break;
    $nicheInLimit[$niche] = $take;
    $cumulCount += $take;
}

if (!$run) {
    // Dry-run — report only
    jsonResponse([
        'dry_run'              => true,
        'limit'                => $limit,
        'total_identifiable'   => $totalIdentifiable,
        'would_tag'            => $cumulCount,
        'by_niche_identifiable'=> $nicheCounts,
        'by_niche_in_limit'    => $nicheInLimit,
        'hint'                 => 'Add &run=1 to tag contacts. Add &format=csv to download.',
    ]);
}

// ── Tag top N ─────────────────────────────────────────────────────────────────

// 1. Clear previous tags so we get a clean slate
$db->exec("UPDATE contacts SET segment = CONCAT('usa_', LOWER(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(notes, '$.state_code')), 'us'))) WHERE segment = 'usa_best_30k'");

// 2. Fetch the top-N IDs in priority order using a subquery alias (MySQL UPDATE restriction)
$idStmt = $db->prepare("
    SELECT id FROM contacts
    WHERE $baseWhere
    ORDER BY $nicheCase ASC, id ASC
    LIMIT ?
");
$idStmt->execute(array_merge($freeDomains, [$limit]));
$ids = $idStmt->fetchAll(PDO::FETCH_COLUMN);

// 3. Update in chunks of 500 to avoid oversized IN() clauses
$tagged = 0;
foreach (array_chunk($ids, 500) as $chunk) {
    $ph  = implode(',', array_fill(0, count($chunk), '?'));
    $upd = $db->prepare("UPDATE contacts SET segment = 'usa_best_30k' WHERE id IN ($ph)");
    $upd->execute($chunk);
    $tagged += $upd->rowCount();
}

jsonResponse([
    'dry_run'              => false,
    'limit'                => $limit,
    'total_identifiable'   => $totalIdentifiable,
    'tagged'               => $tagged,
    'by_niche_tagged'      => $nicheInLimit,
    'segment_tag'          => 'usa_best_30k',
    'csv_url'              => '?r=gen_best_usa&token=' . urlencode(GEN_BEST_TOKEN) . '&format=csv&limit=' . $limit,
    'hint'                 => 'Filter contacts in CRM with segment=usa_best_30k. Download CSV via csv_url.',
]);
