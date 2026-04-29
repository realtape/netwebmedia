<?php
require_once __DIR__ . '/../lib/tenancy.php';
$db = getDB();

[$tWhere, $tParams] = tenant_where();
$uid = tenant_id();

switch ($method) {
    case 'GET':
        if ($id) {
            $sql = 'SELECT * FROM contacts WHERE id = ?';
            $params = [$id];
            if ($tWhere) { $sql .= ' AND ' . $tWhere; $params = array_merge($params, $tParams); }
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $contact = $stmt->fetch();
            if (!$contact) jsonError('Contact not found', 404);
            jsonResponse($contact);
        }
        // List with optional filters
        $where = [];
        $params = [];
        if ($tWhere) { $where[] = $tWhere; $params = array_merge($params, $tParams); }
        if (!empty($_GET['status'])) {
            $where[] = 'status = ?';
            $params[] = $_GET['status'];
        }
        if (!empty($_GET['segment'])) {
            $where[] = 'segment = ?';
            $params[] = $_GET['segment'];
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
        $stmt = $db->prepare('INSERT INTO contacts (user_id, name, email, phone, company, role, status, value, last_contact, avatar, notes, segment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $uid,
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
            $data['segment'] ?? null,
        ]);
        $newId = $db->lastInsertId();
        $stmt = $db->prepare('SELECT * FROM contacts WHERE id = ?');
        $stmt->execute([$newId]);
        jsonResponse($stmt->fetch(), 201);
        break;

    case 'PUT':
        if (!$id) jsonError('ID required for update');
        // Verify ownership before update
        $own = $db->prepare('SELECT user_id FROM contacts WHERE id = ?');
        $own->execute([$id]);
        $row = $own->fetch();
        if (!$row) jsonError('Contact not found', 404);
        if (!tenant_owns($row['user_id'] !== null ? (int)$row['user_id'] : null)) {
            jsonError('Contact not found', 404);
        }

        $data = getInput();
        $fields = [];
        $params = [];
        $allowed = ['name','email','phone','company','role','status','value','last_contact','avatar','notes','segment'];
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
        $own = $db->prepare('SELECT user_id FROM contacts WHERE id = ?');
        $own->execute([$id]);
        $row = $own->fetch();
        if (!$row) jsonError('Contact not found', 404);
        if (!tenant_owns($row['user_id'] !== null ? (int)$row['user_id'] : null)) {
            jsonError('Contact not found', 404);
        }
        $db->prepare('DELETE FROM contacts WHERE id = ?')->execute([$id]);
        jsonResponse(['deleted' => true]);
        break;

    default:
        jsonError('Method not allowed', 405);
}
