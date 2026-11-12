import React, { useState, useEffect } from 'react';
import { StudySession, SessionStatus } from '../types';
import { engine } from '../services/mockBackend';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  ArrowRightLeft,
  ChevronRight,
  Database,
  Lock,
  Sparkles
} from 'lucide-react';

interface SessionsManagerProps {
  onOpenCodeInspector?: (filename: string) => void;
  onNavigateToLedger?: () => void;
}

export const SessionsManager: React.FC<SessionsManagerProps> = ({
  onOpenCodeInspector,
  onNavigateToLedger
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'completed'>('all');
  const [activeUser, setActiveUser] = useState(engine.getActiveUser());
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [acidModalState, setAcidModalState] = useState<{
    isOpen: boolean;
    session: StudySession | null;
    isExecuting: boolean;
    completed: boolean;
    steps: { step: string; detail: string; status: 'ok' | 'failed' }[];
    error: string | null;
  }>({
    isOpen: false,
    session: null,
    isExecuting: false,
    completed: false,
    steps: [],
    error: null,
  });

  const refreshSessions = () => {
    const user = engine.getActiveUser();
    setActiveUser(user);
    setSessions(engine.getSessionsForUser(user.id));
  };

  useEffect(() => {
    refreshSessions();
    const unsubscribe = engine.subscribe(() => {
      refreshSessions();
    });
    return unsubscribe;
  }, []);

  const filteredSessions = sessions.filter(s => {
    if (filter === 'all') return true;
    return s.status === filter;
  });

  const handleUpdateStatus = (sessionId: number, newStatus: SessionStatus) => {
    engine.updateSessionStatus(sessionId, newStatus);
    refreshSessions();
  };

  const startAcidCompletion = async (session: StudySession) => {
    setAcidModalState({
      isOpen: true,
      session,
      isExecuting: true,
      completed: false,
      steps: [],
      error: null,
    });

    // Run ACID transaction
    const result = await engine.completeSessionWithAcidTransaction(session.id);

    setAcidModalState(prev => ({
      ...prev,
      isExecuting: false,
      completed: result.status === 'success',
      steps: result.steps || [],
      error: result.status === 'error' ? result.message : null,
    }));

    refreshSessions();
  };

  const closeAcidModal = () => {
    setAcidModalState(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure Credit Settlement
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Study Sessions &amp; Appointments
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl">
            Track your 1-on-1 peer study bookings. Once a session is conducted, mark it completed to automatically
            transfer credits from learner to tutor.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 text-xs">
          {(['all', 'pending', 'accepted', 'completed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg font-medium capitalize transition ${
                filter === tab
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl py-16 px-6 text-center">
          <Calendar className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white mb-1">No sessions in this view</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You don't have any {filter !== 'all' ? filter : ''} peer tutoring appointments right now.
            Head over to Peer Discovery to request a study session.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredSessions.map(session => {
            const isLearner = session.learner_id === activeUser.id;
            const isTutor = session.tutor_id === activeUser.id;
            const otherParty = isLearner ? session.tutor_name : session.learner_name;

            const statusColors: Record<SessionStatus, { bg: string; text: string; border: string }> = {
              pending: { bg: 'bg-amber-950/50', text: 'text-amber-300', border: 'border-amber-800/50' },
              accepted: { bg: 'bg-blue-950/50', text: 'text-blue-300', border: 'border-blue-800/50' },
              completed: { bg: 'bg-emerald-950/50', text: 'text-emerald-300', border: 'border-emerald-800/50' },
              declined: { bg: 'bg-rose-950/50', text: 'text-rose-300', border: 'border-rose-800/50' },
              cancelled: { bg: 'bg-slate-800/50', text: 'text-slate-400', border: 'border-slate-700/50' }
            };

            const colors = statusColors[session.status];

            return (
              <div
                key={session.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition flex flex-col justify-between shadow-lg shadow-black/20"
              >
                <div>
                  {/* Top Bar: Subject, Cost & Status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 block">
                        {session.subject_name || 'Subject ID #' + session.subject_id}
                      </span>
                      <h3 className="text-base font-bold text-white mt-0.5">
                        {session.topic}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border} capitalize`}>
                        {session.status}
                      </span>
                    </div>
                  </div>

                  {/* Peer & Role Details */}
                  <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 mb-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Your Role:</span>
                      <span className="font-semibold text-white">
                        {isLearner ? 'Learner (Will pay credits)' : 'Tutor (Will earn credits)'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">{isLearner ? 'Tutor Peer:' : 'Learner Peer:'}</span>
                      <span className="font-semibold text-indigo-300">{otherParty}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Credit Value:</span>
                      <span className="font-bold text-amber-400">{session.credit_cost} Credits</span>
                    </div>
                  </div>

                  {/* Metadata: Date, Mode, Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>{session.session_date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>{session.duration_minutes} Minutes</span>
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">
                        <strong className="text-slate-300">{session.mode}:</strong> {session.meeting_details}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions based on status */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Session #{session.id}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* If Pending and user is Tutor */}
                    {session.status === 'pending' && isTutor && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(session.id, 'declined')}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-300 hover:bg-rose-950/40 border border-rose-900/40 transition flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Decline
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(session.id, 'accepted')}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-md shadow-indigo-600/20 flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Accept Request
                        </button>
                      </>
                    )}

                    {/* If Pending and user is Learner */}
                    {session.status === 'pending' && isLearner && (
                      <span className="text-xs text-amber-400 italic">
                        Waiting for tutor ({session.tutor_name}) to accept
                      </span>
                    )}

                    {/* If Accepted: can be marked Completed by either peer */}
                    {session.status === 'accepted' && (
                      <button
                        onClick={() => startAcidCompletion(session)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        Complete Session &amp; Settle Credits (ACID)
                      </button>
                    )}

                    {/* If Completed */}
                    {session.status === 'completed' && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Settled in Ledger
                        </span>
                        {onNavigateToLedger && (
                          <button
                            onClick={onNavigateToLedger}
                            className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                          >
                            View Audit Row
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ACID Transaction Execution Modal */}
      {acidModalState.isOpen && acidModalState.session && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    ACID Transaction Execution Engine
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Executing student/sessions.php (Transaction #TX-{acidModalState.session.id})
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Session Overview Card */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <span className="text-slate-500 block">Session ID:</span> #{acidModalState.session.id}
                  </div>
                  <div>
                    <span className="text-slate-500 block">Transfer Cost:</span> 10 Credits
                  </div>
                  <div>
                    <span className="text-slate-500 block">Debtor (Learner):</span> {acidModalState.session.learner_name} (ID: #{acidModalState.session.learner_id})
                  </div>
                  <div>
                    <span className="text-slate-500 block">Creditor (Tutor):</span> {acidModalState.session.tutor_name} (ID: #{acidModalState.session.tutor_id})
                  </div>
                </div>
              </div>

              {/* Steps Progress */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Transaction Audit Steps:
                </span>
                <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 space-y-2.5">
                  {acidModalState.steps.map((s, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs">
                      <div className="mt-0.5">
                        {s.status === 'ok' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white flex items-center justify-between">
                          <span>{s.step}</span>
                          <span className="text-[10px] font-mono text-slate-500">Step {idx + 1}/8</span>
                        </div>
                        <p className="text-slate-400 text-[11px] font-mono mt-0.5">{s.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error state */}
              {acidModalState.error && (
                <div className="bg-red-950/80 border border-red-800 text-red-200 text-xs p-3 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{acidModalState.error}</span>
                </div>
              )}

              {/* Success Banner */}
              {acidModalState.completed && (
                <div className="bg-emerald-950/60 border border-emerald-800/80 p-3.5 rounded-xl text-xs text-emerald-200 flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <strong className="block text-white font-semibold">Transaction Committed Successfully!</strong>
                    <span>Learner account debited by 10 pts, tutor account credited by 10 pts, and 2 paired rows recorded in credit_ledger.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-800/60 px-6 py-3 border-t border-slate-700 flex items-center justify-end gap-3">
              <button
                onClick={closeAcidModal}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow"
              >
                Close &amp; View Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
