import React, { useState, useEffect } from "react";
import { 
  Plus, Search, Filter, Calendar, TrendingUp, TrendingDown, RefreshCw, 
  FileText, Pencil, Trash2, Check, X, ArrowUpRight, ArrowDownRight, 
  CreditCard, DollarSign, Sparkles, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ExcelDatabase, Transaction } from "../types";

interface LancamentosProps {
  data: ExcelDatabase;
  onAddTransaction: (tx: Omit<Transaction, "id">) => void;
  onAddTransactions?: (txs: Array<Omit<Transaction, "id">>) => void;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (id: string, tx: Partial<Transaction>) => void;
}

export default function LancamentosView({
  data,
  onAddTransaction,
  onAddTransactions,
  onDeleteTransaction,
  onEditTransaction
}: LancamentosProps) {
  // Main sub-view switcher: Manual form vs. PDF Import
  const [entryMode, setEntryMode] = useState<"manual" | "pdf">("manual");

  // Filter & Search states for the history table
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState<string>(new Date().toISOString().substring(5, 7));
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");

  // Bank statement import states
  const [statementFile, setStatementFile] = useState<File | null>(null);
  const [importingState, setImportingState] = useState<"idle" | "parsing" | "parsed">("idle");
  const [parsedTransactions, setParsedTransactions] = useState<Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
    type: "income" | "expense";
    category: string;
    selected: boolean;
  }>>([]);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  // Manual Transaction Form State
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("Alimentação");
  const [accountId, setAccountId] = useState("acc-1");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);
  const [isRecurring, setIsRecurring] = useState(false);

  // Editing States for Existing Transactions
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editTxDesc, setEditTxDesc] = useState("");
  const [editTxAmount, setEditTxAmount] = useState("");
  const [editTxCategory, setEditTxCategory] = useState("Alimentação");
  const [editTxType, setEditTxType] = useState<"income" | "expense">("expense");
  const [editTxAccountId, setEditTxAccountId] = useState("acc-1");
  const [editTxDate, setEditTxDate] = useState("");

  // Warning Interceptor States for Daily Limit and Monthly Income Deficit
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningDetails, setWarningDetails] = useState<{
    title: string;
    description: string;
    type: "daily_exceeded" | "daily_near" | "income_deficit";
    amount: number;
    limit?: number;
    currentSpending?: number;
    predictedIncome?: number;
    onConfirm: () => void;
  } | null>(null);

  const checkTransactionWarnings = (txAmount: number, txDateStr: string): {
    triggered: boolean;
    type: "daily_exceeded" | "daily_near" | "income_deficit" | null;
    title: string;
    description: string;
    limit?: number;
    currentSpending?: number;
    predictedIncome?: number;
  } => {
    // 1. Daily Spending Limit Check
    const dailyLimit = data.profile.dailySpendingLimit;
    if (dailyLimit && dailyLimit > 0) {
      // Find expenses on the same day
      const expensesOnDay = data.transactions
        .filter(t => t.type === "expense" && t.date === txDateStr)
        .reduce((sum, t) => sum + t.amount, 0);

      const totalAfterTx = expensesOnDay + txAmount;

      if (totalAfterTx > dailyLimit) {
        return {
          triggered: true,
          type: "daily_exceeded",
          title: "🚨 Limite Diário Ultrapassado!",
          description: `Este gasto de R$ ${txAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} fará suas despesas de hoje (R$ ${totalAfterTx.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}) ultrapassarem seu limite diário estipulado de R$ ${dailyLimit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`,
          limit: dailyLimit,
          currentSpending: totalAfterTx
        };
      } else if (totalAfterTx >= dailyLimit * 0.85) {
        return {
          triggered: true,
          type: "daily_near",
          title: "⚠️ Próximo ao Limite Diário!",
          description: `Atenção: Este gasto de R$ ${txAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} deixará suas despesas de hoje em R$ ${totalAfterTx.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}, o que está muito próximo (ou acima de 85%) do seu limite diário de R$ ${dailyLimit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`,
          limit: dailyLimit,
          currentSpending: totalAfterTx
        };
      }
    }

    // 2. Monthly Deficit Check (Spending more than predicted income)
    const predictedIncome = data.incomeSources.reduce((sum, inc) => sum + inc.expectedValue, 0) || monthlyIncomes;
    
    // Expenses in the target month
    const targetMonthStr = txDateStr.substring(0, 7);
    const expensesInMonth = data.transactions
      .filter(t => t.type === "expense" && t.date.startsWith(targetMonthStr))
      .reduce((sum, t) => sum + t.amount, 0);

    const totalMonthlyAfterTx = expensesInMonth + txAmount;

    if (predictedIncome > 0 && totalMonthlyAfterTx > predictedIncome) {
      return {
        triggered: true,
        type: "income_deficit",
        title: "🔴 Alerta de Déficit Orçamentário!",
        description: `Este lançamento fará com que suas despesas mensais totais (R$ ${totalMonthlyAfterTx.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}) superem sua renda prevista para este mês (R$ ${predictedIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}). Evite gastar mais do que você ganha para manter as contas no azul!`,
        predictedIncome,
        currentSpending: totalMonthlyAfterTx
      };
    }

    return { triggered: false, type: null, title: "", description: "" };
  };

  // Default the category when the manually selected type changes
  useEffect(() => {
    if (type === "income") {
      setCategory("Salário");
    } else {
      setCategory("Alimentação");
    }
  }, [type]);

  // Calculations for the Summary header
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const hasDateFilter = monthFilter !== "all" || yearFilter !== "all";

  const monthNames: Record<string, string> = {
    "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril",
    "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto",
    "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro"
  };

  let summaryPeriodLabel = "Todos os Lançamentos";
  if (monthFilter !== "all" && yearFilter !== "all") {
    summaryPeriodLabel = `${monthNames[monthFilter]} de ${yearFilter}`;
  } else if (monthFilter !== "all") {
    summaryPeriodLabel = `${monthNames[monthFilter]}`;
  } else if (yearFilter !== "all") {
    summaryPeriodLabel = `Ano ${yearFilter}`;
  }

  const monthlyIncomes = data.transactions
    .filter(t => {
      if (t.type !== "income") return false;
      if (monthFilter !== "all") {
        const m = t.date.split("-")[1];
        if (m !== monthFilter) return false;
      }
      if (yearFilter !== "all") {
        const y = t.date.split("-")[0];
        if (y !== yearFilter) return false;
      }
      return true;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = data.transactions
    .filter(t => {
      if (t.type !== "expense") return false;
      if (monthFilter !== "all") {
        const m = t.date.split("-")[1];
        if (m !== monthFilter) return false;
      }
      if (yearFilter !== "all") {
        const y = t.date.split("-")[0];
        if (y !== yearFilter) return false;
      }
      return true;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = monthlyIncomes - monthlyExpenses;

  // Handles adding transaction manually
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || !desc.trim()) return;

    const executeAdd = () => {
      onAddTransaction({
        type,
        amount: parsedAmount,
        date: txDate || new Date().toISOString().split("T")[0],
        category,
        accountId,
        description: desc.trim(),
        isRecurring
      });

      // Reset Form
      setDesc("");
      setAmount("");
      setIsRecurring(false);
      setTxDate(new Date().toISOString().split("T")[0]);
      setShowWarningModal(false);
      setWarningDetails(null);
    };

    if (type === "expense") {
      const warning = checkTransactionWarnings(parsedAmount, txDate || new Date().toISOString().split("T")[0]);
      if (warning.triggered) {
        setWarningDetails({
          ...warning,
          type: warning.type!,
          amount: parsedAmount,
          onConfirm: executeAdd
        });
        setShowWarningModal(true);
        return;
      }
    }

    executeAdd();
  };

  // Simulates reading a bank statement PDF and outputs mock rows
  const triggerPdfSimulation = (fileName: string) => {
    setImportingState("parsing");
    setImportSuccessCount(null);
    
    setTimeout(() => {
      const today = new Date();
      const year = today.getFullYear();
      const monthStr = String(today.getMonth() + 1).padStart(2, "0");
      
      let rows = [];
      const lowerFile = fileName.toLowerCase();
      
      if (lowerFile.includes("nubank") || lowerFile.includes("nu")) {
        rows = [
          { id: "pe-1", date: `${year}-${monthStr}-02`, description: "Uber *UBER TRIP", amount: 18.90, type: "expense", category: "Transporte", selected: true },
          { id: "pe-2", date: `${year}-${monthStr}-04`, description: "RESTAURANTE COCO BAMBU", amount: 145.00, type: "expense", category: "Lazer", selected: true },
          { id: "pe-3", date: `${year}-${monthStr}-05`, description: "Transferência recebida - Fulano de Tal", amount: 350.00, type: "income", category: "Outros", selected: true },
          { id: "pe-4", date: `${year}-${monthStr}-08`, description: "NETFLIX.COM", amount: 55.90, type: "expense", category: "Lazer", selected: true },
          { id: "pe-5", date: `${year}-${monthStr}-12`, description: "Supermercado Pão de Açúcar", amount: 210.45, type: "expense", category: "Alimentação", selected: true },
          { id: "pe-6", date: `${year}-${monthStr}-15`, description: "Posto Ipiranga Combustíveis", amount: 80.00, type: "expense", category: "Transporte", selected: true }
        ];
      } else if (lowerFile.includes("itau") || lowerFile.includes("itaú") || lowerFile.includes("personalite")) {
        rows = [
          { id: "pe-1", date: `${year}-${monthStr}-03`, description: "SISPAG SALARIO RECORRENTE", amount: 2800.00, type: "income", category: "Salário", selected: true },
          { id: "pe-2", date: `${year}-${monthStr}-05`, description: "DEB.AUTOMATICO ENEL LUZ", amount: 124.50, type: "expense", category: "Serviços", selected: true },
          { id: "pe-3", date: `${year}-${monthStr}-08`, description: "PIX ENVIADO - Padaria Bella", amount: 34.20, type: "expense", category: "Alimentação", selected: true },
          { id: "pe-4", date: `${year}-${monthStr}-10`, description: "AUTOPASS METRO SP", amount: 5.00, type: "expense", category: "Transporte", selected: true },
          { id: "pe-5", date: `${year}-${monthStr}-14`, description: "FARMACIA RAIA", amount: 67.90, type: "expense", category: "Saúde", selected: true }
        ];
      } else {
        rows = [
          { id: "pe-1", date: `${year}-${monthStr}-02`, description: "PIX Recebido - Venda Item", amount: 150.00, type: "income", category: "Outros Recebimentos", selected: true },
          { id: "pe-2", date: `${year}-${monthStr}-06`, description: "RECARGA CELULAR TIM", amount: 40.00, type: "expense", category: "Serviços", selected: true },
          { id: "pe-3", date: `${year}-${monthStr}-10`, description: "SUPERMERCADO CARREFOUR", amount: 189.30, type: "expense", category: "Alimentação", selected: true },
          { id: "pe-4", date: `${year}-${monthStr}-14`, description: "UBER TRIP BRASIL", amount: 22.40, type: "expense", category: "Transporte", selected: true },
          { id: "pe-5", date: `${year}-${monthStr}-18`, description: "COMPRA INTERNET MERCADOLIVRE", amount: 115.90, type: "expense", category: "Lazer", selected: true }
        ];
      }
      
      setParsedTransactions(rows as any);
      setImportingState("parsed");
    }, 1500);
  };

  // Reads a real bank statement PDF, converts it to base64, and sends it to Gemini API
  const parseRealPdf = (file: File) => {
    setImportingState("parsing");
    setImportSuccessCount(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const result = event.target?.result as string;
        const base64 = result.split(",")[1];

        const response = await fetch("/api/ai/parse-statement", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileBase64: base64,
            fileName: file.name
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.details || "Erro desconhecido ao processar extrato.");
        }

        const data = await response.json();
        if (data.success && Array.isArray(data.transactions)) {
          setParsedTransactions(data.transactions);
          setImportingState("parsed");
        } else {
          throw new Error("Resposta de processamento inválida do servidor.");
        }
      } catch (err: any) {
        console.error("Erro na leitura/processamento do extrato:", err);
        alert(`Não foi possível extrair dados do extrato: ${err.message}`);
        setImportingState("idle");
        setStatementFile(null);
      }
    };

    reader.onerror = () => {
      alert("Erro ao ler o arquivo PDF localmente.");
      setImportingState("idle");
      setStatementFile(null);
    };

    reader.readAsDataURL(file);
  };

  // Commits the selected items from statement to the persistent database
  const handleCommitPdfImport = () => {
    const selected = parsedTransactions.filter(t => t.selected);
    if (selected.length === 0) return;
    
    const executeBulkAdd = () => {
      const txsToSave = selected.map(t => ({
        type: t.type,
        amount: t.amount,
        date: t.date,
        category: t.category,
        accountId: "acc-1",
        description: `[Extrato] ${t.description}`,
        isRecurring: false
      }));

      if (onAddTransactions) {
        onAddTransactions(txsToSave);
      } else {
        selected.forEach(t => {
          onAddTransaction({
            type: t.type,
            amount: t.amount,
            date: t.date,
            category: t.category,
            accountId: "acc-1",
            description: `[Extrato] ${t.description}`,
            isRecurring: false
          });
        });
      }
      
      setImportSuccessCount(selected.length);
      setImportingState("idle");
      setStatementFile(null);
      setParsedTransactions([]);
      setShowWarningModal(false);
      setWarningDetails(null);
    };

    // Check if any of the imported expenses trigger a warning
    let triggeredWarning: any = null;
    for (const t of selected) {
      if (t.type === "expense") {
        const warning = checkTransactionWarnings(t.amount, t.date);
        if (warning.triggered) {
          triggeredWarning = warning;
          // Prioritize higher severity alerts (exceeded/deficit) if any
          if (warning.type === "daily_exceeded" || warning.type === "income_deficit") {
            break;
          }
        }
      }
    }

    if (triggeredWarning) {
      setWarningDetails({
        ...triggeredWarning,
        type: triggeredWarning.type!,
        amount: selected.reduce((sum, t) => sum + (t.type === "expense" ? t.amount : 0), 0),
        title: `${triggeredWarning.title} (Via Extrato)`,
        description: `Durante a importação do extrato, identificamos alertas críticos. Exemplo: ${triggeredWarning.description}`,
        onConfirm: executeBulkAdd
      });
      setShowWarningModal(true);
      return;
    }

    executeBulkAdd();
  };

  // Inline editing handles
  const startEditTx = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setEditTxDesc(tx.description);
    setEditTxAmount(tx.amount.toString());
    setEditTxCategory(tx.category);
    setEditTxType(tx.type);
    setEditTxAccountId(tx.accountId || "acc-1");
    setEditTxDate(tx.date);
  };

  const saveEditTx = () => {
    const amt = parseFloat(editTxAmount);
    if (isNaN(amt) || amt <= 0 || !editTxDesc.trim()) return;

    onEditTransaction(editingTxId!, {
      type: editTxType,
      amount: amt,
      date: editTxDate,
      category: editTxCategory,
      accountId: editTxAccountId,
      description: editTxDesc.trim(),
      isRecurring: false
    });

    setEditingTxId(null);
  };

  // Filter, Search, and Sort Logic
  const allCategories = Array.from(new Set(data.transactions.map(t => t.category)));
  const availableYears = Array.from(new Set(data.transactions.map(t => t.date.split("-")[0]))).sort().reverse();
  const years = availableYears.length > 0 ? availableYears : [new Date().getFullYear().toString()];
 
  const filteredTransactions = data.transactions.filter(t => {
    // 1. Search Query Match
    const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Type Match
    const matchesType = typeFilter === "all" || t.type === typeFilter;

    // 3. Category Match
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;

    // 4. Month Match
    let matchesMonth = true;
    if (monthFilter !== "all") {
      const m = t.date.split("-")[1];
      matchesMonth = m === monthFilter;
    }

    // 5. Year Match
    let matchesYear = true;
    if (yearFilter !== "all") {
      const y = t.date.split("-")[0];
      matchesYear = y === yearFilter;
    }

    return matchesSearch && matchesType && matchesCategory && matchesMonth && matchesYear;
  });

  // Sorting
  const sortedTransactions = filteredTransactions.slice().sort((a, b) => {
    if (sortBy === "date-desc") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortBy === "date-asc") {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    if (sortBy === "amount-desc") {
      return b.amount - a.amount;
    }
    if (sortBy === "amount-asc") {
      return a.amount - b.amount;
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 text-left">
          <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">Co-piloto Financeiro</span>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Painel de Lançamentos</h2>
          <p className="text-xs text-slate-400">Insira suas transações manualmente, edite o histórico ou automatize tudo via importador óptico de PDFs.</p>
        </div>

        {/* Action switch button */}
        <div className="flex bg-[#111111] p-1 border border-white/5 rounded-2xl shrink-0 self-start md:self-auto">
          <button
            onClick={() => { setEntryMode("manual"); setImportSuccessCount(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              entryMode === "manual" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Lançamento Manual
          </button>
          <button
            onClick={() => { setEntryMode("pdf"); setImportSuccessCount(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              entryMode === "pdf" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Importar Extrato PDF
          </button>
        </div>
      </div>

      {/* Month-To-Date Fast Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111111] border border-white/10 rounded-3xl p-5 text-left flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold block">Entradas ({summaryPeriodLabel})</span>
            <div className="text-lg md:text-xl font-bold text-white font-mono">
              R$ {monthlyIncomes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="absolute right-0 bottom-0 h-1 bg-emerald-500 w-1/3 group-hover:w-full transition-all duration-300" />
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-3xl p-5 text-left flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold block">Saídas ({summaryPeriodLabel})</span>
            <div className="text-lg md:text-xl font-bold text-white font-mono">
              R$ {monthlyExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div className="absolute right-0 bottom-0 h-1 bg-rose-500 w-1/3 group-hover:w-full transition-all duration-300" />
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-3xl p-5 text-left flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold block">Saldo ({summaryPeriodLabel})</span>
            <div className={`text-lg md:text-xl font-bold font-mono ${netBalance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {netBalance >= 0 ? "+" : ""} R$ {netBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className={`p-3 rounded-2xl ${netBalance >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
            <DollarSign className="w-5 h-5" />
          </div>
          <div className={`absolute right-0 bottom-0 h-1 w-1/3 group-hover:w-full transition-all duration-300 ${netBalance >= 0 ? "bg-emerald-500" : "bg-rose-500"}`} />
        </div>
      </div>

      {/* Main Workspace split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Input Tool (Form or PDF Import) */}
        <div className="lg:col-span-4 space-y-4">
          <AnimatePresence mode="wait">
            {entryMode === "manual" ? (
              <motion.div
                key="manual-entry-pane"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="space-y-3"
              >
                <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest font-bold text-left pl-1">Registrar Novo Ganho/Gasto</h3>
                
                <form onSubmit={handleManualSubmit} className="bg-[#111111] border border-white/10 rounded-3xl p-5 space-y-4 text-left shadow-lg">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Tipo de Transação</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setType("income")}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center justify-center gap-1 ${
                          type === "income"
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold"
                            : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        Ganho (Entrada)
                      </button>
                      <button
                        type="button"
                        onClick={() => setType("expense")}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center justify-center gap-1 ${
                          type === "expense"
                            ? "border-rose-500/40 bg-rose-500/10 text-rose-400 font-bold"
                            : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        Gasto (Saída)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Descrição</label>
                    <input
                      type="text"
                      placeholder="Ex: Almoço restaurante, Pix freela, etc."
                      className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-xs font-sans text-white transition"
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Valor (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-xs font-mono text-white transition"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Data</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-xs font-mono text-white transition"
                        value={txDate}
                        onChange={(e) => setTxDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Categoria</label>
                    <select
                      className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-xs text-white transition"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {type === "income" ? (
                        <>
                          <option value="Salário">Salário / CLT</option>
                          <option value="Investimentos">Rendimentos / Investimentos</option>
                          <option value="Freelance">Trabalho Extra / Freelance</option>
                          <option value="Outros">Outros Recebimentos</option>
                        </>
                      ) : (
                        <>
                          <option value="Alimentação">Alimentação / Mercado</option>
                          <option value="Moradia">Moradia / Aluguel</option>
                          <option value="Transporte">Transporte / Uber / Combustível</option>
                          <option value="Serviços">Serviços / Contas / Boletos</option>
                          <option value="Lazer">Lazer / Restaurantes / Viagens</option>
                          <option value="Educação">Educação / Cursos</option>
                          <option value="Saúde">Saúde / Medicamentos</option>
                          <option value="Outros">Outros Gastos</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Conta Destino/Origem</label>
                    <select
                      className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-xs text-white transition"
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                    >
                      {data.accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} (Saldo: R$ {acc.balance.toLocaleString("pt-BR")})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      id="lanc-recurring-check"
                      type="checkbox"
                      className="w-4 h-4 rounded border-white/10 text-indigo-500 focus:ring-indigo-500 bg-[#050505]"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                    />
                    <label htmlFor="lanc-recurring-check" className="text-xs text-slate-400 cursor-pointer select-none">
                      Repetir mensalmente de forma fixa
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-indigo-600/10"
                  >
                    Salvar Lançamento
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="pdf-entry-pane"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="space-y-3"
              >
                <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest font-bold text-left pl-1">Leitor de Extrato Inteligente</h3>
                
                <div className="bg-[#111111] border border-white/10 rounded-3xl p-5 space-y-4 text-left shadow-lg">
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-white">Extraia lançamentos instantaneamente</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Envie o arquivo PDF do extrato bancário para que nosso algoritmo identifique valores e preencha automaticamente.
                    </p>
                  </div>

                  {/* Drop zone / selector */}
                  <div 
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type === "application/pdf") {
                        setStatementFile(file);
                        parseRealPdf(file);
                      } else {
                        alert("Por favor, envie um arquivo em formato PDF.");
                      }
                    }}
                    className="border border-dashed border-white/10 rounded-2xl p-6 hover:border-indigo-500/50 hover:bg-indigo-950/5 transition duration-300 flex flex-col items-center justify-center text-center space-y-3 cursor-pointer"
                    onClick={() => document.getElementById("main-pdf-upload")?.click()}
                  >
                    <div className="p-3 bg-indigo-500/10 rounded-full text-indigo-400">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-bold text-white">Clique ou arraste o arquivo aqui</p>
                      <p className="text-[9px] text-slate-500">Formato PDF apenas (.pdf)</p>
                    </div>
                    <input 
                      type="file" 
                      accept=".pdf" 
                      id="main-pdf-upload"
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setStatementFile(file);
                          if (file.size > 0) {
                            parseRealPdf(file);
                          } else {
                            triggerPdfSimulation(file.name);
                          }
                        }
                      }}
                    />
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById("main-pdf-upload")?.click();
                      }}
                      className="px-3 py-1.5 bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white text-indigo-400 text-[10px] font-bold rounded-lg transition cursor-pointer"
                    >
                      Selecionar Arquivo
                    </button>
                  </div>

                  {/* Simulation Helpers */}
                  <div className="p-4 bg-[#050505] border border-white/5 rounded-2xl space-y-3">
                    <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-wider font-bold block">Experimentar Sem Arquivo (Simular)</span>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Selecione um dos emuladores bancários prontos abaixo para testar a captura:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        type="button"
                        onClick={() => {
                          setStatementFile(new File([], "nubank_julho_2026.pdf"));
                          triggerPdfSimulation("nubank_julho_2026.pdf");
                        }}
                        className="py-1.5 px-2 bg-indigo-950/5 hover:bg-indigo-950/20 border border-purple-500/20 hover:border-purple-500/50 rounded-xl text-left transition text-[10px] truncate block text-purple-300 font-bold"
                      >
                        💜 NuBank PDF
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setStatementFile(new File([], "itau_personalite.pdf"));
                          triggerPdfSimulation("itau_personalite.pdf");
                        }}
                        className="py-1.5 px-2 bg-indigo-950/5 hover:bg-indigo-950/20 border border-sky-500/20 hover:border-sky-500/50 rounded-xl text-left transition text-[10px] truncate block text-sky-300 font-bold"
                      >
                        🧡 Itaú PDF
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: Ledger / Statement Review */}
        <div className="lg:col-span-8 space-y-4">
          <AnimatePresence mode="wait">
            {entryMode === "pdf" && importingState !== "idle" ? (
              // EXTRATO IMPORT PREVIEW VIEW
              <motion.div
                key="pdf-extracted-pane"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3 text-left"
              >
                <div className="flex items-center justify-between pl-1">
                  <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest font-bold">Extrato PDF Lido por OCR</h3>
                  <button 
                    onClick={() => { setImportingState("idle"); setStatementFile(null); }}
                    className="text-[10px] font-mono text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3 h-3" /> Cancelar Leitura
                  </button>
                </div>

                {importingState === "parsing" ? (
                  <div className="bg-[#111111] border border-white/10 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-lg">
                    <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white">Escanando Documento...</p>
                      <p className="text-[10px] text-slate-500 max-w-sm mx-auto">Analisando metadados fiscais, extraindo tabelas bancárias e categorizando transações com IA.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#111111] border border-white/10 rounded-3xl p-5 md:p-6 space-y-5 shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-indigo-950/10 border border-indigo-500/20 rounded-2xl">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white">Extrato Processado: <span className="text-indigo-300 font-mono">{statementFile?.name}</span></p>
                        <p className="text-[10px] text-slate-400">Marque as transações que deseja importar e revise a classificação antes de lançar no seu caixa.</p>
                      </div>
                      <div className="flex gap-2 shrink-0 self-start sm:self-auto">
                        <button 
                          onClick={handleCommitPdfImport}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-indigo-600/15"
                        >
                          Importar Selecionados ({parsedTransactions.filter(t => t.selected).length})
                        </button>
                      </div>
                    </div>

                    <div className="border border-white/5 rounded-2xl overflow-hidden bg-[#050505]">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 text-slate-500 uppercase font-mono text-[9px] tracking-wider font-bold bg-white/[0.02]">
                              <th className="py-3 px-4 w-12 text-center">Sel.</th>
                              <th className="py-3 px-4 w-24">Data</th>
                              <th className="py-3 px-4">Descrição Reconhecida</th>
                              <th className="py-3 px-4 w-44">Categoria Sugerida</th>
                              <th className="py-3 px-4 text-right w-28">Valor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {parsedTransactions.map((tx, idx) => (
                              <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="py-3 px-4 text-center">
                                  <input 
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-white/10 text-indigo-500 focus:ring-indigo-500 bg-[#111111]"
                                    checked={tx.selected}
                                    onChange={(e) => {
                                      const updated = [...parsedTransactions];
                                      updated[idx].selected = e.target.checked;
                                      setParsedTransactions(updated);
                                    }}
                                  />
                                </td>
                                <td className="py-3 px-4 font-mono text-slate-400">
                                  {tx.date.split("-").reverse().join("/")}
                                </td>
                                <td className="py-3 px-4 text-white font-medium flex items-center gap-1.5 truncate max-w-[200px]">
                                  <span className={tx.type === "income" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                                    {tx.type === "income" ? "↓" : "↑"}
                                  </span>
                                  {tx.description}
                                </td>
                                <td className="py-3 px-4">
                                  <select 
                                    className="bg-[#111111] border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white outline-none focus:border-indigo-500 w-full font-sans"
                                    value={tx.category}
                                    onChange={(e) => {
                                      const updated = [...parsedTransactions];
                                      updated[idx].category = e.target.value;
                                      setParsedTransactions(updated);
                                    }}
                                  >
                                    {tx.type === "income" ? (
                                      <>
                                        <option value="Salário">Salário / CLT</option>
                                        <option value="Investimentos">Rendimentos / Investimentos</option>
                                        <option value="Freelance">Trabalho Extra / Freelance</option>
                                        <option value="Outros">Outros Recebimentos</option>
                                      </>
                                    ) : (
                                      <>
                                        <option value="Alimentação">Alimentação / Mercado</option>
                                        <option value="Moradia">Moradia / Aluguel</option>
                                        <option value="Transporte">Transporte / Uber / Combustível</option>
                                        <option value="Serviços">Serviços / Contas / Boletos</option>
                                        <option value="Lazer">Lazer / Restaurantes / Viagens</option>
                                        <option value="Educação">Educação / Cursos</option>
                                        <option value="Saúde">Saúde / Medicamentos</option>
                                        <option value="Outros">Outros Gastos</option>
                                      </>
                                    )}
                                  </select>
                                </td>
                                <td className={`py-3 px-4 text-right font-mono font-bold ${tx.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                                  {tx.type === "income" ? "+" : "-"} R$ {tx.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              // LEDGER HISTORY TABLE VIEW
              <motion.div
                key="ledger-history-pane"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3 text-left"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pl-1">
                  <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest font-bold">Histórico de Movimentações</h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Mostrando {sortedTransactions.length} de {data.transactions.length} registros
                  </span>
                </div>

                {importSuccessCount !== null && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-400 font-medium flex items-center gap-2 animate-fade-in shadow-inner">
                    <span className="text-base">✓</span>
                    Importação concluída! <strong>{importSuccessCount} transações</strong> do extrato foram catalogadas com sucesso!
                  </div>
                )}

                {/* Filters & Search Toolbar Bar */}
                <div className="bg-[#111111] border border-white/10 rounded-3xl p-4 gap-4 flex flex-col md:flex-row md:items-center justify-between shadow-md">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Pesquisar por descrição ou categoria..."
                      className="w-full pl-10 pr-4 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-xs text-white transition font-sans"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                      >
                        Limpar
                      </button>
                    )}
                  </div>

                  {/* Filters Grid */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Type select */}
                    <select
                      className="px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none text-xs text-slate-300 focus:border-indigo-500 font-sans cursor-pointer min-w-[120px]"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as any)}
                    >
                      <option value="all">Tipos (Todos)</option>
                      <option value="income">Apenas Ganhos</option>
                      <option value="expense">Apenas Gastos</option>
                    </select>

                    {/* Category select */}
                    <select
                      className="px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none text-xs text-slate-300 focus:border-indigo-500 font-sans cursor-pointer min-w-[130px] max-w-[150px]"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="all">Categorias (Todas)</option>
                      {allCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>

                    {/* Month select */}
                    <select
                      className="px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none text-xs text-slate-300 focus:border-indigo-500 font-sans cursor-pointer min-w-[120px]"
                      value={monthFilter}
                      onChange={(e) => setMonthFilter(e.target.value)}
                    >
                      <option value="all">Mês (Todos)</option>
                      <option value="01">Janeiro</option>
                      <option value="02">Fevereiro</option>
                      <option value="03">Março</option>
                      <option value="04">Abril</option>
                      <option value="05">Maio</option>
                      <option value="06">Junho</option>
                      <option value="07">Julho</option>
                      <option value="08">Agosto</option>
                      <option value="09">Setembro</option>
                      <option value="10">Outubro</option>
                      <option value="11">Novembro</option>
                      <option value="12">Dezembro</option>
                    </select>

                    {/* Year select */}
                    <select
                      className="px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none text-xs text-slate-300 focus:border-indigo-500 font-sans cursor-pointer min-w-[100px]"
                      value={yearFilter}
                      onChange={(e) => setYearFilter(e.target.value)}
                    >
                      <option value="all">Ano (Todos)</option>
                      {years.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>

                    {/* Sorting select */}
                    <select
                      className="px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none text-xs text-slate-300 focus:border-indigo-500 font-sans cursor-pointer min-w-[130px]"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                    >
                      <option value="date-desc">Mais Recentes</option>
                      <option value="date-asc">Mais Antigas</option>
                      <option value="amount-desc">Maior Valor (R$)</option>
                      <option value="amount-asc">Menor Valor (R$)</option>
                    </select>

                    {/* Clear button if filtered */}
                    {(typeFilter !== "all" || categoryFilter !== "all" || monthFilter !== "all" || yearFilter !== "all" || searchQuery !== "") && (
                      <button
                        type="button"
                        onClick={() => {
                          setTypeFilter("all");
                          setCategoryFilter("all");
                          setMonthFilter("all");
                          setYearFilter("all");
                          setSearchQuery("");
                        }}
                        className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" /> Limpar Filtros
                      </button>
                    )}
                  </div>
                </div>

                {/* Main Ledger Table */}
                <div className="bg-[#111111] border border-white/10 rounded-3xl overflow-hidden shadow-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/5 text-slate-500 text-[10px] font-bold uppercase tracking-wider font-mono bg-white/[0.01]">
                          <th className="py-3 px-4 w-24">Data</th>
                          <th className="py-3 px-4">Descrição</th>
                          <th className="py-3 px-4 w-32">Categoria</th>
                          <th className="py-3 px-4 text-right w-32">Valor</th>
                          <th className="py-3 px-4 text-center w-24">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {sortedTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 px-4 text-center text-slate-500 text-xs">
                              <AlertTriangle className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                              Nenhum lançamento encontrado para os filtros atuais.
                            </td>
                          </tr>
                        ) : (
                          sortedTransactions.map(tx => (
                            <tr key={tx.id} className="hover:bg-white/[0.01] transition-colors">
                              {editingTxId === tx.id ? (
                                // INLINE EDITING FORM FOR TRANSACTION
                                <>
                                  <td className="py-3 px-4 font-mono text-slate-400">
                                    <input
                                      type="date"
                                      className="px-2 py-1 bg-[#050505] border border-white/25 rounded text-[11px] text-white outline-none w-full"
                                      value={editTxDate}
                                      onChange={(e) => setEditTxDate(e.target.value)}
                                    />
                                  </td>
                                  <td className="py-3 px-4 space-y-1">
                                    <input
                                      type="text"
                                      className="px-2 py-1 bg-[#050505] border border-white/25 rounded text-[11px] text-white outline-none focus:border-indigo-500 w-full font-bold"
                                      value={editTxDesc}
                                      onChange={(e) => setEditTxDesc(e.target.value)}
                                    />
                                    <div className="flex gap-1.5">
                                      <button 
                                        type="button"
                                        onClick={() => setEditTxType("income")} 
                                        className={`px-2 py-0.5 text-[9px] font-bold rounded transition ${editTxType === "income" ? "bg-emerald-500/25 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-slate-500 hover:text-slate-300"}`}
                                      >
                                        Ganho
                                      </button>
                                      <button 
                                        type="button"
                                        onClick={() => setEditTxType("expense")} 
                                        className={`px-2 py-0.5 text-[9px] font-bold rounded transition ${editTxType === "expense" ? "bg-rose-500/25 text-rose-400 border border-rose-500/30" : "bg-white/5 text-slate-500 hover:text-slate-300"}`}
                                      >
                                        Gasto
                                      </button>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <select
                                      className="px-2 py-1 bg-[#050505] border border-white/25 rounded text-[11px] text-white outline-none focus:border-indigo-500 w-full"
                                      value={editTxCategory}
                                      onChange={(e) => setEditTxCategory(e.target.value)}
                                    >
                                      <option value="Salário">Salário / CLT</option>
                                      <option value="Investimentos">Rendimentos</option>
                                      <option value="Freelance">Trabalho Extra</option>
                                      <option value="Alimentação">Alimentação</option>
                                      <option value="Moradia">Moradia</option>
                                      <option value="Transporte">Transporte</option>
                                      <option value="Serviços">Serviços</option>
                                      <option value="Lazer">Lazer</option>
                                      <option value="Educação">Educação</option>
                                      <option value="Saúde">Saúde</option>
                                      <option value="Outros">Outros</option>
                                    </select>
                                  </td>
                                  <td className="py-3 px-4">
                                    <input
                                      type="number"
                                      step="0.01"
                                      className="px-2 py-1 bg-[#050505] border border-white/25 rounded text-[11px] text-white outline-none text-right focus:border-indigo-500 w-full font-bold font-mono"
                                      value={editTxAmount}
                                      onChange={(e) => setEditTxAmount(e.target.value)}
                                    />
                                  </td>
                                  <td className="py-3 px-4 flex items-center justify-center gap-1">
                                    <button
                                      onClick={saveEditTx}
                                      className="text-emerald-400 hover:text-emerald-300 p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg transition"
                                      title="Confirmar Alteração"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setEditingTxId(null)}
                                      className="text-rose-400 hover:text-rose-300 p-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg transition"
                                      title="Descartar"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </>
                              ) : (
                                // STANDARD COMPONENT ROW VIEW
                                <>
                                  <td className="py-3.5 px-4 font-mono text-slate-400">
                                    {tx.date.split("-").reverse().join("/")}
                                  </td>
                                  <td className="py-3.5 px-4 font-semibold text-white truncate max-w-[150px] sm:max-w-xs">
                                    <div className="flex items-center gap-1.5">
                                      {tx.description.startsWith("[Extrato]") ? (
                                        <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[9px] rounded font-mono font-bold tracking-wider shrink-0" title="Importado de Extrato Bancário">OCR</span>
                                      ) : null}
                                      {tx.isRecurring ? (
                                        <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 text-[9px] rounded font-mono font-bold tracking-wider shrink-0" title="Lançamento Recorrente Mensal">FIXO</span>
                                      ) : null}
                                      <span className="truncate">{tx.description.replace("[Extrato] ", "")}</span>
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <span className="px-2.5 py-0.5 bg-white/5 border border-white/5 text-slate-300 text-[10px] font-semibold rounded-full">
                                      {tx.category}
                                    </span>
                                  </td>
                                  <td className={`py-3.5 px-4 text-right font-bold font-mono text-[13px] ${tx.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                                    {tx.type === "income" ? "+" : "-"} R$ {tx.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-3.5 px-4 flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => startEditTx(tx)}
                                      className="text-slate-400 hover:text-indigo-400 hover:bg-white/5 p-1.5 rounded-lg transition-all"
                                      title="Editar Lançamento"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => onDeleteTransaction(tx.id)}
                                      className="text-slate-400 hover:text-rose-400 hover:bg-white/5 p-1.5 rounded-lg transition-all"
                                      title="Excluir Lançamento"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* POPUP WARNING INTERCEPTOR MODAL */}
      <AnimatePresence>
        {showWarningModal && warningDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" id="spending-limit-warning-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111111] border border-white/10 rounded-3xl p-6 max-w-md w-full text-left space-y-4 shadow-2xl relative overflow-hidden"
            >
              {/* Top abstract light effect */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
              
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl shrink-0 ${
                  warningDetails.type === "daily_exceeded" || warningDetails.type === "income_deficit"
                    ? "bg-rose-500/10 text-rose-400"
                    : "bg-amber-500/10 text-amber-400"
                }`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white tracking-tight">{warningDetails.title}</h3>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Assistente de Disciplina Financeira</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-[#050505] p-4 rounded-2xl border border-white/5 font-sans">
                {warningDetails.description}
              </p>

              {/* Comparison stats box */}
              <div className="grid grid-cols-2 gap-3 text-xs p-3 bg-white/[0.02] rounded-xl border border-white/5 font-mono">
                {warningDetails.limit !== undefined && (
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Seu Limite Diário</span>
                    <span className="text-white font-bold">R$ {warningDetails.limit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {warningDetails.predictedIncome !== undefined && (
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Renda Prevista</span>
                    <span className="text-white font-bold">R$ {warningDetails.predictedIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Gasto Projetado</span>
                  <span className="text-white font-bold">R$ {warningDetails.currentSpending?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={warningDetails.onConfirm}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase rounded-xl transition cursor-pointer shadow-md shadow-indigo-600/10 text-center"
                >
                  Confirmar Lançamento
                </button>
                <button
                  onClick={() => { setShowWarningModal(false); setWarningDetails(null); }}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-bold uppercase rounded-xl transition cursor-pointer text-center"
                >
                  Voltar / Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
