import { useState } from 'react';
import PageHeader from '@/src/components/ui/PageHeader';
import { Plus, Search, ArrowDownRight, User, Trash2, Edit2 } from 'lucide-react';
import { motion } from 'motion/react';
import { formatCurrency, formatDate } from '@/src/lib/utils';
import AddExpenseModal from '@/src/components/modals/AddExpenseModal';
import ConfirmModal from '@/src/components/ui/ConfirmModal';
import { useFirestore } from '@/src/hooks/useFirestore';
import type { Expense } from '@/src/types';

export default function Expenses() {
  const { data: expenses, loading, remove: removeExpense } = useFirestore<Expense>('expenses');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteExpense = async () => {
    if (deletingId) {
      await removeExpense(deletingId);
      setDeletingId(null);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExpense(undefined);
  };

  const parseDateValue = (value?: string) => {
    if (!value) return 0;
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : 0;
  };

  const term = searchTerm.trim().toLowerCase();
  const filteredExpenses = expenses
    .filter((expense) => {
      if (!term) return true;
      return [
        expense.notes,
        expense.category,
        expense.partyName,
        expense.siteId,
        expense.partner,
        expense.date,
        String(expense.amount),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    })
    .sort((a, b) => parseDateValue(b.date) - parseDateValue(a.date));

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
          <div className="text-[11px] text-gray-500 font-mono">Newest first</div>
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
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
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
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditExpense(expense)}
                          className="p-2 text-gray-500 hover:text-[#00d4aa] transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => expense.id && setDeletingId(expense.id)}
                          className="p-2 text-gray-500 hover:text-rose-500 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <AddExpenseModal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          expense={editingExpense}
        />
      )}

      <ConfirmModal 
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteExpense}
        title="Delete Expense"
        message="Are you sure you want to delete this expense record? This action cannot be undone."
      />
    </div>
  );
}
