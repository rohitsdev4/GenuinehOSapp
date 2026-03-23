import { useState } from 'react';
import PageHeader from '@/src/components/ui/PageHeader';
import { Contact, Plus, Search, Phone, Mail, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import AddContactModal from '@/src/components/modals/AddContactModal';
import { useFirestore } from '@/src/hooks/useFirestore';
import type { Contact as ContactType } from '@/src/types';

export default function Contacts() {
  const { data: contacts, loading, remove: removeContact } = useFirestore<ContactType>('contacts');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleDeleteContact = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      await removeContact(id);
    }
  };

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (contact.category && contact.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return <div className="p-8 text-center text-gray-500">Loading contacts...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <PageHeader 
        title="Contacts" 
        subtitle="Your business and personal directory"
        actions={
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#00d4aa] text-[#07090f] px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#00b894] transition cursor-pointer shadow-[0_0_15px_rgba(0,212,170,0.3)]"
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </button>
        }
      />
      
      <div className="bg-[#111520] border border-[#1e2a40] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[#1e2a40] bg-[#0b0e14]">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search contacts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111520] border border-[#1e2a40] rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#00d4aa] transition"
            />
          </div>
        </div>

        <div className="divide-y divide-[#1e2a40]">
          {filteredContacts.length === 0 ? (
            <div className="p-10 text-center">
              <Contact className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">No contacts found</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                {searchQuery ? "No contacts match your search query." : "Start building your directory by adding your first contact."}
              </p>
            </div>
          ) : (
            filteredContacts.map((contact, i) => (
              <motion.div 
                key={contact.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 hover:bg-[#161c2a] transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#1e2a40] flex items-center justify-center text-gray-400 group-hover:bg-[#00d4aa]/10 group-hover:text-[#00d4aa] transition shrink-0">
                    <span className="font-bold text-lg">{contact.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{contact.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-[#1e2a40] text-gray-300">
                        {contact.category || 'General'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-4 ml-16 sm:ml-0">
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#00d4aa] transition bg-[#0b0e14] sm:bg-transparent px-3 py-1.5 sm:p-0 rounded-lg border border-[#1e2a40] sm:border-none">
                      <Phone className="w-4 h-4" />
                      <span className="sm:hidden">{contact.phone}</span>
                    </a>
                  )}
                  <button 
                    onClick={() => contact.id && handleDeleteContact(contact.id)}
                    className="p-2 text-gray-500 hover:text-rose-500 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <AddContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}
