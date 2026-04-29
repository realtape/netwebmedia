<?php
require_once __DIR__ . '/../lib/tenancy.php';
$db = getDB();

[$tWhere, $tParams] = tenancy_where();
$uid = tenant_id();
$orgId = is_org_schema_applied() ? current_org_id() : null;

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
        // SECURITY (H2): block X-Org-Slug-based cross-org INSERT.
        // Authenticated users must be members of the org they're writing to.
        require_org_access_for_write('member');
        $data = getInput();
        if (empty($data['name'])) jsonError('Name is required');
        if ($orgId !== null) {
            $stmt = $db->prepare('INSERT INTO contacts (user_id, organization_id, name, email, phone, company, role, status, value, last_contact, avatar, notes, segment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([
                $uid,
                $orgId,
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
        } else {
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
        }
        $newId = $db->lastInsertId();
        $stmt = $db->prepare('SELECT * FROM contacts WHERE id = ?');
        $stmt->execute([$newId]);
        jsonResponse($stmt->fetch(), 201);
        break;

    case 'PUT':
        if (!$id) jsonError('ID required for update');
        // Verify org/user ownership before update — use the same migration-aware
        // filter so post-migration the row must belong to the active org, and
        // pre-migration it falls back to the user check.
        $checkSql = 'SELECT id FROM contacts WHERE id = ?';
        $checkParams = [$id];
        if ($tWhere) { $checkSql .= ' AND ' . $tWhere; $checkParams = array_merge($checkParams, $tParams); }
        $own = $db->prepare($checkSql);
        $own->execute($checkParams);
        if (!$own->fetch()) jsonError('Contact not found', 404);

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
        $sql = 'UPDATE contacts SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $params[] = $id;
        if ($tWhere) { $sql .= ' AND ' . $tWhere; $params = array_merge($params, $tParams); }
        $db->prepare($sql)->execute($params);
        $stmt = $db->prepare('SELECT * FROM contacts WHERE id = ?');
        $stmt->execute([$id]);
        jsonResponse($stmt->fetch());
        break;

    case 'DELETE':
        if (!$id) jsonError('ID required for delete');
        $checkSql = 'SELECT id FROM contacts WHERE id = ?';
        $checkParams = [$id];
        if ($tWhere) { $checkSql .= ' AND ' . $tWhere; $checkParams = array_merge($checkParams, $tParams); }
        $own = $db->prepare($checkSql);
        $own->execute($checkParams);
        if (!$own->fetch()) jsonError('Contact not found', 404);

        $delSql = 'DELETE FROM contacts WHERE id = ?';
        $delParams = [$id];
        if ($tWhere) { $delSql .= ' AND ' . $tWhere; $delParams = array_merge($delParams, $tParams); }
        $db->prepare($delSql)->execute($delParams);
        jsonResponse(['deleted' => true]);
        break;

    default:
        jsonError('Method not allowed', 405);
}
