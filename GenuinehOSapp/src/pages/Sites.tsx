import { useState } from 'react';
import PageHeader from '@/src/components/ui/PageHeader';
import { MapPin, Plus, MoreVertical, Calendar, Hammer } from 'lucide-react';
import { motion } from 'motion/react';
import { formatDate } from '@/src/lib/utils';
import AddSiteModal from '@/src/components/modals/AddSiteModal';
import SiteDetailsModal from '@/src/components/modals/SiteDetailsModal';
import { useFirestore } from '@/src/hooks/useFirestore';
import type { Site } from '@/src/types';

export default function Sites() {
  const { data: sites, loading, remove: removeSite } = useFirestore<Site>('sites');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading sites...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <PageHeader 
        title="Sites" 
        subtitle="Manage your project locations and progress"
        actions={
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#00d4aa] text-[#07090f] px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#00b894] transition cursor-pointer shadow-[0_0_15px_rgba(0,212,170,0.3)]"
          >
            <Plus className="w-4 h-4" />
            New Site
          </button>
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sites.length === 0 ? (
          <div className="col-span-full bg-[#111520] border border-[#1e2a40] rounded-2xl p-10 text-center">
            <MapPin className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No sites added yet</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">Add your first project site to start tracking progress and timelines.</p>
          </div>
        ) : (
          sites.map((site, i) => (
          <motion.div 
            key={site.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => setSelectedSite(site)}
            className="bg-[#111520] border border-[#1e2a40] rounded-2xl p-5 shadow-lg relative overflow-hidden cursor-pointer hover:border-[#00d4aa]/50 transition group"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-['Syne']">{site.name}</h3>
                <p className="text-xs text-gray-500 font-mono mt-1">{site.location}</p>
              </div>
              <button className="p-1 text-gray-500 hover:text-white transition">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 mb-5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-gray-400 uppercase tracking-wider">Progress</span>
                <span className="text-[#00d4aa]">{site.progress}%</span>
              </div>
              <div className="h-2 w-full bg-[#1e2a40] rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${site.progress}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="h-full rounded-full bg-[#00d4aa]"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-[#1e2a40]">
              <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(site.estimatedEndDate)}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                <Hammer className="w-3.5 h-3.5" />
                {site.status}
              </div>
            </div>
          </motion.div>
        ))
        )}
      </div>

      {isModalOpen && (
        <AddSiteModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}

      {selectedSite && (
        <SiteDetailsModal 
          isOpen={!!selectedSite} 
          onClose={() => setSelectedSite(null)} 
          site={selectedSite} 
          onDelete={async (id) => {
            await removeSite(id);
            setSelectedSite(null);
          }}
        />
      )}
    </div>
  );
}
