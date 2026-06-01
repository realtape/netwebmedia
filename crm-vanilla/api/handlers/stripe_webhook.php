<?php
/**
 * NetWebMedia OS — Stripe webhook  (Phase 5)
 *
 *   POST /crm/api/?r=stripe_webhook
 *
 * Public (Stripe calls it; no session). Verifies the Stripe-Signature against
 * STRIPE_WEBHOOK_SECRET, then drives the billing state machine on the
 * organizations row. The webhook is the single source of truth for os_enabled /
 * billing_status — provisioning never flips those by hand.
 *
 * Gated: 503 until STRIPE_WEBHOOK_SECRET is set.
 */

require_once __DIR__ . '/../config.php';

if ($method !== 'POST') { http_response_code(405); exit; }
$secret = defined('STRIPE_WEBHOOK_SECRET') ? (string)STRIPE_WEBHOOK_SECRET : '';
if ($secret === '') { http_response_code(503); echo json_encode(['error' => 'stripe webhook not configured']); exit; }

$payload = file_get_contents('php://input');
$sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

// Parse "t=...,v1=..."
$t = null; $v1 = null;
foreach (explode(',', $sigHeader) as $part) {
    $kv = explode('=', trim($part), 2);
    if (count($kv) !== 2) continue;
    if ($kv[0] === 't')  $t  = $kv[1];
    if ($kv[0] === 'v1') $v1 = $kv[1];
}
if ($t === null || $v1 === null) { http_response_code(400); echo 'bad signature header'; exit; }
if (abs(time() - (int)$t) > 300)  { http_response_code(400); echo 'timestamp out of tolerance'; exit; }

$expected = hash_hmac('sha256', $t . '.' . $payload, $secret);
if (!hash_equals($expected, $v1)) { http_response_code(400); echo 'signature mismatch'; exit; }

$event = json_decode($payload, true);
if (!is_array($event)) { http_response_code(400); echo 'bad json'; exit; }

$db   = getDB();
$type = $event['type'] ?? '';
$obj  = $event['data']['object'] ?? [];

/** Find an org row id by client_reference_id (id or slug) or by stripe_customer_id. */
$findOrg = function (PDO $db, array $obj): ?int {
    $ref = $obj['client_reference_id'] ?? null;
    if ($ref !== null && $ref !== '') {
        if (ctype_digit((string)$ref)) {
            $s = $db->prepare('SELECT id FROM organizations WHERE id = ? LIMIT 1'); $s->execute([(int)$ref]);
        } else {
            $s = $db->prepare('SELECT id FROM organizations WHERE slug = ? LIMIT 1'); $s->execute([$ref]);
        }
        if ($oid = $s->fetchColumn()) return (int)$oid;
    }
    $cust = $obj['customer'] ?? null;
    if ($cust) {
        $s = $db->prepare('SELECT id FROM organizations WHERE stripe_customer_id = ? LIMIT 1');
        $s->execute([$cust]);
        if ($oid = $s->fetchColumn()) return (int)$oid;
    }
    return null;
};

switch ($type) {
    case 'checkout.session.completed':
        $oid = $findOrg($db, $obj);
        if ($oid) {
            $db->prepare('UPDATE organizations SET billing_status="active", os_enabled=1,
                            stripe_customer_id=?, stripe_subscription_id=? WHERE id=?')
               ->execute([$obj['customer'] ?? null, $obj['subscription'] ?? null, $oid]);
        }
        break;

    case 'customer.subscription.deleted':
        $oid = $findOrg($db, $obj);
        if ($oid) $db->prepare('UPDATE organizations SET billing_status="canceled" WHERE id=?')->execute([$oid]);
        break;

    case 'invoice.payment_failed':
        $oid = $findOrg($db, $obj);
        if ($oid) $db->prepare('UPDATE organizations SET billing_status="past_due" WHERE id=?')->execute([$oid]);
        break;

    case 'invoice.payment_succeeded':
        $oid = $findOrg($db, $obj);
        if ($oid) {
            $db->prepare('UPDATE organizations SET billing_status="active" WHERE id=? AND billing_status="past_due"')->execute([$oid]);
            try {
                $db->prepare('INSERT INTO org_invoices
                    (organization_id, stripe_invoice_id, amount_cents, currency, status, hosted_invoice_url)
                    VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE status=VALUES(status)')
                   ->execute([$oid, $obj['id'] ?? '', (int)($obj['amount_paid'] ?? 0),
                              $obj['currency'] ?? 'usd', 'paid', $obj['hosted_invoice_url'] ?? null]);
            } catch (Throwable $e) {}
        }
        break;
}

http_response_code(200);
echo json_encode(['received' => true, 'type' => $type]);
