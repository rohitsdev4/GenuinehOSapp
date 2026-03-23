import PageHeader from '@/src/components/ui/PageHeader';
import { Sparkles, Star, Moon, Sun, Clock, Compass, Zap, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export default function Astro() {
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  
  const insights = [
    { 
      title: 'Business Growth', 
      desc: 'Jupiter in 10th house indicates expansion in medical infrastructure projects.', 
      icon: Zap, 
      color: 'text-yellow-400', 
      bg: 'bg-yellow-400/10' 
    },
    { 
      title: 'Financial Caution', 
      desc: 'Saturn aspect suggests careful auditing of site expenses this week.', 
      icon: ShieldCheck, 
      color: 'text-blue-400', 
      bg: 'bg-blue-400/10' 
    },
    { 
      title: 'Networking', 
      desc: 'Venus favors building new relationships with hospital administrators.', 
      icon: Compass, 
      color: 'text-pink-400', 
      bg: 'bg-pink-400/10' 
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <PageHeader 
        title="Astro Insights" 
        subtitle={`Business Guidance for Rohit Kumar · ${today}`}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111520] border border-[#1e2a40] rounded-2xl p-6 shadow-lg relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Sparkles className="w-32 h-32 text-[#00d4aa]" />
            </div>

            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-[#00d4aa]/10 flex items-center justify-center">
                <Sun className="w-6 h-6 text-[#00d4aa]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white font-['Syne']">Current Mahadasha</h3>
                <p className="text-sm text-gray-400 font-mono">Jupiter (Guru) · Period of Wisdom & Expansion</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {insights.map((item, i) => (
                <div key={i} className="bg-[#0b0e14] border border-[#1e2a40] p-4 rounded-xl">
                  <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center mb-3`}>
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">{item.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-[#0b0e14] border border-[#1e2a40] rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                <Moon className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Shubh Muhurat Today</p>
                <p className="text-sm text-gray-300 font-medium">11:45 AM to 12:30 PM — Best for signing new OT contracts.</p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#111520] border border-[#1e2a40] rounded-2xl p-6"
            >
              <h3 className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-4">Lucky Elements</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Lucky Color</span>
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" /> Emerald Green
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Lucky Number</span>
                  <span className="text-sm font-bold text-white">3, 7, 9</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Direction</span>
                  <span className="text-sm font-bold text-white">North-East</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#111520] border border-[#1e2a40] rounded-2xl p-6"
            >
              <h3 className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-4">Daily Motivation</h3>
              <p className="text-sm text-gray-300 italic leading-relaxed">
                "Success is not final, failure is not fatal: it is the courage to continue that counts."
              </p>
              <p className="text-[10px] text-gray-500 mt-2">— Winston Churchill</p>
            </motion.div>
          </div>
        </div>

        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#111520] border border-[#1e2a40] rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Astro Timeline
            </h3>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#1e2a40] before:to-transparent">
              <div className="relative flex items-center justify-between group is-active">
                <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-[#00d4aa] bg-[#0b0e14] text-[#00d4aa] shadow shrink-0 z-10">
                  <div className="w-1.5 h-1.5 bg-[#00d4aa] rounded-full" />
                </div>
                <div className="w-[calc(100%-2rem)] bg-[#161c2a] p-4 rounded-xl border border-[#1e2a40]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-sm">Mercury Direct</span>
                    <span className="text-[10px] text-[#00d4aa] font-mono">Mar 20</span>
                  </div>
                  <p className="text-xs text-gray-500">Favorable for signing new contracts and deals.</p>
                </div>
              </div>

              <div className="relative flex items-center justify-between group">
                <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-[#1e2a40] bg-[#0b0e14] text-gray-500 shadow shrink-0 z-10">
                </div>
                <div className="w-[calc(100%-2rem)] bg-[#0b0e14] p-4 rounded-xl border border-[#1e2a40]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-300 text-sm">Jupiter Transit</span>
                    <span className="text-[10px] text-gray-500 font-mono">Apr 15</span>
                  </div>
                  <p className="text-xs text-gray-600">Major expansion opportunities in medical gas pipelines.</p>
                </div>
              </div>

              <div className="relative flex items-center justify-between group">
                <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-[#1e2a40] bg-[#0b0e14] text-gray-500 shadow shrink-0 z-10">
                </div>
                <div className="w-[calc(100%-2rem)] bg-[#0b0e14] p-4 rounded-xl border border-[#1e2a40]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-300 text-sm">Saturn Retrograde</span>
                    <span className="text-[10px] text-gray-500 font-mono">Jun 29</span>
                  </div>
                  <p className="text-xs text-gray-600">Time to review internal operations and factory efficiency.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
