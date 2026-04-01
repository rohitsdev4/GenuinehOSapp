import React, { useState } from 'react';
import { X, MapPin, Building2, Calendar, FileText, BarChart, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirestore } from '@/src/hooks/useFirestore';
import type { Site, Client } from '@/src/types';

interface AddSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddSiteModal({ isOpen, onClose }: AddSiteModalProps) {
  const { add } = useFirestore<Site>('sites');
  const { data: clients } = useFirestore<Client>('clients');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [clientId, setClientId] = useState('');
  const [estimatedEndDate, setEstimatedEndDate] = useState('');
  const [labourPaymentsPending, setLabourPaymentsPending] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location) return;

    setLoading(true);
    try {
      await add({
        name,
        location,
        clientId,
        estimatedEndDate,
        labourPaymentsPending: parseFloat(labourPaymentsPending) || 0,
        monthlyPayment: parseFloat(monthlyPayment) || 0,
        progress: 0,
        status: 'Active',
        notes,
      });
      onClose();
    } catch (error) {
      console.error('Error adding site:', error);
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
            <h2 className="text-lg font-bold text-white font-['Syne']">Add New Site</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-[#161c2a] rounded-lg transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Site Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g., Patna Medical College OT"
                    className="w-full bg-[#07090f] border border-[#1e2a40] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-[#00d4aa] transition"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="text" 
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="E.g., Ashok Rajpath, Patna"
                    className="w-full bg-[#07090f] border border-[#1e2a40] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-[#00d4aa] transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Client</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <select 
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full bg-[#07090f] border border-[#1e2a40] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-[#00d4aa] transition appearance-none"
                    >
                      <option value="">Select a client</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Est. End Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type="date" 
                      value={estimatedEndDate}
                      onChange={(e) => setEstimatedEndDate(e.target.value)}
                      className="w-full bg-[#07090f] border border-[#1e2a40] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-[#00d4aa] transition font-mono" 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Labour Payments Pending</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={labourPaymentsPending}
                      onChange={(e) => setLabourPaymentsPending(e.target.value)}
                      placeholder="0"
                      className="w-full bg-[#07090f] border border-[#1e2a40] rounded-xl px-4 py-3 text-white outline-none focus:border-[#00d4aa] transition" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Monthly Payment</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={monthlyPayment}
                      onChange={(e) => setMonthlyPayment(e.target.value)}
                      placeholder="0"
                      className="w-full bg-[#07090f] border border-[#1e2a40] rounded-xl px-4 py-3 text-white outline-none focus:border-[#00d4aa] transition" 
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
                    placeholder="Site specifics..."
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
                {loading ? 'Saving...' : 'Save Site'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
