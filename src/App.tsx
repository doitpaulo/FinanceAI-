/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, TrendingUp, Briefcase, Award, Bot, Settings, 
  Sparkles, RefreshCw, Cloud, Link, AlertTriangle, LogOut, Database
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
import FinanceAILogo from "./components/FinanceAILogo";
import { auth, signInWithGoogle, logoutFirebase, fetchUserDatabaseFromFirestore, saveUserDatabaseToFirestore } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "fluxo" | "patrimonio" | "metas" | "coach" | "settings">("dashboard");
  const [db, setDb] = useState<ExcelDatabase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guestMode, setGuestMode] = useState(false);
  const [localGuestEmail, setLocalGuestEmail] = useState<string | null>(() => {
    return localStorage.getItem("financeai_logged_in_guest");
  });
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [firebaseLoading, setFirebaseLoading] = useState(true);

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

  // Listen for Firebase auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setFirebaseLoading(false);

      if (user) {
        setLoading(true);
        try {
          const firestoreDb = await fetchUserDatabaseFromFirestore(user.uid);
          if (firestoreDb) {
            setDb(firestoreDb as ExcelDatabase);
          } else {
            const currentYear = new Date().getFullYear();
            const defaultDb: ExcelDatabase = {
              profile: {
                userId: user.uid,
                name: user.displayName || "Usuário do Google",
                email: user.email || "",
                incomeType: "CLT",
                payFrequency: "mensal",
                financialGoal: "Reservas e Investimentos para Casa Própria",
                riskProfile: "moderado",
                onboardingCompleted: false,
              },
              settings: {
                currency: "BRL",
                language: "pt-BR",
                notificationsEnabled: true,
                aiEnabled: true,
                darkMode: true,
              },
              accounts: [
                { id: "acc-1", name: "Conta Corrente", bankName: "Banco Digital", type: "checking", balance: 0, isActive: true },
                { id: "acc-2", name: "Reserva Financeira", bankName: "Investimentos", type: "savings", balance: 0, isActive: true }
              ],
              cards: [
                { id: "card-1", name: "Cartão de Crédito", limit: 0, dueDate: 10, closingDay: 3, currentInvoice: 0, availableLimit: 0 }
              ],
              incomeSources: [
                { id: "inc-1", name: "Renda Mensal", type: "CLT", frequency: "monthly", expectedValue: 0, nextDate: `${currentYear}-07-05` }
              ],
              expenses: [
                { id: "exp-1", name: "Moradia", category: "Moradia", amount: 0, frequency: "monthly", dueDate: `${currentYear}-07-10`, isFixed: true },
                { id: "exp-2", name: "Internet & Serviços", category: "Serviços", amount: 0, frequency: "monthly", dueDate: `${currentYear}-07-15`, isFixed: true },
                { id: "exp-3", name: "Lazer & Outros", category: "Lazer", amount: 0, frequency: "monthly", dueDate: `${currentYear}-07-20`, isFixed: false }
              ],
              transactions: [],
              assets: [],
              liabilities: [],
              goals: [
                { id: "goal-1", name: "Reserva de Emergência de 6 meses", targetValue: 0, currentValue: 0, deadline: `${currentYear}-12-31`, priority: "high", status: "active" }
              ],
              cashFlow: [],
              calendar: [],
              timeline: [],
              events: [],
              aiInsights: []
            };
            await saveUserDatabaseToFirestore(user.uid, defaultDb);
            setDb(defaultDb);
          }
          setError(null);
        } catch (err: any) {
          console.error("Erro ao carregar do Firebase Firestore:", err);
          setError("Falha ao carregar seus dados na nuvem Firebase.");
        } finally {
          setLoading(false);
        }
      } else {
        // If there's a logged-in guest in localStorage, restore it!
        const guestEmail = localStorage.getItem("financeai_logged_in_guest");
        if (guestEmail) {
          const localDbStr = localStorage.getItem(`financeai_local_db_${guestEmail}`);
          if (localDbStr) {
            try {
              setDb(JSON.parse(localDbStr));
              setGuestMode(true);
              setLoading(false);
              setError(null);
              return;
            } catch (err) {
              console.error("Falha ao carregar banco local do localStorage:", err);
            }
          }
        }
        fetchDb();
      }
    });

    return () => unsubscribe();
  }, []);

  // Helper callbacks for Firebase
  const handleLoginGoogleFirebase = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Falha ao logar com o Google (Firebase):", err);
      alert("Falha no login com Google (Firebase): " + err.message);
    }
  };

  const handleLogoutFirebase = async () => {
    try {
      await logoutFirebase();
      setFirebaseUser(null);
      setGuestMode(false);
      setLocalGuestEmail(null);
      localStorage.removeItem("financeai_logged_in_guest");
    } catch (err) {
      console.error("Falha ao deslogar do Firebase:", err);
    }
  };

  const handleLogoutLocal = () => {
    setGuestMode(false);
    setLocalGuestEmail(null);
    localStorage.removeItem("financeai_logged_in_guest");
  };

  // Post changes helper
  const saveDb = async (updatedDb: ExcelDatabase) => {
    setDb(updatedDb);
    if (firebaseUser) {
      try {
        await saveUserDatabaseToFirestore(firebaseUser.uid, updatedDb);
      } catch (err) {
        console.error("Falha ao gravar no Firebase Firestore:", err);
        alert("Alerta: Seus dados estão em cache no navegador, mas houve falha ao sincronizar com a nuvem Firebase.");
      }
    } else if (localGuestEmail) {
      try {
        localStorage.setItem(`financeai_local_db_${localGuestEmail}`, JSON.stringify(updatedDb));
      } catch (err) {
        console.error("Falha ao gravar localmente no localStorage:", err);
      }
    } else {
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
        // Checking Account starts clean at 0
        return { ...acc, balance: 0 };
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
        // Emergency reserve (6 months of their estimated fixed costs) or their custom goal
        return { 
          ...goal, 
          name: onboardingData.financialGoal || "Reserva de Emergência de 6 meses",
          currentValue: onboardingData.currentSavings,
          targetValue: onboardingData.monthlyExpenses * 6
        };
      }
      return goal;
    });

    // Clean start: no simulated mock transactions in the database
    const updatedTransactions: any[] = [];

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

  if (!firebaseUser && !guestMode) {
    return (
      <LoginView
        onLoginGoogle={handleLoginGoogleFirebase}
        onLoginLocal={(localDb, email) => {
          setDb(localDb);
          setLocalGuestEmail(email);
          setGuestMode(true);
        }}
        loadingSession={loading || firebaseLoading}
      />
    );
  }

  if (error || !db) {
    const handleRetry = async () => {
      setError(null);
      setLoading(true);
      if (firebaseUser) {
        try {
          const firestoreDb = await fetchUserDatabaseFromFirestore(firebaseUser.uid);
          if (firestoreDb) {
            setDb(firestoreDb as ExcelDatabase);
          } else {
            await fetchDb();
          }
        } catch (err: any) {
          console.error("Retry failed:", err);
          setError("Falha ao carregar seus dados na nuvem Firebase.");
        } finally {
          setLoading(false);
        }
      } else {
        await fetchDb();
      }
    };

    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center font-sans">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-white mb-2">Erro de Inicialização</h2>
        <p className="text-gray-400 text-sm max-w-md leading-relaxed mb-6">
          {error || "Falha ao carregar planilhas de simulação."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={handleRetry}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition cursor-pointer"
          >
            Tentar Reconectar
          </button>
          {firebaseUser && (
            <button 
              onClick={handleLogoutFirebase}
              className="px-6 py-2.5 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/20 text-rose-400 font-bold rounded-xl transition cursor-pointer"
            >
              Desconectar Conta Google
            </button>
          )}
          {!firebaseUser && (
            <button 
              onClick={() => {
                setError(null);
                setGuestMode(true);
                fetchDb();
              }}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl transition cursor-pointer"
            >
              Continuar como Convidado
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 flex flex-col md:flex-row pb-16 md:pb-0">
      {/* Dynamic onboarding trigger */}
      <AnimatePresence>
        {!db.profile.onboardingCompleted && (
          <OnboardingModal 
            onComplete={handleOnboardingComplete} 
            defaultName={firebaseUser?.displayName || ""}
          />
        )}
      </AnimatePresence>

      {/* Persistent Left Sidebar Navigation - Hidden on mobile */}
      <aside className="hidden md:flex w-64 border-r border-white/10 bg-[#111111] flex-col justify-between shrink-0" id="main-sidebar">
        <div className="p-6 space-y-8">
          {/* Logo Brand */}
          <FinanceAILogo size="sm" />

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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition cursor-pointer ${
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
            {firebaseUser ? (
              <Database className="w-4 h-4 text-amber-400 animate-pulse" />
            ) : (
              <Database className="w-4 h-4 text-indigo-400" />
            )}
            <div className="text-left">
              <span className="text-[10px] text-slate-500 uppercase font-mono block leading-none">Status</span>
              <span className="text-xs text-slate-300 font-semibold block mt-1">
                {firebaseUser ? "Firebase Ativo" : "Modo Simulação"}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-sans leading-relaxed text-center">
            {firebaseUser 
              ? "Sua base de dados está 100% sincronizada com o Firebase Firestore."
              : "Rodando em cache local do servidor Express. Conecte-se na nuvem."}
          </p>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col min-w-0" id="main-content-area">
        {/* Top bar header */}
        <header className="h-16 border-b border-white/10 bg-[#111111]/80 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {/* Show tiny logo icon on mobile top bar since sidebar is hidden */}
            <div className="md:hidden shrink-0">
              <FinanceAILogo size="sm" iconOnly />
            </div>
            <span className="text-xs font-mono text-slate-500 hidden sm:inline">Usuário:</span>
            <span className="text-xs md:text-sm font-semibold text-white bg-[#050505] px-2.5 py-1 rounded-full border border-white/10 truncate max-w-[150px] sm:max-w-none">
              {db.profile.name} <span className="hidden md:inline">({db.profile.email})</span>
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {firebaseUser && (
              <span className="text-[10px] md:text-xs flex items-center gap-1.5 font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 md:px-3 py-1 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="hidden sm:inline">Firebase Ativo</span>
              </span>
            )}

            <span className={`text-[10px] md:text-xs flex items-center gap-1.5 font-semibold bg-white/5 px-2 md:px-3 py-1 rounded-full ${
              firebaseUser 
                ? "text-amber-400 bg-amber-500/10 border border-amber-500/20" 
                : "text-slate-400 border border-white/10"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${
                firebaseUser ? "bg-amber-500 animate-pulse" : "bg-slate-500"
              }`} />
              <span className="hidden sm:inline">{firebaseUser ? "Google Logado" : "Sessão Local"}</span>
              {!firebaseUser && <span className="sm:hidden">Local</span>}
              {firebaseUser && <span className="sm:hidden">Nuvem</span>}
            </span>

            <button
              id="topbar-logout-btn"
              onClick={firebaseUser ? handleLogoutFirebase : handleLogoutLocal}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#1a1012] hover:bg-[#2c141a] border border-rose-500/15 text-rose-400 text-[10px] md:text-xs font-semibold rounded-full transition cursor-pointer"
            >
              <LogOut className="w-3 h-3 md:w-3.5 md:h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </header>

        {/* View Section */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
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
                  firebaseUser={firebaseUser}
                  onLoginFirebase={handleLoginGoogleFirebase}
                  onLogoutFirebase={handleLogoutFirebase}
                  onUpdateProfile={(p) => saveDb({ ...db, profile: { ...db.profile, ...p } })}
                  onUpdateSettings={(s) => saveDb({ ...db, settings: { ...db.settings, ...s } })}
                  onResetDatabase={handleResetDatabase}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#111111]/95 backdrop-blur-md border-t border-white/10 flex items-center justify-around px-2 z-40 md:hidden">
        {[
          { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
          { id: "fluxo", label: "Fluxo", icon: <TrendingUp className="w-5 h-5" /> },
          { id: "patrimonio", label: "Patrimônio", icon: <Briefcase className="w-5 h-5" /> },
          { id: "metas", label: "Metas", icon: <Award className="w-5 h-5" /> },
          { id: "coach", label: "IA Coach", icon: <Bot className="w-5 h-5" /> },
          { id: "settings", label: "Ajustes", icon: <Settings className="w-5 h-5" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 transition cursor-pointer ${
              activeTab === tab.id
                ? "text-indigo-400 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tab.icon}
            <span className="text-[10px] mt-1 font-semibold">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
