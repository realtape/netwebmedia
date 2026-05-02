<?php
/**
 * WhatsApp opt-in flush admin handler.
 *
 * Once Meta WABA verification clears for the NetWebMedia-owned phone number,
 * this handler graduates `pending_double_opt_in` subscribers (captured by the
 * public /api/public/whatsapp/subscribe endpoint) into `confirmed` state by
 * sending the welcome WhatsApp template via Meta's Cloud API.
 *
 * Routes (admin only):
 *   GET  /api/?r=wa_flush&action=count                → { pending, confirmed, opted_out, total }
 *   GET  /api/?r=wa_flush&action=list&limit=50&offset=0 → { items: [...], next_offset, has_more }
 *   POST /api/?r=wa_flush&action=send                 → flush all pending; uses WA_PHONE_ID + WA_META_TOKEN
 *     body (optional): {limit?: int, dry_run?: bool, template_name?: string}
 *   POST /api/?r=wa_flush&action=mark                 → manually mark a single subscriber
 *     body: {contact_id: int, status: 'confirmed'|'opted_out'}
 *
 * Pre-WABA-verification state: GET routes work (read-only over existing data).
 * The `send` action returns 503 with a clear setup message if WA_PHONE_ID or
 * WA_META_TOKEN are unset.
 *
 * Tenancy: this is org-scoped where the org schema is applied. Reads existing
 * `resources` rows where `type='contact'` AND `data.whatsapp.wa_optin_status`
 * is set. Status field is updated via JSON_SET on the data column.
 */

require_once __DIR__ . '/../lib/tenancy.php';
require_once __DIR__ . '/../lib/wa_meta_send.php';

$db    = getDB();
$user  = guard_user();
$uid   = ($user && !empty($user['id'])) ? (int)$user['id'] : null;
$orgId = is_org_schema_applied() ? current_org_id() : null;

if (!$user || !$uid) jsonError('Authentication required', 401);

// Admin-only — block writes via X-Org-Slug cross-org and require admin role.
$role = $user['role'] ?? 'member';
if (!in_array($role, ['admin', 'owner'], true)) {
    jsonError('Admin role required for WhatsApp flush operations', 403);
}

[$tWhere, $tParams] = tenancy_where();

$action = isset($_GET['action']) ? (string)$_GET['action'] : 'count';
$ALLOWED_STATUSES_OUT = ['confirmed', 'opted_out', 'pending_double_opt_in'];

/**
 * Build the SELECT WHERE clause that matches WhatsApp subscribers in a given status.
 * Adds tenancy_where to keep cross-org isolation.
 */
function wa_where_clause(?string $status, string $tWhere, array $tParams): array {
    $where = "type = 'contact' AND JSON_EXTRACT(data, '$.whatsapp.wa_optin_status') IS NOT NULL";
    $params = [];
    if ($status !== null) {
        $where .= " AND JSON_UNQUOTE(JSON_EXTRACT(data, '$.whatsapp.wa_optin_status')) = ?";
        $params[] = $status;
    }
    if ($tWhere) {
        $where .= ' AND ' . $tWhere;
        $params = array_merge($params, $tParams);
    }
    return [$where, $params];
}

