import { useState } from 'react';
import PageHeader from '@/src/components/ui/PageHeader';
import { Target, Plus, CheckCircle2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import AddGoalModal from '@/src/components/modals/AddGoalModal';
import { useFirestore } from '@/src/hooks/useFirestore';
import type { Goal } from '@/src/types';

export default function Goals() {
  const { data: goals, loading, remove: removeGoal } = useFirestore<Goal>('goals');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDeleteGoal = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      await removeGoal(id);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading goals...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <PageHeader 
        title="Goals" 
        subtitle="Set and track your long-term objectives"
        actions={
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#00d4aa] text-[#07090f] px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#00b894] transition cursor-pointer shadow-[0_0_15px_rgba(0,212,170,0.3)]"
          >
            <Plus className="w-4 h-4" />
            Set Goal
          </button>
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.length === 0 ? (
          <div className="col-span-full bg-[#111520] border border-[#1e2a40] rounded-2xl p-10 text-center">
            <Target className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No goals set yet</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">Define your long-term objectives and start tracking your progress.</p>
          </div>
        ) : (
          goals.map((goal, i) => (
            <motion.div 
              key={goal.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#111520] border border-[#1e2a40] rounded-2xl p-6 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                <Target className="w-24 h-24 text-white" />
              </div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#1e2a40] flex items-center justify-center text-[#00d4aa]">
                    <Target className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => goal.id && handleDeleteGoal(goal.id)}
                      className="p-1 text-gray-500 hover:text-rose-500 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      goal.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 
                      goal.status === 'Achieved' ? 'bg-blue-500/10 text-blue-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {goal.status}
                    </span>
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2 pr-8">{goal.title}</h3>
                <p className="text-xs text-gray-400 font-mono mb-6">Target: {goal.targetDate || 'No date'}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 font-bold">Progress</span>
                    <span className="text-[#00d4aa] font-bold">{goal.progress}%</span>
                  </div>
                  <div className="h-2 bg-[#1e2a40] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${goal.progress}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className={`h-full rounded-full ${goal.status === 'Active' ? 'bg-[#00d4aa]' : goal.status === 'Achieved' ? 'bg-blue-500' : 'bg-rose-500'}`}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {isModalOpen && (
        <AddGoalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}
