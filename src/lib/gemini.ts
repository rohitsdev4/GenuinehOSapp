import OpenAI from "openai";

const API_KEY = process.env.OPENROUTER_API_KEY;

export type GeminiModel =
  | 'nvidia/llama-3.1-nemotron-70b-instruct:free'
  | 'google/gemini-2.0-flash-lite-preview-02-05:free'
  | 'qwen/qwen-2.5-coder-32b-instruct:free'
  | 'zhipuai/glm-4-9b-chat:free'
  | 'meta-llama/llama-3-8b-instruct:free';

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
  model?: GeminiModel | string;
  context?: string;
  systemInstruction?: string;
  maxTokens?: number;
  history?: Message[];
}

interface GeminiResponse {
  text: string;
  model: string;
  cached: boolean;
  functionCalls?: { name: string, args: any }[];
}

// ─── Tool Declarations ────────────────────────────────────────────────────────

const addExpenseDeclaration: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "addExpense",
    description: "Add a new expense record to the database.",
    parameters: {
      type: "object",
      properties: {
        amount: { type: "number", description: "The amount of the expense." },
        category: { type: "string", description: "Category: Travel, Food, Labour Payment, Daily Expense, Other, Material Purchased." },
        partyName: { type: "string", description: "Name of person/company paid to." },
        siteId: { type: "string", description: "Site name where expense occurred." },
        notes: { type: "string", description: "Additional notes." },
        date: { type: "string", description: "Date in YYYY-MM-DD format. Defaults to today." },
      },
      required: ["amount", "category"],
      additionalProperties: false,
    },
  }
};

const updateExpenseDeclaration: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "updateExpense",
    description: "Update an existing expense record by its ID.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "The ID of the expense to update." },
        amount: { type: "number", description: "New amount." },
        category: { type: "string", description: "New category." },
        partyName: { type: "string", description: "New party name." },
        siteId: { type: "string", description: "New site." },
        notes: { type: "string", description: "New notes." },
        date: { type: "string", description: "New date YYYY-MM-DD." },
      },
      required: ["id"],
      additionalProperties: false,
    },
  }
};

const deleteExpenseDeclaration: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "deleteExpense",
    description: "Delete an expense record by its ID.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "The ID of the expense to delete." },
      },
      required: ["id"],
      additionalProperties: false,
    },
  }
};

const addPaymentDeclaration: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "addPayment",
    description: "Add a new payment received record to the database.",
    parameters: {
      type: "object",
      properties: {
        amount: { type: "number", description: "Amount received." },
        category: { type: "string", description: "Payment method: Cash, Bank Transfer, UPI, Cheque." },
        partyName: { type: "string", description: "Client or party who paid." },
        siteId: { type: "string", description: "Site or project name." },
        notes: { type: "string", description: "Additional notes." },
        date: { type: "string", description: "Date in YYYY-MM-DD format. Defaults to today." },
      },
      required: ["amount", "partyName"],
      additionalProperties: false,
    },
  }
};

const updatePaymentDeclaration: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "updatePayment",
    description: "Update an existing payment record by its ID.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "The ID of the payment to update." },
        amount: { type: "number" },
        category: { type: "string" },
        partyName: { type: "string" },
        siteId: { type: "string" },
        notes: { type: "string" },
        date: { type: "string" },
      },
      required: ["id"],
      additionalProperties: false,
    },
  }
};

const deletePaymentDeclaration: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "deletePayment",
    description: "Delete a payment record by its ID.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "The ID of the payment to delete." },
      },
      required: ["id"],
      additionalProperties: false,
    },
  }
};

const addTaskDeclaration: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "addTask",
    description: "Add a new task to the to-do list.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Task title." },
        priority: { type: "string", enum: ["Low", "Medium", "High"], description: "Priority level." },
        dueDate: { type: "string", description: "Due date YYYY-MM-DD." },
        notes: { type: "string", description: "Additional notes." },
      },
      required: ["title", "priority"],
      additionalProperties: false,
    },
  }
};

const updateTaskDeclaration: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "updateTask",
    description: "Update an existing task by its ID.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Task ID." },
        title: { type: "string" },
        priority: { type: "string", enum: ["Low", "Medium", "High"] },
        status: { type: "string", enum: ["Pending", "In Progress", "Completed"] },
        dueDate: { type: "string" },
        notes: { type: "string" },
      },
      required: ["id"],
      additionalProperties: false,
    },
  }
};

const deleteTaskDeclaration: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "deleteTask",
    description: "Delete a task by its ID.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Task ID." },
      },
      required: ["id"],
      additionalProperties: false,
    },
  }
};

const addReceivableDeclaration: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "addReceivable",
    description: "Add a new receivable (money to be collected) record.",
    parameters: {
      type: "object",
      properties: {
        partyName: { type: "string", description: "Party who owes money." },
        amount: { type: "number", description: "Total amount to collect." },
        dueDate: { type: "string", description: "Expected collection date YYYY-MM-DD." },
        notes: { type: "string" },
      },
      required: ["partyName", "amount", "dueDate"],
      additionalProperties: false,
    },
  }
};

