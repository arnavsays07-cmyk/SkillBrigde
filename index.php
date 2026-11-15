<?php
// =====================================================================
// index.php - Application Entry Router
// =====================================================================
require_once __DIR__ . '/config/database.php';

if (isset($_SESSION['user_id'])) {
    header('Location: ' . app_url('dashboard.php'));
} else {
    header('Location: ' . app_url('auth/login.php'));
}
exit;
