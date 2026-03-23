import React, { Suspense, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { AuthPage } from '@/src/components/layout/AuthPage';
import Sidebar from '@/src/components/layout/Sidebar';
import BottomNav from '@/src/components/layout/BottomNav';
import Header from '@/src/components/layout/Header';
import { Loader2 } from 'lucide-react';

// Lazy load all pages
const Dashboard = React.lazy(() => import('@/src/pages/Dashboard'));
const Payments = React.lazy(() => import('@/src/pages/Payments'));
const Expenses = React.lazy(() => import('@/src/pages/Expenses'));
const Receivables = React.lazy(() => import('@/src/pages/Receivables'));
const Sites = React.lazy(() => import('@/src/pages/Sites'));
const Labour = React.lazy(() => import('@/src/pages/Labour'));
const Clients = React.lazy(() => import('@/src/pages/Clients'));
const Deals = React.lazy(() => import('@/src/pages/Deals'));
const Tasks = React.lazy(() => import('@/src/pages/Tasks'));
const Diary = React.lazy(() => import('@/src/pages/Diary'));
const Goals = React.lazy(() => import('@/src/pages/Goals'));
const Astro = React.lazy(() => import('@/src/pages/Astro'));
const AIAssistant = React.lazy(() => import('@/src/pages/AIAssistant'));
const Contacts = React.lazy(() => import('@/src/pages/Contacts'));
const Settings = React.lazy(() => import('@/src/pages/Settings'));

function AppShell() {
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#07090f]">
        <div className="text-center">
          <div className="text-4xl mb-4">⚡</div>
          <div className="text-[#00d4aa] font-bold text-lg">GenuineOS</div>
          <div className="text-gray-500 text-sm mt-1 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return (
    <div className="flex h-screen overflow-hidden bg-[#07090f] text-gray-200 font-sans">
      {/* Desktop & Mobile Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 lg:pb-6">
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/receivables" element={<Receivables />} />
              <Route path="/sites" element={<Sites />} />
              <Route path="/labour" element={<Labour />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/deals" element={<Deals />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/diary" element={<Diary />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/astro" element={<Astro />} />
              <Route path="/ai" element={<AIAssistant />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Suspense>
        </main>
        {/* Mobile: Bottom Nav */}
        <BottomNav />
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 bg-white/5 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/5" />
        ))}
      </div>
      <div className="h-96 bg-white/5 rounded-2xl border border-white/5" />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </HashRouter>
  );
}
