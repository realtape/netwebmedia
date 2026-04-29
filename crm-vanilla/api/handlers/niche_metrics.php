<?php
/**
 * Niche KPI values — per-contact metric tracking.
 *
 * GET  /api/?r=niche_metrics&contact_id=N              → all KPIs for a contact
 * GET  /api/?r=niche_metrics&contact_id=N&niche=auto   → KPIs + definitions for niche
 * POST /api/?r=niche_metrics                           → upsert a KPI value
 * DELETE /api/?r=niche_metrics&id=N                   → delete a KPI record
 */

require_once __DIR__ . '/../lib/tenancy.php';
$niches = require __DIR__ . '/../config/niches.php';
$db     = getDB();

/**
 * Returns true if the current tenant can see/edit the given contact.
 * Post-migration: contact must belong to the current org.
 * Pre-migration: legacy user_id check.
 */
$canTouchContact = function(int $contactId) use ($db): bool {
    [$where, $params] = tenancy_where();
    $sql = 'SELECT id FROM contacts WHERE id = ?';
    $p = [$contactId];
    if ($where) { $sql .= ' AND ' . $where; $p = array_merge($p, $params); }
    $st = $db->prepare($sql);
    $st->execute($p);
    return (bool)$st->fetch();
};

switch ($method) {

    case 'GET':
        $contactId = isset($_GET['contact_id']) ? (int)$_GET['contact_id'] : null;
        if (!$contactId) jsonError('contact_id required', 400);
        if (!$canTouchContact($contactId)) jsonError('Contact not found', 404);

        $nicheKey = $_GET['niche'] ?? null;

        // Fetch stored values for this contact
        if ($nicheKey) {
            $stmt = $db->prepare(
                'SELECT * FROM niche_kpi_values WHERE contact_id = ? AND niche = ? ORDER BY recorded_date DESC'
            );
            $stmt->execute([$contactId, $nicheKey]);
        } else {
            $stmt = $db->prepare(
                'SELECT * FROM niche_kpi_values WHERE contact_id = ? ORDER BY niche, recorded_date DESC'
            );
            $stmt->execute([$contactId]);
        }
        $rows = $stmt->fetchAll();

        // Group by niche:kpi_key — prevents same key name across niches from colliding
        $grouped = [];
        foreach ($rows as $r) {
            $k = $r['niche'] . ':' . $r['kpi_key'];
            if (!isset($grouped[$k])) {
                $grouped[$k] = ['current' => $r, 'history' => [], 'niche' => $r['niche'], 'kpi_key' => $r['kpi_key']];
            } else {
                $grouped[$k]['history'][] = $r;
            }
        }

        // Attach KPI definitions from config if niche specified
        $definitions = [];
        if ($nicheKey && isset($niches[$nicheKey]['kpis'])) {
            foreach ($niches[$nicheKey]['kpis'] as $kpi) {
                $key = $kpi['key'];
                $definitions[$key] = $kpi;
                // Compute trend if we have 2+ data points
                if (isset($grouped[$key])) {
                    $cur  = (float)($grouped[$key]['current']['value_num'] ?? 0);
                    $prev = isset($grouped[$key]['history'][0])
                        ? (float)($grouped[$key]['history'][0]['value_num'] ?? 0)
                        : null;
                    $grouped[$key]['trend'] = ($prev !== null && $prev != 0)
                        ? round((($cur - $prev) / $prev) * 100, 1)
                        : null;
                    $grouped[$key]['definition'] = $kpi;
                }
            }
        }

        jsonResponse([
            'contact_id'  => $contactId,
            'niche'       => $nicheKey,
            'definitions' => $nicheKey ? ($niches[$nicheKey]['kpis'] ?? []) : [],
            'kpis'        => $grouped,
        ]);
        break;

    case 'POST':
        $d = getInput();
        $required = ['contact_id', 'niche', 'kpi_key', 'recorded_date'];
        foreach ($required as $f) {
            if (empty($d[$f])) jsonError("$f required", 400);
        }

        if (!$canTouchContact((int)$d['contact_id'])) jsonError('Contact not found', 404);

        // Validate niche
        if (!isset($niches[$d['niche']])) jsonError('Unknown niche: ' . $d['niche'], 400);

        // Validate kpi_key belongs to that niche
        $validKeys = array_column($niches[$d['niche']]['kpis'], 'key');
        if (!in_array($d['kpi_key'], $validKeys, true)) {
            jsonError('kpi_key ' . $d['kpi_key'] . ' not defined for niche ' . $d['niche'], 400);
        }

        $stmt = $db->prepare(
            'INSERT INTO niche_kpi_values (contact_id, niche, kpi_key, value_num, value_text, recorded_date)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               value_num  = VALUES(value_num),
               value_text = VALUES(value_text),
               updated_at = CURRENT_TIMESTAMP'
        );
        $stmt->execute([
            (int)$d['contact_id'],
            $d['niche'],
            $d['kpi_key'],
            isset($d['value_num'])  ? (float)$d['value_num']   : null,
            $d['value_text'] ?? null,
            $d['recorded_date'],
        ]);

        jsonResponse(['upserted' => true, 'id' => (int)$db->lastInsertId()], 201);
        break;

    case 'DELETE':
        if (!$id) jsonError('ID required', 400);
        // Verify the row belongs to a contact this tenant owns.
        $look = $db->prepare('SELECT contact_id FROM niche_kpi_values WHERE id = ?');
        $look->execute([$id]);
        $row = $look->fetch();
        if (!$row) jsonError('KPI not found', 404);
        if (!$canTouchContact((int)$row['contact_id'])) jsonError('KPI not found', 404);
        $db->prepare('DELETE FROM niche_kpi_values WHERE id = ?')->execute([$id]);
        jsonResponse(['deleted' => true]);
        break;

    default:
        jsonError('Method not allowed', 405);
}
