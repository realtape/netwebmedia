<?php
/**
 * Deal forecasting — weighted pipeline value (sum of value × probability%).
 *
 * Routes (all auth):
 *   GET /api/forecast              — pipeline summary by stage + weighted total
 *   GET /api/forecast/by-owner     — breakdown per sales rep
 *   GET /api/forecast/by-month     — close-month breakdown (next 6 months)
 *
 * Reads the canonical CRM `deals` table (crm-vanilla schema) when present;
 * falls back to resources WHERE type='deal'. All amounts in the org's currency
 * (no FX conversion at this layer).
 */

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';

function route_forecast($parts, $method) {
  if ($method !== 'GET') err('Method not allowed', 405);
  $user = requireAuth();
  $sub = $parts[0] ?? null;

  if ($sub === 'by-owner') return forecast_by_owner($user);
  if ($sub === 'by-month') return forecast_by_month($user);
  return forecast_summary($user);
}

function forecast_load_deals() {
  // Prefer the canonical deals table (crm-vanilla) when present, since it has
  // first-class value/probability/stage columns. Fall back to resources EAV.
  try {
    $rows = qAll(
      "SELECT id, title, value, probability, stage_id, owner_id, created_at, expected_close, status
         FROM deals
        WHERE COALESCE(status,'open') NOT IN ('lost','won','closed_lost')
        LIMIT 5000"
    );
    if ($rows !== null) {
      $stages = forecast_load_stages();
      foreach ($rows as &$r) {
        $r['_value']       = (float)($r['value'] ?? 0);
        $r['_probability'] = (float)($r['probability'] ?? 0);
        $r['_stage']       = $stages[(int)($r['stage_id'] ?? 0)] ?? 'Unknown';
        $r['_owner_id']    = $r['owner_id'] !== null ? (int)$r['owner_id'] : null;
        $r['_close']       = $r['expected_close'] ?? null;
      }
      return $rows;
    }
  } catch (Exception $e) {
    // Table may not exist in this org → use resources fallback below
  }

  $rows = [];
  try {
    $raw = qAll("SELECT id, data FROM resources WHERE type='deal' LIMIT 5000");
    foreach ($raw as $r) {
      $d = json_decode($r['data'] ?? '{}', true) ?: [];
      $rows[] = [
        'id'           => (int)$r['id'],
        'title'        => $d['title'] ?? '(untitled)',
        '_value'       => (float)($d['value'] ?? 0),
        '_probability' => (float)($d['probability'] ?? 0),
        '_stage'       => $d['stage'] ?? 'Unknown',
        '_owner_id'    => isset($d['owner_id']) ? (int)$d['owner_id'] : null,
        '_close'       => $d['close_date'] ?? null,
      ];
    }
  } catch (Exception $e) {}
  return $rows;
}

function forecast_load_stages() {
  try {
    $rows = qAll("SELECT id, name FROM pipeline_stages");
    $out = [];
    foreach ($rows as $r) $out[(int)$r['id']] = $r['name'];
    return $out;
  } catch (Exception $e) {
    return [];
  }
}

function forecast_summary($user) {
  $deals = forecast_load_deals();
  $byStage = [];
  $totalValue = $weightedValue = 0.0;
  $count = count($deals);

  foreach ($deals as $d) {
    $stage = $d['_stage'];
    if (!isset($byStage[$stage])) {
      $byStage[$stage] = ['stage' => $stage, 'count' => 0, 'value' => 0.0, 'weighted_value' => 0.0];
    }
    $w = $d['_value'] * ($d['_probability'] / 100);
    $byStage[$stage]['count']++;
    $byStage[$stage]['value']           += $d['_value'];
    $byStage[$stage]['weighted_value']  += $w;
    $totalValue    += $d['_value'];
    $weightedValue += $w;
  }

  // Sort stages by total value desc
  usort($byStage, function ($a, $b) { return $b['value'] <=> $a['value']; });
  foreach ($byStage as &$s) {
    $s['value']          = round($s['value'], 2);
    $s['weighted_value'] = round($s['weighted_value'], 2);
  }

  json_out([
    'ok'              => true,
    'deal_count'      => $count,
    'total_value'     => round($totalValue, 2),
    'weighted_value'  => round($weightedValue, 2),
    'avg_probability' => $count > 0 ? round(($weightedValue / max($totalValue, 0.0001)) * 100, 1) : 0,
    'by_stage'        => array_values($byStage),
  ]);
}

function forecast_by_owner($user) {
  $deals = forecast_load_deals();
  // Map owner_id → user name where possible
  $ownerNames = [];
  try {
    $users = qAll("SELECT id, name, email FROM users");
    foreach ($users as $u) $ownerNames[(int)$u['id']] = $u['name'] ?: $u['email'];
  } catch (Exception $e) {}

  $byOwner = [];
  foreach ($deals as $d) {
    $oid = $d['_owner_id'];
    $key = $oid !== null ? ('user:' . $oid) : 'unassigned';
    if (!isset($byOwner[$key])) {
      $byOwner[$key] = [
        'owner_id'   => $oid,
        'owner_name' => $oid !== null ? ($ownerNames[$oid] ?? "User #$oid") : 'Unassigned',
        'count'      => 0, 'value' => 0.0, 'weighted_value' => 0.0,
      ];
    }
    $byOwner[$key]['count']++;
    $byOwner[$key]['value']          += $d['_value'];
    $byOwner[$key]['weighted_value'] += $d['_value'] * ($d['_probability'] / 100);
  }
  usort($byOwner, function ($a, $b) { return $b['weighted_value'] <=> $a['weighted_value']; });
  foreach ($byOwner as &$o) {
    $o['value']          = round($o['value'], 2);
    $o['weighted_value'] = round($o['weighted_value'], 2);
  }
  json_out(['ok' => true, 'by_owner' => array_values($byOwner)]);
}

function forecast_by_month($user) {
  $deals = forecast_load_deals();
  $months = [];
  $now = time();
  // Build the next 6 months as buckets
  for ($i = 0; $i < 6; $i++) {
    $key = date('Y-m', strtotime("+$i month", $now));
    $months[$key] = ['month' => $key, 'count' => 0, 'value' => 0.0, 'weighted_value' => 0.0];
  }
  $months['later']    = ['month' => 'later',    'count' => 0, 'value' => 0.0, 'weighted_value' => 0.0];
  $months['no_close'] = ['month' => 'no_close', 'count' => 0, 'value' => 0.0, 'weighted_value' => 0.0];

  foreach ($deals as $d) {
    $key = 'no_close';
    if ($d['_close']) {
      $ts = strtotime($d['_close']);
      if ($ts) {
        $m = date('Y-m', $ts);
        if (isset($months[$m])) $key = $m;
        elseif ($ts > $now)     $key = 'later';
        else                     $key = $m; // past close date — stays in its month
      }
    }
    if (!isset($months[$key])) $months[$key] = ['month' => $key, 'count' => 0, 'value' => 0.0, 'weighted_value' => 0.0];
    $months[$key]['count']++;
    $months[$key]['value']          += $d['_value'];
    $months[$key]['weighted_value'] += $d['_value'] * ($d['_probability'] / 100);
  }

  $list = array_values($months);
  foreach ($list as &$m) {
    $m['value']          = round($m['value'], 2);
    $m['weighted_value'] = round($m['weighted_value'], 2);
  }
  json_out(['ok' => true, 'by_month' => $list]);
}
