import React, { useState, useEffect, useRef } from 'react';
import { PeerSearchResult } from '../types';
import { engine, FetchRequestLog } from '../services/mockBackend';
import { BookingModal } from './BookingModal';
import {
  Search,
  SlidersHorizontal,
  Star,
  BookOpen,
  Calendar,
  Sparkles,
  Code2,
  Terminal,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowRight
} from 'lucide-react';

interface PeerSearchProps {
  onOpenCodeInspector?: (filename: string) => void;
  onOpenFetchWorkbench?: () => void;
}

export const PeerSearch: React.FC<PeerSearchProps> = ({
  onOpenCodeInspector,
  onOpenFetchWorkbench
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [department, setDepartment] = useState('All');
  const [peers, setPeers] = useState<PeerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPeerForBooking, setSelectedPeerForBooking] = useState<PeerSearchResult | null>(null);
  const [showInspector, setShowInspector] = useState(false);
  const [lastLog, setLastLog] = useState<FetchRequestLog | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const departments = ['All', ...engine.getDepartments()];

  const executeFetch = async (query: string, dept: string) => {
    setLoading(true);
    try {
      const res = await engine.searchPeersApi(query, dept);
      setPeers(res.data);
      const logs = engine.getLogs();
      if (logs.length > 0) {
        setLastLog(logs[0]);
      }
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Debounced input handler (300ms)
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      executeFetch(searchTerm, department);
    }, 280);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchTerm, department]);

  // Subscribe to engine state changes (e.g. when user changes or session completes)
  useEffect(() => {
    const unsubscribe = engine.subscribe(() => {
      executeFetch(searchTerm, department);
    });
    return unsubscribe;
  }, [searchTerm, department]);

  const activeUser = engine.getActiveUser();

  const handleBookingSuccess = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {successToast && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-xl flex items-center justify-between text-sm shadow-xl shadow-emerald-900/20 animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-xs text-emerald-300/80 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Student Discovery Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Campus Peer Directory
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight">
            Find a Peer Tutor
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl mt-1">
            Connect with campus classmates for 1-on-1 subject mentoring and project help. 
            Search by course name, topic, or department in real time.
          </p>
        </div>
      </div>

      {/* Dynamic Search Controls */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Text Input with Search Icon */}
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by course, topic, or classmate name (e.g. Data Structures, SQL, ML)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div className="sm:col-span-4 relative">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-8 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition appearance-none cursor-pointer"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'All' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Live Filter Summary & Status Bar */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-white">{peers.length}</strong> available peer tutors
              {department !== 'All' && <span> in <strong className="text-indigo-300">{department}</strong></span>}
              {searchTerm && <span> matching "<strong className="text-indigo-300">{searchTerm}</strong>"</span>}
            </span>
            {loading && (
              <span className="flex items-center gap-1.5 text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-800/40 font-mono text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
                Searching peers...
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-500">
            Real-time campus matching
          </div>
        </div>
      </div>

      {/* Peer Cards Grid */}
      {peers.length === 0 ? (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl py-16 px-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 mx-auto flex items-center justify-center text-slate-500 mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">No matching peer tutors found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try adjusting your search query, or clear the department filter to view tutors from other campus faculties.
          </p>
          {(searchTerm || department !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setDepartment('All');
              }}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-indigo-300 transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {peers.map((peer) => {
            const subjectList = (peer.teachable_subjects || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);

            return (
              <div
                key={peer.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 transition flex flex-col justify-between shadow-lg shadow-black/20 group hover:shadow-indigo-950/20"
              >
                <div>
                  {/* Top: Name & Rating */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-base group-hover:text-indigo-300 transition-colors">
                          {peer.name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 font-medium">
                        {peer.department} • Sem {peer.semester}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 bg-amber-950/60 border border-amber-800/50 text-amber-300 px-2 py-1 rounded-lg text-xs font-semibold shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{Number(peer.average_rating).toFixed(2)}</span>
                      <span className="text-slate-400 text-[10px] font-normal">
                        ({peer.total_reviews})
                      </span>
                    </div>
                  </div>

                  {/* Bio */}
                  {peer.bio && (
                    <p className="text-xs text-slate-300 line-clamp-2 mb-3.5 leading-relaxed">
                      {peer.bio}
                    </p>
                  )}

                  {/* Teachable Subjects Chips */}
                  <div className="mb-4">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-indigo-400" />
                      Teaches:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {subjectList.map((subject, idx) => {
                        const isMatch =
                          searchTerm.trim() !== '' &&
                          subject.toLowerCase().includes(searchTerm.toLowerCase());
                        return (
                          <span
                            key={idx}
                            className={`px-2.5 py-1 text-xs rounded-lg border font-medium ${
                              isMatch
                                ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500 shadow-sm'
                                : 'bg-slate-950/80 text-slate-300 border-slate-800'
                            }`}
                          >
                            {subject}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 mb-5 flex items-start gap-2">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span className="leading-tight">{peer.availability || 'Flexible on weekdays'}</span>
                  </div>
                </div>

                {/* Booking Button */}
                <button
                  onClick={() => setSelectedPeerForBooking(peer)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl text-xs transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 group-hover:scale-[1.01]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Book Study Session (10 pts)</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Modal */}
      {selectedPeerForBooking && (
        <BookingModal
          peer={selectedPeerForBooking}
          onClose={() => setSelectedPeerForBooking(null)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};
