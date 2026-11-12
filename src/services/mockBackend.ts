import {
  User,
  Skill,
  UserSkill,
  StudySession,
  CreditLedger,
  PeerSearchResult,
  SessionMode,
  SessionStatus
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_SKILLS,
  INITIAL_USER_SKILLS,
  INITIAL_SESSIONS,
  INITIAL_LEDGER
} from '../data/initialData';

const STORAGE_KEYS = {
  USERS: 'skillbridge_users_v1',
  SKILLS: 'skillbridge_skills_v1',
  USER_SKILLS: 'skillbridge_user_skills_v1',
  SESSIONS: 'skillbridge_sessions_v1',
  LEDGER: 'skillbridge_ledger_v1',
  CURRENT_USER_ID: 'skillbridge_active_uid_v1'
};

export interface FetchRequestLog {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  params: Record<string, string>;
  status: number;
  durationMs: number;
  response: any;
  timestamp: string;
}

class SkillBridgeEngine {
  private users: User[] = [];
  private skills: Skill[] = [];
  private userSkills: UserSkill[] = [];
  private sessions: StudySession[] = [];
  private ledger: CreditLedger[] = [];
  private activeUserId: number = 1;
  private logs: FetchRequestLog[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      const storedSkills = localStorage.getItem(STORAGE_KEYS.SKILLS);
      const storedUserSkills = localStorage.getItem(STORAGE_KEYS.USER_SKILLS);
      const storedSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      const storedLedger = localStorage.getItem(STORAGE_KEYS.LEDGER);
      const storedUid = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);

