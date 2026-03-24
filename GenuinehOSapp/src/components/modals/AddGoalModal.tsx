import React, { useState, useEffect } from 'react';
import { X, Target, Calendar, BarChart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirestore } from '@/src/hooks/useFirestore';
import type { Goal } from '@/src/types';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal?: Goal; // if provided, edit mode
}

export default function AddGoalModal({ isOpen, onClose, goal }: AddGoalModalProps) {
  const { add, update } = useFirestore<Goal>('goals');
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [progress, setProgress] = useState('0');
  const [status, setStatus] = useState<Goal['status']>('Active');
  const [loading, setLoading] = useState(false);

  const isEdit = !!goal;

  useEffect(() => {
    if (goal) {
      setTitle(goal.title || '');
      setTargetDate(goal.targetDate || '');
      setProgress(String(goal.progress ?? 0));
      setStatus(goal.status || 'Active');
    } else {
      setTitle(''); setTargetDate(''); setProgress('0'); setStatus('Active');
    }
  }, [goal]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setLoading(true);
    try {
      if (isEdit && goal?.id) {
        await update(goal.id, { title, targetDate, progress: Number(progress), status });
      } else {
        await add({ title, targetDate, progress: Number(progress), status: 'Active' });
      }
      onClose();
    } catch (error) {
      console.error('Error saving goal:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-[#111520] border border-[#1e2a40] rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-[#1e2a40] bg-[#0b0e14]">
            <h2 className="text-lg font-bold text-white font-['Syne']">{isEdit ? 'Edit Goal' : 'Set New Goal'}</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-[#161c2a] rounded-lg transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Goal Title</label>
                <div className="relative">
                  <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text" required value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="E.g., Complete 50 Hospital OT projects"
                    className="w-full bg-[#07090f] border border-[#1e2a40] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-[#00d4aa] transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Target Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
                      className="w-full bg-[#07090f] border border-[#1e2a40] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-[#00d4aa] transition font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Progress (%)</label>
                  <div className="relative">
                    <BarChart className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="number" min="0" max="100" value={progress} onChange={e => setProgress(e.target.value)}
                      className="w-full bg-[#07090f] border border-[#1e2a40] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-[#00d4aa] transition font-mono"
                    />
                  </div>
                </div>
              </div>

              {isEdit && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</label>
                  <select
                    value={status} onChange={e => setStatus(e.target.value as Goal['status'])}
                    className="w-full bg-[#07090f] border border-[#1e2a40] rounded-xl px-4 py-3 text-white outline-none focus:border-[#00d4aa] transition"
                  >
                    <option value="Active">Active</option>
                    <option value="Achieved">Achieved</option>
                    <option value="Abandoned">Abandoned</option>
                  </select>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-[#1e2a40] bg-[#0b0e14] flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-[#161c2a] transition">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="bg-[#00d4aa] text-[#07090f] px-6 py-2.5 rounded-xl font-bold hover:bg-[#00b894] transition shadow-[0_0_15px_rgba(0,212,170,0.3)] disabled:opacity-50">
                {loading ? 'Saving...' : isEdit ? 'Update Goal' : 'Set Goal'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
