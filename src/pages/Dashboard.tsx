import { useFirestore } from '@/src/hooks/useFirestore';
import type { Payment, Expense, Receivable, Site, Task, Deal, Habit } from '@/src/types';
import { motion } from 'motion/react';
import { cn, formatCurrency } from '@/src/lib/utils';
import { CheckSquare, BarChart3, PieChart as PieChartIcon, Sparkles, Activity, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function Dashboard() {
  const { data: payments } = useFirestore<Payment>('payments');
  const { data: expenses } = useFirestore<Expense>('expenses');
  const { data: receivables } = useFirestore<Receivable>('receivables');
  const { data: sites } = useFirestore<Site>('sites');
  const { data: tasks, update: updateTask } = useFirestore<Task>('tasks');
  const { data: deals } = useFirestore<Deal>('deals');
  const { data: habits, update: updateHabit } = useFirestore<Habit>('habits');

  const now = new Date();
  const toAmount = (value: unknown) => {
    const numeric = typeof value === 'number' ? value : Number.parseFloat(String(value ?? 0));
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const thisMonth = (arr: any[]) =>
    arr.filter(x => {
      const d = new Date(x.date || x.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((s, x) => s + toAmount(x.amount), 0);

  const isThisMonth = (value?: string) => {
    if (!value) return false;
    const d = new Date(value);
    return !Number.isNaN(d.getTime()) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  const income = thisMonth(payments);
  const expense = thisMonth(expenses);
  const net = income - expense;
  
  const criticalReceivables = receivables.filter(r => {
    const days = Math.floor((Date.now() - new Date(r.dueDate).getTime()) / 86400000);
    return days > 60 && r.status !== 'Collected';
  }).length;

  const totalReceivable = receivables
    .filter(r => r.status !== 'Collected')
    .reduce((s, r) => s + (r.amount - r.amountCollected), 0);

  const activeSites = sites.filter(s => s.status === 'Active').length;
  const pendingTasks = tasks.filter(t => t.status !== 'Completed').length;
  const activeDeals = deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost').length;
  const pipelineValue = deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost').reduce((s, d) => s + d.amount, 0);

  const allTimeIncome = payments.reduce((sum, p) => sum + toAmount(p.amount), 0);
  const allTimeExpense = expenses.reduce((sum, e) => sum + toAmount(e.amount), 0);
  const allTimeNet = allTimeIncome - allTimeExpense;
  
  // User Balances Calculation (derived from real synced/user data)
  const partners = Array.from(
    new Set([
      ...payments.map((p) => (p.partner || '').trim()),
      ...expenses.map((e) => (e.partner || '').trim()),
    ].filter(Boolean))
  );
  const userBalances = partners.map(name => {
    const userPayments = payments.filter(p => p.partner === name).reduce((s, p) => s + toAmount(p.amount), 0);
    const userExpenses = expenses.filter(e => e.partner === name).reduce((s, e) => s + toAmount(e.amount), 0);
    const userTxns = payments.filter(p => p.partner === name).length + expenses.filter(e => e.partner === name).length;
    return {
      name,
      payments: userPayments,
      expenses: userExpenses,
      balance: userPayments - userExpenses,
      transactions: userTxns
    };
  });

  const totalBalanceInHand = userBalances.reduce((s, b) => s + b.balance, 0);

  // Chart Data Preparation
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      name: d.toLocaleString('default', { month: 'short' }),
      month: d.getMonth(),
      year: d.getFullYear(),
      Income: 0,
      Expenses: 0
    };
  }).reverse();

  payments.forEach(p => {
    const d = new Date(p.date);
    const m = last6Months.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
    if (m) m.Income += toAmount(p.amount);
  });

  expenses.forEach(e => {
    const d = new Date(e.date);
    const m = last6Months.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
    if (m) m.Expenses += toAmount(e.amount);
  });

  const expenseCategories = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + toAmount(curr.amount);
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(expenseCategories).map(([name, value]) => ({ name, value }));
  const COLORS = ['#00d4aa', '#3b82f6', '#8b5cf6', '#f43f5e', '#f59e0b', '#10b981'];

  const toggleHabit = async (habit: Habit) => {
    const today = new Date().toISOString().split('T')[0];
    if (habit.lastCompleted === today) return;
    
    await updateHabit(habit.id!, {
      lastCompleted: today,
      streak: (habit.streak || 0) + 1,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white font-['Syne'] flex items-center gap-2">
          Command Center <span className="text-[#00d4aa]">⚡</span>
        </h1>
        <p className="text-xs font-mono mt-2 leading-relaxed">
          <span className="text-gray-500">Genuine Hospi Enterprises · Patna, Bihar ·</span><br/>
          <span className="text-[#00d4aa]">Jupiter Mahadasha · Venus Antardasha</span>
        </p>
      </div>

      {/* 6 KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-[#111520] border border-[#1e2a40] rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-center shadow-lg">
          <h3 className="text-xl sm:text-2xl font-black text-[#00d4aa]">{formatCurrency(totalReceivable)}</h3>
          <p className="text-[10px] sm:text-xs text-gray-500 font-bold tracking-widest mt-1 mb-3 uppercase">Total Receivables</p>
          <span className={cn("text-[10px] px-2.5 py-1 rounded-full font-bold", criticalReceivables > 0 ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400")}>
            {criticalReceivables} Critical
          </span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-[#111520] border border-[#1e2a40] rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-center shadow-lg">
          <h3 className="text-xl sm:text-2xl font-black text-[#00d4aa]">{formatCurrency(income)}</h3>
          <p className="text-[10px] sm:text-xs text-gray-500 font-bold tracking-widest mt-1 mb-3 uppercase">This Month Income</p>
          <span className="bg-[#00d4aa]/10 text-[#00d4aa] text-[10px] px-2.5 py-1 rounded-full font-bold">
            {payments.filter(p => isThisMonth(p.date)).length} txns
          </span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-[#111520] border border-[#1e2a40] rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-center shadow-lg">
          <h3 className="text-xl sm:text-2xl font-black text-[#00d4aa]">{formatCurrency(net)}</h3>
          <p className="text-[10px] sm:text-xs text-gray-500 font-bold tracking-widest mt-1 mb-3 uppercase">Net P&L</p>
          <span className={cn("text-[10px] px-2.5 py-1 rounded-full font-bold", net >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>
            {net >= 0 ? 'Profitable' : 'Loss'}
          </span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-[#111520] border border-[#1e2a40] rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-center shadow-lg">
          <h3 className="text-xl sm:text-2xl font-black text-[#00d4aa]">{activeSites}</h3>
          <p className="text-[10px] sm:text-xs text-gray-500 font-bold tracking-widest mt-1 mb-3 uppercase">Active Sites</p>
          <span className="bg-indigo-500/10 text-indigo-400 text-[10px] px-2.5 py-1 rounded-full font-bold">
            {sites.filter(s => s.progress > 0 && s.progress < 100).length} on track
          </span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-[#111520] border border-[#1e2a40] rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-center shadow-lg">
          <h3 className="text-xl sm:text-2xl font-black text-[#00d4aa]">{pendingTasks}</h3>
          <p className="text-[10px] sm:text-xs text-gray-500 font-bold tracking-widest mt-1 mb-3 uppercase">Pending Tasks</p>
          <span className="bg-amber-500/10 text-amber-400 text-[10px] px-2.5 py-1 rounded-full font-bold">
            {tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length} high priority
          </span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="bg-[#111520] border border-[#1e2a40] rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-center shadow-lg">
          <h3 className="text-xl sm:text-2xl font-black text-[#8b5cf6]">{formatCurrency(totalBalanceInHand)}</h3>
          <p className="text-[10px] sm:text-xs text-gray-500 font-bold tracking-widest mt-1 mb-3 uppercase">Balance in Hand</p>
          <span className="bg-[#8b5cf6]/10 text-[#8b5cf6] text-[10px] px-2.5 py-1 rounded-full font-bold">
            {partners.length > 0 ? `${partners.length} partners` : 'No partners yet'}
          </span>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-[#111520] border border-[#1e2a40] rounded-2xl p-4">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">All-Time Income</p>
          <p className="text-lg font-black text-emerald-400">{formatCurrency(allTimeIncome)}</p>
        </div>
        <div className="bg-[#111520] border border-[#1e2a40] rounded-2xl p-4">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">All-Time Expenses</p>
          <p className="text-lg font-black text-rose-400">{formatCurrency(allTimeExpense)}</p>
        </div>
        <div className="bg-[#111520] border border-[#1e2a40] rounded-2xl p-4">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">All-Time Net</p>
          <p className={cn("text-lg font-black", allTimeNet >= 0 ? "text-emerald-400" : "text-rose-400")}>
            {formatCurrency(allTimeNet)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Charts */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}
          className="bg-[#111520] border border-[#1e2a40] rounded-2xl p-5 shadow-lg flex flex-col">
          <h3 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Revenue vs Expenses (6 Months)
          </h3>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last6Months} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                <Tooltip 
                  cursor={{fill: '#1e2a40'}}
                  contentStyle={{ backgroundColor: '#0b0e14', borderColor: '#1e2a40', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="Income" fill="#00d4aa" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}
          className="bg-[#111520] border border-[#1e2a40] rounded-2xl p-5 shadow-lg flex flex-col">
          <h3 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-4 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4" />
            Expense Breakdown
          </h3>
          <div className="flex-1 min-h-[250px] w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0b0e14', borderColor: '#1e2a40', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-500 font-mono">No expense data</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* User Balances Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        className="bg-[#111520] border border-[#1e2a40] rounded-2xl p-5 shadow-lg mb-8">
        <h3 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-6 flex items-center gap-2">
          <Users className="w-4 h-4" />
          User Balances
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {userBalances.length === 0 ? (
            <p className="text-sm text-gray-500 font-mono">No partner/user data found in payments or expenses yet.</p>
          ) : userBalances.map((user, idx) => (
            <div key={user.name} className="bg-[#0b0e14] border border-[#1e2a40] rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#3b82f6]" />
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1e2a40] flex items-center justify-center text-xl">
                    {idx === 0 ? '👨‍💼' : '👨‍💻'}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">{user.name}</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{user.transactions} transactions</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Total Payments:</span>
                  <span className="text-emerald-400 font-bold">{formatCurrency(user.payments)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Total Expenses:</span>
                  <span className="text-rose-400 font-bold">{formatCurrency(user.expenses)}</span>
                </div>
                <div className="pt-4 border-t border-[#1e2a40] flex justify-between items-center">
                  <span className="text-white font-bold">Net Balance:</span>
                  <span className={cn("text-lg font-black", user.balance >= 0 ? "text-emerald-400" : "text-rose-400")}>
                    {user.balance >= 0 ? '+' : ''}{formatCurrency(user.balance)}
                  </span>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-emerald-500/70">Payments</span>
                    <span className="text-rose-500/70">Expenses</span>
                  </div>
                  <div className="h-2 bg-[#1e2a40] rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-1000" 
                      style={{ width: `${(user.payments / (user.payments + user.expenses || 1)) * 100}%` }} 
                    />
                    <div 
                      className="h-full bg-rose-500 transition-all duration-1000" 
                      style={{ width: `${(user.expenses / (user.payments + user.expenses || 1)) * 100}%` }} 
                    />
                  </div>
                </div>

                {/* Transaction History Table */}
                <div className="pt-6">
                  <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Recent Transactions</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] font-mono">
                      <thead>
                        <tr className="text-gray-600 border-b border-[#1e2a40]">
                          <th className="text-left py-2 font-bold uppercase">Date</th>
                          <th className="text-left py-2 font-bold uppercase">Type</th>
                          <th className="text-right py-2 font-bold uppercase">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ...payments.filter(p => p.partner === user.name).map(p => ({ ...p, type: 'Payment' })),
                          ...expenses.filter(e => e.partner === user.name).map(e => ({ ...e, type: 'Expense' }))
                        ]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 5)
                        .map((txn, i) => (
                          <tr key={i} className="border-b border-[#1e2a40]/50 last:border-0">
                            <td className="py-2 text-gray-400">{new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                            <td className="py-2">
                              <span className={cn(
                                "px-1.5 py-0.5 rounded-[4px] font-bold text-[9px] uppercase",
                                txn.type === 'Payment' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                              )}>
                                {txn.type}
                              </span>
                            </td>
                            <td className={cn(
                              "py-2 text-right font-bold",
                              txn.type === 'Payment' ? "text-emerald-400" : "text-rose-400"
                            )}>
                              {formatCurrency(txn.amount)}
                            </td>
                          </tr>
                        ))}
                        {user.transactions === 0 && (
                          <tr>
                            <td colSpan={3} className="py-4 text-center text-gray-600 italic">No transactions found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Site Progress */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
          className="bg-[#111520] border border-[#1e2a40] rounded-2xl p-5 shadow-lg lg:col-span-2">
          <h3 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-4 flex items-center gap-2">
            🏗️ Site Progress
          </h3>
          <div className="space-y-4">
            {sites.length > 0 ? sites.slice(0, 3).map(site => (
              <div key={site.id} className="bg-[#0b0e14] p-4 rounded-xl border border-[#1e2a40]">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-white text-sm">{site.name}</span>
                  <span className="text-[#00d4aa] font-bold text-sm">{site.progress}%</span>
                </div>
                <div className="h-2 bg-[#1e2a40] rounded-full overflow-hidden">
                  <div className="h-full bg-[#00d4aa] rounded-full transition-all duration-1000" style={{ width: `${site.progress}%` }} />
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-500 font-mono">No active sites</p>
            )}
          </div>
        </motion.div>

        {/* AI Brief & Practice Tracker */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}
            className="bg-gradient-to-br from-[#111520] to-[#0b0e14] border border-[#00d4aa]/30 rounded-2xl p-5 shadow-[0_0_20px_rgba(0,212,170,0.1)]">
            <h3 className="text-[11px] font-bold text-[#00d4aa] tracking-widest uppercase mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Daily Brief
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed font-mono">
              "Good morning Rohit. You have {criticalReceivables} critical receivables pending. {sites.filter(s => s.progress > 0 && s.progress < 100).length} sites are on track. Consider following up with pending tasks today."
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
            className="bg-[#111520] border border-[#1e2a40] rounded-2xl p-5 shadow-lg">
            <h3 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Practice Tracker
            </h3>
            <div className="space-y-3">
              {habits.length > 0 ? habits.slice(0, 3).map(habit => {
                const today = new Date().toISOString().split('T')[0];
                const isDone = habit.lastCompleted === today;
                return (
                  <label key={habit.id} className="flex items-center gap-3 p-3 bg-[#0b0e14] border border-[#1e2a40] rounded-xl cursor-pointer hover:border-[#00d4aa]/50 transition">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-600 text-[#00d4aa] focus:ring-[#00d4aa] focus:ring-offset-gray-900 bg-transparent" 
                      checked={isDone}
                      onChange={() => toggleHabit(habit)}
                    />
                    <span className={cn("text-sm font-medium transition", isDone ? "text-gray-500 line-through" : "text-gray-300")}>
                      {habit.title}
                    </span>
                    {habit.streak > 0 && (
                      <span className="ml-auto text-[10px] bg-[#00d4aa]/10 text-[#00d4aa] px-1.5 py-0.5 rounded font-bold">
                        {habit.streak}🔥
                      </span>
                    )}
                  </label>
                );
              }) : (
                <p className="text-sm text-gray-500 font-mono">No habits set</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Urgent Alerts */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
        className="bg-[#111520] border border-[#1e2a40] rounded-2xl p-5 shadow-lg">
        <h3 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-4 flex items-center gap-2">
          🚨 Urgent Alerts
        </h3>
        <div className="space-y-3">
          <div className="bg-[#161c2a] border-l-4 border-[#00d4aa] rounded-r-xl p-4">
            <p className="text-sm text-gray-200 font-mono leading-relaxed">
              🪐 Mercury Direct: Mar 20, 2026 — Begin new contracts post this date.
            </p>
          </div>
          <div className="bg-[#161c2a] border-l-4 border-emerald-500 rounded-r-xl p-4">
            <p className="text-sm text-gray-200 font-mono leading-relaxed flex items-start gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              Jupiter Direct: Mar 11, 2026 — Business expansion window OPEN.
            </p>
          </div>
        </div>
      </motion.div>

    </div>
  );
}

