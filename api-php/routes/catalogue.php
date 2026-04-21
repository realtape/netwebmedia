<?php
/*
  NetWebMedia Catalogue — one-time digital product checkout.
  Routes:
    GET  /api/catalogue/products        → public list of products + prices
    POST /api/catalogue/checkout        → {product_code, method:'stripe'|'mp', email?, name?} → {checkout_url}
    POST /api/catalogue/webhook/stripe  → Stripe webhook (checkout.session.completed)
    POST /api/catalogue/webhook/mp      → Mercado Pago payment webhook
*/

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';

/* ─── Product catalog ───────────────────────────────────────── */
function cat_products() {
  return [
    'whatsapp-course' => ['name' => 'WhatsApp Business Automation Mastery',       'usd' => 297, 'type' => 'course', 'delivery' => 'Course access link via WhatsApp within 15 min'],
    'chatbot-course'  => ['name' => 'AI Chatbot Automation — Full Deployment',     'usd' => 347, 'type' => 'course', 'delivery' => 'Course access link via WhatsApp within 15 min'],
    'sms-course'      => ['name' => 'SMS & Multi-Platform Messaging Automation',   'usd' => 197, 'type' => 'course', 'delivery' => 'Course access link via WhatsApp within 15 min'],
    'course-trilogy'  => ['name' => 'Course Trilogy — All 3 Courses',             'usd' => 597, 'type' => 'bundle', 'delivery' => 'All 3 course access links via WhatsApp within 15 min'],
    'automation-os'   => ['name' => 'Automation OS — Complete Bundle',             'usd' => 697, 'type' => 'bundle', 'delivery' => 'All courses + PDF links via WhatsApp within 15 min'],
    'whatsapp-pdf'    => ['name' => 'WhatsApp Automation Playbook (PDF)',           'usd' =>  47, 'type' => 'pdf',    'delivery' => 'PDF download link via email within 5 min'],
    'chatbot-pdf'     => ['name' => 'AI Chatbot Automation Playbook (PDF)',         'usd' =>  57, 'type' => 'pdf',    'delivery' => 'PDF download link via email within 5 min'],
    'pdf-bundle'      => ['name' => 'PDF Bundle — Both Playbooks',                 'usd' =>  77, 'type' => 'pdf',    'delivery' => 'Both PDF download links via email within 5 min'],
  ];
}

/* ─── FX helpers ────────────────────────────────────────────── */
function cat_fx_rate() {
  $c = config();
  return (float)($c['usd_clp_rate'] ?? 950.0);
}

function cat_to_clp($usd) {
  $raw = $usd * cat_fx_rate();
  // Round to nearest 100 CLP for small amounts, 1000 for large
  $unit = $usd >= 100 ? 1000 : 100;
  return (int)(round($raw / $unit) * $unit);
}

/* ─── DB schema ─────────────────────────────────────────────── */
function cat_ensure_schema() {
  db()->exec("CREATE TABLE IF NOT EXISTS catalogue_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_code VARCHAR(40) NOT NULL,
    usd_amount DECIMAL(8,2) NOT NULL,
    method VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    email VARCHAR(255) DEFAULT NULL,
    customer_name VARCHAR(255) DEFAULT NULL,
    external_ref VARCHAR(100) DEFAULT NULL,
    stripe_session_id VARCHAR(120) DEFAULT NULL,
    stripe_payment_intent VARCHAR(120) DEFAULT NULL,
    mp_preference_id VARCHAR(120) DEFAULT NULL,
    mp_payment_id VARCHAR(120) DEFAULT NULL,
    delivery_sent TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY ix_product (product_code),
    KEY ix_status (status),
    KEY ix_ext (external_ref),
    KEY ix_stripe (stripe_session_id),
    KEY ix_mp_pref (mp_preference_id)
  )");
}

function cat_create_order($code, $usd, $method, $email, $name, $extRef, $stripeId, $mpPrefId) {
  db()->prepare(
    "INSERT INTO catalogue_orders
       (product_code, usd_amount, method, email, customer_name, external_ref, stripe_session_id, mp_preference_id)
     VALUES (?,?,?,?,?,?,?,?)"
  )->execute([$code, $usd, $method, $email ?: null, $name ?: null, $extRef, $stripeId, $mpPrefId]);
  return (int)db()->lastInsertId();
}

/* ─── Stripe helpers ────────────────────────────────────────── */
function cat_stripe_key() {
  return config()['stripe_secret_key'] ?? '';
}

