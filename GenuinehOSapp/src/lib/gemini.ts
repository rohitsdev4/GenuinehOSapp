import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY;

export type GeminiModel =
  | 'gemini-3.1-flash-lite-preview'
  | 'gemini-3-flash-preview'
  | 'gemini-3.1-pro-preview'

const SYSTEM_PROMPT = `
You are GenuineOS AI — the all-in-one business brain for Rohit Kumar, CEO of Genuine Hospi Enterprises, Patna, Bihar, India.
Business: Hospital beds, modular operation theaters (OT), medical gas pipelines, HVAC for hospitals.

You have FULL access to all business data and can READ, ADD, UPDATE, and DELETE any records.

=== YOUR SKILL SET ===

1. BUSINESS ANALYSIS & REPORTING
   - P&L analysis, cash flow, expense breakdowns by category/site/month
   - Revenue trends, profitability per site, cost per project
   - Compare this month vs last month, identify anomalies
   - Receivables aging analysis, collection efficiency

2. MARKET RESEARCH & STRATEGY
   - Indian hospital infrastructure market insights (Bihar, UP, Punjab, Jharkhand focus)
   - Government hospital tenders (PMAY, Ayushman Bharat, state health missions)
   - Competitor analysis for OT manufacturers, medical gas suppliers
   - Pricing strategy for hospital beds, OT packages, gas pipeline projects
   - Identify new market opportunities in Tier 2/3 cities

3. FINANCIAL MANAGEMENT
   - GST implications for medical equipment (5% vs 12% vs 18%)
   - Working capital management, cash flow forecasting
   - Labour cost optimization, material procurement advice
   - Invoice and payment follow-up strategies
   - Loan/EMI management advice

4. PROJECT MANAGEMENT
   - Site progress tracking, milestone planning
   - Labour scheduling and wage management
   - Material procurement planning
   - Risk identification for ongoing projects
   - Timeline estimation for OT installations

5. SALES & DEAL COACHING
   - Hospital administrator negotiation tactics
   - Proposal writing guidance for government tenders
   - Follow-up strategies for pending deals
   - Upselling from beds to full OT packages
   - Client relationship management

6. PERSONAL ASSISTANT
   - Daily action plans and priority setting
   - Meeting preparation and agenda creation
   - Travel planning for site visits
   - Reminder and task management
   - Email/message drafting in Hindi/English

7. JOURNAL & REFLECTION
   - Help write daily business diary entries
   - Reflect on decisions, lessons learned
   - Track personal and business goals
   - Mood and energy tracking
   - Weekly/monthly review summaries

8. MOTIVATION & MINDSET
   - Entrepreneurship coaching in Indian context
   - Stress management for business owners
   - Work-life balance advice
   - Success stories from Indian MSMEs
   - Practical wisdom for Bihar/UP business environment

=== RESPONSE RULES ===
- Always respond in Hinglish (natural Hindi + English mix, like how Rohit actually talks)
- Be direct, practical, and brief — no corporate jargon
- Max 5 bullet points unless more detail explicitly requested
- Always consider Indian business context (GST, Bihar/UP market, government tenders)
- Be encouraging but realistic — no false promises
- When user asks to add/update/delete data, use the provided tools immediately
- After any data operation, confirm what was done
- When user asks about data (totals, summaries, lists), analyze the context provided
- For journal entries, help write thoughtful, reflective content
- Always end with one actionable next step when giving advice
`;

export interface Message {
  role: 'user' | 'ai';
  text: string;
}

interface GeminiRequest {
  prompt: string;
  model?: GeminiModel;
  context?: string;
  systemInstruction?: string;
  maxTokens?: number;
  history?: Message[];
}

interface GeminiResponse {
  text: string;
  model: string;
  cached: boolean;
  functionCalls?: any[];
}

// ─── Tool Declarations ────────────────────────────────────────────────────────

const addExpenseDeclaration: FunctionDeclaration = {
  name: "addExpense",
  description: "Add a new expense record to the database.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      amount: { type: Type.NUMBER, description: "The amount of the expense." },
      category: { type: Type.STRING, description: "Category: Travel, Food, Labour Payment, Daily Expense, Other, Material Purchased." },
      partyName: { type: Type.STRING, description: "Name of person/company paid to." },
      siteId: { type: Type.STRING, description: "Site name where expense occurred." },
      notes: { type: Type.STRING, description: "Additional notes." },
      date: { type: Type.STRING, description: "Date in YYYY-MM-DD format. Defaults to today." },
    },
    required: ["amount", "category"],
  },
};