switch ($method) {

    case 'GET':
        if ($action === 'count') {
            // Counts by status, scoped to tenancy.
            $out = ['pending_double_opt_in' => 0, 'confirmed' => 0, 'opted_out' => 0, 'total' => 0];
            foreach (['pending_double_opt_in', 'confirmed', 'opted_out'] as $st) {
                [$w, $p] = wa_where_clause($st, $tWhere, $tParams);
                $s = $db->prepare("SELECT COUNT(*) AS n FROM resources WHERE $w");
                $s->execute($p);
                $row = $s->fetch();
                $out[$st] = (int)($row['n'] ?? 0);
            }
            $out['total'] = $out['pending_double_opt_in'] + $out['confirmed'] + $out['opted_out'];
            jsonResponse($out);
            break;
        }

        if ($action === 'list') {
            $status = $_GET['status'] ?? 'pending_double_opt_in';
            if (!in_array($status, $ALLOWED_STATUSES_OUT, true)) jsonError('Invalid status filter', 400);
            $limit = max(1, min(200, (int)($_GET['limit'] ?? 50)));
            $offset = max(0, (int)($_GET['offset'] ?? 0));

            [$w, $p] = wa_where_clause($status, $tWhere, $tParams);
            $sql = "SELECT id, slug, title, status, data, created_at FROM resources
                    WHERE $w
                    ORDER BY id ASC
                    LIMIT $limit OFFSET $offset";
            $s = $db->prepare($sql);
            $s->execute($p);
            $rows = $s->fetchAll();

            // Project only the WhatsApp-relevant fields out of the JSON blob;
            // never leak unrelated CRM context to the admin UI by accident.
            $items = array_map(function ($r) {
                $d = json_decode($r['data'] ?? '{}', true) ?: [];
                $wa = $d['whatsapp'] ?? [];
                return [
                    'id'           => (int)$r['id'],
                    'name'         => $d['name'] ?? null,
                    'phone'        => $wa['phone'] ?? null,
                    'niche'        => $wa['niche'] ?? null,
                    'lang'         => $wa['lang'] ?? 'en',
                    'consent_at'   => $wa['consent_at'] ?? null,
                    'wa_optin_status' => $wa['wa_optin_status'] ?? null,
                    'email'        => $d['email'] ?? null,
                    'source'       => $wa['source'] ?? null,
                    'created_at'   => $r['created_at'] ?? null,
                ];
            }, $rows ?: []);

            // has_more: cheap probe — fetch one more than we returned to know.
            $probeLimit = 1;
            $probeOffset = $offset + $limit;
            $sql2 = "SELECT id FROM resources WHERE $w ORDER BY id ASC LIMIT $probeLimit OFFSET $probeOffset";
            $s2 = $db->prepare($sql2);
            $s2->execute($p);
            $hasMore = (bool)$s2->fetch();

            jsonResponse([
                'items'       => $items,
                'count'       => count($items),
                'next_offset' => $hasMore ? $offset + $limit : null,
                'has_more'    => $hasMore,
                'status'      => $status,
            ]);
            break;
        }

        jsonError('Unknown GET action', 400);
        break;

    case 'POST':
        if (function_exists('require_org_access_for_write')) {
            require_org_access_for_write('admin');
        }

        if ($action === 'mark') {
            $d = getInput();
            $contactId = (int)($d['contact_id'] ?? 0);
            $newStatus = (string)($d['status'] ?? '');
            if ($contactId <= 0) jsonError('contact_id required', 400);
            if (!in_array($newStatus, ['confirmed', 'opted_out', 'pending_double_opt_in'], true)) {
                jsonError('status must be confirmed | opted_out | pending_double_opt_in', 400);
            }

            // Verify the row exists in our tenant + is actually a WA subscriber.
            [$w, $p] = wa_where_clause(null, $tWhere, $tParams);
            $sql = "SELECT id, data FROM resources WHERE $w AND id = ? LIMIT 1";
            $params2 = array_merge($p, [$contactId]);
            $s = $db->prepare($sql);
            $s->execute($params2);
            $row = $s->fetch();
            if (!$row) jsonError('Subscriber not found in your scope', 404);

            $cd = json_decode($row['data'], true) ?: [];
            if (!isset($cd['whatsapp'])) $cd['whatsapp'] = [];
            $cd['whatsapp']['wa_optin_status'] = $newStatus;
            $cd['whatsapp']['status_updated_at'] = date('c');
            $cd['whatsapp']['status_updated_by'] = $uid;

            $u = $db->prepare("UPDATE resources SET data = ? WHERE id = ?");
            $u->execute([json_encode($cd), $contactId]);

            jsonResponse(['updated' => true, 'id' => $contactId, 'status' => $newStatus]);
            break;
        }

        if ($action === 'send') {
            // Flush pending opt-ins by calling Meta's WhatsApp Cloud API.
            // Pre-flight: the env must be configured. If not, return 503 with
            // a setup message — never silently no-op (would mask problems).
            $waPhoneId = defined('WA_PHONE_ID') ? WA_PHONE_ID : (getenv('WA_PHONE_ID') ?: '');
            $waToken   = defined('WA_META_TOKEN') ? WA_META_TOKEN : (getenv('WA_META_TOKEN') ?: '');
            if (!$waPhoneId || !$waToken) {
                http_response_code(503);
                jsonResponse([
                    'error' => 'WhatsApp Business API not configured',
                    'detail' => 'WA_PHONE_ID and WA_META_TOKEN must be set in deploy secrets and active in config.local.php. See _deploy/social-channel-activation.md §3 for the verification SOP.',
                ]);
                break;
            }

            $d = getInput();
            $batchLimit  = max(1, min(500, (int)($d['limit'] ?? 100)));
            $dryRun      = !empty($d['dry_run']);
            $templateName = isset($d['template_name']) ? preg_replace('/[^a-z0-9_]/', '', (string)$d['template_name']) : 'weekly_aeo_insight';
            if ($templateName === '') $templateName = 'weekly_aeo_insight';

            [$w, $p] = wa_where_clause('pending_double_opt_in', $tWhere, $tParams);
            $sql = "SELECT id, data FROM resources WHERE $w ORDER BY id ASC LIMIT $batchLimit";
            $s = $db->prepare($sql);
            $s->execute($p);
            $rows = $s->fetchAll();

            $results = ['attempted' => 0, 'sent' => 0, 'failed' => 0, 'skipped' => 0, 'errors' => []];

            foreach ($rows as $r) {
                $results['attempted']++;
                $cd = json_decode($r['data'], true) ?: [];
                $wa = $cd['whatsapp'] ?? [];
                $phone = $wa['phone'] ?? null;
                $name  = $cd['name'] ?? '';
                $lang  = $wa['lang'] ?? 'en';

                if (!$phone) {
                    $results['skipped']++;
                    $results['errors'][] = ['id' => (int)$r['id'], 'reason' => 'missing phone'];
                    continue;
                }

                if ($dryRun) {
                    $results['sent']++; // count for UI even though no real send
                    continue;
                }

                $result = wa_meta_send($phone, '', [
                    'name'       => $templateName,
                    'lang'       => $lang === 'es' ? 'es' : 'en',
                    'components' => [[
                        'type' => 'body',
                        'parameters' => [
                            ['type' => 'text', 'text' => substr($name, 0, 60) ?: 'there'],
                            ['type' => 'text', 'text' => 'Welcome — first real broadcast next Tuesday.'],
                            ['type' => 'text', 'text' => 'https://netwebmedia.com/blog/'],
                        ],
                    ]],
                ]);

                if ($result['success']) {
                    $cd['whatsapp']['wa_optin_status'] = 'confirmed';
                    $cd['whatsapp']['flushed_at']      = date('c');
                    $cd['whatsapp']['flushed_by']      = $uid;
                    $cd['whatsapp']['flush_template']  = $templateName;
                    $u = $db->prepare("UPDATE resources SET data = ? WHERE id = ?");
                    $u->execute([json_encode($cd), (int)$r['id']]);
                    $results['sent']++;
                } else {
                    $results['failed']++;
                    $results['errors'][] = [
                        'id'         => (int)$r['id'],
                        'error'      => $result['error'],
                        'error_code' => $result['error_code'],
                    ];
                    $cd['whatsapp']['last_flush_attempt_at']    = date('c');
                    $cd['whatsapp']['last_flush_error_excerpt'] = $result['error'];
                    $u = $db->prepare("UPDATE resources SET data = ? WHERE id = ?");
                    $u->execute([json_encode($cd), (int)$r['id']]);
                }
            }

            jsonResponse([
                'dry_run'  => $dryRun,
                'template' => $templateName,
                'results'  => $results,
                'remaining_after' => max(0, count($rows) === $batchLimit ? null : 0),
            ]);
            break;
        }

        jsonError('Unknown POST action', 400);
        break;

    default:
        jsonError('Method not allowed', 405);
}
