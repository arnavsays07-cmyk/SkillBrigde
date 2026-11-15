<?php
// =====================================================================
// student/ledger.php - Credit Wallet & Double-Entry Audit Ledger
// =====================================================================
require_once __DIR__ . '/../config/database.php';
require_login();

$current_user_id = (int)$_SESSION['user_id'];

$userStmt = $pdo->prepare("SELECT * FROM users WHERE id = :uid LIMIT 1");
$userStmt->execute([':uid' => $current_user_id]);
$currentUser = $userStmt->fetch();

// Totals breakdown
$summaryStmt = $pdo->prepare("
    SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'earned' THEN amount ELSE 0 END), 0) AS total_earned,
        COALESCE(SUM(CASE WHEN transaction_type = 'spent' THEN amount ELSE 0 END), 0) AS total_spent,
        COALESCE(SUM(CASE WHEN transaction_type = 'bonus' THEN amount ELSE 0 END), 0) AS total_bonus
    FROM credit_ledger
    WHERE user_id = :uid
");
$summaryStmt->execute([':uid' => $current_user_id]);
$totals = $summaryStmt->fetch();

$typeFilter = $_GET['type'] ?? 'all';
$allowedTypes = ['all', 'earned', 'spent', 'bonus', 'refund'];
if (!in_array($typeFilter, $allowedTypes, true)) {
    $typeFilter = 'all';
}

$sql = "SELECT * FROM credit_ledger WHERE user_id = :uid";
$params = [':uid' => $current_user_id];
if ($typeFilter !== 'all') {
    $sql .= " AND transaction_type = :ttype";
    $params[':ttype'] = $typeFilter;
}
$sql .= " ORDER BY created_at DESC, id DESC";

$ledgerStmt = $pdo->prepare($sql);
$ledgerStmt->execute($params);
$entries = $ledgerStmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SkillBridge - Credit Wallet &amp; Ledger</title>
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
                <span class="bg-indigo-950/70 border border-indigo-700/60 px-3 py-1.5 rounded-xl text-sm font-bold text-amber-400">
                    <?= (int)$currentUser['credit_balance'] ?> pts
                </span>
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
                <a href="<?= e(app_url('student/sessions.php')) ?>" class="px-5 py-3 text-xs font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-200 whitespace-nowrap">
                    Study Sessions
                </a>
                <a href="<?= e(app_url('student/ledger.php')) ?>" class="px-5 py-3 text-xs font-semibold border-b-2 border-indigo-500 text-white bg-indigo-500/10 whitespace-nowrap">
                    Credit Wallet &amp; Ledger
                </a>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-700/50 rounded-2xl p-5 shadow-xl">
                <span class="text-xs font-semibold uppercase tracking-wider text-indigo-300 block mb-2">Credit Balance</span>
                <div class="text-3xl font-extrabold text-white"><?= (int)$currentUser['credit_balance'] ?> <span class="text-xs text-amber-400">Credits</span></div>
            </div>
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <span class="text-xs font-semibold uppercase tracking-wider text-emerald-400 block mb-2">Earned as Tutor</span>
                <div class="text-3xl font-extrabold text-emerald-400">+<?= (int)$totals['total_earned'] ?> <span class="text-xs text-slate-400">pts</span></div>
            </div>
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <span class="text-xs font-semibold uppercase tracking-wider text-rose-400 block mb-2">Spent as Learner</span>
                <div class="text-3xl font-extrabold text-rose-400">-<?= (int)$totals['total_spent'] ?> <span class="text-xs text-slate-400">pts</span></div>
            </div>
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <span class="text-xs font-semibold uppercase tracking-wider text-purple-400 block mb-2">Onboarding Grants</span>
                <div class="text-3xl font-extrabold text-purple-400">+<?= (int)$totals['total_bonus'] ?> <span class="text-xs text-slate-400">pts</span></div>
            </div>
        </div>

        <!-- Ledger Table -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div class="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 class="text-base font-bold text-white">Double-Entry Credit Ledger</h3>
                    <p class="text-xs text-slate-400">Complete transaction audit log for <?= e($currentUser['name']) ?></p>
                </div>

                <div class="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    <?php foreach ($allowedTypes as $type): ?>
                        <a href="<?= e(app_url('student/ledger.php?type=' . $type)) ?>" class="px-3 py-1.5 rounded-lg capitalize font-medium transition <?= $typeFilter === $type ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200' ?>">
                            <?= e($type) ?>
                        </a>
                    <?php endforeach; ?>
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                    <thead class="bg-slate-950/70 text-slate-400 font-semibold border-b border-slate-800">
                        <tr>
                            <th class="py-3 px-4">TX ID</th>
                            <th class="py-3 px-4">Date &amp; Time</th>
                            <th class="py-3 px-4">Type</th>
                            <th class="py-3 px-4">Session Ref</th>
                            <th class="py-3 px-4">Amount</th>
                            <th class="py-3 px-4">Balance After</th>
                            <th class="py-3 px-4">Description</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/70">
                        <?php if (empty($entries)): ?>
                            <tr>
                                <td colspan="7" class="py-12 text-center text-slate-500">No ledger transactions found.</td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($entries as $row): ?>
                                <?php
                                    $isDebit = $row['transaction_type'] === 'spent';
                                    $sign = $isDebit ? '-' : '+';
                                ?>
                                <tr class="hover:bg-slate-800/40">
                                    <td class="py-3 px-4 font-mono text-slate-400">#<?= (int)$row['id'] ?></td>
                                    <td class="py-3 px-4 text-slate-300 whitespace-nowrap"><?= e($row['created_at']) ?></td>
                                    <td class="py-3 px-4 capitalize font-semibold"><?= e($row['transaction_type']) ?></td>
                                    <td class="py-3 px-4 font-mono text-indigo-400">
                                        <?= $row['session_id'] ? 'Session #' . (int)$row['session_id'] : '—' ?>
                                    </td>
                                    <td class="py-3 px-4 font-bold <?= $isDebit ? 'text-rose-400' : 'text-emerald-400' ?>">
                                        <?= $sign . (int)$row['amount'] ?> pts
                                    </td>
                                    <td class="py-3 px-4 font-mono font-bold text-white"><?= (int)$row['balance_after'] ?> pts</td>
                                    <td class="py-3 px-4 text-slate-300"><?= e($row['description']) ?></td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </main>
</body>
</html>