const updateReceivableDeclaration: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "updateReceivable",
    description: "Update a receivable record (e.g. mark partial payment, update status).",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Receivable ID." },
        partyName: { type: "string" },
        amount: { type: "number" },
        amountCollected: { type: "number", description: "Amount collected so far." },
        status: { type: "string", enum: ["Pending", "Partial", "Collected"] },
        dueDate: { type: "string" },
        notes: { type: "string" },
      },
      required: ["id"],
      additionalProperties: false,
    },
  }
};

const syncReceivablesFromSitesDeclaration: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "syncReceivablesFromSites",
    description: "Create or update receivables based on current pending amount from active sites.",
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  }
};

const addSiteDeclaration: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "addSite",
    description: "Add a new site/project.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Site name." },
        location: { type: "string", description: "Location/city." },
        status: { type: "string", enum: ["Active", "Completed", "On Hold"] },
        budget: { type: "number", description: "Project budget." },
        startDate: { type: "string", description: "Start date YYYY-MM-DD." },
        notes: { type: "string" },
      },
      required: ["name", "location"],
      additionalProperties: false,
    },
  }
};

const updateSiteDeclaration: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "updateSite",
    description: "Update a site/project record.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Site ID." },
        name: { type: "string" },
        location: { type: "string" },
        status: { type: "string", enum: ["Active", "Completed", "On Hold"] },
        budget: { type: "number" },
        progress: { type: "number", description: "Progress percentage 0-100." },
        notes: { type: "string" },
      },
      required: ["id"],
      additionalProperties: false,
    },
  }
};

const syncSitesFromContractsDeclaration: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "syncSitesFromContracts",
    description: "Auto-create or update standard contract sites with payment received and pending calculations.",
    parameters: {
      type: "object",
      properties: {
        clientName: { type: "string", description: "Client name for contract sites. Defaults to Surgical wholesale mart." },
      },
      additionalProperties: false,
    },
  }
};

const addLabourDeclaration: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "addLabour",
    description: "Add a new labour worker record.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Worker name." },
        phone: { type: "string", description: "Phone number." },
        dailyWage: { type: "number", description: "Daily wage amount." },
        notes: { type: "string" },
      },
      required: ["name", "dailyWage"],
      additionalProperties: false,
    },
  }
};

const updateLabourDeclaration: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "updateLabour",
    description: "Update a labour worker record.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Labour ID." },
        name: { type: "string" },
        phone: { type: "string" },
        dailyWage: { type: "number" },
        balance: { type: "number", description: "Current balance owed." },
        status: { type: "string", enum: ["Active", "Inactive"] },
        notes: { type: "string" },
      },
      required: ["id"],
      additionalProperties: false,
    },
  }
};

const syncLabourFromSheetDeclaration: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "syncLabourFromSheet",
    description: "Read Google Sheet rows and auto-update labour entries (including contract workers) with balances.",
    parameters: {
      type: "object",
      properties: {
        mode: { type: "string", enum: ["all", "contract", "active"], description: "Optional sync mode." },
      },
      additionalProperties: false,
    },
  }
};

const addClientDeclaration: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "addClient",
    description: "Add a new client record.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Client name." },
        company: { type: "string", description: "Company/hospital name." },
        phone: { type: "string" },
        email: { type: "string" },
        address: { type: "string" },
        notes: { type: "string" },
      },
      required: ["name"],
      additionalProperties: false,
    },
  }
};

const addDealDeclaration: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "addDeal",
    description: "Add a new deal/lead.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Deal title." },
        clientName: { type: "string", description: "Client name." },
        amount: { type: "number", description: "Deal value." },
        stage: { type: "string", enum: ["Lead", "Negotiation", "Won", "Lost"] },
        notes: { type: "string" },
      },
      required: ["title", "clientName", "amount", "stage"],
      additionalProperties: false,
    },
  }
};

const updateDealDeclaration: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "updateDeal",
    description: "Update a deal record.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Deal ID." },
        title: { type: "string" },
        clientName: { type: "string" },
        amount: { type: "number" },
        stage: { type: "string", enum: ["Lead", "Negotiation", "Won", "Lost"] },
        notes: { type: "string" },
      },
      required: ["id"],
      additionalProperties: false,
    },
  }
};

const queryDataDeclaration: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "queryData",
    description: "Query and summarize data from the database. Use this when user asks for totals, summaries, lists, or analysis of specific data.",
    parameters: {
      type: "object",
      properties: {
        collection: {
          type: "string",
          enum: ["expenses", "payments", "receivables", "tasks", "sites", "labour", "clients", "deals"],
          description: "Which collection to query."
        },
        filter: { type: "string", description: "Optional filter description (e.g. 'this month', 'by site Ludhiana', 'pending only')." },
      },
      required: ["collection"],
      additionalProperties: false,
    },
  }
};

