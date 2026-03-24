import { NavLink } from 'react-router-dom';
import { Zap, CreditCard, MapPin, CheckSquare, Bot } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const mobileNavItems = [
  { icon: Zap, label: 'Home', path: '/dashboard' },
  { icon: CreditCard, label: 'Income', path: '/payments' },
  { icon: MapPin, label: 'Sites', path: '/sites' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
  { icon: Bot, label: 'AI', path: '/ai' },
];

export default function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0b0e14] border-t border-[#1e2a40] px-2 py-2 flex justify-around items-center z-40 pb-safe">
      {mobileNavItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-lg transition-colors",
            isActive ? "text-[#00d4aa]" : "text-gray-500 hover:text-gray-300"
          )}
        >
          <item.icon className="w-5 h-5" />
          <span className="text-[10px] font-bold">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
