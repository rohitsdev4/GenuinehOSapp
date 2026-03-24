import { useAuth } from '@/src/context/AuthContext';
import { Bell, Search, LogOut, Menu, Moon, Clock, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const [time, setTime] = useState(new Date());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 2000);
  };

  return (
    <header className="h-16 bg-[#07090f]/80 backdrop-blur-md border-b border-[#1e2a40] flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        <button onClick={onMenuClick} className="p-2 -ml-2 text-gray-400 hover:text-white">
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-white font-black text-lg font-['Syne'] tracking-tight">Expense<span className="text-[#3b82f6]">Man</span></span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button 
          onClick={handleSync}
          className={cn(
            "p-2 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition shadow-lg shadow-blue-500/20",
            isSyncing && "animate-pulse"
          )}
        >
          <RefreshCw className={cn("w-5 h-5", isSyncing && "animate-spin")} />
        </button>
        
        <div className="flex items-center gap-3 pl-3 border-l border-[#1e2a40]">
          <button 
            onClick={() => logout()}
            className="w-8 h-8 rounded-full bg-[#1e2a40] flex items-center justify-center text-gray-400 hover:text-red-400 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
