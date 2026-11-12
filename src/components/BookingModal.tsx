import React, { useState } from 'react';
import { PeerSearchResult, SessionMode, Skill } from '../types';
import { engine } from '../services/mockBackend';
import { X, Calendar, Clock, MapPin, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';

interface BookingModalProps {
  peer: PeerSearchResult | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ peer, onClose, onSuccess }) => {
  if (!peer) return null;

  const activeUser = engine.getActiveUser();
  const allSkills = engine.getSkills();

  // Find skills that this peer can teach
  const peerSubjects = peer.teachable_subjects
    ? peer.teachable_subjects.split(',').map(s => s.trim().toLowerCase())
    : [];

  const matchedSkills = allSkills.filter(s =>
    peerSubjects.includes(s.subject_name.toLowerCase())
  );

  const defaultSkillId = matchedSkills[0]?.id || allSkills[0]?.id || 1;

  const [subjectId, setSubjectId] = useState<number>(defaultSkillId);
  const [topic, setTopic] = useState('');
  const [sessionDate, setSessionDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(17, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [mode, setMode] = useState<SessionMode>('Online (Meet)');
  const [meetingDetails, setMeetingDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const creditCost = 10;
  const hasSufficientCredits = activeUser.credit_balance >= creditCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Please specify the topic or concepts you want to study.');
      return;
    }
    if (!hasSufficientCredits) {
      setError(`Insufficient credits. You have ${activeUser.credit_balance} pts, but 10 pts are required.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await engine.bookSession({
      tutor_id: peer.id,
      subject_id: subjectId,
      topic: topic.trim(),
      session_date: sessionDate.replace('T', ' ') + ':00',
      mode,
      meeting_details: meetingDetails.trim()
    });

    setIsSubmitting(false);

    if (result.status === 'success') {
      onSuccess(result.message);
      onClose();
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Book Peer Study Session</h3>
              <p className="text-xs text-slate-400">Tutor: {peer.name} ({peer.department})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-950/60 border border-red-800 text-red-200 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Credit Check Banner */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400">Your Current Balance:</span>
              <span className={`ml-2 font-bold ${hasSufficientCredits ? 'text-emerald-400' : 'text-rose-400'}`}>
                {activeUser.credit_balance} Credits
              </span>
            </div>
            <div className="bg-indigo-950/60 text-indigo-300 px-2.5 py-1 rounded-md border border-indigo-800/50 font-semibold">
              Cost: {creditCost} Credits
            </div>
          </div>

          {/* Subject Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Subject to Study
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              {matchedSkills.length > 0 ? (
                matchedSkills.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.subject_name}
                  </option>
                ))
              ) : (
                allSkills.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.subject_name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Topic / Concepts */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Specific Topic / Goal
            </label>
            <textarea
              rows={2}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Help understanding B+ Trees indexing and 3NF normalization proofs"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Duration
              </label>
              <input
                type="text"
                disabled
                value="60 Minutes (Standard)"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Study Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Study Location / Mode
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(['Online (Meet)', 'Campus Library', 'Lab Room', 'Study Commons'] as SessionMode[]).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMode(m)}
                  className={`p-2.5 rounded-xl border text-left font-medium transition ${
                    mode === m
                      ? 'border-indigo-500 bg-indigo-950/40 text-white'
                      : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Location / Meeting Details */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              Meeting Link or Room Notes
            </label>
            <input
              type="text"
              value={meetingDetails}
              onChange={(e) => setMeetingDetails(e.target.value)}
              placeholder={mode === 'Online (Meet)' ? 'https://meet.google.com/...' : 'e.g. 2nd Floor Study Room B4'}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !hasSufficientCredits}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/25 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>Requesting...</>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  Confirm Request (10 Credits)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
