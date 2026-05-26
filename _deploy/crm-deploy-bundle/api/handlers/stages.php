<?php
$db = getDB();

switch ($method) {
    case 'GET':
        $stmt = $db->query('SELECT * FROM pipeline_stages ORDER BY sort_order');
        jsonResponse($stmt->fetchAll());
        break;

    default:
        jsonError('Method not allowed', 405);
}
