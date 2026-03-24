import { useState } from 'react';
import PageHeader from '@/src/components/ui/PageHeader';
import { Users, Plus, Phone, IndianRupee, Trash2, Edit2, Clock, Briefcase } from 'lucide-react';
import { motion } from 'motion/react';
import { formatCurrency } from '@/src/lib/utils';
import AddWorkerModal from '@/src/components/modals/AddWorkerModal';
import ConfirmModal from '@/src/components/ui/ConfirmModal';
import { useFirestore } from '@/src/hooks/useFirestore';
import type { LabourWorker } from '@/src/types';

export default function Labour() {
  const { data: workers, loading, update, remove: removeWorker } = useFirestore<LabourWorker>('labour');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<LabourWorker | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteWorker = async () => {
    if (deletingId) {
      await removeWorker(deletingId);
      setDeletingId(null);
    }
  };

  const handleEditWorker = (worker: LabourWorker) => {
    setEditingWorker(worker);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWorker(undefined);
  };

  const handleMarkPresent = async (worker: LabourWorker) => {
    try {
      const increment = worker.paymentType === 'Monthly' 
        ? (worker.monthlyWage || 0) / 30 
        : worker.dailyWage;
        
      await update(worker.id!, {
        balance: (worker.balance || 0) + increment,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error marking present:', error);
    }
  };

  const handleAddMonthlySalary = async (worker: LabourWorker) => {
    if (worker.paymentType !== 'Monthly' || !worker.monthlyWage) return;
    try {
      await update(worker.id!, {
        balance: (worker.balance || 0) + worker.monthlyWage,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error adding monthly salary:', error);
    }
  };

  const handleAddWorkPayment = async (worker: LabourWorker) => {
    const amountStr = prompt(`Enter work payment amount for ${worker.name}:`);
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) return;
    
    try {
      await update(worker.id!, {
        balance: (worker.balance || 0) + amount,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error adding work payment:', error);
    }
  };

  const handlePayNow = async (worker: LabourWorker) => {
    try {
      await update(worker.id!, {
        balance: 0,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error paying worker:', error);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading workers...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <PageHeader 
        title="Labour Management" 
        subtitle="Track worker attendance and wages"
        actions={
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#00d4aa] text-[#07090f] px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#00b894] transition cursor-pointer shadow-[0_0_15px_rgba(0,212,170,0.3)]"
          >
            <Plus className="w-4 h-4" />
            Add Worker
          </button>
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workers.length === 0 ? (
          <div className="col-span-full bg-[#111520] border border-[#1e2a40] rounded-2xl p-10 text-center">
            <Users className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No workers added yet</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">Start managing your labour force by adding your first worker.</p>
          </div>
        ) : (
          workers.map((worker, i) => (
            <motion.div 
              key={worker.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#111520] border border-[#1e2a40] rounded-2xl overflow-hidden flex flex-col"
            >
              <div className="p-5 border-b border-[#1e2a40]">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-white">{worker.name}</h3>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter flex items-center gap-1 ${
                        worker.paymentType === 'Monthly' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {worker.paymentType === 'Monthly' ? <Clock className="w-2.5 h-2.5" /> : <Briefcase className="w-2.5 h-2.5" />}
                        {worker.paymentType || 'Contract'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">Worker</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEditWorker(worker)}
                      className="p-1 text-gray-500 hover:text-[#00d4aa] transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => worker.id && setDeletingId(worker.id)}
                      className="p-1 text-gray-500 hover:text-rose-500 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      worker.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'
                    }`}>
                      {worker.status}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Phone className="w-4 h-4 text-gray-500" />
                    {worker.phone || 'No Phone'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <IndianRupee className="w-4 h-4 text-gray-500" />
                    {worker.paymentType === 'Monthly' 
                      ? `${formatCurrency(worker.monthlyWage || 0)} / month` 
                      : `${formatCurrency(worker.dailyWage)} / day`}
                  </div>
                </div>
              </div>
              
              <div className="p-5 bg-[#0b0e14] flex-1 flex flex-col justify-between">
                <div className="mb-4">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Pending Balance</p>
                  <p className={`text-2xl font-black ${worker.balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {formatCurrency(worker.balance)}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleMarkPresent(worker)}
                      className="flex-1 bg-[#1e2a40] text-white py-2 rounded-xl font-bold text-xs hover:bg-[#2a3a5a] transition flex items-center justify-center gap-1"
                    >
                      {worker.paymentType === 'Monthly' ? 'Mark Day' : 'Mark Present'}
                    </button>
                    
                    {worker.paymentType === 'Monthly' ? (
                      <button 
                        onClick={() => handleAddMonthlySalary(worker)}
                        className="flex-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 py-2 rounded-xl font-bold text-xs hover:bg-blue-500/20 transition"
                      >
                        Add Month
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleAddWorkPayment(worker)}
                        className="flex-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 py-2 rounded-xl font-bold text-xs hover:bg-amber-500/20 transition"
                      >
                        Add Work
                      </button>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => handlePayNow(worker)}
                    disabled={worker.balance <= 0}
                    className={`w-full py-2 rounded-xl font-bold text-sm transition ${
                      worker.balance > 0 
                        ? 'bg-[#00d4aa] text-[#07090f] hover:bg-[#00b894] shadow-[0_0_10px_rgba(0,212,170,0.2)]' 
                        : 'bg-[#1e2a40] text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Set Balance to 0 (Paid)
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {isModalOpen && (
        <AddWorkerModal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          worker={editingWorker}
        />
      )}

      <ConfirmModal 
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteWorker}
        title="Delete Worker"
        message="Are you sure you want to delete this worker? This action cannot be undone."
      />
    </div>
  );
}
