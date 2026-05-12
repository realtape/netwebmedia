<?php
require_once __DIR__ . '/lib/session.php';
require_once __DIR__ . '/lib/db.php';

sa_require();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST' || $method === 'PUT' || $method === 'DELETE') {
    $origin  = $_SERVER['HTTP_ORIGIN']  ?? '';
    $referer = $_SERVER['HTTP_REFERER'] ?? '';
    $allowed = 'https://admin.netwebmedia.com';
    if ($origin && $origin !== $allowed) sa_error('Forbidden', 403);
    if (!$origin && !str_starts_with($referer, $allowed)) sa_error('Forbidden', 403);
}

try { $db = getDB(); } catch (Exception $e) { sa_error('Database error', 500); }

if ($method === 'GET') {
    // Return stages list
    if (($_GET['r'] ?? '') === 'stages') {
        $stages = $db->query('SELECT * FROM pipeline_stages ORDER BY sort_order')->fetchAll();
        sa_json(['stages' => $stages]);
    }

    $search   = trim($_GET['q']       ?? '');
    $stage_id = (int)($_GET['stage']  ?? 0);

    $where  = [];
    $params = [];
    if ($search) {
        $like     = '%' . $search . '%';
        $where[]  = '(d.title LIKE ? OR d.company LIKE ?)';
        $params   = array_merge($params, [$like, $like]);
    }
    if ($stage_id) {
        $where[]  = 'd.stage_id = ?';
        $params[] = $stage_id;
    }

    $sql = 'SELECT d.id, d.title, d.company, d.value, d.probability, d.source,
                   d.next_action, d.next_followup_date, d.days_in_stage,
                   d.created_at, d.updated_at,
                   d.notes,
                   ps.name AS stage_name, ps.color AS stage_color,
                   c.name  AS contact_name, c.email AS contact_email
            FROM deals d
            LEFT JOIN pipeline_stages ps ON ps.id = d.stage_id
            LEFT JOIN contacts c         ON c.id  = d.contact_id';
    if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
    $sql .= ' ORDER BY d.updated_at DESC LIMIT 300';

    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    $total = (int)$db->query('SELECT COUNT(*) FROM deals')->fetchColumn();
    $byStage = $db->query(
        'SELECT ps.name, COUNT(d.id) AS cnt, SUM(d.value) AS total_value
         FROM deals d
         LEFT JOIN pipeline_stages ps ON ps.id = d.stage_id
         GROUP BY d.stage_id, ps.name ORDER BY ps.sort_order'
    )->fetchAll();

    sa_json(['deals' => $stmt->fetchAll(), 'total' => $total, 'byStage' => $byStage]);
}

if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int)($data['id'] ?? 0);
    if (!$id) sa_error('Deal ID required');

    $ALLOWED_FIELDS = ['title', 'company', 'value', 'stage_id', 'probability',
                       'source', 'next_action', 'next_followup_date', 'notes'];
    $updates = [];
    $params  = [];
    foreach ($ALLOWED_FIELDS as $f) {
        if (array_key_exists($f, $data)) {
            $updates[] = "`$f` = ?";
            $params[]  = $data[$f] === '' ? null : $data[$f];
        }
    }
    if (!$updates) sa_error('Nothing to update');
    $params[] = $id;
    $db->prepare('UPDATE deals SET ' . implode(', ', $updates) . ' WHERE id = ?')->execute($params);
    sa_json(['ok' => true]);
}

sa_error('Method not allowed', 405);
