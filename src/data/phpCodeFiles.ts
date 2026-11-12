export interface PhpFileRecord {
  filename: string;
  path: string;
  category: 'database' | 'config' | 'api' | 'auth' | 'student' | 'frontend';
  description: string;
  code: string;
}

export const PHP_PROJECT_FILES: PhpFileRecord[] = [
  {
    filename: 'database.sql',
    path: 'database.sql',
    category: 'database',
    description: 'Complete MySQL schema with InnoDB engine, foreign keys, CHECK constraints, and optimized indexes.',
    code: `-- =====================================================================
-- SkillBridge Database Architecture (MySQL 8.0+ / MariaDB 10.5+)
-- Features: ACID compliance, Foreign Keys with Cascade, CHECK constraints
-- =====================================================================

CREATE DATABASE IF NOT EXISTS \`skillbridge_db\` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE \`skillbridge_db\`;

-- 1. USERS & PROFILES TABLE
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(100) NOT NULL,
  \`email\` VARCHAR(150) NOT NULL UNIQUE,
  \`enrollment_no\` VARCHAR(50) NOT NULL UNIQUE,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`department\` VARCHAR(100) NOT NULL,
  \`semester\` TINYINT NOT NULL,
  \`role\` ENUM('student', 'admin') DEFAULT 'student',
  \`credit_balance\` INT NOT NULL DEFAULT 20,
  \`average_rating\` DECIMAL(3,2) DEFAULT 5.00,
  \`total_reviews\` INT DEFAULT 0,
  \`bio\` TEXT NULL,
  \`availability\` VARCHAR(255) DEFAULT 'Weekday Evenings & Weekends',
  \`status\` ENUM('active', 'suspended') DEFAULT 'active',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`chk_credit_positive\` CHECK (\`credit_balance\` >= 0),
  CONSTRAINT \`chk_semester_valid\` CHECK (\`semester\` BETWEEN 1 AND 12)
) ENGINE=InnoDB;

-- 2. MASTER SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS \`skills\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`subject_name\` VARCHAR(150) NOT NULL UNIQUE,
  \`department\` VARCHAR(100) NOT NULL,
  \`code\` VARCHAR(20) NOT NULL,
  INDEX \`idx_dept\` (\`department\`)
) ENGINE=InnoDB;

-- 3. USER SKILLS JUNCTION
CREATE TABLE IF NOT EXISTS \`user_skills\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` INT NOT NULL,
  \`skill_id\` INT NOT NULL,
  \`skill_type\` ENUM('teach', 'learn') NOT NULL,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`skill_id\`) REFERENCES \`skills\`(\`id\`) ON DELETE CASCADE,
  UNIQUE KEY \`unique_user_skill_type\` (\`user_id\`, \`skill_id\`, \`skill_type\`)
) ENGINE=InnoDB;

-- 4. STUDY SESSIONS TABLE
CREATE TABLE IF NOT EXISTS \`sessions\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`learner_id\` INT NOT NULL,
  \`tutor_id\` INT NOT NULL,
  \`subject_id\` INT NOT NULL,
  \`topic\` VARCHAR(255) NOT NULL,
  \`session_date\` DATETIME NOT NULL,
  \`duration_minutes\` INT DEFAULT 60,
  \`mode\` ENUM('Online (Meet)', 'Campus Library', 'Lab Room', 'Study Commons') DEFAULT 'Online (Meet)',
  \`meeting_details\` VARCHAR(255) NOT NULL,
  \`status\` ENUM('pending', 'accepted', 'declined', 'completed', 'cancelled') DEFAULT 'pending',
  \`credit_cost\` INT NOT NULL DEFAULT 10,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`learner_id\`) REFERENCES \`users\`(\`id\`),
  FOREIGN KEY (\`tutor_id\`) REFERENCES \`users\`(\`id\`),
  FOREIGN KEY (\`subject_id\`) REFERENCES \`skills\`(\`id\`),
  INDEX \`idx_learner_status\` (\`learner_id\`, \`status\`),
  INDEX \`idx_tutor_status\` (\`tutor_id\`, \`status\`),
  CONSTRAINT \`chk_different_peers\` CHECK (\`learner_id\` <> \`tutor_id\`)
) ENGINE=InnoDB;

-- 5. DOUBLE-ENTRY AUDIT LEDGER
CREATE TABLE IF NOT EXISTS \`credit_ledger\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` INT NOT NULL,
  \`session_id\` INT NULL,
  \`transaction_type\` ENUM('earned', 'spent', 'bonus', 'refund') NOT NULL,
  \`amount\` INT NOT NULL,
  \`balance_after\` INT NOT NULL,
  \`description\` VARCHAR(255) NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`session_id\`) REFERENCES \`sessions\`(\`id\`) ON DELETE SET NULL,
  INDEX \`idx_ledger_user\` (\`user_id\`, \`created_at\`)
) ENGINE=InnoDB;

-- =====================================================================
-- SEED DATA: SUBJECTS
-- =====================================================================
INSERT INTO \`skills\` (\`subject_name\`, \`department\`, \`code\`) VALUES
('Data Structures & Algorithms', 'Computer Science', 'CS-201'),
('Database Management Systems (SQL)', 'Computer Science', 'CS-302'),
('Web Technologies (PHP & Full Stack)', 'Computer Science', 'CS-405'),
('Machine Learning & Python', 'Data Science', 'DS-301'),
('Probability & Applied Statistics', 'Data Science', 'DS-202'),
('Thermodynamics & Heat Transfer', 'Mechanical Engineering', 'ME-201'),
('Digital Signal Processing', 'Electrical Engineering', 'EE-310'),
('Linear Algebra & Discrete Math', 'Mathematics', 'MA-101')
ON DUPLICATE KEY UPDATE \`subject_name\` = VALUES(\`subject_name\`);
`
  },
  {
    filename: 'db.php',
    path: 'config/db.php',
    category: 'config',
    description: 'Centralized PDO database connection, strict session settings, and CSRF authentication guards.',
    code: `<?php
// =====================================================================
// config/db.php - Centralized PDO Database Connection & Security Guards
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
    die("A database connection error occurred. Please verify your configuration.");
}

// Secure Session Initialization
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.cookie_samesite', 'Lax');
    session_start();
}

// Generate CSRF token if not present
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Web Route Guard (Redirects to login page)
function require_login() {
    if (!isset($_SESSION['user_id'])) {
        header('Location: /skillbridge/auth/login.php');
        exit;
    }
}

// API Route Guard (Returns JSON 401 response for Fetch API calls)
function require_api_login() {
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

// CSRF verification helper for POST requests
function verify_csrf() {
    $token = $_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (empty($token) || !hash_equals($_SESSION['csrf_token'] ?? '', $token)) {
        http_response_code(403);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            'status'  => 'error',
            'message' => 'Invalid or expired CSRF token.'
        ]);
        exit;
    }
}
`
  },
  {
    filename: 'search_peers.php',
    path: 'api/search_peers.php',
    category: 'api',
    description: 'RESTful JSON endpoint for peer discovery using GROUP_CONCAT, indexed filters, and pagination.',
    code: `<?php
// =====================================================================
// api/search_peers.php - Asynchronous JSON API for Live Peer Search
// Invoked dynamically via JavaScript fetch() with debounce
// =====================================================================
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/../config/db.php';

// Ensure 401 JSON response if unauthenticated
require_api_login();

$current_user_id = (int)$_SESSION['user_id'];
$subject_filter  = isset($_GET['subject']) ? trim($_GET['subject']) : '';
$dept_filter     = isset($_GET['department']) ? trim($_GET['department']) : '';

try {
    $sql = "
        SELECT 
            u.id, 
            u.name, 
            u.department, 
            u.semester, 
            u.average_rating, 
            u.total_reviews, 
            u.availability,
            u.bio,
            GROUP_CONCAT(DISTINCT s.subject_name ORDER BY s.subject_name ASC SEPARATOR ', ') AS teachable_subjects
        FROM users u
        INNER JOIN user_skills us ON u.id = us.user_id AND us.skill_type = 'teach'
        INNER JOIN skills s ON us.skill_id = s.id
        WHERE u.id != :curr_uid AND u.status = 'active'
    ";

    $params = [':curr_uid' => $current_user_id];

    if ($subject_filter !== '') {
        $sql .= " AND (s.subject_name LIKE :subject OR u.name LIKE :subject)";
        $params[':subject'] = '%' . $subject_filter . '%';
    }

    if ($dept_filter !== '' && $dept_filter !== 'All') {
        $sql .= " AND u.department = :dept";
        $params[':dept'] = $dept_filter;
    }

    // Fully compatible GROUP BY clause
    $sql .= " 
        GROUP BY 
            u.id, 
            u.name, 
            u.department, 
            u.semester, 
            u.average_rating, 
            u.total_reviews, 
            u.availability,
            u.bio
        ORDER BY u.average_rating DESC, u.total_reviews DESC
        LIMIT 50
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $results = $stmt->fetchAll();

    echo json_encode([
        'status' => 'success',
        'count'  => count($results),
        'data'   => $results
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Unable to search peers at this time: ' . $e->getMessage()
    ]);
}
`
  },
  {
    filename: 'sessions.php',
    path: 'student/sessions.php',
    category: 'student',
    description: 'Session completion with ACID transaction, deterministic row-locking to prevent deadlocks, and double-entry ledger.',
    code: `<?php
// =====================================================================
// student/sessions.php - Session Completion & Double-Entry Ledger
// =====================================================================
require_once __DIR__ . '/../config/db.php';
require_login();

$error = null;
$success = null;
$current_user_id = (int)$_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'complete') {
    // 1. Validate CSRF Token
    verify_csrf();

    $session_id = filter_input(INPUT_POST, 'session_id', FILTER_VALIDATE_INT);
    if (!$session_id) {
        die("Invalid session identifier.");
    }

    try {
        // Begin ACID Transaction
        $pdo->beginTransaction();

        // 2. Lock session row for update to prevent concurrent double-spend
        $check_stmt = $pdo->prepare("
            SELECT * FROM sessions 
            WHERE id = :sid AND (tutor_id = :uid OR learner_id = :uid) AND status = 'accepted'
            FOR UPDATE
        ");
        $check_stmt->execute([':sid' => $session_id, ':uid' => $current_user_id]);
        $session = $check_stmt->fetch();

        if (!$session) {
            throw new Exception("Session not found, unauthorized, or not in accepted state.");
        }

        $cost = (int)$session['credit_cost'];
        $learner_id = (int)$session['learner_id'];
        $tutor_id = (int)$session['tutor_id'];

        // 3. Lock user records in deterministic ID order to prevent MySQL deadlocks
        $first_id = min($learner_id, $tutor_id);
        $second_id = max($learner_id, $tutor_id);

        $lock_users = $pdo->prepare("
            SELECT id, credit_balance FROM users 
            WHERE id IN (:id1, :id2) 
            ORDER BY id ASC 
            FOR UPDATE
        ");
        $lock_users->execute([':id1' => $first_id, ':id2' => $second_id]);
        $balances = $lock_users->fetchAll(PDO::FETCH_KEY_PAIR);

        // 4. Validate learner credit sufficiency
        if (!isset($balances[$learner_id]) || $balances[$learner_id] < $cost) {
            throw new Exception("Learner has insufficient credits to complete this session.");
        }

        // 5. Update session status
        $pdo->prepare("UPDATE sessions SET status = 'completed' WHERE id = :sid")
            ->execute([':sid' => $session_id]);

        // 6. Deduct from learner & award tutor
        $pdo->prepare("UPDATE users SET credit_balance = credit_balance - :cost WHERE id = :lid")
            ->execute([':cost' => $cost, ':lid' => $learner_id]);

        $pdo->prepare("UPDATE users SET credit_balance = credit_balance + :cost WHERE id = :tid")
            ->execute([':cost' => $cost, ':tid' => $tutor_id]);

        // Calculate final balances for ledger audit
        $learner_new_balance = $balances[$learner_id] - $cost;
        $tutor_new_balance = $balances[$tutor_id] + $cost;

        // 7. Write double-entry ledger records
        $ledger_stmt = $pdo->prepare("
            INSERT INTO credit_ledger (user_id, session_id, transaction_type, amount, balance_after, description) 
            VALUES (:uid, :sid, :ttype, :amt, :bal, :descr)
        ");

        // Learner (spent)
        $ledger_stmt->execute([
            ':uid'   => $learner_id,
            ':sid'   => $session_id,
            ':ttype' => 'spent',
            ':amt'   => $cost,
            ':bal'   => $learner_new_balance,
            ':descr' => "Attended peer study session #{$session_id}"
        ]);

        // Tutor (earned)
        $ledger_stmt->execute([
            ':uid'   => $tutor_id,
            ':sid'   => $session_id,
            ':ttype' => 'earned',
            ':amt'   => $cost,
            ':bal'   => $tutor_new_balance,
            ':descr' => "Conducted peer study session #{$session_id}"
        ]);

        // Commit transaction atomically
        $pdo->commit();

        if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] === 'XMLHttpRequest') {
            header('Content-Type: application/json');
            echo json_encode(['status' => 'success', 'message' => 'Session completed and credits transferred!']);
            exit;
        }

        header("Location: /skillbridge/student/sessions.php?success=completed");
        exit;

    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        $error = $e->getMessage();
    }
}
`
  },
  {
    filename: 'book_session.php',
    path: 'book_session.php',
    category: 'student',
    description: 'Handles new session bookings with prerequisite balance check and CSRF defense.',
    code: `<?php
// =====================================================================
// book_session.php - Book a Peer Tutoring Study Session
// =====================================================================
require_once __DIR__ . '/config/db.php';
require_login();

$current_user_id = (int)$_SESSION['user_id'];
$response = ['status' => 'error', 'message' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();

    $tutor_id = filter_input(INPUT_POST, 'tutor_id', FILTER_VALIDATE_INT);
    $subject_id = filter_input(INPUT_POST, 'subject_id', FILTER_VALIDATE_INT);
    $topic = trim($_POST['topic'] ?? '');
    $session_date = trim($_POST['session_date'] ?? '');
    $mode = $_POST['mode'] ?? 'Online (Meet)';
    $meeting_details = trim($_POST['meeting_details'] ?? '');
    $credit_cost = 10;

    if (!$tutor_id || !$subject_id || empty($topic) || empty($session_date)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'All booking fields are required.']);
        exit;
    }

    if ($tutor_id === $current_user_id) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'You cannot book a study session with yourself.']);
        exit;
    }

    // Check learner has sufficient credits to request
    $stmt = $pdo->prepare("SELECT credit_balance FROM users WHERE id = :uid");
    $stmt->execute([':uid' => $current_user_id]);
    $user = $stmt->fetch();

    if (!$user || $user['credit_balance'] < $credit_cost) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => "Insufficient credit balance. You need at least {$credit_cost} credits to book."]);
        exit;
    }

    try {
        $insert = $pdo->prepare("
            INSERT INTO sessions (learner_id, tutor_id, subject_id, topic, session_date, duration_minutes, mode, meeting_details, status, credit_cost)
            VALUES (:lid, :tid, :sid, :topic, :sdate, 60, :mode, :details, 'pending', :cost)
        ");
        $insert->execute([
            ':lid'     => $current_user_id,
            ':tid'     => $tutor_id,
            ':sid'     => $subject_id,
            ':topic'   => $topic,
            ':sdate'   => $session_date,
            ':mode'    => $mode,
            ':details' => $meeting_details ?: 'To be coordinated on campus chat',
            ':cost'    => $credit_cost
        ]);

        echo json_encode([
            'status'     => 'success',
            'session_id' => $pdo->lastInsertId(),
            'message'    => 'Study session request submitted successfully! Awaiting peer acceptance.'
        ]);
        exit;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        exit;
    }
}
`
  },
  {
    filename: 'login.php',
    path: 'auth/login.php',
    category: 'auth',
    description: 'Secure student login with password_verify, CSRF token validation, and session fixation prevention.',
    code: `<?php
// =====================================================================
// auth/login.php - Student Authentication Handler
// =====================================================================
require_once __DIR__ . '/../config/db.php';

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();

    $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
    $password = $_POST['password'] ?? '';

    if (!$email || empty($password)) {
        $error = "Please enter a valid email and password.";
    } else {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            if ($user['status'] === 'suspended') {
                $error = "This account is suspended. Contact campus admin.";
            } else {
                // Prevent Session Fixation attack
                session_regenerate_id(true);

                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user_name'] = $user['name'];
                $_SESSION['user_email'] = $user['email'];
                $_SESSION['role'] = $user['role'];

                header('Location: /skillbridge/dashboard.php');
                exit;
            }
        } else {
            $error = "Invalid credentials. Please verify your email and password.";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>SkillBridge - Student Login</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4">
    <div class="bg-slate-800 p-8 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl">
        <h2 class="text-2xl font-bold text-white mb-2">Campus Login</h2>
        <p class="text-slate-400 text-sm mb-6">Access your peer tutoring credits and schedule.</p>

        <?php if ($error): ?>
            <div class="bg-red-900/50 border border-red-700 text-red-200 text-sm p-3 rounded-lg mb-4">
                <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <form method="POST" action="login.php" class="space-y-4">
            <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($_SESSION['csrf_token']) ?>">
            
            <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Campus Email</label>
                <input type="email" name="email" required class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white">
            </div>

            <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <input type="password" name="password" required class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white">
            </div>

            <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition">
                Sign In
            </button>
        </form>
    </div>
</body>
</html>
`
  },
  {
    filename: 'register.php',
    path: 'auth/register.php',
    category: 'auth',
    description: 'New student registration with 20 starting credits and double-entry bonus ledger record.',
    code: `<?php
// =====================================================================
// auth/register.php - Peer Registration & 20 Credit Welcome Grant
// =====================================================================
require_once __DIR__ . '/../config/db.php';

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();

    $name = trim($_POST['name'] ?? '');
    $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
    $enrollment_no = trim($_POST['enrollment_no'] ?? '');
    $department = trim($_POST['department'] ?? '');
    $semester = (int)($_POST['semester'] ?? 1);
    $password = $_POST['password'] ?? '';

    if (empty($name) || !$email || empty($enrollment_no) || strlen($password) < 6) {
        $error = "Please fill in all fields with a password of at least 6 characters.";
    } else {
        try {
            $pdo->beginTransaction();

            // Hash password with bcrypt
            $password_hash = password_hash($password, PASSWORD_DEFAULT);

            $stmt = $pdo->prepare("
                INSERT INTO users (name, email, enrollment_no, password_hash, department, semester, credit_balance)
                VALUES (:name, :email, :eno, :phash, :dept, :sem, 20)
            ");
            $stmt->execute([
                ':name'  => $name,
                ':email' => $email,
                ':eno'   => $enrollment_no,
                ':phash' => $password_hash,
                ':dept'  => $department,
                ':sem'   => $semester,
            ]);

            $new_user_id = (int)$pdo->lastInsertId();

            // Record starting 20 credits in ledger
            $ledger_stmt = $pdo->prepare("
                INSERT INTO credit_ledger (user_id, session_id, transaction_type, amount, balance_after, description)
                VALUES (:uid, NULL, 'bonus', 20, 20, 'Welcome enrollment credit allocation')
            ");
            $ledger_stmt->execute([':uid' => $new_user_id]);

            $pdo->commit();

            // Automatically sign in
            $_SESSION['user_id'] = $new_user_id;
            $_SESSION['user_name'] = $name;
            $_SESSION['user_email'] = $email;

            header('Location: /skillbridge/dashboard.php');
            exit;
        } catch (PDOException $e) {
            $pdo->rollBack();
            $error = "Registration failed: " . ($e->getCode() == 23000 ? "Email or enrollment number already exists." : $e->getMessage());
        }
    }
}
`
  },
  {
    filename: 'dashboard.php',
    path: 'dashboard.php',
    category: 'frontend',
    description: 'Server-rendered student dashboard embedding the dynamic Fetch API search bar and ledger.',
    code: `<?php
// =====================================================================
// dashboard.php - Student Dashboard with Live Fetch API Peer Search
// =====================================================================
require_once __DIR__ . '/config/db.php';
require_login();

$user_id = (int)$_SESSION['user_id'];

// Fetch current user details
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = :uid");
$stmt->execute([':uid' => $user_id]);
$currentUser = $stmt->fetch();

// Fetch distinct departments for filter dropdown
$dept_stmt = $pdo->query("SELECT DISTINCT department FROM users ORDER BY department ASC");
$departments = $dept_stmt->fetchAll(PDO::FETCH_COLUMN);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SkillBridge Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
    <nav class="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">SB</div>
            <div>
                <h1 class="text-lg font-bold text-white leading-none">SkillBridge</h1>
                <span class="text-xs text-slate-400">Campus Peer Tutoring & Credit Exchange</span>
            </div>
        </div>
        <div class="flex items-center gap-4">
            <div class="bg-indigo-950/60 border border-indigo-700/50 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <span class="text-xs text-indigo-300 font-medium">Credits:</span>
                <span id="nav-credit-balance" class="text-sm font-bold text-amber-400"><?= (int)$currentUser['credit_balance'] ?> pts</span>
            </div>
            <span class="text-sm text-slate-300"><?= htmlspecialchars($currentUser['name']) ?> (<?= htmlspecialchars($currentUser['department']) ?>)</span>
            <a href="/skillbridge/auth/logout.php" class="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-300">Sign Out</a>
        </div>
    </nav>

    <main class="max-w-7xl mx-auto px-6 py-8">
        <!-- Live Dynamic Peer Search Section (Fetch API) -->
        <section class="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 class="text-xl font-bold text-white">Find a Peer Tutor</h2>
                    <p class="text-sm text-slate-400">Search subjects, algorithms, math topics, or engineering peers in real-time.</p>
                </div>
                <div class="flex items-center gap-2">
                    <span id="search-status" class="text-xs text-slate-500 hidden items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span> Searching peers...
                    </span>
                </div>
            </div>

            <!-- Search Inputs -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                <div class="md:col-span-2">
                    <input 
                        type="text" 
                        id="peer-search-input" 
                        placeholder="Search by topic (e.g. Data Structures, SQL, Machine Learning)..." 
                        class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                </div>
                <div>
                    <select id="peer-dept-filter" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500">
                        <option value="">All Departments</option>
                        <?php foreach ($departments as $dept): ?>
                            <option value="<?= htmlspecialchars($dept) ?>"><?= htmlspecialchars($dept) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>

            <!-- Dynamic Search Results Container -->
            <div id="peers-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <!-- Injected dynamically via fetch() API -->
            </div>
        </section>
    </main>

    <!-- Vanilla Fetch API Script -->
    <script src="js/search_peers.js"></script>
</body>
</html>
`
  },
  {
    filename: 'search_peers.js',
    path: 'frontend/js/search_peers.js',
    category: 'frontend',
    description: 'Clean JavaScript fetch API implementation with 300ms debouncing, AbortController, and dynamic DOM rendering.',
    code: `/**
 * frontend/js/search_peers.js
 * Asynchronous dynamic search engine using modern Fetch API and Debouncing
 */

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('peer-search-input');
    const deptFilter  = document.getElementById('peer-dept-filter');
    const statusLabel = document.getElementById('search-status');
    const peersGrid   = document.getElementById('peers-grid');

    let debounceTimer = null;
    let abortController = null;

    /**
     * Executes the Fetch request to api/search_peers.php
     */
    async function fetchPeers() {
        const query = searchInput.value.trim();
        const department = deptFilter.value;

        // Abort previous in-flight request if user is still typing
        if (abortController) {
            abortController.abort();
        }
        abortController = new AbortController();

        // Show loading indicator
        if (statusLabel) statusLabel.classList.remove('hidden');

        try {
            const params = new URLSearchParams({
                subject: query,
                department: department
            });

            const response = await fetch(\`/skillbridge/api/search_peers.php?\${params.toString()}\`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                signal: abortController.signal
            });

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/skillbridge/auth/login.php';
                    return;
                }
                throw new Error(\`Server returned status \${response.status}\`);
            }

            const json = await response.json();
            renderPeers(json.data || []);

        } catch (error) {
            if (error.name === 'AbortError') return; // Expected when debounced
            console.error('Fetch error:', error);
            peersGrid.innerHTML = \`
                <div class="col-span-full p-6 text-center text-red-400 bg-red-950/30 rounded-xl border border-red-800">
                    Failed to load peers. Please check your network connection.
                </div>
            \`;
        } finally {
            if (statusLabel) statusLabel.classList.add('hidden');
        }
    }

    /**
     * Renders peer cards into the DOM
     */
    function renderPeers(peers) {
        if (!peersGrid) return;

        if (peers.length === 0) {
            peersGrid.innerHTML = \`
                <div class="col-span-full py-12 text-center text-slate-500">
                    <p class="text-base font-medium">No matching peer tutors found</p>
                    <p class="text-xs">Try broadening your search term or selecting "All Departments"</p>
                </div>
            \`;
            return;
        }

        peersGrid.innerHTML = peers.map(peer => {
            const subjects = (peer.teachable_subjects || '')
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);

            const badges = subjects.map(s => 
                \`<span class="inline-block px-2.5 py-1 text-xs rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-medium">\${escapeHtml(s)}</span>\`
            ).join('');

            return \`
                <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition flex flex-col justify-between">
                    <div>
                        <div class="flex items-start justify-between mb-3">
                            <div>
                                <h3 class="font-bold text-white text-base">\${escapeHtml(peer.name)}</h3>
                                <p class="text-xs text-slate-400">\${escapeHtml(peer.department)} • Sem \${peer.semester}</p>
                            </div>
                            <div class="flex items-center gap-1 bg-amber-950/50 text-amber-300 border border-amber-800/50 px-2 py-0.5 rounded text-xs font-semibold">
                                ★ \${parseFloat(peer.average_rating).toFixed(1)}
                                <span class="text-slate-400 font-normal">(\${peer.total_reviews})</span>
                            </div>
                        </div>

                        <div class="mb-4">
                            <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">Teaches:</span>
                            <div class="flex flex-wrap gap-1.5">
                                \${badges || '<span class="text-xs text-slate-500">No subjects listed</span>'}
                            </div>
                        </div>

                        <div class="text-xs text-slate-400 mb-4 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                            <span class="font-medium text-slate-300">Availability:</span> \${escapeHtml(peer.availability || 'Flexible')}
                        </div>
                    </div>

                    <button 
                        onclick="openBookingModal(\${peer.id}, '\${escapeJs(peer.name)}')"
                        class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg text-xs transition"
                    >
                        Book 1-on-1 Session (10 pts)
                    </button>
                </div>
            \`;
        }).join('');
    }

    // Debounced input handler (300ms)
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(fetchPeers, 300);
    });

    deptFilter.addEventListener('change', fetchPeers);

    // Initial load
    fetchPeers();
});

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeJs(str) {
    if (!str) return '';
    return str.replace(/'/g, "\\'");
}
`
  }
];
