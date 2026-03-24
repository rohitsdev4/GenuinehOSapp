import { useState } from 'react';
import PageHeader from '@/src/components/ui/PageHeader';
import { HandCoins, Plus, AlertTriangle, Phone, Trash2, Edit2 } from 'lucide-react';
import { motion } from 'motion/react';
import { formatCurrency } from '@/src/lib/utils';
import AddReceivableModal from '@/src/components/modals/AddReceivableModal';
import ConfirmModal from '@/src/components/ui/ConfirmModal';
import { useFirestore } from '@/src/hooks/useFirestore';
import type { Receivable } from '@/src/types';

export default function Receivables() {
  const { data: receivables, loading, remove: removeReceivable } = useFirestore<Receivable>('receivables');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReceivable, setEditingReceivable] = useState<Receivable | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteReceivable = async () => {
    if (deletingId) {
      await removeReceivable(deletingId);
      setDeletingId(null);
    }
  };

  const handleEditReceivable = (receivable: Receivable) => {
    setEditingReceivable(receivable);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingReceivable(undefined);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading receivables...</div>;

  const calculateDaysOverdue = (dueDate: string) => {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) return 0;
    
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - due.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return today > due ? diffDays : 0;
  };

  const getSeverity = (daysOverdue: number) => {
    if (daysOverdue > 60) return 'Critical';
    if (daysOverdue > 30) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <PageHeader 
        title="Receivables" 
        subtitle="Monitor pending collections and dues"
        actions={
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#00d4aa] text-[#07090f] px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#00b894] transition cursor-pointer shadow-[0_0_15px_rgba(0,212,170,0.3)]"
          >
            <Plus className="w-4 h-4" />
            Add Receivable
          </button>
        }
      />
      
      <div className="space-y-4">
        {receivables.length === 0 ? (
          <div className="bg-[#111520] border border-[#1e2a40] rounded-2xl p-10 text-center">
            <HandCoins className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No receivables recorded yet</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">Start tracking your pending collections by adding your first receivable record.</p>
          </div>
        ) : (
          receivables.sort((a, b) => calculateDaysOverdue(b.dueDate) - calculateDaysOverdue(a.dueDate)).map((rec, i) => {
            const daysOverdue = calculateDaysOverdue(rec.dueDate);
            const severity = getSeverity(daysOverdue);

            return (
              <motion.div 
                key={rec.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`bg-[#111520] border ${severity === 'Critical' ? 'border-rose-500/50' : 'border-[#1e2a40]'} rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    severity === 'Critical' ? 'bg-rose-500/10 text-rose-500' : 
                    severity === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 
                    'bg-[#1e2a40] text-gray-400'
                  }`}>
                    {severity === 'Critical' ? <AlertTriangle className="w-6 h-6" /> : <HandCoins className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">{rec.partyName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        severity === 'Critical' ? 'bg-rose-500/10 text-rose-400' : 
                        severity === 'Medium' ? 'bg-amber-500/10 text-amber-400' : 
                        'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {severity}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">{daysOverdue} Days Overdue</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full border-t sm:border-t-0 border-[#1e2a40] pt-4 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Amount Due</p>
                    <p className="text-xl font-black text-[#00d4aa]">{formatCurrency(rec.amount - (rec.amountCollected || 0))}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEditReceivable(rec)}
                      className="w-10 h-10 rounded-full bg-[#1e2a40] flex items-center justify-center text-gray-500 hover:text-[#00d4aa] transition shrink-0"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => rec.id && setDeletingId(rec.id)}
                      className="w-10 h-10 rounded-full bg-[#1e2a40] flex items-center justify-center text-gray-500 hover:text-rose-500 transition shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-[#1e2a40] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2a3a5a] transition shrink-0">
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <AddReceivableModal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          receivable={editingReceivable}
        />
      )}

      <ConfirmModal 
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteReceivable}
        title="Delete Receivable"
        message="Are you sure you want to delete this receivable record? This action cannot be undone."
      />
    </div>
  );
}
