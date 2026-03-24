import { useState } from 'react';
import PageHeader from '@/src/components/ui/PageHeader';
import { Briefcase, Plus, MoreHorizontal, Trash2, Edit2 } from 'lucide-react';
import { motion } from 'motion/react';
import { formatCurrency } from '@/src/lib/utils';
import AddDealModal from '@/src/components/modals/AddDealModal';
import ConfirmModal from '@/src/components/ui/ConfirmModal';
import { useFirestore } from '@/src/hooks/useFirestore';
import type { Deal } from '@/src/types';

export default function Deals() {
  const { data: deals, loading, remove: removeDeal } = useFirestore<Deal>('deals');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteDeal = async () => {
    if (deletingId) {
      await removeDeal(deletingId);
      setDeletingId(null);
    }
  };

  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDeal(undefined);
  };

  const columns = [
    { id: 'lead', title: 'Lead', color: '#3b82f6' },
    { id: 'negotiation', title: 'Negotiation', color: '#f59e0b' },
    { id: 'won', title: 'Won', color: '#00d4aa' },
    { id: 'lost', title: 'Lost', color: '#ef4444' },
  ];

  if (loading) return <div className="p-8 text-center text-gray-500">Loading deals...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-120px)] flex flex-col pb-10">
      <PageHeader 
        title="Deals Pipeline" 
        subtitle="Track your sales opportunities"
        actions={
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#00d4aa] text-[#07090f] px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#00b894] transition cursor-pointer shadow-[0_0_15px_rgba(0,212,170,0.3)]"
          >
            <Plus className="w-4 h-4" />
            New Deal
          </button>
        }
      />
      
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 snap-x">
        {columns.map((col) => (
          <div key={col.id} className="flex-1 min-w-[280px] bg-[#111520] border border-[#1e2a40] rounded-2xl flex flex-col snap-center">
            <div className="p-4 border-b border-[#1e2a40] flex items-center justify-between sticky top-0 bg-[#111520] rounded-t-2xl z-10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
                <h3 className="font-bold text-white tracking-wide">{col.title}</h3>
                <span className="bg-[#1e2a40] text-gray-400 text-xs px-2 py-0.5 rounded-full font-mono">
                  {deals.filter(d => d.stage.toLowerCase() === col.id).length}
                </span>
              </div>
              <button className="text-gray-500 hover:text-white transition">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {deals.filter(d => d.stage.toLowerCase() === col.id).map((deal, i) => (
                <motion.div 
                  key={deal.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[#161c2a] border border-[#1e2a40] rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-gray-600 transition"
                >
                  <h4 className="font-bold text-gray-200 mb-1">{deal.title}</h4>
                  <p className="text-xs text-gray-500 font-mono mb-3">{deal.clientName}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-[#00d4aa]">{formatCurrency(deal.amount)}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); handleEditDeal(deal); }}
                        className="p-1 text-gray-500 hover:text-[#00d4aa] transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={e => { e.stopPropagation(); deal.id && setDeletingId(deal.id); }}
                        className="p-1 text-gray-500 hover:text-rose-500 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-6 h-6 rounded-full bg-[#1e2a40] flex items-center justify-center text-[10px] font-bold text-gray-400">
                        {deal.clientName.charAt(0)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {deals.filter(d => d.stage.toLowerCase() === col.id).length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No deals in this stage
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <AddDealModal isOpen={isModalOpen} onClose={handleCloseModal} deal={editingDeal} />
      )}

      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteDeal}
        title="Delete Deal"
        message="Are you sure you want to delete this deal? This action cannot be undone."
      />
    </div>
  );
}