const updateExpenseDeclaration: FunctionDeclaration = {
  name: "updateExpense",
  description: "Update an existing expense record by its ID.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "The ID of the expense to update." },
      amount: { type: Type.NUMBER, description: "New amount." },
      category: { type: Type.STRING, description: "New category." },
      partyName: { type: Type.STRING, description: "New party name." },
      siteId: { type: Type.STRING, description: "New site." },
      notes: { type: Type.STRING, description: "New notes." },
      date: { type: Type.STRING, description: "New date YYYY-MM-DD." },
    },
    required: ["id"],
  },
};

const deleteExpenseDeclaration: FunctionDeclaration = {
  name: "deleteExpense",
  description: "Delete an expense record by its ID.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "The ID of the expense to delete." },
    },
    required: ["id"],
  },
};

const addPaymentDeclaration: FunctionDeclaration = {
  name: "addPayment",
  description: "Add a new payment received record to the database.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      amount: { type: Type.NUMBER, description: "Amount received." },
      category: { type: Type.STRING, description: "Payment method: Cash, Bank Transfer, UPI, Cheque." },
      partyName: { type: Type.STRING, description: "Client or party who paid." },
      siteId: { type: Type.STRING, description: "Site or project name." },
      notes: { type: Type.STRING, description: "Additional notes." },
      date: { type: Type.STRING, description: "Date in YYYY-MM-DD format. Defaults to today." },
    },
    required: ["amount", "partyName"],
  },
};

const updatePaymentDeclaration: FunctionDeclaration = {
  name: "updatePayment",
  description: "Update an existing payment record by its ID.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "The ID of the payment to update." },
      amount: { type: Type.NUMBER },
      category: { type: Type.STRING },
      partyName: { type: Type.STRING },
      siteId: { type: Type.STRING },
      notes: { type: Type.STRING },
      date: { type: Type.STRING },
    },
    required: ["id"],
  },
};

const deletePaymentDeclaration: FunctionDeclaration = {
  name: "deletePayment",
  description: "Delete a payment record by its ID.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "The ID of the payment to delete." },
    },
    required: ["id"],
  },
};

const addTaskDeclaration: FunctionDeclaration = {
  name: "addTask",
  description: "Add a new task to the to-do list.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Task title." },
      priority: { type: Type.STRING, enum: ["Low", "Medium", "High"], description: "Priority level." },
      dueDate: { type: Type.STRING, description: "Due date YYYY-MM-DD." },
      notes: { type: Type.STRING, description: "Additional notes." },
    },
    required: ["title", "priority"],
  },
};

const updateTaskDeclaration: FunctionDeclaration = {
  name: "updateTask",
  description: "Update an existing task by its ID.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "Task ID." },
      title: { type: Type.STRING },
      priority: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
      status: { type: Type.STRING, enum: ["Pending", "In Progress", "Completed"] },
      dueDate: { type: Type.STRING },
      notes: { type: Type.STRING },
    },
    required: ["id"],
  },
};

const deleteTaskDeclaration: FunctionDeclaration = {
  name: "deleteTask",
  description: "Delete a task by its ID.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "Task ID." },
    },
    required: ["id"],
  },
};

const addReceivableDeclaration: FunctionDeclaration = {
  name: "addReceivable",
  description: "Add a new receivable (money to be collected) record.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      partyName: { type: Type.STRING, description: "Party who owes money." },
      amount: { type: Type.NUMBER, description: "Total amount to collect." },
      dueDate: { type: Type.STRING, description: "Expected collection date YYYY-MM-DD." },
      notes: { type: Type.STRING },
    },
    required: ["partyName", "amount", "dueDate"],
  },
};

const updateReceivableDeclaration: FunctionDeclaration = {
  name: "updateReceivable",
  description: "Update a receivable record (e.g. mark partial payment, update status).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "Receivable ID." },
      partyName: { type: Type.STRING },
      amount: { type: Type.NUMBER },
      amountCollected: { type: Type.NUMBER, description: "Amount collected so far." },
      status: { type: Type.STRING, enum: ["Pending", "Partial", "Collected"] },
      dueDate: { type: Type.STRING },
      notes: { type: Type.STRING },
    },
    required: ["id"],
  },
};

