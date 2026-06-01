<?php
require_once __DIR__ . '/api/lib/session.php';
sa_start();
session_destroy();
header('Location: /login.php');
exit;
