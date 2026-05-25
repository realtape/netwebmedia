<?php
/**
 * Access-control guard — enforces "no app access until payment".
 *
 * Call requirePaidAccess() at the top of any handler that serves paid
 * product data (contacts, deals, campaigns, AI, CMO, content, etc.).
 *
 * States:
 *   pending_payment → HTTP 402 Payment Required (+ requires_payment=true)
 *   suspended       → HTTP 403 Forbidden
 *   cancelled       → HTTP 403 Forbidden
 *   active          → pass through, returns the user row
 *
 * superadmin (Carlos) always passes regardless of status.
 *
 * Schema note: relies on users.status column. bl_ensure_schema() in
 * billing.php auto-adds the column on first hit; guard.php tolerates
 * its absence (treats missing status as 'active' for backward-compat
 * during the migration window).
 */

require_once __DIR__ . '/auth.php';

function requirePaidAccess() {
  $u = requireAuth();

  // Superadmin bypass — Carlos needs support access across every org.
  if (($u['role'] ?? '') === 'superadmin') return $u;

  $status = $u['status'] ?? 'active';

  if ($status === 'active') return $u;

  if ($status === 'pending_payment') {
    http_response_code(402);
    header('Content-Type: application/json');
    echo json_encode([
      'error'            => 'Payment required',
      'requires_payment' => true,
      'checkout_url'     => '/cart.html',
      'status'           => 'pending_payment',
    ]);
    exit;
  }

  // suspended / cancelled / anything else
  http_response_code(403);
  header('Content-Type: application/json');
  echo json_encode([
    'error'  => 'Account ' . $status,
    'status' => $status,
  ]);
  exit;
}

/**
 * requireAdmin — same as requirePaidAccess but also checks role='admin' or 'superadmin'.
 * Use on org-management endpoints (invite users, change plan, etc.).
 */
function requireAdmin() {
  $u = requirePaidAccess();
  $role = $u['role'] ?? 'user';
  if ($role !== 'admin' && $role !== 'superadmin') {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Admin access required']);
    exit;
  }
  return $u;
}
