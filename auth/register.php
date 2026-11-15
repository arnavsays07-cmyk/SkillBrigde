<?php
// =====================================================================
// auth/register.php - Student Registration & 20 Welcome Credit Grant
// =====================================================================
require_once __DIR__ . '/../config/database.php';

if (isset($_SESSION['user_id'])) {
    header('Location: ' . app_url('dashboard.php'));
    exit;
}

$error = null;
$departments = [
    'Computer Science',
    'Data Science',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Mathematics',
    'Business & Management'
];

// Load available subjects for optional tutor selection
$skills = $pdo->query("SELECT id, subject_name, code FROM skills ORDER BY code ASC")->fetchAll();

$formData = [
    'name' => '',
    'email' => '',
    'enrollment_no' => '',
    'department' => 'Computer Science',
    'semester' => 3,
    'teach_skills' => []
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();

    $formData['name'] = trim($_POST['name'] ?? '');
    $formData['email'] = strtolower(trim($_POST['email'] ?? ''));
    $formData['enrollment_no'] = strtoupper(trim($_POST['enrollment_no'] ?? ''));
    $formData['department'] = trim($_POST['department'] ?? 'Computer Science');
    $formData['semester'] = max(1, min(8, (int)($_POST['semester'] ?? 1)));
    $formData['teach_skills'] = array_map('intval', $_POST['teach_skills'] ?? []);

    $password = $_POST['password'] ?? '';
    $confirmPassword = $_POST['confirm_password'] ?? '';
    $validEmail = filter_var($formData['email'], FILTER_VALIDATE_EMAIL);

    if (empty($formData['name']) || !$validEmail || empty($formData['enrollment_no'])) {
        $error = "Please provide your full name, valid campus email, and enrollment number.";
    } elseif (strlen($password) < 6) {
        $error = "Password must be at least 6 characters long.";
    } elseif ($password !== $confirmPassword) {
        $error = "Passwords do not match. Please re-enter carefully.";
    } else {
        try {
            $pdo->beginTransaction();

            $password_hash = password_hash($password, PASSWORD_DEFAULT);

            $stmt = $pdo->prepare("
                INSERT INTO users (name, email, enrollment_no, password_hash, department, semester, credit_balance)
                VALUES (:name, :email, :eno, :phash, :dept, :sem, 20)
            ");
            $stmt->execute([
                ':name'  => $formData['name'],
                ':email' => $validEmail,
                ':eno'   => $formData['enrollment_no'],
                ':phash' => $password_hash,
                ':dept'  => $formData['department'],
                ':sem'   => $formData['semester']
            ]);

            $new_user_id = (int)$pdo->lastInsertId();

            // Insert selected teachable skills
            if (!empty($formData['teach_skills'])) {
                $skillStmt = $pdo->prepare("
                    INSERT IGNORE INTO user_skills (user_id, skill_id, skill_type)
                    VALUES (:uid, :sid, 'teach')
                ");
                foreach ($formData['teach_skills'] as $skillId) {
                    if ($skillId > 0) {
                        $skillStmt->execute([':uid' => $new_user_id, ':sid' => $skillId]);
                    }
                }
            }

            // Record initial +20 onboarding bonus in double-entry ledger
            $ledger_stmt = $pdo->prepare("
                INSERT INTO credit_ledger (user_id, session_id, transaction_type, amount, balance_after, description)
                VALUES (:uid, NULL, 'bonus', 20, 20, 'Welcome onboarding bonus credits upon enrollment verification')
            ");
            $ledger_stmt->execute([':uid' => $new_user_id]);

            $pdo->commit();

            session_regenerate_id(true);
            $_SESSION['user_id']    = $new_user_id;
            $_SESSION['user_name']  = $formData['name'];
            $_SESSION['user_email'] = $validEmail;
            $_SESSION['role']       = 'student';

            header('Location: ' . app_url('dashboard.php'));
            exit;
        } catch (PDOException $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            $error = ((string)$e->getCode() === '23000')
                ? "An account with this campus email or enrollment number already exists."
                : "Registration error: " . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SkillBridge - Create Student Account</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
    <div class="max-w-2xl w-full mx-auto">
        <div class="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
            <div class="grid grid-cols-2 bg-slate-950/80 p-1.5 border-b border-slate-800">
                <a href="<?= e(app_url('auth/login.php')) ?>" class="py-2.5 rounded-2xl text-xs font-semibold text-center text-slate-400 hover:text-white transition">
                    Student Sign In
                </a>
                <a href="<?= e(app_url('auth/register.php')) ?>" class="py-2.5 rounded-2xl text-xs font-semibold text-center bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                    Create Student Account
                </a>
            </div>

            <div class="p-6 sm:p-8">
                <div class="mb-6">
                    <h2 class="text-xl font-bold text-white">Join the SkillBridge network</h2>
                    <p class="text-xs text-slate-400 mt-1">Verify your student enrollment details to receive 20 onboarding credits.</p>
                </div>

                <?php if ($error): ?>
                    <div class="mb-5 bg-red-950/60 border border-red-800/80 text-red-200 text-xs p-3.5 rounded-xl">
                        <?= e($error) ?>
                    </div>
                <?php endif; ?>

                <form method="POST" action="<?= e(app_url('auth/register.php')) ?>" class="space-y-4">
                    <input type="hidden" name="csrf_token" value="<?= e($_SESSION['csrf_token']) ?>">

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                            <input type="text" name="name" value="<?= e($formData['name']) ?>" placeholder="Jordan Patel" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Enrollment Number</label>
                            <input type="text" name="enrollment_no" value="<?= e($formData['enrollment_no']) ?>" placeholder="CS2026-0215" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 uppercase focus:outline-none focus:border-indigo-500">
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-slate-300 mb-1.5">Campus Email</label>
                        <input type="email" name="email" value="<?= e($formData['email']) ?>" placeholder="jordan.patel@campus.edu" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500">
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div class="sm:col-span-2">
                            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Department</label>
                            <select name="department" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500">
                                <?php foreach ($departments as $dept): ?>
                                    <option value="<?= e($dept) ?>" <?= $formData['department'] === $dept ? 'selected' : '' ?>>
                                        <?= e($dept) ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Semester</label>
                            <select name="semester" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500">
                                <?php for ($s = 1; $s <= 8; $s++): ?>
                                    <option value="<?= $s ?>" <?= $formData['semester'] === $s ? 'selected' : '' ?>>Semester <?= $s ?></option>
                                <?php endfor; ?>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-slate-300 mb-1.5">Subjects you can tutor <span class="text-slate-500 font-normal">(optional)</span></label>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs">
                            <?php foreach ($skills as $skill): ?>
                                <label class="flex items-center gap-2 text-slate-300 cursor-pointer hover:text-white">
                                    <input type="checkbox" name="teach_skills[]" value="<?= (int)$skill['id'] ?>" <?= in_array((int)$skill['id'], $formData['teach_skills'], true) ? 'checked' : '' ?> class="accent-indigo-600 rounded">
                                    <span class="truncate"><?= e($skill['code'] . ': ' . $skill['subject_name']) ?></span>
                                </label>
                            <?php endforeach; ?>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                            <input type="password" name="password" minlength="6" placeholder="Min. 6 characters" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Confirm Password</label>
                            <input type="password" name="confirm_password" minlength="6" placeholder="Re-enter password" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500">
                        </div>
                    </div>

                    <div class="bg-emerald-950/30 border border-emerald-800/50 rounded-xl px-3.5 py-2.5 text-xs text-emerald-200">
                        Includes <strong class="text-white">+20 Welcome Credits</strong> automatically recorded in your ledger.
                    </div>

                    <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl text-sm transition shadow-lg shadow-indigo-600/25 cursor-pointer">
                        Create Account &amp; Claim 20 Credits
                    </button>
                </form>
            </div>
        </div>
    </div>
</body>
</html>
