import { useState } from 'react';
import PageHeader from '@/src/components/ui/PageHeader';
import { CreditCard, Plus, ArrowDownRight, Calendar, User, Trash2, Edit2, Search } from 'lucide-react';
import AddPaymentModal from '@/src/components/modals/AddPaymentModal';
import ConfirmModal from '@/src/components/ui/ConfirmModal';
import { useFirestore } from '@/src/hooks/useFirestore';
import type { Payment } from '@/src/types';
import { formatDate } from '@/src/lib/utils';
import { motion } from 'motion/react';

export default function Payments() {
  const { data: payments, loading, remove: removePayment } = useFirestore<Payment>('payments');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const parseDateValue = (value?: string) => {
    if (!value) return 0;
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : 0;
  };

  const handleDeletePayment = async () => {
    if (deletingId) {
      await removePayment(deletingId);
      setDeletingId(null);
    }
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPayment(undefined);
  };

  const term = searchTerm.trim().toLowerCase();
  const filteredPayments = payments
    .filter((payment) => {
      if (!term) return true;
      return [
        payment.partyName,
        payment.siteId,
        payment.category,
        payment.partner,
        payment.notes,
        payment.date,
        String(payment.amount),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    })
    .sort((a, b) => parseDateValue(b.date) - parseDateValue(a.date));

  if (loading) return <div className="p-8 text-center text-gray-500">Loading payments...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <PageHeader 
        title="Payments" 
        subtitle="Track your income and site payments"
        actions={
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#00d4aa] text-[#07090f] px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#00b894] transition cursor-pointer shadow-[0_0_15px_rgba(0,212,170,0.3)]"
          >
            <Plus className="w-4 h-4" />
            Add Payment
          </button>
        }
      />

      {payments.length === 0 ? (
        <div className="bg-[#111520] border border-[#1e2a40] rounded-2xl p-10 text-center">
          <CreditCard className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No payments recorded yet</h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">Start tracking your business income by adding your first payment record.</p>
        </div>
      ) : (
        <div className="bg-[#111520] border border-[#1e2a40] rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-[#1e2a40] bg-[#0b0e14]">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by party, site, category, amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#111520] border border-[#1e2a40] rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#00d4aa] transition"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0b0e14] text-gray-500 font-mono text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Client / Source</th>
                  <th className="p-4 font-medium">Site / Project</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium text-right">Amount</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2a40]">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No payments match your search.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment, i) => (
                  <motion.tr 
                    key={payment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-white/5 transition"
                  >
                    <td className="p-4 text-gray-300 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        {formatDate(payment.date)}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-white">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-gray-500" />
                        {payment.partyName}
                      </div>
                    </td>
                    <td className="p-4 text-gray-400">{payment.siteId || '-'}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded bg-[#1e2a40] text-xs text-gray-300">
                        {payment.category || 'Income'}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-[#00d4aa] flex items-center justify-end gap-1">
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      ₹{payment.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditPayment(payment)}
                          className="p-2 text-gray-500 hover:text-[#00d4aa] transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => payment.id && setDeletingId(payment.id)}
                          className="p-2 text-gray-500 hover:text-rose-500 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <AddPaymentModal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          payment={editingPayment}
        />
      )}

      <ConfirmModal 
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeletePayment}
        title="Delete Payment"
        message="Are you sure you want to delete this payment record? This action cannot be undone."
      />
    </div>
  );
}
