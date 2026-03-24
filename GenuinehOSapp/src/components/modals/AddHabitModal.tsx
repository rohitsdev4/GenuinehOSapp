import React, { useState } from 'react';
import { X, Activity, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirestore } from '@/src/hooks/useFirestore';
import type { Habit } from '@/src/types';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit?: Habit | null;
}

export default function AddHabitModal({ isOpen, onClose, habit }: AddHabitModalProps) {
  const { add, update } = useFirestore<Habit>('habits');
  const [title, setTitle] = useState(habit?.title || '');
  const [frequency, setFrequency] = useState(habit?.frequency || 'Daily');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setLoading(true);
    try {
      if (habit?.id) {
        await update(habit.id, {
          title,
          frequency,
        });
      } else {
        await add({
          title,
          frequency,
          streak: 0,
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving habit:', error);
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
            <h2 className="text-lg font-bold text-white font-['Syne']">{habit ? 'Edit Habit' : 'Build New Habit'}</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-[#161c2a] rounded-lg transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Habit Title</label>
                <div className="relative">
                  <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="text" 
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g., Morning Meditation"
                    className="w-full bg-[#07090f] border border-[#1e2a40] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-[#00d4aa] transition"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Frequency</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <select 
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full bg-[#07090f] border border-[#1e2a40] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-[#00d4aa] transition appearance-none"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Bi-weekly">Bi-weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-[#1e2a40] bg-[#0b0e14] flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-[#161c2a] transition">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="bg-[#00d4aa] text-[#07090f] px-6 py-2.5 rounded-xl font-bold hover:bg-[#00b894] transition shadow-[0_0_15px_rgba(0,212,170,0.3)] disabled:opacity-50">
                {loading ? 'Saving...' : 'Start Habit'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
