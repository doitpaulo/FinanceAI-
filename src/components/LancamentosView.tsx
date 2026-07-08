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

export interface ParsedQuickTransaction {
  amount: string;
  description: string;
  type: "income" | "expense";
  category: string;
}

export function parseQuickInput(text: string): ParsedQuickTransaction | null {
  if (!text || !text.trim()) return null;

  const trimmed = text.trim();
  
  // Find all numbers (including decimals with dot or comma)
  // Matching patterns like: 45 | 45.90 | 45,90 | 1200 | 1.200,00 | R$ 45
  const numberRegex = /(?:R\$\s*)?(\d+(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})?)/gi;
  const matches = trimmed.match(numberRegex);
  
  if (!matches || matches.length === 0) return null;
  
  // Use the first match
  const rawNum = matches[0].replace(/R\$/i, "").trim();
  
  // Convert standard Brazilian decimal format to US decimal format for input fields
  let parsedAmount = "";
  if (rawNum.includes(",") && rawNum.includes(".")) {
    // e.g. 1.200,50 -> 1200.50
    parsedAmount = rawNum.replace(/\./g, "").replace(",", ".");
  } else if (rawNum.includes(",")) {
    // e.g. 45,90 -> 45.90
    const parts = rawNum.split(",");
    if (parts[1] && parts[1].length === 2) {
      parsedAmount = rawNum.replace(",", ".");
    } else {
      parsedAmount = rawNum.replace(",", ".");
    }
  } else {
    parsedAmount = rawNum;
  }
  
  // Ensure we can convert it to a valid float
  const numericVal = parseFloat(parsedAmount);
  if (isNaN(numericVal)) return null;
  
  // Extract description: everything except the number match and symbols like R$
  let description = trimmed.replace(matches[0], "").replace(/R\$/gi, "").replace(/[\s\-\:\#]+/g, " ").trim();
  
  if (description) {
    description = description.charAt(0).toUpperCase() + description.slice(1);
  } else {
    description = "Transação Expresso";
  }
  
  const descLower = description.toLowerCase();
  
  // Detect Type
  let type: "income" | "expense" = "expense";
  const incomeKeywords = [
    "salario", "salário", "clt", "provento", "freela", "freelance", "pix de", "recebimento", 
    "recebi", "ganho", "rendimento", "dividendo", "venda", "reembolso", "bônus", "bonus", "faturamento"
  ];
  if (incomeKeywords.some(keyword => descLower.includes(keyword))) {
    type = "income";
  }
  
  // Detect Category
  let category = "Outros";
  if (type === "income") {
    if (descLower.includes("salario") || descLower.includes("salário") || descLower.includes("clt") || descLower.includes("mensal")) {
      category = "Salário";
    } else if (descLower.includes("invest") || descLower.includes("divid") || descLower.includes("rend") || descLower.includes("tesouro") || descLower.includes("fundo")) {
      category = "Investimentos";
    } else if (descLower.includes("freela") || descLower.includes("extra") || descLower.includes("bico") || descLower.includes("venda")) {
      category = "Freelance";
    } else {
      category = "Outros";
    }
  } else {
    if (
      descLower.includes("almoço") || descLower.includes("almoco") || descLower.includes("jantar") || 
      descLower.includes("pizza") || descLower.includes("burger") || descLower.includes("lanchonete") || 
      descLower.includes("restaurante") || descLower.includes("padaria") || descLower.includes("mercado") || 
      descLower.includes("supermercado") || descLower.includes("comida") || descLower.includes("ifood") || 
      descLower.includes("carrefour") || descLower.includes("pão") || descLower.includes("pao") ||
      descLower.includes("feira") || descLower.includes("açougue") || descLower.includes("acougue")
    ) {
      category = "Alimentação";
    } else if (
      descLower.includes("aluguel") || descLower.includes("condominio") || descLower.includes("condomínio") || 
      descLower.includes("luz") || descLower.includes("agua") || descLower.includes("água") || 
      descLower.includes("energia") || descLower.includes("coelba") || descLower.includes("sabesp") || 
      descLower.includes("enel") || descLower.includes("gás") || descLower.includes("gas") ||
      descLower.includes("iptu") || descLower.includes("reforma")
    ) {
      category = "Moradia";
    } else if (
      descLower.includes("uber") || descLower.includes("combustivel") || descLower.includes("combustível") || 
      descLower.includes("gasolina") || descLower.includes("etanol") || descLower.includes("posto") || 
      descLower.includes("pedagio") || descLower.includes("pedágio") || descLower.includes("taxi") || 
      descLower.includes("táxi") || descLower.includes("metrô") || descLower.includes("metro") || 
      descLower.includes("ônibus") || descLower.includes("onibus") || descLower.includes("ipva") ||
      descLower.includes("mecanico") || descLower.includes("oficina")
    ) {
      category = "Transporte";
    } else if (
      descLower.includes("net") || descLower.includes("vivo") || descLower.includes("claro") || 
      descLower.includes("tim") || descLower.includes("telefone") || descLower.includes("internet") || 
      descLower.includes("tarifa") || descLower.includes("mensalidade") || descLower.includes("banco") || 
      descLower.includes("imposto") || descLower.includes("taxa") || descLower.includes("boleto") ||
      descLower.includes("seguro") || descLower.includes("hospedagem")
    ) {
      category = "Serviços";
    } else if (
      descLower.includes("netflix") || descLower.includes("spotify") || descLower.includes("cinema") || 
      descLower.includes("show") || descLower.includes("bar") || descLower.includes("cerveja") || 
      descLower.includes("viagem") || descLower.includes("hotel") || descLower.includes("festa") || 
      descLower.includes("ingresso") || descLower.includes("lazer") || descLower.includes("jogos") ||
      descLower.includes("steam") || descLower.includes("shopee") || descLower.includes("amazon") ||
      descLower.includes("aliexpress") || descLower.includes("presente")
    ) {
      category = "Lazer";
    } else if (
      descLower.includes("curso") || descLower.includes("faculdade") || descLower.includes("escola") || 
      descLower.includes("livro") || descLower.includes("udemy") || descLower.includes("mensalidade escolar") ||
      descLower.includes("estudo") || descLower.includes("ingles") || descLower.includes("inglês")
    ) {
      category = "Educação";
    } else if (
      descLower.includes("farmacia") || descLower.includes("drogaria") || descLower.includes("remedio") || 
      descLower.includes("remédio") || descLower.includes("consulta") || descLower.includes("medico") || 
      descLower.includes("médico") || descLower.includes("dentista") || descLower.includes("hospital") || 
      descLower.includes("exame") || descLower.includes("saude") || descLower.includes("saúde")
    ) {
      category = "Saúde";
    }
  }

  return {
    amount: parsedAmount,
    description,
    type,
    category
  };
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
  const [showManualModal, setShowManualModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

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

  // Paste text import states
  const [pdfSubMode, setPdfSubMode] = useState<"upload" | "paste">("upload");
  const [pastedText, setPastedText] = useState("");

  // Manual Transaction Form State
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("Alimentação");
  const [accountId, setAccountId] = useState("acc-1");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [quickInputText, setQuickInputText] = useState("");

  const handleQuickInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuickInputText(val);

    const parsed = parseQuickInput(val);
    if (parsed) {
      setDesc(parsed.description);
      setAmount(parsed.amount);
      setType(parsed.type);
      setCategory(parsed.category);
    }
  };

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
        const parts = (t.date || "").split("-");
        const m = parts[1];
        if (m !== monthFilter) return false;
      }
      if (yearFilter !== "all") {
        const parts = (t.date || "").split("-");
        const y = parts[0];
        if (y !== yearFilter) return false;
      }
      return true;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = data.transactions
    .filter(t => {
      if (t.type !== "expense") return false;
      if (monthFilter !== "all") {
        const parts = (t.date || "").split("-");
        const m = parts[1];
        if (m !== monthFilter) return false;
      }
      if (yearFilter !== "all") {
        const parts = (t.date || "").split("-");
        const y = parts[0];
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
      setQuickInputText("");
      setIsRecurring(false);
      setTxDate(new Date().toISOString().split("T")[0]);
      setShowWarningModal(false);
      setWarningDetails(null);
      setShowManualModal(false);
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
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            throw new Error(errorData.error || errorData.details || "Erro desconhecido ao processar extrato.");
          } else {
            const rawText = await response.text();
            throw new Error(rawText || `Erro do servidor (status ${response.status})`);
          }
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const rawText = await response.text();
          throw new Error(`Resposta do servidor não está em formato JSON: ${rawText.substring(0, 100)}`);
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
        alert(`Não foi possível extrair dados do extrato: ${err.message}\n\nDica sugerida: Se o arquivo PDF for muito pesado, tiver imagens escaneadas ou der erro de limite de processamento do servidor (Vercel), utilize a nova aba "Copiar e Colar Texto" ao lado para obter um processamento instantâneo e 100% confiável.`);
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

  // Parses plain text copy-pasted from bank statement or website
  const parsePastedText = async () => {
    if (!pastedText.trim()) {
      alert("Por favor, cole o texto do seu extrato bancário primeiro.");
      return;
    }
    setImportingState("parsing");
    setImportSuccessCount(null);

    const lines = pastedText.split("\n");
    const matchedRows: Array<{
      id: string;
      date: string;
      description: string;
      amount: number;
      type: "income" | "expense";
      category: string;
      selected: boolean;
    }> = [];

    // Loop through the lines and attempt high-reliability client-side regex parsing
    for (let i = 0; i < lines.length; i++) {
      let lineClean = lines[i].trim();
      if (!lineClean) continue;

      // Strip parentheses if the user copied the format literally with outer parentheses
      if (lineClean.startsWith("(")) {
        lineClean = lineClean.substring(1).trim();
      }
      if (lineClean.endsWith(")")) {
        lineClean = lineClean.substring(0, lineClean.length - 1).trim();
      }

      // Format regex matching: DD/MM/YYYY [Description] [-]R$ [Value]
      // Supporting day, month, optional 2-to-4 digit year, description, optional leading minus, R$, optional inner minus, and formatted value.
      const lineRegex = /^\s*(\d{2})\/(\d{2})(?:\/(\d{2,4}))?\s+(.*?)\s*([-+])?\s*R\$\s*([-+])?\s*([\d\.,\s]+)\s*$/i;
      const match = lineClean.match(lineRegex);

      if (match) {
        const day = match[1];
        const month = match[2];
        let year = match[3] || new Date().getFullYear().toString();
        if (year.length === 2) {
          year = "20" + year;
        }
        const description = match[4].trim();
        const isNegative = match[5] === "-" || match[6] === "-";
        const amountStr = match[7].trim();

        // Convert Brazilian-formatted number string (e.g. 3.459,60) to a valid float
        const cleanAmountStr = amountStr.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
        const amountNum = Math.abs(parseFloat(cleanAmountStr));

        if (!isNaN(amountNum)) {
          // Detect type
          const type = isNegative ? "expense" : "income";
          
          // Keyword-based classification for the parsed statement
          const descLower = description.toLowerCase();
          let category = "Outros";

          if (type === "income") {
            if (
              descLower.includes("salario") || descLower.includes("salário") || 
              descLower.includes("clt") || descLower.includes("liquido") || 
              descLower.includes("vencimento") || descLower.includes("remuneracao") ||
              descLower.includes("remuneração")
            ) {
              category = "Salário";
            } else if (
              descLower.includes("invest") || descLower.includes("divid") || 
              descLower.includes("rend") || descLower.includes("tesouro") || 
              descLower.includes("fundo") || descLower.includes("aplicacao") ||
              descLower.includes("aplicação")
            ) {
              category = "Investimentos";
            } else if (
              descLower.includes("freela") || descLower.includes("extra") || 
              descLower.includes("bico") || descLower.includes("venda")
            ) {
              category = "Freelance";
            }
          } else {
            if (
              descLower.includes("almoço") || descLower.includes("almoco") || descLower.includes("jantar") || 
              descLower.includes("pizza") || descLower.includes("burger") || descLower.includes("lanchonete") || 
              descLower.includes("restaurante") || descLower.includes("padaria") || descLower.includes("mercado") || 
              descLower.includes("supermercado") || descLower.includes("comida") || descLower.includes("ifood") || 
              descLower.includes("carrefour") || descLower.includes("pão") || descLower.includes("pao") ||
              descLower.includes("feira") || descLower.includes("açougue") || descLower.includes("acougue")
            ) {
              category = "Alimentação";
            } else if (
              descLower.includes("aluguel") || descLower.includes("condominio") || descLower.includes("condomínio") || 
              descLower.includes("luz") || descLower.includes("agua") || descLower.includes("água") || 
              descLower.includes("energia") || descLower.includes("sabesp") || 
              descLower.includes("enel") || descLower.includes("gás") || descLower.includes("gas") ||
              descLower.includes("iptu") || descLower.includes("reforma")
            ) {
              category = "Moradia";
            } else if (
              descLower.includes("uber") || descLower.includes("combustivel") || descLower.includes("combustível") || 
              descLower.includes("gasolina") || descLower.includes("etanol") || descLower.includes("posto") || 
              descLower.includes("pedagio") || descLower.includes("pedágio") || descLower.includes("taxi") || 
              descLower.includes("táxi") || descLower.includes("metrô") || descLower.includes("metro") || 
              descLower.includes("ônibus") || descLower.includes("onibus") || descLower.includes("ipva") ||
              descLower.includes("mecanico") || descLower.includes("oficina")
            ) {
              category = "Transporte";
            } else if (
              descLower.includes("net") || descLower.includes("vivo") || descLower.includes("claro") || 
              descLower.includes("tim") || descLower.includes("telefone") || descLower.includes("internet") || 
              descLower.includes("tarifa") || descLower.includes("mensalidade") || descLower.includes("banco") || 
              descLower.includes("imposto") || descLower.includes("taxa") || descLower.includes("boleto") ||
              descLower.includes("seguro") || descLower.includes("hospedagem") || descLower.includes("tributo") ||
              descLower.includes("iof") || descLower.includes("juros") || descLower.includes("débito em conta") ||
              descLower.includes("debito em conta") || descLower.includes("pagamento de boleto")
            ) {
              category = "Serviços";
            } else if (
              descLower.includes("netflix") || descLower.includes("spotify") || descLower.includes("cinema") || 
              descLower.includes("show") || descLower.includes("bar") || descLower.includes("cerveja") || 
              descLower.includes("viagem") || descLower.includes("hotel") || descLower.includes("festa") || 
              descLower.includes("ingresso") || descLower.includes("lazer") || descLower.includes("jogos") ||
              descLower.includes("steam") || descLower.includes("shopee") || descLower.includes("amazon") ||
              descLower.includes("aliexpress") || descLower.includes("presente") || descLower.includes("compra") ||
              descLower.includes("deb") || descLower.includes("débito")
            ) {
              category = "Lazer";
            } else if (
              descLower.includes("curso") || descLower.includes("faculdade") || descLower.includes("escola") || 
              descLower.includes("livro") || descLower.includes("udemy") || descLower.includes("mensalidade escolar") ||
              descLower.includes("estudo") || descLower.includes("ingles") || descLower.includes("inglês")
            ) {
              category = "Educação";
            } else if (
              descLower.includes("farmacia") || descLower.includes("drogaria") || descLower.includes("remedio") || 
              descLower.includes("remédio") || descLower.includes("consulta") || descLower.includes("medico") || 
              descLower.includes("médico") || descLower.includes("dentista") || descLower.includes("hospital") || 
              descLower.includes("exame") || descLower.includes("saude") || descLower.includes("saúde")
            ) {
              category = "Saúde";
            }
          }

          matchedRows.push({
            id: `pasted-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            date: `${year}-${month}-${day}`,
            description,
            amount: amountNum,
            type,
            category,
            selected: true
          });
        }
      }
    }

    if (matchedRows.length > 0) {
      setParsedTransactions(matchedRows);
      setImportingState("parsed");
      setPastedText("");
      return;
    }

    // fallback to Gemini if format rules are not exactly matched
    try {
      const response = await fetch("/api/ai/parse-statement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: pastedText
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.details || "Erro desconhecido ao processar o extrato.");
        } else {
          const rawText = await response.text();
          throw new Error(rawText || `Erro do servidor (status ${response.status})`);
        }
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.transactions)) {
        setParsedTransactions(data.transactions);
        setImportingState("parsed");
        setPastedText("");
      } else {
        throw new Error("Resposta de processamento inválida do servidor.");
      }
    } catch (err: any) {
      console.error("Erro no processamento do texto colado:", err);
      alert(`Não foi possível extrair dados do texto: ${err.message}\n\nDica: Se o texto for muito longo, tente copiar e colar em partes menores para evitar limites de processamento do servidor.`);
      setImportingState("idle");
    }
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
      setShowImportModal(false);
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
  const allCategories = Array.from(new Set(data.transactions.map(t => t.category || "Outros")));
  const availableYears = Array.from(new Set(data.transactions.map(t => {
    if (!t.date || typeof t.date !== "string") return new Date().getFullYear().toString();
    return t.date.split("-")[0] || new Date().getFullYear().toString();
  }))).sort().reverse();
  const years = availableYears.length > 0 ? availableYears : [new Date().getFullYear().toString()];
 
  const filteredTransactions = data.transactions.filter(t => {
    // 1. Search Query Match
    const descriptionSafe = (t.description || "").toLowerCase();
    const categorySafe = (t.category || "").toLowerCase();
    const querySafe = (searchQuery || "").toLowerCase();
    const matchesSearch = descriptionSafe.includes(querySafe) || categorySafe.includes(querySafe);
    
    // 2. Type Match
    const matchesType = typeFilter === "all" || t.type === typeFilter;

    // 3. Category Match
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;

    // 4. Month Match
    let matchesMonth = true;
    if (monthFilter !== "all") {
      const parts = (t.date || "").split("-");
      const m = parts[1];
      matchesMonth = m === monthFilter;
    }

    // 5. Year Match
    let matchesYear = true;
    if (yearFilter !== "all") {
      const parts = (t.date || "").split("-");
      const y = parts[0];
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
          <p className="text-xs text-slate-400">Insira suas transações manualmente, edite o histórico ou automatize tudo copiando e colando seu extrato em massa.</p>
        </div>

        {/* Action switch button */}
        <div className="flex bg-[#111111] p-1 border border-white/5 rounded-2xl shrink-0 self-start md:self-auto gap-1">
          <button
            onClick={() => { setShowManualModal(true); setImportSuccessCount(null); }}
            className="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-indigo-600/10 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/10"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            Lançamento Manual ⚡
          </button>
          <button
            onClick={() => { setShowImportModal(true); setImportSuccessCount(null); }}
            className="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-emerald-600/10 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/10"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Importar em Massa ⚡
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
        
        {/* LEFT COLUMN: Launcher Cards */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 text-left shadow-lg space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">Registrar Movimento</span>
              <h3 className="text-base font-bold text-white tracking-tight font-sans">Nova Transação</h3>
              <p className="text-xs text-slate-400 font-sans">Escolha o método ideal para registrar seus fluxos.</p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => setShowManualModal(true)}
                className="w-full p-4 bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/10 hover:border-indigo-500/30 rounded-2xl text-left transition duration-300 hover:shadow-lg hover:shadow-indigo-500/5 group flex items-start gap-3.5 cursor-pointer"
              >
                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition duration-300 shrink-0">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition font-sans">⚡ Lançamento Manual</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-sans">Formulário clássico com o inovador <strong>Lançamento Expresso por Texto</strong>.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="w-full p-4 bg-gradient-to-br from-emerald-950/30 to-slate-900 border border-emerald-500/10 hover:border-emerald-500/30 rounded-2xl text-left transition duration-300 hover:shadow-lg hover:shadow-emerald-500/5 group flex items-start gap-3.5 cursor-pointer"
              >
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition duration-300 shrink-0">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition font-sans">⚡ Importar em Massa</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-sans">Cole a lista de transações do seu extrato para importar dezenas de linhas instantaneamente.</p>
                </div>
              </button>
            </div>
          </div>

          {/* Quick Info widget inside Left column */}
          <div className="p-5 bg-gradient-to-br from-slate-950 to-slate-900/50 border border-white/5 rounded-3xl text-left space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold uppercase tracking-wider font-mono">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> Dica de Produtividade
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              O <strong>Lançamento Expresso</strong> decifra frases inteiras. Digite por exemplo <span className="text-white font-mono bg-white/5 px-1 py-0.5 rounded">"42,90 almoço ifood"</span> ou <span className="text-white font-mono bg-white/5 px-1 py-0.5 rounded">"1200 clt salario"</span> e os campos se preenchem sozinhos na hora!
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Ledger / Statement Review */}
        <div className="lg:col-span-8 space-y-4">
          <AnimatePresence mode="wait">
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
                                    {tx.date && typeof tx.date === "string" && tx.date.includes("-") ? tx.date.split("-").reverse().join("/") : (tx.date || "")}
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

        {/* MANUAL ENTRY MODAL */}
        {showManualModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" id="manual-entry-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111111] border border-white/10 rounded-3xl p-6 max-w-lg w-full text-left space-y-4 shadow-2xl relative overflow-hidden"
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">⚡ Lançamento Expresso ou Manual</span>
                  <h3 className="text-lg font-bold text-white tracking-tight">Novo Lançamento</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lançamento Expresso Quick Input */}
              <div className="bg-[#050505] border border-white/5 rounded-2xl p-4 space-y-2">
                <label className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-widest block">
                  Lançamento Inteligente Expresso ⚡
                </label>
                <div className="relative">
                  <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 animate-pulse" />
                  <input
                    type="text"
                    placeholder="Digite ex: '42,90 almoço ifood' ou '1200 clt salario'"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-xs text-white font-sans"
                    value={quickInputText}
                    onChange={handleQuickInputChange}
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-sans">
                  Nossa inteligência preenche os campos do formulário automaticamente enquanto você digita!
                </p>
              </div>

              {/* Form fields */}
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Tipo */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest block">Tipo</label>
                    <div className="flex bg-[#050505] p-1 border border-white/10 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setType("expense")}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                          type === "expense"
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/20 font-bold"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <ArrowDownRight className="w-3.5 h-3.5" /> Gasto
                      </button>
                      <button
                        type="button"
                        onClick={() => setType("income")}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                          type === "income"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-bold"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" /> Ganho
                      </button>
                    </div>
                  </div>

                  {/* Valor */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest block">Valor (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-xs text-white font-bold font-mono"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>

                {/* Descrição */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest block">Descrição</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Supermercado Pão de Açúcar"
                    className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-xs text-white font-sans"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Categoria */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest block">Categoria</label>
                    <select
                      className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-xs text-white font-sans cursor-pointer"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {type === "income" ? (
                        <>
                          <option value="Salário">Salário / CLT</option>
                          <option value="Investimentos">Rendimentos / Juros</option>
                          <option value="Freelance">Trabalho Extra</option>
                          <option value="Outros">Outros</option>
                        </>
                      ) : (
                        <>
                          <option value="Alimentação">Alimentação</option>
                          <option value="Moradia">Moradia</option>
                          <option value="Transporte">Transporte</option>
                          <option value="Serviços">Serviços</option>
                          <option value="Lazer">Lazer</option>
                          <option value="Educação">Educação</option>
                          <option value="Saúde">Saúde</option>
                          <option value="Outros">Outros</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Conta Origem/Destino */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest block">Conta Associada</label>
                    <select
                      className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-xs text-white font-sans cursor-pointer"
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                    >
                      {data.accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.bankName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Data */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest block">Data do Lançamento</label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-xs text-white font-mono"
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                    />
                  </div>

                  {/* Recorrente */}
                  <div className="flex items-center gap-2 pt-6 pl-1">
                    <input
                      type="checkbox"
                      id="is-recurring-checkbox"
                      className="w-4 h-4 rounded border-white/10 bg-[#050505] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                    />
                    <label htmlFor="is-recurring-checkbox" className="text-xs text-slate-300 font-sans select-none cursor-pointer">
                      Lançamento Fixo Mensal
                    </label>
                  </div>
                </div>

                {/* Submit / Cancel Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase rounded-xl transition cursor-pointer shadow-md shadow-indigo-600/10 text-center"
                  >
                    Salvar Lançamento
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowManualModal(false)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-bold uppercase rounded-xl transition cursor-pointer text-center"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* IMPORT ENTRY MODAL */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" id="import-entry-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111111] border border-white/10 rounded-3xl p-6 max-w-3xl w-full text-left space-y-4 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

              <div className="flex items-center justify-between shrink-0">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">⚡ IMPORTAÇÃO RÁPIDA E AUTOMÁTICA EM MASSA</span>
                  <h3 className="text-lg font-bold text-white tracking-tight">Importar Lançamentos</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportingState("idle");
                    setStatementFile(null);
                    setParsedTransactions([]);
                  }}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {importingState === "idle" && (
                <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                  {/* Explanatory Rule Box */}
                  <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl space-y-2 text-xs text-slate-300">
                    <span className="font-bold text-indigo-400 block font-mono text-[9px] uppercase tracking-wider">📋 REGRA PARA IMPORTAÇÃO EM MASSA (100% GARANTIDO)</span>
                    <p className="font-sans leading-relaxed text-[11px]">
                      Para cadastrar dezenas ou centenas de linhas de uma vez instantaneamente e sem erros, cole o seu extrato seguindo o padrão abaixo (uma transação por linha):
                    </p>
                    <div className="bg-[#050505] p-3 rounded-xl font-mono text-[10px] text-emerald-400 border border-white/5 space-y-1 leading-normal select-all">
                      <div>DD/MM/AAAA Descrição da Transação R$ Valor_Positivo (Ganhos)</div>
                      <div>DD/MM/AAAA Descrição da Transação -R$ Valor_Negativo (Gastos)</div>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">
                      Exemplo: <code className="text-white font-mono font-semibold">05/07/2026 Pix enviado -R$ 2.000,00</code> ou <code className="text-white font-mono font-semibold">06/07/2026 Liquido de vencimento R$ 2.272,16</code>
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest block">Cole aqui o texto do extrato</label>
                    <textarea
                      placeholder="Cole aqui seu extrato completo..."
                      rows={8}
                      className="w-full p-4 bg-[#050505] border border-white/10 rounded-2xl outline-none focus:border-emerald-500 text-xs text-white font-mono leading-relaxed"
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={parsePastedText}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 text-center"
                  >
                    <Sparkles className="w-4 h-4 animate-pulse" /> Extrair Lançamentos Automático ⚡
                  </button>
                </div>
              )}

              {importingState === "parsing" && (
                <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin" />
                    <Sparkles className="w-6 h-6 text-emerald-400 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div className="space-y-1 text-center">
                    <h4 className="text-sm font-bold text-white font-sans">Extraindo lançamentos com IA...</h4>
                    <p className="text-[10px] text-slate-500 font-mono">Nosso cérebro Gemini está organizando e categorizando todas as linhas do extrato.</p>
                  </div>
                </div>
              )}

              {importingState === "parsed" && (
                <div className="flex-1 flex flex-col min-h-0 space-y-4">
                  <div className="flex items-center justify-between shrink-0">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">
                      Revisão dos Lançamentos Identificados ({parsedTransactions.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const allSel = parsedTransactions.every(t => t.selected);
                        setParsedTransactions(parsedTransactions.map(t => ({ ...t, selected: !allSel })));
                      }}
                      className="text-emerald-400 hover:text-emerald-300 text-[10px] font-bold font-mono uppercase tracking-wider cursor-pointer"
                    >
                      {parsedTransactions.every(t => t.selected) ? "Desmarcar Todos" : "Marcar Todos"}
                    </button>
                  </div>

                  {/* Extract ledger list */}
                  <div className="flex-1 overflow-y-auto bg-[#050505] border border-white/10 rounded-2xl p-1 min-h-[200px]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/5 text-slate-500 text-[9px] font-bold uppercase tracking-wider font-mono bg-white/[0.01]">
                          <th className="py-2.5 px-3 w-10 text-center">Sel.</th>
                          <th className="py-2.5 px-3 w-24">Data</th>
                          <th className="py-2.5 px-3">Descrição</th>
                          <th className="py-2.5 px-3 w-28">Categoria</th>
                          <th className="py-2.5 px-3 text-right w-24">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-sans">
                        {parsedTransactions.map((tx, idx) => (
                          <tr key={tx.id || idx} className={`hover:bg-white/[0.02] transition-colors ${tx.selected ? "" : "opacity-40"}`}>
                            <td className="py-2 px-3 text-center">
                              <input
                                type="checkbox"
                                className="w-3.5 h-3.5 rounded border-white/10 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                checked={tx.selected}
                                onChange={(e) => {
                                  setParsedTransactions(parsedTransactions.map((t, i) => i === idx ? { ...t, selected: e.target.checked } : t));
                                }}
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="date"
                                className="bg-[#111111] text-white border border-white/5 rounded px-1.5 py-0.5 text-[10px] font-mono outline-none"
                                value={tx.date}
                                onChange={(e) => {
                                  setParsedTransactions(parsedTransactions.map((t, i) => i === idx ? { ...t, date: e.target.value } : t));
                                }}
                              />
                            </td>
                            <td className="py-2 px-3 font-semibold text-white truncate max-w-[150px]">
                              <input
                                type="text"
                                className="bg-transparent text-white border-none focus:outline-none focus:bg-[#111111] px-1.5 py-0.5 text-[11px] w-full"
                                value={tx.description}
                                onChange={(e) => {
                                  setParsedTransactions(parsedTransactions.map((t, i) => i === idx ? { ...t, description: e.target.value } : t));
                                }}
                              />
                            </td>
                            <td className="py-2 px-3">
                              <select
                                className="bg-[#111111] text-slate-300 border border-white/5 rounded px-1.5 py-0.5 text-[10px] outline-none cursor-pointer"
                                value={tx.category}
                                onChange={(e) => {
                                  setParsedTransactions(parsedTransactions.map((t, i) => i === idx ? { ...t, category: e.target.value } : t));
                                }}
                              >
                                <option value="Salário">Salário</option>
                                <option value="Investimentos">Investimentos</option>
                                <option value="Freelance">Freelance</option>
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
                            <td className={`py-2 px-3 text-right font-bold font-mono text-[11px] ${tx.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                              R$ {tx.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Bulk Save Actions */}
                  <div className="flex items-center gap-3 pt-4 border-t border-white/5 shrink-0">
                    <button
                      type="button"
                      onClick={handleCommitPdfImport}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase rounded-xl transition cursor-pointer shadow-md shadow-emerald-600/10 text-center"
                    >
                      Gravar Lançamentos Selecionados
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setParsedTransactions([]);
                        setImportingState("idle");
                        setStatementFile(null);
                      }}
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-bold uppercase rounded-xl transition cursor-pointer text-center"
                    >
                      Voltar / Descartar
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
