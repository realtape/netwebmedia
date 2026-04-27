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

$db = getDB();

// Ensure the invoices table exists (idempotent migration).
$db->exec("
    CREATE TABLE IF NOT EXISTS `invoices` (
        `id`            INT AUTO_INCREMENT PRIMARY KEY,
        `invoice_num`   VARCHAR(32)  NOT NULL DEFAULT '',
        `contact_id`    INT          NULL,
        `client_name`   VARCHAR(255) NOT NULL DEFAULT '',
        `company`       VARCHAR(255) NOT NULL DEFAULT '',
        `amount`        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        `status`        ENUM('draft','pending','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
        `invoice_date`  DATE         NOT NULL DEFAULT (CURDATE()),
        `due_date`      DATE         NULL,
        `notes`         TEXT         NULL,
        `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `updated_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY `idx_status` (`status`),
        KEY `idx_contact` (`contact_id`)
    ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
");

$db->exec("
    CREATE TABLE IF NOT EXISTS `subscriptions` (
        `id`            INT AUTO_INCREMENT PRIMARY KEY,
        `contact_id`    INT          NULL,
        `client_name`   VARCHAR(255) NOT NULL DEFAULT '',
        `plan`          VARCHAR(100) NOT NULL DEFAULT 'Starter',
        `amount`        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        `interval_type` ENUM('monthly','annual','one-time') NOT NULL DEFAULT 'monthly',
        `status`        ENUM('active','past_due','cancelled','paused') NOT NULL DEFAULT 'active',
        `next_bill_date` DATE        NULL,
        `created_at`    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
");

// ── GET ───────────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    $tab = $_GET['tab'] ?? 'overview';

    // Summary stats from invoices
    $stats = $db->query("
        SELECT
            SUM(CASE WHEN status='paid'    THEN amount ELSE 0 END) AS total_revenue,
            SUM(CASE WHEN status='pending' THEN amount ELSE 0 END) AS outstanding,
            SUM(CASE WHEN status='overdue' THEN amount ELSE 0 END) AS overdue,
            SUM(CASE WHEN status='paid' AND MONTH(invoice_date)=MONTH(CURDATE())
                                         THEN amount ELSE 0 END)   AS this_month
        FROM invoices
    ")->fetch();

    $summary = [
        'total_revenue' => (float)($stats['total_revenue'] ?? 0),
        'outstanding'   => (float)($stats['outstanding']   ?? 0),
        'overdue'       => (float)($stats['overdue']       ?? 0),
        'this_month'    => (float)($stats['this_month']    ?? 0),
    ];

    // Invoices
    $invoices = $db->query("
        SELECT i.*, c.name as contact_name
        FROM invoices i
        LEFT JOIN contacts c ON i.contact_id = c.id
        ORDER BY i.created_at DESC
        LIMIT 100
    ")->fetchAll();

    // Subscriptions
    $subscriptions = $db->query("
        SELECT s.*, c.name as contact_name
        FROM subscriptions s
        LEFT JOIN contacts c ON s.contact_id = c.id
        ORDER BY s.status ASC, s.next_bill_date ASC
        LIMIT 100
    ")->fetchAll();

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
        INSERT INTO invoices (invoice_num, contact_id, client_name, company, amount, status, invoice_date, due_date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
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
