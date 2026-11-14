/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { engine } from './services/mockBackend';
import { PeerSearch } from './components/PeerSearch';
import { SessionsManager } from './components/SessionsManager';
import { CreditLedgerView } from './components/CreditLedgerView';
import { AuthPage } from './components/AuthPage';
import {
  Search,
  Calendar,
  Coins,
  RotateCcw,
  ChevronDown,
  LogOut
} from 'lucide-react';

type NavTab = 'discovery' | 'sessions' | 'ledger';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('discovery');
  const [currentUser, setCurrentUser] = useState(engine.getCurrentUser());
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const allUsers = engine.getAllUsers();

  const handleUserChange = (userId: number) => {
    engine.setActiveUser(userId);
    setCurrentUser(engine.getCurrentUser());
    setUserDropdownOpen(false);
  };

  const handleLogout = () => {
    setUserDropdownOpen(false);
    engine.logout();
    setCurrentUser(null);
    setActiveTab('discovery');
  };

  const handleResetDb = () => {
    engine.resetDatabase();
    setCurrentUser(engine.getCurrentUser());
    setUserDropdownOpen(false);
  };

  useEffect(() => {
    const unsubscribe = engine.subscribe(() => {
      setCurrentUser(engine.getCurrentUser());
    });
    return unsubscribe;
  }, []);

  if (!currentUser) {
    return (
      <AuthPage
        onAuthSuccess={() => {
          setCurrentUser(engine.getCurrentUser());
          setActiveTab('discovery');
        }}
      />
    );
  }

  const activeUser = currentUser;

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
                  <div className="px-3 py-2 border-b border-slate-800">
                    <div className="text-[11px] font-semibold text-white">{activeUser.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{activeUser.email}</div>
                  </div>
                  <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                    Switch Campus Student
                  </div>
                  <div className="space-y-1 my-1 max-h-56 overflow-y-auto">
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

                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    <button
                      onClick={handleResetDb}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 flex items-center gap-1.5 transition text-[11px]"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset Demo Data
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-950/30 flex items-center gap-1.5 transition text-[11px] font-semibold cursor-pointer"
                    >
                      <LogOut className="w-3 h-3" /> Sign Out
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

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">SkillBridge Campus Network</span>
            <span>•</span>
            <span>Peer Tutoring &amp; Credit Ledger</span>
          </div>
          <div className="text-slate-500">
            Campus Peer Learning Platform
          </div>
        </div>
      </footer>
    </div>
  );
}
