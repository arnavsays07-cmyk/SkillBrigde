import JSZip from 'jszip';
import { PHP_PROJECT_FILES } from '../data/phpCodeFiles';

export const PROCEDURE_GUIDE_MARKDOWN = `# SkillBridge - Campus Peer Tutoring & Credit Exchange
A complete full-stack web application built with PHP 8.2+, MySQL 8.0+ (InnoDB), and dynamic client-side Fetch API.

---

## Directory Structure
\`\`\`text
skillbridge/
├── README.md                  # Comprehensive setup and architecture guide
├── database.sql               # Normalized MySQL schema with CHECK constraints & indexes
├── config/
│   └── db.php                 # Centralized PDO connection, session security & CSRF guards
├── auth/
│   ├── login.php              # Secure login with password_verify() and session regeneration
│   ├── register.php           # New student signup + initial 20-credit bonus grant
│   └── logout.php             # Session wipe & cookie invalidation
├── api/
│   └── search_peers.php       # Asynchronous REST JSON endpoint for dynamic peer discovery
├── student/
│   └── sessions.php           # Atomic session completion with deadlock-free ACID transaction
├── book_session.php           # Session booking handler with credit balance verification
├── dashboard.php              # Full student dashboard template embedding Fetch API
└── js/
    └── search_peers.js        # Vanilla JS Fetch API with 300ms debounce & AbortController
\`\`\`

---

## Step-by-Step Setup & Procedure

### 1. Database Setup (database.sql)
1. Open phpMyAdmin or your MySQL CLI:
   \`\`\`bash
   mysql -u root -p
   \`\`\`
2. Run the SQL file:
   \`\`\`sql
   SOURCE path/to/skillbridge/database.sql;
   \`\`\`
   This provisions:
   - \`users\`: Student profiles with \`CONSTRAINT chk_credit_positive CHECK (credit_balance >= 0)\`.
   - \`skills\`: Master catalog of university courses and codes.
   - \`user_skills\`: Many-to-many junction table with \`UNIQUE KEY (user_id, skill_id, skill_type)\`.
   - \`sessions\`: Study bookings with \`CONSTRAINT chk_different_peers CHECK (learner_id <> tutor_id)\`.
   - \`credit_ledger\`: Double-entry audit ledger recording every point spent or earned.

### 2. Configure Database Credentials (config/db.php)
Open \`config/db.php\` and update constants:
\`\`\`php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'skillbridge_db');
\`\`\`

### 3. Deploy to Web Server
- **XAMPP / WAMP**: Copy \`skillbridge/\` into \`htdocs/\` (e.g. \`C:\\xampp\\htdocs\\skillbridge\`).
- **Linux (Apache / Nginx)**: Copy into \`/var/www/html/skillbridge\`.
- **Browser URL**: Navigate to \`http://localhost/skillbridge/dashboard.php\`.

---

## Architectural Highlights

### A. Dynamic Asynchronous Peer Search (Fetch API)
- \`api/search_peers.php\` uses MySQL's \`GROUP_CONCAT()\` to aggregate all teachable skills into a single database query.
- The client (\`js/search_peers.js\`) listens for keystrokes with a 300ms debounce and \`AbortController\` to prevent race conditions and server overloading.
- Automatically handles \`401 Unauthorized\` by redirecting to \`login.php\`.

### B. Concurrency Control & Deadlock Prevention (student/sessions.php)
When two students settle sessions concurrently, locking records randomly causes MySQL Deadlock (Error 1213).
SkillBridge prevents deadlocks by sorting the user IDs before locking:
\`\`\`php
$first_id = min($learner_id, $tutor_id);
$second_id = max($learner_id, $tutor_id);

$lock_users = $pdo->prepare("
    SELECT id, credit_balance FROM users 
    WHERE id IN (:id1, :id2) 
    ORDER BY id ASC 
    FOR UPDATE
");
$lock_users->execute([':id1' => $first_id, ':id2' => $second_id]);
\`\`\`

### C. Double-Entry Accounting
Every completed session writes two paired rows to \`credit_ledger\`:
1. Learner row: \`spent\`, \`-10\` credits.
2. Tutor row: \`earned\`, \`+10\` credits.
Both records contain \`balance_after\` for cryptographic consistency.

---
© 2026 SkillBridge Platform. All rights reserved.
`;

export async function generateProjectZip(): Promise<Blob> {
  const zip = new JSZip();
  const root = zip.folder('skillbridge') || zip;

  // Add README.md with comprehensive procedure guide
  root.file('README.md', PROCEDURE_GUIDE_MARKDOWN);

  // Add all PHP, SQL, JS files with correct folder paths
  for (const file of PHP_PROJECT_FILES) {
    // Normalize path inside the zip
    const relativePath = file.path.replace(/^frontend\//, '');
    root.file(relativePath, file.code.trim() + '\n');
  }

  // Generate the zip blob
  return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

export async function downloadProjectZip() {
  const blob = await generateProjectZip();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'skillbridge_full_codebase.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
