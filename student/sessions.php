<?php
// =====================================================================
// student/sessions.php - Study Sessions & ACID Double-Entry Settlement
// =====================================================================
require_once __DIR__ . '/../config/database.php';
require_login();

$current_user_id = (int)$_SESSION['user_id'];
$error = null;
$success = null;

if (isset($_GET['success'])) {
    $success = match ($_GET['success']) {
        'completed' => 'Session completed! Credits transferred atomically and recorded in the double-entry ledger.',
        'accepted'  => 'Study session request accepted.',
        'declined'  => 'Study session request declined.',
        'cancelled' => 'Study session cancelled.',
        default     => null
    };
}

// Handle POST Actions: accept, decline, cancel, complete
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();

    $action = $_POST['action'] ?? '';
    $session_id = filter_input(INPUT_POST, 'session_id', FILTER_VALIDATE_INT);

    if (!$session_id) {
        $error = "Invalid session identifier.";
    } elseif (in_array($action, ['accept', 'decline'], true)) {
        $newStatus = $action === 'accept' ? 'accepted' : 'declined';
        $stmt = $pdo->prepare("
            UPDATE sessions 
            SET status = :new_status 
            WHERE id = :sid AND tutor_id = :uid AND status = 'pending'
        ");
        $stmt->execute([':new_status' => $newStatus, ':sid' => $session_id, ':uid' => $current_user_id]);

        if ($stmt->rowCount() > 0) {
            header('Location: ' . app_url('student/sessions.php?success=' . $newStatus));
            exit;
        }
        $error = "Unable to update session. Only the assigned tutor can respond to pending requests.";
    } elseif ($action === 'cancel') {
        $stmt = $pdo->prepare("
            UPDATE sessions 
            SET status = 'cancelled' 
            WHERE id = :sid AND learner_id = :uid AND status = 'pending'
        ");
        $stmt->execute([':sid' => $session_id, ':uid' => $current_user_id]);

        if ($stmt->rowCount() > 0) {
            header('Location: ' . app_url('student/sessions.php?success=cancelled'));
            exit;
        }
        $error = "Unable to cancel session.";
    } elseif ($action === 'complete') {
        try {
            // Begin ACID Transaction
            $pdo->beginTransaction();

            // 1. Lock session row to prevent concurrent double-spend
            $check_stmt = $pdo->prepare("
                SELECT * FROM sessions 
                WHERE id = :sid AND (tutor_id = :uid1 OR learner_id = :uid2) AND status = 'accepted'
                FOR UPDATE
            ");
            $check_stmt->execute([
                ':sid'  => $session_id,
                ':uid1' => $current_user_id,
                ':uid2' => $current_user_id
            ]);
            $session = $check_stmt->fetch();

            if (!$session) {
                throw new Exception("Session not found, unauthorized, or not in accepted state.");
            }

            $cost       = (int)$session['credit_cost'];
            $learner_id = (int)$session['learner_id'];
            $tutor_id   = (int)$session['tutor_id'];

            // 2. Lock user rows in deterministic ascending ID order to prevent deadlocks
            $first_id  = min($learner_id, $tutor_id);
            $second_id = max($learner_id, $tutor_id);

            $lock_users = $pdo->prepare("
                SELECT id, credit_balance FROM users 
                WHERE id IN (:id1, :id2) 
                ORDER BY id ASC 
                FOR UPDATE
            ");
            $lock_users->execute([':id1' => $first_id, ':id2' => $second_id]);
            $balances = $lock_users->fetchAll(PDO::FETCH_KEY_PAIR);

            // 3. Validate learner credit sufficiency
            if (!isset($balances[$learner_id]) || (int)$balances[$learner_id] < $cost) {
                throw new Exception("Learner has insufficient credits to complete this session.");
            }

            // 4. Mark session completed
            $pdo->prepare("UPDATE sessions SET status = 'completed' WHERE id = :sid")
                ->execute([':sid' => $session_id]);

            // 5. Deduct from learner & award tutor
            $pdo->prepare("UPDATE users SET credit_balance = credit_balance - :cost WHERE id = :lid")
                ->execute([':cost' => $cost, ':lid' => $learner_id]);

            $pdo->prepare("UPDATE users SET credit_balance = credit_balance + :cost WHERE id = :tid")
                ->execute([':cost' => $cost, ':tid' => $tutor_id]);

            $learner_new_balance = (int)$balances[$learner_id] - $cost;
            $tutor_new_balance   = (int)$balances[$tutor_id] + $cost;

            // 6. Write double-entry audit ledger entries
            $ledger_stmt = $pdo->prepare("
                INSERT INTO credit_ledger (user_id, session_id, transaction_type, amount, balance_after, description) 
                VALUES (:uid, :sid, :ttype, :amt, :bal, :descr)
            ");

            $ledger_stmt->execute([
                ':uid'   => $learner_id,
                ':sid'   => $session_id,
                ':ttype' => 'spent',
                ':amt'   => $cost,
                ':bal'   => $learner_new_balance,
                ':descr' => "Attended peer study session #{$session_id} ({$session['topic']})"
            ]);

            $ledger_stmt->execute([
                ':uid'   => $tutor_id,
                ':sid'   => $session_id,
                ':ttype' => 'earned',
                ':amt'   => $cost,
                ':bal'   => $tutor_new_balance,
                ':descr' => "Conducted peer study session #{$session_id} ({$session['topic']})"
            ]);

            $pdo->commit();

            header('Location: ' . app_url('student/sessions.php?success=completed'));
            exit;
        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            $error = $e->getMessage();
        }
    }
}

// Fetch current user
$userStmt = $pdo->prepare("SELECT * FROM users WHERE id = :uid LIMIT 1");
$userStmt->execute([':uid' => $current_user_id]);
$currentUser = $userStmt->fetch();

// Status filter
$filter = $_GET['status'] ?? 'all';
$allowedFilters = ['all', 'pending', 'accepted', 'completed'];
if (!in_array($filter, $allowedFilters, true)) {
    $filter = 'all';
}

$sql = "
    SELECT s.*, 
           l.name AS learner_name, 
           t.name AS tutor_name, 
           sk.subject_name
    FROM sessions s
    INNER JOIN users l ON s.learner_id = l.id
    INNER JOIN users t ON s.tutor_id = t.id
    INNER JOIN skills sk ON s.subject_id = sk.id
    WHERE (s.learner_id = :uid1 OR s.tutor_id = :uid2)
";
$params = [':uid1' => $current_user_id, ':uid2' => $current_user_id];

if ($filter !== 'all') {
    $sql .= " AND s.status = :status";
    $params[':status'] = $filter;
}
$sql .= " ORDER BY s.session_date DESC, s.id DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$sessions = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SkillBridge - Study Sessions</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col">
    <header class="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center font-black text-white text-base shadow-lg shadow-indigo-600/30">
                    SB
                </div>
                <div>
                    <h1 class="text-base font-bold text-white leading-none">SkillBridge</h1>
                    <p class="text-[11px] text-slate-400 mt-0.5">Peer Study Sessions &amp; Credit Exchange</p>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <a href="<?= e(app_url('student/ledger.php')) ?>" class="bg-indigo-950/70 border border-indigo-700/60 px-3 py-1.5 rounded-xl text-sm font-bold text-amber-400">
                    <?= (int)$currentUser['credit_balance'] ?> pts
                </a>
                <span class="text-xs text-slate-300 hidden sm:inline"><?= e($currentUser['name']) ?></span>
                <a href="<?= e(app_url('auth/logout.php')) ?>" class="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-300 transition">
                    Sign Out
                </a>
            </div>
        </div>

        <div class="border-t border-slate-800/80 bg-slate-900/60 overflow-x-auto">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1">
                <a href="<?= e(app_url('dashboard.php')) ?>" class="px-5 py-3 text-xs font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-200 whitespace-nowrap">
                    Peer Discovery
                </a>
                <a href="<?= e(app_url('student/sessions.php')) ?>" class="px-5 py-3 text-xs font-semibold border-b-2 border-indigo-500 text-white bg-indigo-500/10 whitespace-nowrap">
                    Study Sessions
                </a>
                <a href="<?= e(app_url('student/ledger.php')) ?>" class="px-5 py-3 text-xs font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-200 whitespace-nowrap">
                    Credit Wallet &amp; Ledger
                </a>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        <?php if ($error): ?>
            <div class="bg-red-950/70 border border-red-700 text-red-200 text-xs p-4 rounded-xl"><?= e($error) ?></div>
        <?php endif; ?>
        <?php if ($success): ?>
            <div class="bg-emerald-950/70 border border-emerald-700 text-emerald-200 text-xs p-4 rounded-xl"><?= e($success) ?></div>
        <?php endif; ?>

        <div class="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 inline-block mb-1.5">
                    Secure Credit Settlement
                </span>
                <h2 class="text-2xl font-bold text-white tracking-tight">Study Sessions &amp; Appointments</h2>
                <p class="text-slate-400 text-sm max-w-2xl">
                    Track your 1-on-1 peer study bookings. Mark accepted sessions as completed to atomically transfer credits from learner to tutor.
                </p>
            </div>

            <div class="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 text-xs">
                <?php foreach ($allowedFilters as $tab): ?>
                    <a
                        href="<?= e(app_url('student/sessions.php?status=' . $tab)) ?>"
                        class="px-3 py-1.5 rounded-lg font-medium capitalize transition <?= $filter === $tab ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200' ?>"
                    >
                        <?= e($tab) ?>
                    </a>
                <?php endforeach; ?>
            </div>
        </div>

        <?php if (empty($sessions)): ?>
            <div class="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl py-16 px-6 text-center">
                <h3 class="text-base font-semibold text-white mb-1">No sessions found</h3>
                <p class="text-xs text-slate-400">Visit Peer Discovery to book a study session with a classmate.</p>
            </div>
        <?php else: ?>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <?php foreach ($sessions as $session): ?>
                    <?php
                        $isLearner = (int)$session['learner_id'] === $current_user_id;
                        $isTutor   = (int)$session['tutor_id'] === $current_user_id;
                        $otherParty = $isLearner ? $session['tutor_name'] : $session['learner_name'];
                        $badgeClasses = match ($session['status']) {
                            'pending'   => 'bg-amber-950/50 text-amber-300 border-amber-800/50',
                            'accepted'  => 'bg-blue-950/50 text-blue-300 border-blue-800/50',
                            'completed' => 'bg-emerald-950/50 text-emerald-300 border-emerald-800/50',
                            'declined'  => 'bg-rose-950/50 text-rose-300 border-rose-800/50',
                            default     => 'bg-slate-800/50 text-slate-400 border-slate-700/50'
                        };
                    ?>
                    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
                        <div>
                            <div class="flex items-start justify-between gap-3 mb-3">
                                <div>
                                    <span class="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 block">
                                        <?= e($session['subject_name']) ?>
                                    </span>
                                    <h3 class="text-base font-bold text-white mt-0.5"><?= e($session['topic']) ?></h3>
                                </div>
                                <span class="px-2.5 py-1 rounded-lg text-xs font-semibold border capitalize <?= $badgeClasses ?>">
                                    <?= e($session['status']) ?>
                                </span>
                            </div>

                            <div class="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 mb-4 space-y-1.5 text-xs">
                                <div class="flex justify-between">
                                    <span class="text-slate-400">Your Role:</span>
                                    <span class="font-semibold text-white"><?= $isLearner ? 'Learner (Pays credits)' : 'Tutor (Earns credits)' ?></span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-slate-400"><?= $isLearner ? 'Tutor:' : 'Learner:' ?></span>
                                    <span class="font-semibold text-indigo-300"><?= e($otherParty) ?></span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-slate-400">Credit Value:</span>
                                    <span class="font-bold text-amber-400"><?= (int)$session['credit_cost'] ?> Credits</span>
                                </div>
                            </div>

                            <div class="text-xs text-slate-400 space-y-1 mb-4">
                                <div>Date: <span class="text-slate-200"><?= e($session['session_date']) ?></span> (<?= (int)$session['duration_minutes'] ?> mins)</div>
                                <div><strong class="text-slate-300"><?= e($session['mode']) ?>:</strong> <?= e($session['meeting_details']) ?></div>
                            </div>
                        </div>

                        <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                            <span class="text-[11px] text-slate-500 font-mono">Session #<?= (int)$session['id'] ?></span>

                            <div class="flex items-center gap-2">
                                <?php if ($session['status'] === 'pending' && $isTutor): ?>
                                    <form method="POST" action="<?= e(app_url('student/sessions.php')) ?>" class="inline">
                                        <input type="hidden" name="csrf_token" value="<?= e($_SESSION['csrf_token']) ?>">
                                        <input type="hidden" name="session_id" value="<?= (int)$session['id'] ?>">
                                        <input type="hidden" name="action" value="decline">
                                        <button type="submit" class="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-300 border border-rose-900/40 hover:bg-rose-950/40 cursor-pointer">Decline</button>
                                    </form>
                                    <form method="POST" action="<?= e(app_url('student/sessions.php')) ?>" class="inline">
                                        <input type="hidden" name="csrf_token" value="<?= e($_SESSION['csrf_token']) ?>">
                                        <input type="hidden" name="session_id" value="<?= (int)$session['id'] ?>">
                                        <input type="hidden" name="action" value="accept">
                                        <button type="submit" class="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 cursor-pointer">Accept Request</button>
                                    </form>
                                <?php elseif ($session['status'] === 'pending' && $isLearner): ?>
                                    <form method="POST" action="<?= e(app_url('student/sessions.php')) ?>" class="inline">
                                        <input type="hidden" name="csrf_token" value="<?= e($_SESSION['csrf_token']) ?>">
                                        <input type="hidden" name="session_id" value="<?= (int)$session['id'] ?>">
                                        <input type="hidden" name="action" value="cancel">
                                        <button type="submit" class="px-3 py-1.5 rounded-lg text-xs text-slate-300 border border-slate-700 hover:bg-slate-800 cursor-pointer">Cancel Request</button>
                                    </form>
                                <?php elseif ($session['status'] === 'accepted'): ?>
                                    <form method="POST" action="<?= e(app_url('student/sessions.php')) ?>" class="inline">
                                        <input type="hidden" name="csrf_token" value="<?= e($_SESSION['csrf_token']) ?>">
                                        <input type="hidden" name="session_id" value="<?= (int)$session['id'] ?>">
                                        <input type="hidden" name="action" value="complete">
                                        <button type="submit" class="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer">
                                            Complete Session &amp; Settle Credits
                                        </button>
                                    </form>
                                <?php elseif ($session['status'] === 'completed'): ?>
                                    <a href="<?= e(app_url('student/ledger.php')) ?>" class="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium">
                                        Settled in Ledger →
                                    </a>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </main>
</body>
</html>
