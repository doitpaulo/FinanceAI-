/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  TrendingUp, TrendingDown, ShieldAlert, Award, Calendar, 
  ArrowUpRight, ArrowDownRight, Compass, HelpCircle, AlertCircle, Sparkles,
  Coins, Briefcase, Info, Check, Plus, Trash2, Clock, CheckCircle2
} from "lucide-react";
import { ExcelDatabase, Account, Goal, Transaction } from "../types";
import { safePercent, calculateFinancialScore, calculateProjectedCashflow } from "../lib/calculations";

interface DashboardProps {
  data: ExcelDatabase;
  onAddTransaction: (tx: Omit<Transaction, "id">) => void;
  onSimulateGasto: (amount: number, description: string) => void;
  onEditGoal?: (id: string, goalData: Partial<Goal>) => void;
  onEditAccount?: (id: string, updatedData: Partial<Account>) => void;
  onTriggerScheduledIncome?: (item: any) => Promise<void> | void;
  onSaveForDream?: (goalId: string, amt: number) => Promise<void> | void;
}

interface Envelope {
  id: string;
  name: string;
  category: string;
  balance: number;
  icon: string;
}

interface ScheduledIncome {
  id: string;
  name: string;
  amount: number;
  ruleType: "quinto_dia_util" | "dia_20" | "dia_especifico";
  specificDay?: number;
}

