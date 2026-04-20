<?php
$db = getDB();
switch ($method) {
    case 'GET':
        if ($id) {
            $s = $db->prepare('SELECT * FROM email_templates WHERE id = ?');
            $s->execute([$id]);
            $row = $s->fetch();
            if (!$row) jsonError('Template not found', 404);
            jsonResponse($row);
        }
        jsonResponse($db->query('SELECT * FROM email_templates ORDER BY created_at DESC')->fetchAll());
        break;

    case 'POST':
        $d = getInput();
        if (empty($d['name']) || empty($d['subject']) || empty($d['body_html'])) {
            jsonError('name, subject, body_html required');
        }
        $s = $db->prepare('INSERT INTO email_templates (name, subject, body_html, body_text, from_name, from_email, niche) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $s->execute([
            $d['name'], $d['subject'], $d['body_html'],
            $d['body_text'] ?? null,
            $d['from_name'] ?? 'NetWebMedia',
            $d['from_email'] ?? 'carlos@netwebmedia.com',
            $d['niche'] ?? null,
        ]);
        jsonResponse(['id' => (int)$db->lastInsertId()], 201);
        break;

    case 'PUT':
        if (!$id) jsonError('ID required');
        $d = getInput();
        $fields = []; $params = [];
        foreach (['name','subject','body_html','body_text','from_name','from_email','niche'] as $f) {
            if (array_key_exists($f, $d)) { $fields[] = "$f = ?"; $params[] = $d[$f]; }
        }
        if (!$fields) jsonError('No fields to update');
        $params[] = $id;
        $db->prepare('UPDATE email_templates SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
        jsonResponse(['updated' => true]);
        break;

    case 'DELETE':
        if (!$id) jsonError('ID required');
        $db->prepare('DELETE FROM email_templates WHERE id = ?')->execute([$id]);
        jsonResponse(['deleted' => true]);
        break;

    default:
        jsonError('Method not allowed', 405);
}
