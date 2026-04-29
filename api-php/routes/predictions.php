<?php
/**
 * Predictive lead scoring — statistical (not ML-library-based) scoring from
 * historical conversion patterns.
 *
 * Approach: For each categorical feature on a contact (niche_key, segment,
 * source, region, lifecycle_stage, has_phone/email/website), compute the
 * conversion rate of historical contacts with that feature value vs the
 * baseline conversion rate. Use Laplace smoothing to avoid 0/N artifacts.
 *
 * The predicted close-probability for a new contact is the geometric mean
 * of conditional rates over their feature values. Calibrated to [0, 100].
 *
 * Routes (all auth):
 *   GET  /api/predictions/contact/{id}    — predicted close probability + top reasons
 *   GET  /api/predictions/feature-importance — feature importance ranking
 *   POST /api/predictions/recompute       — recompute model snapshot (cache lift table)
 *   GET  /api/predictions/model           — current model snapshot
 *
 * Notes:
 * - "customer" status = positive label
 * - "churned" / "disqualified" = explicit negative
 * - Anything else: neutral (excluded from training set)
 * - Model recomputes on demand. Cached in predictions_model row.
 */

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';

const PREDICTION_FEATURES = [
  'niche_key', 'segment', 'source', 'region', 'city', 'lifecycle_stage', 'status',
  'has_phone', 'has_email', 'has_website',
];

