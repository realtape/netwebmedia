<?php
$db = getDB();

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $db->prepare('SELECT * FROM contacts WHERE id = ?');
            $stmt->execute([$id]);
            $contact = $stmt->fetch();
            if (!$contact) jsonError('Contact not found', 404);
            jsonResponse($contact);
        }
        // List with optional filters
        $where = [];
        $params = [];
        if (!empty($_GET['status'])) {
            $where[] = 'status = ?';
            $params[] = $_GET['status'];
        }
        if (!empty($_GET['search'])) {
            $where[] = '(name LIKE ? OR company LIKE ? OR email LIKE ?)';
            $s = '%' . $_GET['search'] . '%';
            $params = array_merge($params, [$s, $s, $s]);
        }
        $sql = 'SELECT * FROM contacts';
        if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
        $sql .= ' ORDER BY created_at DESC';

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        jsonResponse($stmt->fetchAll());
        break;

    case 'POST':
        $data = getInput();
        if (empty($data['name'])) jsonError('Name is required');
        $stmt = $db->prepare('INSERT INTO contacts (name, email, phone, company, role, status, value, last_contact, avatar, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $data['name'],
            $data['email'] ?? null,
            $data['phone'] ?? null,
            $data['company'] ?? null,
            $data['role'] ?? null,
            $data['status'] ?? 'lead',
            $data['value'] ?? 0,
            $data['last_contact'] ?? null,
            $data['avatar'] ?? null,
            $data['notes'] ?? null,
        ]);
        $newId = $db->lastInsertId();
        $stmt = $db->prepare('SELECT * FROM contacts WHERE id = ?');
        $stmt->execute([$newId]);
        jsonResponse($stmt->fetch(), 201);
        break;

    case 'PUT':
        if (!$id) jsonError('ID required for update');
        $data = getInput();
        $fields = [];
        $params = [];
        $allowed = ['name','email','phone','company','role','status','value','last_contact','avatar','notes'];
        foreach ($allowed as $f) {
            if (array_key_exists($f, $data)) {
                $fields[] = "$f = ?";
                $params[] = $data[$f];
            }
        }
        if (empty($fields)) jsonError('No fields to update');
        $params[] = $id;
        $sql = 'UPDATE contacts SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $db->prepare($sql)->execute($params);
        $stmt = $db->prepare('SELECT * FROM contacts WHERE id = ?');
        $stmt->execute([$id]);
        jsonResponse($stmt->fetch());
        break;

    case 'DELETE':
        if (!$id) jsonError('ID required for delete');
        $db->prepare('DELETE FROM contacts WHERE id = ?')->execute([$id]);
        jsonResponse(['deleted' => true]);
        break;

    default:
        jsonError('Method not allowed', 405);
}
