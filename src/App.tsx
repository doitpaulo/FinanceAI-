/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, TrendingUp, Briefcase, Award, Bot, Settings, 
  Sparkles, RefreshCw, Cloud, Link, AlertTriangle, LogOut, Database,
  ShieldAlert, AlertCircle, X, ChevronLeft, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ExcelDatabase, Transaction, Asset, Liability, Goal, Profile, Settings as SettingsType, Expense, Account, Card } from "./types";
import Dashboard from "./components/Dashboard";
import LancamentosView from "./components/LancamentosView";
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
  const [activeTab, setActiveTab] = useState<"dashboard" | "lancamentos" | "fluxo" | "patrimonio" | "metas" | "coach" | "settings">("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("financeai_sidebar_collapsed") === "true";
  });
  const [db, setDb] = useState<ExcelDatabase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guestMode, setGuestMode] = useState(false);
  const [localGuestEmail, setLocalGuestEmail] = useState<string | null>(() => {
    return localStorage.getItem("financeai_logged_in_guest");
  });
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [firebaseLoading, setFirebaseLoading] = useState(true);

  // States for Daily Limit and Income Deficit Popups
  const [pendingTx, setPendingTx] = useState<Omit<Transaction, "id"> | null>(null);
  const [txWarnings, setTxWarnings] = useState<{
    dailyLimit?: { limit: number; current: number; valWithNew: number; close: boolean; exceeded: boolean };
    incomeDeficit?: { expected: number; current: number; valWithNew: number };
  } | null>(null);

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

  // Helper to check if any credit card is due within the next 3 days (inclusive) with currentInvoice > 0
  const hasNearCardDueDate = () => {
    if (!db || !db.cards) return false;
    const today = new Date();
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return db.cards.some(card => {
      const year = today.getFullYear();
      const month = today.getMonth();
      let dueDateObj = new Date(year, month, card.dueDate);
      
      if (dueDateObj < todayDateOnly) {
        dueDateObj = new Date(year, month + 1, card.dueDate);
      }
      
      const diffTime = dueDateObj.getTime() - todayDateOnly.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays >= 0 && diffDays <= 3 && card.currentInvoice > 0;
    });
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

  // 2b. Add Multiple Transactions Action
  const handleAddTransactions = async (txList: Array<Omit<Transaction, "id">>) => {
    if (!db) return;

    let currentAccounts = [...db.accounts];
    const newTxs: Transaction[] = [];
    const newTimelines = [...db.timeline];
    const newInsights = [...db.aiInsights];

    txList.forEach(txData => {
      const newTx: Transaction = {
        ...txData,
        id: "tx-" + Math.random().toString(36).substr(2, 9)
      };
      newTxs.push(newTx);

      // Calculate updated balances
      currentAccounts = currentAccounts.map(acc => {
        if (acc.id === txData.accountId) {
          const amt = Number(txData.amount);
          return {
            ...acc,
            balance: txData.type === "expense" ? acc.balance - amt : acc.balance + amt
          };
        }
        return acc;
      });

      // Create a timeline event
      newTimelines.push({
        id: "tl-" + Math.random().toString(36).substr(2, 9),
        date: txData.date,
        event: `${txData.type === "income" ? "Receita" : "Despesa"} Adicionada`,
        impact: `${txData.description} (Categoria: ${txData.category})`,
        financialChange: txData.type === "income" ? txData.amount : -txData.amount
      });

      // Trigger standard alert heuristics if spending is abnormal
      if (txData.type === "expense" && txData.amount > 1000) {
        newInsights.unshift({
          id: "ins-" + Math.random().toString(36).substr(2, 9),
          insight: `Nota de Gasto Excepcional: O lançamento de R$ ${txData.amount.toFixed(2)} em ${txData.description} impacta sua liquidez líquida imediata. Verifique se o valor está alinhado com seu orçamento adaptativo.`,
          severity: "medium",
          createdAt: new Date().toISOString().replace("T", " ").substr(0, 19),
          relatedDomain: "Expenses"
        });
      }
    });

    const updated = {
      ...db,
      accounts: currentAccounts,
      transactions: [...db.transactions, ...newTxs],
      timeline: newTimelines,
      aiInsights: newInsights
    };

    await saveDb(updated);
  };

  // 2. Add Transaction Action
  const handleAddTransaction = async (txData: Omit<Transaction, "id">) => {
    if (!db) return;

    if (txData.type === "expense") {
      const todayStr = txData.date; // e.g. YYYY-MM-DD
      const currentMonthStr = todayStr.substring(0, 7);

      // Check daily spending limit
      const dailySpendingLimit = db.profile.dailySpendingLimit;
      let dailyLimitWarning = undefined;
      if (dailySpendingLimit && dailySpendingLimit > 0) {
        const todayExpenses = db.transactions
          .filter(t => t.type === "expense" && t.date === todayStr)
          .reduce((sum, t) => sum + t.amount, 0);
        const valWithNew = todayExpenses + txData.amount;
        const threshold = db.profile.alertThreshold || 'moderate';
        const exceeded = valWithNew > dailySpendingLimit;
        
        let close = false;
        if (threshold === 'strict') {
          close = valWithNew >= dailySpendingLimit * 0.5; // strict: alert starting at 50%
        } else if (threshold === 'moderate') {
          close = valWithNew >= dailySpendingLimit * 0.8; // moderate: alert starting at 80%
        } else {
          close = false; // silent: only alert when exceeded (>100%)
        }

        if (close || exceeded) {
          dailyLimitWarning = {
            limit: dailySpendingLimit,
            current: todayExpenses,
            valWithNew,
            close,
            exceeded
          };
        }
      }

      // Check income deficit: spending more than expected/received monthly incomes
      let incomeDeficitWarning = undefined;
      const expectedIncome = db.incomeSources.reduce((sum, s) => {
        return sum + s.expectedValue;
      }, 0);
      const actualIncomeThisMonth = db.transactions
        .filter(t => t.type === "income" && t.date.startsWith(currentMonthStr))
        .reduce((sum, t) => sum + t.amount, 0);

      const incomeToCompare = Math.max(expectedIncome, actualIncomeThisMonth, 1600);

      const monthlyExpenses = db.transactions
        .filter(t => t.type === "expense" && t.date.startsWith(currentMonthStr))
        .reduce((sum, t) => sum + t.amount, 0);

      const totalWithNew = monthlyExpenses + txData.amount;

      if (totalWithNew > incomeToCompare) {
        incomeDeficitWarning = {
          expected: incomeToCompare,
          current: monthlyExpenses,
          valWithNew: totalWithNew
        };
      }

      if (dailyLimitWarning || incomeDeficitWarning) {
        setPendingTx(txData);
        setTxWarnings({
          dailyLimit: dailyLimitWarning,
          incomeDeficit: incomeDeficitWarning
        });
        return;
      }
    }

    await commitAddTransaction(txData);
  };

  const commitAddTransaction = async (txData: Omit<Transaction, "id">) => {
    if (!db) return;
    const newTx: Transaction = {
      ...txData,
      id: "tx-" + Math.random().toString(36).substr(2, 9)
    };

    // Calculate updated balances (deterministic Cap 10)
    const updatedAccounts = db.accounts.map(acc => {
      if (acc.id === txData.accountId) {
        const amt = Number(txData.amount);
        return {
          ...acc,
          balance: txData.type === "expense" ? acc.balance - amt : acc.balance + amt
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

  // 6b. Delete Goal Action
  const handleDeleteGoal = async (id: string) => {
    if (!db) return;
    const updated = {
      ...db,
      goals: db.goals.filter(g => g.id !== id)
    };
    await saveDb(updated);
  };

  // 6c. Edit Goal Action
  const handleEditGoal = async (id: string, goalData: Partial<Goal>) => {
    if (!db) return;
    const updated = {
      ...db,
      goals: db.goals.map(g => g.id === id ? { ...g, ...goalData } : g)
    };
    await saveDb(updated);
  };

  // 6d. Edit Transaction Action
  const handleEditTransaction = async (id: string, txData: Partial<Transaction>) => {
    if (!db) return;
    const oldTx = db.transactions.find(t => t.id === id);
    if (!oldTx) return;

    // Revert old transaction impact on balance
    let updatedAccounts = db.accounts.map(acc => {
      if (acc.id === oldTx.accountId) {
        return {
          ...acc,
          balance: oldTx.type === "expense" ? acc.balance + oldTx.amount : acc.balance - oldTx.amount
        };
      }
      return acc;
    });

    // Apply new transaction impact
    const finalTx = { ...oldTx, ...txData };
    updatedAccounts = updatedAccounts.map(acc => {
      if (acc.id === finalTx.accountId) {
        return {
          ...acc,
          balance: finalTx.type === "expense" ? acc.balance - finalTx.amount : acc.balance + finalTx.amount
        };
      }
      return acc;
    });

    const updated = {
      ...db,
      accounts: updatedAccounts,
      transactions: db.transactions.map(t => t.id === id ? finalTx : t)
    };
    await saveDb(updated);
  };

  // 6e. Delete Asset Action
  const handleDeleteAsset = async (id: string) => {
    if (!db) return;
    const updated = {
      ...db,
      assets: db.assets.filter(a => a.id !== id)
    };
    await saveDb(updated);
  };

  // 6f. Edit Asset Action
  const handleEditAsset = async (id: string, assetData: Partial<Asset>) => {
    if (!db) return;
    const updated = {
      ...db,
      assets: db.assets.map(a => a.id === id ? { ...a, ...assetData } : a)
    };
    await saveDb(updated);
  };

  // 6g. Delete Liability Action
  const handleDeleteLiability = async (id: string) => {
    if (!db) return;
    const updated = {
      ...db,
      liabilities: db.liabilities.filter(l => l.id !== id)
    };
    await saveDb(updated);
  };

  // 6h. Edit Liability Action
  const handleEditLiability = async (id: string, liabData: Partial<Liability>) => {
    if (!db) return;
    const updated = {
      ...db,
      liabilities: db.liabilities.map(l => l.id === id ? { ...l, ...liabData } : l)
    };
    await saveDb(updated);
  };

  // 6i. Edit Account Action
  const handleEditAccount = async (id: string, updatedData: Partial<Account>) => {
    if (!db) return;
    const updated = {
      ...db,
      accounts: db.accounts.map(a => a.id === id ? { ...a, ...updatedData } : a)
    };
    await saveDb(updated);
  };

  // 6j. Edit Card Action
  const handleEditCard = async (id: string, updatedData: Partial<Card>) => {
    if (!db) return;
    const updated = {
      ...db,
      cards: db.cards.map(c => c.id === id ? { ...c, ...updatedData } : c)
    };
    await saveDb(updated);
  };

  // 6k. Add Custom Bill/Expense Action
  const handleAddExpense = async (expData: Omit<Expense, "id">) => {
    if (!db) return;
    const newExp: Expense = {
      ...expData,
      id: "exp-" + Math.random().toString(36).substr(2, 9),
      paid: false
    };
    const updated = {
      ...db,
      expenses: [...(db.expenses || []), newExp]
    };
    await saveDb(updated);
  };

  // 6l. Edit Custom Bill/Expense Action
  const handleEditExpense = async (id: string, expData: Partial<Expense>) => {
    if (!db) return;
    const updated = {
      ...db,
      expenses: (db.expenses || []).map(e => e.id === id ? { ...e, ...expData } : e)
    };
    await saveDb(updated);
  };

  // 6m. Delete Custom Bill/Expense Action
  const handleDeleteExpense = async (id: string) => {
    if (!db) return;
    const updated = {
      ...db,
      expenses: (db.expenses || []).filter(e => e.id !== id)
    };
    await saveDb(updated);
  };

  // 6n. Toggle Custom Bill/Expense Paid Action
  const handleToggleExpensePaid = async (id: string) => {
    if (!db) return;
    const exp = (db.expenses || []).find(e => e.id === id);
    if (!exp) return;

    const newPaidStatus = !exp.paid;
    
    let updatedAccounts = [...db.accounts];
    let updatedTransactions = [...db.transactions];

    if (newPaidStatus) {
      // Create actual expense transaction automatically
      const newTx: Transaction = {
        id: "tx-exp-" + Math.random().toString(36).substr(2, 9),
        type: "expense",
        amount: exp.amount,
        date: new Date().toISOString().split("T")[0],
        category: exp.category || "Serviços",
        accountId: "acc-1", // default account
        description: `Pago: ${exp.name}`,
        isRecurring: exp.isFixed
      };
      
      updatedTransactions.push(newTx);

      // Deduct from checking account (acc-1)
      updatedAccounts = updatedAccounts.map(acc => {
        if (acc.id === "acc-1") {
          return { ...acc, balance: acc.balance - exp.amount };
        }
        return acc;
      });
    } else {
      // Unmark as paid: delete corresponding transaction to restore balance
      const txToRevert = updatedTransactions.find(t => t.description === `Pago: ${exp.name}` && t.amount === exp.amount);
      if (txToRevert) {
        updatedTransactions = updatedTransactions.filter(t => t.id !== txToRevert.id);
        updatedAccounts = updatedAccounts.map(acc => {
          if (acc.id === "acc-1") {
            return { ...acc, balance: acc.balance + exp.amount };
          }
          return acc;
        });
      }
    }

    const updated = {
      ...db,
      expenses: (db.expenses || []).map(e => e.id === id ? { ...e, paid: newPaidStatus } : e),
      accounts: updatedAccounts,
      transactions: updatedTransactions
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

  const handleTriggerScheduledIncome = async (item: { amount: number; name: string }) => {
    if (!db) return;
    const newTx: Transaction = {
      id: "tx-sched-" + Math.random().toString(36).substr(2, 9),
      type: "income",
      amount: item.amount,
      date: new Date().toISOString().split("T")[0],
      category: "Salário",
      accountId: "acc-1",
      description: `Recebimento: ${item.name}`,
      isRecurring: true
    };

    const updatedAccounts = db.accounts.map(acc => {
      if (acc.id === "acc-1") {
        return { ...acc, balance: acc.balance + item.amount };
      }
      return acc;
    });

    const updated = {
      ...db,
      accounts: updatedAccounts,
      transactions: [...db.transactions, newTx]
    };

    await saveDb(updated);
  };

  const handleSaveForDream = async (goalId: string, amt: number) => {
    if (!db) return;
    const goal = db.goals.find(g => g.id === goalId);
    if (!goal) return;

    const newTx: Transaction = {
      id: "tx-dream-" + Math.random().toString(36).substr(2, 9),
      type: "expense",
      amount: amt,
      date: new Date().toISOString().split("T")[0],
      category: "Investimentos",
      accountId: "acc-1",
      description: `Aporte Sonho: ${goal.name}`,
      isRecurring: false
    };

    const updatedAccounts = db.accounts.map(acc => {
      if (acc.id === "acc-1") {
        return { ...acc, balance: acc.balance - amt };
      }
      return acc;
    });

    const updatedGoals = db.goals.map(g => {
      if (g.id === goalId) {
        return { ...g, currentValue: g.currentValue + amt };
      }
      return g;
    });

    const updated = {
      ...db,
      accounts: updatedAccounts,
      goals: updatedGoals,
      transactions: [...db.transactions, newTx]
    };

    await saveDb(updated);
  };

  // Realistic Client-side Seed database fallback generator
  const getClientSeedData = (userEmail: string, userName: string, userId: string): ExcelDatabase => {
    const currentYear = new Date().getFullYear();
    const currentDate = new Date().toISOString().split("T")[0];
    return {
      profile: {
        userId: userId || "guest_user",
        name: userName || "Paulo Henrique",
        email: userEmail || "pauloo201113@gmail.com",
        incomeType: "CLT",
        payFrequency: "mensal",
        financialGoal: "Reservas e Investimentos para Casa Própria",
        riskProfile: "moderado",
        onboardingCompleted: true,
      },
      settings: {
        currency: "BRL",
        language: "pt-BR",
        notificationsEnabled: true,
        aiEnabled: true,
        darkMode: true,
      },
      accounts: [
        { id: "acc-1", name: "Conta Corrente", bankName: "Itaú Unibanco", type: "checking", balance: 4250.00, isActive: true },
        { id: "acc-2", name: "Reserva de Emergência", bankName: "Nubank", type: "savings", balance: 12000.00, isActive: true },
        { id: "acc-3", name: "Carteira Dinheiro", bankName: "Dinheiro Físico", type: "wallet", balance: 250.00, isActive: true }
      ],
      cards: [
        { id: "card-1", name: "Nubank Ultravioleta", limit: 8000, dueDate: 10, closingDay: 3, currentInvoice: 1845.50, availableLimit: 6154.50 }
      ],
      incomeSources: [
        { id: "inc-1", name: "Salário CLT Tech", type: "CLT", frequency: "monthly", expectedValue: 6500.00, nextDate: `${currentYear}-07-05` }
      ],
      expenses: [
        { id: "exp-1", name: "Aluguel Apartamento", category: "Moradia", amount: 1500.00, frequency: "monthly", dueDate: `${currentYear}-07-10`, isFixed: true },
        { id: "exp-2", name: "Internet Fibra", category: "Serviços", amount: 120.00, frequency: "monthly", dueDate: `${currentYear}-07-15`, isFixed: true },
        { id: "exp-3", name: "Assinatura Streaming", category: "Lazer", amount: 55.90, frequency: "monthly", dueDate: `${currentYear}-07-22`, isFixed: false }
      ],
      transactions: [
        { id: "tx-1", type: "income", amount: 6500.00, date: `${currentYear}-06-05`, category: "Salário", accountId: "acc-1", description: "Salário Mensal Tech S.A.", isRecurring: true },
        { id: "tx-2", type: "expense", amount: 1500.00, date: `${currentYear}-06-10`, category: "Moradia", accountId: "acc-1", description: "Aluguel Mensal", isRecurring: true },
        { id: "tx-3", type: "expense", amount: 120.00, date: `${currentYear}-06-15`, category: "Serviços", accountId: "acc-1", description: "Mensalidade Internet", isRecurring: true },
        { id: "tx-4", type: "expense", amount: 350.00, date: `${currentYear}-06-18`, category: "Alimentação", accountId: "acc-1", description: "Supermercado Semanal", isRecurring: false },
        { id: "tx-5", type: "expense", amount: 180.00, date: `${currentYear}-06-25`, category: "Transporte", accountId: "acc-1", description: "Combustível", isRecurring: false },
        { id: "tx-6", type: "expense", amount: 110.00, date: `${currentYear}-06-28`, category: "Alimentação", accountId: "acc-3", description: "Jantar fds", isRecurring: false }
      ],
      assets: [
        { id: "ast-1", name: "Carro Honda Civic", type: "vehicle", value: 45000.00, acquisitionDate: "2024-03-15", appreciationRate: -5.0 },
        { id: "ast-2", name: "Tesouro IPCA 2029", type: "investment", value: 8500.00, acquisitionDate: "2025-01-10", appreciationRate: 11.5 }
      ],
      liabilities: [
        { id: "lia-1", name: "Financiamento Honda", type: "financing", totalValue: 30000.00, remainingValue: 12000.00, monthlyPayment: 750.00, remainingMonths: 16 }
      ],
      goals: [
        { id: "goal-1", name: "Reserva de Emergência de 6 meses", targetValue: 15000.00, currentValue: 12000.00, deadline: `${currentYear}-12-31`, priority: "high", status: "active" },
        { id: "goal-2", name: "Entrada de Imóvel Próprio", targetValue: 60000.00, currentValue: 8500.00, deadline: "2028-12-31", priority: "medium", status: "active" }
      ],
      cashFlow: [
        { date: `${currentYear}-07-05`, expectedIncome: 6500, expectedExpense: 0, projectedBalance: 10750 },
        { date: `${currentYear}-07-10`, expectedIncome: 0, expectedExpense: 1500, projectedBalance: 9250 },
        { date: `${currentYear}-07-15`, expectedIncome: 0, expectedExpense: 120, projectedBalance: 9130 },
        { date: `${currentYear}-07-22`, expectedIncome: 0, expectedExpense: 55.90, projectedBalance: 9074.10 }
      ],
      calendar: [
        { id: "cal-1", date: `${currentYear}-07-05`, type: "income", description: "Salário CLT Tech", amount: 6500.00 },
        { id: "cal-2", date: `${currentYear}-07-10`, type: "expense", description: "Aluguel Apartamento", amount: 1500.00 },
        { id: "cal-3", date: `${currentYear}-07-15`, type: "expense", description: "Internet Fibra", amount: 120.00 }
      ],
      timeline: [
        { id: "tl-1", date: "2026-01-01", event: "Início da Organização Financeira", impact: "Criação de plano consolidado", financialChange: 0 }
      ],
      events: [
        { id: "evt-1", type: "milestone", description: "Meta Nubank Reserva bateu 80%", date: `${currentYear}-06-20`, financialImpact: 0 }
      ],
      aiInsights: [
        {
          id: "ins-1",
          insight: "Parabéns! Sua Reserva de Emergência já cobre cerca de 5 meses das suas despesas fixas. Mantenha o foco para atingir a meta de 6 meses (R$ 15.000).",
          severity: "low",
          createdAt: `${currentDate} 10:00:00`,
          relatedDomain: "Goals"
        },
        {
          id: "ins-2",
          insight: "Alerta: O Nubank Ultravioleta vencerá no dia 10 de julho (R$ 1.845,50). Certifique-se de que o saldo na conta corrente esteja livre para o pagamento da fatura.",
          severity: "medium",
          createdAt: `${currentDate} 10:05:00`,
          relatedDomain: "Cards"
        }
      ]
    };
  };

  // Reset Excel database to factory seed
  const handleResetDatabase = async () => {
    setLoading(true);
    let seedDb: ExcelDatabase | null = null;
    try {
      const res = await fetch("/api/db/reset", {
        method: "POST"
      });
      if (res.ok) {
        const resetResult = await res.json();
        seedDb = resetResult.db as ExcelDatabase;
      }
    } catch (err) {
      console.warn("API de reset falhou, usando gerador resiliente local.");
    }

    try {
      // Fallback if API was unreachable or failed
      if (!seedDb) {
        seedDb = getClientSeedData(
          db?.profile?.email || "pauloo201113@gmail.com",
          db?.profile?.name || "Paulo Henrique",
          db?.profile?.userId || "guest_user"
        );
      }

      if (db && seedDb) {
        // Preserve the user's specific identity details, custom goals, and settings
        seedDb = {
          ...seedDb,
          profile: {
            ...seedDb.profile,
            userId: db.profile.userId,
            name: db.profile.name,
            email: db.profile.email,
            incomeType: db.profile.incomeType,
            payFrequency: db.profile.payFrequency,
            financialGoal: db.profile.financialGoal,
            riskProfile: db.profile.riskProfile,
            onboardingCompleted: db.profile.onboardingCompleted
          },
          settings: {
            ...seedDb.settings,
            ...db.settings
          }
        };

        // Clear local storage settings and envelopes to keep UI in perfect sync
        localStorage.removeItem(`financeai_schedules_${db.profile.email}`);
        localStorage.removeItem(`financeai_envelopes_${db.profile.email}`);
        const currentMonthStr = new Date().toISOString().substring(0, 7);
        localStorage.removeItem(`financeai_dream_prompt_${db.profile.email}_${currentMonthStr}`);
        
        // Remove individual schedule registration indicators
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("financeai_sched_registered_")) {
            localStorage.removeItem(key);
            i--; // adjust index since we deleted an item
          }
        }
      }

      if (seedDb) {
        await saveDb(seedDb);
        alert("Sua base de simulação foi restaurada com sucesso para o padrão do Paulo Henrique!");
      }
    } catch (err) {
      console.error("Erro ao resetar o banco de dados:", err);
      alert("Houve um erro ao restaurar os dados padrões de simulação.");
    } finally {
      setLoading(false);
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
      <aside 
        className={`hidden md:flex ${sidebarCollapsed ? "w-20" : "w-64"} border-r border-white/10 bg-[#111111] flex-col justify-between shrink-0 transition-all duration-300 ease-in-out`} 
        id="main-sidebar"
      >
        <div className={`space-y-8 ${sidebarCollapsed ? "p-4" : "p-6"}`}>
          {/* Logo Brand with Collapse Toggle Button */}
          <div className={`flex items-center ${sidebarCollapsed ? "flex-col gap-4 justify-center" : "justify-between"}`}>
            <FinanceAILogo size="sm" iconOnly={sidebarCollapsed} />
            <button
              onClick={() => {
                const newValue = !sidebarCollapsed;
                setSidebarCollapsed(newValue);
                localStorage.setItem("financeai_sidebar_collapsed", String(newValue));
              }}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition cursor-pointer shrink-0"
              title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
 
          {/* Nav List */}
          <nav className="space-y-1.5">
            {[
              { id: "dashboard", label: "Início (Resumo)", icon: <LayoutDashboard className="w-4.5 h-4.5" /> },
              { id: "lancamentos", label: "Lançamentos e Extratos", icon: <RefreshCw className="w-4.5 h-4.5" /> },
              { id: "fluxo", label: "Contas do Mês (Vencimentos)", icon: <TrendingUp className="w-4.5 h-4.5" /> },
              { id: "patrimonio", label: "Meu Dinheiro (Bens/Dívidas)", icon: <Briefcase className="w-4.5 h-4.5" /> },
              { id: "metas", label: "Meus Sonhos e Objetivos", icon: <Award className="w-4.5 h-4.5" /> },
              { id: "coach", label: "Conversar com IA", icon: <Bot className="w-4.5 h-4.5" /> },
              { id: "settings", label: "Ajustes e Conta", icon: <Settings className="w-4.5 h-4.5" /> }
            ].map(tab => (
              <button
                id={`sidebar-nav-${tab.id}`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 py-3 rounded-xl text-sm font-semibold transition cursor-pointer relative ${
                  sidebarCollapsed ? "px-2 justify-center" : "px-4"
                } ${
                  activeTab === tab.id
                    ? "bg-indigo-600/10 text-indigo-400 font-bold border-l-2 border-indigo-500"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
                title={sidebarCollapsed ? tab.label : undefined}
              >
                {tab.icon}
                {!sidebarCollapsed && <span className="flex-1 text-left truncate">{tab.label}</span>}
                {!sidebarCollapsed && tab.id === "fluxo" && hasNearCardDueDate() && (
                  <span className="px-2 py-0.5 text-[9px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md uppercase tracking-wider shrink-0 animate-pulse">
                    Fatura
                  </span>
                )}
                {sidebarCollapsed && tab.id === "fluxo" && hasNearCardDueDate() && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 border border-[#111111] rounded-full animate-pulse" />
                )}
              </button>
            ))}
          </nav>
        </div>
 
        {/* Sync Status Info Footer */}
        <div className={`border-t border-white/10 ${sidebarCollapsed ? "p-4 flex flex-col items-center gap-2" : "p-6 space-y-4"}`}>
          <div 
            className={`flex items-center ${sidebarCollapsed ? "justify-center p-2" : "gap-2.5 p-3"} bg-[#050505] border border-white/10 rounded-xl w-full`}
            title={sidebarCollapsed ? (firebaseUser ? "Firebase Sincronizado" : "Modo Simulação Local") : undefined}
          >
            {firebaseUser ? (
              <Database className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
            ) : (
              <Database className="w-4 h-4 text-indigo-400 shrink-0" />
            )}
            {!sidebarCollapsed && (
              <div className="text-left min-w-0">
                <span className="text-[10px] text-slate-500 uppercase font-mono block leading-none truncate">Status</span>
                <span className="text-xs text-slate-300 font-semibold block mt-1 truncate">
                  {firebaseUser ? "Firebase Ativo" : "Modo Simulação"}
                </span>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <p className="text-[10px] text-slate-500 font-sans leading-relaxed text-center">
              {firebaseUser 
                ? "Sua base de dados está 100% sincronizada com o Firebase Firestore."
                : "Rodando em cache local do servidor Express. Conecte-se na nuvem."}
            </p>
          )}
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
            <div className="flex items-center gap-2">
              {db.profile.avatarUrl ? (
                db.profile.avatarUrl.length > 2 ? (
                  <img 
                    src={db.profile.avatarUrl} 
                    alt="Avatar" 
                    className="w-7 h-7 rounded-full border border-white/20 object-cover shrink-0" 
                    referrerPolicy="no-referrer" 
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-sm shrink-0">
                    {db.profile.avatarUrl}
                  </div>
                )
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0 border border-white/20">
                  {db.profile.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <span className="text-xs md:text-sm font-semibold text-white bg-[#050505] px-2.5 py-1 rounded-full border border-white/10 truncate max-w-[150px] sm:max-w-none">
                {db.profile.name} <span className="hidden md:inline">({db.profile.email})</span>
              </span>
            </div>
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
                  onEditGoal={handleEditGoal}
                  onEditAccount={handleEditAccount}
                  onTriggerScheduledIncome={handleTriggerScheduledIncome}
                  onSaveForDream={handleSaveForDream}
                />
              )}
              {activeTab === "lancamentos" && (
                <LancamentosView 
                  data={db} 
                  onAddTransaction={handleAddTransaction}
                  onAddTransactions={handleAddTransactions}
                  onDeleteTransaction={handleDeleteTransaction}
                  onEditTransaction={handleEditTransaction}
                />
              )}
              {activeTab === "fluxo" && (
                <FluxoFinanceiro 
                  data={db} 
                  onAddExpense={handleAddExpense}
                  onEditExpense={handleEditExpense}
                  onDeleteExpense={handleDeleteExpense}
                  onToggleExpensePaid={handleToggleExpensePaid}
                />
              )}
              {activeTab === "patrimonio" && (
                <Patrimonio 
                  data={db} 
                  onAddAsset={handleAddAsset}
                  onDeleteAsset={handleDeleteAsset}
                  onEditAsset={handleEditAsset}
                  onAddLiability={handleAddLiability}
                  onDeleteLiability={handleDeleteLiability}
                  onEditLiability={handleEditLiability}
                  onEditAccount={handleEditAccount}
                  onEditCard={handleEditCard}
                />
              )}
              {activeTab === "metas" && (
                <MetasView 
                  data={db} 
                  onAddGoal={handleAddGoal}
                  onDeleteGoal={handleDeleteGoal}
                  onEditGoal={handleEditGoal}
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
                  onUpdateProfile={(p) => {
                    const { expectedIncome, ...profileData } = p;
                    let updatedIncomeSources = db.incomeSources;
                    if (expectedIncome !== undefined) {
                      updatedIncomeSources = db.incomeSources.map(inc => {
                        if (inc.id === "inc-1") {
                          return { ...inc, expectedValue: expectedIncome };
                        }
                        return inc;
                      });
                    }
                    saveDb({
                      ...db,
                      profile: { ...db.profile, ...profileData },
                      incomeSources: updatedIncomeSources
                    });
                  }}
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
          { id: "dashboard", label: "Resumo", icon: <LayoutDashboard className="w-5 h-5" /> },
          { id: "lancamentos", label: "Lançar", icon: <RefreshCw className="w-5 h-5" /> },
          { id: "fluxo", label: "Contas", icon: <TrendingUp className="w-5 h-5" /> },
          { id: "patrimonio", label: "Bens", icon: <Briefcase className="w-5 h-5" /> },
          { id: "metas", label: "Sonhos", icon: <Award className="w-5 h-5" /> },
          { id: "coach", label: "IA", icon: <Bot className="w-5 h-5" /> },
          { id: "settings", label: "Ajustes", icon: <Settings className="w-5 h-5" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 transition cursor-pointer relative ${
              activeTab === tab.id
                ? "text-indigo-400 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <div className="relative flex items-center justify-center">
              {tab.icon}
              {tab.id === "fluxo" && hasNearCardDueDate() && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse border border-[#111111]" />
              )}
            </div>
            <span className="text-[10px] mt-1 font-semibold">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* WARNING POPUP MODAL */}
      <AnimatePresence>
        {pendingTx && txWarnings && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="bg-[#111111] border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-6 text-left shadow-2xl relative"
            >
              <button
                onClick={() => { setPendingTx(null); setTxWarnings(null); }}
                className="absolute right-4 top-4 text-slate-400 hover:text-white transition p-1.5 hover:bg-white/5 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-2">
                <span className="text-[10px] font-mono text-rose-400 font-bold uppercase tracking-wider block">🚨 ALERTA DO CO-PILOTO FINANCEIRO</span>
                <h3 className="text-lg font-bold text-white">Confirmação de Despesa Necessária</h3>
                <p className="text-xs text-slate-400">Identificamos riscos ao seu planejamento financeiro para esta transação:</p>
              </div>

              <div className="space-y-4">
                {/* Daily Spending Limit Warning */}
                {txWarnings.dailyLimit && (
                  <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-2xl space-y-3">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <strong className="text-xs text-amber-300 block">
                          {txWarnings.dailyLimit.exceeded ? "Limite Diário Ultrapassado!" : "Próximo ao Limite Diário!"}
                        </strong>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Seu teto diário é de <span className="font-mono text-amber-400 font-bold">R$ {txWarnings.dailyLimit.limit.toLocaleString("pt-BR")}</span>. 
                          Você já gastou <span className="font-mono text-slate-400">R$ {txWarnings.dailyLimit.current.toLocaleString("pt-BR")}</span> hoje. 
                          Esse novo lançamento de <span className="font-mono text-white font-bold">R$ {pendingTx.amount.toLocaleString("pt-BR")}</span> levará o total do dia para <span className="font-mono text-amber-400 font-bold">R$ {txWarnings.dailyLimit.valWithNew.toLocaleString("pt-BR")}</span>.
                        </p>
                      </div>
                    </div>
                    {/* Visual Bar Indicator */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Progresso Diário</span>
                        <span>{Math.round((txWarnings.dailyLimit.valWithNew / txWarnings.dailyLimit.limit) * 100)}%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden flex">
                        <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, (txWarnings.dailyLimit.current / txWarnings.dailyLimit.limit) * 100)}%` }} />
                        <div className="bg-amber-400 h-full opacity-60 animate-pulse" style={{ width: `${Math.min(100 - (txWarnings.dailyLimit.current / txWarnings.dailyLimit.limit) * 100, (pendingTx.amount / txWarnings.dailyLimit.limit) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Income Deficit Warning */}
                {txWarnings.incomeDeficit && (
                  <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-2xl space-y-3">
                    <div className="flex items-start gap-2.5">
                      <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <strong className="text-xs text-rose-300 block">Déficit Orçamentário Mensal!</strong>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Sua entrada prevista para este mês é de <span className="font-mono text-emerald-400 font-bold">R$ {txWarnings.incomeDeficit.expected.toLocaleString("pt-BR")}</span>. 
                          Seus gastos anteriores somam <span className="font-mono text-slate-400">R$ {txWarnings.incomeDeficit.current.toLocaleString("pt-BR")}</span>. 
                          Este novo gasto de <span className="font-mono text-white font-bold">R$ {pendingTx.amount.toLocaleString("pt-BR")}</span> levará o total do mês para <span className="font-mono text-rose-400 font-bold">R$ {txWarnings.incomeDeficit.valWithNew.toLocaleString("pt-BR")}</span>, ultrapassando suas receitas previstas em <span className="font-mono text-rose-400 font-bold">R$ {(txWarnings.incomeDeficit.valWithNew - txWarnings.incomeDeficit.expected).toLocaleString("pt-BR")}</span>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-[#050505] rounded-xl text-[11px] text-slate-300 leading-relaxed border border-white/5 space-y-2">
                <div className="flex items-center gap-1.5 text-indigo-400 font-bold font-mono text-[10px]">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  CO-PILOTO FINANCEIRO ADAPTATIVO
                </div>
                
                <p className="text-slate-300">
                  {db.profile.spendingPersona === "gastador" && "⚠️ Perfil GASTADOR ativo: Atenção redobrada! Compras emotivas ou por impulso são os maiores vilões do seu planejamento."}
                  {db.profile.spendingPersona === "poupador" && "🌱 Perfil POUPADOR ativo: Como você prefere economizar, reflita se esse gasto realmente agrega valor à sua vida."}
                  {db.profile.spendingPersona === "investidor" && "📈 Perfil INVESTIDOR ativo: Cada real gasto hoje é um real a menos rendendo juros compostos a seu favor no longo prazo!"}
                  {db.profile.spendingPersona === "planejador" && "📋 Perfil PLANEJADOR ativo: Certifique-se de ajustar seu orçamento mensal para absorver este lançamento extraordinário."}
                  {(!db.profile.spendingPersona) && "💡 Evite extrapolar limites diários para proteger seu fluxo de caixa e blindar suas caixinhas."}
                </p>

                {db.profile.mainSavingsFocus && (
                  <div className="pt-2 border-t border-white/5 flex flex-col gap-0.5 text-[10px] text-slate-500">
                    <span className="font-bold text-slate-400 uppercase tracking-wider font-mono text-[9px]">Foco de Economia Ativo:</span>
                    <span>
                      {db.profile.mainSavingsFocus === "reserve" && "🛡️ Foco em Reserva de Emergência: Sua prioridade absoluta é criar estabilidade contra imprevistos!"}
                      {db.profile.mainSavingsFocus === "debts" && "💸 Foco em Quitar Dívidas: Evite novas contas para amortizar juros acumulados mais rápido!"}
                      {db.profile.mainSavingsFocus === "investments" && "🚀 Foco em Investimentos: Priorize acumular ativos para gerar renda passiva futuramente!"}
                      {db.profile.mainSavingsFocus === "leisure_cut" && "🍿 Foco em Cortar Supérfluos: Este item entra no seu radar de cortes conscientes!"}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 text-xs font-bold pt-2">
                <button
                  onClick={() => { setPendingTx(null); setTxWarnings(null); }}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl cursor-pointer text-center"
                >
                  Cancelar Lançamento
                </button>
                <button
                  onClick={async () => {
                    if (pendingTx) {
                      await commitAddTransaction(pendingTx);
                      setPendingTx(null);
                      setTxWarnings(null);
                    }
                  }}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl cursor-pointer text-center font-bold"
                >
                  Registrar Mesmo Assim
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