function predictions_ensure_schema() {
  static $done = false; if ($done) return;
  db()->exec("CREATE TABLE IF NOT EXISTS predictions_model (
    org_id     INT PRIMARY KEY,
    payload    LONGTEXT NOT NULL,
    trained_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    n_positive INT NOT NULL DEFAULT 0,
    n_negative INT NOT NULL DEFAULT 0,
    n_total    INT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  $done = true;
}

function route_predictions($parts, $method) {
  predictions_ensure_schema();
  $user = requireAuth();
  $sub = $parts[0] ?? null;

  if ($sub === 'contact' && isset($parts[1]) && $method === 'GET') {
    return predictions_for_contact((int)$parts[1], $user);
  }
  if ($sub === 'feature-importance' && $method === 'GET') return predictions_feature_importance($user);
  if ($sub === 'recompute' && $method === 'POST')         return predictions_recompute($user);
  if ($sub === 'model' && $method === 'GET')              return predictions_model($user);

  err('Predictions route not found', 404);
}

function predictions_train_model($user) {
  $rows = qAll("SELECT data FROM resources WHERE type='contact' LIMIT 50000");
  $positives = []; $negatives = [];
  foreach ($rows as $r) {
    $d = json_decode($r['data'] ?? '{}', true) ?: [];
    $label = predictions_label($d);
    if ($label === 1) $positives[] = predictions_features($d);
    elseif ($label === 0) $negatives[] = predictions_features($d);
  }

  $nPos = count($positives); $nNeg = count($negatives); $nTotal = $nPos + $nNeg;
  $baseline = $nTotal > 0 ? ($nPos / $nTotal) : 0.0;

  // For each feature, build value → {pos_count, neg_count, conditional_rate, lift}
  $featureStats = [];
  foreach (PREDICTION_FEATURES as $f) {
    $values = [];
    foreach ($positives as $row) { $v = $row[$f] ?? null; if ($v === null) continue; $values[$v] = $values[$v] ?? ['pos'=>0,'neg'=>0]; $values[$v]['pos']++; }
    foreach ($negatives as $row) { $v = $row[$f] ?? null; if ($v === null) continue; $values[$v] = $values[$v] ?? ['pos'=>0,'neg'=>0]; $values[$v]['neg']++; }
    $byValue = [];
    foreach ($values as $v => $c) {
      $n = $c['pos'] + $c['neg'];
      if ($n < 3) continue; // skip noisy values
      // Laplace smoothing: alpha = 1 prior in each class
      $rate = ($c['pos'] + 1) / ($n + 2);
      $lift = $baseline > 0 ? ($rate / $baseline) : 1;
      $byValue[(string)$v] = [
        'pos'  => $c['pos'],
        'neg'  => $c['neg'],
        'n'    => $n,
        'rate' => round($rate, 4),
        'lift' => round($lift, 3),
      ];
    }
    if ($byValue) {
      // Feature importance = max |log(lift)| across values × log(n+1)
      $imp = 0.0;
      foreach ($byValue as $stats) {
        $imp = max($imp, abs(log(max(0.0001, $stats['lift']))) * log($stats['n'] + 1));
      }
      $featureStats[$f] = [
        'values'     => $byValue,
        'importance' => round($imp, 3),
      ];
    }
  }

  $model = [
    'baseline'  => round($baseline, 4),
    'features'  => $featureStats,
    'n_positive'=> $nPos,
    'n_negative'=> $nNeg,
    'n_total'   => $nTotal,
    'trained_at'=> date('c'),
  ];

  qExec(
    "INSERT INTO predictions_model (org_id, payload, n_positive, n_negative, n_total)
     VALUES (?,?,?,?,?)
     ON DUPLICATE KEY UPDATE payload = VALUES(payload), n_positive = VALUES(n_positive),
                             n_negative = VALUES(n_negative), n_total = VALUES(n_total)",
    [(int)($user['org_id'] ?? 1), json_encode($model), $nPos, $nNeg, $nTotal]
  );

  if (function_exists('log_activity')) {
    log_activity('predictions.trained', null, null, [
      'positives' => $nPos, 'negatives' => $nNeg, 'features' => count($featureStats),
    ]);
  }
  return $model;
}

function predictions_load_model($user, $autoTrain = true) {
  $row = qOne("SELECT payload FROM predictions_model WHERE org_id = ?", [(int)($user['org_id'] ?? 1)]);
  if ($row) return json_decode($row['payload'], true);
  if ($autoTrain) return predictions_train_model($user);
  return null;
}

function predictions_label($d) {
  $status = strtolower((string)($d['status'] ?? ''));
  $lifecycle = strtolower((string)($d['lifecycle_stage'] ?? ''));
  if ($status === 'customer'      || $lifecycle === 'customer') return 1;
  if ($status === 'churned'       || $lifecycle === 'churned') return 0;
  if ($status === 'disqualified') return 0;
  return null;
}

function predictions_features($d) {
  return [
    'niche_key'       => $d['niche_key']       ?? null,
    'segment'         => $d['segment']         ?? null,
    'source'          => $d['source']          ?? null,
    'region'          => $d['region']          ?? null,
    'city'            => $d['city']            ?? null,
    'lifecycle_stage' => $d['lifecycle_stage'] ?? null,
    'status'          => $d['status']          ?? null,
    'has_phone'       => !empty($d['phone'])   ? 'yes' : 'no',
    'has_email'       => !empty($d['email'])   ? 'yes' : 'no',
    'has_website'     => !empty($d['website']) ? 'yes' : 'no',
  ];
}

function predictions_predict($features, $model) {
  if (!$model) return ['probability' => 0.0, 'confidence' => 'no_model', 'matches' => []];
  $baseline = $model['baseline'] ?? 0.0;
  if ($baseline <= 0) return ['probability' => 0.0, 'confidence' => 'no_positives', 'matches' => []];

  // Geometric mean of conditional rates / baseline (then × baseline).
  // Equivalent to product-of-likelihood-ratios under naive-Bayes-like independence.
  $logSum = 0.0;
  $count = 0;
  $matches = [];
  foreach ($features as $fName => $fValue) {
    if ($fValue === null || $fValue === '') continue;
    $fStat = $model['features'][$fName] ?? null;
    if (!$fStat) continue;
    $byVal = $fStat['values'][(string)$fValue] ?? null;
    if (!$byVal) continue;
    $logSum += log(max(0.0001, $byVal['rate']) / max(0.0001, $baseline));
    $count++;
    $matches[] = [
      'feature'    => $fName,
      'value'      => $fValue,
      'rate'       => $byVal['rate'],
      'lift'       => $byVal['lift'],
      'sample'     => $byVal['n'],
    ];
  }
  if ($count === 0) {
    return ['probability' => round($baseline * 100, 1), 'confidence' => 'baseline_only', 'matches' => []];
  }
  $logRR = $logSum / $count;        // average log-ratio (smoother than full product)
  $rate  = $baseline * exp($logRR); // back to a probability
  $rate  = max(0.0, min(1.0, $rate));

  // Confidence label
  $totalSample = array_sum(array_map(function ($m) { return $m['sample']; }, $matches));
  $conf = $totalSample >= 100 ? 'high' : ($totalSample >= 30 ? 'medium' : 'low');

  // Sort matches by absolute lift away from 1 (most informative first)
  usort($matches, function ($a, $b) {
    return abs(log(max(0.0001, $b['lift']))) <=> abs(log(max(0.0001, $a['lift'])));
  });

  return [
    'probability' => round($rate * 100, 1),
    'baseline'    => round($baseline * 100, 1),
    'confidence'  => $conf,
    'matches'     => array_slice($matches, 0, 5),
    'n_features'  => $count,
    'sample_size' => $totalSample,
  ];
}

/* ─────────────────────  ENDPOINTS  ───────────────────── */

function predictions_for_contact($id, $user) {
  $row = qOne("SELECT id, data FROM resources WHERE id = ? AND type = 'contact'", [$id]);
  if (!$row) err('Contact not found', 404);
  $d = json_decode($row['data'] ?? '{}', true) ?: [];

  $model = predictions_load_model($user);
  $features = predictions_features($d);
  $pred = predictions_predict($features, $model);

  json_out([
    'ok'         => true,
    'contact_id' => (int)$id,
    'features'   => $features,
    'prediction' => $pred,
    'model'      => $model ? [
      'baseline'   => $model['baseline'] * 100,
      'n_positive' => $model['n_positive'],
      'n_negative' => $model['n_negative'],
      'trained_at' => $model['trained_at'],
    ] : null,
  ]);
}

function predictions_feature_importance($user) {
  $model = predictions_load_model($user);
  if (!$model) json_out(['ok' => false, 'reason' => 'no_data', 'features' => []]);
  $f = $model['features'] ?? [];
  $rows = [];
  foreach ($f as $name => $stats) {
    $top = [];
    $values = $stats['values'] ?? [];
    uasort($values, function ($a, $b) {
      return abs(log(max(0.0001, $b['lift']))) <=> abs(log(max(0.0001, $a['lift'])));
    });
    foreach (array_slice($values, 0, 4, true) as $v => $vs) {
      $top[] = ['value' => $v, 'rate' => $vs['rate'], 'lift' => $vs['lift'], 'sample' => $vs['n']];
    }
    $rows[] = [
      'feature'      => $name,
      'importance'   => $stats['importance'] ?? 0,
      'top_values'   => $top,
    ];
  }
  usort($rows, function ($a, $b) { return $b['importance'] <=> $a['importance']; });
  json_out([
    'ok'         => true,
    'baseline'   => round(($model['baseline'] ?? 0) * 100, 1),
    'n_positive' => $model['n_positive'] ?? 0,
    'n_negative' => $model['n_negative'] ?? 0,
    'features'   => $rows,
  ]);
}

function predictions_recompute($user) {
  $m = predictions_train_model($user);
  json_out([
    'ok'         => true,
    'baseline'   => round($m['baseline'] * 100, 1),
    'n_positive' => $m['n_positive'],
    'n_negative' => $m['n_negative'],
    'n_features' => count($m['features']),
  ]);
}

function predictions_model($user) {
  $row = qOne("SELECT trained_at, n_positive, n_negative, n_total FROM predictions_model WHERE org_id = ?", [(int)($user['org_id'] ?? 1)]);
  if (!$row) json_out(['ok' => false, 'trained' => false]);
  json_out(['ok' => true, 'trained' => true,
            'trained_at' => $row['trained_at'],
            'n_positive' => (int)$row['n_positive'],
            'n_negative' => (int)$row['n_negative'],
            'n_total'    => (int)$row['n_total']]);
}
