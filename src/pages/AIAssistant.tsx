import { useState, useRef, useEffect } from 'react';
import { callGemini, buildContext, type GeminiModel } from '@/src/lib/gemini';
import { useFirestore } from '@/src/hooks/useFirestore';
import type { Payment, Expense, Receivable, Task } from '@/src/types';
import PageHeader from '@/src/components/ui/PageHeader';
import { Send, Bot, User, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface Message {
  role: 'user' | 'ai';
  text: string;
  time: string;
  model?: string;
}

const QUICK_PROMPTS = [
  'Aaj ka action plan do',
  'Cash flow analysis karo',
  'Receivable recovery tips',
  'Deal coaching chahiye',
  'Factory planning advice',
  'Monthly P&L samjhao',
  'Expenses kaise kam karein',
  'Motivate karo bhai 💪',
];

const STORAGE_KEY = 'genuineos_chat_history';

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse chat history', e);
      }
    }
    return [{
      role: 'ai',
      text: 'Jai Shree Ram Rohit bhai! 🙏\n\nMain GenuineOS AI hoon — Gemini 3 Flash-Lite se powered. Aapka business advisor!\n\nKya help chahiye aaj?',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    }];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<GeminiModel>('gemini-3-flash-lite-preview');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Get live data for context
  const { data: payments, add: addPayment } = useFirestore<Payment>('payments');
  const { data: expenses, add: addExpense } = useFirestore<Expense>('expenses');
  const { data: receivables, add: addReceivable } = useFirestore<Receivable>('receivables');
  const { data: tasks, add: addTask } = useFirestore<Task>('tasks');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const clearHistory = () => {
    const initialMsg: Message = {
      role: 'ai',
      text: 'Jai Shree Ram Rohit bhai! 🙏\n\nMain GenuineOS AI hoon — Gemini 3 Flash-Lite se powered. Aapka business advisor!\n\nKya help chahiye aaj?',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([initialMsg]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([initialMsg]));
  };

  const getContext = () => {
    const now = new Date();
    const thisMonth = (arr: Array<{date: string; amount: number}>) =>
      arr.filter(x => {
        const d = new Date(x.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).reduce((s, x) => s + x.amount, 0);

    const criticalReceivables = receivables
      .filter(r => {
        const days = Math.floor((Date.now() - new Date(r.dueDate).getTime()) / 86400000);
        return days > 60 && r.status !== 'Collected';
      })
      .map(r => ({
        party: r.partyName,
        amount: r.amount - r.amountCollected,
        days: Math.floor((Date.now() - new Date(r.dueDate).getTime()) / 86400000),
      }));

    return buildContext({
      thisMonthIncome: thisMonth(payments as any),
      thisMonthExpenses: thisMonth(expenses as any),
      criticalReceivables,
      pendingTasks: tasks.filter(t => t.status !== 'Completed').length,
    });
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => [...prev, { role: 'user', text, time }]);
    setInput('');
    setLoading(true);

    try {
      const res = await callGemini({
        prompt: text,
        model,
        context: getContext(),
        maxTokens: model === 'gemini-3.1-pro-preview' ? 1000 : 600,
        history: messages.map(m => ({ role: m.role, text: m.text })),
      });
      
      let aiText = res.text;

      if (res.functionCalls && res.functionCalls.length > 0) {
        for (const call of res.functionCalls) {
          if (call.name === 'addExpense') {
            const args = call.args as any;
            await addExpense({
              amount: args.amount,
              category: args.category,
              partyName: args.partyName,
              date: new Date().toISOString().split('T')[0],
              notes: args.notes || 'Added via AI Assistant',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as any);
            aiText += `\n\n✅ Added Expense: ₹${args.amount} for ${args.category} (${args.partyName})`;
          } else if (call.name === 'addPayment') {
            const args = call.args as any;
            await addPayment({
              amount: args.amount,
              category: args.category,
              partyName: args.partyName,
              date: new Date().toISOString().split('T')[0],
              notes: args.notes || 'Added via AI Assistant',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as any);
            aiText += `\n\n✅ Added Payment Received: ₹${args.amount} via ${args.category} (${args.partyName})`;
          } else if (call.name === 'addTask') {
            const args = call.args as any;
            await addTask({
              title: args.title,
              priority: args.priority,
              dueDate: args.dueDate || new Date().toISOString().split('T')[0],
              status: 'Pending',
              notes: args.notes || 'Added via AI Assistant',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as any);
            aiText += `\n\n✅ Added Task: ${args.title} (${args.priority} Priority)`;
          } else if (call.name === 'addReceivable') {
            const args = call.args as any;
            await addReceivable({
              partyName: args.partyName,
              amount: args.amount,
              dueDate: args.dueDate,
              amountCollected: 0,
              status: 'Pending',
              notes: args.notes || 'Added via AI Assistant',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as any);
            aiText += `\n\n✅ Added Receivable: ₹${args.amount} from ${args.partyName} (Due: ${args.dueDate})`;
          }
        }
      }

      setMessages(prev => [...prev, {
        role: 'ai',
        text: aiText || 'Done!',
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        model: res.model,
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: err.message?.includes('RATE_LIMIT')
          ? '⚠️ Quota khatam ho gayi. Thodi der baad try karo ya model badlo.'
          : '❌ AI abhi available nahi. Internet check karo.',
        time,
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] lg:h-[calc(100vh-120px)]">
      <PageHeader 
        title="AI Assistant" 
        subtitle="Powered by Google Gemini · Free tier"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={model}
              onChange={e => setModel(e.target.value as GeminiModel)}
              className="bg-[#111520] border border-[#1e2a40] text-xs text-gray-300
                         rounded-lg px-3 py-2 outline-none focus:border-[#00d4aa] transition"
            >
              <option value="gemini-3-flash-lite-preview">⚡ Flash-Lite (1000/day)</option>
              <option value="gemini-3-flash-preview">🔵 Flash (250/day)</option>
              <option value="gemini-3.1-pro-preview">🧠 Pro (100/day)</option>
            </select>
            <button
              onClick={clearHistory}
              className="p-2 text-gray-500 border border-[#1e2a40] rounded-lg hover:border-red-500 hover:text-red-400 transition"
              title="Clear Chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        }
      />

      {/* Quick Prompts */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
        {QUICK_PROMPTS.map(p => (
          <button
            key={p}
            onClick={() => sendMessage(p)}
            className="flex-shrink-0 text-xs border border-[#1e2a40] bg-[#111520]
                       text-gray-400 px-4 py-2 rounded-full hover:border-[#00d4aa]
                       hover:text-[#00d4aa] transition font-semibold flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            {p}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2 mb-4 custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                msg.role === 'user' ? "bg-[#00d4aa] text-[#07090f]" : "bg-[#1e2a40] text-gray-400"
              )}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={cn(
                "max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-lg",
                msg.role === 'user'
                  ? "bg-[#00d4aa] text-[#07090f] font-medium rounded-tr-none"
                  : "bg-[#161c2a] border border-[#1e2a40] text-gray-200 rounded-tl-none"
              )}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <div className={cn(
                  "text-[10px] mt-2 flex items-center gap-2",
                  msg.role === 'user' ? "text-[#07090f]/60 justify-end" : "text-gray-600"
                )}>
                  <span>{msg.time}</span>
                  {msg.model && <span>· {msg.model}</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex justify-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1e2a40] flex items-center justify-center text-gray-400">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[#161c2a] border border-[#1e2a40] px-4 py-3 rounded-2xl rounded-tl-none">
              <div className="flex gap-1.5 items-center">
                <span className="text-xs text-gray-500 mr-1">Gemini soch raha hai</span>
                <Loader2 className="w-3 h-3 animate-spin text-[#00d4aa]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="relative mt-auto">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder="Kuch bhi pucho business ke baare mein..."
          className="w-full bg-[#161c2a] border border-[#1e2a40] rounded-2xl
                     pl-4 pr-14 py-4 text-sm text-white outline-none
                     focus:border-[#00d4aa] transition placeholder-gray-600 shadow-xl"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#00d4aa] text-[#07090f] p-2.5 rounded-xl
                     font-bold hover:bg-[#00b894] transition
                     disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
