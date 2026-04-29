<?php
/**
 * Email templates CRUD.
 * Client-facing templates (requires_plan IS NOT NULL) are hidden from
 * demo/guest users and only visible to accounts on a matching paid plan.
 */

$db   = getDB();
$user = guard_user(); // null = demo/guest

// Plan hierarchy: starter=1, professional=2, enterprise=3
function plan_rank(?string $plan): int {
    return ['starter' => 1, 'professional' => 2, 'enterprise' => 3][$plan ?? ''] ?? 0;
}

function user_can_see_template(array $tpl, ?array $user): bool {
    $required = $tpl['requires_plan'] ?? null;
    if ($required === null) return true;                     // public to all
    if (!$user || ($user['status'] ?? '') === 'demo') return false; // demo can't see paid
    return plan_rank($user['plan'] ?? null) >= plan_rank($required);
}

switch ($method) {

    case 'GET':
        if ($id) {
            $s = $db->prepare('SELECT * FROM email_templates WHERE id = ?');
            $s->execute([$id]);
            $row = $s->fetch();
            if (!$row) jsonError('Template not found', 404);
            if (!user_can_see_template($row, $user)) jsonError('Upgrade your plan to access this template', 403);
            jsonResponse($row);
        }

        // List — filter by plan visibility
        $all = $db->query('SELECT * FROM email_templates ORDER BY niche, template_type, created_at DESC')->fetchAll();
        $visible = array_values(array_filter($all, fn($t) => user_can_see_template($t, $user)));
        jsonResponse($visible);
        break;

    case 'POST':
        $d = getInput();
        if (empty($d['name']) || empty($d['subject']) || empty($d['body_html'])) {
            jsonError('name, subject, body_html required');
        }
        $s = $db->prepare(
            'INSERT INTO email_templates (name, subject, body_html, body_text, from_name, from_email, niche, template_type, requires_plan)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $s->execute([
            $d['name'], $d['subject'], $d['body_html'],
            $d['body_text']      ?? null,
            $d['from_name']      ?? 'NetWebMedia',
            $d['from_email']     ?? 'carlos@netwebmedia.com',
            $d['niche']          ?? null,
            $d['template_type']  ?? 'nwm_outbound',
            $d['requires_plan']  ?? null,
        ]);
        jsonResponse(['id' => (int)$db->lastInsertId()], 201);
        break;

    case 'PUT':
        if (!$id) jsonError('ID required');
        $d = getInput();
        $fields = []; $params = [];
        $allowed = ['name','subject','body_html','body_text','from_name','from_email','niche','template_type','requires_plan'];
        foreach ($allowed as $f) {
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
