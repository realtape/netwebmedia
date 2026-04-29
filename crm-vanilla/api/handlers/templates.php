<?php
/**
 * Email templates CRUD.
 * Client-facing templates (requires_plan IS NOT NULL) are hidden from
 * demo/guest users and only visible to accounts on a matching paid plan.
 */

require_once __DIR__ . '/../lib/tenancy.php';
$db   = getDB();
$user = guard_user(); // null = demo/guest
$uid  = ($user && !empty($user['id'])) ? (int)$user['id'] : null;
$isSuper = $user && (($user['role'] ?? '') === 'superadmin');
$orgId = is_org_schema_applied() ? current_org_id() : null;
[$tWhere, $tParams] = tenancy_where();

// Plan hierarchy: starter=1, professional=2, enterprise=3
function plan_rank(?string $plan): int {
    return ['starter' => 1, 'professional' => 2, 'enterprise' => 3][$plan ?? ''] ?? 0;
}

function user_can_see_template(array $tpl, ?array $user, ?int $uid, bool $isSuper): bool {
    // Tenant scoping: user-owned templates only visible to that user (or superadmin)
    $owner = $tpl['user_id'] ?? null;
    if ($owner !== null) {
        $owner = (int)$owner;
        if (!$isSuper && $owner !== $uid) return false;
    }

    $required = $tpl['requires_plan'] ?? null;
    if ($required === null) return true;                     // public to all
    if (!$user || ($user['status'] ?? '') === 'demo') return false; // demo can't see paid
    return plan_rank($user['plan'] ?? null) >= plan_rank($required);
}

switch ($method) {

    case 'GET':
        if ($id) {
            // Org-scope the lookup; system templates (organization_id IS NULL post-migrate
            // would be unusual since we backfill to master, but allow that fallthrough)
            // remain visible to all callers via user_can_see_template.
            $sql = 'SELECT * FROM email_templates WHERE id = ?';
            $params = [$id];
            // Allow rows with no org assignment (legacy / system) OR matching org.
            if ($tWhere && $orgId !== null) {
                $sql .= ' AND (organization_id IS NULL OR ' . $tWhere . ')';
                $params = array_merge($params, $tParams);
            } elseif ($tWhere) {
                $sql .= ' AND ' . $tWhere;
                $params = array_merge($params, $tParams);
            }
            $s = $db->prepare($sql);
            $s->execute($params);
            $row = $s->fetch();
            if (!$row) jsonError('Template not found', 404);
            if (!user_can_see_template($row, $user, $uid, $isSuper)) jsonError('Upgrade your plan to access this template', 403);
            jsonResponse($row);
        }

        // List — filter by plan visibility, then org scope.
        $sql = 'SELECT * FROM email_templates';
        $params = [];
        if ($tWhere && $orgId !== null) {
            $sql .= ' WHERE (organization_id IS NULL OR ' . $tWhere . ')';
            $params = $tParams;
        } elseif ($tWhere) {
            $sql .= ' WHERE ' . $tWhere;
            $params = $tParams;
        }
        $sql .= ' ORDER BY niche, template_type, created_at DESC';
        $st = $db->prepare($sql);
        $st->execute($params);
        $all = $st->fetchAll();
        $visible = array_values(array_filter($all, function($t) use ($user, $uid, $isSuper) {
            return user_can_see_template($t, $user, $uid, $isSuper);
        }));
        jsonResponse($visible);
        break;

    case 'POST':
        if (!$user || !$user['id']) jsonError('Authentication required', 401);
        $d = getInput();
        if (empty($d['name']) || empty($d['subject']) || empty($d['body_html'])) {
            jsonError('name, subject, body_html required');
        }
        if ($orgId !== null) {
            $s = $db->prepare(
                'INSERT INTO email_templates (user_id, organization_id, name, subject, body_html, body_text, from_name, from_email, niche, template_type, requires_plan)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $s->execute([
                $uid,
                $orgId,
                $d['name'], $d['subject'], $d['body_html'],
                $d['body_text']      ?? null,
                $d['from_name']      ?? 'NetWebMedia',
                $d['from_email']     ?? 'carlos@netwebmedia.com',
                $d['niche']          ?? null,
                $d['template_type']  ?? 'nwm_outbound',
                $isSuper ? ($d['requires_plan'] ?? null) : null,
            ]);
        } else {
            $s = $db->prepare(
                'INSERT INTO email_templates (user_id, name, subject, body_html, body_text, from_name, from_email, niche, template_type, requires_plan)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $s->execute([
                $uid,
                $d['name'], $d['subject'], $d['body_html'],
                $d['body_text']      ?? null,
                $d['from_name']      ?? 'NetWebMedia',
                $d['from_email']     ?? 'carlos@netwebmedia.com',
                $d['niche']          ?? null,
                $d['template_type']  ?? 'nwm_outbound',
                $isSuper ? ($d['requires_plan'] ?? null) : null,
            ]);
        }
        jsonResponse(['id' => (int)$db->lastInsertId()], 201);
        break;

    case 'PUT':
        if (!$user || !$user['id']) jsonError('Authentication required', 401);
        if (!$id) jsonError('ID required');
        // Ownership check — non-superadmin can only edit their own templates (NULL = system, not editable)
        // Also enforce org scope when applied: a sub-account user can never edit
        // a template that belongs to another org.
        $sql = 'SELECT user_id, organization_id FROM email_templates WHERE id = ?';
        $params = [$id];
        if ($tWhere && $orgId !== null) {
            // Master org sees all (tWhere is '1=1'); subaccount must match its org.
            // Allow NULL organization_id (system templates) only for read; PUT below still
            // requires user ownership unless superadmin.
            $sql .= ' AND (organization_id IS NULL OR ' . $tWhere . ')';
            $params = array_merge($params, $tParams);
        }
        $own = $db->prepare($sql);
        $own->execute($params);
        $row = $own->fetch();
        if (!$row) jsonError('Template not found', 404);
        $owner = $row['user_id'] !== null ? (int)$row['user_id'] : null;
        if (!$isSuper && ($owner === null || $owner !== $uid)) {
            jsonError('Template not found', 404);
        }

        $d = getInput();
        $fields = []; $params = [];
        $allowed = ['name','subject','body_html','body_text','from_name','from_email','niche','template_type'];
        if ($isSuper) $allowed[] = 'requires_plan';
        foreach ($allowed as $f) {
            if (array_key_exists($f, $d)) { $fields[] = "$f = ?"; $params[] = $d[$f]; }
        }
        if (!$fields) jsonError('No fields to update');
        $params[] = $id;
        $db->prepare('UPDATE email_templates SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
        jsonResponse(['updated' => true]);
        break;

    case 'DELETE':
        if (!$user || !$user['id']) jsonError('Authentication required', 401);
        if (!$id) jsonError('ID required');
        $sql = 'SELECT user_id, organization_id FROM email_templates WHERE id = ?';
        $params = [$id];
        if ($tWhere && $orgId !== null) {
            $sql .= ' AND (organization_id IS NULL OR ' . $tWhere . ')';
            $params = array_merge($params, $tParams);
        }
        $own = $db->prepare($sql);
        $own->execute($params);
        $row = $own->fetch();
        if (!$row) jsonError('Template not found', 404);
        $owner = $row['user_id'] !== null ? (int)$row['user_id'] : null;
        if (!$isSuper && ($owner === null || $owner !== $uid)) {
            jsonError('Template not found', 404);
        }
        $db->prepare('DELETE FROM email_templates WHERE id = ?')->execute([$id]);
        jsonResponse(['deleted' => true]);
        break;

    default:
        jsonError('Method not allowed', 405);
}
