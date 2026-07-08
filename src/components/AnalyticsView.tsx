/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { 
  TrendingUp, TrendingDown, DollarSign, Wallet, Percent, 
  Award, Calendar, ArrowRightLeft, Sparkles, PieChart as PieIcon, 
  BarChart3, Activity, Info, ChevronRight, Zap, Target
} from "lucide-react";
import { 
  ResponsiveContainer, ComposedChart, BarChart, Bar, LineChart, Line, 
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from "recharts";
import { ExcelDatabase, Transaction, Goal } from "../types";
import { safePercent } from "../lib/calculations";

interface AnalyticsViewProps {
  data: ExcelDatabase;
}

export default function AnalyticsView({ data }: AnalyticsViewProps) {
  const [timeframe, setTimeframe] = useState<"6m" | "12m" | "all">("6m");
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<"overview" | "categories" | "indicators" | "projection">("overview");

  // Get current date details
  const today = new Date();
  const currentMonthStr = today.toISOString().substring(0, 7); // YYYY-MM

  // 1. PROCESS MONTHLY CASH FLOW DATA
  const monthlyFlowData = useMemo(() => {
    const transactions = data.transactions || [];
    const monthlyMap: Record<string, { income: number; expense: number; monthName: string }> = {};

    // Portuguese month names mapping
    const monthNamesPT: Record<string, string> = {
      "01": "Jan", "02": "Fev", "03": "Mar", "04": "Abr", "05": "Mai", "06": "Jun",
      "07": "Jul", "08": "Ago", "09": "Set", "10": "Out", "11": "Nov", "12": "Dez"
    };

    // If there are zero transactions, let's pre-populate the last 6 months with some default/simulated context 
    // from the user's expected income and expenses so the chart doesn't look empty and depressing!
    if (transactions.length === 0) {
      const expectedIncome = (data.incomeSources || []).reduce((sum, inc) => sum + (inc?.expectedValue || 0), 0) || 5000;
      const expectedExpenses = (data.expenses || []).reduce((sum, exp) => sum + (exp?.amount || 0), 0) || 3500;
      
      const list = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(today.getMonth() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const key = `${y}-${m}`;
        list.push({
          key,
          monthName: `${monthNamesPT[m]} ${String(y).substring(2)}`,
          income: expectedIncome,
          expense: expectedExpenses,
          savings: expectedIncome - expectedExpenses
        });
      }
      return list;
    }

    // Process real transactions
    transactions.forEach(tx => {
      if (!tx.date) return;
      const key = tx.date.substring(0, 7); // YYYY-MM
      const [year, month] = key.split("-");
      if (!monthlyMap[key]) {
        const label = monthNamesPT[month] ? `${monthNamesPT[month]} ${year.substring(2)}` : key;
        monthlyMap[key] = { income: 0, expense: 0, monthName: label };
      }
      
      const amount = tx.amount || 0;
      if (tx.type === "income") {
        monthlyMap[key].income += amount;
      } else {
        monthlyMap[key].expense += amount;
      }
    });

    // Generate month keys to sort and display
    let monthKeys = Object.keys(monthlyMap).sort();

    // Filter by timeframe
    if (timeframe === "6m") {
      monthKeys = monthKeys.slice(-6);
    } else if (timeframe === "12m") {
      monthKeys = monthKeys.slice(-12);
    }

    // Ensure we have at least 3 months for visual layout if list is tiny
    if (monthKeys.length < 3) {
      // populate preceding months with 0
      const firstKey = monthKeys[0] || currentMonthStr;
      const [y, m] = firstKey.split("-").map(Number);
      for (let i = 1; i <= 3 - monthKeys.length; i++) {
        const d = new Date(y, m - 1 - i, 1);
        const pY = d.getFullYear();
        const pM = String(d.getMonth() + 1).padStart(2, "0");
        const key = `${pY}-${pM}`;
        const label = `${monthNamesPT[pM]} ${String(pY).substring(2)}`;
        monthlyMap[key] = { income: 0, expense: 0, monthName: label };
        monthKeys.unshift(key);
      }
    }

    return monthKeys.map(key => {
      const entry = monthlyMap[key];
      const income = Number(entry.income.toFixed(2));
      const expense = Number(entry.expense.toFixed(2));
      const savings = Number((income - expense).toFixed(2));
      return {
        key,
        monthName: entry.monthName,
        income,
        expense,
        savings
      };
    });
  }, [data.transactions, data.incomeSources, data.expenses, timeframe, currentMonthStr]);

  // 2. EXPENSES BY CATEGORY DATA
  const categoryData = useMemo(() => {
    const transactions = data.transactions || [];
    const catMap: Record<string, number> = {};

    // Get current month's transactions
    const currentMonthExpenses = transactions.filter(
      tx => tx.type === "expense" && tx.date && tx.date.substring(0, 7) === currentMonthStr
    );

    // If current month has zero, fallback to all expenses
    const targetExpenses = currentMonthExpenses.length > 0 ? currentMonthExpenses : transactions.filter(tx => tx.type === "expense");

    targetExpenses.forEach(tx => {
      const cat = tx.category || "Outros";
      catMap[cat] = (catMap[cat] || 0) + (tx.amount || 0);
    });

    // If zero expenses found in history, use simulated expense budget from plan
    if (Object.keys(catMap).length === 0) {
      (data.expenses || []).forEach(exp => {
        const cat = exp.category || "Outros";
        catMap[cat] = (catMap[cat] || 0) + (exp.amount || 0);
      });
    }

    const COLORS = [
      "#6366f1", "#f43f5e", "#10b981", "#f59e0b", "#06b6d4", 
      "#ec4899", "#8b5cf6", "#14b8a6", "#f97316", "#a855f7"
    ];

    const sortedCats = Object.entries(catMap)
      .map(([name, value], idx) => ({
        name,
        value: Number(value.toFixed(2)),
        color: COLORS[idx % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);

    const totalVal = sortedCats.reduce((sum, item) => sum + item.value, 0) || 1;
    return sortedCats.map(item => ({
      ...item,
      percentage: Math.round((item.value / totalVal) * 100)
    }));
  }, [data.transactions, data.expenses, currentMonthStr]);

  // 3. STATS & KEY RATIOS
  const ratios = useMemo(() => {
    // Current month total real income
    const realIncome = (data.transactions || [])
      .filter(tx => tx.type === "income" && tx.date && tx.date.substring(0, 7) === currentMonthStr)
      .reduce((sum, tx) => sum + tx.amount, 0);

    // If zero real income this month, use expected income
    const baseIncome = realIncome || (data.incomeSources || []).reduce((sum, inc) => sum + (inc?.expectedValue || 0), 0) || 1;

    // Current month total real expense
    const realExpense = (data.transactions || [])
      .filter(tx => tx.type === "expense" && tx.date && tx.date.substring(0, 7) === currentMonthStr)
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Current month savings rate
    const savingsAmount = baseIncome - realExpense;
    const savingsRate = Math.max(-100, Math.min(100, Math.round((savingsAmount / baseIncome) * 100)));

    // Comprometimento de Renda: total debts + monthly card obligations / income
    const totalLiabilitiesPayments = (data.liabilities || []).reduce((sum, l) => sum + (l?.monthlyPayment || 0), 0);
    const totalCardInvoices = (data.cards || []).reduce((sum, c) => sum + (c?.currentInvoice || 0), 0);
    const debtObligations = totalLiabilitiesPayments + (totalCardInvoices * 0.15); // standard 15% billing factor
    const debtObligationRatio = Math.round((debtObligations / baseIncome) * 100);

    // Emergency Fund Coverage
    // Total accounts balance + savings balance
    const liquidAssets = (data.accounts || []).reduce((sum, a) => sum + (a?.balance || 0), 0);
    const monthlyAverageExpense = realExpense || (data.expenses || []).reduce((sum, e) => sum + (e?.amount || 0), 0) || 1200;
    const emergencyMonthsCoverage = Number((liquidAssets / monthlyAverageExpense).toFixed(1));

    // Fixed vs Variable Ratio
    const fixedBudget = (data.expenses || []).filter(e => e.isFixed).reduce((sum, e) => sum + e.amount, 0);
    const totalBudget = (data.expenses || []).reduce((sum, e) => sum + e.amount, 0) || 1;
    const fixedRatio = Math.round((fixedBudget / totalBudget) * 100);
    const variableRatio = 100 - fixedRatio;

    return {
      income: baseIncome,
      expense: realExpense || (data.expenses || []).reduce((sum, e) => sum + e.amount, 0),
      savingsRate,
      debtObligationRatio,
      emergencyMonthsCoverage,
      fixedRatio,
      variableRatio,
      liquidAssets,
      monthlyAverageExpense
    };
  }, [data.transactions, data.incomeSources, data.expenses, data.liabilities, data.cards, data.accounts, currentMonthStr]);

  // 4. GOALS & DREAMS PROJECTION
  const goalsProjection = useMemo(() => {
    // Determine average monthly savings from the last 3-6 months
    const historicalSavings = monthlyFlowData.map(d => d.savings);
    const positiveSavings = historicalSavings.filter(s => s > 0);
    const avgMonthlySavings = positiveSavings.length > 0
      ? positiveSavings.reduce((sum, s) => sum + s, 0) / positiveSavings.length
      : Math.max(0, ratios.income - ratios.expense) || 300; // fallback default estimate

    return (data.goals || []).map(goal => {
      const remaining = Math.max(0, goal.targetValue - goal.currentValue);
      const pct = safePercent(goal.currentValue, goal.targetValue);
      
      let monthsToGoal = 999;
      let projectedDateStr = "N/A";
      let status: "on_track" | "delayed" | "needs_plan" = "needs_plan";

      if (avgMonthlySavings > 0 && remaining > 0) {
        monthsToGoal = Math.ceil(remaining / avgMonthlySavings);
        const projDate = new Date();
        projDate.setMonth(projDate.getMonth() + monthsToGoal);
        projectedDateStr = projDate.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });

        // Check if projected deadline is within target deadline
        if (goal.deadline) {
          const targetDeadline = new Date(goal.deadline);
          status = projDate <= targetDeadline ? "on_track" : "delayed";
        } else {
          status = "on_track";
        }
      } else if (remaining === 0) {
        monthsToGoal = 0;
        projectedDateStr = "Alcançado 🎉";
        status = "on_track";
      }

      return {
        ...goal,
        percentage: pct,
        remaining,
        monthsToGoal,
        projectedDate: projectedDateStr,
        status,
        avgUsedSavings: avgMonthlySavings
      };
    });
  }, [data.goals, monthlyFlowData, ratios.income, ratios.expense]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header and Summary Cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-400" /> Analítica & Saúde Financeira
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Gráficos e diagnósticos detalhados do seu fluxo de caixa, patrimônio e projeções de metas.
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex bg-[#111111] p-1 rounded-xl border border-white/5 self-start">
          <button
            onClick={() => setActiveAnalysisTab("overview")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeAnalysisTab === "overview" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10" : "text-slate-400 hover:text-white"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Fluxo de Caixa
          </button>
          <button
            onClick={() => setActiveAnalysisTab("categories")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeAnalysisTab === "categories" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10" : "text-slate-400 hover:text-white"
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" /> Categorias
          </button>
          <button
            onClick={() => setActiveAnalysisTab("indicators")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeAnalysisTab === "indicators" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10" : "text-slate-400 hover:text-white"
            }`}
          >
            <Percent className="w-3.5 h-3.5" /> Diagnóstico
          </button>
          <button
            onClick={() => setActiveAnalysisTab("projection")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeAnalysisTab === "projection" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10" : "text-slate-400 hover:text-white"
            }`}
          >
            <Target className="w-3.5 h-3.5" /> Projeção de Metas
          </button>
        </div>
      </div>

      {/* Dynamic Tab Contents */}

      {/* TAB 1: OVERVIEW CASH FLOW */}
      {activeAnalysisTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 p-6 bg-[#0B0B0C] border border-white/5 rounded-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Evolução do Fluxo Mensal</h2>
                <p className="text-xs text-slate-500">Comparativo histórico de receitas vs despesas</p>
              </div>
              <div className="flex bg-[#161618] p-0.5 rounded-lg border border-white/5">
                {(["6m", "12m", "all"] as const).map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-mono transition cursor-pointer ${
                      timeframe === tf ? "bg-indigo-600 text-white font-bold" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {tf === "6m" ? "6 Meses" : tf === "12m" ? "12 Meses" : "Tudo"}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts Composed Chart */}
            <div className="h-72 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis 
                    dataKey="monthName" 
                    stroke="#475569" 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10} 
                  />
                  <YAxis 
                    stroke="#475569" 
                    tickLine={false} 
                    axisLine={false} 
                    dx={-5}
                    tickFormatter={(val) => `R$ ${val}`} 
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: "#0F0F11", 
                      border: "1px solid rgba(255,255,255,0.08)", 
                      borderRadius: "12px",
                      color: "#fff"
                    }}
                    formatter={(value: any) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ paddingBottom: "10px" }} />
                  <Bar 
                    name="Entradas" 
                    dataKey="income" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={45}
                  />
                  <Bar 
                    name="Saídas" 
                    dataKey="expense" 
                    fill="#f43f5e" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={45}
                  />
                  <Line 
                    name="Saldo Líquido" 
                    type="monotone" 
                    dataKey="savings" 
                    stroke="#6366f1" 
                    strokeWidth={2.5}
                    dot={{ fill: "#6366f1", strokeWidth: 1 }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex gap-3 text-xs leading-relaxed">
              <span className="text-indigo-400 shrink-0">💡</span>
              <p className="text-slate-300">
                O gráfico de fluxo de caixa ajuda a validar se você está gastando menos do que ganha (área entre a barra verde e vermelha). A linha azul mostra a sua capacidade de poupança líquida de cada mês. Manter a linha azul consistentemente acima de zero é o segredo para construir riqueza.
              </p>
            </div>
          </div>

          {/* Quick Metrics Column */}
          <div className="space-y-6">
            {/* Net Worth Speedometer Summary */}
            <div className="p-6 bg-[#0B0B0C] border border-white/5 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Balanço deste mês</h3>
              
              <div className="space-y-3.5">
                <div className="flex justify-between items-center bg-[#111112] p-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block leading-none">Entradas</span>
                      <span className="text-sm font-semibold text-white mt-1 block">
                        R$ {ratios.income.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-500 font-mono font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">+100%</span>
                </div>

                <div className="flex justify-between items-center bg-[#111112] p-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                      <TrendingDown className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block leading-none">Saídas</span>
                      <span className="text-sm font-semibold text-white mt-1 block">
                        R$ {ratios.expense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-rose-500 font-mono font-bold bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/10">
                    {Math.round((ratios.expense / ratios.income) * 100)}%
                  </span>
                </div>

                <div className="flex justify-between items-center bg-[#111112] p-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block leading-none">Poupança Mensal</span>
                      <span className={`text-sm font-semibold block mt-1 ${ratios.savingsRate >= 0 ? "text-indigo-400" : "text-rose-400"}`}>
                        R$ {(ratios.income - ratios.expense).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                    ratios.savingsRate >= 20 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : ratios.savingsRate >= 0
                        ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  }`}>
                    {ratios.savingsRate}%
                  </span>
                </div>
              </div>

              {/* Progress bar of Spending vs Income */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Taxa de Comprometimento</span>
                  <span className="font-semibold text-white">{Math.round((ratios.expense / ratios.income) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      ratios.expense / ratios.income > 1 
                        ? "bg-rose-500" 
                        : ratios.expense / ratios.income > 0.8 
                          ? "bg-amber-500" 
                          : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, (ratios.expense / ratios.income) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick action card */}
            <div className="p-5 bg-gradient-to-br from-indigo-900/10 via-[#0B0B0C] to-[#0B0B0C] border border-white/5 rounded-2xl relative overflow-hidden space-y-3">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-white">Estabilidade Financeira</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Suas reservas líquidas de <strong className="text-white">R$ {ratios.liquidAssets.toLocaleString("pt-BR")}</strong> são capazes de cobrir até <strong className="text-white">{ratios.emergencyMonthsCoverage} meses</strong> do seu custo de vida médio mensal. O recomendado pelo mercado é ter pelo menos 6 meses de segurança.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORIES BREAKDOWN */}
      {activeAnalysisTab === "categories" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pie Chart Column */}
          <div className="p-6 bg-[#0B0B0C] border border-white/5 rounded-2xl flex flex-col justify-between space-y-6">
            <div>
              <h2 className="text-base font-semibold text-white">Distribuição por Categorias</h2>
              <p className="text-xs text-slate-500">De onde saem seus maiores gastos</p>
            </div>

            {/* Recharts Pie Chart */}
            <div className="h-56 w-full flex items-center justify-center relative">
              {categoryData.length === 0 ? (
                <div className="text-slate-500 text-xs">Nenhum gasto lançado para análise</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: "#0F0F11", 
                          border: "1px solid rgba(255,255,255,0.08)", 
                          borderRadius: "12px",
                          color: "#fff"
                        }}
                        formatter={(value: any) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text of Donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">Total</span>
                    <span className="text-sm font-bold text-white">
                      R$ {categoryData.reduce((sum, item) => sum + item.value, 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Mini Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
              {categoryData.slice(0, 4).map((cat, idx) => (
                <div key={idx} className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="truncate">{cat.name}: <strong className="text-white">{cat.percentage}%</strong></span>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Category Table/Progress List */}
          <div className="lg:col-span-2 p-6 bg-[#0B0B0C] border border-white/5 rounded-2xl space-y-6">
            <div>
              <h2 className="text-base font-semibold text-white">Ranking de Gastos</h2>
              <p className="text-xs text-slate-500">Métricas completas por grupo de despesa</p>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[310px] pr-2">
              {categoryData.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">Sem dados suficientes para listar rankings de categorias.</div>
              ) : (
                categoryData.map((cat, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="font-semibold text-white">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-300 font-mono font-semibold">R$ {cat.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        <span className="text-slate-500 font-mono text-[10px] ml-2">({cat.percentage}%)</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.color
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-[#111112] border border-white/5 rounded-xl flex items-start gap-2.5 text-xs">
              <Info className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
              <div className="text-slate-400 leading-relaxed">
                <strong>Análise 50/30/20:</strong> A metodologia tradicional recomenda destinar <strong className="text-slate-200">50% para Necessidades</strong> (Moradia, Contas), <strong className="text-slate-200">30% para Desejos</strong> (Lazer, Compras) e <strong className="text-slate-200">20% para Poupança/Investimentos</strong>. Revise o gráfico acima para identificar se alguma categoria supérflua está roubando sua fatia de investimento mensal.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KEY INDICATORS */}
      {activeAnalysisTab === "indicators" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Taxa de Poupança */}
          <div className="p-6 bg-[#0B0B0C] border border-white/5 rounded-2xl space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Padrão de Poupança</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-display font-extrabold text-white">{ratios.savingsRate}%</span>
              <span className="text-[10px] text-slate-500 block font-mono mt-1">Taxa de Poupança Atual</span>
            </div>
            
            <div className="pt-2 border-t border-white/5 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Classificação:</span>
                <span className={`font-bold ${
                  ratios.savingsRate >= 20 
                    ? "text-emerald-400" 
                    : ratios.savingsRate >= 10 
                      ? "text-indigo-400"
                      : ratios.savingsRate >= 0
                        ? "text-amber-400"
                        : "text-rose-400"
                }`}>
                  {ratios.savingsRate >= 20 
                    ? "Excelente (Vencedor)" 
                    : ratios.savingsRate >= 10 
                      ? "Saudável (Investidor)"
                      : ratios.savingsRate >= 0
                        ? "Equilibrado (No limite)"
                        : "Crítico (Déficit)"}
                </span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    ratios.savingsRate >= 20 
                      ? "bg-emerald-500" 
                      : ratios.savingsRate >= 10 
                        ? "bg-indigo-500"
                        : ratios.savingsRate >= 0
                          ? "bg-amber-500"
                          : "bg-rose-500"
                  }`} 
                  style={{ width: `${Math.max(0, ratios.savingsRate)}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Card 2: Comprometimento de Dívidas */}
          <div className="p-6 bg-[#0B0B0C] border border-white/5 rounded-2xl space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Serviço de Dívida</span>
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-display font-extrabold text-white">{ratios.debtObligationRatio}%</span>
              <span className="text-[10px] text-slate-500 block font-mono mt-1">Comprometimento de Renda</span>
            </div>

            <div className="pt-2 border-t border-white/5 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Classificação:</span>
                <span className={`font-bold ${
                  ratios.debtObligationRatio > 50 
                    ? "text-rose-400" 
                    : ratios.debtObligationRatio > 30 
                      ? "text-amber-400"
                      : "text-emerald-400"
                }`}>
                  {ratios.debtObligationRatio > 50 
                    ? "Super-endividado" 
                    : ratios.debtObligationRatio > 30 
                      ? "Alerta Amarelo"
                      : "Zona Segura ✅"}
                </span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    ratios.debtObligationRatio > 50 
                      ? "bg-rose-500" 
                      : ratios.debtObligationRatio > 30 
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }`} 
                  style={{ width: `${Math.min(100, ratios.debtObligationRatio)}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Card 3: Reserva de Segurança */}
          <div className="p-6 bg-[#0B0B0C] border border-white/5 rounded-2xl space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Reserva de Emergência</span>
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-display font-extrabold text-white">{ratios.emergencyMonthsCoverage}m</span>
              <span className="text-[10px] text-slate-500 block font-mono mt-1">Meses de Custo Coberto</span>
            </div>

            <div className="pt-2 border-t border-white/5 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Classificação:</span>
                <span className={`font-bold ${
                  ratios.emergencyMonthsCoverage >= 6 
                    ? "text-emerald-400" 
                    : ratios.emergencyMonthsCoverage >= 3 
                      ? "text-indigo-400"
                      : "text-rose-400"
                }`}>
                  {ratios.emergencyMonthsCoverage >= 6 
                    ? "Blindado (Excelente)" 
                    : ratios.emergencyMonthsCoverage >= 3 
                      ? "Moderado"
                      : "Vulnerável"}
                </span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    ratios.emergencyMonthsCoverage >= 6 
                      ? "bg-emerald-500" 
                      : ratios.emergencyMonthsCoverage >= 3 
                        ? "bg-indigo-500"
                        : "bg-rose-500"
                  }`} 
                  style={{ width: `${Math.min(100, (ratios.emergencyMonthsCoverage / 6) * 100)}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Card 4: Fixo vs Variável */}
          <div className="p-6 bg-[#0B0B0C] border border-white/5 rounded-2xl space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Perfil de Flexibilidade</span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <span className="text-2xl font-display font-extrabold text-slate-300">{ratios.fixedRatio}%</span>
                <span className="text-[9px] text-slate-500 block font-mono">Fixo</span>
              </div>
              <span className="text-xs text-slate-600 font-mono">vs</span>
              <div className="text-right">
                <span className="text-2xl font-display font-extrabold text-amber-400">{ratios.variableRatio}%</span>
                <span className="text-[9px] text-slate-500 block font-mono">Variável</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Corte de gastos:</span>
                <span className="font-bold text-emerald-400">
                  {ratios.variableRatio > 40 ? "Super Flexível" : "Rígido"}
                </span>
              </div>
              <div className="h-1 w-full bg-indigo-500 rounded-full overflow-hidden flex">
                <div className="bg-indigo-500 h-full" style={{ width: `${ratios.fixedRatio}%` }} />
                <div className="bg-amber-400 h-full" style={{ width: `${ratios.variableRatio}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GOALS FORECAST / PROJECTION */}
      {activeAnalysisTab === "projection" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Simulation variables sidebar */}
          <div className="p-6 bg-[#0B0B0C] border border-white/5 rounded-2xl space-y-6">
            <div>
              <h2 className="text-base font-semibold text-white">Base de Simulação</h2>
              <p className="text-xs text-slate-500">Variáveis calculadas para projeção futura</p>
            </div>

            <div className="space-y-4 text-xs text-slate-400">
              <div className="p-3.5 bg-[#111112] border border-white/5 rounded-xl space-y-1">
                <span className="text-slate-500 font-mono text-[9px] uppercase block">Sua Poupança Média Estimada</span>
                <span className="text-base font-bold text-indigo-400">
                  R$ {goalsProjection[0]?.avgUsedSavings?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || "0"}
                </span>
                <span className="text-[10px] text-slate-500 block leading-tight">
                  Calculado dinamicamente com base nas suas sobras reais de caixa nos meses anteriores.
                </span>
              </div>

              <div className="p-3.5 bg-[#111112] border border-white/5 rounded-xl space-y-1">
                <span className="text-slate-500 font-mono text-[9px] uppercase block">Dica para Acelerar Objetivos</span>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  Ao aumentar seus aportes mensais em apenas <strong className="text-emerald-400">R$ 150,00</strong>, você pode encurtar o tempo de conquista de todos os seus objetivos em até <strong className="text-white">15% do prazo</strong> planejado!
                </p>
              </div>
            </div>
          </div>

          {/* Goal projections grid list */}
          <div className="lg:col-span-2 p-6 bg-[#0B0B0C] border border-white/5 rounded-2xl space-y-6">
            <div>
              <h2 className="text-base font-semibold text-white">Linha do Tempo de Conquistas</h2>
              <p className="text-xs text-slate-500">Previsão exata de alcance dos seus sonhos</p>
            </div>

            <div className="space-y-4">
              {goalsProjection.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">Você não cadastrou nenhum sonho ou objetivo na aba "Sonhos e Objetivos" ainda.</div>
              ) : (
                goalsProjection.map(goal => (
                  <div key={goal.id} className="p-4 bg-[#111112] border border-white/5 rounded-xl space-y-3.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-indigo-400" /> {goal.name}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                          Falta: R$ {goal.remaining.toLocaleString("pt-BR")} | Meta: R$ {goal.targetValue.toLocaleString("pt-BR")}
                        </span>
                      </div>
                      
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                        goal.status === "on_track"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        {goal.status === "on_track" ? "No Prazo ✅" : "Ajuste Recomendado ⚠️"}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>Progresso do Sonho</span>
                        <span className="text-white font-bold">{goal.percentage}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-full rounded-full" 
                          style={{ width: `${goal.percentage}%` }} 
                        />
                      </div>
                    </div>

                    {/* Projections timeline */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5 text-[11px]">
                      <div>
                        <span className="text-slate-500 block uppercase font-mono text-[9px]">Prazo Desejado</span>
                        <span className="text-slate-300 font-semibold block mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" /> 
                          {goal.deadline ? new Date(goal.deadline).toLocaleDateString("pt-BR", { month: "short", year: "numeric" }) : "Indeterminado"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase font-mono text-[9px]">Previsão Analítica</span>
                        <span className="text-indigo-400 font-bold block mt-0.5 flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {goal.projectedDate}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