      this.users = storedUsers ? JSON.parse(storedUsers) : [...INITIAL_USERS];
      this.skills = storedSkills ? JSON.parse(storedSkills) : [...INITIAL_SKILLS];
      this.userSkills = storedUserSkills ? JSON.parse(storedUserSkills) : [...INITIAL_USER_SKILLS];
      this.sessions = storedSessions ? JSON.parse(storedSessions) : [...INITIAL_SESSIONS];
      this.ledger = storedLedger ? JSON.parse(storedLedger) : [...INITIAL_LEDGER];
      this.activeUserId = storedUid ? parseInt(storedUid, 10) : 1;
    } catch {
      this.resetDatabase();
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
      localStorage.setItem(STORAGE_KEYS.SKILLS, JSON.stringify(this.skills));
      localStorage.setItem(STORAGE_KEYS.USER_SKILLS, JSON.stringify(this.userSkills));
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(this.sessions));
      localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(this.ledger));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, this.activeUserId.toString());
    } catch (e) {
      console.warn('Storage persistence failed', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  public resetDatabase() {
    this.users = JSON.parse(JSON.stringify(INITIAL_USERS));
    this.skills = JSON.parse(JSON.stringify(INITIAL_SKILLS));
    this.userSkills = JSON.parse(JSON.stringify(INITIAL_USER_SKILLS));
    this.sessions = JSON.parse(JSON.stringify(INITIAL_SESSIONS));
    this.ledger = JSON.parse(JSON.stringify(INITIAL_LEDGER));
    this.activeUserId = 1;
    this.persist();
  }

  public getActiveUser(): User {
    const user = this.users.find(u => u.id === this.activeUserId);
    return user || this.users[0];
  }

  public setActiveUser(userId: number) {
    if (this.users.some(u => u.id === userId)) {
      this.activeUserId = userId;
      this.persist();
    }
  }

  public getAllUsers(): User[] {
    return this.users;
  }

  public getSkills(): Skill[] {
    return this.skills;
  }

  public getDepartments(): string[] {
    const set = new Set<string>();
    this.users.forEach(u => set.add(u.department));
    return Array.from(set).sort();
  }

  public getLogs(): FetchRequestLog[] {
    return this.logs;
  }

  /**
   * Simulates the exact MySQL query in `api/search_peers.php`
   */
  public async searchPeersApi(
    subjectFilter: string = '',
    departmentFilter: string = ''
  ): Promise<{ status: 'success' | 'error'; count: number; data: PeerSearchResult[] }> {
    const startTime = performance.now();
    const currUid = this.activeUserId;

    // Simulate realistic asynchronous network latency (100ms - 250ms)
    await new Promise(r => setTimeout(r, 120));

    // Active peers excluding current user
    const candidates = this.users.filter(u => u.id !== currUid && u.status === 'active');

    const results: PeerSearchResult[] = [];

    for (const user of candidates) {
      if (departmentFilter && departmentFilter !== 'All' && user.department !== departmentFilter) {
        continue;
      }

      // Find skills taught by this user
      const taughtSkillIds = this.userSkills
        .filter(us => us.user_id === user.id && us.skill_type === 'teach')
        .map(us => us.skill_id);

      const taughtSkills = this.skills
        .filter(s => taughtSkillIds.includes(s.id))
        .map(s => s.subject_name);

      if (taughtSkills.length === 0) continue;

      // Filter by subject query
      if (subjectFilter.trim() !== '') {
        const query = subjectFilter.toLowerCase();
        const matchesSubject = taughtSkills.some(s => s.toLowerCase().includes(query));
        const matchesName = user.name.toLowerCase().includes(query);
        const matchesBio = (user.bio || '').toLowerCase().includes(query);

        if (!matchesSubject && !matchesName && !matchesBio) {
          continue;
        }
      }

      results.push({
        id: user.id,
        name: user.name,
        department: user.department,
        semester: user.semester,
        average_rating: user.average_rating,
        total_reviews: user.total_reviews,
        availability: user.availability,
        teachable_subjects: taughtSkills.sort().join(', '),
        bio: user.bio,
        email: user.email,
      });
    }

    // ORDER BY u.average_rating DESC, u.total_reviews DESC
    results.sort((a, b) => {
      if (b.average_rating !== a.average_rating) {
        return b.average_rating - a.average_rating;
      }
      return b.total_reviews - a.total_reviews;
    });

    const responsePayload = {
      status: 'success' as const,
      count: results.length,
      data: results
    };

    const duration = Math.round(performance.now() - startTime);

    // Record Fetch Log
    const log: FetchRequestLog = {
      id: Math.random().toString(36).substring(2, 9),
      url: `/skillbridge/api/search_peers.php?subject=${encodeURIComponent(subjectFilter)}&department=${encodeURIComponent(departmentFilter)}`,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      params: { subject: subjectFilter, department: departmentFilter },
      status: 200,
      durationMs: duration,
      response: responsePayload,
      timestamp: new Date().toLocaleTimeString(),
    };

    this.logs = [log, ...this.logs.slice(0, 19)];
    this.notify();

    return responsePayload;
  }

  /**
   * Simulates `book_session.php`
   */
  public async bookSession(data: {
    tutor_id: number;
    subject_id: number;
    topic: string;
    session_date: string;
    mode: SessionMode;
    meeting_details: string;
  }): Promise<{ status: 'success' | 'error'; message: string; session_id?: number }> {
    const learner = this.getActiveUser();

    if (data.tutor_id === learner.id) {
      return { status: 'error', message: 'You cannot book a session with yourself.' };
    }

    if (learner.credit_balance < 10) {
      return {
        status: 'error',
        message: `Insufficient credit balance (${learner.credit_balance} pts). You need 10 credits to book.`
      };
    }

    const tutor = this.users.find(u => u.id === data.tutor_id);
    const subject = this.skills.find(s => s.id === data.subject_id);

    const newSession: StudySession = {
      id: Date.now() % 100000,
      learner_id: learner.id,
      tutor_id: data.tutor_id,
      subject_id: data.subject_id,
      topic: data.topic,
      session_date: data.session_date,
      duration_minutes: 60,
      mode: data.mode,
      meeting_details: data.meeting_details || 'Campus location to be confirmed in chat',
      status: 'pending',
      credit_cost: 10,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      learner_name: learner.name,
      tutor_name: tutor?.name,
      subject_name: subject?.subject_name
    };

    this.sessions.unshift(newSession);
    this.persist();

    return {
      status: 'success',
      message: 'Session requested successfully! Awaiting tutor acceptance.',
      session_id: newSession.id
    };
  }

  /**
   * Simulates ACID atomic completion from `student/sessions.php`
   * Locks rows in ID order to prevent deadlocks: min(lid, tid) then max(lid, tid)
   */
  public async completeSessionWithAcidTransaction(
    sessionId: number
  ): Promise<{
    status: 'success' | 'error';
    message: string;
    steps?: { step: string; detail: string; status: 'ok' | 'failed' }[];
  }> {
    const steps: { step: string; detail: string; status: 'ok' | 'failed' }[] = [];
    const currentUid = this.activeUserId;

    // Step 1: Check CSRF & Route Guard
    steps.push({
      step: 'CSRF & Guard Verification',
      detail: 'Session token valid; current_user_id = ' + currentUid,
      status: 'ok'
    });

    // Step 2: Lock session row (SELECT ... FOR UPDATE)
    const sessionIndex = this.sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) {
      steps.push({
        step: 'Row Lock: sessions',
        detail: `Session #${sessionId} not found`,
        status: 'failed'
      });
      return { status: 'error', message: 'Session not found.', steps };
    }

    const session = this.sessions[sessionIndex];
    if (session.status !== 'accepted') {
      steps.push({
        step: 'Status Check',
        detail: `Expected status 'accepted', found '${session.status}'`,
        status: 'failed'
      });
      return {
        status: 'error',
        message: `Session is currently '${session.status}'. Only accepted sessions can be completed.`,
        steps
      };
    }

    if (session.learner_id !== currentUid && session.tutor_id !== currentUid) {
      steps.push({
        step: 'Authorization Check',
        detail: 'User neither learner nor tutor for session',
        status: 'failed'
      });
      return { status: 'error', message: 'Unauthorized.', steps };
    }

    steps.push({
      step: 'Row Lock: sessions (FOR UPDATE)',
      detail: `Locked session #${sessionId} row (Status: accepted, Cost: ${session.credit_cost} pts)`,
      status: 'ok'
    });

    const cost = session.credit_cost;
    const learnerId = session.learner_id;
    const tutorId = session.tutor_id;

    // Step 3: Deadlock avoidance - Lock users in deterministic ID order
    const firstLockId = Math.min(learnerId, tutorId);
    const secondLockId = Math.max(learnerId, tutorId);

    steps.push({
      step: 'Deterministic Deadlock Prevention',
      detail: `Locking user rows in strictly ascending order: ID #${firstLockId} first, then ID #${secondLockId}`,
      status: 'ok'
    });

    const learner = this.users.find(u => u.id === learnerId);
    const tutor = this.users.find(u => u.id === tutorId);

    if (!learner || !tutor) {
      steps.push({
        step: 'User Resolution',
        detail: 'Learner or tutor record missing',
        status: 'failed'
      });
      return { status: 'error', message: 'Peer records not found.', steps };
    }

    // Step 4: Validate balance sufficiency
    if (learner.credit_balance < cost) {
      steps.push({
        step: 'Balance Sufficiency Check',
        detail: `Learner balance (${learner.credit_balance}) < session cost (${cost})`,
        status: 'failed'
      });
      return {
        status: 'error',
        message: `Learner (${learner.name}) has insufficient credits (${learner.credit_balance} pts) to complete.`,
        steps
      };
    }

    steps.push({
      step: 'Balance Validation',
      detail: `Learner (${learner.name}) has ${learner.credit_balance} pts >= required ${cost} pts`,
      status: 'ok'
    });

    // Step 5: Update session status
    this.sessions[sessionIndex].status = 'completed';
    steps.push({
      step: 'UPDATE sessions SET status = "completed"',
      detail: `Session #${sessionId} marked as completed`,
      status: 'ok'
    });

    // Step 6: Transfer credits
    learner.credit_balance -= cost;
    tutor.credit_balance += cost;

    steps.push({
      step: 'UPDATE users SET credit_balance',
      detail: `Learner #${learnerId} -${cost} (New: ${learner.credit_balance}) | Tutor #${tutorId} +${cost} (New: ${tutor.credit_balance})`,
      status: 'ok'
    });

    // Step 7: Double-entry audit ledger
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const learnerLedgerEntry: CreditLedger = {
      id: Date.now() % 100000 + 1,
      user_id: learnerId,
      session_id: sessionId,
      transaction_type: 'spent',
      amount: cost,
      balance_after: learner.credit_balance,
      description: `Attended peer study session #${sessionId} (${session.topic})`,
      created_at: now,
      user_name: learner.name,
    };

    const tutorLedgerEntry: CreditLedger = {
      id: Date.now() % 100000 + 2,
      user_id: tutorId,
      session_id: sessionId,
      transaction_type: 'earned',
      amount: cost,
      balance_after: tutor.credit_balance,
      description: `Conducted peer study session #${sessionId} (${session.topic})`,
      created_at: now,
      user_name: tutor.name,
    };

    this.ledger.unshift(tutorLedgerEntry);
    this.ledger.unshift(learnerLedgerEntry);

    steps.push({
      step: 'INSERT INTO credit_ledger (Double-Entry)',
      detail: `Generated 2 paired audit rows (Learner spent -${cost}, Tutor earned +${cost})`,
      status: 'ok'
    });

    // Step 8: Commit transaction
    steps.push({
      step: 'ACID Transaction Commit',
      detail: 'Transaction committed to database successfully',
      status: 'ok'
    });

    this.persist();

    return {
      status: 'success',
      message: `Session #${sessionId} completed! ${cost} credits transferred atomically.`,
      steps
    };
  }

  public updateSessionStatus(sessionId: number, newStatus: SessionStatus) {
    const session = this.sessions.find(s => s.id === sessionId);
    if (session) {
      session.status = newStatus;
      this.persist();
    }
  }

  public getSessionsForUser(userId: number): StudySession[] {
    return this.sessions
      .filter(s => s.learner_id === userId || s.tutor_id === userId)
      .map(s => {
        const learner = this.users.find(u => u.id === s.learner_id);
        const tutor = this.users.find(u => u.id === s.tutor_id);
        const subject = this.skills.find(sub => sub.id === s.subject_id);
        return {
          ...s,
          learner_name: learner?.name,
          tutor_name: tutor?.name,
          subject_name: subject?.subject_name
        };
      });
  }

  public getLedgerForUser(userId: number): CreditLedger[] {
    return this.ledger
      .filter(entry => entry.user_id === userId)
      .map(entry => {
        const u = this.users.find(usr => usr.id === entry.user_id);
        return { ...entry, user_name: u?.name };
      });
  }
}

export const engine = new SkillBridgeEngine();
