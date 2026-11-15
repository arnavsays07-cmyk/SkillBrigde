<?php
// =====================================================================
// dashboard.php - Student Portal & Dynamic Peer Discovery (Fetch API)
// =====================================================================
require_once __DIR__ . '/config/database.php';
require_login();

$user_id = (int)$_SESSION['user_id'];

$stmt = $pdo->prepare("SELECT * FROM users WHERE id = :uid LIMIT 1");
$stmt->execute([':uid' => $user_id]);
$currentUser = $stmt->fetch();

if (!$currentUser) {
    header('Location: ' . app_url('auth/logout.php'));
    exit;
}

$departments = $pdo->query("SELECT DISTINCT department FROM users WHERE status = 'active' ORDER BY department ASC")
    ->fetchAll(PDO::FETCH_COLUMN);

$baseUrl = rtrim(app_url(''), '/');
$defaultDate = date('Y-m-d\TH:i', strtotime('+1 day 17:00'));
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SkillBridge - Peer Discovery</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col">
    <div id="skillbridge-config" data-base-url="<?= e($baseUrl) ?>" data-csrf="<?= e($_SESSION['csrf_token']) ?>" class="hidden"></div>

    <!-- Top Navigation Bar -->
    <header class="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center font-black text-white text-base shadow-lg shadow-indigo-600/30">
                    SB
                </div>
                <div>
                    <div class="flex items-center gap-2">
                        <h1 class="text-base font-bold text-white leading-none">SkillBridge</h1>
                        <span class="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono">
                            Campus Peer Tutoring
                        </span>
                    </div>
                    <p class="text-[11px] text-slate-400 hidden sm:block mt-0.5">Peer Study Sessions &amp; Credit Exchange Network</p>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <a href="<?= e(app_url('student/ledger.php')) ?>" class="bg-indigo-950/70 border border-indigo-700/60 hover:border-indigo-500 px-3 py-1.5 rounded-xl flex items-center gap-2 transition">
                    <span class="text-xs text-indigo-200 hidden md:inline">Balance:</span>
                    <span class="text-sm font-bold text-amber-400"><?= (int)$currentUser['credit_balance'] ?> pts</span>
                </a>

                <div class="hidden sm:block text-right text-xs">
                    <div class="font-semibold text-white"><?= e($currentUser['name']) ?></div>
                    <div class="text-[10px] text-slate-400"><?= e($currentUser['department']) ?></div>
                </div>

                <a href="<?= e(app_url('auth/logout.php')) ?>" class="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-300 transition">
                    Sign Out
                </a>
            </div>
        </div>

        <!-- Tab Navigation -->
        <div class="border-t border-slate-800/80 bg-slate-900/60 overflow-x-auto">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1">
                <a href="<?= e(app_url('dashboard.php')) ?>" class="px-5 py-3 text-xs font-semibold border-b-2 border-indigo-500 text-white bg-indigo-500/10 whitespace-nowrap">
                    Peer Discovery
                </a>
                <a href="<?= e(app_url('student/sessions.php')) ?>" class="px-5 py-3 text-xs font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700 whitespace-nowrap">
                    Study Sessions
                </a>
                <a href="<?= e(app_url('student/ledger.php')) ?>" class="px-5 py-3 text-xs font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700 whitespace-nowrap">
                    Credit Wallet &amp; Ledger
                </a>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        <!-- Toast Notification -->
        <div id="booking-toast" class="hidden bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-xl text-sm shadow-xl"></div>

        <!-- Discovery Banner -->
        <div class="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 mb-2">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Live Campus Peer Directory
            </span>
            <h2 class="text-2xl font-bold text-white tracking-tight">Find a Peer Tutor</h2>
            <p class="text-slate-400 text-sm max-w-2xl mt-1">
                Connect with campus classmates for 1-on-1 subject mentoring and project help.
                Search by course name, topic, or department in real time.
            </p>
        </div>

        <!-- Search & Filter Bar -->
        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div class="sm:col-span-8">
                    <input
                        type="text"
                        id="peer-search-input"
                        placeholder="Search by course, topic, or classmate name (e.g. Data Structures, SQL, ML)..."
                        class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                    >
                </div>
                <div class="sm:col-span-4">
                    <select id="peer-dept-filter" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition">
                        <option value="">All Departments</option>
                        <?php foreach ($departments as $dept): ?>
                            <option value="<?= e($dept) ?>"><?= e($dept) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>

            <div class="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                <div class="flex items-center gap-2">
                    <span>Showing <strong id="peer-count-label" class="text-white">0</strong> available peer tutors</span>
                    <span id="search-status" class="hidden flex items-center gap-1.5 text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-800/40 font-mono text-[11px]">
                        Searching peers...
                    </span>
                </div>
                <div class="text-[11px] text-slate-500">Real-time campus matching</div>
            </div>
        </div>

        <!-- Dynamic Fetch API Results Grid -->
        <div id="peers-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
    </main>

    <!-- Booking Modal -->
    <div id="booking-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <div class="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div class="bg-slate-800/80 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                <div>
                    <h3 class="text-base font-bold text-white">Book Peer Study Session</h3>
                    <p id="booking-tutor-label" class="text-xs text-slate-400"></p>
                </div>
                <button type="button" data-close-booking class="text-slate-400 hover:text-white text-lg px-2 cursor-pointer">×</button>
            </div>

            <form id="booking-form" class="p-6 space-y-4 overflow-y-auto">
                <input type="hidden" id="booking-tutor-id" name="tutor_id" value="">

                <div id="booking-error" class="hidden bg-red-950/60 border border-red-800 text-red-200 text-xs p-3 rounded-xl"></div>

                <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
                    <div>
                        <span class="text-slate-400">Your Balance:</span>
                        <span class="ml-1 font-bold text-emerald-400"><?= (int)$currentUser['credit_balance'] ?> Credits</span>
                    </div>
                    <span class="bg-indigo-950/60 text-indigo-300 px-2.5 py-1 rounded-md border border-indigo-800/50 font-semibold">
                        Cost: 10 Credits
                    </span>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1.5">Subject to Study</label>
                    <select id="booking-subject-id" name="subject_id" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"></select>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1.5">Specific Topic / Goal</label>
                    <textarea name="topic" rows="2" required placeholder="e.g. B+ Trees indexing and 3NF normalization proofs" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"></textarea>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-semibold text-slate-300 mb-1.5">Date &amp; Time</label>
                        <input type="datetime-local" name="session_date" value="<?= e($defaultDate) ?>" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-300 mb-1.5">Study Mode</label>
                        <select name="mode" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                            <option value="Online (Meet)">Online (Meet)</option>
                            <option value="Campus Library">Campus Library</option>
                            <option value="Lab Room">Lab Room</option>
                            <option value="Study Commons">Study Commons</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1.5">Meeting Link or Room Notes</label>
                    <input type="text" name="meeting_details" placeholder="e.g. 2nd Floor Study Room B4 or Meet link" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500">
                </div>

                <div class="pt-2 flex items-center justify-end gap-3">
                    <button type="button" data-close-booking class="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white cursor-pointer">Cancel</button>
                    <button type="submit" class="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/25 cursor-pointer">
                        Confirm Request (10 Credits)
                    </button>
                </div>
            </form>
        </div>
    </div>

    <script src="<?= e(app_url('js/search_peers.js')) ?>"></script>
</body>
</html>