function cat_stripe_request($method, $path, $data = []) {
  $key = cat_stripe_key();
  if (!$key) return ['code' => 503, 'json' => ['error' => ['message' => 'Stripe not configured']]];
  $ch = curl_init('https://api.stripe.com/v1' . $path);
  $opts = [
    CURLOPT_RETURNTRANSFER => 1,
    CURLOPT_USERPWD        => $key . ':',
    CURLOPT_TIMEOUT        => 20,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/x-www-form-urlencoded'],
  ];
  if ($method === 'POST') {
    $opts[CURLOPT_POST]       = 1;
    $opts[CURLOPT_POSTFIELDS] = http_build_query($data);
  }
  curl_setopt_array($ch, $opts);
  $res  = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  return ['code' => $code, 'json' => json_decode($res, true)];
}

/* ─── Mercado Pago helpers ──────────────────────────────────── */
function cat_mp_token() {
  return config()['mp_access_token'] ?? '';
}

function cat_mp_post($path, $body) {
  $token = cat_mp_token();
  if (!$token) return ['code' => 503, 'json' => ['message' => 'MP not configured']];
  $ch = curl_init('https://api.mercadopago.com' . $path);
  curl_setopt_array($ch, [
    CURLOPT_POST           => 1,
    CURLOPT_RETURNTRANSFER => 1,
    CURLOPT_HTTPHEADER     => [
      'Authorization: Bearer ' . $token,
      'Content-Type: application/json',
      'X-Idempotency-Key: ' . bin2hex(random_bytes(16)),
    ],
    CURLOPT_POSTFIELDS => json_encode($body),
    CURLOPT_TIMEOUT    => 30,
  ]);
  $res  = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  return ['code' => $code, 'json' => json_decode($res, true)];
}

function cat_mp_get($path) {
  $token = cat_mp_token();
  if (!$token) return ['code' => 503, 'json' => null];
  $ch = curl_init('https://api.mercadopago.com' . $path);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => 1,
    CURLOPT_HTTPHEADER     => ['Authorization: Bearer ' . $token],
    CURLOPT_TIMEOUT        => 15,
  ]);
  $res  = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  return ['code' => $code, 'json' => json_decode($res, true)];
}

