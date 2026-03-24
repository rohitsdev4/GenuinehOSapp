import { useState } from 'react';
import PageHeader from '@/src/components/ui/PageHeader';
import { UserCircle, Plus, Phone, Mail, MapPin, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import AddClientModal from '@/src/components/modals/AddClientModal';
import { useFirestore } from '@/src/hooks/useFirestore';
import type { Client } from '@/src/types';

export default function Clients() {
  const { data: clients, loading, remove: removeClient } = useFirestore<Client>('clients');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDeleteClient = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      await removeClient(id);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading clients...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <PageHeader 
        title="Clients" 
        subtitle="Manage your client relationships"
        actions={
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#00d4aa] text-[#07090f] px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#00b894] transition cursor-pointer shadow-[0_0_15px_rgba(0,212,170,0.3)]"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.length === 0 ? (
          <div className="col-span-full bg-[#111520] border border-[#1e2a40] rounded-2xl p-10 text-center">
            <UserCircle className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No clients added yet</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">Start building your client directory by adding your first client.</p>
          </div>
        ) : (
          clients.map((client, i) => (
            <motion.div 
              key={client.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#111520] border border-[#1e2a40] rounded-2xl p-5 hover:border-[#00d4aa]/50 transition group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#1e2a40] flex items-center justify-center text-gray-400 group-hover:bg-[#00d4aa]/10 group-hover:text-[#00d4aa] transition">
                    <UserCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{client.name}</h3>
                    <p className="text-sm text-gray-400">{client.company}</p>
                  </div>
                </div>
                <button 
                  onClick={() => client.id && handleDeleteClient(client.id)}
                  className="p-2 text-gray-500 hover:text-rose-500 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-[#1e2a40]">
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <Phone className="w-4 h-4 text-gray-500" />
                  {client.phone || '-'}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <Mail className="w-4 h-4 text-gray-500" />
                  {client.email || '-'}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  {client.address || '-'}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {isModalOpen && (
        <AddClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}
