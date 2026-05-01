<?php
/**
 * Reports handler — CRUD for reports stored in CRM
 * Routes: GET /crm-vanilla/api/?r=reports (list/search)
 *         GET /crm-vanilla/api/?r=reports&id=123 (fetch one)
 *         POST /crm-vanilla/api/?r=reports (create/upsert)
 *         PUT /crm-vanilla/api/?r=reports&id=123 (update)
 *         DELETE /crm-vanilla/api/?r=reports&id=123 (archive)
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/tenancy.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

$ALLOWED_TYPES = ['finance', 'sales', 'data', 'project', 'customer-success', 'marketing', 'operations', 'executive'];
$ALLOWED_STATUS = ['draft', 'final', 'archived'];
$ALLOWED_RAG = ['green', 'amber', 'red'];

try {
    if ($method === 'GET') {
        if ($id) {
            // Fetch single report
            $stmt = pdo()->prepare("
                SELECT * FROM reports
                WHERE id = ?
                LIMIT 1
            ");
            $stmt->execute([$id]);
            $report = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$report) {
                http_response_code(404);
                echo json_encode(['error' => 'Report not found']);
                exit;
            }

            // Decode JSON blobs
            foreach (['metrics_json', 'findings_json', 'recommendations_json', 'open_questions_json'] as $field) {
                if ($report[$field]) {
                    $report[$field] = json_decode($report[$field], true);
                }
            }

            echo json_encode($report);
        } else {
            // List reports with optional filters
            $query = "SELECT id, report_type, report_name, owner, period_start, period_end, status, rag_status, summary, generated_at, next_review_date FROM reports WHERE 1";
            $params = [];

            // Filter by type
            if (isset($_GET['type'])) {
                $query .= " AND report_type = ?";
                $params[] = $_GET['type'];
            }

            // Filter by owner
            if (isset($_GET['owner'])) {
                $query .= " AND owner = ?";
                $params[] = $_GET['owner'];
            }

            // Filter by status
            if (isset($_GET['status'])) {
                $query .= " AND status = ?";
                $params[] = $_GET['status'];
            }

            // Filter by RAG
            if (isset($_GET['rag'])) {
                $query .= " AND rag_status = ?";
                $params[] = $_GET['rag'];
            }

            // Search by name
            if (isset($_GET['q'])) {
                $query .= " AND report_name LIKE ?";
                $params[] = '%' . $_GET['q'] . '%';
            }

            // Order and limit
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
            $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
            $query .= " ORDER BY generated_at DESC LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;

            $stmt = pdo()->prepare($query);
            $stmt->execute($params);
            $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode($reports);
        }
    } elseif ($method === 'POST') {
        // Create or upsert report
        $input = json_decode(file_get_contents('php://input'), true);

        // Validate required fields
        $required = ['report_type', 'report_name', 'owner', 'period_start', 'period_end'];
        foreach ($required as $field) {
            if (!isset($input[$field]) || $input[$field] === '') {
                http_response_code(400);
                echo json_encode(['error' => "Missing required field: $field"]);
                exit;
            }
        }

        // Validate enums
        if (!in_array($input['report_type'], $ALLOWED_TYPES)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid report_type']);
            exit;
        }

        if (isset($input['status']) && !in_array($input['status'], $ALLOWED_STATUS)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid status']);
            exit;
        }

        if (isset($input['rag_status']) && !in_array($input['rag_status'], $ALLOWED_RAG)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid rag_status']);
            exit;
        }

        // Insert or update (upsert via UNIQUE key)
        $stmt = pdo()->prepare("
            INSERT INTO reports (
                report_type, report_name, owner, period_start, period_end,
                status, rag_status, summary, metrics_json, findings_json,
                recommendations_json, open_questions_json, related_client_id,
                related_project_id, file_path, next_review_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                status = VALUES(status),
                rag_status = VALUES(rag_status),
                summary = VALUES(summary),
                metrics_json = VALUES(metrics_json),
                findings_json = VALUES(findings_json),
                recommendations_json = VALUES(recommendations_json),
                open_questions_json = VALUES(open_questions_json),
                related_client_id = VALUES(related_client_id),
                related_project_id = VALUES(related_project_id),
                file_path = VALUES(file_path),
                next_review_date = VALUES(next_review_date),
                updated_at = NOW()
        ");

        $stmt->execute([
            $input['report_type'],
            $input['report_name'],
            $input['owner'],
            $input['period_start'],
            $input['period_end'],
            $input['status'] ?? 'draft',
            $input['rag_status'] ?? 'green',
            $input['summary'] ?? null,
            isset($input['metrics']) ? json_encode($input['metrics']) : null,
            isset($input['findings']) ? json_encode($input['findings']) : null,
            isset($input['recommendations']) ? json_encode($input['recommendations']) : null,
            isset($input['open_questions']) ? json_encode($input['open_questions']) : null,
            $input['related_client_id'] ?? null,
            $input['related_project_id'] ?? null,
            $input['file_path'] ?? null,
            $input['next_review_date'] ?? null
        ]);

        $id = pdo()->lastInsertId();
        http_response_code(201);
        echo json_encode([
            'id' => $id,
            'message' => 'Report created/updated',
            'report_type' => $input['report_type'],
            'report_name' => $input['report_name']
        ]);
    } elseif ($method === 'PUT') {
        // Update report (partial)
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing report id']);
            exit;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        $updates = [];
        $params = [];

        // Only allow specific fields to be updated
        $updatable = ['status', 'rag_status', 'summary', 'metrics', 'findings', 'recommendations', 'open_questions', 'next_review_date'];
        foreach ($updatable as $field) {
            if (isset($input[$field])) {
                if (in_array($field, ['metrics', 'findings', 'recommendations', 'open_questions'])) {
                    $updates[] = $field . '_json = ?';
                    $params[] = json_encode($input[$field]);
                } else {
                    $updates[] = $field . ' = ?';
                    $params[] = $input[$field];
                }
            }
        }

        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            exit;
        }

        $updates[] = 'updated_at = NOW()';
        $params[] = $id;

        $query = "UPDATE reports SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = pdo()->prepare($query);
        $stmt->execute($params);

        echo json_encode(['message' => 'Report updated', 'id' => $id]);
    } elseif ($method === 'DELETE') {
        // Archive report (soft delete)
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing report id']);
            exit;
        }

        $stmt = pdo()->prepare("UPDATE reports SET status = 'archived' WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode(['message' => 'Report archived', 'id' => $id]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
