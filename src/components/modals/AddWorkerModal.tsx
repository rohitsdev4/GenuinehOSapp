import React, { useState } from 'react';
import { X, User, IndianRupee, Phone, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirestore } from '@/src/hooks/useFirestore';
import type { LabourWorker } from '@/src/types';

interface AddWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker?: LabourWorker;
}

export default function AddWorkerModal({ isOpen, onClose, worker }: AddWorkerModalProps) {
  const { add, update } = useFirestore<LabourWorker>('labour');
  const [name, setName] = useState(worker?.name || '');
  const [paymentType, setPaymentType] = useState<'Monthly' | 'Contract'>(worker?.paymentType || 'Contract');
  const [dailyWage, setDailyWage] = useState(worker?.dailyWage?.toString() || '');
  const [monthlyWage, setMonthlyWage] = useState(worker?.monthlyWage?.toString() || '');
  const [phone, setPhone] = useState(worker?.phone || '');
  const [notes, setNotes] = useState(worker?.notes || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    if (paymentType === 'Monthly' && !monthlyWage) return;
    if (paymentType === 'Contract' && !dailyWage) return;

    setLoading(true);
    try {
      const workerData = {
        name,
        paymentType,
        dailyWage: paymentType === 'Contract' ? Number(dailyWage) : Number(monthlyWage || 0) / 30,
        monthlyWage: paymentType === 'Monthly' ? Number(monthlyWage) : undefined,
        phone,
        notes,
        status: worker?.status || 'Active',
        balance: worker?.balance || 0,
      };

      if (worker?.id) {
        await update(worker.id, workerData as any);
      } else {
        await add(workerData as any);
      }
      onClose();
    } catch (error) {
      console.error('Error saving worker:', error);
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
              {worker ? 'Edit Worker' : 'Add New Worker'}
            </h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-[#161c2a] rounded-lg transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Worker Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g., Ramesh Kumar"
                    className="w-full bg-[#07090f] border border-[#1e2a40] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-[#00d4aa] transition"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Payment Type</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-[#07090f] border border-[#1e2a40] rounded-xl">
                  {['Monthly', 'Contract'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPaymentType(type as 'Monthly' | 'Contract')}
                      className={`py-2 rounded-lg text-sm font-bold transition ${
                        paymentType === type ? 'bg-[#1e2a40] text-white' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {type} Basis
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {paymentType === 'Monthly' ? 'Monthly Wage (₹)' : 'Daily Wage (₹)'}
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00d4aa]" />
                    <input 
                      type="number" 
                      required
                      value={paymentType === 'Monthly' ? monthlyWage : dailyWage}
                      onChange={(e) => paymentType === 'Monthly' ? setMonthlyWage(e.target.value) : setDailyWage(e.target.value)}
                      placeholder={paymentType === 'Monthly' ? "30000" : "800"}
                      className="w-full bg-[#07090f] border border-[#1e2a40] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-[#00d4aa] transition font-mono" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter phone number"
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
                    placeholder="Special skills or notes..."
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
                {loading ? 'Saving...' : 'Save Worker'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
