<?php
try {
    $db = getDB();
} catch (Exception $e) {
    jsonError('Database connection failed: ' . $e->getMessage(), 500);
}

// Ensure org_settings table exists
try {
    $db->exec('CREATE TABLE IF NOT EXISTS org_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        `key` VARCHAR(100) NOT NULL UNIQUE,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )');
} catch (Exception $e) {
    jsonError('Schema init failed: ' . $e->getMessage(), 500);
}

// Default values returned when a key is not yet stored
$defaults = [
    'company_name'        => 'NetWebMedia',
    'company_email'       => 'hello@netwebmedia.com',
    'company_phone'       => '',
    'company_website'     => 'https://netwebmedia.com',
    'timezone'            => 'America/Santiago',
    'language'            => 'en',
    'email_notifications' => '1',
    'marketing_emails'    => '1',
];

// Keys that are writable via POST
$allowed_keys = array_keys($defaults);

/**
 * Load all org settings from DB and merge with defaults.
 * Returns a flat associative array.
 */
function loadSettings($db, $defaults) {
    $stmt = $db->query('SELECT `key`, value FROM org_settings');
    $rows = $stmt->fetchAll();
    $stored = [];
    foreach ($rows as $row) {
        $stored[$row['key']] = $row['value'];
    }
    return array_merge($defaults, $stored);
}

/**
 * Load team members from users table.
 * Returns an array of user records.
 */
function loadTeam($db) {
    try {
        $stmt = $db->query('SELECT id, name, email, role, status FROM users ORDER BY id ASC');
        return $stmt->fetchAll();
    } catch (Exception $e) {
        // users table may not exist in all environments
        return [];
    }
}

switch ($method) {

    case 'GET':
        // Sub-route: /api/?r=settings&sub=team — team list only
        if ($sub === 'team') {
            try {
                jsonResponse(loadTeam($db));
            } catch (Exception $e) {
                jsonError('Failed to load team: ' . $e->getMessage(), 500);
            }
        }

        // Default GET: full settings + team
        try {
            $settings = loadSettings($db, $defaults);
            $settings['team'] = loadTeam($db);
            jsonResponse($settings);
        } catch (Exception $e) {
            jsonError('Failed to load settings: ' . $e->getMessage(), 500);
        }
        break;

    case 'POST':
        $data = getInput();
        if (empty($data)) {
            jsonError('No data provided');
        }

        try {
            $stmt = $db->prepare(
                'INSERT INTO org_settings (`key`, value)
                 VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = CURRENT_TIMESTAMP'
            );

            foreach ($allowed_keys as $key) {
                if (array_key_exists($key, $data)) {
                    $stmt->execute([$key, (string)$data[$key]]);
                }
            }

            // Return the updated full settings + team
            $settings = loadSettings($db, $defaults);
            $settings['team'] = loadTeam($db);
            jsonResponse($settings);
        } catch (Exception $e) {
            jsonError('Failed to save settings: ' . $e->getMessage(), 500);
        }
        break;

    default:
        jsonError('Method not allowed', 405);
}