export default function Dashboard({ 
  data, 
  onAddTransaction, 
  onSimulateGasto,
  onEditGoal,
  onEditAccount,
  onTriggerScheduledIncome,
  onSaveForDream
}: DashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<"radar" | "simulador" | "caixinhas" | "renda">("radar");
  const today = new Date();
  const currentMonthStr = today.toISOString().substring(0, 7);

  // States
  const [quickAmount, setQuickAmount] = useState("");
  const [quickDesc, setQuickDesc] = useState("");
  const [simResult, setSimResult] = useState<string | null>(null);

  const [variableAmount, setVariableAmount] = useState("");
  const [variableSource, setVariableSource] = useState("Pix");
  const [variableDesc, setVariableDesc] = useState("");

  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);
  const [envActionType, setEnvActionType] = useState<"add" | "spend">("add");
  const [envActionVal, setEnvActionVal] = useState("");
  const [envActionDesc, setEnvActionDesc] = useState("");

  const [dreamSaveAmount, setDreamSaveAmount] = useState("50");
  const [dreamSavedThisSession, setDreamSavedThisSession] = useState(false);
  const [showDreamPopup, setShowDreamPopup] = useState(() => {
    const savedStatus = localStorage.getItem(`financeai_dream_prompt_${data.profile.email}_${currentMonthStr}`);
    return savedStatus !== "done" && savedStatus !== "dismissed";
  });

  const [schedules, setSchedules] = useState<ScheduledIncome[]>([]);

  // Payday prompt state
  const [activePaydayPrompt, setActivePaydayPrompt] = useState<ScheduledIncome | null>(null);
  const [paydayPromptAmount, setPaydayPromptAmount] = useState("");

  const getScheduledDay = (sched: ScheduledIncome): number => {
    if (sched.ruleType === "quinto_dia_util") {
      return 5;
    }
    if (sched.ruleType === "dia_20") {
      return 20;
    }
    if (sched.ruleType === "dia_especifico" && sched.specificDay) {
      return sched.specificDay;
    }
    return 5;
  };

  useEffect(() => {
    if (!schedules || schedules.length === 0) return;
    const todayDay = today.getDate();
    
    const pending = schedules.find(sched => {
      const scheduledDay = getScheduledDay(sched);
      const isPaid = localStorage.getItem(`financeai_sched_registered_${sched.id}_${currentMonthStr}`) === "true";
      const isDismissedThisSession = sessionStorage.getItem(`financeai_sched_dismissed_session_${sched.id}`) === "true";
      return todayDay >= scheduledDay && !isPaid && !isDismissedThisSession;
    });

    if (pending) {
      setActivePaydayPrompt(pending);
      setPaydayPromptAmount(pending.amount.toString());
    } else {
      setActivePaydayPrompt(null);
    }
  }, [schedules, today, currentMonthStr]);

  const [schedName, setSchedName] = useState("");
  const [schedAmount, setSchedAmount] = useState("");
  const [schedRule, setSchedRule] = useState<"quinto_dia_util" | "dia_20" | "dia_especifico">("quinto_dia_util");
  const [schedDay, setSchedDay] = useState("10");

  // Math Core
  const totalAccountsBalance = data.accounts.reduce((sum, acc) => sum + (acc.isActive ? acc.balance : 0), 0);
  const totalCardsInvoice = data.cards.reduce((sum, card) => sum + card.currentInvoice, 0);
  const netCashBalance = totalAccountsBalance - totalCardsInvoice;
  const activeGoals = data.goals.filter(g => g.status === "active");
  const projectedBalance = calculateProjectedCashflow(data, netCashBalance);
  const financialScore = calculateFinancialScore(data);

  // Envelopes persistence logic
  const defaultEnvelopes: Envelope[] = [
    { id: "env-1", name: "Comida e Feira", category: "Alimentação", balance: 0, icon: "🍔" },
    { id: "env-2", name: "Aluguel e Casa", category: "Moradia", balance: 0, icon: "🏠" },
    { id: "env-3", name: "Transporte e Moto", category: "Transporte", balance: 0, icon: "🏍️" },
    { id: "env-4", name: "Contas (Luz, Água)", category: "Contas", balance: 0, icon: "🔌" },
    { id: "env-5", name: "Remédio e Saúde", category: "Saúde", balance: 0, icon: "💊" },
    { id: "env-6", name: "Dívidas em aberto", category: "Dívidas", balance: 0, icon: "💸" },
    { id: "env-7", name: "Lazer e Passeio", category: "Lazer", balance: 0, icon: "🍿" },
    { id: "env-8", name: "Meta de Emergência", category: "Investimentos", balance: 0, icon: "🛡️" }
  ];

  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);

  // Sync schedules and envelopes when data.profile.email or data.incomeSources changes
  useEffect(() => {
    const expectedVal = data.incomeSources[0]?.expectedValue || 1600;
    const savedSchedules = localStorage.getItem(`financeai_schedules_${data.profile.email}`);
    if (savedSchedules) {
      try {
        const parsed = JSON.parse(savedSchedules);
        const lastExpected = parseFloat(localStorage.getItem(`financeai_expected_val_${data.profile.email}`) || "0");
        if (lastExpected > 0 && lastExpected !== expectedVal) {
          const ratio = expectedVal / lastExpected;
          const scaled = parsed.map((s: any) => ({
            ...s,
            amount: Math.round(s.amount * ratio)
          }));
          setSchedules(scaled);
          localStorage.setItem(`financeai_schedules_${data.profile.email}`, JSON.stringify(scaled));
        } else {
          setSchedules(parsed);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      setSchedules([
        { id: "sched-1", name: "Meu Salário (5º Dia Útil)", amount: Math.round(expectedVal * 0.6), ruleType: "quinto_dia_util" },
        { id: "sched-2", name: "Vale (Dia 20)", amount: Math.round(expectedVal * 0.4), ruleType: "dia_20" }
      ]);
    }
    localStorage.setItem(`financeai_expected_val_${data.profile.email}`, expectedVal.toString());

    const savedEnvelopes = localStorage.getItem(`financeai_envelopes_${data.profile.email}`);
    if (savedEnvelopes) {
      try {
        setEnvelopes(JSON.parse(savedEnvelopes));
      } catch (e) {
        console.error(e);
      }
    } else {
      setEnvelopes(defaultEnvelopes);
    }
  }, [data.profile.email, data.incomeSources]);

  // Save schedules when they change
  useEffect(() => {
    if (schedules && schedules.length > 0) {
      localStorage.setItem(`financeai_schedules_${data.profile.email}`, JSON.stringify(schedules));
    }
  }, [schedules, data.profile.email]);

  const saveEnvelopes = (updated: Envelope[]) => {
    setEnvelopes(updated);
    localStorage.setItem(`financeai_envelopes_${data.profile.email}`, JSON.stringify(updated));
  };

  const totalAllocatedEnvelopes = envelopes.reduce((sum, env) => sum + env.balance, 0);
  const unallocatedBalance = Math.max(0, netCashBalance - totalAllocatedEnvelopes);

  // Radar calculations based on riskProfile setting (Conservador = 30 days, Agressivo = 7 days, Moderado = 15 days)
  const riskProfile = data.profile.riskProfile || "moderado";
  const daysThreshold = riskProfile === "conservador" ? 30 : riskProfile === "agressivo" ? 7 : 15;

  const nextDays = new Date();
  nextDays.setDate(today.getDate() + daysThreshold);
  const billsIn15DaysList = (data.expenses || []).filter(exp => !exp.paid && new Date(exp.dueDate) <= nextDays);
  const billsIn15DaysSum = billsIn15DaysList.reduce((sum, exp) => sum + exp.amount, 0);

  // Risk & Advice
  let riskLevel = "low";
  let riskText = "Risco Baixo";
  let riskColor = "text-emerald-400 border-emerald-500/20 bg-emerald-950/10";
  let riskAdvice = `Suas contas dos próximos ${daysThreshold} dias estão bem cobertas pelo seu dinheiro disponível livre hoje. Ótimo trabalho!`;

  if (netCashBalance < billsIn15DaysSum) {
    riskLevel = "critical";
    riskText = "Risco Crítico";
    riskColor = "text-rose-400 border-rose-500/20 bg-rose-950/20";
    riskAdvice = `Seu saldo livre hoje não cobre as contas dos próximos ${daysThreshold} dias! Cuidado redobrado: evite novos gastos e garanta o básico.`;
  } else if (netCashBalance < billsIn15DaysSum * 1.25) {
    riskLevel = "medium";
    riskText = "Risco Moderado";
    riskColor = "text-amber-400 border-amber-500/20 bg-amber-950/20";
    riskAdvice = `Você tem o suficiente para os próximos ${daysThreshold} dias, mas com pouca folga. Tente não fazer compras supérfluas nos próximos dias.`;
  }

  // Auto Plan
  const weeklyFoodLimit = Math.round(Math.max(120, unallocatedBalance * 0.35 / 4));
  const weeklyTransportLimit = Math.round(Math.max(60, unallocatedBalance * 0.15 / 4));
  const weeklySavingSuggestion = unallocatedBalance > 150 ? Math.round(unallocatedBalance * 0.10) : 15;

  // Decision Simulator
  const [simType, setSimType] = useState<"compra" | "divida" | "guardar" | "viagem">("compra");
  const [simAmount, setSimAmount] = useState("");
  const [simInstallments, setSimInstallments] = useState("1");
  const [simSelectedLiabilityId, setSimSelectedLiabilityId] = useState("");
  const [simSelectedGoalId, setSimSelectedGoalId] = useState("");
  const [simTripMonths, setSimTripMonths] = useState("6");
  const [simFeedback, setSimFeedback] = useState<any>(null);

  const handleSimulateDecision = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(simAmount);
    if (isNaN(amt) || amt <= 0) return;

    if (simType === "compra") {
      const instCount = parseInt(simInstallments) || 1;
      const instVal = amt / instCount;

      if (amt > unallocatedBalance && instCount === 1) {
        setSimFeedback({
          status: "ARRISCADO",
          title: "🚨 Compra à vista desaconselhada!",
          description: `Gastar R$ ${amt.toLocaleString("pt-BR")} à vista vai estourar seu dinheiro livre de R$ ${unallocatedBalance.toLocaleString("pt-BR")}.`,
          impact: "Dica: Tente adiar a compra ou junte dinheiro aos poucos nas Caixinhas."
        });
      } else if (instVal > unallocatedBalance * 0.35) {
        setSimFeedback({
          status: "ARRISCADO",
          title: "⚠️ Parcela pesada demais!",
          description: `Uma parcela de R$ ${instVal.toLocaleString("pt-BR")} vai comprometer mais de 35% do seu caixa livre mensal atual.`,
          impact: "Isso aumenta muito seu risco de ficar negativo nos próximos meses se surgir qualquer emergência."
        });
      } else {
        setSimFeedback({
          status: "SEGURO",
          title: "🟢 Compra Liberada!",
          description: `Sua sobra de R$ ${unallocatedBalance.toLocaleString("pt-BR")} cobre perfeitamente esse gasto sem apertar suas contas.`,
          impact: "Excelente planejamento! Pode seguir em frente sem culpa."
        });
      }
    } else if (simType === "divida") {
      const debt = data.liabilities.find(l => l.id === simSelectedLiabilityId);
      const name = debt ? debt.name : "Dívida";
      const remaining = debt ? debt.remainingValue : 500;
      setSimFeedback({
        status: "SEGURO",
        title: "🟢 Redução de Dívidas!",
        description: `Amortizar R$ ${amt.toLocaleString("pt-BR")} reduz o saldo devedor da dívida "${name}" de R$ ${remaining.toLocaleString("pt-BR")} para R$ ${Math.max(0, remaining - amt).toLocaleString("pt-BR")}.`,
        impact: "Isso economiza juros caros cobrados pelos bancos e reduz seu aperto mensal!"
      });
    } else if (simType === "guardar") {
      const targetGoal = data.goals.find(g => g.id === simSelectedGoalId);
      const name = targetGoal ? targetGoal.name : "Sonho";
      setSimFeedback({
        status: "SEGURO",
        title: "🎉 Investindo no seu Futuro!",
        description: `Separar R$ ${amt.toLocaleString("pt-BR")} para sua meta "${name}" protege esse saldo de compras por impulso.`,
        impact: `Você vai alcançar seu sonho muito mais rápido. Parabéns por essa atitude!`
      });
    } else if (simType === "viagem") {
      const months = parseInt(simTripMonths) || 6;
      const monthly = amt / months;
      if (monthly > unallocatedBalance * 0.5) {
        setSimFeedback({
          status: "ARRISCADO",
          title: "🔴 Meta Pesada para o Bolso",
          description: `Poupar R$ ${monthly.toLocaleString("pt-BR")}/mês por ${months} meses compromete demais seu orçamento atual.`,
          impact: "Sugestão: Tente aumentar o prazo para diminuir o valor mensal a guardar."
        });
      } else {
        setSimFeedback({
          status: "SEGURO",
          title: "🟢 Plano Totalmente Viável!",
          description: `Poupar R$ ${monthly.toLocaleString("pt-BR")}/mês cabe confortavelmente na sua sobra livre hoje.`,
          impact: "Dica: Crie uma nova caixinha para essa viagem e comece a guardar hoje mesmo."
        });
      }
    }
  };

  // Monthly dream contribution handler
  const handleSaveForDream = () => {
    const amt = parseFloat(dreamSaveAmount);
    if (isNaN(amt) || amt <= 0 || activeGoals.length === 0) return;

    const target = activeGoals[0];
    if (amt > unallocatedBalance) {
      alert("Atenção: Seu saldo livre hoje é insuficiente para fazer esse aporte!");
      return;
    }

    if (onSaveForDream) {
      onSaveForDream(target.id, amt);
    } else {
      onAddTransaction({
        type: "expense",
        amount: amt,
        date: today.toISOString().split("T")[0],
        category: "Investimentos",
        accountId: "acc-1",
        description: `Aporte Sonho: ${target.name}`,
        isRecurring: false
      });

      if (onEditGoal) {
        onEditGoal(target.id, { currentValue: target.currentValue + amt });
      }
      if (onEditAccount) {
        const checking = data.accounts.find(a => a.id === "acc-1");
        if (checking) onEditAccount("acc-1", { balance: checking.balance - amt });
      }
    }

    localStorage.setItem(`financeai_dream_prompt_${data.profile.email}_${currentMonthStr}`, "done");
    setDreamSavedThisSession(true);
    setShowDreamPopup(false);
  };

  // Scheduled Paydays
  const handleTriggerScheduledIncome = (item: ScheduledIncome) => {
    if (onTriggerScheduledIncome) {
      onTriggerScheduledIncome(item);
    } else {
      onAddTransaction({
        type: "income",
        amount: item.amount,
        date: today.toISOString().split("T")[0],
        category: "Salário",
        accountId: "acc-1",
        description: `Recebimento: ${item.name}`,
        isRecurring: true
      });

      if (onEditAccount) {
        const checking = data.accounts.find(a => a.id === "acc-1");
        if (checking) onEditAccount("acc-1", { balance: checking.balance + item.amount });
      }
    }

    localStorage.setItem(`financeai_sched_registered_${item.id}_${currentMonthStr}`, "true");
    setSchedules([...schedules]);
    alert(`🎉 Sucesso! R$ ${item.amount.toLocaleString("pt-BR")} depositados na sua conta.`);
  };

  const handleConfirmPayday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaydayPrompt) return;
    const amt = parseFloat(paydayPromptAmount);
    if (isNaN(amt) || amt <= 0) return;

    const updatedSchedule = {
      ...activePaydayPrompt,
      amount: amt
    };

    handleTriggerScheduledIncome(updatedSchedule);
    setActivePaydayPrompt(null);
  };

  const handleDismissPayday = () => {
    if (!activePaydayPrompt) return;
    sessionStorage.setItem(`financeai_sched_dismissed_session_${activePaydayPrompt.id}`, "true");
    setActivePaydayPrompt(null);
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(schedAmount);
    if (!schedName.trim() || isNaN(amt) || amt <= 0) return;

    const newSched: ScheduledIncome = {
      id: "sched-" + Math.random().toString(36).substring(2, 9),
      name: schedName.trim(),
      amount: amt,
      ruleType: schedRule,
      specificDay: schedRule === "dia_especifico" ? parseInt(schedDay) || 10 : undefined
    };

    setSchedules([...schedules, newSched]);
    setSchedName("");
    setSchedAmount("");
  };

  const isSchedulePaidThisMonth = (id: string) => {
    return localStorage.getItem(`financeai_sched_registered_${id}_${currentMonthStr}`) === "true";
  };

  // Variable income and envelopes
  const totalExpensesThisMonth = data.expenses.reduce((sum, e) => sum + e.amount, 0);
  const incomeThisMonth = data.transactions
    .filter(t => t.type === "income" && t.date.startsWith(currentMonthStr))
    .reduce((sum, t) => sum + t.amount, 0);
  const missingToCoverExpenses = Math.max(0, totalExpensesThisMonth - incomeThisMonth);
  const incomeLast7Days = data.transactions
    .filter(t => t.type === "income" && new Date(t.date) >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000))
    .reduce((sum, t) => sum + t.amount, 0);
  const weeklyTarget = Math.round(totalExpensesThisMonth / 4) || 350;

  const handleEnvelopeAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnvId) return;
    const amt = parseFloat(envActionVal);
    if (isNaN(amt) || amt <= 0) return;

    const env = envelopes.find(ev => ev.id === selectedEnvId);
    if (!env) return;

    if (envActionType === "add") {
      if (amt > unallocatedBalance) {
        alert("Atenção: Saldo livre insuficiente!");
        return;
      }
      const updated = envelopes.map(ev => ev.id === selectedEnvId ? { ...ev, balance: ev.balance + amt } : ev);
      saveEnvelopes(updated);
    } else {
      if (amt > env.balance) {
        alert("Atenção: Caixinha sem saldo suficiente!");
        return;
      }
      onAddTransaction({
        type: "expense",
        amount: amt,
        date: today.toISOString().split("T")[0],
        category: env.category,
        accountId: "acc-1",
        description: envActionDesc.trim() || `Gasto Caixinha: ${env.name}`,
        isRecurring: false
      });
      const updated = envelopes.map(ev => ev.id === selectedEnvId ? { ...ev, balance: ev.balance - amt } : ev);
      saveEnvelopes(updated);
    }

    setSelectedEnvId(null);
    setEnvActionVal("");
    setEnvActionDesc("");
  };

  return (
    <div className="space-y-6 animate-fade-in" id="dashboard-view">

      {/* DREAM SUCCESS BANNER */}
      {dreamSavedThisSession && (
        <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 rounded-3xl flex items-center justify-between text-xs" id="dream-save-success-banner">
          <div>🎉 <strong>Aporte Realizado!</strong> Seu dinheiro está blindado contra gastos supérfluos na caixinha do seu sonho.</div>
          <button onClick={() => setDreamSavedThisSession(false)} className="font-mono hover:text-white px-2 py-1 bg-white/5 rounded">Fechar</button>
        </div>
      )}

      {/* PAYDAY INCOME PROMPTER */}
      {activePaydayPrompt && (
        <div className="bg-gradient-to-r from-emerald-950/30 to-[#111111] border border-emerald-500/25 rounded-3xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left shadow-lg" id="payday-income-prompt">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Recebimento de Renda Agendada
            </span>
            <h3 className="text-sm font-bold text-white">Você já recebeu seu pagamento de "{activePaydayPrompt.name}" este mês?</h3>
            <p className="text-xs text-slate-400">Ajude o FinanceAI a manter seu controle atualizado confirmando o valor recebido.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <div className="flex bg-[#050505] px-2.5 py-1.5 rounded-xl border border-white/10 text-xs w-28 font-mono">
              <span className="text-slate-500 mr-1">R$</span>
              <input 
                type="number" 
                className="bg-transparent text-white outline-none w-full font-bold" 
                value={paydayPromptAmount} 
                onChange={(e) => setPaydayPromptAmount(e.target.value)} 
              />
            </div>
            <button 
              onClick={handleConfirmPayday} 
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase cursor-pointer transition shadow"
            >
              Sim, Recebi
            </button>
            <button 
              onClick={handleDismissPayday} 
              className="px-3 py-2 bg-white/5 text-slate-400 hover:text-white rounded-xl text-xs cursor-pointer transition font-semibold"
            >
              Depois
            </button>
          </div>
        </div>
      )}

      {/* MONTHLY DREAM SAVING PROMPTER */}
      {showDreamPopup && activeGoals.length > 0 && !dreamSavedThisSession && (
        <div className="bg-gradient-to-r from-indigo-950/30 to-[#111111] border border-indigo-500/20 rounded-3xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left" id="monthly-dream-popup">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">💭 Guardar para o seu sonho</span>
            <h3 className="text-sm font-bold text-white">Que tal reservar um valor para "{activeGoals[0].name}" este mês?</h3>
            <p className="text-xs text-slate-400">Separar esse dinheiro hoje protege seu futuro contra compras supérfluas.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <div className="flex bg-[#050505] px-2.5 py-1.5 rounded-xl border border-white/10 text-xs w-28 font-mono">
              <span className="text-slate-500 mr-1">R$</span>
              <input type="number" className="bg-transparent text-white outline-none w-full" value={dreamSaveAmount} onChange={(e) => setDreamSaveAmount(e.target.value)} />
            </div>
            <button onClick={handleSaveForDream} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase cursor-pointer">Guardar</button>
            <button onClick={() => { localStorage.setItem(`financeai_dream_prompt_${data.profile.email}_${currentMonthStr}`, "dismissed"); setShowDreamPopup(false); }} className="px-3 py-2 bg-white/5 text-slate-400 rounded-xl text-xs cursor-pointer">Depois</button>
          </div>
        </div>
      )}

      {/* PROACTIVE AI COPILOT ADVICE CARD */}
      {data.profile.showProactiveAIHints !== false && (
        <div className="p-5 bg-[#111111] border border-indigo-500/15 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-left relative overflow-hidden" id="proactive-copilot-card">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-1.5 z-10">
            <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider block flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> 
              Conselheiro Proativo Co-Piloto AI
            </span>
            
            {!data.profile.spendingPersona ? (
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Seu Co-piloto Adaptativo está pronto!</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Personalize seu perfil respondendo às perguntas rápidas na aba <strong>Ajustes &gt; Meu Perfil</strong> para receber conselhos direcionados de corte de despesas, metas de investimento e alertas proativos.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  Conselho para Perfil{" "}
                  <span className="text-indigo-400 font-extrabold capitalize">
                    {data.profile.spendingPersona === "gastador" && "Gastador Emocional ⚠️"}
                    {data.profile.spendingPersona === "poupador" && "Poupador Extremo 🌱"}
                    {data.profile.spendingPersona === "investidor" && "Investidor de Longo Prazo 📈"}
                    {data.profile.spendingPersona === "planejador" && "Planejador Consciente 📋"}
                  </span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {data.profile.spendingPersona === "gastador" && (
                    <span>
                      Identificamos que compras por impulso são seu ponto fraco. Para este mês, sugerimos criar uma <strong>regra de 24 horas</strong> antes de qualquer compra supérflua acima de R$ 100. Seu teto de gastos diário é essencial para segurar o ímpeto!
                    </span>
                  )}
                  {data.profile.spendingPersona === "poupador" && (
                    <span>
                      Você possui uma excelente disciplina para guardar! Lembre-se apenas de destinar uma pequena parcela para o seu lazer (como delivery ou passeios) para evitar frustrações. Poupar com inteligência é poupar com sustentabilidade.
                    </span>
                  )}
                  {data.profile.spendingPersona === "investidor" && (
                    <span>
                      Excelente foco! Como seu objetivo são os aportes, que tal destinar parte do saldo livre de hoje (R$ {Math.floor(netCashBalance * 0.2)}) para a sua caixinha de investimentos? Fazer aportes semanais acelera o efeito dos juros compostos.
                    </span>
                  )}
                  {data.profile.spendingPersona === "planejador" && (
                    <span>
                      Seu controle metódico é seu maior superpoder! Para otimizar suas finanças, tente prever os vencimentos futuros com antecedência e use o simulador de decisões para verificar o impacto de compras parceladas nas suas metas.
                    </span>
                  )}
                </p>
                
                {data.profile.mainSavingsFocus && (
                  <p className="text-[10px] text-slate-500 pt-1 border-t border-white/5 mt-2">
                    🎯 <strong>Recomendação de Foco:</strong>{" "}
                    {data.profile.mainSavingsFocus === "reserve" && "Com o foco em Reserva de Emergência, certifique-se de preencher a caixinha até cobrir 6 meses de gastos fixos. Evite investimentos de risco até lá."}
                    {data.profile.mainSavingsFocus === "debts" && "Com o foco em Quitar Dívidas, evite parcelamentos novos no cartão! Amortize as parcelas restantes do seu financiamento para reduzir os juros."}
                    {data.profile.mainSavingsFocus === "investments" && "Com o foco em Investimentos, priorize aumentar seu patrimônio no Tesouro IPCA ou outros ativos seguros antes de gastar qualquer sobra de caixa."}
                    {data.profile.mainSavingsFocus === "leisure_cut" && "Com o foco em Cortar Supérfluos, fique atento aos gastos invisíveis (assinaturas não utilizadas, delivery recorrente). Crie limites rígidos de lazer!"}
                  </p>
                )}
              </div>
            )}
          </div>
          
          {!data.profile.spendingPersona && (
            <div className="shrink-0 pt-2 md:pt-0">
              <span className="text-[10px] text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full font-bold">
                Ajustes &gt; Meu Perfil
              </span>
            </div>
          )}
        </div>
      )}

      {/* COUNTERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#111111] border border-white/10 rounded-3xl p-5 text-left relative overflow-hidden" id="net-worth-card">
          <div className="text-slate-500 text-[10px] font-bold tracking-wider uppercase mb-1 font-mono">Dinheiro Disponível Hoje</div>
          <div className="text-2xl font-display font-bold text-white tracking-tight">R$ {netCashBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
          <p className="text-[10px] text-slate-400 mt-2">Seu saldo total líquido nas contas (descontando o cartão hoje).</p>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-3xl p-5 text-left relative overflow-hidden" id="projected-cashflow-card">
          <div className="text-slate-500 text-[10px] font-bold tracking-wider uppercase mb-1 font-mono">Sobra Estimada no Fim do Mês</div>
          <div className="text-2xl font-display font-bold text-white tracking-tight">R$ {Math.floor(projectedBalance).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
          <p className="text-[10px] text-slate-400 mt-2">O que deve sobrar baseado nas suas contas recorrentes cadastradas.</p>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-3xl p-5 text-left relative overflow-hidden" id="score-card">
          <div className="text-slate-500 text-[10px] font-bold tracking-wider uppercase mb-1 font-mono">Controle de Hábitos</div>
          <div className="text-2xl font-display font-bold text-white tracking-tight">{financialScore} <span className="text-slate-500 text-sm">/ 100</span></div>
          <div className="w-full bg-white/5 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${financialScore}%` }} />
          </div>
        </div>
      </div>

      {/* STRATEGIC ASSISTANT MODULES */}
      <div className="bg-[#111111] border border-white/10 rounded-3xl overflow-hidden" id="assistant-platform">
        <div className="bg-[#0b0b0b] border-b border-white/10 p-1.5 flex flex-wrap gap-1">
          {[
            { id: "radar", label: "Radar & Plano", icon: <Compass className="w-3.5 h-3.5" /> },
            { id: "simulador", label: "Simulador de Decisão", icon: <HelpCircle className="w-3.5 h-3.5" /> },
            { id: "caixinhas", label: "Caixinhas (Guardar)", icon: <Coins className="w-3.5 h-3.5" /> },
            { 
              id: "renda", 
              label: data.profile.incomeType === "CLT" ? "Rendas & CLT/Vale" : data.profile.incomeType === "variavel" ? "Ganhos & Autônomo" : "Rendas Mistas", 
              icon: <Briefcase className="w-3.5 h-3.5" /> 
            }
          ].map((tab) => (
            <button
              id={`subtab-${tab.id}`}
              key={tab.id}
              onClick={() => { setActiveSubTab(tab.id as any); setSimFeedback(null); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition cursor-pointer ${
                activeSubTab === tab.id ? "bg-[#111111] text-indigo-400 border border-white/5 shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            <motion.div key={activeSubTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.1 }}>
              
              {/* RADAR & WEEKLY PLAN */}
              {activeSubTab === "radar" && (
                <div className="space-y-5" id="radar-subtab-panel">
                  <div className={`p-4 rounded-2xl border text-left text-xs ${riskColor}`} id="radar-risk-box">
                    <div className="font-bold mb-1">Risco Próximos {daysThreshold} Dias ({riskProfile.toUpperCase()}): {riskText}</div>
                    <p className="text-slate-300">Contas a pagar até lá: <strong>R$ {billsIn15DaysSum.toLocaleString("pt-BR")}</strong>. Saldo disponível livre: <strong>R$ {netCashBalance.toLocaleString("pt-BR")}</strong>.</p>
                    <p className="text-slate-400 mt-1 italic"><strong>Dica do assistente:</strong> {riskAdvice}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                    <div className="bg-[#050505] border border-white/5 p-4 rounded-2xl space-y-3">
                      <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-indigo-400" /> Radar de Vencimentos</h4>
                      <div className="space-y-1.5">
                        {billsIn15DaysList.slice(0, 3).map(bill => (
                          <div key={bill.id} className="p-2 bg-[#111111] border border-white/5 rounded-lg flex justify-between text-xs">
                            <span className="text-slate-300 font-bold">{bill.name}</span>
                            <span className="font-mono text-slate-400">R$ {bill.amount}</span>
                          </div>
                        ))}
                        {billsIn15DaysList.length === 0 && <p className="text-xs text-slate-500 italic py-2">Nenhuma conta próxima vencendo!</p>}
                      </div>
                      <div className="border-t border-white/5 pt-2 text-[10px] text-slate-400">
                        <strong>Passo Recomendado:</strong> Fazer um depósito de R$ 15 na caixinha de reserva esta semana para proteger seu caixa contra emergências.
                      </div>
                    </div>

                    <div className="bg-[#050505] border border-white/5 p-4 rounded-2xl space-y-3">
                      <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Award className="w-3.5 h-3.5 text-indigo-400" /> Plano Semanal Prático</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-[#111111] rounded-lg">
                          <span className="text-[9px] text-slate-500 block">Teto Alimentação</span>
                          <strong className="text-white font-mono">R$ {weeklyFoodLimit} / sem</strong>
                        </div>
                        <div className="p-2 bg-[#111111] rounded-lg">
                          <span className="text-[9px] text-slate-500 block">Teto Transporte</span>
                          <strong className="text-white font-mono">R$ {weeklyTransportLimit} / sem</strong>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        💰 <strong>Guardar sugerido:</strong> R$ {weeklySavingSuggestion} esta semana. 
                        <br />⚠️ <strong>Aviso:</strong> Evite o rotativo do cartão pagando faturas cheias!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* DECISION SIMULATOR */}
              {activeSubTab === "simulador" && (
                <div className="space-y-5 text-left" id="simulador-subtab-panel">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <form onSubmit={handleSimulateDecision} className="bg-[#050505] p-4 rounded-2xl border border-white/5 space-y-3 text-xs">
                      <div className="grid grid-cols-4 gap-1">
                        {["compra", "divida", "guardar", "viagem"].map(type => (
                          <button key={type} type="button" onClick={() => { setSimType(type as any); setSimFeedback(null); }} className={`p-1.5 rounded-lg border text-center text-[10px] font-bold uppercase cursor-pointer ${simType === type ? "bg-indigo-600/10 border-indigo-500/50 text-white" : "bg-[#111111] border-white/5 text-slate-400"}`}>
                            {type}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-slate-500 block">Valor da Intenção (R$)</label>
                        <input type="number" className="w-full px-3 py-1.5 bg-[#111111] border border-white/10 rounded-xl text-xs text-white font-mono outline-none" placeholder="ex: 120" value={simAmount} onChange={(e) => setSimAmount(e.target.value)} required />
                      </div>

                      {simType === "compra" && (
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-slate-500 block">Parcelas?</label>
                          <select className="w-full px-2 py-1.5 bg-[#111111] border border-white/10 rounded-xl text-xs text-white cursor-pointer" value={simInstallments} onChange={(e) => setSimInstallments(e.target.value)}>
                            <option value="1">À vista</option>
                            <option value="3">3 vezes</option>
                            <option value="6">6 vezes</option>
                            <option value="12">12 vezes</option>
                          </select>
                        </div>
                      )}

                      {simType === "divida" && (
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-slate-500 block">Qual dívida?</label>
                          <select className="w-full px-2 py-1.5 bg-[#111111] border border-white/10 rounded-xl text-xs text-white cursor-pointer" value={simSelectedLiabilityId} onChange={(e) => setSimSelectedLiabilityId(e.target.value)}>
                            <option value="">-- Escolher Dívida --</option>
                            {data.liabilities.map(l => <option key={l.id} value={l.id}>{l.name} (R$ {l.remainingValue})</option>)}
                          </select>
                        </div>
                      )}

                      {simType === "guardar" && (
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-slate-500 block">Sonho Destino</label>
                          <select className="w-full px-2 py-1.5 bg-[#111111] border border-white/10 rounded-xl text-xs text-white cursor-pointer" value={simSelectedGoalId} onChange={(e) => setSimSelectedGoalId(e.target.value)}>
                            <option value="">-- Escolher Sonho --</option>
                            {data.goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                          </select>
                        </div>
                      )}

                      {simType === "viagem" && (
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-slate-500 block">Prazo em meses</label>
                          <input type="number" className="w-full px-3 py-1 bg-[#111111] border border-white/10 rounded-xl text-xs text-white" value={simTripMonths} onChange={(e) => setSimTripMonths(e.target.value)} />
                        </div>
                      )}

                      <button type="submit" className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer">Simular Escolha</button>
                    </form>

                    <div>
                      {simFeedback ? (
                        <div className="bg-[#050505] p-4 rounded-2xl border border-white/5 space-y-2 text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] font-mono text-slate-500 uppercase">Laudo Técnico</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${simFeedback.status === "SEGURO" ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"}`}>{simFeedback.status}</span>
                          </div>
                          <h4 className="font-bold text-white text-sm">{simFeedback.title}</h4>
                          <p className="text-slate-300 leading-relaxed">{simFeedback.description}</p>
                          <div className="p-2.5 bg-indigo-500/5 rounded-xl text-indigo-300 text-[11px]">{simFeedback.impact}</div>
                        </div>
                      ) : (
                        <div className="h-full bg-[#050505] p-6 rounded-2xl border border-white/5 flex flex-col justify-center items-center text-slate-500 italic text-xs">
                          Preencha a simulação ao lado para prever os riscos à sua saúde financeira!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* CAIXINHAS ENVELOPES */}
              {activeSubTab === "caixinhas" && (
                <div className="space-y-4" id="caixinhas-subtab-panel">
                  <div className="flex justify-between items-center text-xs text-left mb-2">
                    <div>
                      <h4 className="font-bold text-white">Separar por Envelopes</h4>
                      <p className="text-slate-400">Blinde o dinheiro essencial para não gastar por engano.</p>
                    </div>
                    <div className="font-mono text-indigo-400 bg-black/30 px-3 py-1.5 rounded-xl border border-white/5">Disponível livre: R$ {unallocatedBalance}</div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                    {envelopes.map(env => (
                      <div key={env.id} className="bg-[#050505] border border-white/5 p-3 rounded-2xl space-y-2 flex flex-col justify-between">
                        <div className="flex justify-between">
                          <span className="text-xl">{env.icon}</span>
                          <span className="font-mono text-xs text-indigo-300 font-bold">R$ {env.balance}</span>
                        </div>
                        <div className="truncate text-[11px] font-bold text-slate-200">{env.name}</div>
                        <div className="grid grid-cols-2 gap-1 pt-1">
                          <button onClick={() => { setSelectedEnvId(env.id); setEnvActionType("add"); }} className="py-1 bg-indigo-500/10 hover:bg-indigo-600 text-[9px] font-bold uppercase rounded cursor-pointer text-center text-indigo-300 hover:text-white">Separar</button>
                          <button onClick={() => { setSelectedEnvId(env.id); setEnvActionType("spend"); }} className="py-1 bg-rose-500/10 hover:bg-rose-600 text-[9px] font-bold uppercase rounded cursor-pointer text-center text-rose-300 hover:text-white">Gastar</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedEnvId && (
                    <form onSubmit={handleEnvelopeAction} className="p-4 bg-[#050505] border border-indigo-500/20 rounded-xl flex flex-col sm:flex-row gap-2 text-left" id="envelope-form">
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-2 text-slate-500 text-xs">R$</span>
                        <input type="number" placeholder="Quantia" className="w-full pl-7 pr-2 py-1.5 bg-[#111111] text-xs text-white border border-white/10 rounded-lg" value={envActionVal} onChange={(e) => setEnvActionVal(e.target.value)} required />
                      </div>
                      {envActionType === "spend" && (
                        <input type="text" placeholder="O que comprou?" className="flex-1 px-2.5 py-1.5 bg-[#111111] text-xs text-white border border-white/10 rounded-lg" value={envActionDesc} onChange={(e) => setEnvActionDesc(e.target.value)} required />
                      )}
                      <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold uppercase rounded-lg cursor-pointer">Confirmar</button>
                    </form>
                  )}
                </div>
              )}

              {/* RENDAS & AGENDA */}
              {activeSubTab === "renda" && (
                <div className="space-y-5 text-left" id="renda-subtab-panel">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                    <div className="space-y-3 bg-[#050505] p-4 rounded-2xl border border-white/5">
                      <h4 className="font-bold text-white flex justify-between">
                        <span>
                          {data.profile.incomeType === "CLT" 
                            ? "🗓️ Agendados (CLT / Vale)" 
                            : data.profile.incomeType === "variavel" 
                            ? "🗓️ Projeções de Ganhos" 
                            : "🗓️ Recebimentos (Fixo e Misto)"}
                        </span>
                        <span className="font-mono text-[9px] text-indigo-400">{currentMonthStr}</span>
                      </h4>
                      <div className="space-y-2">
                        {schedules.map(item => {
                          const isPaid = isSchedulePaidThisMonth(item.id);
                          return (
                            <div key={item.id} className="p-2.5 bg-[#111111] rounded-xl flex justify-between items-center">
                              <div>
                                <span className="font-bold text-slate-200 block">{item.name}</span>
                                <span className="text-[10px] text-slate-500 font-mono">Regra: {item.ruleType} • R$ {item.amount}</span>
                              </div>
                              {!isPaid ? (
                                <button onClick={() => handleTriggerScheduledIncome(item)} className="px-2.5 py-1 bg-indigo-600 text-white text-[9px] font-bold rounded cursor-pointer uppercase flex items-center gap-1"><Plus className="w-2.5 h-2.5" /> Receber</button>
                              ) : (
                                <span className="text-emerald-400 font-bold">✔ Recebido</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3 bg-[#050505] p-4 rounded-2xl border border-white/5">
                      <h4 className="font-bold text-white">📈 Autônomos e Ganhos Pix</h4>
                      <div className="p-2.5 bg-[#111111] rounded-xl space-y-1.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Arrecadado este mês:</span>
                          <span className="text-slate-300 font-mono">R$ {incomeThisMonth} / R$ {totalExpensesThisMonth}</span>
                        </div>
                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${safePercent(incomeThisMonth, totalExpensesThisMonth)}%` }} />
                        </div>
                        {missingToCoverExpenses > 0 ? (
                          <p className="text-[10px] text-amber-300">Falta faturar R$ {missingToCoverExpenses} para cobrir suas contas fixas do mês.</p>
                        ) : (
                          <p className="text-[10px] text-emerald-400 font-bold">Contas fixas 100% cobertas!</p>
                        )}
                      </div>

                      <div className="p-2 bg-[#111111] rounded-xl flex justify-between text-[10px] text-slate-400">
                        <span>Últimos 7 dias faturados: R$ {incomeLast7Days}</span>
                        <span>Meta semanal recomendada: R$ {weeklyTarget}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* QUICK LAUNCHER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="md:col-span-2 space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Conselhos Compassivos</h3>
          <div className="space-y-2.5">
            {data.aiInsights.slice(0, 2).map(ins => (
              <div key={ins.id} className="p-4 bg-[#111111] border border-white/5 rounded-2xl flex gap-3 text-xs leading-relaxed">
                <span className="text-indigo-400 mt-0.5">💡</span>
                <p className="text-slate-300">{ins.insight}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lançamento de Despesa</h3>
          <div className="bg-[#111111] border border-white/10 rounded-2xl p-4 space-y-3">
            <input type="text" placeholder="Gasto (ex: Pão feira)" className="w-full px-3 py-1.5 bg-[#050505] border border-white/10 rounded-xl text-xs text-white outline-none" value={quickDesc} onChange={(e) => setQuickDesc(e.target.value)} />
            <input type="number" placeholder="Valor (ex: 15.00)" className="w-full px-3 py-1.5 bg-[#050505] border border-white/10 rounded-xl text-xs text-white outline-none" value={quickAmount} onChange={(e) => setQuickAmount(e.target.value)} />
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button onClick={() => {
                const amt = parseFloat(quickAmount);
                if (isNaN(amt) || amt <= 0 || !quickDesc.trim()) return;
                setSimResult(`Esse gasto reduz seu dinheiro livre para R$ ${(netCashBalance - amt).toLocaleString("pt-BR")}. Isso adia suas metas em cerca de ${Math.ceil(amt / 12)} dias.`);
              }} className="py-1.5 bg-white/5 border border-white/10 text-slate-300 rounded-xl cursor-pointer uppercase text-[9px]">Simular</button>
              <button onClick={() => {
                const amt = parseFloat(quickAmount);
                if (isNaN(amt) || amt <= 0 || !quickDesc.trim()) return;
                onAddTransaction({ type: "expense", amount: amt, date: today.toISOString().split("T")[0], category: "Lazer", accountId: "acc-1", description: quickDesc, isRecurring: false });
                setQuickAmount(""); setQuickDesc(""); setSimResult(null);
              }} className="py-1.5 bg-indigo-600 text-white rounded-xl cursor-pointer uppercase text-[9px]">Salvar</button>
            </div>
            {simResult && <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 text-indigo-300 text-[10px] rounded-xl leading-relaxed">{simResult}</div>}
          </div>
        </div>
      </div>

    </div>
  );
}
