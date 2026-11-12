import React, { useState } from 'react';
import {
  BookOpen,
  Database,
  ShieldCheck,
  Zap,
  Lock,
  Server,
  ArrowRight,
  CheckCircle2,
  Terminal,
  Code2,
  AlertTriangle,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ProcedureGuideProps {
  onOpenCodeInspector?: (filename: string) => void;
  onOpenFetchInspector?: () => void;
}

export const ProcedureGuide: React.FC<ProcedureGuideProps> = ({
  onOpenCodeInspector,
  onOpenFetchInspector
}) => {
  const [expandedSection, setExpandedSection] = useState<number | null>(1);

  const toggleSection = (id: number) => {
    setExpandedSection(prev => (prev === id ? null : id));
  };

  const steps = [
    {
      id: 1,
      title: 'Database Architecture & Normalization (database.sql)',
      tag: 'Database & Relational Model',
      icon: Database,
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            The system is built on relational integrity in <strong>MySQL 8.0+ / MariaDB</strong> with the <strong>InnoDB</strong> storage engine.
            InnoDB is mandatory because it provides true ACID transactions and row-level locking.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <h5 className="font-bold text-white mb-1.5 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Table Constraints &amp; Rules
              </h5>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><code className="text-indigo-300 font-mono">chk_credit_positive</code>: Guarantees <code className="text-slate-200 font-mono">credit_balance &gt;= 0</code> so students can never go into negative balance.</li>
                <li><code className="text-indigo-300 font-mono">chk_different_peers</code>: Enforces <code className="text-slate-200 font-mono">learner_id &lt;&gt; tutor_id</code>, preventing self-booking.</li>
                <li><code className="text-indigo-300 font-mono">user_skills</code> junction: Many-to-many relationship with unique constraint <code className="text-slate-200 font-mono">(user_id, skill_id, skill_type)</code>.</li>
              </ul>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <h5 className="font-bold text-white mb-1.5 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Performance Indexes
              </h5>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><code className="text-indigo-300 font-mono">idx_learner_status (learner_id, status)</code>: Accelerates dashboard session queries.</li>
                <li><code className="text-indigo-300 font-mono">idx_tutor_status (tutor_id, status)</code>: Instant tutor appointment lookups.</li>
                <li><code className="text-indigo-300 font-mono">idx_ledger_user (user_id, created_at)</code>: Fast chronological statement rendering.</li>
              </ul>
            </div>
          </div>

          <div className="bg-indigo-950/40 border border-indigo-800/50 p-3 rounded-xl">
            <span className="font-semibold text-indigo-300 block mb-1">Double-Entry Accounting Principle:</span>
            Every credit exchange writes exactly two paired entries into <code className="text-white font-mono">credit_ledger</code>:
            one for the learner (<code className="text-amber-300 font-mono">spent</code>) and one for the tutor (<code className="text-emerald-300 font-mono">earned</code>).
            This guarantees zero credit leakage and an immutable audit trail.
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: 'Centralized PDO Connection & Security Guards (config/db.php)',
      tag: 'Security & Auth Middleware',
      icon: ShieldCheck,
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            The file <code className="text-indigo-300 font-mono">config/db.php</code> acts as the single source of truth for database access,
            session hardening, and CSRF token verification across all routes.
          </p>

          <div className="space-y-3 my-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="font-bold text-white block mb-1">1. PDO Configuration Best Practices:</span>
              <pre className="text-indigo-300 font-mono text-[11px] overflow-x-auto">
{`$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,  // Throws PDOException on error
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,        // Clean associative arrays
    PDO::ATTR_EMULATE_PREPARES   => false,                   // True server-side prepared statements
];`}
              </pre>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="font-bold text-white block mb-1">2. Session Hardening &amp; CSRF Generation:</span>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><code className="text-slate-200 font-mono">session.cookie_httponly = 1</code>: Prevents client JavaScript from stealing the session ID.</li>
                <li><code className="text-slate-200 font-mono">session.cookie_samesite = 'Lax'</code>: Stops Cross-Site Request Forgery (CSRF).</li>
                <li><code className="text-slate-200 font-mono">$_SESSION['csrf_token'] = bin2hex(random_bytes(32))</code>: Cryptographically secure 256-bit token.</li>
              </ul>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="font-bold text-white block mb-1">3. Dual Route Guards:</span>
              <p className="text-slate-400">
                Traditional web pages use <code className="text-indigo-300 font-mono">require_login()</code> which redirects unauthenticated visitors to <code className="text-slate-200 font-mono">login.php</code>.
                Meanwhile, API routes like <code className="text-indigo-300 font-mono">search_peers.php</code> use <code className="text-indigo-300 font-mono">require_api_login()</code> which returns a clean <code className="text-amber-300 font-mono">HTTP 401 JSON</code> response so the frontend Fetch API can handle re-authentication gracefully.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: 'High-Performance Peer Search API (api/search_peers.php)',
      tag: 'Backend REST API',
      icon: Zap,
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            When students type in the search bar, an asynchronous request is dispatched to <code className="text-indigo-300 font-mono">/skillbridge/api/search_peers.php?subject=...&amp;department=...</code>.
          </p>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 my-3">
            <span className="font-bold text-white block mb-1">Key SQL Optimization: GROUP_CONCAT</span>
            <p className="text-slate-400 mb-2">
              Instead of running an N+1 query loop for every user's skills, the API aggregates all taught subjects into a single comma-separated string in one database round-trip:
            </p>
            <pre className="text-indigo-300 font-mono text-[11px] overflow-x-auto">
{`SELECT 
    u.id, u.name, u.department, u.semester, u.average_rating, u.total_reviews, u.availability,
    GROUP_CONCAT(DISTINCT s.subject_name ORDER BY s.subject_name ASC SEPARATOR ', ') AS teachable_subjects
FROM users u
INNER JOIN user_skills us ON u.id = us.user_id AND us.skill_type = 'teach'
INNER JOIN skills s ON us.skill_id = s.id
WHERE u.id != :curr_uid AND u.status = 'active'
GROUP BY u.id, u.name, u.department, u.semester, u.average_rating, u.total_reviews, u.availability
ORDER BY u.average_rating DESC, u.total_reviews DESC
LIMIT 50;`}
            </pre>
          </div>

          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li>Excludes the calling student with <code className="text-slate-200 font-mono">u.id != :curr_uid</code>.</li>
            <li>Ranks by quality first (<code className="text-slate-200 font-mono">average_rating DESC</code>), then experience (<code className="text-slate-200 font-mono">total_reviews DESC</code>).</li>
            <li>Returns a clean JSON payload with HTTP 200, count, and array of peer records.</li>
          </ul>
        </div>
      )
    },
    {
      id: 4,
      title: 'Frontend Interface with Fetch API (frontend/js/search_peers.js)',
      tag: 'Dynamic UI & JavaScript',
      icon: Terminal,
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            The dynamic user interface communicates asynchronously with the PHP backend using the browser's native <strong>Fetch API</strong> without page reloads.
          </p>

          <div className="space-y-3 my-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="font-bold text-white block mb-1">1. Debounce Pattern (300ms Delay):</span>
              <p className="text-slate-400">
                Typing "Algorithms" would trigger 10 consecutive network requests without debounce.
                By wrapping the call in a 300ms timer, fetch() is only executed once the user finishes typing:
              </p>
              <pre className="text-indigo-300 font-mono text-[11px] mt-2 overflow-x-auto">
{`let debounceTimer = null;
searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fetchPeers, 300);
});`}
              </pre>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="font-bold text-white block mb-1">2. AbortController for In-Flight Cancellation:</span>
              <p className="text-slate-400">
                If the user types a new letter while a previous network request is still in-flight, <code className="text-slate-200 font-mono">abortController.abort()</code> cancels the stale request, eliminating race conditions.
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="font-bold text-white block mb-1">3. Safe Dynamic DOM Generation:</span>
              <p className="text-slate-400">
                Results from <code className="text-slate-200 font-mono">await response.json()</code> are safely mapped into peer cards with HTML escaping to prevent XSS. Each card features badge pills for subjects, star ratings, and an instant booking button.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: 'ACID Concurrency & Deadlock Prevention (student/sessions.php)',
      tag: 'Transactions & Locking',
      icon: Lock,
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            When a study session finishes, the transfer of credits between two students must be atomic: either both the learner is debited and the tutor is credited, or neither occurs.
          </p>

          <div className="bg-amber-950/40 border border-amber-800/60 p-3 rounded-xl my-3">
            <h5 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              The Deadlock Trap &amp; How SkillBridge Solves It
            </h5>
            <p className="text-slate-300 mb-2">
              Suppose Alice (ID: 1) and Bob (ID: 2) have two concurrent study sessions completing at the exact same millisecond:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>In Session A, Alice pays Bob: Thread 1 locks Alice, then tries to lock Bob.</li>
              <li>In Session B, Bob pays Alice: Thread 2 locks Bob, then tries to lock Alice.</li>
              <li><strong>Result:</strong> MySQL Deadlock (Circular Wait / Error 1213)!</li>
            </ul>
            <p className="text-emerald-300 font-semibold mt-2">
              The Solution in SkillBridge: Deterministic Lock Ordering
            </p>
            <pre className="text-indigo-300 font-mono text-[11px] mt-1 overflow-x-auto">
{`$first_id = min($learner_id, $tutor_id);
$second_id = max($learner_id, $tutor_id);

$lock_users = $pdo->prepare("
    SELECT id, credit_balance FROM users 
    WHERE id IN (:id1, :id2) 
    ORDER BY id ASC 
    FOR UPDATE
");
$lock_users->execute([':id1' => $first_id, ':id2' => $second_id]);`}
            </pre>
            <p className="text-slate-400 mt-2">
              Because all threads always acquire row locks in strictly ascending numerical ID order, circular waits are mathematically impossible!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: 'Local Deployment Guide (XAMPP / LAMP / Docker)',
      tag: 'DevOps & Setup',
      icon: Server,
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            To deploy SkillBridge on a local development environment (such as XAMPP, WAMP, MAMP, or Ubuntu LAMP):
          </p>

          <ol className="list-decimal list-inside space-y-3 text-slate-300 my-3">
            <li className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <strong className="text-white">Step 1: Create Database</strong>
              <p className="text-slate-400 mt-1">
                Open phpMyAdmin or your MySQL CLI and run the script from <code className="text-indigo-300 font-mono">database.sql</code>:
              </p>
              <pre className="text-indigo-300 font-mono text-[11px] mt-1">
                mysql -u root -p &lt; database.sql
              </pre>
            </li>

            <li className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <strong className="text-white">Step 2: Copy Project Directory</strong>
              <p className="text-slate-400 mt-1">
                Place the <code className="text-slate-200 font-mono">skillbridge</code> folder into your web server root:
                <br />
                • Windows (XAMPP): <code className="text-indigo-300 font-mono">C:\xampp\htdocs\skillbridge\</code>
                <br />
                • Linux (Apache): <code className="text-indigo-300 font-mono">/var/www/html/skillbridge/</code>
              </p>
            </li>

            <li className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <strong className="text-white">Step 3: Verify config/db.php Credentials</strong>
              <p className="text-slate-400 mt-1">
                Ensure <code className="text-slate-200 font-mono">DB_HOST</code>, <code className="text-slate-200 font-mono">DB_USER</code>, and <code className="text-slate-200 font-mono">DB_PASS</code> match your local MySQL settings.
              </p>
            </li>

            <li className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <strong className="text-white">Step 4: Launch in Browser</strong>
              <p className="text-slate-400 mt-1">
                Navigate to <code className="text-emerald-400 font-mono">http://localhost/skillbridge/dashboard.php</code>.
                Open the Browser Developer Tools (F12) Network tab to inspect the dynamic Fetch API calls in action!
              </p>
            </li>
          </ol>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Guide Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            Comprehensive Implementation Guide
          </span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Step-by-Step Architecture &amp; Procedure
        </h2>
        <p className="text-slate-400 text-sm max-w-3xl mt-1">
          Complete breakdown of how the database constraints, PDO connection, dynamic Fetch API frontend,
          and ACID double-entry transaction engine work together.
        </p>
      </div>

      {/* Accordion Steps */}
      <div className="space-y-3">
        {steps.map(step => {
          const Icon = step.icon;
          const isExpanded = expandedSection === step.id;

          return (
            <div
              key={step.id}
              className={`bg-slate-900 border rounded-2xl transition overflow-hidden shadow-lg ${
                isExpanded ? 'border-indigo-600/70 shadow-indigo-950/30' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <button
                onClick={() => toggleSection(step.id)}
                className="w-full text-left p-5 flex items-center justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isExpanded ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-indigo-400 font-semibold uppercase tracking-wider">
                        Step {step.id} • {step.tag}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      {step.title}
                    </h3>
                  </div>
                </div>

                <div className="text-slate-400 p-1 rounded-lg hover:bg-slate-800">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 pt-1 border-t border-slate-800/80 animate-in slide-in-from-top-1">
                  {step.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