const addSiteDeclaration: FunctionDeclaration = {
  name: "addSite",
  description: "Add a new site/project.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Site name." },
      location: { type: Type.STRING, description: "Location/city." },
      status: { type: Type.STRING, enum: ["Active", "Completed", "On Hold"] },
      budget: { type: Type.NUMBER, description: "Project budget." },
      startDate: { type: Type.STRING, description: "Start date YYYY-MM-DD." },
      notes: { type: Type.STRING },
    },
    required: ["name", "location"],
  },
};

const updateSiteDeclaration: FunctionDeclaration = {
  name: "updateSite",
  description: "Update a site/project record.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "Site ID." },
      name: { type: Type.STRING },
      location: { type: Type.STRING },
      status: { type: Type.STRING, enum: ["Active", "Completed", "On Hold"] },
      budget: { type: Type.NUMBER },
      progress: { type: Type.NUMBER, description: "Progress percentage 0-100." },
      notes: { type: Type.STRING },
    },
    required: ["id"],
  },
};

const addLabourDeclaration: FunctionDeclaration = {
  name: "addLabour",
  description: "Add a new labour worker record.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Worker name." },
      phone: { type: Type.STRING, description: "Phone number." },
      dailyWage: { type: Type.NUMBER, description: "Daily wage amount." },
      notes: { type: Type.STRING },
    },
    required: ["name", "dailyWage"],
  },
};

const updateLabourDeclaration: FunctionDeclaration = {
  name: "updateLabour",
  description: "Update a labour worker record.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "Labour ID." },
      name: { type: Type.STRING },
      phone: { type: Type.STRING },
      dailyWage: { type: Type.NUMBER },
      balance: { type: Type.NUMBER, description: "Current balance owed." },
      status: { type: Type.STRING, enum: ["Active", "Inactive"] },
      notes: { type: Type.STRING },
    },
    required: ["id"],
  },
};

const addClientDeclaration: FunctionDeclaration = {
  name: "addClient",
  description: "Add a new client record.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Client name." },
      company: { type: Type.STRING, description: "Company/hospital name." },
      phone: { type: Type.STRING },
      email: { type: Type.STRING },
      address: { type: Type.STRING },
      notes: { type: Type.STRING },
    },
    required: ["name"],
  },
};

const addDealDeclaration: FunctionDeclaration = {
  name: "addDeal",
  description: "Add a new deal/lead.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Deal title." },
      clientName: { type: Type.STRING, description: "Client name." },
      amount: { type: Type.NUMBER, description: "Deal value." },
      stage: { type: Type.STRING, enum: ["Lead", "Negotiation", "Won", "Lost"] },
      notes: { type: Type.STRING },
    },
    required: ["title", "clientName", "amount", "stage"],
  },
};

const updateDealDeclaration: FunctionDeclaration = {
  name: "updateDeal",
  description: "Update a deal record.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "Deal ID." },
      title: { type: Type.STRING },
      clientName: { type: Type.STRING },
      amount: { type: Type.NUMBER },
      stage: { type: Type.STRING, enum: ["Lead", "Negotiation", "Won", "Lost"] },
      notes: { type: Type.STRING },
    },
    required: ["id"],
  },
};

const queryDataDeclaration: FunctionDeclaration = {
  name: "queryData",
  description: "Query and summarize data from the database. Use this when user asks for totals, summaries, lists, or analysis of specific data.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      collection: { 
        type: Type.STRING, 
        enum: ["expenses", "payments", "receivables", "tasks", "sites", "labour", "clients", "deals"],
        description: "Which collection to query." 
      },
      filter: { type: Type.STRING, description: "Optional filter description (e.g. 'this month', 'by site Ludhiana', 'pending only')." },
    },
    required: ["collection"],
  },
};

const addDiaryEntryDeclaration: FunctionDeclaration = {
  name: "addDiaryEntry",
  description: "Add a new diary/journal entry. Use this when user wants to record thoughts, reflections, daily events, or asks AI to write a journal entry for them.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      content: { type: Type.STRING, description: "The full diary entry content. Can be AI-written based on user's day/context." },
      mood: { type: Type.STRING, description: "Mood: Happy, Motivated, Stressed, Neutral, Tired, Excited, Worried, Grateful." },
      date: { type: Type.STRING, description: "Date YYYY-MM-DD. Defaults to today." },
    },
    required: ["content"],
  },
};

const updateDiaryEntryDeclaration: FunctionDeclaration = {
  name: "updateDiaryEntry",
  description: "Update an existing diary entry.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "Diary entry ID." },
      content: { type: Type.STRING },
      mood: { type: Type.STRING },
      date: { type: Type.STRING },
    },
    required: ["id"],
  },
};

