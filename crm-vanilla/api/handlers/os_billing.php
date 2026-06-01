<?php
/**
 * NetWebMedia OS — Billing summary + checkout  (Phase 5)
 *
 *   GET  /crm/api/?r=os_billing                  -> plan, status, budget, invoices
 *   POST /crm/api/?r=os_billing {action:"checkout"} -> {checkout_url}   (admin)
 *
 * Checkout creates a Stripe Checkout Session (mode=subscription) with
 * client_reference_id = org slug so stripe_webhook.php can map the payment back.
 * Gated: checkout returns 503 until STRIPE_SECRET_KEY + STRIPE_PRICE_MONTHLY set.
 */

require_once __DIR__ . '/../lib/tenancy.php';

$db = getDB();
$u  = guard_user();
if (!$u || empty($u['id'])) jsonError('Authentication required', 401);
$orgId = current_org_id();
if ($orgId === null) jsonError('No organization resolved', 400);
require_org_access($orgId, 'member');

$stmt = $db->prepare('SELECT slug, display_name, os_plan, billing_status, agent_token_budget_monthly,
                             stripe_customer_id FROM organizations WHERE id = ? LIMIT 1');
$stmt->execute([$orgId]);
$org = $stmt->fetch() ?: [];

if ($method === 'GET') {
    $invoices = [];
    try {
        $s = $db->prepare('SELECT stripe_invoice_id, amount_cents, currency, status, hosted_invoice_url, created_at
                             FROM org_invoices WHERE organization_id = ? ORDER BY id DESC LIMIT 24');
        $s->execute([$orgId]);
        foreach ($s->fetchAll() as $r) {
            $invoices[] = [
                'date'   => $r['created_at'],
                'amount_usd' => round(((int)$r['amount_cents']) / 100, 2),
                'status' => $r['status'],
                'url'    => $r['hosted_invoice_url'],
            ];
        }
    } catch (Throwable $e) { /* table may not exist yet */ }

    jsonResponse([
        'plan'                       => $org['os_plan'] ?? 'premium',
        'billing_status'             => $org['billing_status'] ?? 'trialing',
        'agent_token_budget_monthly' => (int)($org['agent_token_budget_monthly'] ?? 0),
        'price_monthly_usd'          => 2490,
        'invoices'                   => $invoices,
        'configured'                 => (defined('STRIPE_SECRET_KEY') && STRIPE_SECRET_KEY !== ''),
        'portal_url'                 => null, // billing portal session created on demand in V1.1
    ]);
}

if ($method !== 'POST') jsonError('Use GET or POST', 405);
require_org_access_for_write('admin');

$in = getInput();
if (($in['action'] ?? '') !== 'checkout') jsonError('Unknown action', 400);

$sk    = defined('STRIPE_SECRET_KEY') ? (string)STRIPE_SECRET_KEY : '';
$price = defined('STRIPE_PRICE_MONTHLY') ? (string)STRIPE_PRICE_MONTHLY : '';
if ($sk === '' || $price === '') jsonError('Billing not configured (STRIPE_SECRET_KEY / STRIPE_PRICE_MONTHLY)', 503);

$base = defined('OS_PUBLIC_BASE') && OS_PUBLIC_BASE ? OS_PUBLIC_BASE : 'https://netwebmedia.com';
$fields = [
    'mode'                 => 'subscription',
    'line_items[0][price]' => $price,
    'line_items[0][quantity]' => 1,
    'client_reference_id'  => $org['slug'] ?? (string)$orgId,
    'success_url'          => $base . '/os/billing.html?status=success',
    'cancel_url'           => $base . '/os/billing.html?status=cancelled',
];
if (!empty($org['stripe_customer_id'])) $fields['customer'] = $org['stripe_customer_id'];
else if (!empty($u['email']))           $fields['customer_email'] = $u['email'];

$ch = curl_init('https://api.stripe.com/v1/checkout/sessions');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_TIMEOUT => 30,
    CURLOPT_USERPWD => $sk . ':',
    CURLOPT_POSTFIELDS => http_build_query($fields),
]);
$raw = curl_exec($ch); $hc = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
$res = json_decode((string)$raw, true);
if ($hc !== 200 || empty($res['url'])) {
    jsonError('Stripe checkout failed: ' . ($res['error']['message'] ?? ('HTTP ' . $hc)), 502);
}
jsonResponse(['ok' => true, 'checkout_url' => $res['url']]);
