<?php
try {
    $db = getDB();
} catch (Exception $e) {
    jsonError('Database connection failed: ' . $e->getMessage(), 500);
}

require_once __DIR__ . '/../lib/tenancy.php';

// Ensure org_settings table exists, scoped per-organization (white-label isolation).
try {
    $db->exec('CREATE TABLE IF NOT EXISTS org_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        organization_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
        `key` VARCHAR(100) NOT NULL,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_org_key (organization_id, `key`)
    )');
    // Self-heal pre-tenant installs (was global UNIQUE(`key`)). Idempotent — ignore "already applied".
    foreach ([
        'ALTER TABLE org_settings ADD COLUMN organization_id BIGINT UNSIGNED NOT NULL DEFAULT 1',
        'ALTER TABLE org_settings ADD UNIQUE KEY uniq_org_key (organization_id, `key`)',
        'ALTER TABLE org_settings DROP INDEX `key`',
    ] as $alt) {
        try { $db->exec($alt); } catch (Throwable $e) { /* column/index already (or not yet) present */ }
    }
} catch (Exception $e) {
    jsonError('Schema init failed: ' . $e->getMessage(), 500);
}

// Settings are per-organization; master/guest (unresolved org) fall back to org 1 (NWM).
$settingsOrg = (int)(current_org_id() ?? 1);

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
function loadSettings($db, $defaults, $orgId) {
    $stmt = $db->prepare('SELECT `key`, value FROM org_settings WHERE organization_id = ?');
    $stmt->execute([$orgId]);
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
            $settings = loadSettings($db, $defaults, $settingsOrg);
            $settings['team'] = loadTeam($db);
            jsonResponse($settings);
        } catch (Exception $e) {
            jsonError('Failed to load settings: ' . $e->getMessage(), 500);
        }
        break;

    case 'POST':
        require_org_access_for_write('member');
        $data = getInput();
        if (empty($data)) {
            jsonError('No data provided');
        }

        try {
            // Niche is stored on the users table, not org_settings
            if (array_key_exists('niche', $data)) {
                $user = guard_user();
                if ($user && $user['id']) {
                    $niches_cfg = require __DIR__ . '/../config/niches.php';
                    $newNiche = ($data['niche'] === '' || $data['niche'] === null) ? null : $data['niche'];
                    if ($newNiche !== null && !isset($niches_cfg[$newNiche])) {
                        jsonError('Unknown niche: ' . $newNiche, 400);
                    }
                    try {
                        $db->prepare('UPDATE users SET niche = ? WHERE id = ?')
                           ->execute([$newNiche, (int)$user['id']]);
                    } catch (Throwable $ne) {
                        // Column may not exist yet if schema_addniche migration hasn't run.
                        // Silently skip — don't break the entire settings save.
                        error_log('[settings] niche save failed (migration pending?): ' . $ne->getMessage());
                    }
                }
                unset($data['niche']);
            }

            $stmt = $db->prepare(
                'INSERT INTO org_settings (organization_id, `key`, value)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = CURRENT_TIMESTAMP'
            );

            foreach ($allowed_keys as $key) {
                if (array_key_exists($key, $data)) {
                    $stmt->execute([$settingsOrg, $key, (string)$data[$key]]);
                }
            }

            // Return the updated full settings + team
            $settings = loadSettings($db, $defaults, $settingsOrg);
            $settings['team'] = loadTeam($db);
            jsonResponse($settings);
        } catch (Exception $e) {
            jsonError('Failed to save settings: ' . $e->getMessage(), 500);
        }
        break;

    default:
        jsonError('Method not allowed', 405);
}