export const ALL_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  addExpenseDeclaration, updateExpenseDeclaration, deleteExpenseDeclaration,
  addPaymentDeclaration, updatePaymentDeclaration, deletePaymentDeclaration,
  addTaskDeclaration, updateTaskDeclaration, deleteTaskDeclaration,
  addReceivableDeclaration, updateReceivableDeclaration,
  addSiteDeclaration, updateSiteDeclaration,
  addLabourDeclaration, updateLabourDeclaration,
  addClientDeclaration,
  addDealDeclaration, updateDealDeclaration,
  addDiaryEntryDeclaration, updateDiaryEntryDeclaration,
  queryDataDeclaration,
];

// ─── Main API Call ────────────────────────────────────────────────────────────

export async function callGemini({
  prompt,
  model = 'gemini-3.1-flash-lite-preview',
  context = '',
  systemInstruction = SYSTEM_PROMPT,
  maxTokens = 800,
  history = [],
}: GeminiRequest): Promise<GeminiResponse> {

  const localKey = typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : null;
  const ai = new GoogleGenAI({ apiKey: localKey || API_KEY || '' });

  let fullPrompt = context ? `${context}\n\n` : '';
  
  if (history.length > 0) {
    fullPrompt += '=== Chat History ===\n';
    history.slice(-6).forEach(msg => {
      fullPrompt += `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.text}\n`;
    });
    fullPrompt += '\n';
  }

  fullPrompt += `User Query: ${prompt}`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
      config: {
        systemInstruction: systemInstruction,
        maxOutputTokens: maxTokens,
        temperature: 0.7,
        tools: [{ functionDeclarations: ALL_TOOL_DECLARATIONS }],
      },
    });

    const text = response.text || '';
    const functionCalls = response.functionCalls;
    
    return { text, model, cached: false, functionCalls };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const errorMessage = error.message || String(error);
    if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('invalid API key')) {
      throw new Error('INVALID_API_KEY');
    }
    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RATE_LIMIT')) {
      throw new Error('RATE_LIMIT');
    }
    throw error;
  }
}

export async function testGeminiConnection(key: string): Promise<boolean> {
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'Hi',
      config: { maxOutputTokens: 5 }
    });
    return true;
  } catch (error) {
    console.error("Gemini Test Connection Error:", error);
    return false;
  }
}

// ─── Context Builder ──────────────────────────────────────────────────────────

