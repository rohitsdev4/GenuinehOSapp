import { useState } from 'react';
import PageHeader from '@/src/components/ui/PageHeader';
import { Receipt, Plus, Search, Filter, ArrowDownRight, User } from 'lucide-react';
import { motion } from 'motion/react';
import { formatCurrency, formatDate } from '@/src/lib/utils';
import AddExpenseModal from '@/src/components/modals/AddExpenseModal';
import { useFirestore } from '@/src/hooks/useFirestore';
import type { Expense } from '@/src/types';

export default function Expenses() {
  const { data: expenses, loading } = useFirestore<Expense>('expenses');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredExpenses = expenses.filter(expense => 
    (expense.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (expense.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  );

  if (loading) return <div className="p-8 text-center text-gray-500">Loading expenses...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <PageHeader 
        title="Expenses" 
        subtitle="Manage your business and site costs"
        actions={
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#00d4aa] text-[#07090f] px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#00b894] transition cursor-pointer shadow-[0_0_15px_rgba(0,212,170,0.3)]"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        }
      />
      
      <div className="bg-[#111520] border border-[#1e2a40] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#1e2a40] flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#0b0e14]">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search expenses..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111520] border border-[#1e2a40] rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#00d4aa] transition"
            />
          </div>
          <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition bg-[#111520] border border-[#1e2a40] px-4 py-2 rounded-xl w-full sm:w-auto justify-center">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1e2a40] bg-[#0b0e14]">
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Paid To</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Site</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No expenses found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense, i) => (
                  <motion.tr 
                    key={expense.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-[#1e2a40] hover:bg-[#161c2a] transition group"
                  >
                    <td className="p-4 text-sm text-gray-400 font-mono">{formatDate(expense.date)}</td>
                    <td className="p-4 text-sm text-white font-medium">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-gray-500" />
                        {expense.partyName || 'Unknown'}
                      </div>
                      {expense.notes && <p className="text-[10px] text-gray-500 mt-0.5">{expense.notes}</p>}
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider bg-[#1e2a40] text-gray-300">
                        {expense.category}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-400">{expense.siteId || '-'}</td>
                    <td className="p-4 text-right font-mono font-bold text-rose-400 flex items-center justify-end gap-2">
                      <ArrowDownRight className="w-4 h-4 opacity-50" />
                      {formatCurrency(expense.amount)}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <AddExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}
