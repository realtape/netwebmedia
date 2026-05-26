<?php
require_once __DIR__ . '/api/lib/session.php';
sa_start();
if (sa_user()) {
    header('Location: /dashboard.php');
} else {
    header('Location: /login.php');
}
exit;
