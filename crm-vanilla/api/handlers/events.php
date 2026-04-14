<?php
$db = getDB();

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $db->prepare('SELECT * FROM events WHERE id = ?');
            $stmt->execute([$id]);
            $event = $stmt->fetch();
            if (!$event) jsonError('Event not found', 404);
            jsonResponse($event);
        }
        $where = [];
        $params = [];
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
        $stmt = $db->prepare('INSERT INTO events (title, event_date, start_hour, duration, type, color, contact_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $data['title'],
            $data['event_date'],
            $data['start_hour'] ?? 9,
            $data['duration'] ?? 1,
            $data['type'] ?? 'meeting',
            $data['color'] ?? '#6c5ce7',
            $data['contact_id'] ?? null,
            $data['notes'] ?? null,
        ]);
        $newId = $db->lastInsertId();
        $stmt = $db->prepare('SELECT * FROM events WHERE id = ?');
        $stmt->execute([$newId]);
        jsonResponse($stmt->fetch(), 201);
        break;

    case 'PUT':
        if (!$id) jsonError('ID required');
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
        $db->prepare('UPDATE events SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
        $stmt = $db->prepare('SELECT * FROM events WHERE id = ?');
        $stmt->execute([$id]);
        jsonResponse($stmt->fetch());
        break;

    case 'DELETE':
        if (!$id) jsonError('ID required');
        $db->prepare('DELETE FROM events WHERE id = ?')->execute([$id]);
        jsonResponse(['deleted' => true]);
        break;

    default:
        jsonError('Method not allowed', 405);
}
