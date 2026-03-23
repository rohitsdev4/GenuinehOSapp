import React, { useState } from 'react';
import { X, IndianRupee, User, Calendar, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirestore } from '@/src/hooks/useFirestore';
import type { Receivable } from '@/src/types';

interface AddReceivableModalProps {
  isOpen: boolean;
  onClose: () => void;
  receivable?: Receivable;
}

export default function AddReceivableModal({ isOpen, onClose, receivable }: AddReceivableModalProps) {
  const { add, update } = useFirestore<Receivable>('receivables');
  const [partyName, setPartyName] = useState(receivable?.partyName || '');
  const [amount, setAmount] = useState(receivable?.amount.toString() || '');
  const [dueDate, setDueDate] = useState(receivable?.dueDate || '');
  const [notes, setNotes] = useState(receivable?.notes || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName || !amount || !dueDate) return;

    setLoading(true);
    try {
      const receivableData = {
        partyName,
        amount: Number(amount),
        dueDate,
        amountCollected: receivable?.amountCollected || 0,
        status: receivable?.status || 'Pending',
        notes,
      };

      if (receivable?.id) {
        await update(receivable.id, receivableData);
      } else {
        await add(receivableData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving receivable:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
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
          className="relative w-full max-w-lg bg-[#111520] border border-[#1e2a40] rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-[#1e2a40] bg-[#0b0e14]">
            <h2 className="text-lg font-bold text-white font-['Syne']">
              {receivable ? 'Edit Receivable' : 'New Receivable'}
            </h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-[#161c2a] rounded-lg transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Party Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="text" 
                    required
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                    placeholder="E.g., Max Hospital"
                    className="w-full bg-[#07090f] border border-[#1e2a40] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-[#00d4aa] transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Amount Due (₹)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00d4aa]" />
                    <input 
                      type="number" 
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="100000"
                      className="w-full bg-[#07090f] border border-[#1e2a40] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-[#00d4aa] transition font-mono" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Due Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type="date" 
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-[#07090f] border border-[#1e2a40] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-[#00d4aa] transition font-mono" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Notes</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Collection details..."
                    rows={3}
                    className="w-full bg-[#07090f] border border-[#1e2a40] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-[#00d4aa] transition resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-[#1e2a40] bg-[#0b0e14] flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-[#161c2a] transition">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="bg-[#00d4aa] text-[#07090f] px-6 py-2.5 rounded-xl font-bold hover:bg-[#00b894] transition shadow-[0_0_15px_rgba(0,212,170,0.3)] disabled:opacity-50">
                {loading ? 'Saving...' : 'Save Receivable'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
