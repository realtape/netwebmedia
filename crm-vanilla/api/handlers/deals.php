<?php
$db = getDB();

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $db->prepare('SELECT d.*, ps.name as stage, c.name as contact_name FROM deals d LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id LEFT JOIN contacts c ON d.contact_id = c.id WHERE d.id = ?');
            $stmt->execute([$id]);
            $deal = $stmt->fetch();
            if (!$deal) jsonError('Deal not found', 404);
            jsonResponse($deal);
        }
        $sql = 'SELECT d.*, ps.name as stage, c.name as contact_name FROM deals d LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id LEFT JOIN contacts c ON d.contact_id = c.id ORDER BY ps.sort_order, d.created_at DESC';
        $stmt = $db->query($sql);
        jsonResponse($stmt->fetchAll());
        break;

    case 'POST':
        $data = getInput();
        if (empty($data['title'])) jsonError('Title is required');
        $stmt = $db->prepare('INSERT INTO deals (title, company, value, contact_id, stage_id, probability, days_in_stage, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $data['title'],
            $data['company'] ?? null,
            $data['value'] ?? 0,
            $data['contact_id'] ?? null,
            $data['stage_id'] ?? 1,
            $data['probability'] ?? 0,
            $data['days_in_stage'] ?? 0,
            $data['source'] ?? null,
        ]);
        $newId = $db->lastInsertId();
        $stmt = $db->prepare('SELECT d.*, ps.name as stage FROM deals d LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id WHERE d.id = ?');
        $stmt->execute([$newId]);
        jsonResponse($stmt->fetch(), 201);
        break;

    case 'PUT':
        if (!$id) jsonError('ID required');
        $data = getInput();
        $fields = [];
        $params = [];
        $allowed = ['title','company','value','contact_id','stage_id','probability','days_in_stage','source','notes','next_action','next_followup_date'];
        foreach ($allowed as $f) {
            if (array_key_exists($f, $data)) {
                $fields[] = "$f = ?";
                $params[] = $data[$f];
            }
        }
        if (empty($fields)) jsonError('No fields to update');
        $params[] = $id;
        $db->prepare('UPDATE deals SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
        $stmt = $db->prepare('SELECT d.*, ps.name as stage FROM deals d LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id WHERE d.id = ?');
        $stmt->execute([$id]);
        jsonResponse($stmt->fetch());
        break;

    case 'DELETE':
        if (!$id) jsonError('ID required');
        $db->prepare('DELETE FROM deals WHERE id = ?')->execute([$id]);
        jsonResponse(['deleted' => true]);
        break;

    default:
        jsonError('Method not allowed', 405);
}
