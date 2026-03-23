import React from 'react';
import { X, Building2, Calendar, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Deal } from '@/src/types';
import { formatDate, formatCurrency } from '@/src/lib/utils';

interface DealDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal;
}

export default function DealDetailsModal({ isOpen, onClose, deal }: DealDetailsModalProps) {
  if (!isOpen) return null;

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
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white font-['Syne']">{deal.title}</h2>
                <p className="text-xs text-gray-400 font-mono">{deal.clientName}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-[#161c2a] rounded-lg transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-[#0b0e14] p-4 rounded-xl border border-[#1e2a40]">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Stage</p>
                <p className="text-sm font-bold text-white">{deal.stage}</p>
              </div>
              <div className="bg-[#0b0e14] p-4 rounded-xl border border-[#1e2a40]">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Amount</p>
                <p className="text-sm font-bold text-[#00d4aa]">{formatCurrency(deal.amount)}</p>
              </div>
              <div className="bg-[#0b0e14] p-4 rounded-xl border border-[#1e2a40]">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Created At</p>
                <p className="text-sm font-bold text-white">{deal.createdAt ? formatDate(deal.createdAt) : 'N/A'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-400" />
                Deal Notes
              </h3>
              <div className="bg-[#0b0e14] border border-[#1e2a40] rounded-xl p-4">
                <p className="text-sm text-gray-400 whitespace-pre-wrap">
                  {deal.notes || 'No notes added for this deal yet.'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                Activity History
              </h3>
              <div className="bg-[#0b0e14] border border-[#1e2a40] rounded-xl p-4">
                <p className="text-sm text-gray-400">No recent activity recorded.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
