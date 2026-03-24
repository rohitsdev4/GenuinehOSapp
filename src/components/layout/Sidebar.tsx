import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, CreditCard, Receipt, HandCoins, 
  MapPin, Users, UserCircle, Briefcase, 
  CheckSquare, BookText, Target, Sparkles, 
  Bot, Contact, Settings, X
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

const navGroups = [
  {
    title: 'CORE',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: CreditCard, label: 'Payments', path: '/payments' },
      { icon: Receipt, label: 'Expenses', path: '/expenses' },
      { icon: HandCoins, label: 'Parties Ledger', path: '/parties' },
      { icon: MapPin, label: 'Sites', path: '/sites' },
      { icon: Users, label: 'Labour', path: '/labour' },
    ]
  },
  {
    title: 'SALES',
    items: [
      { icon: UserCircle, label: 'Clients', path: '/clients' },
      { icon: Briefcase, label: 'Deals & OT', path: '/deals' },
    ]
  },
  {
    title: 'DAILY',
    items: [
      { icon: CheckSquare, label: 'Tasks & Habits', path: '/tasks' },
      { icon: BookText, label: 'Daily Diary', path: '/diary' },
      { icon: Target, label: 'Goals', path: '/goals' },
      { icon: Sparkles, label: 'Astro Insights', path: '/astro' },
    ]
  },
  {
    title: 'MORE',
    items: [
      { icon: Bot, label: 'AI Assistant', path: '/ai' },
      { icon: Contact, label: 'Contacts', path: '/contacts' },
      { icon: Settings, label: 'Settings', path: '/settings' },
    ]
  }
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-[#0b0e14] border-r border-[#1e2a40] h-screen overflow-y-auto transition-transform duration-300 ease-in-out flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 flex items-center justify-between border-b border-[#1e2a40] sticky top-0 bg-[#0b0e14] z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00d4aa] flex items-center justify-center text-[#07090f] font-black">
              G
            </div>
            <span className="text-white font-black text-lg font-['Syne']">Genuine<span className="text-[#00d4aa]">OS</span></span>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-[#161c2a] rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 px-3 py-6 space-y-8">
          {navGroups.map((group) => (
            <div key={group.title}>
              <h4 className="px-3 text-[10px] font-bold text-gray-500 tracking-widest mb-3">{group.title}</h4>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => onClose()}
                    className={({ isActive }) => cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                      isActive 
                        ? "bg-[#00d4aa]/10 text-[#00d4aa] border-l-2 border-[#00d4aa] rounded-l-none" 
                        : "text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
