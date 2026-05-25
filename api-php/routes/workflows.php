<?php
/* Workflow management routes (authed).
   GET    /api/workflows            list
   POST   /api/workflows            create
   GET    /api/workflows/{id}       get
   PUT    /api/workflows/{id}       update
   DELETE /api/workflows/{id}       delete
   POST   /api/workflows/{id}/run   manual trigger with optional body as context
   GET    /api/workflows/{id}/runs  list recent runs
   GET    /api/workflows/runs/pending  all pending runs (for debugging)
*/

require_once __DIR__ . '/../lib/workflows.php';

function route_workflows($parts, $method) {
  $user = requirePaidAccess();
  $orgId = (int) $user['org_id'];

  $id = $parts[0] ?? null;

  // GET /workflows
  if (!$id && $method === 'GET') {
    $rows = qAll(
      "SELECT id, slug, title, status, data, created_at, updated_at
       FROM resources WHERE type='workflow' AND org_id = ? ORDER BY id DESC",
      [$orgId]
    );
    foreach ($rows as &$r) $r['data'] = json_decode($r['data'], true);
    json_out(['items' => $rows]);
  }

  // POST /workflows
  if (!$id && $method === 'POST') {
    $b = required(['title']);
    $slug = $b['slug'] ?? ('wf-' . substr(bin2hex(random_bytes(4)), 0, 8));
    $data = $b['data'] ?? ['trigger' => ['type' => 'manual'], 'steps' => []];
    qExec(
      "INSERT INTO resources (org_id, type, slug, title, status, data, owner_id)
       VALUES (?, 'workflow', ?, ?, ?, ?, ?)",
      [$orgId, $slug, $b['title'], $b['status'] ?? 'active', json_encode($data), $user['id']]
    );
    json_out(['ok' => true, 'id' => lastId()], 201);
  }

  // /workflows/runs/pending
  if ($id === 'runs' && ($parts[1] ?? null) === 'pending' && $method === 'GET') {
    $rows = qAll(
      'SELECT * FROM workflow_runs WHERE org_id = ? AND status = "pending" ORDER BY id DESC LIMIT 100',
      [$orgId]
    );
    json_out(['items' => $rows]);
  }

  $wfId = (int) $id;
  $wf = qOne("SELECT * FROM resources WHERE type='workflow' AND id = ? AND org_id = ?", [$wfId, $orgId]);
  if (!$wf) err('Workflow not found', 404);

  // GET /workflows/{id}
  if (!isset($parts[1]) && $method === 'GET') {
    $wf['data'] = json_decode($wf['data'], true);
    json_out($wf);
  }

  // PUT /workflows/{id}
  if (!isset($parts[1]) && $method === 'PUT') {
    $b = body();
    $fields = [];
    $vals = [];
    if (isset($b['title']))  { $fields[] = 'title = ?';  $vals[] = $b['title']; }
    if (isset($b['status'])) { $fields[] = 'status = ?'; $vals[] = $b['status']; }
    if (isset($b['data']))   { $fields[] = 'data = ?';   $vals[] = json_encode($b['data']); }
    if (isset($b['slug']))   { $fields[] = 'slug = ?';   $vals[] = $b['slug']; }
    if (!$fields) err('nothing to update');
    $vals[] = $wfId;
    qExec('UPDATE resources SET ' . implode(', ', $fields) . ' WHERE id = ?', $vals);
    json_out(['ok' => true]);
  }

  // DELETE /workflows/{id}
  if (!isset($parts[1]) && $method === 'DELETE') {
    qExec('DELETE FROM resources WHERE id = ?', [$wfId]);
    json_out(['ok' => true]);
  }

  // POST /workflows/{id}/run
  if (($parts[1] ?? null) === 'run' && $method === 'POST') {
    $ctx = body() ?: [];
    $run_id = wf_enqueue($wfId, $orgId, $ctx);
    $run = qOne('SELECT * FROM workflow_runs WHERE id = ?', [$run_id]);
    wf_advance($run);
    json_out(['ok' => true, 'run_id' => $run_id]);
  }

  // GET /workflows/{id}/runs
  if (($parts[1] ?? null) === 'runs' && $method === 'GET') {
    $rows = qAll(
      'SELECT * FROM workflow_runs WHERE workflow_id = ? ORDER BY id DESC LIMIT 50',
      [$wfId]
    );
    foreach ($rows as &$r) {
      $logs = qAll('SELECT * FROM workflow_step_log WHERE run_id = ? ORDER BY id', [$r['id']]);
      $r['logs'] = $logs;
    }
    json_out(['items' => $rows]);
  }

  err('Workflow route not found', 404);
}
