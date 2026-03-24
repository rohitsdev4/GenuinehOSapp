import { X, Calendar, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, formatDate } from '@/src/lib/utils';
import type { LabourWorker } from '@/src/types';

interface PaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: LabourWorker;
}

export default function PaymentHistoryModal({ isOpen, onClose, worker }: PaymentHistoryModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#111520] border border-[#1e2a40] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
        >
          <div className="flex justify-between items-center p-5 border-b border-[#1e2a40]">
            <div>
              <h2 className="text-lg font-bold text-white">Payment History</h2>
              <p className="text-sm text-gray-400">{worker.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 max-h-[60vh] overflow-y-auto">
            {(!worker.localPayments || worker.localPayments.length === 0) ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No payment history found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {worker.localPayments.slice().reverse().map((payment, index) => (
                  <div key={index} className="flex justify-between items-center bg-[#0b0e14] p-4 rounded-xl border border-[#1e2a40]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <IndianRupee className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-white font-bold">{formatCurrency(payment.amount)}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {formatDate(payment.date)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
