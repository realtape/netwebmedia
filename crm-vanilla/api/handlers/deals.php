<?php
require_once __DIR__ . '/../lib/tenancy.php';
$db = getDB();
[$tWhere, $tParams] = tenant_where('d');
$uid = tenant_id();

switch ($method) {
    case 'GET':
        if ($id) {
            $sql = 'SELECT d.*, ps.name as stage, c.name as contact_name FROM deals d LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id LEFT JOIN contacts c ON d.contact_id = c.id WHERE d.id = ?';
            $params = [$id];
            if ($tWhere) { $sql .= ' AND ' . $tWhere; $params = array_merge($params, $tParams); }
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $deal = $stmt->fetch();
            if (!$deal) jsonError('Deal not found', 404);
            jsonResponse($deal);
        }
        $sql = 'SELECT d.*, ps.name as stage, c.name as contact_name FROM deals d LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id LEFT JOIN contacts c ON d.contact_id = c.id';
        $params = [];
        if ($tWhere) { $sql .= ' WHERE ' . $tWhere; $params = $tParams; }
        $sql .= ' ORDER BY ps.sort_order, d.created_at DESC';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        jsonResponse($stmt->fetchAll());
        break;

    case 'POST':
        $data = getInput();
        if (empty($data['title'])) jsonError('Title is required');

        $email = trim($data['email'] ?? '');
        if (empty($email)) jsonError('Email is required for all pipeline leads', 422);

        // Resolve or create a contact from the email
        $contact_id = isset($data['contact_id']) ? (int)$data['contact_id'] : null;
        if (!$contact_id) {
            $cs = $db->prepare('SELECT id, phone FROM contacts WHERE email = ? LIMIT 1');
            $cs->execute([$email]);
            $existing = $cs->fetch();
            if ($existing) {
                $contact_id = (int)$existing['id'];
                // Backfill phone if the contact has none and we received one
                if (!empty($data['phone']) && empty($existing['phone'])) {
                    $db->prepare('UPDATE contacts SET phone = ? WHERE id = ?')
                       ->execute([$data['phone'], $contact_id]);
                }
            } else {
                try {
                    $db->prepare('INSERT INTO contacts (user_id, name, email, phone, company, status) VALUES (?, ?, ?, ?, ?, ?)')
                       ->execute([
                           $uid,
                           $data['company'] ?: $email,
                           $email,
                           $data['phone'] ?? null,
                           $data['company'] ?? null,
                           'lead',
                       ]);
                    $contact_id = (int)$db->lastInsertId();
                } catch (PDOException $race) {
                    // Only swallow integrity-constraint violations (23000); rethrow anything else
                    // so connection drops, deadlocks, etc. surface in error_log.
                    if ($race->getCode() !== '23000') throw $race;
                    $cs->execute([$email]);
                    $recovered = $cs->fetch();
                    if ($recovered) { $contact_id = (int)$recovered['id']; }
                    else { jsonError('Contact creation failed', 500); }
                }
            }
        }

        if (empty($data['source'])) {
            $t = strtolower($data['title']);
            if (strpos($t, 'outreach') !== false || strpos($t, 'nurture') !== false || strpos($t, 'tier') !== false) {
                $data['source'] = strpos($t, 'usa') !== false ? 'cold_email_usa' : 'cold_email_chile';
            } elseif (strpos($t, 'whatsapp') !== false || strpos($t, 'wa ') !== false) {
                $data['source'] = 'whatsapp';
            } elseif (strpos($t, 'referral') !== false || strpos($t, 'referred') !== false) {
                $data['source'] = 'referral';
            } elseif (strpos($t, 'inbound') !== false || strpos($t, 'website') !== false || strpos($t, 'form') !== false) {
                $data['source'] = 'inbound_website';
            }
        }

        $stmt = $db->prepare('INSERT INTO deals (user_id, title, company, value, contact_id, stage_id, probability, days_in_stage, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $uid,
            $data['title'],
            $data['company'] ?? null,
            $data['value'] ?? 0,
            $contact_id,
            $data['stage_id'] ?? 1,
            $data['probability'] ?? 0,
            $data['days_in_stage'] ?? 0,
            $data['source'] ?? null,
        ]);
        $newId = $db->lastInsertId();
        $stmt = $db->prepare('SELECT d.*, ps.name as stage, c.name as contact_name, c.email as contact_email, c.phone as contact_phone FROM deals d LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id LEFT JOIN contacts c ON d.contact_id = c.id WHERE d.id = ?');
        $stmt->execute([$newId]);
        jsonResponse($stmt->fetch(), 201);
        break;

    case 'PUT':
        if (!$id) jsonError('ID required');
        // Ownership check
        $own = $db->prepare('SELECT user_id FROM deals WHERE id = ?');
        $own->execute([$id]);
        $row = $own->fetch();
        if (!$row) jsonError('Deal not found', 404);
        if (!tenant_owns($row['user_id'] !== null ? (int)$row['user_id'] : null)) {
            jsonError('Deal not found', 404);
        }

        $data = getInput();
        $fields = [];
        $params = [];
        $allowed = ['title','company','value','contact_id','stage_id','probability','days_in_stage','source','notes','next_action','next_followup_date'];
        foreach ($allowed as $f) {
            if (array_key_exists($f, $data)) {
                $fields[] = "$f = ?";
                $params[] = $data[$f];
            }
        }
        if (empty($fields)) jsonError('No fields to update');
        $params[] = $id;
        $db->prepare('UPDATE deals SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
        $stmt = $db->prepare('SELECT d.*, ps.name as stage FROM deals d LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id WHERE d.id = ?');
        $stmt->execute([$id]);
        jsonResponse($stmt->fetch());
        break;

    case 'DELETE':
        if (!$id) jsonError('ID required');
        $own = $db->prepare('SELECT user_id FROM deals WHERE id = ?');
        $own->execute([$id]);
        $row = $own->fetch();
        if (!$row) jsonError('Deal not found', 404);
        if (!tenant_owns($row['user_id'] !== null ? (int)$row['user_id'] : null)) {
            jsonError('Deal not found', 404);
        }
        $db->prepare('DELETE FROM deals WHERE id = ?')->execute([$id]);
        jsonResponse(['deleted' => true]);
        break;

    default:
        jsonError('Method not allowed', 405);
}
