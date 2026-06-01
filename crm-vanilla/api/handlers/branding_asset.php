<?php
/**
 * NetWebMedia OS — Branding asset upload + serve  (Phase 2)
 *
 *   POST /crm/api/?r=branding_asset   (multipart: file, kind)   admin-only
 *   GET  /crm/api/?r=branding_asset&org=<slug>&kind=logo_dark   serve (long-cache)
 *
 * Uploads are validated, SVGs are sanitized (script/handler stripped), stored
 * SHA-named under crm-vanilla/storage/branding/<org>/ (web-blocked), and served
 * back through this proxy. A logo upload also updates organizations.branding_logo_url.
 */

require_once __DIR__ . '/../lib/tenancy.php';

$db = getDB();
$KINDS = ['logo_dark', 'logo_light', 'favicon', 'email_header'];
$MIME  = ['image/svg+xml' => 'svg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/jpeg' => 'jpg'];
$STORE = realpath(__DIR__ . '/../..') . '/storage/branding';

// ---------------------------------------------------------------- GET serve --
if ($method === 'GET') {
    $slug = preg_replace('/[^a-z0-9\-]/', '', strtolower((string)($_GET['org'] ?? '')));
    $kind = (string)($_GET['kind'] ?? 'logo_dark');
    if ($slug === '' || !in_array($kind, $KINDS, true)) { http_response_code(404); exit; }
    $stmt = $db->prepare('SELECT o.id, a.filename, a.mime FROM organizations o
                          JOIN tenant_branding_assets a ON a.organization_id = o.id AND a.kind = ?
                          WHERE o.slug = ? LIMIT 1');
    $stmt->execute([$kind, $slug]);
    $row = $stmt->fetch();
    if (!$row) { http_response_code(404); exit; }
    $path = $STORE . '/' . (int)$row['id'] . '/' . basename($row['filename']);
    if (!is_file($path)) { http_response_code(404); exit; }
    header('Content-Type: ' . $row['mime']);
    header('Cache-Control: public, max-age=31536000, immutable');
    readfile($path);
    exit;
}

// ----------------------------------------------------------------- POST up ---
if ($method !== 'POST') jsonError('Use GET or POST', 405);
$u = guard_user();
if (!$u || empty($u['id'])) jsonError('Authentication required', 401);
$orgId = current_org_id();
if ($orgId === null) jsonError('No organization resolved', 400);
require_org_access_for_write('admin');

$kind = (string)($_POST['kind'] ?? '');
if (!in_array($kind, $KINDS, true)) jsonError('Invalid kind', 422);
if (empty($_FILES['file']) || ($_FILES['file']['error'] ?? 1) !== UPLOAD_ERR_OK) jsonError('No file uploaded', 422);
if ($_FILES['file']['size'] > 524288) jsonError('File too large (max 512KB)', 422);

$tmp  = $_FILES['file']['tmp_name'];
$mime = function_exists('mime_content_type') ? mime_content_type($tmp) : ($_FILES['file']['type'] ?? '');
if (!isset($MIME[$mime])) jsonError('Unsupported type (svg/png/webp/jpg only)', 422);
$ext  = $MIME[$mime];
$data = file_get_contents($tmp);

// Sanitize SVG — strip <script>, <foreignObject>, on* handlers, javascript: URIs.
if ($mime === 'image/svg+xml') {
    $data = os_sanitize_svg($data);
    if ($data === null) jsonError('SVG could not be safely sanitized', 422);
}

$sha = hash('sha256', $data);
$dir = $STORE . '/' . (int)$orgId;
if (!is_dir($dir) && !@mkdir($dir, 0775, true) && !is_dir($dir)) jsonError('Storage unavailable', 500);
$filename = $sha . '.' . $ext;
if (file_put_contents($dir . '/' . $filename, $data) === false) jsonError('Write failed', 500);

$db->prepare(
    'INSERT INTO tenant_branding_assets (organization_id, kind, filename, mime, byte_size, sha256)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE filename=VALUES(filename), mime=VALUES(mime), byte_size=VALUES(byte_size), sha256=VALUES(sha256)'
)->execute([$orgId, $kind, $filename, $mime, strlen($data), $sha]);

// Resolve the org slug to build the public proxy URL.
$slug = (string)$db->query('SELECT slug FROM organizations WHERE id = ' . (int)$orgId)->fetchColumn();
$url  = '/crm/api/?r=branding_asset&org=' . urlencode($slug) . '&kind=' . urlencode($kind) . '&v=' . substr($sha, 0, 8);

if ($kind === 'logo_dark' || $kind === 'logo_light') {
    $db->prepare('UPDATE organizations SET branding_logo_url = ? WHERE id = ?')->execute([$url, $orgId]);
}
try {
    $db->prepare('INSERT INTO os_audit_log (organization_id, user_id, action, target, ip)
                  VALUES (?, ?, "branding.upload", ?, ?)')
       ->execute([$orgId, (int)$u['id'], $kind, $_SERVER['REMOTE_ADDR'] ?? null]);
} catch (Throwable $e) {}

jsonResponse(['ok' => true, 'asset' => ['kind' => $kind, 'url' => $url, 'sha256' => $sha, 'mime' => $mime]]);

/** Minimal SVG sanitizer: drop script/foreignObject, on* attrs, javascript: hrefs. */
function os_sanitize_svg(string $svg): ?string {
    if (stripos($svg, '<svg') === false) return null;
    $prev = libxml_use_internal_errors(true);
    $doc = new DOMDocument();
    if (!$doc->loadXML($svg, LIBXML_NONET | LIBXML_NOENT)) { libxml_use_internal_errors($prev); return null; }
    $xp = new DOMXPath($doc);
    foreach (['//*[local-name()="script"]', '//*[local-name()="foreignObject"]'] as $q) {
        foreach (iterator_to_array($xp->query($q)) as $n) $n->parentNode->removeChild($n);
    }
    foreach (iterator_to_array($xp->query('//*')) as $el) {
        if (!$el->attributes) continue;
        foreach (iterator_to_array($el->attributes) as $attr) {
            $name = strtolower($attr->name);
            $val  = strtolower(trim($attr->value));
            if (strpos($name, 'on') === 0) { $el->removeAttribute($attr->name); continue; }
            if (($name === 'href' || $name === 'xlink:href' || $name === 'src')
                && strpos($val, 'javascript:') === 0) { $el->removeAttribute($attr->name); }
        }
    }
    $out = $doc->saveXML();
    libxml_use_internal_errors($prev);
    return $out ?: null;
}
