import { X, MapPin, Calendar, Percent, Users, AlertTriangle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Site } from '@/src/types';
import { formatDate } from '@/src/lib/utils';
import { useState } from 'react';

interface SiteDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  site: Site;
  onDelete: (id: string) => Promise<void>;
}

export default function SiteDetailsModal({ isOpen, onClose, site, onDelete }: SiteDetailsModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (!site.id || !window.confirm('Are you sure you want to delete this site? This action cannot be undone.')) return;
    setIsDeleting(true);
    try {
      await onDelete(site.id);
      onClose();
    } catch (error) {
      console.error('Error deleting site:', error);
    } finally {
      setIsDeleting(false);
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
          className="relative w-full max-w-2xl bg-[#111520] border border-[#1e2a40] rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-[#1e2a40] bg-[#0b0e14]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1e2a40] flex items-center justify-center text-[#00d4aa]">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white font-['Syne']">{site.name}</h2>
                <p className="text-xs text-gray-400 font-mono">{site.location}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-[#161c2a] rounded-lg transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#0b0e14] p-4 rounded-xl border border-[#1e2a40]">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Status</p>
                <p className="text-sm font-bold text-white">{site.status}</p>
              </div>
              <div className="bg-[#0b0e14] p-4 rounded-xl border border-[#1e2a40]">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Start Date</p>
                <p className="text-sm font-bold text-white">{formatDate(site.startDate)}</p>
              </div>
              <div className="bg-[#0b0e14] p-4 rounded-xl border border-[#1e2a40]">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Est. End Date</p>
                <p className="text-sm font-bold text-white">{formatDate(site.estimatedEndDate)}</p>
              </div>
              <div className="bg-[#0b0e14] p-4 rounded-xl border border-[#1e2a40]">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Budget</p>
                <p className="text-sm font-bold text-[#00d4aa]">₹{(site.budget / 100000).toFixed(1)}L</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-bold">Overall Progress</span>
                <span className="text-[#00d4aa] font-bold">{site.progress}%</span>
              </div>
              <div className="h-3 bg-[#1e2a40] rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${site.progress}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="h-full bg-[#00d4aa] rounded-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  Labour & Team
                </h3>
                <div className="bg-[#0b0e14] border border-[#1e2a40] rounded-xl p-4">
                  <p className="text-sm text-gray-400">No active workers assigned to this site yet.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-gray-400" />
                  Recent Updates
                </h3>
                <div className="bg-[#0b0e14] border border-[#1e2a40] rounded-xl p-4">
                  <p className="text-sm text-gray-400">No recent updates recorded.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-[#1e2a40] bg-[#0b0e14] flex justify-between items-center">
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-rose-500 hover:bg-rose-500/10 transition disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Deleting...' : 'Delete Site'}
            </button>
            <button 
              onClick={onClose}
              className="px-6 py-2 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-[#161c2a] transition"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
