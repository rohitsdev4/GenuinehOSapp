import { useState } from 'react';
import PageHeader from '@/src/components/ui/PageHeader';
import { BookText, Plus, Calendar, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { formatDate } from '@/src/lib/utils';
import AddDiaryEntryModal from '@/src/components/modals/AddDiaryEntryModal';
import { useFirestore } from '@/src/hooks/useFirestore';
import type { DiaryEntry } from '@/src/types';

export default function Diary() {
  const { data: entries, loading, remove: removeEntry } = useFirestore<DiaryEntry>('diary');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDeleteEntry = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this diary entry?')) {
      await removeEntry(id);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading diary entries...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <PageHeader 
        title="Business Diary" 
        subtitle="Record your daily reflections and notes"
        actions={
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#00d4aa] text-[#07090f] px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#00b894] transition cursor-pointer shadow-[0_0_15px_rgba(0,212,170,0.3)]"
          >
            <Plus className="w-4 h-4" />
            New Entry
          </button>
        }
      />
      
      <div className="space-y-6">
        {entries.length === 0 ? (
          <div className="bg-[#111520] border border-[#1e2a40] rounded-2xl p-10 text-center">
            <BookText className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No diary entries yet</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">Start recording your daily reflections, meeting notes, and important business events.</p>
          </div>
        ) : (
          [...entries].sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (isNaN(dateA)) return 1;
            if (isNaN(dateB)) return -1;
            return dateB - dateA;
          }).map((entry, i) => (
            <motion.div 
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#111520] border border-[#1e2a40] rounded-2xl p-6 hover:border-[#00d4aa]/30 transition"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1e2a40] flex items-center justify-center text-gray-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{formatDate(entry.date)}</h3>
                    {entry.mood && <p className="text-xs text-[#00d4aa] font-mono">Mood: {entry.mood}</p>}
                  </div>
                </div>
                <button 
                  onClick={() => entry.id && handleDeleteEntry(entry.id)}
                  className="p-2 text-gray-500 hover:text-rose-500 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                {entry.content}
              </p>
            </motion.div>
          ))
        )}
      </div>

      {isModalOpen && (
        <AddDiaryEntryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}
