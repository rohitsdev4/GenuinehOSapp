import { useState, useRef, useEffect } from 'react';
import { callGemini, buildFullContext, type GeminiModel } from '@/src/lib/gemini';
import { useFirestore } from '@/src/hooks/useFirestore';
import { fetchFromSheet } from '@/src/lib/sync';
import type { Payment, Expense, Receivable, Task, Site, LabourWorker, Client, Deal, DiaryEntry } from '@/src/types';
import PageHeader from '@/src/components/ui/PageHeader';
import { Send, Bot, User, Loader2, Sparkles, Trash2, BookText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { buildSiteFinancials, DEFAULT_SITE_TEMPLATES } from '@/src/lib/siteFinancials';
import { upsertReceivablesFromSites } from '@/src/lib/receivableSync';

interface Message {
  role: 'user' | 'ai';
  text: string;
  time: string;
  model?: string;
}

const QUICK_PROMPTS = [
  'Aaj ka action plan do',
  'Is month ka P&L batao',
  'Pending receivables list karo',
  'Expenses summary dikhao',
  'Active sites status',
  'Labour balance check karo',
  'Deal pipeline dikhao',
  'Aaj ki diary entry likho',
  'Market research — hospital tenders Bihar',
  'Cash flow forecast karo',
  'Motivate karo bhai 💪',
  'Weekly review karo',
  'Sites se receivables sync karo',
];

const STORAGE_KEY = 'genuineos_chat_history';

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return [{
      role: 'ai',
      text: 'Jai Shree Ram Rohit bhai! 🙏\n\nMain GenuineOS AI hoon — aapka full business manager!\n\nMain aapka poora data dekh sakta hoon aur kuch bhi add/update/delete kar sakta hoon. Kya help chahiye?',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    }];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<GeminiModel>('gemini-2.0-flash');
  const [sheetData, setSheetData] = useState<any[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  // All Firestore collections
  const { data: payments, add: addPayment, update: updatePayment, remove: deletePayment } = useFirestore<Payment>('payments');
  const { data: expenses, add: addExpense, update: updateExpense, remove: deleteExpense } = useFirestore<Expense>('expenses');
  const { data: receivables, add: addReceivable, update: updateReceivable } = useFirestore<Receivable>('receivables');
  const { data: tasks, add: addTask, update: updateTask, remove: deleteTask } = useFirestore<Task>('tasks');
  const { data: sites, add: addSite, update: updateSite } = useFirestore<Site>('sites');
  const { data: labour, add: addLabour, update: updateLabour } = useFirestore<LabourWorker>('labour');
  const { data: clients, add: addClient } = useFirestore<Client>('clients');
  const { data: deals, add: addDeal, update: updateDeal } = useFirestore<Deal>('deals');
  const { data: diary, add: addDiaryEntry, update: updateDiaryEntry } = useFirestore<DiaryEntry>('diary');

  // Load sheet data on mount
  useEffect(() => {
    fetchFromSheet('Main!A2:J1000').then(data => {
      if (data) setSheetData(data);
    });
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      fetchFromSheet('Main!A1:J1000').then((data) => {
        if (data && Array.isArray(data)) setSheetData(data);
      });
    }, 120000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const clearHistory = () => {
    const init: Message = {
      role: 'ai',
      text: 'Chat clear ho gaya! Kya help chahiye?',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([init]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([init]));
  };

  const getContext = () => buildFullContext({
    expenses, payments, receivables, tasks, sites,
    labour, clients, deals, sheetData, diary,
  });

  // ─── Tool Executor ──────────────────────────────────────────────────────────
  const executeTool = async (name: string, args: any): Promise<string> => {
    const today = new Date().toISOString().split('T')[0];

    switch (name) {
      // EXPENSES
      case 'addExpense': {
        await addExpense({
          amount: args.amount,
          category: args.category,
          partyName: args.partyName || '',
          siteId: args.siteId || '',
          notes: args.notes || 'Added via AI',
          date: args.date || today,
        } as any);
        return `✅ Expense added: ₹${args.amount} | ${args.category} | ${args.partyName || '-'}`;
      }
      case 'updateExpense': {
        const { id, ...rest } = args;
        await updateExpense(id, rest);
        return `✅ Expense [${id}] updated`;
      }
      case 'deleteExpense': {
        await deleteExpense(args.id);
        return `🗑️ Expense [${args.id}] deleted`;
      }

      // PAYMENTS
      case 'addPayment': {
        await addPayment({
          amount: args.amount,
          category: args.category || 'Payment Received',
          partyName: args.partyName,
          siteId: args.siteId || '',
          notes: args.notes || 'Added via AI',
          date: args.date || today,
        } as any);
        return `✅ Payment added: ₹${args.amount} from ${args.partyName}`;
      }
      case 'updatePayment': {
        const { id, ...rest } = args;
        await updatePayment(id, rest);
        return `✅ Payment [${id}] updated`;
      }
      case 'deletePayment': {
        await deletePayment(args.id);
        return `🗑️ Payment [${args.id}] deleted`;
      }

      // TASKS
      case 'addTask': {
        await addTask({
          title: args.title,
          priority: args.priority,
          dueDate: args.dueDate || today,
          status: 'Pending',
          notes: args.notes || 'Added via AI',
        } as any);
        return `✅ Task added: "${args.title}" (${args.priority})`;
      }
      case 'updateTask': {
        const { id, ...rest } = args;
        await updateTask(id, rest);
        return `✅ Task [${id}] updated`;
      }
      case 'deleteTask': {
        await deleteTask(args.id);
        return `🗑️ Task [${args.id}] deleted`;
      }

      // RECEIVABLES
      case 'addReceivable': {
        await addReceivable({
          partyName: args.partyName,
          amount: args.amount,
          dueDate: args.dueDate,
          amountCollected: 0,
          status: 'Pending',
          notes: args.notes || 'Added via AI',
        } as any);
        return `✅ Receivable added: ₹${args.amount} from ${args.partyName}`;
      }
      case 'updateReceivable': {
        const { id, ...rest } = args;
        await updateReceivable(id, rest);
        return `✅ Receivable [${id}] updated`;
      }
      case 'syncReceivablesFromSites': {
        const result = await upsertReceivablesFromSites(sites as Site[], receivables as Receivable[], addReceivable as any, updateReceivable as any);
        return `✅ Receivables synced from sites. Added: ${result.added}, Updated: ${result.updated}.`;
      }

      // SITES
      case 'addSite': {
        await addSite({
          name: args.name,
          location: args.location,
          status: args.status || 'Active',
          budget: args.budget || 0,
          progress: 0,
          startDate: args.startDate || today,
          notes: args.notes || '',
        } as any);
        return `✅ Site added: ${args.name} (${args.location})`;
      }
      case 'updateSite': {
        const { id, ...rest } = args;
        await updateSite(id, rest);
        return `✅ Site [${id}] updated`;
      }
      case 'syncSitesFromContracts': {
        const clientName = args.clientName || 'Surgical wholesale mart';
        for (const template of DEFAULT_SITE_TEMPLATES) {
          const existing = sites.find((s) => s.name.toLowerCase() === template.name.toLowerCase());
          const { total, received, pending } = buildSiteFinancials(
            {
              ...template,
              clientName,
            },
            payments
          );
          const payload: Partial<Site> = {
            name: template.name,
            location: template.location,
            clientName,
            clientId: clientName,
            projectCount: template.projectCount,
            baseProjectCost: template.baseProjectCost,
            extraWorkCost: template.extraWorkCost,
            workType: template.workType,
            budget: total,
            amountReceived: received,
            amountPending: pending,
            status: pending > 0 ? 'Active' : 'Completed',
            progress: total > 0 ? Math.min(Math.round((received / total) * 100), 100) : 0,
            notes: `AI sync: total ₹${total.toLocaleString('en-IN')} | received ₹${received.toLocaleString('en-IN')} | pending ₹${pending.toLocaleString('en-IN')}`,
          };

          if (existing?.id) {
            await updateSite(existing.id, payload);
          } else {
            await addSite(payload as Site);
          }
        }
        return `✅ Contract sites synced for client ${clientName}`;
      }

      // LABOUR
      case 'addLabour': {
        await addLabour({
          name: args.name,
          phone: args.phone || '',
          dailyWage: args.dailyWage,
          balance: 0,
          status: 'Active',
          notes: args.notes || '',
        } as any);
        return `✅ Labour added: ${args.name} (₹${args.dailyWage}/day)`;
      }
      case 'updateLabour': {
        const { id, ...rest } = args;
        await updateLabour(id, rest);
        return `✅ Labour [${id}] updated`;
      }
      case 'syncLabourFromSheet': {
        const mode = args.mode || 'all';
        const rows = await fetchFromSheet('Main!A1:J2000');
        if (!rows || rows.length === 0) return '⚠️ Sheet data not available for labour sync.';
        const labourWorkers = labour as LabourWorker[];

        const normalized = (value: string) => (value || '').trim().toLowerCase();
        const parseAmount = (value: string) => {
          const num = Number.parseFloat(String(value || '').replace(/[,₹\s]/g, ''));
          return Number.isFinite(num) ? num : 0;
        };

        let dataRows: string[][] = rows;
        if (Array.isArray(rows[0])) {
          const first = rows[0].map((v: string) => normalized(v));
          if (first.includes('labour') || first.includes('type')) {
            dataRows = rows.slice(1);
          }
        }

        const labourTotals: Record<string, { paid: number; work: string }> = {};

        for (const row of dataRows) {
          const type = normalized(row[1] || '');
          const category = normalized(row[3] || '');
          const labourName = (row[5] || '').trim();
          if (!labourName) continue;

          const isLabourCategory = category.includes('labour') || category.includes('contract');
          const shouldTrack = mode === 'all' ? isLabourCategory : mode === 'contract' ? category.includes('contract') || category.includes('labour') : isLabourCategory;
          if (!shouldTrack) continue;

          if (!labourTotals[labourName]) labourTotals[labourName] = { paid: 0, work: row[3] || '' };
          if (type === 'expense') {
            labourTotals[labourName].paid += parseAmount(row[2] || '0');
          }
        }

        const existingByName = new Map<string, LabourWorker>(
          labourWorkers.map((l) => [normalized(l.name), l] as [string, LabourWorker])
        );
        let created = 0;
        let updated = 0;

        for (const [name, values] of Object.entries(labourTotals)) {
          const existing = existingByName.get(normalized(name));
          const payload: Partial<LabourWorker> = {
            name,
            status: 'Active',
            dailyWage: existing?.dailyWage || 0,
            balance: values.paid,
            notes: `${values.work || 'Labour/Contract'} | Synced via AI from Google Sheet`,
          };

          if (existing?.id) {
            await updateLabour(existing.id, payload);
            updated++;
          } else {
            await addLabour(payload as LabourWorker);
            created++;
          }
        }

        return `✅ Labour sync complete. ${created} created, ${updated} updated.`;
      }

      // CLIENTS
      case 'addClient': {
        await addClient({
          name: args.name,
          company: args.company || '',
          phone: args.phone || '',
          email: args.email || '',
          address: args.address || '',
          notes: args.notes || '',
        } as any);
        return `✅ Client added: ${args.name}`;
      }

      // DEALS
      case 'addDeal': {
        await addDeal({
          title: args.title,
          clientName: args.clientName,
          amount: args.amount,
          stage: args.stage,
          notes: args.notes || '',
        } as any);
        return `✅ Deal added: "${args.title}" ₹${args.amount} (${args.stage})`;
      }
      case 'updateDeal': {
        const { id, ...rest } = args;
        await updateDeal(id, rest);
        return `✅ Deal [${id}] updated`;
      }

      // DIARY / JOURNAL
      case 'addDiaryEntry': {
        await addDiaryEntry({
          content: args.content,
          mood: args.mood || 'Neutral',
          date: args.date || today,
        } as any);
        return `📔 Diary entry saved for ${args.date || today} (Mood: ${args.mood || 'Neutral'})`;
      }
      case 'updateDiaryEntry': {
        const { id, ...rest } = args;
        await updateDiaryEntry(id, rest);
        return `📔 Diary entry [${id}] updated`;
      }

      // QUERY (AI already has context, just acknowledge)
      case 'queryData': {
        return `📊 Data for "${args.collection}" is available in context above.`;
      }

      default:
        return `⚠️ Unknown tool: ${name}`;
    }
  };

  // ─── Send Message ───────────────────────────────────────────────────────────
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
        maxTokens: model === 'gemini-3.1-pro-preview' ? 1200 : 800,
        history: messages.map(m => ({ role: m.role, text: m.text })),
      });

      let aiText = res.text || '';
      const toolResults: string[] = [];

      if (res.functionCalls?.length) {
        for (const call of res.functionCalls) {
          try {
            const result = await executeTool(call.name, call.args || {});
            toolResults.push(result);
          } catch (err: any) {
            toolResults.push(`❌ ${call.name} failed: ${err.message}`);
          }
        }
      }

      if (toolResults.length > 0) {
        aiText = (aiText ? aiText + '\n\n' : '') + toolResults.join('\n');
      }

      setMessages(prev => [...prev, {
        role: 'ai',
        text: aiText || 'Done!',
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        model: res.model,
      }]);
    } catch (err: any) {
      let errorText = '❌ AI abhi available nahi hai. Network ya server issue ho sakta hai.';
      if (err.message === 'INVALID_API_KEY') errorText = '❌ Invalid API Key! Settings mein jaakar sahi key enter karein.';
      else if (err.message === 'RATE_LIMIT') errorText = '⚠️ System thoda busy hai ya limit hit ho gayi hai. Thodi der baad try karo ya Settings mein flash model switch karo.';
      setMessages(prev => [...prev, { role: 'ai', text: errorText, time }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] lg:h-[calc(100vh-120px)]">
      <PageHeader
        title="AI Assistant"
        subtitle="Full data access · Add, update, delete anything"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={model}
              onChange={e => setModel(e.target.value as GeminiModel)}
              className="bg-[#111520] border border-[#1e2a40] text-xs text-gray-300 rounded-lg px-3 py-2 outline-none focus:border-[#00d4aa] transition"
            >
              <option value="gemini-2.0-flash">🚀 Flash 2.0 (Fast & Smart)</option>
              <option value="gemini-3.1-flash-lite-preview">⚡ Flash-Lite (1000/day)</option>
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
            className="flex-shrink-0 text-xs border border-[#1e2a40] bg-[#111520] text-gray-400 px-4 py-2 rounded-full hover:border-[#00d4aa] hover:text-[#00d4aa] transition font-semibold flex items-center gap-2 cursor-pointer"
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
          placeholder="Kuch bhi pucho ya karo — data add, update, delete, analysis..."
          className="w-full bg-[#161c2a] border border-[#1e2a40] rounded-2xl pl-4 pr-14 py-4 text-sm text-white outline-none focus:border-[#00d4aa] transition placeholder-gray-600 shadow-xl"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#00d4aa] text-[#07090f] p-2.5 rounded-xl font-bold hover:bg-[#00b894] transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
