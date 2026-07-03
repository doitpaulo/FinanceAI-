/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowUpRight, ArrowDownRight, Plus, Calendar, DollarSign, 
  Trash2, Filter, ChevronRight, RefreshCw, BarChart2,
  Pencil, Check, X, CreditCard, Droplet, Lightbulb, Wifi, FileText, CheckSquare, Square
} from "lucide-react";
import { ExcelDatabase, Transaction, Expense } from "../types";

interface FluxoProps {
  data: ExcelDatabase;
  onAddTransaction: (tx: Omit<Transaction, "id">) => void;
  onDeleteTransaction?: (id: string) => void;
  onEditTransaction?: (id: string, tx: Partial<Transaction>) => void;
  onAddExpense?: (exp: Omit<Expense, "id">) => void;
  onEditExpense?: (id: string, exp: Partial<Expense>) => void;
  onDeleteExpense?: (id: string) => void;
  onToggleExpensePaid?: (id: string) => void;
}

export default function FluxoFinanceiro({ 
  data, 
  onAddTransaction, 
  onDeleteTransaction,
  onEditTransaction,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onToggleExpensePaid
}: FluxoProps) {
  // Main sub-tab switcher inside the financial flow view
  const [activeSubTab, setActiveSubTab] = useState<"historico" | "contas">("historico");

  // New Transaction Form State
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("Alimentação");
  const [accountId, setAccountId] = useState("acc-1");
  const [isRecurring, setIsRecurring] = useState(false);

  // New Bill/Expense Form State
  const [billName, setBillName] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [billCategory, setBillCategory] = useState("Serviços");
  const [billDueDate, setBillDueDate] = useState("");
  const [billIsFixed, setBillIsFixed] = useState(true);

  // Editing States for Transactions
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editTxDesc, setEditTxDesc] = useState("");
  const [editTxAmount, setEditTxAmount] = useState("");
  const [editTxCategory, setEditTxCategory] = useState("Alimentação");
  const [editTxType, setEditTxType] = useState<"income" | "expense">("expense");
  const [editTxAccountId, setEditTxAccountId] = useState("acc-1");

  // Editing States for Bills/Expenses
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [editBillName, setEditBillName] = useState("");
  const [editBillAmount, setEditBillAmount] = useState("");
  const [editBillCategory, setEditBillCategory] = useState("Serviços");
  const [editBillDueDate, setEditBillDueDate] = useState("");

  // Group calculations
  const totalIncomes = data.transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = data.transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const handleAddTx = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0 || !desc.trim()) return;

    onAddTransaction({
      type,
      amount: amt,
      date: new Date().toISOString().split("T")[0],
      category,
      accountId,
      description: desc,
      isRecurring
    });

    setDesc("");
    setAmount("");
  };

  const handleAddBill = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(billAmount);
    if (isNaN(amt) || amt <= 0 || !billName.trim()) return;

    if (onAddExpense) {
      onAddExpense({
        name: billName,
        category: billCategory,
        amount: amt,
        frequency: "monthly",
        dueDate: billDueDate || new Date().toISOString().split("T")[0],
        isFixed: billIsFixed
      });
    }

    setBillName("");
    setBillAmount("");
    setBillDueDate("");
  };

  const startEditTx = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setEditTxDesc(tx.description);
    setEditTxAmount(tx.amount.toString());
    setEditTxCategory(tx.category);
    setEditTxType(tx.type);
    setEditTxAccountId(tx.accountId);
  };

  const saveEditTx = () => {
    const amt = parseFloat(editTxAmount);
    if (isNaN(amt) || amt <= 0 || !editTxDesc.trim()) return;

    if (onEditTransaction && editingTxId) {
      onEditTransaction(editingTxId, {
        description: editTxDesc,
        amount: amt,
        category: editTxCategory,
        type: editTxType,
        accountId: editTxAccountId
      });
    }
    setEditingTxId(null);
  };

  const startEditBill = (bill: Expense) => {
    setEditingBillId(bill.id);
    setEditBillName(bill.name);
    setEditBillAmount(bill.amount.toString());
    setEditBillCategory(bill.category);
    setEditBillDueDate(bill.dueDate);
  };

  const saveEditBill = () => {
    const amt = parseFloat(editBillAmount);
    if (isNaN(amt) || amt <= 0 || !editBillName.trim()) return;

    if (onEditExpense && editingBillId) {
      onEditExpense(editingBillId, {
        name: editBillName,
        amount: amt,
        category: editBillCategory,
        dueDate: editBillDueDate
      });
    }
    setEditingBillId(null);
  };

  // Icon selector based on bill type
  const getBillIcon = (name: string, cat: string) => {
    const lowerName = name.toLowerCase();
    const lowerCat = cat.toLowerCase();
    if (lowerName.includes("água") || lowerName.includes("agua") || lowerName.includes("saneamento")) {
      return <Droplet className="w-4 h-4 text-sky-400" />;
    }
    if (lowerName.includes("luz") || lowerName.includes("energia") || lowerName.includes("enel") || lowerName.includes("cemig")) {
      return <Lightbulb className="w-4 h-4 text-amber-400" />;
    }
    if (lowerName.includes("internet") || lowerName.includes("wifi") || lowerName.includes("net") || lowerName.includes("claro") || lowerName.includes("fibra")) {
      return <Wifi className="w-4 h-4 text-purple-400" />;
    }
    if (lowerName.includes("cartão") || lowerName.includes("cartao") || lowerName.includes("nubank") || lowerName.includes("crédito") || lowerName.includes("invoice")) {
      return <CreditCard className="w-4 h-4 text-rose-400" />;
    }
    return <FileText className="w-4 h-4 text-indigo-400" />;
  };

  return (
    <div className="space-y-6 animate-fade-in" id="fluxo-view">
      
      {/* Friendly Upper Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-slate-500 text-xs font-bold tracking-widest uppercase block font-mono">Ganhos Totais (Entradas)</span>
            <span className="text-2xl font-display font-bold text-emerald-400">
              R$ {totalIncomes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block">Tudo que você recebeu ou guardou</span>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-slate-500 text-xs font-bold tracking-widest uppercase block font-mono">Gastos Totais (Saídas)</span>
            <span className="text-2xl font-display font-bold text-rose-400">
              R$ {totalExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block">Todas as compras e contas pagas</span>
          </div>
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-slate-500 text-xs font-bold tracking-widest uppercase block font-mono">Sobra Real (Dinheiro Livre)</span>
            <span className={`text-2xl font-display font-bold ${totalIncomes - totalExpenses >= 0 ? "text-indigo-400" : "text-rose-400"}`}>
              R$ {(totalIncomes - totalExpenses).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block">O que restou no seu bolso hoje</span>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
            <RefreshCw className="w-5 h-5 animate-spin-slow" />
          </div>
        </div>
      </div>

      {/* Sub-tab Toggle - SIMPLER LANGUAGE */}
      <div className="flex border-b border-white/10 p-0.5 max-w-lg">
        <button
          onClick={() => setActiveSubTab("historico")}
          className={`flex-1 py-2.5 text-center text-sm font-bold rounded-t-xl transition cursor-pointer ${
            activeSubTab === "historico"
              ? "bg-indigo-600/10 text-indigo-400 border-b-2 border-indigo-500"
              : "text-slate-400 hover:text-white"
          }`}
        >
          📈 Histórico de Ganhos e Gastos
        </button>
        <button
          onClick={() => setActiveSubTab("contas")}
          className={`flex-1 py-2.5 text-center text-sm font-bold rounded-t-xl transition cursor-pointer ${
            activeSubTab === "contas"
              ? "bg-indigo-600/10 text-indigo-400 border-b-2 border-indigo-500"
              : "text-slate-400 hover:text-white"
          }`}
        >
          📅 Contas do Mês (Água, Luz, Cartões etc.)
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === "historico" ? (
          <motion.div 
            key="historico-tab"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Ledger list */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-indigo-400" />
                  Lista de Entradas e Saídas
                </h3>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Organizado por Data</span>
                </div>
              </div>

              <div className="bg-[#111111] border border-white/10 rounded-3xl overflow-hidden p-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-500 text-[10px] font-bold uppercase tracking-wider font-mono">
                        <th className="py-3 px-4">Data</th>
                        <th className="py-3 px-4">Descrição</th>
                        <th className="py-3 px-4">Categoria</th>
                        <th className="py-3 px-4 text-right">Valor</th>
                        <th className="py-3 px-4">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.transactions.slice().reverse().map(tx => (
                        <tr id={`tx-row-${tx.id}`} key={tx.id} className="hover:bg-white/5 transition-colors">
                          {editingTxId === tx.id ? (
                            // Inline Editing Row
                            <>
                              <td className="py-3 px-4">
                                <span className="text-xs text-slate-500">Hoje</span>
                              </td>
                              <td className="py-3 px-4 space-y-1">
                                <input
                                  type="text"
                                  className="px-2 py-1 bg-[#050505] border border-white/25 rounded text-xs text-white outline-none focus:border-indigo-500 w-full"
                                  value={editTxDesc}
                                  onChange={(e) => setEditTxDesc(e.target.value)}
                                />
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => setEditTxType("income")} 
                                    className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${editTxType === "income" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-slate-400"}`}
                                  >
                                    Ganho
                                  </button>
                                  <button 
                                    onClick={() => setEditTxType("expense")} 
                                    className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${editTxType === "expense" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-white/5 text-slate-400"}`}
                                  >
                                    Gasto
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <select
                                  className="px-2 py-1 bg-[#050505] border border-white/25 rounded text-xs text-white outline-none"
                                  value={editTxCategory}
                                  onChange={(e) => setEditTxCategory(e.target.value)}
                                >
                                  <option value="Salário">Salário</option>
                                  <option value="Investimentos">Rendimentos</option>
                                  <option value="Alimentação">Alimentação</option>
                                  <option value="Moradia">Moradia</option>
                                  <option value="Transporte">Transporte</option>
                                  <option value="Serviços">Serviços</option>
                                  <option value="Lazer">Lazer</option>
                                  <option value="Educação">Educação</option>
                                  <option value="Outros">Outros</option>
                                </select>
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="number"
                                  step="0.01"
                                  className="px-2 py-1 bg-[#050505] border border-white/25 rounded text-xs text-white outline-none text-right focus:border-indigo-500 w-24"
                                  value={editTxAmount}
                                  onChange={(e) => setEditTxAmount(e.target.value)}
                                />
                              </td>
                              <td className="py-3 px-4 flex justify-end gap-1.5 mt-2">
                                <button
                                  onClick={saveEditTx}
                                  className="text-emerald-400 hover:text-emerald-300 p-1 bg-emerald-500/10 border border-emerald-500/20 rounded transition"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingTxId(null)}
                                  className="text-rose-400 hover:text-rose-300 p-1 bg-rose-500/10 border border-rose-500/20 rounded transition"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </>
                          ) : (
                            // Normal Row Display
                            <>
                              <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                                {tx.date.split("-").reverse().join("/")}
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-white">
                                {tx.description}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="px-2.5 py-0.5 bg-white/5 border border-white/10 text-slate-300 text-xs rounded-full font-medium">
                                  {tx.category}
                                </span>
                              </td>
                              <td className={`py-3.5 px-4 text-right font-bold font-mono ${tx.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                                {tx.type === "income" ? "+" : "-"} R$ {tx.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-3.5 px-4 text-right flex justify-end gap-1">
                                {onEditTransaction && (
                                  <button
                                    onClick={() => startEditTx(tx)}
                                    className="text-slate-500 hover:text-indigo-400 transition-colors p-1"
                                    title="Editar"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {onDeleteTransaction && (
                                  <button
                                    id={`delete-tx-${tx.id}`}
                                    onClick={() => onDeleteTransaction(tx.id)}
                                    className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Add Transaction form */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Registrar Novo Ganho/Gasto</h3>
              
              <form onSubmit={handleAddTx} className="bg-[#111111] border border-white/10 rounded-3xl p-6 space-y-4" id="transaction-add-form">
                
                <div className="space-y-2">
                  <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Tipo de Registro</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id="type-btn-income"
                      type="button"
                      onClick={() => setType("income")}
                      className={`py-2 px-3 text-sm font-semibold rounded-xl border transition cursor-pointer ${
                        type === "income"
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold"
                          : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      Ganho (Renda)
                    </button>
                    <button
                      id="type-btn-expense"
                      type="button"
                      onClick={() => setType("expense")}
                      className={`py-2 px-3 text-sm font-semibold rounded-xl border transition cursor-pointer ${
                        type === "expense"
                          ? "border-rose-500/40 bg-rose-500/10 text-rose-400 font-bold"
                          : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      Gasto (Despesa)
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">O que foi? (Descrição)</label>
                  <input
                    id="tx-desc-input"
                    type="text"
                    placeholder="Ex: Supermercado do mês"
                    className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm font-sans text-white transition"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Valor (R$)</label>
                  <input
                    id="tx-amount-input"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm font-mono text-white transition"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Categoria</label>
                  <select
                    id="tx-category-select"
                    className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm text-white transition"
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
                        <option value="Outros">Outros Gastos</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Onde guardar/retirar</label>
                  <select
                    id="tx-account-select"
                    className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm text-white transition"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                  >
                    {data.accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} (R$ {acc.balance.toLocaleString("pt-BR")})</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    id="tx-recurring-check"
                    type="checkbox"
                    className="w-4 h-4 rounded border-white/10 text-indigo-500 focus:ring-indigo-500 bg-[#050505]"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                  />
                  <label htmlFor="tx-recurring-check" className="text-xs text-slate-400 cursor-pointer select-none">
                    Repetir todo mês automaticamente
                  </label>
                </div>

                <button
                  id="tx-submit-button"
                  type="submit"
                  className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl text-sm transition cursor-pointer"
                >
                  Registrar Ganho ou Gasto
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="contas-tab"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Registered Bills Organizer List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  Minhas Contas Mensais Registradas
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  Total de Contas: {(data.expenses || []).length}
                </span>
              </div>

              <div className="space-y-3">
                {(data.expenses || []).length === 0 ? (
                  <div className="bg-[#111111] border border-dashed border-white/10 rounded-3xl p-8 text-center text-slate-500 text-sm">
                    Nenhuma conta cadastrada ainda. Cadastre suas contas de água, luz, cartões ao lado!
                  </div>
                ) : (
                  (data.expenses || []).map(bill => (
                    <div 
                      key={bill.id} 
                      className={`bg-[#111111] border rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                        bill.paid 
                          ? "border-emerald-500/25 bg-emerald-950/5 text-slate-400" 
                          : "border-white/10 hover:border-white/20 text-white"
                      }`}
                    >
                      {editingBillId === bill.id ? (
                        // Edit form for bill
                        <div className="w-full space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <input
                              type="text"
                              className="px-2 py-1.5 bg-[#050505] border border-white/25 rounded-xl text-xs text-white"
                              value={editBillName}
                              placeholder="Nome da Conta"
                              onChange={(e) => setEditBillName(e.target.value)}
                            />
                            <input
                              type="number"
                              className="px-2 py-1.5 bg-[#050505] border border-white/25 rounded-xl text-xs text-white"
                              value={editBillAmount}
                              placeholder="Valor"
                              onChange={(e) => setEditBillAmount(e.target.value)}
                            />
                            <input
                              type="date"
                              className="px-2 py-1.5 bg-[#050505] border border-white/25 rounded-xl text-xs text-white"
                              value={editBillDueDate}
                              onChange={(e) => setEditBillDueDate(e.target.value)}
                            />
                            <select
                              className="px-2 py-1.5 bg-[#050505] border border-white/25 rounded-xl text-xs text-white"
                              value={editBillCategory}
                              onChange={(e) => setEditBillCategory(e.target.value)}
                            >
                              <option value="Serviços">Serviços / Contas</option>
                              <option value="Moradia">Moradia</option>
                              <option value="Alimentação">Alimentação</option>
                              <option value="Lazer">Lazer</option>
                              <option value="Outros">Outros</option>
                            </select>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={saveEditBill}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition"
                            >
                              <Check className="w-3.5 h-3.5" /> Salvar
                            </button>
                            <button
                              onClick={() => setEditingBillId(null)}
                              className="px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-lg flex items-center gap-1 transition"
                            >
                              <X className="w-3.5 h-3.5" /> Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Normal display of bill
                        <>
                          <div className="flex items-center gap-3.5">
                            <div className={`p-3 rounded-2xl ${bill.paid ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-slate-200"}`}>
                              {getBillIcon(bill.name, bill.category)}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className={`text-sm font-bold ${bill.paid ? "line-through text-slate-500" : "text-white"}`}>
                                  {bill.name}
                                </h4>
                                <span className="px-2 py-0.5 bg-white/5 border border-white/5 text-[10px] rounded-md text-slate-400">
                                  {bill.category}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 font-mono">
                                Vence dia: {bill.dueDate.split("-").reverse().join("/")}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 justify-between md:justify-end">
                            <div className="text-right">
                              <div className={`text-base font-bold font-mono ${bill.paid ? "text-slate-500" : "text-slate-100"}`}>
                                R$ {bill.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </div>
                              <span className={`text-[10px] font-bold ${bill.paid ? "text-emerald-400" : "text-amber-500"}`}>
                                {bill.paid ? "✓ Pago" : "● Pendente"}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {onToggleExpensePaid && (
                                <button
                                  onClick={() => onToggleExpensePaid(bill.id)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                    bill.paid 
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20" 
                                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                  }`}
                                  title={bill.paid ? "Marcar como Pendente" : "Marcar como Pago"}
                                >
                                  {bill.paid ? (
                                    <>
                                      <CheckSquare className="w-4 h-4" /> Paid
                                    </>
                                  ) : (
                                    <>
                                      <Square className="w-4 h-4" /> Pagar
                                    </>
                                  )}
                                </button>
                              )}

                              {onEditExpense && (
                                <button
                                  onClick={() => startEditBill(bill)}
                                  className="text-slate-500 hover:text-white p-2 hover:bg-white/5 rounded-xl transition"
                                  title="Editar"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              )}

                              {onDeleteExpense && (
                                <button
                                  onClick={() => onDeleteExpense(bill.id)}
                                  className="text-slate-500 hover:text-rose-400 p-2 hover:bg-white/5 rounded-xl transition"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    ))
                  )}
              </div>
            </div>

            {/* Register a new bill form */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Registrar Nova Conta / Vencimento</h3>
              
              <form onSubmit={handleAddBill} className="bg-[#111111] border border-white/10 rounded-3xl p-6 space-y-4" id="bill-add-form">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cadastre suas contas de consumo recorrentes como água, energia, aluguel ou a data do fechamento do cartão de crédito para nunca se esquecer de pagar!
                </p>

                <div className="space-y-1">
                  <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Qual é a conta? (Nome)</label>
                  <input
                    type="text"
                    placeholder="Ex: Conta de Luz Enel ou Fatura Nubank"
                    className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm text-white transition"
                    value={billName}
                    onChange={(e) => setBillName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Valor Estimado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm text-white font-mono transition"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Vencimento (Data Limite)</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm text-white transition"
                    value={billDueDate}
                    onChange={(e) => setBillDueDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">Categoria da Conta</label>
                  <select
                    className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-sm text-white transition"
                    value={billCategory}
                    onChange={(e) => setBillCategory(e.target.value)}
                  >
                    <option value="Serviços">Serviços / Contas de Consumo</option>
                    <option value="Moradia">Moradia / Aluguel / Condomínio</option>
                    <option value="Lazer">Lazer / Assinaturas / Netflix</option>
                    <option value="Transporte">Transporte / Seguro / Combustível</option>
                    <option value="Outros">Outras Contas</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    id="bill-recurring-check"
                    type="checkbox"
                    className="w-4 h-4 rounded border-white/10 text-indigo-500 focus:ring-indigo-500 bg-[#050505]"
                    checked={billIsFixed}
                    onChange={(e) => setBillIsFixed(e.target.checked)}
                  />
                  <label htmlFor="bill-recurring-check" className="text-xs text-slate-400 cursor-pointer select-none">
                    Essa conta vence todo mês
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl text-sm transition cursor-pointer"
                >
                  Registrar Vencimento
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