export function buildFullContext(data: {
  expenses?: Array<any>;
  payments?: Array<any>;
  receivables?: Array<any>;
  tasks?: Array<any>;
  sites?: Array<any>;
  labour?: Array<any>;
  clients?: Array<any>;
  deals?: Array<any>;
  sheetData?: Array<any>;
  diary?: Array<any>;
}): string {
  const lines: string[] = ['=== FULL BUSINESS DATA CONTEXT ==='];
  const today = new Date();
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();

  const isThisMonth = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  };

  // Payments summary
  if (data.payments?.length) {
    const monthPayments = data.payments.filter(p => isThisMonth(p.date));
    const totalIncome = data.payments.reduce((s, p) => s + (p.amount || 0), 0);
    const monthIncome = monthPayments.reduce((s, p) => s + (p.amount || 0), 0);
    lines.push(`\n--- PAYMENTS (${data.payments.length} total) ---`);
    lines.push(`Total Income: ₹${totalIncome.toLocaleString('en-IN')}`);
    lines.push(`This Month Income: ₹${monthIncome.toLocaleString('en-IN')}`);
    // Last 5 payments
    data.payments.slice(0, 5).forEach(p => {
      lines.push(`  [${p.id}] ${p.date} | ₹${p.amount} | ${p.partyName} | ${p.siteId || '-'} | ${p.notes || ''}`);
    });
    if (data.payments.length > 5) lines.push(`  ... and ${data.payments.length - 5} more`);
  }

  // Expenses summary
  if (data.expenses?.length) {
    const monthExpenses = data.expenses.filter(e => isThisMonth(e.date));
    const totalExpenses = data.expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const monthExpTotal = monthExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    lines.push(`\n--- EXPENSES (${data.expenses.length} total) ---`);
    lines.push(`Total Expenses: ₹${totalExpenses.toLocaleString('en-IN')}`);
    lines.push(`This Month Expenses: ₹${monthExpTotal.toLocaleString('en-IN')}`);
    data.expenses.slice(0, 5).forEach(e => {
      lines.push(`  [${e.id}] ${e.date} | ₹${e.amount} | ${e.category} | ${e.partyName || '-'} | ${e.siteId || '-'} | ${e.notes || ''}`);
    });
    if (data.expenses.length > 5) lines.push(`  ... and ${data.expenses.length - 5} more`);
  }

  // Receivables
  if (data.receivables?.length) {
    const pending = data.receivables.filter(r => r.status !== 'Collected');
    const pendingTotal = pending.reduce((s, r) => s + ((r.amount || 0) - (r.amountCollected || 0)), 0);
    lines.push(`\n--- RECEIVABLES (${data.receivables.length} total, ${pending.length} pending) ---`);
    lines.push(`Pending Amount: ₹${pendingTotal.toLocaleString('en-IN')}`);
    data.receivables.slice(0, 5).forEach(r => {
      lines.push(`  [${r.id}] ${r.partyName} | Total: ₹${r.amount} | Collected: ₹${r.amountCollected || 0} | Status: ${r.status} | Due: ${r.dueDate}`);
    });
  }

  // Tasks
  if (data.tasks?.length) {
    const pending = data.tasks.filter(t => t.status !== 'Completed');
    lines.push(`\n--- TASKS (${pending.length} pending of ${data.tasks.length} total) ---`);
    pending.slice(0, 5).forEach(t => {
      lines.push(`  [${t.id}] ${t.title} | ${t.priority} | ${t.status} | Due: ${t.dueDate || 'N/A'}`);
    });
  }

  // Sites
  if (data.sites?.length) {
    const active = data.sites.filter(s => s.status === 'Active');
    lines.push(`\n--- SITES (${active.length} active of ${data.sites.length} total) ---`);
    data.sites.slice(0, 5).forEach(s => {
      lines.push(`  [${s.id}] ${s.name} | ${s.location} | ${s.status} | Progress: ${s.progress || 0}%`);
    });
  }

  // Labour
  if (data.labour?.length) {
    lines.push(`\n--- LABOUR (${data.labour.length} workers) ---`);
    data.labour.forEach(l => {
      lines.push(`  [${l.id}] ${l.name} | Wage: ₹${l.dailyWage}/day | Balance: ₹${l.balance || 0} | ${l.status}`);
    });
  }

  // Clients
  if (data.clients?.length) {
    lines.push(`\n--- CLIENTS (${data.clients.length} total) ---`);
    data.clients.slice(0, 5).forEach(c => {
      lines.push(`  [${c.id}] ${c.name} | ${c.company || '-'} | ${c.phone || '-'}`);
    });
  }

  // Deals
  if (data.deals?.length) {
    const active = data.deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost');
    const pipeline = active.reduce((s, d) => s + (d.amount || 0), 0);
    lines.push(`\n--- DEALS (${active.length} active, pipeline ₹${pipeline.toLocaleString('en-IN')}) ---`);
    data.deals.slice(0, 5).forEach(d => {
      lines.push(`  [${d.id}] ${d.title} | ${d.clientName} | ₹${d.amount} | ${d.stage}`);
    });
  }

  // Diary entries
  if (data.diary?.length) {
    lines.push(`\n--- DIARY / JOURNAL (${data.diary.length} entries) ---`);
    data.diary.slice(0, 3).forEach(d => {
      lines.push(`  [${d.id}] ${d.date} | Mood: ${d.mood || 'N/A'} | ${(d.content || '').substring(0, 80)}...`);
    });
  }

  // Sheet data summary
  if (data.sheetData?.length) {
    lines.push(`\n--- GOOGLE SHEET DATA (${data.sheetData.length} rows, read-only) ---`);
    lines.push(`Sheet has data from Telegram bot entries. First 3 rows:`);
    data.sheetData.slice(0, 3).forEach(row => {
      lines.push(`  ${row.join(' | ')}`);
    });
  }

  // LocalStorage keys summary
  if (typeof window !== 'undefined') {
    const lsKeys = Object.keys(localStorage).filter(k => !k.startsWith('genuineos_chat'));
    if (lsKeys.length > 0) {
      lines.push(`\n--- LOCAL STORAGE ---`);
      lsKeys.forEach(k => {
        const val = localStorage.getItem(k);
        if (val && val.length < 100) lines.push(`  ${k}: ${val}`);
        else if (val) lines.push(`  ${k}: [${val.length} chars]`);
      });
    }
  }

  return lines.join('\n');
}
