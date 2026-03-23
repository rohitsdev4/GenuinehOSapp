import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY;

export type GeminiModel =
  | 'gemini-3.1-flash-lite-preview'
  | 'gemini-3-flash-preview'
  | 'gemini-3.1-pro-preview'

const SYSTEM_PROMPT = `
You are GenuineOS AI — a smart, practical business advisor for
Rohit Kumar, CEO of Genuine Hospi Enterprises, Patna, Bihar, India.
Business: Hospital beds, modular operation theaters, medical gas pipelines.

RESPONSE RULES:
- Always respond in Hinglish (natural Hindi + English mix)
- Be direct, practical, and brief
- Max 5 bullet points unless more detail explicitly requested
- Always consider Indian business context (GST, Bihar/UP market, etc.)
- Be encouraging but realistic
- If the user asks to add an expense or payment, use the provided tools.
`;

interface Message {
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

const addExpenseDeclaration: FunctionDeclaration = {
  name: "addExpense",
  description: "Add a new expense record to the database.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      amount: { type: Type.NUMBER, description: "The amount of the expense." },
      category: { type: Type.STRING, description: "The category of the expense (e.g., Labour, Material, Transport, Office, Other)." },
      partyName: { type: Type.STRING, description: "The name of the person or company the expense was paid to." },
      notes: { type: Type.STRING, description: "Any additional notes about the expense." },
    },
    required: ["amount", "category", "partyName"],
  },
};

const addPaymentDeclaration: FunctionDeclaration = {
  name: "addPayment",
  description: "Add a new payment received record to the database.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      amount: { type: Type.NUMBER, description: "The amount of the payment received." },
      category: { type: Type.STRING, description: "The payment method or category (e.g., Cash, Bank Transfer, UPI, Cheque)." },
      partyName: { type: Type.STRING, description: "The name of the client or party who made the payment." },
      notes: { type: Type.STRING, description: "Any additional notes about the payment." },
    },
    required: ["amount", "category", "partyName"],
  },
};

const addTaskDeclaration: FunctionDeclaration = {
  name: "addTask",
  description: "Add a new task to the to-do list.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "The title of the task." },
      priority: { type: Type.STRING, enum: ["Low", "Medium", "High"], description: "The priority of the task." },
      dueDate: { type: Type.STRING, description: "The due date of the task (YYYY-MM-DD)." },
      notes: { type: Type.STRING, description: "Any additional notes about the task." },
    },
    required: ["title", "priority"],
  },
};

const addReceivableDeclaration: FunctionDeclaration = {
  name: "addReceivable",
  description: "Add a new receivable (money to be collected) record.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      partyName: { type: Type.STRING, description: "The name of the party who owes the money." },
      amount: { type: Type.NUMBER, description: "The total amount to be collected." },
      dueDate: { type: Type.STRING, description: "The expected date of collection (YYYY-MM-DD)." },
      notes: { type: Type.STRING, description: "Any additional notes." },
    },
    required: ["partyName", "amount", "dueDate"],
  },
};

export async function callGemini({
  prompt,
  model = 'gemini-3.1-flash-lite-preview',
  context = '',
  systemInstruction = SYSTEM_PROMPT,
  maxTokens = 600,
  history = [],
}: GeminiRequest): Promise<GeminiResponse> {

  const localKey = typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : null;
  const ai = new GoogleGenAI({ apiKey: localKey || API_KEY || '' });

  let fullPrompt = context ? `${context}\n\n` : '';
  
  if (history.length > 0) {
    fullPrompt += '=== Chat History ===\n';
    history.slice(-5).forEach(msg => {
      fullPrompt += `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.text}\n`;
    });
    fullPrompt += '\n';
  }

  fullPrompt += `User Query: ${prompt}`;

  try {
    const ai = new GoogleGenAI({ apiKey: localKey || API_KEY || '' });
    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
      config: {
        systemInstruction: systemInstruction,
        maxOutputTokens: maxTokens,
        temperature: 0.7,
        tools: [{ 
          functionDeclarations: [
            addExpenseDeclaration, 
            addPaymentDeclaration, 
            addTaskDeclaration, 
            addReceivableDeclaration
          ] 
        }],
      },
    });

    const text = response.text || '';
    const functionCalls = response.functionCalls;
    
    return { text, model, cached: false, functionCalls };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Extract more meaningful error message
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

export function buildContext(data: {
  thisMonthIncome?: number;
  thisMonthExpenses?: number;
  criticalReceivables?: Array<{ party: string; amount: number; days: number }>;
  activeDeals?: number;
  pendingTasks?: number;
  activeSites?: number;
}): string {
  const lines: string[] = ['=== Business Context ==='];

  if (data.thisMonthIncome !== undefined) {
    const net = (data.thisMonthIncome - (data.thisMonthExpenses || 0));
    lines.push(`This Month: Income ₹${(data.thisMonthIncome/100000).toFixed(1)}L, Expenses ₹${((data.thisMonthExpenses||0)/100000).toFixed(1)}L, Net ₹${(net/100000).toFixed(1)}L`);
  }
  if (data.criticalReceivables?.length) {
    lines.push(`Critical Receivables: ${data.criticalReceivables.map(r => `${r.party} ₹${(r.amount/100000).toFixed(1)}L (${r.days} days)`).join(', ')}`);
  }
  if (data.activeDeals) lines.push(`Active Deals: ${data.activeDeals}`);
  if (data.pendingTasks) lines.push(`Pending Tasks: ${data.pendingTasks}`);
  if (data.activeSites) lines.push(`Active Sites: ${data.activeSites}`);

  return lines.join('\n');
}
