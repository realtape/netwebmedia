<?php
/**
 * NetWeb CRM Entry Point
 * Checks for demo cookie — serves login or dashboard
 */

if (!isset($_COOKIE['crm_demo'])) {
    readfile(__DIR__ . '/login.html');
} else {
    readfile(__DIR__ . '/index.html');
}