/* ─── Route handler ─────────────────────────────────────────── */
function route_catalogue($parts, $method) {
  cat_ensure_schema();
  $sub  = $parts[0] ?? '';
  $sub2 = $parts[1] ?? '';

  /* GET /api/catalogue/products */
  if ($sub === 'products' && $method === 'GET') {
    $out = [];
    foreach (cat_products() as $code => $p) {
      $out[] = array_merge($p, ['code' => $code, 'clp' => cat_to_clp($p['usd'])]);
    }
    json_out(['items' => $out, 'fx_rate' => cat_fx_rate()]);
  }

  /* POST /api/catalogue/checkout */
  if ($sub === 'checkout' && $method === 'POST') {
    $b       = required(['product_code', 'method']);
    $code    = $b['product_code'];
    $pm      = $b['method'];
    $email   = trim((string)($b['email'] ?? ''));
    $name    = trim((string)($b['name']  ?? ''));
    $products = cat_products();

    if (!isset($products[$code])) err('Unknown product', 400);
    if (!in_array($pm, ['stripe', 'mp'], true)) err('method must be stripe or mp', 400);

    $product  = $products[$code];
    $siteUrl  = rtrim(config()['site_url'] ?? 'https://netwebmedia.com', '/');
    $extRef   = 'cat_' . $code . '_' . time() . '_' . bin2hex(random_bytes(4));
    $successUrl = $siteUrl . '/checkout.html?success=1&product=' . urlencode($code);
    $cancelUrl  = $siteUrl . '/checkout.html?product=' . urlencode($code) . '&cancelled=1';

    /* ── Stripe ── */
    if ($pm === 'stripe') {
      if (!cat_stripe_key()) err('Stripe is not configured on this server — please use Mercado Pago', 503);
      $data = [
        'mode'                                              => 'payment',
        'line_items[0][price_data][currency]'               => 'usd',
        'line_items[0][price_data][product_data][name]'     => $product['name'],
        'line_items[0][price_data][product_data][description]' => $product['delivery'],
        'line_items[0][price_data][unit_amount]'            => (int)($product['usd'] * 100),
        'line_items[0][quantity]'                           => '1',
        'payment_method_types[0]'                           => 'card',
        'success_url'                                       => $successUrl . '&session_id={CHECKOUT_SESSION_ID}',
        'cancel_url'                                        => $cancelUrl,
        'metadata[product_code]'                            => $code,
        'metadata[external_ref]'                            => $extRef,
      ];
      if ($email) $data['customer_email'] = $email;
      $r = cat_stripe_request('POST', '/checkout/sessions', $data);
      if ($r['code'] >= 300 || empty($r['json']['url'])) {
        err('Stripe error: ' . ($r['json']['error']['message'] ?? 'unknown'), 502, ['stripe' => $r['json']]);
      }
      $orderId = cat_create_order($code, $product['usd'], 'stripe', $email, $name, $extRef, $r['json']['id'], null);
      json_out(['checkout_url' => $r['json']['url'], 'order_id' => $orderId, 'method' => 'stripe']);
    }

    /* ── Mercado Pago ── */
    if ($pm === 'mp') {
      if (!cat_mp_token()) err('Mercado Pago is not configured on this server', 503);
      $clp     = cat_to_clp($product['usd']);
      $payload = [
        'items' => [[
          'title'       => $product['name'],
          'description' => 'NetWebMedia · ' . $product['delivery'],
          'quantity'    => 1,
          'unit_price'  => $clp,
          'currency_id' => 'CLP',
        ]],
        'external_reference'   => $extRef,
        'statement_descriptor' => 'NETWEBMEDIA',
        'back_urls' => [
          'success' => $successUrl,
          'failure' => $cancelUrl . '&failed=1',
          'pending' => $siteUrl . '/checkout.html?success=pending&product=' . urlencode($code),
        ],
        'auto_return'      => 'approved',
        'notification_url' => $siteUrl . '/api/catalogue/webhook/mp',
      ];
      if ($email) $payload['payer'] = ['email' => $email, 'name' => $name ?: null];
      $r = cat_mp_post('/checkout/preferences', $payload);
      if ($r['code'] >= 300 || empty($r['json']['init_point'])) {
        err('Mercado Pago error: ' . ($r['json']['message'] ?? 'unknown'), 502, ['mp' => $r['json']]);
      }
      $orderId = cat_create_order($code, $product['usd'], 'mp', $email, $name, $extRef, null, $r['json']['id'] ?? null);
      json_out(['checkout_url' => $r['json']['init_point'], 'order_id' => $orderId, 'method' => 'mp']);
    }
  }

  /* POST /api/catalogue/webhook/stripe */
  if ($sub === 'webhook' && $sub2 === 'stripe' && $method === 'POST') {
    $payload   = file_get_contents('php://input');
    $sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
    $secret    = config()['stripe_webhook_secret'] ?? '';
    if ($secret && $sigHeader) {
      $ts = null; $valid = false;
      foreach (explode(',', $sigHeader) as $part) {
        if (str_starts_with($part, 't='))  $ts = (int)substr($part, 2);
        if (str_starts_with($part, 'v1=')) {
          $expected = hash_hmac('sha256', $ts . '.' . $payload, $secret);
          if (hash_equals($expected, substr($part, 3))) $valid = true;
        }
      }
      if (!$valid) { http_response_code(400); exit('Bad signature'); }
    }
    $event = json_decode($payload, true);
    if (($event['type'] ?? '') === 'checkout.session.completed') {
      $sess = $event['data']['object'];
      $sid  = $sess['id'];
      $pi   = $sess['payment_intent'] ?? null;
      $ref  = $sess['metadata']['external_ref'] ?? null;
      db()->prepare(
        "UPDATE catalogue_orders SET status='paid', stripe_payment_intent=?
         WHERE stripe_session_id=? OR external_ref=?"
      )->execute([$pi, $sid, $ref]);
    }
    json_out(['ok' => true]);
  }

  /* POST /api/catalogue/webhook/mp */
  if ($sub === 'webhook' && $sub2 === 'mp' && $method === 'POST') {
    $raw    = file_get_contents('php://input');
    $b      = json_decode($raw, true) ?: [];
    $topic  = $b['type'] ?? $b['topic'] ?? ($_GET['topic'] ?? '');
    $dataId = $b['data']['id'] ?? ($_GET['id'] ?? '');
    if ($topic === 'payment' && $dataId) {
      $r      = cat_mp_get('/v1/payments/' . $dataId);
      $pay    = $r['json'] ?? [];
      $ref    = $pay['external_reference'] ?? null;
      $status = $pay['status'] ?? '';
      if ($status === 'approved' && $ref) {
        db()->prepare(
          "UPDATE catalogue_orders SET status='paid', mp_payment_id=? WHERE external_ref=?"
        )->execute([$dataId, $ref]);
      }
    }
    json_out(['ok' => true]);
  }

  err('Not found', 404);
}
