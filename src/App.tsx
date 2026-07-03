/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, TrendingUp, Briefcase, Award, Bot, Settings, 
  Sparkles, RefreshCw, Cloud, Link, AlertTriangle, LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ExcelDatabase, Transaction, Asset, Liability, Goal, Profile, Settings as SettingsType } from "./types";
import Dashboard from "./components/Dashboard";
import FluxoFinanceiro from "./components/FluxoFinanceiro";
import Patrimonio from "./components/Patrimonio";
import MetasView from "./components/MetasView";
import ConsultorIA from "./components/ConsultorIA";
import SettingsView from "./components/SettingsView";
import OnboardingModal, { OnboardingData } from "./components/OnboardingModal";
import LoginView from "./components/LoginView";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "fluxo" | "patrimonio" | "metas" | "coach" | "settings">("dashboard");
  const [db, setDb] = useState<ExcelDatabase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guestMode, setGuestMode] = useState(false);
  const [session, setSession] = useState<{ authenticated: boolean; user?: { name: string; email: string; userId: string } }>({ authenticated: false });

  // Fetch Microsoft Session Status
  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        setSession(data);
      }
    } catch (err) {
      console.error("Erro ao carregar sessão Microsoft:", err);
    }
  };

  // Fetch Excel database from our server
  const fetchDb = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/db");
      if (!res.ok) throw new Error("Falha ao sincronizar com o banco de dados simulado.");
      const data = await res.json();
      setDb(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro desconhecido de sincronização.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchDb();
  }, []);

  // Listen for the postMessage indicating successful authentication from the popup
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      // Accept messages from AI Studio preview domain or localhost
      if (!origin.endsWith(".run.app") && !origin.includes("localhost")) {
        return;
      }
      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        fetchSession().then(() => fetchDb());
      }
    };
    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, []);

  // Open Microsoft OAuth popup
  const handleConnectMicrosoft = async () => {
    try {
      const res = await fetch("/api/auth/url");
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Erro ao obter link de autorização.");
      }
      const { url } = await res.json();
      
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        url,
        "microsoft_oauth_popup",
        `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
      );

      if (!popup) {
        alert("O bloqueador de popups impediu a conexão. Por favor, autorize popups para este site e tente novamente.");
      }
    } catch (err: any) {
      console.error("Falha ao abrir popup Microsoft:", err);
      alert("Falha ao conectar com o OneDrive: " + err.message);
    }
  };

  // Logout / Disconnect Microsoft Account
  const handleDisconnectMicrosoft = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        setSession({ authenticated: false });
        setGuestMode(false);
        fetchDb();
      }
    } catch (err) {
      console.error("Falha ao desconectar conta Microsoft:", err);
    }
  };

  // Post changes helper
  const saveDb = async (updatedDb: ExcelDatabase) => {
    setDb(updatedDb);
    try {
      const res = await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDb)
      });
      if (!res.ok) throw new Error("Erro de gravação no Excel simulado.");
    } catch (err) {
      console.error("Falha ao gravar no backend:", err);
      alert("Alerta: Seus dados estão em cache no navegador, mas houve falha ao sincronizar com o arquivo no servidor.");
    }
  };

  // 1. Onboarding completion callback
  const handleOnboardingComplete = async (onboardingData: OnboardingData) => {
    if (!db) return;
    
    // Distribute Estimated Monthly Expenses:
    // Rent: 60%, Internet/Utilities: 25%, Streaming/Leisure: 15%
    const expHousing = Math.round(onboardingData.monthlyExpenses * 0.60);
    const expServices = Math.round(onboardingData.monthlyExpenses * 0.25);
    const expLeisure = Math.round(onboardingData.monthlyExpenses * 0.15);

    // Dynamic accounts balance setting
    const updatedAccounts = db.accounts.map(acc => {
      if (acc.id === "acc-1") {
        // Checking Account Liquidity: 30% of monthly income, minimum 500
        return { ...acc, balance: Math.max(500, Math.round(onboardingData.monthlyIncome * 0.3)) };
      }
      if (acc.id === "acc-2") {
        // Savings/Emergency: direct input of savings
        return { ...acc, balance: onboardingData.currentSavings };
      }
      return acc;
    });

    // Dynamic income sources
    const updatedIncomeSources = db.incomeSources.map(inc => {
      if (inc.id === "inc-1") {
        return { ...inc, expectedValue: onboardingData.monthlyIncome };
      }
      return inc;
    });

    // Dynamic expenses
    const updatedExpenses = db.expenses.map(exp => {
      if (exp.id === "exp-1") {
        return { ...exp, amount: expHousing };
      }
      if (exp.id === "exp-2") {
        return { ...exp, amount: expServices };
      }
      if (exp.id === "exp-3") {
        return { ...exp, amount: expLeisure };
      }
      return exp;
    });

    // Dynamic goals adaptation
    const updatedGoals = db.goals.map(goal => {
      if (goal.id === "goal-1") {
        // Emergency reserve (6 months of their estimated fixed costs)
        return { 
          ...goal, 
          currentValue: onboardingData.currentSavings,
          targetValue: onboardingData.monthlyExpenses * 6
        };
      }
      if (goal.id === "goal-2" && onboardingData.financialGoal) {
        // Change the major target to their custom goal
        return {
          ...goal,
          name: onboardingData.financialGoal,
          currentValue: Math.round(onboardingData.currentSavings * 0.2) // Assume 20% of current savings goes to this dream
        };
      }
      return goal;
    });

    // Dynamic initial transaction to seed history correctly
    const currentYear = new Date().getFullYear();
    const currentMonthStr = String(new Date().getMonth() + 1).padStart(2, "0");
    const updatedTransactions = [
      {
        id: "tx-init-1",
        type: "income" as const,
        amount: onboardingData.monthlyIncome,
        date: `${currentYear}-${currentMonthStr}-01`,
        category: "Salário",
        accountId: "acc-1",
        description: "Salário / Receita Inicial Configurada",
        isRecurring: true
      },
      {
        id: "tx-init-2",
        type: "expense" as const,
        amount: expHousing,
        date: `${currentYear}-${currentMonthStr}-05`,
        category: "Moradia",
        accountId: "acc-1",
        description: "Despesa Moradia Estimada",
        isRecurring: true
      }
    ];

    const updated = {
      ...db,
      profile: {
        ...db.profile,
        name: onboardingData.name,
        incomeType: onboardingData.incomeType,
        payFrequency: onboardingData.payFrequency,
        financialGoal: onboardingData.financialGoal,
        riskProfile: onboardingData.riskProfile,
        onboardingCompleted: true
      },
      accounts: updatedAccounts,
      incomeSources: updatedIncomeSources,
      expenses: updatedExpenses,
      goals: updatedGoals,
      transactions: updatedTransactions
    };

    await saveDb(updated);
  };

  // 2. Add Transaction Action
  const handleAddTransaction = async (txData: Omit<Transaction, "id">) => {
    if (!db) return;
    const newTx: Transaction = {
      ...txData,
      id: "tx-" + Math.random().toString(36).substr(2, 9)
    };

    // Calculate updated balances (deterministic Cap 10)
    const updatedAccounts = db.accounts.map(acc => {
      if (acc.id === txData.accountId) {
        return {
          ...acc,
          balance: txData.type === "expense" ? acc.balance - txData.amount : acc.balance + txData.amount
        };
      }
      return acc;
    });

    // Create a timeline event
    const newTimeline = [
      ...db.timeline,
      {
        id: "tl-" + Math.random().toString(36).substr(2, 9),
        date: txData.date,
        event: `${txData.type === "income" ? "Receita" : "Despesa"} Adicionada`,
        impact: `${txData.description} (Categoria: ${txData.category})`,
        financialChange: txData.type === "income" ? txData.amount : -txData.amount
      }
    ];

    // Trigger standard alert heuristics if spending is abnormal
    const newInsights = [...db.aiInsights];
    if (txData.type === "expense" && txData.amount > 1000) {
      newInsights.unshift({
        id: "ins-" + Math.random().toString(36).substr(2, 9),
        insight: `Nota de Gasto Excepcional: O lançamento de R$ ${txData.amount.toFixed(2)} em ${txData.description} impacta sua liquidez líquida imediata. Verifique se o valor está alinhado com seu orçamento adaptativo.`,
        severity: "medium",
        createdAt: new Date().toISOString().replace("T", " ").substr(0, 19),
        relatedDomain: "Expenses"
      });
    }

    const updated = {
      ...db,
      accounts: updatedAccounts,
      transactions: [...db.transactions, newTx],
      timeline: newTimeline,
      aiInsights: newInsights
    };

    await saveDb(updated);
  };

  // 3. Delete Transaction Action
  const handleDeleteTransaction = async (id: string) => {
    if (!db) return;
    const txToDelete = db.transactions.find(t => t.id === id);
    if (!txToDelete) return;

    // Reverse mathematical impact on account balance
    const updatedAccounts = db.accounts.map(acc => {
      if (acc.id === txToDelete.accountId) {
        return {
          ...acc,
          balance: txToDelete.type === "expense" ? acc.balance + txToDelete.amount : acc.balance - txToDelete.amount
        };
      }
      return acc;
    });

    const updated = {
      ...db,
      accounts: updatedAccounts,
      transactions: db.transactions.filter(t => t.id !== id)
    };

    await saveDb(updated);
  };

  // 4. Add Asset Action
  const handleAddAsset = async (assetData: Omit<Asset, "id">) => {
    if (!db) return;
    const newAsset: Asset = {
      ...assetData,
      id: "ast-" + Math.random().toString(36).substr(2, 9)
    };
    const updated = {
      ...db,
      assets: [...db.assets, newAsset]
    };
    await saveDb(updated);
  };

  // 5. Add Liability Action
  const handleAddLiability = async (liabData: Omit<Liability, "id">) => {
    if (!db) return;
    const newLiab: Liability = {
      ...liabData,
      id: "lia-" + Math.random().toString(36).substr(2, 9)
    };
    const updated = {
      ...db,
      liabilities: [...db.liabilities, newLiab]
    };
    await saveDb(updated);
  };

  // 6. Add Goal Action
  const handleAddGoal = async (goalData: Omit<Goal, "id">) => {
    if (!db) return;
    const newGoal: Goal = {
      ...goalData,
      id: "goal-" + Math.random().toString(36).substr(2, 9)
    };
    const updated = {
      ...db,
      goals: [...db.goals, newGoal]
    };
    await saveDb(updated);
  };

  // 7. Simulation logger (saves simulation warnings to AI Insights)
  const handleSimulateGasto = async (amount: number, description: string) => {
    if (!db) return;
    const newInsight = {
      id: "ins-" + Math.random().toString(36).substr(2, 9),
      insight: `Simulação de Gasto Realizada: R$ ${amount.toFixed(2)} para "${description}". Se realizada, sua projeção de saldo livre para investimentos cairá proporcionalmente.`,
      severity: "low" as const,
      createdAt: new Date().toISOString().replace("T", " ").substr(0, 19),
      relatedDomain: "AI_Insights"
    };

    const updated = {
      ...db,
      aiInsights: [newInsight, ...db.aiInsights]
    };
    await saveDb(updated);
  };

  // Reset Excel database to factory seed
  const handleResetDatabase = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}) // Sending empty body tells server to regenerate seed
      });
      if (res.ok) {
        await fetchDb();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center font-sans">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
        <p className="text-gray-400 text-sm font-mono uppercase tracking-wider">Iniciando Motor Financeiro...</p>
      </div>
    );
  }

  if (!session.authenticated && !guestMode) {
    return (
      <LoginView
        onLoginMicrosoft={handleConnectMicrosoft}
        onContinueAsGuest={() => setGuestMode(true)}
        loadingSession={loading}
      />
    );
  }

  if (error || !db) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center font-sans">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Erro de Inicialização</h2>
        <p className="text-gray-400 text-sm max-w-md leading-relaxed mb-6">{error || "Falha ao carregar planilhas de simulação."}</p>
        <button 
          onClick={fetchDb}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition"
        >
          Tentar Reconectar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 flex">
      {/* Dynamic onboarding trigger */}
      <AnimatePresence>
        {!db.profile.onboardingCompleted && (
          <OnboardingModal 
            onComplete={handleOnboardingComplete} 
            defaultName={session.user?.name || ""}
          />
        )}
      </AnimatePresence>

      {/* Persistent Left Sidebar Navigation */}
      <aside className="w-64 border-r border-white/10 bg-[#111111] flex flex-col justify-between shrink-0" id="main-sidebar">
        <div className="p-6 space-y-8">
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-indigo-900/20">
              F
            </div>
            <div>
              <h1 className="text-base font-display font-bold text-white tracking-tight leading-none">FinanceAI</h1>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mt-1">Personal Architect</span>
            </div>
          </div>

          {/* Nav List */}
          <nav className="space-y-1.5">
            {[
              { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4.5 h-4.5" /> },
              { id: "fluxo", label: "Fluxo Financeiro", icon: <TrendingUp className="w-4.5 h-4.5" /> },
              { id: "patrimonio", label: "Patrimônio & Passivos", icon: <Briefcase className="w-4.5 h-4.5" /> },
              { id: "metas", label: "Metas & Sonhos", icon: <Award className="w-4.5 h-4.5" /> },
              { id: "coach", label: "Consultor de IA", icon: <Bot className="w-4.5 h-4.5" /> },
              { id: "settings", label: "Configurações", icon: <Settings className="w-4.5 h-4.5" /> }
            ].map(tab => (
              <button
                id={`sidebar-nav-${tab.id}`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-indigo-600/10 text-indigo-400 font-bold border-l-2 border-indigo-500"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Sync Status Info Footer */}
        <div className="p-6 border-t border-white/10 space-y-4">
          <div className="flex items-center gap-2.5 bg-[#050505] border border-white/10 p-3 rounded-xl">
            <Cloud className={`w-4 h-4 ${session.authenticated ? "text-emerald-400 animate-pulse" : "text-indigo-400"}`} />
            <div className="text-left">
              <span className="text-[10px] text-slate-500 uppercase font-mono block leading-none">Status</span>
              <span className="text-xs text-slate-300 font-semibold block mt-1">
                {session.authenticated ? "OneDrive Conectado" : "Modo Simulação"}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-sans leading-relaxed text-center">
            {session.authenticated 
              ? "Sua base de dados está 100% sincronizada com sua conta Microsoft OneDrive."
              : "Dados persistidos localmente no servidor Express. Conecte nas Configurações."}
          </p>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col min-w-0" id="main-content-area">
        {/* Top bar header */}
        <header className="h-16 border-b border-white/10 bg-[#111111]/80 flex items-center justify-between px-8">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-slate-500">Usuário:</span>
            <span className="text-sm font-semibold text-white bg-[#050505] px-3 py-1 rounded-full border border-white/10">
              {db.profile.name} ({db.profile.email})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-xs flex items-center gap-1.5 font-semibold bg-white/5 px-3 py-1 rounded-full ${
              session.authenticated 
                ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" 
                : "text-slate-400 border border-white/10"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${
                session.authenticated ? "bg-emerald-500 animate-pulse" : "bg-slate-500"
              }`} />
              {session.authenticated ? "Nuvem OneDrive Ativa" : "Sessão Local"}
            </span>

            <button
              id="topbar-logout-btn"
              onClick={handleDisconnectMicrosoft}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#1a1012] hover:bg-[#2c141a] border border-rose-500/15 text-rose-400 text-xs font-semibold rounded-full transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </header>

        {/* View Section */}
        <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {activeTab === "dashboard" && (
                <Dashboard 
                  data={db} 
                  onAddTransaction={handleAddTransaction}
                  onSimulateGasto={handleSimulateGasto}
                />
              )}
              {activeTab === "fluxo" && (
                <FluxoFinanceiro 
                  data={db} 
                  onAddTransaction={handleAddTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                />
              )}
              {activeTab === "patrimonio" && (
                <Patrimonio 
                  data={db} 
                  onAddAsset={handleAddAsset}
                  onAddLiability={handleAddLiability}
                />
              )}
              {activeTab === "metas" && (
                <MetasView 
                  data={db} 
                  onAddGoal={handleAddGoal}
                />
              )}
              {activeTab === "coach" && (
                <ConsultorIA 
                  data={db} 
                />
              )}
              {activeTab === "settings" && (
                <SettingsView 
                  data={db} 
                  session={session}
                  onLoginMicrosoft={handleConnectMicrosoft}
                  onLogoutMicrosoft={handleDisconnectMicrosoft}
                  onUpdateProfile={(p) => saveDb({ ...db, profile: { ...db.profile, ...p } })}
                  onUpdateSettings={(s) => saveDb({ ...db, settings: { ...db.settings, ...s } })}
                  onResetDatabase={handleResetDatabase}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
