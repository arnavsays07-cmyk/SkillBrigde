import React, { useState, useEffect } from 'react';
import { CreditLedger, TransactionType } from '../types';
import { engine } from '../services/mockBackend';
import {
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  RotateCcw,
  Shield,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface CreditLedgerViewProps {
  onOpenCodeInspector?: (filename: string) => void;
}

export const CreditLedgerView: React.FC<CreditLedgerViewProps> = ({
  onOpenCodeInspector
}) => {
  const [activeUser, setActiveUser] = useState(engine.getActiveUser());
  const [ledgerEntries, setLedgerEntries] = useState<CreditLedger[]>([]);
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');

  const refreshData = () => {
    const user = engine.getActiveUser();
    setActiveUser(user);
    setLedgerEntries(engine.getLedgerForUser(user.id));
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = engine.subscribe(refreshData);
    return unsubscribe;
  }, []);

  const filteredEntries = ledgerEntries.filter(entry => {
    if (filterType === 'all') return true;
    return entry.transaction_type === filterType;
  });

  const totalEarned = ledgerEntries
    .filter(e => e.transaction_type === 'earned')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalSpent = ledgerEntries
    .filter(e => e.transaction_type === 'spent')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalBonus = ledgerEntries
    .filter(e => e.transaction_type === 'bonus')
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Wallet Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Balance */}
        <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-700/50 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
              Credit Balance
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-amber-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {activeUser.credit_balance}
            </span>
            <span className="text-xs font-semibold text-amber-400">Credits</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Positive constraint enforced by MySQL <code className="text-[10px] font-mono text-indigo-300">CHECK (credit_balance &gt;= 0)</code>
          </p>
        </div>

        {/* Total Earned (Tutoring) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Earned as Tutor
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">
              +{totalEarned}
            </span>
            <span className="text-xs text-slate-400">pts</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Earned by conducting peer sessions
          </p>
        </div>

        {/* Total Spent (Learning) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
              Spent as Learner
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-800/50 flex items-center justify-center text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400">
              -{totalSpent}
            </span>
            <span className="text-xs text-slate-400">pts</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Invested in learning from campus peers
          </p>
        </div>

        {/* Welcome Bonus */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
              Onboarding Grants
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-800/50 flex items-center justify-center text-purple-400">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-purple-400">
              +{totalBonus}
            </span>
            <span className="text-xs text-slate-400">pts</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Initial 20-point campus enrollment seed
          </p>
        </div>
      </div>

      {/* Double-Entry Architecture Explanation Callout */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              Why Double-Entry Accounting in SkillBridge?
            </h4>
            <p className="text-xs text-slate-400 mt-0.5 max-w-3xl leading-relaxed">
              Whenever a session completes, SkillBridge records two balanced audit rows simultaneously inside an ACID transaction:
              one debit entry for the learner (<code className="text-indigo-300 font-mono">transaction_type = 'spent'</code>) and one credit entry for the tutor (<code className="text-indigo-300 font-mono">transaction_type = 'earned'</code>).
              This guarantees zero-loss mathematical consistency across all campus accounts.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">
              Double-Entry Credit Ledger (credit_ledger)
            </h3>
            <p className="text-xs text-slate-400">
              Audit log for User #{activeUser.id} ({activeUser.name})
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(['all', 'earned', 'spent', 'bonus', 'refund'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition ${
                  filterType === type
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">TX ID</th>
                <th className="py-3 px-4">Date &amp; Time</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Session Ref</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Balance After</th>
                <th className="py-3 px-4">Audit Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No ledger transactions matching this filter.
                  </td>
                </tr>
              ) : (
                filteredEntries.map(entry => {
                  const typeBadges: Record<TransactionType, { bg: string; text: string; icon: any }> = {
                    earned: { bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50', text: '+', icon: ArrowDownLeft },
                    spent: { bg: 'bg-rose-950/60 text-rose-300 border-rose-800/50', text: '-', icon: ArrowUpRight },
                    bonus: { bg: 'bg-purple-950/60 text-purple-300 border-purple-800/50', text: '+', icon: Gift },
                    refund: { bg: 'bg-blue-950/60 text-blue-300 border-blue-800/50', text: '+', icon: RotateCcw }
                  };
                  const badge = typeBadges[entry.transaction_type];
                  const Icon = badge.icon;

                  return (
                    <tr key={entry.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono text-slate-400">
                        #{entry.id}
                      </td>
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                        {entry.created_at}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border text-[11px] font-semibold capitalize ${badge.bg}`}>
                          <Icon className="w-3 h-3" />
                          {entry.transaction_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {entry.session_id ? (
                          <span className="text-indigo-400">Session #{entry.session_id}</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold">
                        <span className={entry.transaction_type === 'spent' ? 'text-rose-400' : 'text-emerald-400'}>
                          {badge.text}{entry.amount} pts
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {entry.balance_after} pts
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-md truncate">
                        {entry.description}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
