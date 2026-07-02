/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Profile {
  userId: string;
  name: string;
  email: string;
  incomeType: 'CLT' | 'variavel' | 'misto';
  payFrequency: 'mensal' | 'semanal' | 'diario' | 'variavel';
  financialGoal: string;
  riskProfile: 'conservador' | 'moderado' | 'agressivo';
  onboardingCompleted: boolean;
}

export interface Settings {
  currency: string; // e.g. "BRL"
  language: string; // e.g. "pt-BR"
  notificationsEnabled: boolean;
  aiEnabled: boolean;
  darkMode: boolean;
}

export interface Account {
  id: string;
  name: string;
  bankName: string;
  type: 'checking' | 'savings' | 'wallet';
  balance: number;
  isActive: boolean;
}

export interface Card {
  id: string;
  name: string;
  limit: number;
  dueDate: number; // dia do mês (1-31)
  closingDay: number; // dia do mês
  currentInvoice: number;
  availableLimit: number;
}

export interface IncomeSource {
  id: string;
  name: string;
  type: 'CLT' | 'freelance' | 'dividend' | 'rent' | 'commission' | 'other';
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'variable';
  expectedValue: number;
  nextDate: string; // YYYY-MM-DD
}

export interface Expense {
  id: string;
  name: string;
  category: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'variable';
  dueDate: string; // YYYY-MM-DD
  isFixed: boolean;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string; // YYYY-MM-DD
  category: string;
  accountId: string;
  description: string;
  isRecurring: boolean;
}

export interface Asset {
  id: string;
  name: string;
  type: 'property' | 'vehicle' | 'investment' | 'cash' | 'other';
  value: number;
  acquisitionDate: string; // YYYY-MM-DD
  appreciationRate: number; // % ao ano
}

export interface Liability {
  id: string;
  name: string;
  type: 'loan' | 'financing' | 'credit_card' | 'installment';
  totalValue: number;
  remainingValue: number;
  monthlyPayment: number;
  remainingMonths: number;
}

export interface Goal {
  id: string;
  name: string;
  targetValue: number;
  currentValue: number;
  deadline: string; // YYYY-MM-DD
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed';
}

export interface CashFlow {
  date: string; // YYYY-MM-DD
  expectedIncome: number;
  expectedExpense: number;
  projectedBalance: number;
}

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'income' | 'expense' | 'reminder';
  description: string;
  amount: number;
}

export interface TimelineEvent {
  id: string;
  date: string; // YYYY-MM-DD
  event: string;
  impact: string;
  financialChange: number;
}

export interface LifeEvent {
  id: string;
  type: 'job' | 'purchase' | 'milestone' | 'life_event';
  description: string;
  date: string; // YYYY-MM-DD
  financialImpact: number;
}

export interface AIInsight {
  id: string;
  insight: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string; // YYYY-MM-DD HH:MM:SS
  relatedDomain: string;
}

export interface FinancialState {
  balanceCurrent: number;
  balanceProjected: number;
  incomeFlow: number;
  expenseFlow: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  goalProgress: number; // % de conclusão médio
  behaviorScore: number; // 0-100
  scoreFinancial: number; // 0-100
}

// Global state holding all sheets data
export interface ExcelDatabase {
  profile: Profile;
  settings: Settings;
  accounts: Account[];
  cards: Card[];
  incomeSources: IncomeSource[];
  expenses: Expense[];
  transactions: Transaction[];
  assets: Asset[];
  liabilities: Liability[];
  goals: Goal[];
  cashFlow: CashFlow[];
  calendar: CalendarEvent[];
  timeline: TimelineEvent[];
  events: LifeEvent[];
  aiInsights: AIInsight[];
}
