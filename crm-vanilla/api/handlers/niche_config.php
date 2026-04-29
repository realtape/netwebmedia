<?php
/**
 * Niche configuration endpoint.
 *
 * GET  /api/?r=niche_config                  → all 14 niches (labels, stages, fields)
 * GET  /api/?r=niche_config&niche=automotive → single niche config
 * POST /api/?r=niche_config&action=seed&token=NWM_SEED_2026
 *        → inserts niche_pipeline_stages + niche_custom_fields from niches.php config
 */

$niches = require __DIR__ . '/../config/niches.php';

/* ── GET: return config ─────────────────────────────────────────────── */
if ($method === 'GET') {
    $key = $_GET['niche'] ?? null;
    if ($key !== null) {
        if (!isset($niches[$key])) jsonError("Unknown niche: $key", 404);
        jsonResponse(['niche' => $key, 'config' => $niches[$key]]);
    }
    // Return all niches with their labels + field/stage counts
    $out = [];
    foreach ($niches as $k => $cfg) {
        $out[$k] = [
            'label'         => $cfg['label'],
            'stage_count'   => count($cfg['pipeline_stages']),
            'field_count'   => count($cfg['custom_fields']),
            'pipeline_stages' => $cfg['pipeline_stages'],
            'custom_fields'   => $cfg['custom_fields'],
        ];
    }
    jsonResponse(['niches' => $out, 'total' => count($out)]);
}

/* ── POST: seed niche tables ────────────────────────────────────────── */
if ($method === 'POST') {
    $action = $_GET['action'] ?? 'seed';
    if (!hash_equals(SEED_TOKEN, (string)($_GET['token'] ?? ''))) jsonError('Invalid token', 403);
    if ($action !== 'seed') jsonError("Unknown action: $action", 400);

    $db = getDB();

    // Ensure tables exist
    $db->exec("CREATE TABLE IF NOT EXISTS niche_pipeline_stages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        niche VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        sort_order INT DEFAULT 0,
        color VARCHAR(7) DEFAULT '#6366f1',
        probability INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_niche (niche)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $db->exec("CREATE TABLE IF NOT EXISTS niche_custom_fields (
        id INT AUTO_INCREMENT PRIMARY KEY,
        niche VARCHAR(100) NOT NULL,
        field_key VARCHAR(100) NOT NULL,
        field_label VARCHAR(255) NOT NULL,
        field_type ENUM('text','number','select','date','boolean','url') DEFAULT 'text',
        required TINYINT(1) DEFAULT 0,
        options JSON NULL,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_niche_field (niche, field_key),
        INDEX idx_niche (niche)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $stmtStage = $db->prepare(
        "INSERT IGNORE INTO niche_pipeline_stages (niche, name, sort_order, color, probability)
         VALUES (?, ?, ?, ?, ?)"
    );
    $stmtField = $db->prepare(
        "INSERT INTO niche_custom_fields (niche, field_key, field_label, field_type, required, options, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           field_label = VALUES(field_label),
           field_type  = VALUES(field_type),
           required    = VALUES(required),
           options     = VALUES(options),
           sort_order  = VALUES(sort_order)"
    );

    $results = [];
    foreach ($niches as $key => $cfg) {
        $stages  = 0;
        $fields  = 0;
        $errors  = [];

        foreach ($cfg['pipeline_stages'] as $s) {
            try {
                $stmtStage->execute([$key, $s['name'], $s['sort_order'], $s['color'], $s['probability']]);
                $stages++;
            } catch (Throwable $e) {
                $errors[] = "stage:{$s['name']} → " . $e->getMessage();
            }
        }

        foreach ($cfg['custom_fields'] as $f) {
            try {
                $opts = isset($f['options']) && is_array($f['options'])
                    ? json_encode($f['options'])
                    : null;
                $stmtField->execute([
                    $key, $f['field_key'], $f['field_label'],
                    $f['field_type'], $f['required'] ? 1 : 0,
                    $opts, $f['sort_order'],
                ]);
                $fields++;
            } catch (Throwable $e) {
                $errors[] = "field:{$f['field_key']} → " . $e->getMessage();
            }
        }

        $results[$key] = [
            'label'  => $cfg['label'],
            'stages' => $stages,
            'fields' => $fields,
            'errors' => $errors,
        ];
    }

    $totalStages = (int)$db->query("SELECT COUNT(*) FROM niche_pipeline_stages")->fetchColumn();
    $totalFields = (int)$db->query("SELECT COUNT(*) FROM niche_custom_fields")->fetchColumn();

    jsonResponse([
        'seeded'        => $results,
        'total_stages'  => $totalStages,
        'total_fields'  => $totalFields,
    ]);
}

jsonError('Method not allowed', 405);
