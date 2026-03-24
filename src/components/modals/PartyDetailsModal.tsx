import { X, Network, HandCoins, ArrowUpRight, ArrowDownLeft, Calendar, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, formatDate } from '@/src/lib/utils';
import type { Party, Expense, Payment } from '@/src/types';

interface PartyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  party: Party & { given: number; received: number; net: number };
  expenses: Expense[];
  payments: Payment[];
}

export default function PartyDetailsModal({ isOpen, onClose, party, expenses, payments }: PartyDetailsModalProps) {
  if (!isOpen) return null;

  const partyExpenses = expenses.filter(e => e.partyName?.toLowerCase() === party.name.toLowerCase());
  const partyPayments = payments.filter(p => p.partyName?.toLowerCase() === party.name.toLowerCase());

  const allTransactions = [
    ...partyExpenses.map(e => ({ ...e, type: 'expense', date: e.date, amount: Number(e.amount || 0), description: e.description || e.category || 'Expense' })),
    ...partyPayments.map(p => ({ ...p, type: 'payment', date: p.date, amount: Number(p.amount || 0), description: p.siteName || 'Payment' }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalVolume = party.given + party.received;
  const progressPercent = totalVolume > 0 ? (party.received / totalVolume) * 100 : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl h-[85vh] flex flex-col bg-[#111520] border border-[#1e2a40] rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#1e2a40] bg-[#0b0e14] shrink-0">
            <div className="flex items-center gap-4">
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-[#161c2a] rounded-lg transition mr-2 flex items-center gap-2">
                <X className="w-5 h-5" />
                <span className="font-bold hidden sm:inline">Back</span>
              </button>
              <div className="w-12 h-12 rounded-full bg-[#1e2a40] flex items-center justify-center text-emerald-400">
                <Network className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white font-['Syne']">{party.name}</h2>
                <p className="text-sm text-gray-400 font-mono mt-1">{party.type || 'Vendor/Client'} Ledger</p>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0b0e14] p-5 rounded-2xl border border-[#1e2a40] flex flex-col justify-center">
                <div className="flex items-center gap-2 text-rose-400 mb-2">
                  <ArrowUpRight className="w-4 h-4" />
                  <p className="text-xs font-bold uppercase tracking-wider">Total Given</p>
                </div>
                <p className="text-2xl font-black text-white">{formatCurrency(party.given)}</p>
              </div>

              <div className="bg-[#0b0e14] p-5 rounded-2xl border border-[#1e2a40] flex flex-col justify-center">
                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                  <ArrowDownLeft className="w-4 h-4" />
                  <p className="text-xs font-bold uppercase tracking-wider">Total Received</p>
                </div>
                <p className="text-2xl font-black text-white">{formatCurrency(party.received)}</p>
              </div>

              <div className={`p-5 rounded-2xl border flex flex-col justify-center ${party.net > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : party.net < 0 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-[#0b0e14] border-[#1e2a40]'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <HandCoins className={`w-4 h-4 ${party.net > 0 ? 'text-emerald-400' : party.net < 0 ? 'text-rose-400' : 'text-gray-400'}`} />
                  <p className={`text-xs font-bold uppercase tracking-wider ${party.net > 0 ? 'text-emerald-400' : party.net < 0 ? 'text-rose-400' : 'text-gray-400'}`}>
                    Net Balance
                  </p>
                </div>
                <div className="flex items-end gap-2">
                  <p className={`text-3xl font-black ${party.net > 0 ? 'text-emerald-400' : party.net < 0 ? 'text-rose-400' : 'text-white'}`}>
                    {formatCurrency(Math.abs(party.net))}
                  </p>
                  <span className={`text-sm font-medium mb-1 uppercase ${party.net > 0 ? 'text-emerald-500' : party.net < 0 ? 'text-rose-500' : 'text-gray-500'}`}>
                    {party.net > 0 ? 'We Receive' : party.net < 0 ? 'We Owe' : 'Settled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar (Visual indicator of Received vs Total Volume) */}
            <div className="bg-[#0b0e14] p-6 rounded-2xl border border-[#1e2a40] space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-bold uppercase tracking-wider text-xs">Settlement Progress (Received vs Total Volume)</span>
                <span className="text-white font-bold">{progressPercent.toFixed(1)}%</span>
              </div>
              <div className="h-4 bg-rose-500/20 rounded-full overflow-hidden flex relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="h-full bg-emerald-500 relative z-10"
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 font-mono mt-1">
                <span>0</span>
                <span>{formatCurrency(totalVolume)}</span>
              </div>
            </div>

            {/* Transactions History */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-gray-400" />
                Transaction History ({allTransactions.length} entries)
              </h3>

              {allTransactions.length === 0 ? (
                <div className="bg-[#0b0e14] border border-[#1e2a40] rounded-2xl p-10 text-center">
                  <p className="text-gray-500">No transactions recorded for this party yet.</p>
                </div>
              ) : (
                <div className="bg-[#0b0e14] border border-[#1e2a40] rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#1e2a40] bg-[#161c2a]">
                          <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                          <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                          <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Description</th>
                          <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e2a40]">
                        {allTransactions.map((tx, i) => (
                          <motion.tr
                            key={tx.id || i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="hover:bg-[#161c2a] transition"
                          >
                            <td className="p-4 whitespace-nowrap">
                              <div className="flex items-center gap-2 text-gray-300 text-sm">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                {formatDate(tx.date)}
                              </div>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              {tx.type === 'expense' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400">
                                  <ArrowUpRight className="w-3 h-3" /> Given
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                                  <ArrowDownLeft className="w-3 h-3" /> Received
                                </span>
                              )}
                            </td>
                            <td className="p-4">
                              <p className="text-sm text-white">{tx.description}</p>
                            </td>
                            <td className="p-4 text-right whitespace-nowrap">
                              <p className={`text-sm font-bold ${tx.type === 'expense' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                              </p>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Padding for scroll */}
            <div className="h-6"></div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
