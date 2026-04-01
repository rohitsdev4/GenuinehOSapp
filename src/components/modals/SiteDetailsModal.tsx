import { X, MapPin, Calendar, Percent, Users, AlertTriangle, Trash2, User, IndianRupee, Edit2, Save, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Site, Client } from '@/src/types';
import { formatDate } from '@/src/lib/utils';
import { useState, useEffect } from 'react';
import { useFirestore } from '@/src/hooks/useFirestore';

interface SiteDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  site: Site;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, data: Partial<Site>) => Promise<void>;
}

export default function SiteDetailsModal({ isOpen, onClose, site, onDelete, onUpdate }: SiteDetailsModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Site>>(site);
  const { data: clients } = useFirestore<Client>('clients');
  const client = clients.find(c => c.id === site.clientId);

  useEffect(() => {
    setFormData(site);
  }, [site]);

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

  const handleUpdate = async () => {
    if (!site.id) return;
    try {
      await onUpdate(site.id, formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating site:', error);
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
                {isEditing ? (
                  <input 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="text-lg font-bold text-white bg-transparent border-b border-[#00d4aa] outline-none"
                  />
                ) : (
                  <h2 className="text-lg font-bold text-white font-['Syne']">{site.name}</h2>
                )}
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
                {isEditing ? (
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as any})} className="bg-transparent text-sm font-bold text-white outline-none">
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                ) : (
                  <p className="text-sm font-bold text-white">{site.status}</p>
                )}
              </div>
              <div className="bg-[#0b0e14] p-4 rounded-xl border border-[#1e2a40]">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Client</p>
                {isEditing ? (
                  <select 
                    value={formData.clientId}
                    onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                    className="bg-transparent text-sm font-bold text-white outline-none w-full"
                  >
                    <option value="">Select a client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                ) : (
                  <p className="text-sm font-bold text-white">{client?.name || 'N/A'}</p>
                )}
              </div>
              <div className="bg-[#0b0e14] p-4 rounded-xl border border-[#1e2a40]">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Est. End Date</p>
                <p className="text-sm font-bold text-white">{formatDate(site.estimatedEndDate)}</p>
              </div>
              <div className="bg-[#0b0e14] p-4 rounded-xl border border-[#1e2a40]">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Budget</p>
                <p className="text-sm font-bold text-[#00d4aa]">₹{(site.budget || 0 / 100000).toFixed(1)}L</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-gray-400" />
                Labor Payments
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                <div className="bg-[#0b0e14] p-4 rounded-xl border border-[#1e2a40]">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Pending Amount</p>
                  {isEditing ? (
                    <input 
                      type="number"
                      value={formData.labourPaymentsPending || 0}
                      onChange={(e) => setFormData({...formData, labourPaymentsPending: parseFloat(e.target.value)})}
                      className="bg-transparent text-sm font-bold text-rose-400 outline-none w-full"
                    />
                  ) : (
                    <p className="text-sm font-bold text-rose-400 flex items-center gap-1"><IndianRupee className="w-3 h-3" />{site.labourPaymentsPending || 0}</p>
                  )}
                </div>
                <div className="bg-[#0b0e14] p-4 rounded-xl border border-[#1e2a40]">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Monthly Payment</p>
                  {isEditing ? (
                    <input 
                      type="number"
                      value={formData.monthlyPayment || 0}
                      onChange={(e) => setFormData({...formData, monthlyPayment: parseFloat(e.target.value)})}
                      className="bg-transparent text-sm font-bold text-white outline-none w-full"
                    />
                  ) : (
                    <p className="text-sm font-bold text-white flex items-center gap-1"><IndianRupee className="w-3 h-3" />{site.monthlyPayment || 0}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-bold">Overall Progress</span>
                {isEditing ? (
                  <input 
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress || 0}
                    onChange={(e) => setFormData({...formData, progress: parseInt(e.target.value) || 0})}
                    className="bg-transparent text-[#00d4aa] font-bold outline-none border-b border-[#00d4aa] w-12 text-right"
                  />
                ) : (
                  <span className="text-[#00d4aa] font-bold">{site.progress}%</span>
                )}
              </div>
              {isEditing ? (
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={formData.progress || 0}
                  onChange={(e) => setFormData({...formData, progress: parseInt(e.target.value) || 0})}
                  className="w-full h-2 bg-[#1e2a40] rounded-full appearance-none cursor-pointer accent-[#00d4aa]"
                />
              ) : (
                <div className="h-3 bg-[#1e2a40] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${site.progress}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="h-full bg-[#00d4aa] rounded-full"
                  />
                </div>
              )}
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
            <div className="flex gap-2">
              <button 
                onClick={() => isEditing ? handleUpdate() : setIsEditing(true)}
                className="flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-[#00d4aa] hover:bg-[#00d4aa]/10 transition"
              >
                {isEditing ? <><Save className="w-4 h-4" /> Save</> : <><Edit2 className="w-4 h-4" /> Edit</>}
              </button>
              <button 
                onClick={onClose}
                className="px-6 py-2 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-[#161c2a] transition"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