const addDiaryEntryDeclaration: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "addDiaryEntry",
    description: "Add a new diary/journal entry. Use this when user wants to record thoughts, reflections, daily events, or asks AI to write a journal entry for them.",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string", description: "The full diary entry content. Can be AI-written based on user's day/context." },
        mood: { type: "string", description: "Mood: Happy, Motivated, Stressed, Neutral, Tired, Excited, Worried, Grateful." },
        date: { type: "string", description: "Date YYYY-MM-DD. Defaults to today." },
      },
      required: ["content"],
      additionalProperties: false,
    },
  }
};

const updateDiaryEntryDeclaration: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "updateDiaryEntry",
    description: "Update an existing diary entry.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Diary entry ID." },
        content: { type: "string" },
        mood: { type: "string" },
        date: { type: "string" },
      },
      required: ["id"],
      additionalProperties: false,
    },
  }
};

export const ALL_TOOL_DECLARATIONS: OpenAI.ChatCompletionTool[] = [
  addExpenseDeclaration, updateExpenseDeclaration, deleteExpenseDeclaration,
  addPaymentDeclaration, updatePaymentDeclaration, deletePaymentDeclaration,
  addTaskDeclaration, updateTaskDeclaration, deleteTaskDeclaration,
  addReceivableDeclaration, updateReceivableDeclaration,
  syncReceivablesFromSitesDeclaration,
  addSiteDeclaration, updateSiteDeclaration, syncSitesFromContractsDeclaration,
  addLabourDeclaration, updateLabourDeclaration, syncLabourFromSheetDeclaration,
  addClientDeclaration,
  addDealDeclaration, updateDealDeclaration,
  addDiaryEntryDeclaration, updateDiaryEntryDeclaration,
  queryDataDeclaration,
];

// ─── Main API Call ────────────────────────────────────────────────────────────

// ─── Helper for Retry Logic ───────────────────────────────────────────────────

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function callGemini({
  prompt,
  model = 'nvidia/llama-3.1-nemotron-70b-instruct:free',
  context = '',
  systemInstruction = SYSTEM_PROMPT,
  maxTokens = 800,
  history = [],
}: GeminiRequest): Promise<GeminiResponse> {

  const localKey = typeof window !== 'undefined' ? localStorage.getItem('openrouter_api_key') : null;
  const keyToUse = localKey || API_KEY || '';

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: keyToUse,
    dangerouslyAllowBrowser: true, // Required for running from browser
    defaultHeaders: {
      "HTTP-Referer": typeof window !== 'undefined' ? window.location.origin : "http://localhost:3000",
      "X-Title": "GenuineOS",
    }
  });

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: systemInstruction }
  ];

  if (context) {
    messages.push({ role: "system", content: context });
  }

  if (history.length > 0) {
    history.slice(-6).forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.text
      });
    });
  }

  messages.push({ role: "user", content: prompt });

  const maxRetries = 3;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const response = await openai.chat.completions.create({
        model: model,
        messages: messages,
        max_tokens: maxTokens,
        temperature: 0.7,
        tools: ALL_TOOL_DECLARATIONS,
      });

      const choice = response.choices[0];
      const text = choice.message.content || '';

      let functionCalls: { name: string, args: any }[] | undefined;

      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        functionCalls = choice.message.tool_calls.map((tc: any) => {
          let args = {};
          try {
            args = JSON.parse(tc.function.arguments);
          } catch (e) {
            console.error("Failed to parse tool arguments", e);
          }
          return {
            name: tc.function.name,
            args: args
          };
        });
      }

      return { text, model, cached: false, functionCalls };
    } catch (error: any) {
      const errorMessage = error.message || String(error);

      const isRateLimit = errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RATE_LIMIT');

      if (isRateLimit && attempt < maxRetries) {
        attempt++;
        const backoffTime = attempt * 2000; // 2s, 4s, 6s...
        console.warn(`OpenRouter API rate limit hit. Retrying in ${backoffTime}ms (Attempt ${attempt} of ${maxRetries})...`);
        await delay(backoffTime);
        continue;
      }

      console.error("OpenRouter API Error:", error);

      if (errorMessage.includes('401') || errorMessage.includes('invalid API key')) {
        throw new Error('INVALID_API_KEY');
      }
      if (isRateLimit) {
        throw new Error('RATE_LIMIT');
      }
      throw error;
    }
  }

  throw new Error('RATE_LIMIT');
}

export async function testGeminiConnection(key: string): Promise<boolean> {
  try {
    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: key,
      dangerouslyAllowBrowser: true,
    });
    await openai.chat.completions.create({
      model: 'nvidia/llama-3.1-nemotron-70b-instruct:free',
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 5
    });
    return true;
  } catch (error) {
    console.error("OpenRouter Test Connection Error:", error);
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
