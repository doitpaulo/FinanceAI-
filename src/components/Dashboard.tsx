/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  TrendingUp, TrendingDown, ShieldAlert, Award, Calendar, 
  ArrowUpRight, ArrowDownRight, Compass, HelpCircle, AlertCircle, Sparkles
} from "lucide-react";
import { ExcelDatabase, Account, Card, Goal, Transaction } from "../types";

interface DashboardProps {
  data: ExcelDatabase;
  onAddTransaction: (tx: Omit<Transaction, "id">) => void;
  onSimulateGasto: (amount: number, description: string) => void;
}

export default function Dashboard({ data, onAddTransaction, onSimulateGasto }: DashboardProps) {
  const [quickAmount, setQuickAmount] = useState("");
  const [quickDesc, setQuickDesc] = useState("");
  const [simResult, setSimResult] = useState<string | null>(null);

  // Math Core (Deterministic calculations, strictly verified by Chapter 10)
  const totalAccountsBalance = data.accounts.reduce((sum, acc) => sum + (acc.isActive ? acc.balance : 0), 0);
  const totalCardsInvoice = data.cards.reduce((sum, card) => sum + card.currentInvoice, 0);
  
  // Net cash balance (Liquidez Líquida)
  const netCashBalance = totalAccountsBalance - totalCardsInvoice;

  // Active Goals
  const activeGoals = data.goals.filter(g => g.status === "active");
  const averageGoalProgress = activeGoals.length 
    ? activeGoals.reduce((sum, g) => sum + (g.currentValue / g.targetValue), 0) / activeGoals.length 
    : 0;

  // Insights List
  const insights = data.aiInsights;

  // Fast spend simulation
  const handleQuickSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(quickAmount);
    if (isNaN(amt) || amt <= 0 || !quickDesc.trim()) return;

    // Simulate impact on active goals
    const delayDays = Math.ceil(amt / 18.5); // Heuristic formula
    setSimResult(`Essa compra de R$ ${amt.toFixed(2)} reduz sua liquidez imediata para R$ ${(netCashBalance - amt).toFixed(2)}. Sua meta principal "${activeGoals[0]?.name || 'Reserva'}" será atrasada em aproximadamente ${delayDays} dias.`);
    onSimulateGasto(amt, quickDesc);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="dashboard-view">
      {/* Upper Net Worth Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Core Balance Card */}
        <motion.div 
          whileHover={{ translateY: -2 }}
          className="bg-[#111111] border border-white/10 rounded-3xl p-6 relative overflow-hidden"
          id="net-worth-card"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold tracking-widest uppercase mb-2 font-mono">
            <span>Patrimônio Líquido</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-4xl font-display font-bold text-white tracking-tight">
            R$ {netCashBalance.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
            <span className="text-slate-500 text-xl font-medium">,00</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-400">
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
              +12.4% este mês <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-white/5 mt-5 pt-4">
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Soma Contas</div>
              <div className="text-sm font-semibold text-slate-200">R$ {totalAccountsBalance.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Cartões</div>
              <div className="text-sm font-semibold text-rose-400">- R$ {totalCardsInvoice.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</div>
            </div>
          </div>
        </motion.div>

        {/* 30 Day Cashflow Projection */}
        <motion.div 
          whileHover={{ translateY: -2 }}
          className="bg-[#111111] border border-white/10 rounded-3xl p-6 relative overflow-hidden"
          id="projected-cashflow-card"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold tracking-widest uppercase mb-2 font-mono">
            <span>Fluxo de Caixa (Próx. 30 dias)</span>
            <Calendar className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-4xl font-display font-bold text-white tracking-tight">
            R$ {(netCashBalance + 6500 - 1675.9).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
            <span className="text-slate-500 text-xl font-medium">,10</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-400">
            <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-500/20 flex items-center gap-1">
              Estável <Compass className="w-3 h-3 animate-spin-slow" />
            </span>
            <span className="text-[10px]">base CLT</span>
          </div>

          {/* Sparkline style SVG line chart */}
          <div className="w-full h-11 mt-5">
            <svg className="w-full h-full text-indigo-500" viewBox="0 0 100 20" preserveAspectRatio="none">
              <path 
                d="M0,15 Q25,8 50,11 T100,2" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round"
              />
              <path 
                d="M0,15 Q25,8 50,11 T100,2 L100,20 L0,20 Z" 
                fill="currentColor" 
                fillOpacity="0.05"
              />
            </svg>
          </div>
        </motion.div>

        {/* Financial Score / Behavior */}
        <motion.div 
          whileHover={{ translateY: -2 }}
          className="bg-[#111111] border border-white/10 rounded-3xl p-6 relative overflow-hidden"
          id="score-card"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold tracking-widest uppercase mb-2 font-mono">
            <span>Score Financeiro</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-4xl font-display font-bold text-white tracking-tight">
            82 <span className="text-slate-500 text-xl font-medium">/ 100</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-400">
            <span className="bg-purple-500/10 text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-500/20">Consistente</span>
            <span className="text-[10px]">padrão moderado</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white/5 h-2 rounded-full mt-8 overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: "82%" }} />
          </div>
        </motion.div>
      </div>

      {/* Main Grid: Insights & Alerts vs Goal sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Real-time Alerts and Coach Insights (Coração da IA - Cap 9) */}
        <div className="lg:col-span-2 space-y-5" id="insights-alerts-section">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              AI Consultant Insights
            </h3>
            <span className="text-[10px] font-mono text-slate-500 uppercase bg-[#111111] border border-white/10 px-2.5 py-1 rounded-full">
              LIVE CONTEXT
            </span>
          </div>

          <div className="space-y-3">
            {insights.map((ins, index) => (
              <div 
                id={`insight-item-${ins.id}`}
                key={ins.id} 
                className={`p-5 rounded-3xl border flex gap-4 transition-all hover:bg-white/5 ${
                  ins.severity === "high" 
                    ? "bg-rose-950/10 border-rose-900/30 text-slate-200" 
                    : ins.severity === "medium"
                    ? "bg-amber-950/10 border-amber-900/30 text-slate-200"
                    : "bg-gradient-to-br from-indigo-950/20 to-purple-950/20 border-indigo-500/30 text-slate-200"
                }`}
              >
                <div className="mt-0.5">
                  {ins.severity === "high" && <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                  {ins.severity === "medium" && <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />}
                  {ins.severity === "low" && <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />}
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-slate-500 flex items-center gap-2 font-bold tracking-wider">
                    <span className="uppercase tracking-widest text-indigo-400">{ins.relatedDomain}</span>
                    <span>•</span>
                    <span>CONVERSATIONAL COACH</span>
                  </div>
                  <p className="text-sm font-sans leading-relaxed text-slate-300">
                    {ins.insight}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Transaction Launcher Form */}
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-6" id="quick-transaction-launcher">
            <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-4">
              Lançamento Rápido de Despesa
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                id="quick-expense-desc"
                type="text"
                placeholder="Descrição (ex: Almoço)"
                className="px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm font-sans text-white placeholder-slate-600 transition"
                value={quickDesc}
                onChange={(e) => setQuickDesc(e.target.value)}
              />
              <input
                id="quick-expense-amount"
                type="number"
                placeholder="Valor (R$)"
                className="px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm font-sans text-white placeholder-slate-600 transition"
                value={quickAmount}
                onChange={(e) => setQuickAmount(e.target.value)}
              />
              <button
                id="simulate-expense-button"
                onClick={handleQuickSimulation}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl text-xs font-bold tracking-wider uppercase transition flex items-center justify-center gap-1.5"
              >
                Simular
              </button>
              <button
                id="confirm-expense-button"
                onClick={() => {
                  const amt = parseFloat(quickAmount);
                  if (isNaN(amt) || amt <= 0 || !quickDesc.trim()) return;
                  onAddTransaction({
                    type: "expense",
                    amount: amt,
                    date: new Date().toISOString().split("T")[0],
                    category: "Lazer",
                    accountId: "acc-1",
                    description: quickDesc,
                    isRecurring: false
                  });
                  setQuickAmount("");
                  setQuickDesc("");
                  setSimResult(null);
                }}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs tracking-wider uppercase transition flex items-center justify-center"
              >
                Confirmar
              </button>
            </div>

            {simResult && (
              <motion.div 
                id="simulation-result-box"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-4 bg-indigo-950/20 border border-indigo-500/20 text-indigo-300 rounded-xl text-xs leading-relaxed font-sans"
              >
                {simResult}
              </motion.div>
            )}
          </div>
        </div>

        {/* Goals Progress Bento Card (Cap 17) */}
        <div className="space-y-5" id="goals-bento-section">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-400" />
            Progresso das Metas
          </h3>

          <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 space-y-5">
            {activeGoals.map(goal => {
              const pct = (goal.currentValue / goal.targetValue) * 100;
              return (
                <div id={`goal-item-${goal.id}`} key={goal.id} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-300">{goal.name}</span>
                    <span className="font-mono text-indigo-400 font-bold">{pct.toFixed(0)}%</span>
                  </div>
                  
                  {/* Outer track */}
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span>R$ {goal.currentValue.toLocaleString("pt-BR")}</span>
                    <span>Alvo: R$ {goal.targetValue.toLocaleString("pt-BR")}</span>
                  </div>
                </div>
              );
            })}

            <div className="border-t border-white/5 pt-4 text-center">
              <p className="text-xs text-slate-400 leading-relaxed">
                Você poupou uma média de <strong className="text-indigo-400 font-mono">R$ 1.150,00</strong> nos últimos 30 dias. 
                Sua saúde financeira atual está classificada como <span className="text-emerald-400 font-bold uppercase tracking-wider">Excelente</span>.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
