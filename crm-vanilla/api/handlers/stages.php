<?php
require_once __DIR__ . '/../lib/tenancy.php';
$db = getDB();

switch ($method) {
    case 'GET':
        // pipeline_stages had no user_id pre-org-migration — it was a single global
        // pipeline. Post-migration each org can define its own; filter by org_where.
        // Pre-migration: keep the original "list everything" behaviour.
        if (is_org_schema_applied()) {
            [$where, $params] = org_where();
            $sql = 'SELECT * FROM pipeline_stages';
            if ($where) { $sql .= ' WHERE ' . $where; }
            $sql .= ' ORDER BY sort_order';
            $st = $db->prepare($sql);
            $st->execute($params);
            jsonResponse($st->fetchAll());
        }
        $stmt = $db->query('SELECT * FROM pipeline_stages ORDER BY sort_order');
        jsonResponse($stmt->fetchAll());
        break;

    default:
        jsonError('Method not allowed', 405);
}
