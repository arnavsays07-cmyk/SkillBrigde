<?php
// =====================================================================
// config/database.php - Centralized PDO Connection & Security Helpers
// =====================================================================

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'skillbridge_db');
define('DB_CHARSET', 'utf8mb4');

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
} catch (PDOException $e) {
    error_log("Database Connection Error: " . $e->getMessage());
    die("A database connection error occurred. Please verify your MySQL settings in config/database.php.");
}

// Secure Session Initialization
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.cookie_samesite', 'Lax');
    session_start();
}

// Generate 256-bit CSRF token if not present
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Resolve base path relative to project root
function app_url(string $path = ''): string {
    $scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));
    // Strip known subdirectories to normalize to project root
    $root = preg_replace('#/(auth|api|student)$#', '', rtrim($scriptDir, '/'));
    $root = rtrim($root, '/');
    return $root . '/' . ltrim($path, '/');
}

// HTML Output Escaping Helper
function e(?string $value): string {
    return htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8');
}

// Web Route Guard (Redirects unauthenticated users to login)
function require_login(): void {
    if (!isset($_SESSION['user_id'])) {
        header('Location: ' . app_url('auth/login.php'));
        exit;
    }
}

// API Route Guard (Returns JSON 401 response for Fetch API calls)
function require_api_login(): void {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            'status'  => 'error',
            'message' => 'Unauthorized. Please log in.'
        ]);
        exit;
    }
}

// CSRF Verification Helper
function verify_csrf(bool $jsonResponse = false): void {
    $token = $_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (empty($token) || !hash_equals($_SESSION['csrf_token'] ?? '', $token)) {
        http_response_code(403);
        if ($jsonResponse) {
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode([
                'status'  => 'error',
                'message' => 'Invalid or expired CSRF token.'
            ]);
        } else {
            die("Invalid or expired CSRF token. Please refresh the page and try again.");
        }
        exit;
    }
}
