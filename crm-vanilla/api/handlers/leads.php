<?php
$db = getDB();

switch ($method) {
    case 'POST':
        $data = getInput();
        if (empty($data['name']) || empty($data['email'])) {
            jsonError('Name and email required');
        }
        // Check if lead already exists
        $stmt = $db->prepare('SELECT id FROM leads WHERE email = ?');
        $stmt->execute([$data['email']]);
        $existing = $stmt->fetch();

        if ($existing) {
            // Update last login
            $db->prepare('UPDATE leads SET last_login = NOW(), login_count = login_count + 1 WHERE id = ?')->execute([$existing['id']]);
            jsonResponse(['id' => (int)$existing['id'], 'returning' => true]);
        } else {
            $stmt = $db->prepare('INSERT INTO leads (name, email, source, created_at, last_login, login_count) VALUES (?, ?, ?, NOW(), NOW(), 1)');
            $stmt->execute([
                $data['name'],
                $data['email'],
                $data['source'] ?? 'demo_signup',
            ]);
            jsonResponse(['id' => (int)$db->lastInsertId(), 'returning' => false], 201);
        }
        break;

    case 'GET':
        $stmt = $db->query('SELECT * FROM leads ORDER BY created_at DESC');
        jsonResponse($stmt->fetchAll());
        break;

    default:
        jsonError('Method not allowed', 405);
}
