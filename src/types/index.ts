export interface Payment {
  id?: string;
  date: string;
  amount: number;
  partyName: string;
  partner?: string;
  siteId?: string;
  category?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Expense {
  id?: string;
  date: string;
  amount: number;
  category: string;
  partyName?: string;
  partner?: string;
  siteId?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Receivable {
  id?: string;
  partyName: string;
  amount: number;
  dueDate: string;
  amountCollected: number;
  status: 'Pending' | 'Partial' | 'Collected';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Site {
  id?: string;
  name: string;
  location: string;
  clientId?: string;
  status: 'Active' | 'Completed' | 'On Hold';
  startDate?: string;
  endDate?: string;
  estimatedEndDate?: string;
  budget?: number;
  progress: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LabourWorker {
  id?: string;
  name: string;
  phone?: string;
  dailyWage: number;
  balance: number;
  status: 'Active' | 'Inactive';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Client {
  id?: string;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Deal {
  id?: string;
  title: string;
  clientName: string;
  amount: number;
  stage: 'Lead' | 'Negotiation' | 'Won' | 'Lost';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  id?: string;
  title: string;
  dueDate?: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Habit {
  id?: string;
  title: string;
  frequency: string;
  streak: number;
  lastCompleted?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DiaryEntry {
  id?: string;
  date: string;
  content: string;
  mood?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Goal {
  id?: string;
  title: string;
  targetDate?: string;
  progress: number;
  status: 'Active' | 'Achieved' | 'Abandoned';
  createdAt?: string;
  updatedAt?: string;
}

export interface Contact {
  id?: string;
  name: string;
  phone: string;
  category?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  language?: string;
  notifications?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
