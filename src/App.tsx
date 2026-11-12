/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { engine } from './services/mockBackend';
import { PeerSearch } from './components/PeerSearch';
import { SessionsManager } from './components/SessionsManager';
import { CreditLedgerView } from './components/CreditLedgerView';
import { downloadProjectZip, PROCEDURE_GUIDE_MARKDOWN } from './utils/zipExport';
import {
  Search,
  Calendar,
  Coins,
  Download,
  RotateCcw,
  ChevronDown,
  Archive,
  CheckCircle,
  FileCode,
  X,
  FileText,
  Copy
} from 'lucide-react';

type NavTab = 'discovery' | 'sessions' | 'ledger';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('discovery');
  const [activeUser, setActiveUser] = useState(engine.getActiveUser());
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState(false);
  const [copiedReadme, setCopiedReadme] = useState(false);

  const allUsers = engine.getAllUsers();

  const handleUserChange = (userId: number) => {
    engine.setActiveUser(userId);
    setActiveUser(engine.getActiveUser());
    setUserDropdownOpen(false);
  };

  const handleResetDb = () => {
    if (confirm('Reset database to initial seed state? This restores all default credits, sessions, and ledger rows.')) {
      engine.resetDatabase();
      setActiveUser(engine.getActiveUser());
    }
  };

  useEffect(() => {
    const unsubscribe = engine.subscribe(() => {
      setActiveUser(engine.getActiveUser());
    });
    return unsubscribe;
  }, []);

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      await downloadProjectZip();
      setDownloadSuccessToast(true);
      setTimeout(() => setDownloadSuccessToast(false), 5000);
    } catch (err) {
      console.error('Failed to generate ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleCopyReadme = () => {
    navigator.clipboard.writeText(PROCEDURE_GUIDE_MARKDOWN);
    setCopiedReadme(true);
    setTimeout(() => setCopiedReadme(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Global Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center font-black text-white text-base shadow-lg shadow-indigo-600/30">
              SB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white leading-none">
                  SkillBridge
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono">
                  Campus Peer Tutoring
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block mt-0.5">
                Peer Study Sessions &amp; Credit Exchange Network
              </p>
            </div>
          </div>

          {/* Right Side Controls: Balance & Student Switcher */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Credit Pill */}
            <button
              onClick={() => setActiveTab('ledger')}
              className="bg-indigo-950/70 border border-indigo-700/60 hover:border-indigo-500 px-3 py-1.5 rounded-xl flex items-center gap-2 transition cursor-pointer"
              title="Click to view full credit wallet & double-entry ledger"
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-indigo-200 hidden md:inline">Balance:</span>
              <span className="text-sm font-bold text-amber-400">
                {activeUser.credit_balance} pts
              </span>
            </button>

            {/* Active Student Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="bg-slate-800/90 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs transition cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-[10px]">
                  {activeUser.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-semibold text-white leading-none truncate max-w-[110px]">
                    {activeUser.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[110px]">
                    {activeUser.department}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-800 text-[11px] text-slate-400">
                    Switch Active Campus Student:
                  </div>
                  <div className="space-y-1 my-1">
                    {allUsers.map(user => (
                      <button
                        key={user.id}
                        onClick={() => handleUserChange(user.id)}
                        className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between ${
                          user.id === activeUser.id
                            ? 'bg-indigo-600 text-white font-semibold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className={`text-[10px] ${user.id === activeUser.id ? 'text-indigo-200' : 'text-slate-500'}`}>
                            {user.department} (Sem {user.semester})
                          </div>
                        </div>
                        <span className={`text-[11px] font-mono ${user.id === activeUser.id ? 'text-amber-300' : 'text-amber-400'}`}>
                          {user.credit_balance} pts
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <button
                      onClick={handleResetDb}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-950/30 flex items-center gap-1.5 transition text-[11px]"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset Mock Database
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Clean Student Navigation Bar (Internal code/guide tabs removed!) */}
        <div className="border-t border-slate-800/80 bg-slate-900/60 overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1">
            <button
              onClick={() => setActiveTab('discovery')}
              className={`px-5 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
                activeTab === 'discovery'
                  ? 'border-indigo-500 text-white bg-indigo-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-indigo-400" />
              <span>Peer Discovery</span>
            </button>

            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-5 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
                activeTab === 'sessions'
                  ? 'border-indigo-500 text-white bg-indigo-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Study Sessions</span>
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-5 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
                activeTab === 'ledger'
                  ? 'border-indigo-500 text-white bg-indigo-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-indigo-400" />
              <span>Credit Wallet &amp; Ledger</span>
            </button>
          </div>
        </div>
      </header>

      {/* Download Success Toast Notification */}
      {downloadSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-500 text-emerald-200 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs animate-in slide-in-from-bottom-4">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold text-white text-sm">Download Started!</div>
            <div>File saved as <code className="font-mono text-emerald-300">skillbridge_full_codebase.zip</code></div>
          </div>
          <button
            onClick={() => setDownloadSuccessToast(false)}
            className="text-emerald-400 hover:text-white ml-2 text-base"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Student Portal Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {activeTab === 'discovery' && (
          <PeerSearch />
        )}

        {activeTab === 'sessions' && (
          <SessionsManager
            onNavigateToLedger={() => setActiveTab('ledger')}
          />
        )}

        {activeTab === 'ledger' && (
          <CreditLedgerView />
        )}
      </main>

      {/* ZIP Bundle Contents Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Archive className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    SkillBridge Codebase &amp; Architecture Package (.zip)
                  </h3>
                  <p className="text-xs text-slate-400">
                    All backend PHP files, SQL schemas, JS scripts &amp; step-by-step documentation bundled together.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: File List */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="font-semibold text-white block mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Files packaged inside <code className="text-indigo-300 font-mono">skillbridge/</code>:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
                  <div className="flex items-center gap-2 p-2 bg-slate-900/80 rounded-lg border border-slate-800/80">
                    <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>README.md (Step-by-Step Guide)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-900/80 rounded-lg border border-slate-800/80">
                    <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>database.sql (MySQL Schema)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-900/80 rounded-lg border border-slate-800/80">
                    <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>config/db.php (PDO &amp; CSRF)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-900/80 rounded-lg border border-slate-800/80">
                    <FileCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>api/search_peers.php (Fetch API)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-900/80 rounded-lg border border-slate-800/80">
                    <FileCode className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>student/sessions.php (ACID Ledger)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-900/80 rounded-lg border border-slate-800/80">
                    <FileCode className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>book_session.php</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-900/80 rounded-lg border border-slate-800/80">
                    <FileCode className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>auth/login.php</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-900/80 rounded-lg border border-slate-800/80">
                    <FileCode className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>auth/register.php</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-900/80 rounded-lg border border-slate-800/80">
                    <FileCode className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>dashboard.php</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-900/80 rounded-lg border border-slate-800/80">
                    <FileCode className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                    <span>js/search_peers.js (Debounced Fetch)</span>
                  </div>
                </div>
              </div>

              {/* Quick Summary of Step-by-Step Procedure */}
              <div className="bg-indigo-950/40 p-4 rounded-xl border border-indigo-800/50 space-y-2">
                <span className="font-semibold text-indigo-300 block">
                  Quick Deployment Summary:
                </span>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
                  <li>Unzip <code className="text-white font-mono">skillbridge_full_codebase.zip</code> into your local web root (<code className="text-indigo-200">htdocs/skillbridge</code>).</li>
                  <li>Import <code className="text-white font-mono">database.sql</code> into MySQL/phpMyAdmin (<code className="text-indigo-200">CREATE DATABASE skillbridge_db</code>).</li>
                  <li>Verify credentials in <code className="text-white font-mono">config/db.php</code>.</li>
                  <li>Open <code className="text-white font-mono">http://localhost/skillbridge/dashboard.php</code> in your browser.</li>
                </ol>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-slate-800/60 px-6 py-4 border-t border-slate-700 flex items-center justify-between gap-3">
              <button
                onClick={handleCopyReadme}
                className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 transition"
              >
                {copiedReadme ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedReadme ? 'Copied README!' : 'Copy README Guide'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleDownloadZip();
                    setIsExportModalOpen(false);
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .ZIP Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">SkillBridge Campus Network</span>
            <span>•</span>
            <span>Peer Tutoring &amp; Credit Ledger</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadZip}
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium underline"
            >
              <Download className="w-3 h-3" />
              Download PHP Source &amp; Architecture (.zip)
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
