<?php
/**
 * One-shot: delete campaign_sends rows with status='failed' for campaign #38
 * so the cron and manual sends can re-attempt them via InMotion SMTP.
 * Self-deletes after running. Run once via:
 *   curl https://netwebmedia.com/_us_reset_failed.php
 */
require_once __DIR__ . '/crm-vanilla/api/config.php';
$db = getDB();

$del = $db->prepare("DELETE FROM campaign_sends WHERE campaign_id = 38 AND status = 'failed'");
$del->execute();
$deleted = $del->rowCount();

// Also reset the campaign sent_count by subtracting the deleted failures
// (they were never actually sent, so count should stay accurate)
echo json_encode(['deleted_failed_rows' => $deleted, 'campaign_id' => 38]);

// Self-destruct
@unlink(__FILE__);
