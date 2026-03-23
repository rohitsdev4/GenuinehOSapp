import PageHeader from '@/src/components/ui/PageHeader';
import { CheckSquare, Plus, Flame, Circle, CheckCircle2, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useState } from 'react';
import AddTaskModal from '@/src/components/modals/AddTaskModal';
import AddHabitModal from '@/src/components/modals/AddHabitModal';
import { useFirestore } from '@/src/hooks/useFirestore';
import type { Task, Habit } from '@/src/types';

export default function Tasks() {
  const { data: tasks, loading: tasksLoading, update: updateTask, remove: removeTask } = useFirestore<Task>('tasks');
  const { data: habits, loading: habitsLoading, update: updateHabit, remove: removeHabit } = useFirestore<Habit>('habits');
  
  const [activeTab, setActiveTab] = useState<'tasks' | 'habits'>('tasks');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const handleToggleTask = async (task: Task) => {
    if (!task.id) return;
    await updateTask(task.id, { status: task.status === 'Completed' ? 'Pending' : 'Completed' });
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await removeTask(id);
    }
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsHabitModalOpen(true);
  };

  const handleDeleteHabit = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this habit?')) {
      await removeHabit(id);
    }
  };

  const isHabitCompletedToday = (lastCompleted?: string) => {
    if (!lastCompleted) return false;
    const today = new Date().toISOString().split('T')[0];
    return lastCompleted.startsWith(today);
  };

  const handleToggleHabit = async (habit: Habit) => {
    if (!habit.id) return;
    const completedToday = isHabitCompletedToday(habit.lastCompleted);
    const todayStr = new Date().toISOString();
    
    if (completedToday) {
      // Undo completion
      await updateHabit(habit.id, { 
        lastCompleted: '', 
        streak: Math.max(0, habit.streak - 1) 
      });
    } else {
      // Mark completed
      await updateHabit(habit.id, { 
        lastCompleted: todayStr, 
        streak: habit.streak + 1 
      });
    }
  };

  if (tasksLoading || habitsLoading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <PageHeader 
        title="Tasks & Habits" 
        subtitle="Stay organized and build consistency"
        actions={
          <button 
            onClick={() => activeTab === 'tasks' ? setIsTaskModalOpen(true) : setIsHabitModalOpen(true)}
            className="bg-[#00d4aa] text-[#07090f] px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#00b894] transition cursor-pointer shadow-[0_0_15px_rgba(0,212,170,0.3)]"
          >
            <Plus className="w-4 h-4" />
            Add {activeTab === 'tasks' ? 'Task' : 'Habit'}
          </button>
        }
      />

      <div className="flex gap-2 p-1 bg-[#111520] border border-[#1e2a40] rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('tasks')}
          className={cn("px-4 py-2 rounded-lg text-sm font-bold transition", activeTab === 'tasks' ? "bg-[#1e2a40] text-white" : "text-gray-500 hover:text-gray-300")}
        >
          Daily Tasks
        </button>
        <button 
          onClick={() => setActiveTab('habits')}
          className={cn("px-4 py-2 rounded-lg text-sm font-bold transition", activeTab === 'habits' ? "bg-[#1e2a40] text-white" : "text-gray-500 hover:text-gray-300")}
        >
          Habit Tracker
        </button>
      </div>

      {activeTab === 'tasks' ? (
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="text-center py-10 text-gray-500 border border-[#1e2a40] rounded-xl bg-[#111520]">
              No tasks yet. Add one to get started!
            </div>
          ) : (
            tasks.map((task, i) => (
              <motion.div 
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "bg-[#111520] border border-[#1e2a40] rounded-xl p-4 flex items-center gap-4 transition",
                  task.status === 'Completed' && "opacity-50"
                )}
              >
                <button 
                  onClick={() => handleToggleTask(task)}
                  className="text-gray-500 hover:text-[#00d4aa] transition cursor-pointer"
                >
                  {task.status === 'Completed' ? <CheckCircle2 className="w-6 h-6 text-[#00d4aa]" /> : <Circle className="w-6 h-6" />}
                </button>
                <div className="flex-1">
                  <h4 className={cn("font-bold text-gray-200", task.status === 'Completed' && "line-through")}>{task.title}</h4>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold mt-1 inline-block", 
                    task.priority === 'High' ? "bg-rose-500/10 text-rose-400" : 
                    task.priority === 'Medium' ? "bg-amber-500/10 text-amber-400" :
                    "bg-emerald-500/10 text-emerald-400"
                  )}>
                    {task.priority} Priority
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleEditTask(task)}
                    className="p-2 text-gray-500 hover:text-white transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => task.id && handleDeleteTask(task.id)}
                    className="p-2 text-gray-500 hover:text-rose-500 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {habits.length === 0 ? (
            <div className="col-span-full text-center py-10 text-gray-500 border border-[#1e2a40] rounded-xl bg-[#111520]">
              No habits yet. Add one to build consistency!
            </div>
          ) : (
            habits.map((habit, i) => {
              const completedToday = isHabitCompletedToday(habit.lastCompleted);
              return (
                <motion.div 
                  key={habit.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[#111520] border border-[#1e2a40] rounded-2xl p-5 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-white text-lg">{habit.title}</h4>
                    <div className="flex items-center gap-1.5 mt-2 text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full w-fit">
                      <Flame className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">{habit.streak} Day Streak</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => handleEditHabit(habit)}
                        className="p-1.5 text-gray-500 hover:text-white transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => habit.id && handleDeleteHabit(habit.id)}
                        className="p-1.5 text-gray-500 hover:text-rose-500 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button 
                      onClick={() => handleToggleHabit(habit)}
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer",
                        completedToday ? "bg-[#00d4aa] text-[#07090f] shadow-[0_0_15px_rgba(0,212,170,0.3)]" : "bg-[#1e2a40] text-gray-500 hover:bg-[#2a3a5a]"
                      )}
                    >
                      <CheckSquare className="w-6 h-6" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {isTaskModalOpen && (
        <AddTaskModal 
          isOpen={isTaskModalOpen} 
          onClose={() => {
            setIsTaskModalOpen(false);
            setEditingTask(null);
          }} 
          task={editingTask}
        />
      )}
      
      {isHabitModalOpen && (
        <AddHabitModal 
          isOpen={isHabitModalOpen} 
          onClose={() => {
            setIsHabitModalOpen(false);
            setEditingHabit(null);
          }} 
          habit={editingHabit}
        />
      )}
    </div>
  );
}
