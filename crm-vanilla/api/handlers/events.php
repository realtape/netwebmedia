<?php
require_once __DIR__ . '/../lib/tenancy.php';
$db = getDB();
[$tWhere, $tParams] = tenancy_where();
$uid = tenant_id();
$orgId = is_org_schema_applied() ? current_org_id() : null;

switch ($method) {
    case 'GET':
        if ($id) {
            $sql = 'SELECT * FROM events WHERE id = ?';
            $params = [$id];
            if ($tWhere) { $sql .= ' AND ' . $tWhere; $params = array_merge($params, $tParams); }
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $event = $stmt->fetch();
            if (!$event) jsonError('Event not found', 404);
            jsonResponse($event);
        }
        $where = [];
        $params = [];
        if ($tWhere) { $where[] = $tWhere; $params = array_merge($params, $tParams); }
        if (!empty($_GET['from']) && !empty($_GET['to'])) {
            $where[] = 'event_date BETWEEN ? AND ?';
            $params[] = $_GET['from'];
            $params[] = $_GET['to'];
        }
        $sql = 'SELECT * FROM events';
        if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
        $sql .= ' ORDER BY event_date, start_hour';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        jsonResponse($stmt->fetchAll());
        break;

    case 'POST':
        $data = getInput();
        if (empty($data['title']) || empty($data['event_date'])) {
            jsonError('title and event_date required');
        }
        if ($orgId !== null) {
            $stmt = $db->prepare('INSERT INTO events (user_id, organization_id, title, event_date, start_hour, duration, type, color, contact_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([
                $uid,
                $orgId,
                $data['title'],
                $data['event_date'],
                $data['start_hour'] ?? 9,
                $data['duration'] ?? 1,
                $data['type'] ?? 'meeting',
                $data['color'] ?? '#6c5ce7',
                $data['contact_id'] ?? null,
                $data['notes'] ?? null,
            ]);
        } else {
            $stmt = $db->prepare('INSERT INTO events (user_id, title, event_date, start_hour, duration, type, color, contact_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([
                $uid,
                $data['title'],
                $data['event_date'],
                $data['start_hour'] ?? 9,
                $data['duration'] ?? 1,
                $data['type'] ?? 'meeting',
                $data['color'] ?? '#6c5ce7',
                $data['contact_id'] ?? null,
                $data['notes'] ?? null,
            ]);
        }
        $newId = $db->lastInsertId();
        $stmt = $db->prepare('SELECT * FROM events WHERE id = ?');
        $stmt->execute([$newId]);
        jsonResponse($stmt->fetch(), 201);
        break;

    case 'PUT':
        if (!$id) jsonError('ID required');
        $checkSql = 'SELECT id FROM events WHERE id = ?';
        $checkParams = [$id];
        if ($tWhere) { $checkSql .= ' AND ' . $tWhere; $checkParams = array_merge($checkParams, $tParams); }
        $own = $db->prepare($checkSql);
        $own->execute($checkParams);
        if (!$own->fetch()) jsonError('Event not found', 404);

        $data = getInput();
        $fields = [];
        $params = [];
        $allowed = ['title','event_date','start_hour','duration','type','color','contact_id','notes'];
        foreach ($allowed as $f) {
            if (array_key_exists($f, $data)) {
                $fields[] = "$f = ?";
                $params[] = $data[$f];
            }
        }
        if (empty($fields)) jsonError('No fields to update');
        $params[] = $id;
        $updSql = 'UPDATE events SET ' . implode(', ', $fields) . ' WHERE id = ?';
        if ($tWhere) { $updSql .= ' AND ' . $tWhere; $params = array_merge($params, $tParams); }
        $db->prepare($updSql)->execute($params);
        $stmt = $db->prepare('SELECT * FROM events WHERE id = ?');
        $stmt->execute([$id]);
        jsonResponse($stmt->fetch());
        break;

    case 'DELETE':
        if (!$id) jsonError('ID required');
        $checkSql = 'SELECT id FROM events WHERE id = ?';
        $checkParams = [$id];
        if ($tWhere) { $checkSql .= ' AND ' . $tWhere; $checkParams = array_merge($checkParams, $tParams); }
        $own = $db->prepare($checkSql);
        $own->execute($checkParams);
        if (!$own->fetch()) jsonError('Event not found', 404);
        $delSql = 'DELETE FROM events WHERE id = ?';
        $delParams = [$id];
        if ($tWhere) { $delSql .= ' AND ' . $tWhere; $delParams = array_merge($delParams, $tParams); }
        $db->prepare($delSql)->execute($delParams);
        jsonResponse(['deleted' => true]);
        break;

    default:
        jsonError('Method not allowed', 405);
}
