<?php
// =====================================================================
// auth/login.php - Student Sign In & Campus Demo Access
// =====================================================================
require_once __DIR__ . '/../config/database.php';

if (isset($_SESSION['user_id'])) {
    header('Location: ' . app_url('dashboard.php'));
    exit;
}

$error = null;
$emailValue = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();

    $emailValue = trim($_POST['email'] ?? '');
    $email = filter_var($emailValue, FILTER_VALIDATE_EMAIL);
    $password = $_POST['password'] ?? '';

    if (!$email || empty($password)) {
        $error = "Please enter a valid campus email and password.";
    } else {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => strtolower($email)]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            if ($user['status'] === 'suspended') {
                $error = "This account is suspended. Contact campus admin.";
            } else {
                session_regenerate_id(true);
                $_SESSION['user_id']    = (int)$user['id'];
                $_SESSION['user_name']  = $user['name'];
                $_SESSION['user_email'] = $user['email'];
                $_SESSION['role']       = $user['role'];

                header('Location: ' . app_url('dashboard.php'));
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SkillBridge - Student Sign In</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-x-hidden">
    <div class="pointer-events-none fixed inset-0 overflow-hidden">
        <div class="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl"></div>
    </div>

    <div class="max-w-6xl w-full mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <!-- Left Column -->
        <div class="lg:col-span-5 space-y-6">
            <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-indigo-600/30">
                    SB
                </div>
                <div>
                    <h1 class="text-xl font-bold text-white leading-none">SkillBridge</h1>
                    <p class="text-xs text-slate-400 mt-1">Campus Peer Tutoring &amp; Credit Exchange</p>
                </div>
            </div>

            <div class="space-y-3">
                <h2 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                    Learn together.
                    <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
                        Earn by teaching.
                    </span>
                </h2>
                <p class="text-sm text-slate-400 leading-relaxed">
                    Connect with verified classmates across engineering, science, and math. Book 1-on-1 study
                    sessions using campus credits—and earn credits back whenever you mentor others.
                </p>
            </div>

            <div class="space-y-3 text-xs">
                <div class="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-4">
                    <h3 class="font-bold text-white">20 Welcome Credits on Sign Up</h3>
                    <p class="text-slate-400 mt-0.5">Start booking your first tutoring sessions immediately upon enrollment.</p>
                </div>
                <div class="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-4">
                    <h3 class="font-bold text-white">Protected Double-Entry Ledger</h3>
                    <p class="text-slate-400 mt-0.5">Credits transfer atomically only when a peer study session is completed.</p>
                </div>
            </div>

            <!-- Demo Credentials Helper -->
            <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-xs">
                <div class="flex items-center justify-between mb-2">
                    <span class="font-semibold uppercase tracking-wider text-slate-400 text-[11px]">Demo Campus Accounts</span>
                    <span class="text-[10px] font-mono text-slate-500">pass: password123</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <button type="button" onclick="fillDemo('alex.chen@campus.edu')" class="text-left p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 transition">
                        <div class="font-semibold text-white">Alex Chen</div>
                        <div class="text-[10px] text-slate-400">Computer Science</div>
                    </button>
                    <button type="button" onclick="fillDemo('priya.sharma@campus.edu')" class="text-left p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 transition">
                        <div class="font-semibold text-white">Priya Sharma</div>
                        <div class="text-[10px] text-slate-400">Data Science</div>
                    </button>
                </div>
            </div>
        </div>

        <!-- Right Column: Login Card -->
        <div class="lg:col-span-7">
            <div class="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
                <div class="grid grid-cols-2 bg-slate-950/80 p-1.5 border-b border-slate-800">
                    <a href="<?= e(app_url('auth/login.php')) ?>" class="py-2.5 rounded-2xl text-xs font-semibold text-center bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                        Student Sign In
                    </a>
                    <a href="<?= e(app_url('auth/register.php')) ?>" class="py-2.5 rounded-2xl text-xs font-semibold text-center text-slate-400 hover:text-white transition">
                        Create Student Account
                    </a>
                </div>

                <div class="p-6 sm:p-8">
                    <div class="mb-6">
                        <h2 class="text-xl font-bold text-white">Welcome back to campus</h2>
                        <p class="text-xs text-slate-400 mt-1">Sign in with your university email to browse tutors and manage study sessions.</p>
                    </div>

                    <?php if ($error): ?>
                        <div class="mb-5 bg-red-950/60 border border-red-800/80 text-red-200 text-xs p-3.5 rounded-xl">
                            <?= e($error) ?>
                        </div>
                    <?php endif; ?>

                    <form method="POST" action="<?= e(app_url('auth/login.php')) ?>" class="space-y-4">
                        <input type="hidden" name="csrf_token" value="<?= e($_SESSION['csrf_token']) ?>">

                        <div>
                            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Campus Email</label>
                            <input
                                type="email"
                                id="login-email"
                                name="email"
                                value="<?= e($emailValue) ?>"
                                placeholder="alex.chen@campus.edu"
                                required
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                            >
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                            <input
                                type="password"
                                id="login-password"
                                name="password"
                                placeholder="Enter your password"
                                required
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                            >
                        </div>

                        <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl text-sm transition shadow-lg shadow-indigo-600/25 cursor-pointer">
                            Sign In
                        </button>

                        <p class="text-center text-xs text-slate-400 pt-2">
                            New to SkillBridge?
                            <a href="<?= e(app_url('auth/register.php')) ?>" class="text-indigo-400 hover:text-indigo-300 font-semibold">
                                Create a student account
                            </a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <script>
        function fillDemo(email) {
            document.getElementById('login-email').value = email;
            document.getElementById('login-password').value = 'password123';
        }
    </script>
</body>
</html>
