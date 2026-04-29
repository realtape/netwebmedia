<?php
/**
 * Payments API Handler
 *
 * Routes:
 *   GET  /api/?r=payments               — list invoices, subscriptions, payment links, transactions
 *   GET  /api/?r=payments&tab=invoices  — invoices only
 *   POST /api/?r=payments               — create invoice
 *   PUT  /api/?r=payments&id=N          — update invoice status
 *
 * Returns summary stats + tabbed data for the Payments UI.
 */

require_once __DIR__ . '/../lib/tenancy.php';
$db = getDB();
[$tWhereI, $tParamsI] = tenant_where('i');
[$tWhereS, $tParamsS] = tenant_where('s');
$uid = tenant_id();

// DDL moved to schema_payments.sql — run via /api/?r=migrate&schema=payments
// Cache "tables exist" check per PHP-FPM process so we only verify once per worker.
static $payments_ready = false;
if (!$payments_ready) {
    try {
        $db->query('SELECT 1 FROM invoices LIMIT 1');
        $db->query('SELECT 1 FROM subscriptions LIMIT 1');
        $payments_ready = true;
    } catch (Throwable $e) {
        jsonError('Payments tables not initialized. Run /api/?r=migrate&schema=payments', 503);
    }
}

// ── GET ───────────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    $tab = $_GET['tab'] ?? 'overview';

    // Summary stats from invoices (tenant-scoped)
    $statsSql = "SELECT
            SUM(CASE WHEN status='paid'    THEN amount ELSE 0 END) AS total_revenue,
            SUM(CASE WHEN status='pending' THEN amount ELSE 0 END) AS outstanding,
            SUM(CASE WHEN status='overdue' THEN amount ELSE 0 END) AS overdue,
            SUM(CASE WHEN status='paid' AND MONTH(invoice_date)=MONTH(CURDATE())
                                         THEN amount ELSE 0 END)   AS this_month
        FROM invoices i";
    $statsParams = [];
    if ($tWhereI) { $statsSql .= ' WHERE ' . $tWhereI; $statsParams = $tParamsI; }
    $st = $db->prepare($statsSql);
    $st->execute($statsParams);
    $stats = $st->fetch();

    $summary = [
        'total_revenue' => (float)($stats['total_revenue'] ?? 0),
        'outstanding'   => (float)($stats['outstanding']   ?? 0),
        'overdue'       => (float)($stats['overdue']       ?? 0),
        'this_month'    => (float)($stats['this_month']    ?? 0),
    ];

    // Invoices (tenant-scoped)
    $invSql = "SELECT i.*, c.name as contact_name
               FROM invoices i
               LEFT JOIN contacts c ON i.contact_id = c.id";
    $invParams = [];
    if ($tWhereI) { $invSql .= ' WHERE ' . $tWhereI; $invParams = $tParamsI; }
    $invSql .= ' ORDER BY i.created_at DESC LIMIT 100';
    $st = $db->prepare($invSql);
    $st->execute($invParams);
    $invoices = $st->fetchAll();

    // Subscriptions (tenant-scoped)
    $subSql = "SELECT s.*, c.name as contact_name
               FROM subscriptions s
               LEFT JOIN contacts c ON s.contact_id = c.id";
    $subParams = [];
    if ($tWhereS) { $subSql .= ' WHERE ' . $tWhereS; $subParams = $tParamsS; }
    $subSql .= ' ORDER BY s.status ASC, s.next_bill_date ASC LIMIT 100';
    $st = $db->prepare($subSql);
    $st->execute($subParams);
    $subscriptions = $st->fetchAll();

    jsonResponse([
        'summary'       => $summary,
        'invoices'      => $invoices,
        'subscriptions' => $subscriptions,
    ]);
}

// ── POST — create invoice ─────────────────────────────────────────────────────
if ($method === 'POST') {
    $data = getInput();
    if (empty($data['client_name']) || empty($data['amount'])) {
        jsonError('client_name and amount are required');
    }
    // Auto-generate invoice number
    $count = (int)$db->query("SELECT COUNT(*) FROM invoices")->fetchColumn();
    $num   = 'INV-' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);

    $stmt = $db->prepare("
        INSERT INTO invoices (user_id, invoice_num, contact_id, client_name, company, amount, status, invoice_date, due_date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $uid,
        $num,
        $data['contact_id'] ?? null,
        $data['client_name'],
        $data['company'] ?? '',
        (float)$data['amount'],
        $data['status'] ?? 'pending',
        $data['invoice_date'] ?? date('Y-m-d'),
        $data['due_date'] ?? null,
        $data['notes'] ?? null,
    ]);
    jsonResponse(['id' => (int)$db->lastInsertId(), 'invoice_num' => $num], 201);
}

// ── PUT — update invoice status ───────────────────────────────────────────────
if ($method === 'PUT' && $id) {
    // Ownership check
    $own = $db->prepare('SELECT user_id FROM invoices WHERE id = ?');
    $own->execute([$id]);
    $row = $own->fetch();
    if (!$row) jsonError('Invoice not found', 404);
    if (!tenant_owns($row['user_id'] !== null ? (int)$row['user_id'] : null)) {
        jsonError('Invoice not found', 404);
    }

    $data = getInput();
    $allowed = ['draft', 'pending', 'paid', 'overdue', 'cancelled'];
    if (!empty($data['status']) && !in_array($data['status'], $allowed, true)) {
        jsonError('Invalid status');
    }
    $sets = [];
    $vals = [];
    foreach (['status', 'client_name', 'company', 'amount', 'due_date', 'notes'] as $f) {
        if (array_key_exists($f, $data)) {
            $sets[] = "`$f` = ?";
            $vals[] = $data[$f];
        }
    }
    if (!$sets) jsonError('Nothing to update');
    $vals[] = $id;
    $db->prepare("UPDATE invoices SET " . implode(', ', $sets) . " WHERE id = ?")->execute($vals);
    jsonResponse(['updated' => true]);
}

jsonError('Method not allowed', 405);
