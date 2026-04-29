<?php
require_once __DIR__ . '/../lib/tenancy.php';
require_once __DIR__ . '/../lib/wf_bridge.php';
$db = getDB();
[$tWhere, $tParams] = tenancy_where('d');
$uid = tenant_id();
$orgId = is_org_schema_applied() ? current_org_id() : null;

/* Helper: build workflow context from a deal id (joins contact for email/phone/lang) */
function deal_wf_ctx(PDO $db, int $dealId): array {
    $sql = 'SELECT d.id AS deal_id, d.title, d.value, d.probability, d.source, d.notes, d.next_action,
                   d.next_followup_date, d.days_in_stage, ps.name AS stage,
                   c.id AS contact_id, c.name AS contact_name, c.email, c.phone AS contact_phone,
                   c.company AS contact_company, c.status AS contact_status
            FROM deals d
            LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
            LEFT JOIN contacts c        ON d.contact_id = c.id
            WHERE d.id = ?';
    $st = $db->prepare($sql);
    $st->execute([$dealId]);
    $row = $st->fetch();
    if (!$row) return ['deal_id' => $dealId];
    $first = preg_split('/\s+/', (string)($row['contact_name'] ?? ''), 2)[0] ?? '';
    return array_merge($row, [
        'first_name' => $first,
        'name'       => $row['contact_name'] ?? '',
        'company'    => $row['contact_company'] ?? '',
    ]);
}

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
                    if ($orgId !== null) {
                        $db->prepare('INSERT INTO contacts (user_id, organization_id, name, email, phone, company, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
                           ->execute([
                               $uid,
                               $orgId,
                               $data['company'] ?: $email,
                               $email,
                               $data['phone'] ?? null,
                               $data['company'] ?? null,
                               'lead',
                           ]);
                    } else {
                        $db->prepare('INSERT INTO contacts (user_id, name, email, phone, company, status) VALUES (?, ?, ?, ?, ?, ?)')
                           ->execute([
                               $uid,
                               $data['company'] ?: $email,
                               $email,
                               $data['phone'] ?? null,
                               $data['company'] ?? null,
                               'lead',
                           ]);
                    }
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

        if ($orgId !== null) {
            $stmt = $db->prepare('INSERT INTO deals (user_id, organization_id, title, company, value, contact_id, stage_id, probability, days_in_stage, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([
                $uid,
                $orgId,
                $data['title'],
                $data['company'] ?? null,
                $data['value'] ?? 0,
                $contact_id,
                $data['stage_id'] ?? 1,
                $data['probability'] ?? 0,
                $data['days_in_stage'] ?? 0,
                $data['source'] ?? null,
            ]);
        } else {
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
        }
        $newId = $db->lastInsertId();
        $stmt = $db->prepare('SELECT d.*, ps.name as stage, c.name as contact_name, c.email as contact_email, c.phone as contact_phone FROM deals d LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id LEFT JOIN contacts c ON d.contact_id = c.id WHERE d.id = ?');
        $stmt->execute([$newId]);
        $newRow = $stmt->fetch();

        /* Fire deal_stage trigger for the initial stage (most commonly "New Lead") */
        if (!empty($newRow['stage'])) {
            $ctx = deal_wf_ctx($db, (int)$newId);
            wf_fire('deal_stage', ['stage' => $newRow['stage']], $ctx);
        }

        jsonResponse($newRow, 201);
        break;

    case 'PUT':
        if (!$id) jsonError('ID required');
        // Ownership check — migration-aware (org first, falls back to user filter)
        [$ownWhere, $ownParams] = tenancy_where();
        $checkSql = 'SELECT id FROM deals WHERE id = ?';
        $checkParams = [$id];
        if ($ownWhere) { $checkSql .= ' AND ' . $ownWhere; $checkParams = array_merge($checkParams, $ownParams); }
        $own = $db->prepare($checkSql);
        $own->execute($checkParams);
        if (!$own->fetch()) jsonError('Deal not found', 404);

        $data = getInput();

        /* Capture prior stage so we can detect a real stage change after UPDATE */
        $prev = $db->prepare('SELECT ps.name AS stage FROM deals d LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id WHERE d.id = ?');
        $prev->execute([$id]);
        $prevStage = ($prev->fetch()['stage'] ?? null);

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
        /* Reset days_in_stage automatically when stage_id is changing */
        if (array_key_exists('stage_id', $data) && !array_key_exists('days_in_stage', $data)) {
            $fields[] = 'days_in_stage = ?';
            $params[] = 0;
        }
        $params[] = $id;
        $updSql = 'UPDATE deals SET ' . implode(', ', $fields) . ' WHERE id = ?';
        if ($ownWhere) { $updSql .= ' AND ' . $ownWhere; $params = array_merge($params, $ownParams); }
        $db->prepare($updSql)->execute($params);
        $stmt = $db->prepare('SELECT d.*, ps.name as stage FROM deals d LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id WHERE d.id = ?');
        $stmt->execute([$id]);
        $updated = $stmt->fetch();

        /* Fire deal_stage workflow trigger when the stage actually transitioned */
        if (!empty($updated['stage']) && $updated['stage'] !== $prevStage) {
            $ctx = deal_wf_ctx($db, (int)$id);
            $ctx['previous_stage'] = $prevStage;
            wf_fire('deal_stage', ['stage' => $updated['stage']], $ctx);
        }

        jsonResponse($updated);
        break;

    case 'DELETE':
        if (!$id) jsonError('ID required');
        [$ownWhere, $ownParams] = tenancy_where();
        $checkSql = 'SELECT id FROM deals WHERE id = ?';
        $checkParams = [$id];
        if ($ownWhere) { $checkSql .= ' AND ' . $ownWhere; $checkParams = array_merge($checkParams, $ownParams); }
        $own = $db->prepare($checkSql);
        $own->execute($checkParams);
        if (!$own->fetch()) jsonError('Deal not found', 404);
        $delSql = 'DELETE FROM deals WHERE id = ?';
        $delParams = [$id];
        if ($ownWhere) { $delSql .= ' AND ' . $ownWhere; $delParams = array_merge($delParams, $ownParams); }
        $db->prepare($delSql)->execute($delParams);
        jsonResponse(['deleted' => true]);
        break;

    default:
        jsonError('Method not allowed', 405);
}
